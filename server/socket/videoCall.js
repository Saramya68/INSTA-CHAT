// ==================================================================================
// FILE: server/socket/videoCall.js
// PURPOSE: Dedicated WebRTC Signaling Server Handler with Persistent Call History Database Integration
// 
// INTERVIEW KEY CONCEPTS & ARCHITECTURAL DECISIONS:
// 
// 1. NON-BLOCKING DB INTEGRATION:
//    - WebRTC signaling events require microsecond-level latency. Database updates 
//      (Call.create, Call.findOneAndUpdate) are executed asynchronously with error logging
//      so that network latency or database bottlenecks never delay WebRTC signaling packets.
// 
// 2. LIFECYCLE DATABASE HOOKS:
//    - call-user: Creates Call document with status "RINGING".
//    - call-accepted: Updates status to "CONNECTED" and sets startedAt timestamp.
//    - call-rejected: Updates status to "REJECTED" and sets endedAt timestamp.
//    - end-call: Calculates duration in seconds, updates status to "COMPLETED".
//    - Ringing Timeout (30s): Updates status to "MISSED".
//    - Socket Disconnect: Resolves active call to "COMPLETED" or "FAILED".
// ==================================================================================

import Call from "../models/Call.js";

// In-memory store for active call sessions
// Key: callId (string)
// Value: { callId, callerId, callerSocketId, receiverId, receiverSocketId, status, startedAt, timeout, createdAt }
const activeCalls = new Map();

/**
 * Helper to find active call by user ID
 */
export const findCallByUserId = (userId) => {
  if (!userId) return null;
  for (const call of activeCalls.values()) {
    if (call.callerId === userId || call.receiverId === userId) {
      return call;
    }
  }
  return null;
};

/**
 * Helper to cleanup call resources and persist final state to MongoDB
 */
const endAndCleanupCall = async (io, callId, reason, initiatedBySocketId = null) => {
  const call = activeCalls.get(callId);
  if (!call) return;

  // Clear ringing timeout timer if active
  if (call.timeout) {
    clearTimeout(call.timeout);
  }

  // Find socket IDs of participants excluding the one who initiated termination
  const targets = [call.callerSocketId, call.receiverSocketId].filter(
    (socketId) => socketId && socketId !== initiatedBySocketId
  );

  // Notify peer(s) that call has ended
  targets.forEach((socketId) => {
    io.to(socketId).emit("call-ended", { callId, reason });
  });

  // Calculate call duration and determine final DB status
  const endedAt = new Date();
  let finalStatus = "COMPLETED";
  let duration = 0;

  if (call.status === "CONNECTED" && call.startedAt) {
    duration = Math.max(0, Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000));
    finalStatus = "COMPLETED";
  } else if (call.status === "RINGING") {
    finalStatus = reason === "peer_disconnected" ? "FAILED" : "MISSED";
  } else if (call.status === "ACCEPTED") {
    finalStatus = "COMPLETED";
  }

  // Asynchronously update MongoDB Call document
  try {
    await Call.findOneAndUpdate(
      { callId },
      {
        status: finalStatus,
        endedAt,
        duration,
      }
    );
  } catch (err) {
    console.error("DB Error on Call Cleanup:", err.message);
  }

  // Remove session from memory
  activeCalls.delete(callId);
};

export default function setupVideoCallSocket(io, socket, userSocketMap) {
  const userId = socket.handshake.query.userId || socket.userId;
  socket.userId = userId;

  // ================================================================================
  // EVENT 1: INITIATE CALL (Invitation Phase)
  // Payload: { callId, userToCall, callerInfo }
  // ================================================================================
  socket.on("call-user", async ({ callId, userToCall, callerInfo }) => {
    if (!callId || !userToCall) {
      return socket.emit("call-rejected", {
        callId,
        reason: "invalid_request",
      });
    }

    // Guard 1: Prevent caller from starting multiple calls
    if (findCallByUserId(socket.userId)) {
      return socket.emit("call-rejected", {
        callId,
        reason: "caller_already_in_call",
      });
    }

    const receiverSocketId = userSocketMap[userToCall];

    // Guard 2: Check if target user is currently connected to Socket.IO
    if (!receiverSocketId) {
      // Record missed/offline call in DB
      try {
        await Call.create({
          callerId: socket.userId,
          receiverId: userToCall,
          callId,
          type: "VIDEO",
          status: "MISSED",
          endedAt: new Date(),
        });
      } catch (err) {
        console.error("DB Error creating offline call:", err.message);
      }

      return socket.emit("call-rejected", {
        callId,
        reason: "user_offline",
      });
    }

    // Guard 3: Check if target user is busy in another active call
    if (findCallByUserId(userToCall)) {
      try {
        await Call.create({
          callerId: socket.userId,
          receiverId: userToCall,
          callId,
          type: "VIDEO",
          status: "REJECTED",
          endedAt: new Date(),
        });
      } catch (err) {
        console.error("DB Error creating busy call record:", err.message);
      }

      return socket.emit("call-rejected", {
        callId,
        reason: "user_busy",
      });
    }

    // 1. Persistent DB Record Creation (Status: RINGING)
    try {
      await Call.create({
        callerId: socket.userId,
        receiverId: userToCall,
        callId,
        type: "VIDEO",
        status: "RINGING",
      });
    } catch (err) {
      console.error("DB Error creating call document:", err.message);
    }

    // 2. 30-Second Timeout for Unanswered Calls
    const ringingTimeout = setTimeout(async () => {
      if (activeCalls.has(callId)) {
        const currentCall = activeCalls.get(callId);
        if (currentCall.status === "RINGING") {
          io.to(currentCall.callerSocketId).emit("call-rejected", {
            callId,
            reason: "no_answer",
          });
          io.to(currentCall.receiverSocketId).emit("call-ended", {
            callId,
            reason: "missed_call",
          });

          // Update MongoDB status to MISSED
          try {
            await Call.findOneAndUpdate(
              { callId, status: "RINGING" },
              { status: "MISSED", endedAt: new Date(), duration: 0 }
            );
          } catch (err) {
            console.error("DB Error updating missed call:", err.message);
          }

          activeCalls.delete(callId);
        }
      }
    }, 30000);

    // Store in-memory session details
    const callRecord = {
      callId,
      callerId: socket.userId,
      callerSocketId: socket.id,
      receiverId: userToCall,
      receiverSocketId,
      status: "RINGING",
      startedAt: null,
      createdAt: Date.now(),
      timeout: ringingTimeout,
    };

    activeCalls.set(callId, callRecord);

    // Forward incoming call notification to receiver
    io.to(receiverSocketId).emit("incoming-call", {
      callId,
      from: socket.userId,
      callerInfo,
    });
  });

  // ================================================================================
  // EVENT 2: ACCEPT CALL (Receiver accepted the invitation)
  // Payload: { callId }
  // ================================================================================
  socket.on("call-accepted", async ({ callId }) => {
    const call = activeCalls.get(callId);

    if (!call || call.status !== "RINGING") {
      return socket.emit("call-ended", {
        callId,
        reason: "stale_call",
      });
    }

    if (call.receiverId !== socket.userId && call.receiverSocketId !== socket.id) {
      return socket.emit("call-ended", {
        callId,
        reason: "unauthorized",
      });
    }

    // Clear ringing timeout
    if (call.timeout) {
      clearTimeout(call.timeout);
      call.timeout = null;
    }

    const now = new Date();
    call.status = "CONNECTED";
    call.startedAt = now;

    // Update MongoDB status to CONNECTED & set startedAt timestamp
    try {
      await Call.findOneAndUpdate(
        { callId },
        { status: "CONNECTED", startedAt: now }
      );
    } catch (err) {
      console.error("DB Error updating accepted call:", err.message);
    }

    // Notify caller that receiver accepted
    io.to(call.callerSocketId).emit("call-accepted", { callId });
  });

  // ================================================================================
  // EVENT 3: REJECT CALL (Receiver declined the call)
  // Payload: { callId, reason }
  // ================================================================================
  socket.on("call-rejected", async ({ callId, reason }) => {
    const call = activeCalls.get(callId);

    if (call) {
      if (call.timeout) clearTimeout(call.timeout);
      io.to(call.callerSocketId).emit("call-rejected", {
        callId,
        reason: reason || "declined",
      });

      // Update MongoDB status to REJECTED
      try {
        await Call.findOneAndUpdate(
          { callId },
          { status: "REJECTED", endedAt: new Date(), duration: 0 }
        );
      } catch (err) {
        console.error("DB Error updating rejected call:", err.message);
      }

      activeCalls.delete(callId);
    }
  });

  // ================================================================================
  // EVENT 4: WEBRTC OFFER
  // Payload: { callId, to, offer }
  // ================================================================================
  socket.on("offer", ({ callId, to, offer }) => {
    const call = activeCalls.get(callId);
    if (!call) {
      return socket.emit("call-ended", { callId, reason: "call_not_found" });
    }

    const targetSocketId = userSocketMap[to] || (to === call.receiverId ? call.receiverSocketId : call.callerSocketId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("offer", {
        callId,
        from: socket.userId,
        offer,
      });
    }
  });

  // ================================================================================
  // EVENT 5: WEBRTC ANSWER
  // Payload: { callId, to, answer }
  // ================================================================================
  socket.on("answer", ({ callId, to, answer }) => {
    const call = activeCalls.get(callId);
    if (!call) {
      return socket.emit("call-ended", { callId, reason: "call_not_found" });
    }

    const targetSocketId = userSocketMap[to] || (to === call.callerId ? call.callerSocketId : call.receiverSocketId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("answer", {
        callId,
        from: socket.userId,
        answer,
      });
    }
  });

  // ================================================================================
  // EVENT 6: ICE CANDIDATE
  // Payload: { callId, to, candidate }
  // ================================================================================
  socket.on("ice-candidate", ({ callId, to, candidate }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    const targetSocketId = userSocketMap[to] || (to === call.receiverId ? call.receiverSocketId : call.callerSocketId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", {
        callId,
        from: socket.userId,
        candidate,
      });
    }
  });

  // ================================================================================
  // EVENT 7: END CALL (Explicit user hang up)
  // Payload: { callId, reason }
  // ================================================================================
  socket.on("end-call", async ({ callId, reason }) => {
    if (callId && activeCalls.has(callId)) {
      await endAndCleanupCall(io, callId, reason || "user_hung_up", socket.id);
    } else {
      const call = findCallByUserId(socket.userId);
      if (call) {
        await endAndCleanupCall(io, call.callId, reason || "user_hung_up", socket.id);
      }
    }
  });

  // ================================================================================
  // EVENT 8: DISCONNECT (Unexpected tab close or network drop)
  // ================================================================================
  socket.on("disconnect", async () => {
    for (const [callId, call] of activeCalls.entries()) {
      if (
        call.callerSocketId === socket.id ||
        call.receiverSocketId === socket.id ||
        call.callerId === socket.userId ||
        call.receiverId === socket.userId
      ) {
        await endAndCleanupCall(io, callId, "peer_disconnected", socket.id);
      }
    }
  });
}

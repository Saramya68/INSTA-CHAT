// ==================================================================================
// FILE: client/context/VideoCallContext.jsx
// PURPOSE: React Context Provider for WebRTC Video Call State & Media Control Machine
// 
// INTERVIEW KEY CONCEPTS:
// 
// 1. STATE MACHINE DESIGN:
//    - IDLE: No active or pending call.
//    - CALLING: Outgoing call initiated by local user, waiting for receiver to accept/reject.
//    - RINGING: Incoming call popup active, waiting for local user to accept/decline.
//    - CONNECTED: WebRTC SDP & ICE exchange complete, media streaming live.
//    - ENDED: Call finished, performing resource teardown before returning to IDLE.
// 
// 2. WHY USE useRef (callStateRef, callDataRef) ALONGSIDE useState?
//    - React Stale Closure Problem: Socket.IO event listeners attached inside useEffect closed over 
//      the state value at creation time. If state changes, async socket callbacks might read stale state values!
//    - Using callStateRef.current inside socket handlers ensures we ALWAYS read the latest real-time state value.
// 
// 3. WHY STOP MEDIA TRACKS (stream.getTracks().forEach(track => track.stop()))?
//    - Hardware Access Release: Merely unmounting a <video> element does NOT release camera or microphone hardware.
//    - The browser green recording light stays on unless track.stop() is explicitly called on every track!
// 
// 4. WHY CLEAN UP SOCKET LISTENERS (socket.off(...)) IN useEffect RETURN?
//    - Prevents Duplicate Event Execution & Memory Leaks: If a component re-renders or socket updates, 
//      old listeners remain active unless explicitly removed with socket.off().
// ==================================================================================

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import { PeerConnectionManager } from "../src/utils/peerConnection";

export const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
  const { socket, authUser } = useContext(AuthContext);

  // Call State Machine: 'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED' | 'ENDED'
  const [callState, setCallState] = useState("IDLE");

  // Active call details: { callId, peerUser, isCaller }
  const [callData, setCallData] = useState(null);

  // Media Streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Audio / Video control toggles
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Call duration counter in seconds
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  // WebRTC Peer Connection Manager reference
  const peerManagerRef = useRef(null);

  // INTERVIEW POINT: Refs to prevent stale closures in async socket callbacks
  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const callDataRef = useRef(callData);
  useEffect(() => {
    callDataRef.current = callData;
  }, [callData]);

  /**
   * INTERVIEW QUESTION: How do you perform complete resource cleanup on call termination?
   * ANSWER: Stop all media tracks, close RTCPeerConnection, clear call timers, reset local states.
   */
  const cleanupCall = (newState = "IDLE") => {
    // 1. Clear call duration timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);

    // 2. Stop camera and microphone tracks to release hardware
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // 3. Close WebRTC peer connection
    if (peerManagerRef.current) {
      peerManagerRef.current.close();
      peerManagerRef.current = null;
    }

    // 4. Reset state variables
    setRemoteStream(null);
    setIsMicMuted(false);
    setIsVideoOff(false);
    setCallData(null);
    setCallState(newState);

    if (newState === "ENDED") {
      setTimeout(() => {
        setCallState("IDLE");
      }, 1500);
    }
  };

  /**
   * Requests browser camera and microphone permissions via HTML5 MediaDevices API
   */
  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Camera/Mic Permission Error:", error);
      toast.error("Failed to access Camera & Microphone permissions");
      throw error;
    }
  };

  // ================================================================================
  // ACTION 1: INITIATE CALL (Caller starts invitation)
  // ================================================================================
  const initiateCall = async (targetUser) => {
    if (!socket || !authUser || !targetUser) return;
    if (callState !== "IDLE") {
      toast.error("You are already in a call");
      return;
    }

    try {
      const stream = await getMediaStream();
      const newCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newCallData = {
        callId: newCallId,
        peerUser: targetUser,
        isCaller: true,
      };

      setCallData(newCallData);
      setCallState("CALLING");

      // Emit invitation to backend socket
      socket.emit("call-user", {
        callId: newCallId,
        userToCall: targetUser._id,
        callerInfo: {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic,
        },
      });
    } catch (err) {
      cleanupCall();
    }
  };

  // ================================================================================
  // ACTION 2: ACCEPT CALL (Receiver accepts incoming invitation)
  // ================================================================================
  const acceptCall = async () => {
    if (!socket || !callData || callState !== "RINGING") return;

    try {
      const stream = await getMediaStream();
      setCallState("CONNECTED");

      socket.emit("call-accepted", {
        callId: callData.callId,
      });
    } catch (err) {
      rejectCall("permission_denied");
    }
  };

  // ================================================================================
  // ACTION 3: REJECT CALL (Receiver declines call)
  // ================================================================================
  const rejectCall = (reason = "declined") => {
    if (socket && callData) {
      socket.emit("call-rejected", {
        callId: callData.callId,
        reason,
      });
    }
    cleanupCall();
  };

  // ================================================================================
  // ACTION 4: END CALL (Either participant hangs up)
  // ================================================================================
  const endCall = () => {
    if (socket && callData) {
      socket.emit("end-call", {
        callId: callData.callId,
        reason: "user_hung_up",
      });
    }
    cleanupCall("ENDED");
  };

  // Mute / Unmute Microphone Track
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  // Turn Camera On / Off
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Helper to start timer once remote video track connects
  const startTimer = () => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  /**
   * Instantiates PeerConnectionManager and hooks remote stream callbacks
   */
  const setupPeerConnection = (stream, currentCallData) => {
    if (peerManagerRef.current) {
      peerManagerRef.current.close();
    }

    const peerManager = new PeerConnectionManager({
      onIceCandidate: (candidate) => {
        if (socket && currentCallData) {
          socket.emit("ice-candidate", {
            callId: currentCallData.callId,
            to: currentCallData.peerUser._id,
            candidate,
          });
        }
      },
      onTrack: (remoteMediaStream) => {
        setRemoteStream(remoteMediaStream);
        startTimer();
      },
      onConnectionStateChange: (state) => {
        if (state === "failed" || state === "closed") {
          toast.error("Video call connection lost");
          cleanupCall("ENDED");
        }
      },
    });

    peerManager.addLocalStream(stream);
    peerManagerRef.current = peerManager;
    return peerManager;
  };

  // ================================================================================
  // SOCKET SIGNALLING LISTENERS & CLEANUP HOOK
  // ================================================================================
  useEffect(() => {
    if (!socket) return;

    // 1. Receiver gets incoming call event
    const handleIncomingCall = ({ callId, from, callerInfo }) => {
      if (callStateRef.current !== "IDLE") {
        socket.emit("call-rejected", { callId, reason: "user_busy" });
        return;
      }

      setCallData({
        callId,
        peerUser: callerInfo,
        isCaller: false,
      });
      setCallState("RINGING");
    };

    // 2. Caller receives call-accepted -> generates WebRTC SDP offer
    const handleCallAccepted = async ({ callId }) => {
      if (callStateRef.current !== "CALLING" || !callDataRef.current) return;
      setCallState("CONNECTED");

      const peerManager = setupPeerConnection(localStream, callDataRef.current);
      const offer = await peerManager.createOffer();

      socket.emit("offer", {
        callId,
        to: callDataRef.current.peerUser._id,
        offer,
      });
    };

    // 3. Caller receives call-rejected
    const handleCallRejected = ({ callId, reason }) => {
      const reasonMessages = {
        user_busy: "User is busy on another call",
        user_offline: "User is currently offline",
        no_answer: "No answer from user",
        declined: "Call was declined",
      };
      toast.error(reasonMessages[reason] || "Call declined");
      cleanupCall("ENDED");
    };

    // 4. Receiver receives SDP offer -> sets remote description & sends SDP answer
    const handleOffer = async ({ callId, from, offer }) => {
      if (!callDataRef.current || callDataRef.current.callId !== callId) return;

      const peerManager = setupPeerConnection(localStream, callDataRef.current);
      await peerManager.setRemoteDescription(offer);
      const answer = await peerManager.createAnswer();

      socket.emit("answer", {
        callId,
        to: from,
        answer,
      });
    };

    // 5. Caller receives SDP answer -> sets remote description
    const handleAnswer = async ({ callId, answer }) => {
      if (!callDataRef.current || callDataRef.current.callId !== callId) return;
      if (peerManagerRef.current) {
        await peerManagerRef.current.setRemoteDescription(answer);
      }
    };

    // 6. Receive ICE candidate -> add candidate to peerManager
    const handleIceCandidate = async ({ callId, candidate }) => {
      if (!callDataRef.current || callDataRef.current.callId !== callId) return;
      if (peerManagerRef.current) {
        await peerManagerRef.current.addIceCandidate(candidate);
      }
    };

    // 7. Receive call-ended event
    const handleCallEnded = ({ callId, reason }) => {
      const reasonTexts = {
        user_hung_up: "Call ended by user",
        peer_disconnected: "Peer disconnected",
        stale_call: "Call session expired",
      };
      if (reasonTexts[reason]) {
        toast(reasonTexts[reason], { icon: "ℹ️" });
      }
      cleanupCall("ENDED");
    };

    // 8. Handle socket connection loss during an active call
    const handleDisconnect = () => {
      if (callStateRef.current !== "IDLE") {
        cleanupCall("ENDED");
      }
    };

    // Attach listeners
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("disconnect", handleDisconnect);

    // INTERVIEW POINT: Listener cleanup on unmount or socket instance change
    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, localStream]);

  const value = {
    callState,
    callData,
    localStream,
    remoteStream,
    isMicMuted,
    isVideoOff,
    callDuration,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};

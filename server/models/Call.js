// ==================================================================================
// FILE: server/models/Call.js
// PURPOSE: Persistent MongoDB Schema for 1-on-1 Audio/Video Call History
// 
// INTERVIEW / ARCHITECTURAL NOTES:
// 1. INDEXING: Indexes on callerId, receiverId, and callId optimize query performance 
//    for history fetching and real-time call updates.
// 2. REFERENCES: Points to the 'user' model matching User.js exports.
// ==================================================================================

import mongoose from "mongoose";

const CallSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["VIDEO", "AUDIO"],
      default: "VIDEO",
    },
    status: {
      type: String,
      enum: [
        "RINGING",
        "CONNECTED",
        "COMPLETED",
        "MISSED",
        "REJECTED",
        "FAILED",
      ],
      default: "RINGING",
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for fast history lookup and callId searching
CallSchema.index({ callerId: 1, createdAt: -1 });
CallSchema.index({ receiverId: 1, createdAt: -1 });

const Call = mongoose.model("Call", CallSchema);

export default Call;

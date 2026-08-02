// ==================================================================================
// FILE: server/controllers/callController.js
// PURPOSE: Controller logic for Call History REST Endpoints
// ==================================================================================

import Call from "../models/Call.js";

/**
 * Controller to fetch authenticated user's call history (Incoming & Outgoing)
 * Route: GET /api/calls/history
 * Access: Protected (Requires JWT Auth Header)
 */
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch calls where current user is either caller or receiver
    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("callerId", "fullName profilePic email bio")
      .populate("receiverId", "fullName profilePic email bio");

    res.json({
      success: true,
      calls,
    });
  } catch (error) {
    console.error("Error fetching call history:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

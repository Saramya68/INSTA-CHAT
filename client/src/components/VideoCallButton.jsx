// ==================================================================================
// FILE: client/src/components/VideoCallButton.jsx
// PURPOSE: Chat Header Trigger Button for Initiating 1-on-1 WebRTC Video Calls
// 
// INTERVIEW KEY CONCEPTS:
// 1. CONDITIONAL DISABLING:
//    - Button is disabled if target user is offline (onlineUsers check) or if local user 
//      is already engaged in another call (callState !== 'IDLE').
// 2. ACCESSIBILITY & TOOLTIPS:
//    - Dynamic hover title explains why the button is active or disabled to the user.
// ==================================================================================

import React, { useContext } from "react";
import { VideoCallContext } from "../../context/VideoCallContext";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const VideoCallButton = () => {
  const { initiateCall, callState } = useContext(VideoCallContext);
  const { selectedUser } = useContext(ChatContext);
  const { onlineUsers } = useContext(AuthContext);

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);
  const isCallDisabled = !isOnline || callState !== "IDLE";

  return (
    <button
      onClick={() => initiateCall(selectedUser)}
      disabled={isCallDisabled}
      title={
        !isOnline
          ? "User is offline"
          : callState !== "IDLE"
          ? "Call in progress"
          : `Video call ${selectedUser.fullName}`
      }
      className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
        isCallDisabled
          ? "opacity-40 cursor-not-allowed text-gray-400"
          : "hover:bg-violet-600/20 text-violet-500 hover:text-violet-600 cursor-pointer"
      }`}
    >
      {/* Video Camera SVG Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-4.19-2.793V8.043l4.19-2.793a.75.75 0 011.06.672v12.156a.75.75 0 01-1.06.672z" />
      </svg>
    </button>
  );
};

export default VideoCallButton;

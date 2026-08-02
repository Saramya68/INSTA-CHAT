// ==================================================================================
// FILE: client/src/components/IncomingCallModal.jsx
// PURPOSE: Incoming Call Notification Popup Modal
// 
// INTERVIEW KEY CONCEPTS:
// 1. STATE-DRIVEN RENDERING:
//    - Rendered conditionally only when callState === 'RINGING' and callData exists.
// 2. EXPLICIT ACCEPT / DECLINE ACTIONS:
//    - Accept triggers getUserMedia() and emits 'call-accepted' via Socket.IO.
//    - Decline emits 'call-rejected' via Socket.IO and resets context call state to IDLE.
// ==================================================================================

import React, { useContext } from "react";
import { VideoCallContext } from "../../context/VideoCallContext";
import assets from "../assets/assets";

const IncomingCallModal = () => {
  const { callState, callData, acceptCall, rejectCall } = useContext(VideoCallContext);

  if (callState !== "RINGING" || !callData) return null;

  const { peerUser } = callData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center text-center space-y-5">
        
        {/* Caller Avatar */}
        <div className="relative">
          <img
            src={peerUser?.profilePic || assets.avatar_icon}
            alt={peerUser?.fullName}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-violet-500 animate-pulse"
          />
          <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-slate-900"></div>
        </div>

        {/* Caller Information */}
        <div>
          <h3 className="text-xl font-bold">{peerUser?.fullName || "Incoming Call"}</h3>
          <p className="text-sm text-slate-400 mt-1 animate-bounce">
            Incoming Video Call...
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 w-full pt-2">
          {/* Decline Button */}
          <button
            onClick={() => rejectCall("declined")}
            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 group-hover:scale-110 transition-transform"
            >
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.251.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
            </svg>
            Decline
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 group-hover:scale-110 transition-transform"
            >
              <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-4.19-2.793V8.043l4.19-2.793a.75.75 0 011.06.672v12.156a.75.75 0 01-1.06.672z" />
            </svg>
            Accept
          </button>
        </div>

      </div>
    </div>
  );
};

export default IncomingCallModal;

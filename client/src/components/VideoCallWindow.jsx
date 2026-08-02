// ==================================================================================
// FILE: client/src/components/VideoCallWindow.jsx
// PURPOSE: Fullscreen WebRTC Video Call Overlay & Media Control Panel
// 
// INTERVIEW KEY CONCEPTS:
// 1. REACT VIDEO REF BINDING:
//    - HTML5 <video> elements need their `srcObject` property assigned to a MediaStream object 
//      via React `useRef` and `useEffect` (e.g. `videoRef.current.srcObject = stream`).
// 2. PIP (PICTURE-IN-PICTURE) LAYOUT:
//    - Displays remote peer stream as full-size backdrop and local camera stream as 
//      floating corner preview.
// 3. MEDIA CONTROLS:
//    - Mic Mute: Disables local audio track (`audioTrack.enabled = false`).
//    - Camera Off: Disables local video track (`videoTrack.enabled = false`).
//    - Hangup: Triggers endCall() signaling and tears down peer connection.
// ==================================================================================

import React, { useContext, useEffect, useRef } from "react";
import { VideoCallContext } from "../../context/VideoCallContext";
import assets from "../assets/assets";

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const VideoCallWindow = () => {
  const {
    callState,
    callData,
    localStream,
    remoteStream,
    isMicMuted,
    isVideoOff,
    callDuration,
    endCall,
    toggleMic,
    toggleCamera,
  } = useContext(VideoCallContext);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // INTERVIEW POINT: Dynamically attach local MediaStream to local <video> element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // INTERVIEW POINT: Dynamically attach remote MediaStream to remote <video> element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  if (callState !== "CALLING" && callState !== "CONNECTED" && callState !== "ENDED") {
    return null;
  }

  const peerUser = callData?.peerUser;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">

        {/* TOP BAR: Call Status & Peer Info */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-slate-950/80 to-transparent">
          <div className="flex items-center gap-3">
            <img
              src={peerUser?.profilePic || assets.avatar_icon}
              alt={peerUser?.fullName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500"
            />
            <div>
              <h4 className="text-white font-semibold text-base sm:text-lg">
                {peerUser?.fullName || "User"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {callState === "CALLING"
                  ? "Calling..."
                  : callState === "CONNECTED"
                  ? `Connected • ${formatTimer(callDuration)}`
                  : "Call Ended"}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN VIDEO DISPLAY AREA */}
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* REMOTE STREAM (FULLSCREEN BACKGROUND) */}
          {callState === "CONNECTED" && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            /* FALLBACK WHEN CONNECTING OR REMOTE VIDEO OFF */
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <img
                src={peerUser?.profilePic || assets.avatar_icon}
                alt={peerUser?.fullName}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-violet-500/50 animate-pulse"
              />
              <p className="text-slate-400 text-sm sm:text-base">
                {callState === "CALLING"
                  ? "Waiting for answer..."
                  : callState === "ENDED"
                  ? "Call finished"
                  : "Connecting video..."}
              </p>
            </div>
          )}

          {/* LOCAL STREAM (PICTURE IN PICTURE PREVIEW) */}
          {localStream && (
            <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 w-28 h-40 sm:w-36 sm:h-52 bg-slate-900 border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl z-10 transition-all duration-300">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 text-xs">
                  Camera Off
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM CONTROL BAR */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-center gap-6">
          {/* MUTE MIC BUTTON */}
          <button
            onClick={toggleMic}
            title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
            className={`p-4 rounded-full transition-all duration-200 cursor-pointer ${
              isMicMuted
                ? "bg-red-500/80 hover:bg-red-600 text-white"
                : "bg-slate-800/80 hover:bg-slate-700 text-white"
            }`}
          >
            {isMicMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM12 4.5a3 3 0 00-3 3v4.188l6.812 6.812a6.75 6.75 0 00.938-3.5v-1.5a.75.75 0 011.5 0v1.5a8.25 8.25 0 01-5.25 7.74v2.01h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.01A8.25 8.25 0 013.75 12.5v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 006.75 6.75c.98 0 1.913-.21 2.756-.587L6.46 10.388V7.5a3 3 0 013-3z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.75 6.75 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            )}
          </button>

          {/* END CALL BUTTON */}
          <button
            onClick={endCall}
            title="End Call"
            className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.251.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
            </svg>
          </button>

          {/* TOGGLE CAMERA BUTTON */}
          <button
            onClick={toggleCamera}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
            className={`p-4 rounded-full transition-all duration-200 cursor-pointer ${
              isVideoOff
                ? "bg-red-500/80 hover:bg-red-600 text-white"
                : "bg-slate-800/80 hover:bg-slate-700 text-white"
            }`}
          >
            {isVideoOff ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM15.75 6.75h-2.938l-4.5 4.5H15.75v5.438l2.25 2.25v-8.438a3 3 0 00-3-3zM4.5 6.75a3 3 0 00-3 3h10.938l-3-3H4.5v-9h1.938l-1.938-1.938V6.75z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-4.19-2.793V8.043l4.19-2.793a.75.75 0 011.06.672v12.156a.75.75 0 01-1.06.672z" />
              </svg>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VideoCallWindow;

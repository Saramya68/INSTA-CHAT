// ==================================================================================
// FILE: client/src/components/CallHistory.jsx
// PURPOSE: UI Component for Displaying Persistent User Call History (Incoming & Outgoing)
// ==================================================================================

import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import { VideoCallContext } from "../../context/VideoCallContext";

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CallHistory = () => {
  const { axios, authUser, onlineUsers } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const { initiateCall, callState } = useContext(VideoCallContext);

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/calls/history");
      if (data.success) {
        setCalls(data.calls || []);
      } else {
        toast.error(data.message || "Failed to fetch call history");
      }
    } catch (err) {
      console.error("Error fetching call history:", err);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const subText = darkMode ? "text-gray-400" : "text-gray-600";
  const hoverBg = darkMode ? "hover:bg-[#282142]/40" : "hover:bg-gray-100";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between py-2 px-1 mb-3 border-b border-gray-500/30">
        <h3 className={`text-base font-semibold ${textColor}`}>Call Logs</h3>
        <button
          onClick={fetchCallHistory}
          title="Refresh History"
          className="p-1.5 rounded-full hover:bg-gray-500/20 text-xs text-violet-400 transition-all cursor-pointer"
        >
          🔄
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-2">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className={`text-xs ${subText}`}>Loading call logs...</p>
        </div>
      ) : calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className={`text-sm font-medium ${subText}`}>No recent calls</p>
          <p className="text-xs text-gray-500 mt-1">Your video call history will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-1">
          {calls.map((call) => {
            const isOutgoing = call.callerId?._id?.toString() === authUser?._id?.toString();
            const peerUser = isOutgoing ? call.receiverId : call.callerId;
            const isOnline = peerUser ? onlineUsers.includes(peerUser._id) : false;

            // Status Badge Formatting
            let statusColor = "text-gray-400";
            let statusLabel = call.status;

            if (call.status === "COMPLETED") {
              statusColor = "text-emerald-400";
              statusLabel = formatDuration(call.duration);
            } else if (call.status === "MISSED") {
              statusColor = "text-red-400";
              statusLabel = "Missed";
            } else if (call.status === "REJECTED") {
              statusColor = "text-amber-400";
              statusLabel = "Declined";
            } else if (call.status === "FAILED") {
              statusColor = "text-red-400";
              statusLabel = "Failed";
            }

            return (
              <div
                key={call._id}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 ${hoverBg}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Peer Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={peerUser?.profilePic || assets.avatar_icon}
                      alt={peerUser?.fullName || "User"}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-600"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-900"></span>
                    )}
                  </div>

                  {/* Call Meta Info */}
                  <div className="flex flex-col min-w-0 flex-1 leading-tight">
                    <p className={`font-medium text-sm truncate ${textColor}`}>
                      {peerUser?.fullName || "Unknown User"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs mt-1">
                      {/* Direction Icon */}
                      <span className={isOutgoing ? "text-blue-400" : "text-emerald-400"}>
                        {isOutgoing ? "↗ Outgoing" : "↙ Incoming"}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className={statusColor}>{statusLabel}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {formatDate(call.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Instant Call Action Button */}
                {peerUser && (
                  <button
                    onClick={() => initiateCall(peerUser)}
                    disabled={!isOnline || callState !== "IDLE"}
                    title={!isOnline ? "User offline" : "Call back"}
                    className={`p-2 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
                      !isOnline || callState !== "IDLE"
                        ? "opacity-30 cursor-not-allowed text-gray-500"
                        : "hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 cursor-pointer"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-4.19-2.793V8.043l4.19-2.793a.75.75 0 011.06.672v12.156a.75.75 0 01-1.06.672z" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CallHistory;

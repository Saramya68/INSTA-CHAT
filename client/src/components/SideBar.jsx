import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import { ThemeContext } from "../../context/ThemeContext";


const Sidebar = () => {
  const { darkMode } = useContext(ThemeContext);
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const navigate = useNavigate();

  const [input, setInput] = useState("");

  // Filter users based on search input
  const filteredUsers = input.trim()
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;
  // Theme Classes
const sidebarBg = darkMode
  ? "bg-[#8185B2]/10"
  : "bg-white";

const searchBg = darkMode
  ? "bg-[#282142]"
  : "bg-gray-200";

const textColor = darkMode
  ? "text-white"
  : "text-gray-900";

const subText = darkMode
  ? "text-gray-400"
  : "text-gray-600";

const selectedBg = darkMode
  ? "bg-[#282142]/50"
  : "bg-blue-100";

const menuBg = darkMode
  ? "bg-[#282142] border-gray-600 text-white"
  : "bg-white border-gray-300 text-gray-900";

const inputClass = darkMode
  ? "text-white placeholder-gray-300"
  : "text-gray-900 placeholder-gray-500";

  // Fetch users whenever online users change
  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  return (
    <div
      className={`${sidebarBg} h-full p-5 rounded-r-xl overflow-y-scroll transition-all duration-300  ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      {/* Top Section */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img
            src={assets.logo}
            alt="logo"
            className="w-12 h-12 object-contain"
          />

          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="menu"
              className="max-h-5 cursor-pointer"
            />

            <div className={`absolute top-full right-0 z-20 w-32 p-5 rounded-md border hidden group-hover:block ${menuBg}`}>
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm"
              >
                Edit Profile
              </p>

              <hr className="my-2 border-t border-gray-500" />

              <p
                onClick={logout}
                className="cursor-pointer text-sm"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className={`${searchBg} rounded-full flex items-center gap-2 py-3 px-4 mt-5 transition-all duration-300`}>
          <img
            src={assets.search_icon}
            alt="search"
            className="w-3"
          />

          <input
            type="text"
            placeholder="Search User..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`bg-transparent border-none outline-none text-xs flex-1 ${inputClass}`}
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex flex-col">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => {
              setSelectedUser(user);

              // Remove unseen messages for selected user
              if (unseenMessages[user._id]) {
                setUnseenMessages((prev) => ({
                  ...prev,
                  [user._id]: 0,
                }));
              }
            }}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
              selectedUser?._id === user._id
               ? selectedBg
                 : ""
            }`}
          >
            <img
              src={user.profilePic || assets.avatar_icon}
              alt={user.fullName}
              className="w-[35px] aspect-square rounded-full"
            />

            <div className="flex flex-col leading-5">
              <p className={textColor}>{user.fullName}</p>

              {onlineUsers.includes(user._id) ? (
                <span className="text-green-500 text-xs">
                  Online
                </span>
              ) : (
                <span className={`${subText} text-xs`}>
                  Offline
                </span>
              )}
            </div>

            {unseenMessages[user._id] > 0 && (
              <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500 text-white">
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
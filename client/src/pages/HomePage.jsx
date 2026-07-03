import React, { useContext } from "react";
import SideBar from "../components/SideBar";
import ChatContainer from "../components/ChatContainer";
import RightSideBar from "../components/RightSideBar";
import { ChatContext } from "../../context/ChatContext";
import { ThemeContext } from "../../context/ThemeContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <div
      className={`relative w-full h-screen sm:px-[15%] sm:py-[5%] transition-all duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-slate-950 via-blue-900 to-sky-700"
          : "bg-gradient-to-br from-sky-100 via-white to-blue-100"
      }`}
    >
      {/* Theme Toggle */}
      <div className="absolute top-5 right-5 z-50 flex flex-col items-center gap-1">
        <button
          onClick={toggleTheme}
          className={`w-12 h-12 rounded-full shadow-lg text-xl transition-all duration-300 hover:scale-110 ${
            darkMode
              ? "bg-white text-yellow-500"
              : "bg-slate-900 text-white"
          }`}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <span
          className={`text-xs font-semibold tracking-wide ${
            darkMode ? "text-blue-200" : "text-slate-700"
          }`}
        >
          Change Mode
        </span>
      </div>

      {/* Main Chat Layout */}
      <div
        className={`rounded-2xl overflow-hidden h-full grid grid-cols-1 transition-all duration-300 ${
          darkMode
            ? "bg-[#1e293b] border-2 border-gray-700"
            : "bg-white border border-gray-300 shadow-2xl"
        } ${
          selectedUser
            ? "md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]"
            : "md:grid-cols-2"
        }`}
      >
        <SideBar />
        <ChatContainer />
        <RightSideBar />
      </div>
    </div>
  );
};

export default HomePage;
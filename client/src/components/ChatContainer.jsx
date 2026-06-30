import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import toast from "react-hot-toast";

import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef(null);

  const [input, setInput] = useState("");

  // Handle sending a text message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    if (input.trim() === "") return;

    await sendMessage({
      text: input.trim(),
    });

    setInput("");
  };

  // Handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];

    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select an image file");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      await sendMessage({
        image: reader.result,
      });

      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  // Fetch messages
  useEffect(() => {
    if (selectedUser) {
        getMessages(selectedUser._id);
    }
}, [selectedUser, getMessages]);

  // Auto scroll
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-y-scroll relative backdrop-blur-lg">
      {/* Header */}

      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />

        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}

          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>

        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />

        <img
          src={assets.help_icon}
          alt=""
          className="max-md:hidden max-w-5"
        />
      </div>

      {/* Chat Area */}

      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
  {messages.map((msg, index) => {
    const isMyMessage =
      msg.senderId?.toString() === authUser?._id?.toString();

    return (
      <div
        key={index}
        className={`flex items-end gap-2 mb-4 ${
          isMyMessage
            ? "justify-end"
            : "justify-start flex-row-reverse"
        }`}
      >
        {msg.image ? (
          <img
            src={msg.image}
            alt=""
            className="max-w-[230px] rounded-lg border border-gray-700"
          />
        ) : (
          <p
            className={`p-2 max-w-[220px] text-white text-sm break-words rounded-lg ${
              isMyMessage
                ? "bg-violet-500 rounded-br-none"
                : "bg-gray-700 rounded-bl-none"
            }`}
          >
            {msg.text}
          </p>
        )}

        <div className="text-center text-xs">
          <img
            src={
              isMyMessage
                ? authUser?.profilePic || assets.avatar_icon
                : selectedUser?.profilePic || assets.avatar_icon
            }
            alt=""
            className="w-7 h-7 rounded-full"
          />

          <p className="text-gray-400">
            {formatMessageTime(msg.createdAt)}
          </p>
        </div>
      </div>
    );
  })}

  <div ref={scrollEnd}></div>
</div>

      {/* Bottom */}

      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/10 rounded-full px-3">
          <input
            type="text"
            placeholder="Send a message"
            className="flex-1 bg-transparent outline-none text-white p-3 placeholder-gray-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSendMessage(e)
            }
          />

          <input
            type="file"
            id="image"
            hidden
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleSendImage}
          />

          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 cursor-pointer mr-2"
            />
          </label>
        </div>

        <img
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
          onClick={handleSendMessage}
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo} alt="" className="max-w-16" />

      <p className="text-lg font-medium text-white">
        Chat anytime, anywhere
      </p>
    </div>
  );
};

export default ChatContainer;
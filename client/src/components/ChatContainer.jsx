  import React, { useContext, useEffect, useRef, useState } from "react";
  import assets from "../assets/assets";
  import toast from "react-hot-toast";

  import { formatMessageTime } from "../lib/utils";
  import { ChatContext } from "../../context/ChatContext";
  import { AuthContext } from "../../context/AuthContext";
  import { ThemeContext } from "../../context/ThemeContext";
  const ChatContainer = () => {
    const {
      messages,
      selectedUser,
      setSelectedUser,
      sendMessage,
      getMessages,
    
    } = useContext(ChatContext);
    
    const { authUser, onlineUsers,socket} = useContext(AuthContext);
    const { darkMode } = useContext(ThemeContext);
    const scrollEnd = useRef(null);
    const [input, setInput] = useState("");
    
  const chatBg = darkMode ? "bg-transparent" : "bg-white";

  const textColor = darkMode ? "text-white" : "text-gray-900";

  const subText = darkMode ? "text-gray-400" : "text-gray-600";

  const inputBg = darkMode
    ? "bg-gray-100/10"
    : "bg-gray-200";

  const inputText = darkMode
    ? "text-white placeholder-gray-400"
    : "text-gray-900 placeholder-gray-500";

  const borderColor = darkMode
    ? "border-stone-500"
    : "border-gray-300";
    useEffect(() => {
  if (!socket || !selectedUser) return;

  if (input.trim() !== "") {
    socket.emit("typing", {
      receiverId: selectedUser._id,
    });
  } else {
    socket.emit("stopTyping", {
      receiverId: selectedUser._id,
    });
  }
}, [input, socket, selectedUser]);

    // Handle sending a text message
    const handleSendMessage = async (e) => {
  if (e) e.preventDefault();

  if (input.trim() === "") return;

  await sendMessage({
    text: input.trim(),
  });

  socket.emit("stopTyping", {
    receiverId: selectedUser._id,
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

  socket.emit("stopTyping", {
    receiverId: selectedUser._id,
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
  

    return selectedUser ? (
      <div className={`h-full overflow-y-scroll relative ${chatBg}`}>
        {/* Header */}

        <div className={`flex items-center gap-3 py-3 mx-4 border-b ${borderColor}`}>
          <img
        src={darkMode ? assets.arrow_white_icon: assets.arrow_black_icon}
          alt=""
          onClick={() => setSelectedUser(null)}
        className="w-7 cursor-pointer rotate-180"
  />
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt=""
            className="w-8 rounded-full"
          />

          <p className={`flex-1 text-lg flex items-center gap-2 ${textColor}`}>
            {selectedUser.fullName}

            {onlineUsers.includes(selectedUser._id) && (
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            )}
          </p>
         

          

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
        className={`flex mb-4 ${
          isMyMessage ? "justify-end" : "justify-start"
        }`}
      >
        {!isMyMessage && (
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            className="w-8 h-8 rounded-full mr-2 self-end"
            alt=""
          />
        )}

        <div
          className={`max-w-[70%] ${
            isMyMessage ? "items-end" : "items-start"
          } flex flex-col`}
        >
          {msg.image ? (
            <img
              src={msg.image}
              className="max-w-[220px] rounded-lg"
              alt=""
            />
          ) : (
            <div
              className={`px-4 py-2 rounded-lg text-white ${
                isMyMessage
                  ? "bg-violet-500 rounded-br-none"
                  : "bg-violet-500 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          )}

          <span className={`text-xs mt-1 ${subText}`}>
            {formatMessageTime(msg.createdAt)}
          </span>
        </div>

        {isMyMessage && (
          <img
            src={authUser?.profilePic || assets.avatar_icon}
            className="w-8 h-8 rounded-full ml-2 self-end"
            alt=""
          />
        )}
      </div>
    );
  })}

    <div ref={scrollEnd}></div>
  </div>

        {/* Bottom */}

        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
          <div className={`flex-1 flex items-center rounded-full px-3 ${inputBg}`}>
            <input
              type="text"
              placeholder="Send a message"
            className={`flex-1 bg-transparent outline-none p-3 ${inputText}`}
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
              className="w-8 h-8 cursor-pointer mr-2"
        />
            </label>
          </div>

          {input.trim() !== "" && (
  <img
    src={assets.send_button}
    alt=""
    className="w-7 cursor-pointer"
    onClick={handleSendMessage}
  />
)}
        </div>
      </div>
    ) : (
      <div
    className={`flex flex-col items-center justify-center gap-2 max-md:hidden ${
      darkMode
        ? "bg-white/10 text-gray-400"
        : "bg-gray-100 text-gray-600"
    }`}
  >
    <img src={assets.logo} alt="" className="max-w-16" />

    <p
      className={`text-lg font-medium ${
        darkMode ? "text-white" : "text-gray-800"
      }`}
    >
      Chat anytime, anywhere
    </p>
  </div>
      
    );
  };

  export default ChatContainer;
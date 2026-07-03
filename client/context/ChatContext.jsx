import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

  // Store messages of current chat
  const [messages, setMessages] = useState([]);

  // Store all users shown in sidebar
  const [users, setUsers] = useState([]);

  // Currently selected user
  const [selectedUser, setSelectedUser] = useState(null);

  // Store unseen message count
  const [unseenMessages, setUnseenMessages] = useState({});

  // Get socket and axios from AuthContext
  const { socket, axios } = useContext(AuthContext);
  const [typingUser, setTypingUser] = useState(null);

useEffect(() => {
  if (!socket) return;

  socket.on("typing", ({ senderId }) => {
    setTypingUser(senderId);
  });

  socket.on("stopTyping", ({ senderId }) => {
    setTypingUser((prev) =>
      prev === senderId ? null : prev
    );
  });

  return () => {
    socket.off("typing");
    socket.off("stopTyping");
  };
}, [socket]);

  // ==========================
  // Get all users
  // ==========================


  const getUsers = async () => {
    try {

      const { data } = await axios.get("/api/messages/users");

      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }

    } catch (error) {
      toast.error(error.message);
    }
  };

  // ==========================
  // Get messages of selected user
  // ==========================

  const getMessages = async (userId) => {

    try {

      const { data } = await axios.get(`/api/messages/${userId}`);

      if (data.success) {
        setMessages(data.messages);
      }

    } catch (error) {
      toast.error(error.message);
    }

  };

  // ==========================
  // Send Message
  // ==========================

  const sendMessage = async (messageData) => {

    try {

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {

        setMessages((prevMessages) => [
          ...prevMessages,
          data.newMessage
        ]);

      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.message);
    }

  };

  // ==========================
  // Listen for new messages
  // ==========================

  const subscribeToMessages = () => {

    if (!socket) return;

    socket.on("newMessage", (newMessage) => {

      // If chat is already open
      if (
    selectedUser &&
    newMessage.senderId.toString() === selectedUser._id.toString()
) {

        newMessage.seen = true;

        setMessages((prevMessages) => [
          ...prevMessages,
          newMessage
        ]);

        axios.put(`/api/messages/mark/${newMessage._id}`);

      }

      // Chat is not open
      else {

        setUnseenMessages((prevUnseenMessages) => ({

          ...prevUnseenMessages,

          [newMessage.senderId]:
            prevUnseenMessages[newMessage.senderId]
              ? prevUnseenMessages[newMessage.senderId] + 1
              : 1

        }));

      }

    });

  };

  // ==========================
  // Remove socket listener
  // ==========================

  const unsubscribeFromMessages = () => {

    if (socket) {
      socket.off("newMessage");
    }

  };

  useEffect(() => {

    subscribeToMessages();

    return () => unsubscribeFromMessages();

  }, [socket, selectedUser]);

  const value = {

    messages,
    users,
    selectedUser,

    getUsers,
    getMessages,
    sendMessage,
    setMessages,
    setSelectedUser,
    
     typingUser,
    unseenMessages,
    setUnseenMessages,


  };

  return (

    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>

  );

};
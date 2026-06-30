import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import {io} from 'socket.io-client'
const backendUrl=import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL=backendUrl
export const AuthContext=createContext();
export const AuthProvider=({children})=>{
    const [token,setToken]=useState(localStorage.getItem('token'))
    const [authUser,setAuthUser]=useState(null)
    const [onlineUsers,setOnlineUsers]=useState([])
    const [socket,setSocket]=useState(null)
    const checkAuth=async(req,res)=>{
        try{
        const {data}=await axios.get('/api/auth/check')
        if(data.success){
            setAuthUser(data.user)
            connectSocket(data.user)
        }
        }catch(error){
          toast.error(error.message)
        }
    }
    // login function to handle user authentication and socket connection
    const login = async (state, credentials) => {
    try {
        const { data } = await axios.post(
            `/api/auth/${state}`,
            credentials
        );

        if (data.success) {
            setAuthUser(data.userData);

            connectSocket(data.userData);

            axios.defaults.headers.common["token"] = data.token;

            setToken(data.token);

            localStorage.setItem("token", data.token);

            toast.success(data.message);
        }
        else{
             toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message);
    }
};
// logout function function to handle user logout socket disconnection 
const logout = () => {
    socket?.disconnect();

    setSocket(null);
    setAuthUser(null);
    setOnlineUsers([]);
    setToken(null);

    delete axios.defaults.headers.common["token"];

    localStorage.removeItem("token");

    toast.success("Logged out successfully");
};
// Update profile function to handle user profile updates
const updateProfile = async (body) => {
    try {
        const { data } = await axios.put("/api/auth/update-profile", body);

        if (data.success) {
            setAuthUser(data.user);
            toast.success("Profile updated successfully");
            return true;
        } else {
            toast.error(data.message);
            return false;
        }
    } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        return false;
    }
};
// Connect socket function to handle socket connection and online users updates
const connectSocket = (userData) => {
    if (!userData) return;

    if (socket) {
        socket.disconnect();
    }

    const newSocket = io(backendUrl, {
        query: {
            userId: userData._id,
        },
        transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
        console.log("Socket Connected:", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
        console.log("Online Users:", userIds);
        setOnlineUsers(userIds);
    });
};
    useEffect(() => {
    if (token) {
        axios.defaults.headers.common["token"] = token;
    }

    checkAuth();
}, []);

    const value={
       axios,
       authUser,
       onlineUsers,
       socket,
       login,
       logout,
       updateProfile
    }

    return(
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
    )
}


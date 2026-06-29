import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
const app = express();
const server = http.createServer(app);

// Middlewares
app.use(express.json({ limit: "4mb" }));
app.use(cors());
// Initialize socket.io server
export const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    console.log("User Connected", userId);

    if (userId) {
        userSocketMap[userId] = socket.id;
    }
    // Emit online users to all connected clients
     io.emit("getOnlineUsers", Object.keys(userSocketMap));

     socket.on("disconnect", () => {
    console.log("User Disconnected", userId);

    delete userSocketMap[userId];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
     });
});

// Route
app.use("/api/status", (req, res) => {
    res.send("server is live");
});
app.use('/api/status',userRouter)
app.use('/api/messages',messageRouter)

// Port
const PORT = process.env.PORT || 5000;
console.log(JSON.stringify(process.env.MONGODB_URI));
await connectDB()

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
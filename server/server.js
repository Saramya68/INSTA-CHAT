import express from "express";
import dotenv from "dotenv";

dotenv.config();


import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Route
app.use("/api/status", (req, res) => {
    res.send("server is live");
});

// Port
const PORT = process.env.PORT || 5000;
console.log(JSON.stringify(process.env.MONGODB_URI));
await connectDB()

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
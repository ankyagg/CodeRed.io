// Main Server Entry Point

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { initializeSocketHandlers } from "./socketHandler.js";

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  path: '/undercover/socket.io',
  cors: {
    origin: "*", // Allow all origins for local network testing
    methods: ["GET", "POST"],
    credentials: true,
  },

});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "ShadowWord server running" });
});

// Initialize socket handlers
initializeSocketHandlers(io);

const PORT = process.env.PORT || 3005;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🎮 ShadowWord server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://10.0.0.146:${PORT}`);
  console.log(`📡 Share this link: http://10.0.0.146:5173`);
});

// Socket.IO Client Configuration

import { io } from "socket.io-client";

// Try to read from env variable (Vite) or fall back to current origin
// This avoids hardcoding an IP that may change between networks.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || window.location.origin || "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  path: '/undercover/socket.io',
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});


// Connection event listeners
socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});

export default socket;

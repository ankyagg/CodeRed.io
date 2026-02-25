import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 5177,
    allowedHosts: [
      "fc87-2409-40c0-23e-1477-3d34-473e-95b4-3a33.ngrok-free.app"
    ],

    proxy: {
      // Proxy socket.io requests to backend server
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
      },
    },
  },
  base: '/undercover/',
});


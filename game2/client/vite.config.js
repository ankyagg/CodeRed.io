import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base: '/escape/' ensures all asset URLs are prefixed with /escape/
  // when served through the game-hub-proxy or ngrok
  base: '/escape/',
  server: {
    host: true, // Listen on all local IPs
    port: 5174,
    proxy: {
      // Proxy socket.io connections to the game2 backend in dev mode
      '/socket.io': {
        target: 'http://localhost:3003',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})

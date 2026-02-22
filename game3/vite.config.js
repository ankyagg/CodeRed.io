import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/darkroom/', // Match the subpath used in the landing page
  server: {
    port: 5175,
    host: '0.0.0.0', // Allow local network access
    allowedHosts: true, // Allow all hosts (for ngrok/localtunnel)
  },
});

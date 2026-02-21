import { defineConfig } from 'vite';

export default defineConfig({
    base: '/hoop/',
    server: {
        host: '0.0.0.0',   // Listen on all interfaces (LAN + localhost)
        port: 5176,
        allowedHosts: true, // Allow ngrok
    }
});

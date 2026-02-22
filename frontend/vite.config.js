import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/survival/',
    server: {
        port: 5173,
        allowedHosts: true,
        host: true,
        proxy: {
            '/survival/socket.io': {
                target: 'http://localhost:3001',
                ws: true,
                changeOrigin: true
            },
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    },
});

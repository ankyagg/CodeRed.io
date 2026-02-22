import { io } from 'socket.io-client';

/**
 * Single shared Socket.IO client instance.
 * In dev mode, connect to backend on port 3002.
 * In production (ngrok), connect to same origin.
 */
// detect if we are running through the Hub or Ngrok
const isHub = window.location.port === '3000' || window.location.hostname.includes('ngrok');

const BACKEND_URL = isHub
    ? '' // Use same host/port if going through Hub
    : `http://${window.location.hostname}:3002`;

console.log('🔌 Connecting to Multiplayer Server at:', BACKEND_URL || window.location.origin);

export const socket = io(BACKEND_URL, {
    path: '/darkroom/socket.io',
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
    }
});

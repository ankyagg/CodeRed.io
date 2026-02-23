import { io } from 'socket.io-client';

/**
 * Single shared Socket.IO client instance.
 * In dev mode, connect to backend on port 3002.
 * In production (ngrok), connect to same origin.
 */
const isDevFrontend = window.location.port === '5175';
const BACKEND_URL = isDevFrontend ? `http://${window.location.hostname}:3002` : '';
const isNgrok = window.location.hostname.includes('ngrok');

console.log('🔌 Connecting to Multiplayer Server at:', BACKEND_URL || window.location.origin);

export const socket = io(BACKEND_URL, {
    path: '/darkroom/socket.io',
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    ...(isNgrok ? { extraHeaders: { 'ngrok-skip-browser-warning': 'true' } } : {})
});

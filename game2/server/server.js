require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
// Removed MongoDB connection as it is no longer required

const app = express();
const server = http.createServer(app);

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// Socket.io Setup
const io = new Server(server, {
    path: '/escape/socket.io',
    cors: {
        origin: "*", // Allow all origins for LAN testing
        methods: ["GET", "POST"]
    }
});

// Import the logic handling socket events
const registerSocketHandlers = require('./socket/roomHandlers');

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);
    registerSocketHandlers(io, socket);

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

// Fallback all routes to index.html for React Router compatibility
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

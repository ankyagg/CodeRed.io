const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const { setupSocketHandlers } = require('./sockets/handler');
const PlayerStats = require('./models/PlayerStats');

// ── Express + Socket.io Setup ──
const app = express();
app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

const server = http.createServer(app);
const io = new Server(server, {
    path: '/survival/socket.io',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['ngrok-skip-browser-warning']
    },
});

// ── Database Setup ──
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('📦 Connected to MongoDB Atlas'))
        .catch((err) => console.error('❌ MongoDB connection error:', err));
} else {
    console.warn('⚠️ MONGO_URI not found in .env. Database features will be disabled.');
}

// ── Serve Static Frontend (Production / Internet Play) ──
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// ── Health check endpoint API ──
app.get('/api/health', (req, res) => {
    res.json({ status: 'Survival Sandbox server running', rooms: 'Use socket events to manage rooms' });
});

// Fallback all routes to index.html for React Router compatibility
app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ── Leaderboard API ──
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json([]);
        }
        const topPlayers = await PlayerStats.find()
            .sort({ totalScore: -1 }) // Highest score first
            .limit(10) // Top 10
            .select('nickname totalScore totalKills gamesPlayed bestSurvivalTimeSeconds -_id'); // Exclude _id
        res.json(topPlayers);
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// ── Setup Socket Handlers ──
setupSocketHandlers(io);

// ── Start Server (bind to 0.0.0.0 for LAN access) ──
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Survival Sandbox server listening on http://0.0.0.0:${PORT}`);
    console.log(`   Players can connect from LAN via your machine's IP address`);
});

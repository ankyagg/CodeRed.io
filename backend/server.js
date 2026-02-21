const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const { setupSocketHandlers } = require('./sockets/handler');
const PlayerStats = require('./models/PlayerStats');

// ── Express + Socket.io Setup ──
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// ── Database Setup ──
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📦 Connected to MongoDB Atlas'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Health check endpoint ──
app.get('/', (req, res) => {
    res.json({ status: 'Survival Sandbox server running', rooms: 'Use socket events to manage rooms' });
});

// ── Leaderboard API ──
app.get('/api/leaderboard', async (req, res) => {
    try {
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

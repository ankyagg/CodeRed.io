/**
 * server.js — Multinode Room-based Game Server + Frontend Host
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const PlayerStats = require('./models/PlayerStats');

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB ---
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('📦 Connected to MongoDB Atlas (Darkroom)'))
        .catch(err => console.error('❌ MongoDB error:', err));
} else {
    console.warn('⚠️ MONGO_URI not found for game3. Database features disabled.');
}

// --- Leaderboard API ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (!MONGO_URI || mongoose.connection.readyState !== 1) {
            return res.json([]);
        }
        const top = await PlayerStats.find()
            .sort({ nightsSurvived: -1, foodEaten: -1 })
            .limit(10)
            .select('nickname nightsSurvived foodEaten gamesPlayed -_id');
        res.json(top);
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// --- Serve Static Frontend Files ---
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    path: '/darkroom/socket.io',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const PORT = 3002;
const TICK_RATE = 15;

/** 
 * rooms[roomId] = { 
 *   players: { socketId: playerData }, 
 *   foods: { foodId: foodData } 
 * } 
 */
const rooms = {};

const DAY_CYCLE_SECONDS = 80; // 80 seconds total
const NIGHT_THRESHOLD = 0.5; // 40s Day, 40s Night

function updateAI(room) {
    const players = Object.values(room.players);
    if (room.dayProgress < NIGHT_THRESHOLD) {
        if (Object.keys(room.enemies).length > 0) {
            room.enemies = {};
            // Broadcast the clear state immediately
            io.to(room.id).emit('gameState', {
                players: room.players,
                dayProgress: room.dayProgress,
                enemies: {}
            });
        }
        return;
    }

    // Spawn 3 enemies at night if not exists
    if (Object.keys(room.enemies).length === 0) {
        for (let i = 0; i < 3; i++) {
            const id = `enemy_${i}`;
            room.enemies[id] = {
                id,
                position: [(Math.random() - 0.5) * 50, 0, (Math.random() - 0.5) * 50],
                targetId: null,
                speed: 0.18, // 50% faster than before
            };
        }
    }

    // AI Logic
    for (const eid in room.enemies) {
        const enemy = room.enemies[eid];
        let nearestPlayer = null;
        let minDist = Infinity;

        players.forEach(p => {
            if (p.isHiding) return;
            if (p.health <= 0) return;
            const dist = Math.sqrt(
                Math.pow(p.position[0] - enemy.position[0], 2) +
                Math.pow(p.position[2] - enemy.position[2], 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearestPlayer = p;
            }
        });

        if (nearestPlayer) {
            enemy.targetId = nearestPlayer.id;
            const dx = nearestPlayer.position[0] - enemy.position[0];
            const dz = nearestPlayer.position[2] - enemy.position[2];
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0.8) {
                enemy.position[0] += (dx / dist) * enemy.speed;
                enemy.position[2] += (dz / dist) * enemy.speed;
            } else {
                // Damage player if close (20 per hit, with 1s cooldown)
                const now = Date.now();
                if (!nearestPlayer.lastHit || now - nearestPlayer.lastHit > 1000) {
                    nearestPlayer.health = Math.max(0, nearestPlayer.health - 20);
                    nearestPlayer.lastHit = now;
                }
            }
        } else {
            enemy.targetId = null;
        }
    }
}

function generateFoods() {
    const foods = {};
    let idx = 0;

    const addFood = (x, y, z) => {
        const id = `food_${idx}`;
        foods[id] = {
            id,
            position: [x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.3],
            healthRestore: 10,
            hue: Math.floor(Math.random() * 360),
        };
        idx++;
    };

    // Shelf Y levels (matching Shelf component: 4 boards at y ≈ 0.6, 1.4, 2.3, 3.2)
    const shelfYLevels = [0.6, 1.4, 2.3, 3.2];

    // SECTION A: Grocery Aisles (x=-28..-10, z=-28..-10) — medium density
    const groceryShelfX = [-28, -22, -16, -10];
    const groceryShelfZ = [-28, -22, -16, -10];
    for (const sx of groceryShelfX) {
        for (const sz of groceryShelfZ) {
            // Put 1-2 food items per shelf, on random levels
            const numItems = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numItems; i++) {
                const y = shelfYLevels[Math.floor(Math.random() * shelfYLevels.length)];
                addFood(sx, y, sz);
            }
        }
    }

    // SECTION B: Food Court / Cafeteria (x=10..22, z=-25..-18) — HIGH density on tables
    const tablePositions = [
        [10, -25], [16, -25], [22, -25],
        [10, -18], [16, -18], [22, -18]
    ];
    for (const [tx, tz] of tablePositions) {
        // 3-5 items per table
        const numItems = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numItems; i++) {
            addFood(tx + (Math.random() - 0.5) * 1.5, 0.82, tz + (Math.random() - 0.5) * 0.6);
        }
    }
    // Counter food (x=28, z=-15)
    for (let i = 0; i < 4; i++) {
        addFood(27 + Math.random() * 2, 1.05, -15 + (Math.random() - 0.5) * 6);
    }

    // SECTION C: Furniture showroom — sparse, on display shelves
    addFood(26, shelfYLevels[0], 0);
    addFood(26, shelfYLevels[1], 0);

    // SECTION D: Weapons area — sparse, on shelves
    const weaponShelfX = [-18, -12];
    const weaponShelfZ = [8, 20];
    for (const sx of weaponShelfX) {
        for (const sz of weaponShelfZ) {
            if (Math.random() > 0.5) {
                addFood(sx, shelfYLevels[Math.floor(Math.random() * 2)], sz);
            }
        }
    }

    // SECTION E: Warehouse — medium density on dense shelves
    const warehouseX = [10, 16, 22, 28];
    const warehouseZ = [20, 26];
    for (const sx of warehouseX) {
        for (const sz of warehouseZ) {
            const numItems = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numItems; i++) {
                addFood(sx, shelfYLevels[Math.floor(Math.random() * shelfYLevels.length)], sz);
            }
        }
    }

    // Checkout area — a few snacks
    const checkoutX = [-12, -4, 4, 12];
    for (const cx of checkoutX) {
        if (Math.random() > 0.4) {
            addFood(cx, 0.95, 28);
        }
    }

    return foods;
}

io.on('connection', (socket) => {
    let currentRoomId = null;

    socket.on('joinRoom', (data) => {
        // Accept both old string format and new { roomId, playerName } format
        const roomId = typeof data === 'string' ? data : data.roomId;
        const playerName = typeof data === 'string' ? 'Anonymous' : (data.playerName || 'Anonymous');

        currentRoomId = roomId;
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: {},
                foods: generateFoods(),
                startTime: Date.now(),
                dayProgress: 0,
                enemies: {}
            };
        }

        rooms[roomId].players[socket.id] = {
            id: socket.id,
            nickname: playerName,
            position: [(Math.random() - 0.5) * 10, 1.6, 28 + Math.random() * 3],
            rotation: [0, Math.PI, 0],
            health: 100,
            torchOn: false,
            isHiding: false,
        };

        socket.emit('init', {
            playerId: socket.id,
            players: rooms[roomId].players,
            foods: rooms[roomId].foods,
            startTime: rooms[roomId].startTime,
        });

        socket.to(roomId).emit('playerJoined', rooms[roomId].players[socket.id]);
        console.log(`👤 Player ${playerName} joined Room: ${roomId}`);
    });

    socket.on('updateTransform', ({ position, rotation, modelRotation, isHiding }) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const player = rooms[currentRoomId].players[socket.id];
        if (player) {
            player.position = position;
            player.rotation = rotation;
            player.modelRotation = modelRotation;
            player.isHiding = isHiding;
        }
    });

    socket.on('toggleTorch', ({ torchOn }) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const player = rooms[currentRoomId].players[socket.id];
        if (player) {
            player.torchOn = torchOn;
            socket.to(currentRoomId).emit('playerTorchUpdate', { playerId: socket.id, torchOn });
        }
    });

    socket.on('eatFood', ({ foodId }) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        if (room.foods[foodId]) {
            const player = room.players[socket.id];
            delete room.foods[foodId];
            io.to(currentRoomId).emit('foodConsumed', { foodId, playerId: socket.id, newHealth: player.health });

            // ── Save foodEaten to DB ──
            if (player?.nickname) {
                PlayerStats.findOneAndUpdate(
                    { nickname: player.nickname },
                    { $inc: { foodEaten: 1 } },
                    { upsert: true, returnDocument: 'after' }
                ).catch(err => console.error('DB foodEaten error:', err));
            }
        }
    });

    socket.on('useItem', ({ healthRestore }) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const player = rooms[currentRoomId].players[socket.id];
        if (player) {
            player.health = Math.min(100, player.health + (healthRestore || 10));
            io.to(currentRoomId).emit('gameState', {
                players: rooms[currentRoomId].players,
                dayProgress: rooms[currentRoomId].dayProgress,
                enemies: rooms[currentRoomId].enemies
            });
        }
    });

    socket.on('disconnect', () => {
        if (currentRoomId && rooms[currentRoomId]) {
            delete rooms[currentRoomId].players[socket.id];
            io.to(currentRoomId).emit('playerLeft', socket.id);
            socket.to(currentRoomId).emit('voice-peer-left', { peerId: socket.id });

            if (Object.keys(rooms[currentRoomId].players).length === 0) {
                delete rooms[currentRoomId];
            }
        }
    });

    // ── Chat ──
    socket.on('send_chat', (data) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const player = rooms[currentRoomId].players[socket.id];
        if (player) {
            io.to(currentRoomId).emit('receive_chat', { player: player.nickname, message: data.message });
        }
    });

    // ══════════════════════════════════════
    //  VOICE CHAT - WebRTC Signaling
    // ══════════════════════════════════════

    // Request to initiate voice with all peers in room
    socket.on('voice-join', () => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        // Notify existing players that a new voice peer joined
        socket.to(currentRoomId).emit('voice-peer-joined', { peerId: socket.id });
        // Send list of existing peers to the joining player
        const existingPeers = Object.keys(rooms[currentRoomId].players).filter(id => id !== socket.id);
        socket.emit('voice-peers', { peers: existingPeers });
    });

    // Relay WebRTC offer to target peer
    socket.on('voice-offer', ({ targetId, offer }) => {
        io.to(targetId).emit('voice-offer', { fromId: socket.id, offer });
    });

    // Relay WebRTC answer to target peer
    socket.on('voice-answer', ({ targetId, answer }) => {
        io.to(targetId).emit('voice-answer', { fromId: socket.id, answer });
    });

    // Relay ICE candidate to target peer
    socket.on('voice-ice-candidate', ({ targetId, candidate }) => {
        io.to(targetId).emit('voice-ice-candidate', { fromId: socket.id, candidate });
    });

    // Notify when leaving voice chat
    socket.on('voice-leave', () => {
        if (currentRoomId) {
            socket.to(currentRoomId).emit('voice-peer-left', { peerId: socket.id });
        }
    });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

setInterval(() => {
    for (const roomId in rooms) {
        const room = rooms[roomId];
        const elapsed = (Date.now() - room.startTime) / 1000;
        const oldProgress = room.dayProgress;
        room.dayProgress = (elapsed % DAY_CYCLE_SECONDS) / DAY_CYCLE_SECONDS;

        // Log when crossing the threshold
        if (oldProgress < NIGHT_THRESHOLD && room.dayProgress >= NIGHT_THRESHOLD) {
            console.log(`🌙 Night has fallen in Room: ${roomId}`);
        } else if (oldProgress >= NIGHT_THRESHOLD && room.dayProgress < oldProgress) {
            console.log(`☀️ Day has broken in Room: ${roomId}`);
            // ── A full night was survived — credit all alive players ──
            Object.values(room.players).forEach(p => {
                if (p.nickname && p.health > 0) {
                    PlayerStats.findOneAndUpdate(
                        { nickname: p.nickname },
                        { $inc: { nightsSurvived: 1, gamesPlayed: 1 } },
                        { upsert: true, returnDocument: 'after' }
                    ).catch(err => console.error('DB nightsSurvived error:', err));
                }
            });
        }

        updateAI(room);

        io.to(roomId).emit('gameState', {
            players: room.players,
            dayProgress: room.dayProgress,
            enemies: room.enemies
        });
    }
}, 1000 / TICK_RATE);

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌟 GAME HOSTED SUCCESSFULLY!`);
    console.log(`🚀 Access everything on port ${PORT}`);
    console.log(`👉 http://localhost:${PORT}`);
});

const roomManager = require('../game/roomManager');
const { TILE, PLAYER_ATTACK_DAMAGE } = require('../game/constants');
const PlayerStats = require('../models/PlayerStats');

/**
 * Broadcast state to all players in a room.
 */
function broadcastRoomState(io, room) {
    if (!room) return;
    io.to(room.id).emit('stateUpdate', room.getState());
}

/**
 * Broadcast only delta updates (changed tiles + active players/mobs)
 */
function broadcastRoomDelta(io, room) {
    if (!room) return;
    io.to(room.id).emit('deltaUpdate', room.getDelta());
}

/**
 * Broadcast the updated room list to ALL connected sockets (lobby refresh).
 */
function broadcastRoomList(io) {
    io.emit('roomList', roomManager.listRooms());
}

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Send room list on connect
        socket.emit('roomList', roomManager.listRooms());

        // ── Create Room ──
        socket.on('createRoom', ({ name, playerName }) => {
            // Leave current room if any
            _leaveCurrentRoom(io, socket);

            const roomName = (name || 'Unnamed Room').trim().substring(0, 30);
            const room = roomManager.createRoom(roomName, socket.id);

            // Wire up callbacks for this room
            _wireRoomCallbacks(io, room);

            // Join Socket.io room channel
            socket.join(room.id);

            // Add player to room (createRoom creates the Room but doesn't add the host as a player)
            const result = roomManager.joinRoom(room.id, socket.id, playerName);

            console.log(`Room "${roomName}" (${room.id}) created by ${socket.id} (as ${playerName})`);

            // Send init to the creator
            socket.emit('roomCreated', { roomId: room.id, roomName: room.name });
            socket.emit('init', {
                yourId: socket.id,
                roomId: room.id,
                roomName: room.name,
                ...room.getState(),
            });

            broadcastRoomList(io);
        });

        // ── Join Room ──
        socket.on('joinRoom', ({ roomId, playerName }) => {
            // Leave current room if any
            _leaveCurrentRoom(io, socket);

            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Join Socket.io room channel
            socket.join(room.id);

            // Add player to room
            const result = roomManager.joinRoom(room.id, socket.id, playerName);
            if (!result) {
                socket.emit('error', { message: 'Failed to join room' });
                return;
            }

            // Wire callbacks if not already
            _wireRoomCallbacks(io, room);

            console.log(`Player ${socket.id} (${playerName}) joined room "${room.name}" (${room.id})`);

            // Send init to the joining player
            socket.emit('init', {
                yourId: socket.id,
                roomId: room.id,
                roomName: room.name,
                ...room.getState(),
            });

            broadcastRoomState(io, room);
            broadcastRoomList(io);
        });

        // ── List Rooms ──
        socket.on('listRooms', () => {
            socket.emit('roomList', roomManager.listRooms());
        });

        // ── Ping/Pong (Latency) ──
        socket.on('ping', () => {
            socket.emit('pong');
        });

        // ── Leave Room ──
        socket.on('leaveRoom', () => {
            _leaveCurrentRoom(io, socket);
            socket.emit('leftRoom');
            broadcastRoomList(io);
        });

        // ── Move ──
        socket.on('move', ({ dx, dy }) => {
            const room = roomManager.getRoomByPlayer(socket.id);
            if (!room) return;

            const moved = room.movePlayer(socket.id, dx, dy);
            if (moved) {
                const p = room.getPlayer(socket.id);
                const tile = room.getTile(p.x, p.y);
                if (tile && tile.type === TILE.FOOD) {
                    room.eatFood(socket.id);
                    room.damageTile(p.x, p.y, 999);
                }
                broadcastRoomDelta(io, room);
            }
        });

        // ── Break Block ──
        socket.on('breakBlock', () => {
            const room = roomManager.getRoomByPlayer(socket.id);
            if (!room) return;

            const facing = room.getFacingTile(socket.id);
            if (!facing) return;

            const result = room.damageTile(facing.x, facing.y, 1, socket.id);
            if (result) {
                // Not dispatching a single tileUpdate event anymore because broadcastRoomDelta handles it efficiently
                broadcastRoomDelta(io, room);
            }
        });

        // ── Attack ──
        socket.on('attack', () => {
            const room = roomManager.getRoomByPlayer(socket.id);
            if (!room) return;

            const facing = room.getFacingTile(socket.id);
            if (!facing) return;

            const targetMob = room.getMobAt(facing.x, facing.y);
            if (targetMob) {
                const died = room.damageMob(targetMob.id, PLAYER_ATTACK_DAMAGE, socket.id);
                if (died) {
                    console.log(`Mob ${targetMob.id} killed by ${socket.id} in room ${room.id}`);
                }
                broadcastRoomDelta(io, room);
            }
        });

        // ── Disconnect ──
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            _leaveCurrentRoom(io, socket);
            broadcastRoomList(io);
        });
    });
}

/**
 * Leave (and potentially destroy) the player's current room.
 */
function _leaveCurrentRoom(io, socket) {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    const roomId = room.id;
    socket.leave(roomId);
    roomManager.leaveRoom(socket.id);

    // Notify remaining players
    io.to(roomId).emit('playerLeft', { id: socket.id });
    const stillExists = roomManager.getRoom(roomId);
    if (stillExists) {
        broadcastRoomState(io, stillExists);
    }
}

/**
 * Wire up the onStateChange / onPlayerDied callbacks for a room.
 * Safe to call multiple times — just overwrites.
 */
function _wireRoomCallbacks(io, room) {
    room.onStateChange = (r) => {
        broadcastRoomDelta(io, r);
    };

    room.onLeaderboardUpdate = (r, leaderboard) => {
        io.to(r.id).emit('leaderboard', leaderboard);
    };

    room.onSavePlayerStats = async (p) => {
        try {
            // For hackathon: socket.id acts as a generated device/player ID from the frontend
            const survivalSecs = Math.floor((Date.now() - p.joinedAt) / 1000);
            await PlayerStats.findOneAndUpdate(
                { playerId: p.id },
                {
                    $set: { nickname: p.name },
                    $inc: {
                        totalScore: p.score,
                        totalKills: p.kills,
                        totalDeaths: p.deaths,
                        blocksBroken: p.blocksBroken,
                        gamesPlayed: 1
                    },
                    $max: { bestSurvivalTimeSeconds: survivalSecs },
                    $currentDate: { lastPlayedAt: true }
                },
                { upsert: true } // Create if doesn't exist
            );
        } catch (err) {
            console.error('Failed to save player stats to MongoDB:', err);
        }
    };

    room.onPlayerDied = (r, playerId) => {
        console.log(`Player ${playerId} killed by a mob in room ${r.id}`);
        const p = r.getPlayer(playerId);
        if (p) {
            const spawn = r.findRandomGrassTile();
            p.x = spawn.x;
            p.y = spawn.y;
            p.health = 100;
            p.hunger = 100;
            io.to(playerId).emit('respawn', { x: p.x, y: p.y });
        }
    };
}

module.exports = { setupSocketHandlers };

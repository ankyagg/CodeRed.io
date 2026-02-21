// HOOP-4 WebSocket Game Server
// Run with: node server.js

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { randomBytes } from 'crypto';
import { networkInterfaces } from 'os';
import { execSync } from 'child_process';

const PORT = 3004;

// ── LAN IP detection (PowerShell + fallback) ─────────────────────────────
function getAllLanIps() {
    const skip = ['vmware', 'vmnet', 'virtualbox', 'vethernet', 'hyper-v', 'loopback'];
    const ok = ({ iface, ip }) => ip && !skip.some(p => iface.toLowerCase().includes(p));

    // 1) Try PowerShell — gets Wi-Fi even when Node misses it on Windows
    try {
        const raw = execSync(
            `powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Select-Object InterfaceAlias,IPAddress | ConvertTo-Json"`,
            { timeout: 5000, encoding: 'utf8' }
        ).trim();
        const rows = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [JSON.parse(raw)];
        const ips = rows
            .map(r => ({ iface: r.InterfaceAlias ?? '', ip: r.IPAddress ?? '' }))
            .filter(ok);
        if (ips.length) return ips;
    } catch (_) { /* PowerShell unavailable */ }

    // 2) Fallback: os.networkInterfaces()
    const nets = networkInterfaces();
    return Object.entries(nets).flatMap(([name, addrs]) =>
        (addrs ?? [])
            .filter(a => a.family === 'IPv4' && !a.internal)
            .map(a => ({ iface: name, ip: a.address }))
            .filter(ok)
    );
}

const LAN_IPS = getAllLanIps();
const LAN_IP = LAN_IPS[0]?.ip ?? 'localhost';

// ── Room store ────────────────────────────────────────────────────────────────
// rooms[id] = { id, name, players: [{ws, name, playerId}], status, currentPlayer }
const rooms = new Map();

function makeId() {
    return randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F2B1"
}

function safeJson(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch (_) { }
}

function broadcast(room, obj, excludeWs = null) {
    for (const p of room.players) {
        if (p.ws !== excludeWs && p.ws.readyState === 1 /*OPEN*/) {
            safeJson(p.ws, obj);
        }
    }
}

function broadcastAll(room, obj) {
    broadcast(room, obj, null);
}

function publicRooms() {
    const list = [];
    for (const [id, room] of rooms) {
        list.push({
            id,
            name: room.name,
            players: room.players.length,
            status: room.status,
            host: room.players[0]?.name ?? '?',
        });
    }
    return list;
}

function sendRoomsList(ws) {
    safeJson(ws, { type: 'ROOMS_LIST', rooms: publicRooms() });
}

function broadcastRoomsListToAll() {
    const list = publicRooms();
    for (const room of rooms.values()) {
        broadcastAll(room, { type: 'ROOMS_LIST', rooms: list });
    }
    // Also send to all unroomed connections — tracked separately
    for (const ws of lobbyClients) {
        if (ws.readyState === 1) safeJson(ws, { type: 'ROOMS_LIST', rooms: list });
    }
}

// Track clients not yet in a room (in the lobby) so they get room list updates
const lobbyClients = new Set();

// ── Message handlers ──────────────────────────────────────────────────────────
function handleMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

        case 'LIST_ROOMS': {
            sendRoomsList(ws);
            break;
        }

        case 'CREATE_ROOM': {
            const id = makeId();
            const name = (msg.roomName || 'Room').slice(0, 30).trim() || 'Room';
            const room = {
                id,
                name,
                players: [{ ws, name: (msg.playerName || 'Player 1').slice(0, 20), playerId: 1 }],
                status: 'waiting',
                currentPlayer: 1,
            };
            rooms.set(id, room);
            ws._roomId = id;
            ws._playerId = 1;
            lobbyClients.delete(ws); // moved out of lobby

            safeJson(ws, { type: 'ROOM_CREATED', roomId: id, playerId: 1 });
            console.log(`[Room ${id}] Created: "${name}"`);
            broadcastRoomsListToAll();
            break;
        }

        case 'JOIN_ROOM': {
            const room = rooms.get(msg.roomId);
            if (!room) { safeJson(ws, { type: 'ERROR', message: 'Room not found' }); return; }
            if (room.players.length >= 2) { safeJson(ws, { type: 'ERROR', message: 'Room is full' }); return; }
            if (room.status !== 'waiting') { safeJson(ws, { type: 'ERROR', message: 'Game already started' }); return; }

            room.players.push({ ws, name: (msg.playerName || 'Player 2').slice(0, 20), playerId: 2 });
            room.status = 'playing';
            ws._roomId = room.id;
            ws._playerId = 2;
            lobbyClients.delete(ws);

            // Tell P2 they joined
            safeJson(ws, { type: 'ROOM_JOINED', roomId: room.id, playerId: 2 });

            // Start game for both
            const startMsg = {
                type: 'GAME_START',
                currentPlayer: 1,
                p1Name: room.players[0].name,
                p2Name: room.players[1].name,
            };
            broadcastAll(room, startMsg);
            console.log(`[Room ${room.id}] Game started`);
            broadcastRoomsListToAll();
            break;
        }

        case 'THROW_START': {
            // Active player just released — broadcast velocity to opponent so they
            // can simulate the same ball flight locally (real-time visual sync)
            const room = rooms.get(ws._roomId);
            if (!room || room.status !== 'playing') return;
            if (ws._playerId !== room.currentPlayer) return; // only current player can throw

            // Relay to OPPONENT only (sender already launched locally)
            broadcast(room, {
                type: 'THROW_START',
                vx: msg.vx,
                vy: msg.vy,
                player: ws._playerId,
            }, ws /* exclude sender */);

            console.log(`[Room ${room.id}] P${ws._playerId} threw vx=${msg.vx?.toFixed(2)} vy=${msg.vy?.toFixed(2)}`);
            break;
        }

        case 'THROW': {
            // A player threw the ball. They report the result (col, row or -1/-1 for miss).
            const room = rooms.get(ws._roomId);
            if (!room || room.status !== 'playing') return;
            if (ws._playerId !== room.currentPlayer) {
                safeJson(ws, { type: 'ERROR', message: 'Not your turn' });
                return;
            }

            const { col, row } = msg; // -1,-1 means miss
            const nextPlayer = room.currentPlayer === 1 ? 2 : 1;
            room.currentPlayer = nextPlayer;

            const result = { type: 'TURN_RESULT', col, row, player: ws._playerId, nextPlayer };
            broadcastAll(room, result);

            console.log(`[Room ${room.id}] P${ws._playerId} → col=${col} row=${row} | next=${nextPlayer}`);
            break;
        }

        case 'GAME_OVER': {
            // A client declares a winner (after local win check)
            const room = rooms.get(ws._roomId);
            if (!room) return;
            room.status = 'finished';
            broadcastAll(room, { type: 'GAME_OVER', winner: msg.winner });
            setTimeout(() => {
                rooms.delete(room.id);
                broadcastRoomsListToAll();
            }, 5000);
            break;
        }

        default:
            console.warn('Unknown message type:', msg.type);
    }
}

// ── Connection lifecycle ──────────────────────────────────────────────────────
function handleClose(ws) {
    lobbyClients.delete(ws);

    const roomId = ws._roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const idx = room.players.findIndex(p => p.ws === ws);
    if (idx === -1) return;

    const left = room.players[idx];
    room.players.splice(idx, 1);
    console.log(`[Room ${roomId}] P${left.playerId} disconnected`);

    if (room.players.length === 0) {
        rooms.delete(roomId);
    } else {
        broadcast(room, { type: 'OPPONENT_LEFT', playerId: left.playerId });
        rooms.delete(roomId);
    }

    broadcastRoomsListToAll();
}

// ── HTTP server (serves /info endpoint + upgrades to WS) ─────────────────────
const server = createServer((req, res) => {
    if (req.url === '/info') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        });
        // Send ALL available IPs so the client can display all share-links
        res.end(JSON.stringify({
            lanIp: LAN_IP,
            port: PORT,
            gameUrl: `http://${LAN_IP}:5176`,
            wsUrl: `ws://${LAN_IP}:${PORT}`,
            allLinks: LAN_IPS.map(({ iface, ip }) => ({
                iface,
                gameUrl: `http://${ip}:5176`,
                wsUrl: `ws://${ip}:${PORT}`,
            })),
        }));
        return;
    }
    res.writeHead(404); res.end('Not found');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    lobbyClients.add(ws); // track until they join a room
    sendRoomsList(ws);    // send current rooms immediately

    ws.on('message', (data) => handleMessage(ws, data.toString()));
    ws.on('close', () => handleClose(ws));
    ws.on('error', (err) => console.error('WS error:', err.message));
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   🏀  HOOP-4 Multiplayer Server  (3004)  ║');
    console.log('╚══════════════════════════════════════════╝\n');
    console.log('  WS Backend  → ws://localhost:3004');
    console.log('  Frontend    → http://localhost:5176  (or via proxy :4000/hoop)');
    console.log('  Proxy       → http://localhost:4000/hoop');
    console.log('');
});

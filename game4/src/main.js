import Multiplayer from './multiplayer.js';
import Game from './Game.js';
import * as C from './Constants.js';

// ── State ─────────────────────────────────────────────────────────────────────
let mp = null;
let playerName = 'Player';
let game = null;

// ── LAN share URLs (all interfaces) ──────────────────────────────────────────
async function loadLanUrl() {
    const banner = document.getElementById('lan-banner');
    try {
        const isDirect = window.location.port === '5176';
        const infoUrl = isDirect
            ? `http://${window.location.hostname}:3004/info`
            : `/hoop-ws/info`;
        const res = await fetch(infoUrl);
        const info = await res.json();

        // Render each available network link as its own row
        const links = info.allLinks?.length ? info.allLinks : [{ iface: 'Network', gameUrl: info.gameUrl }];

        // Replace the single-url placeholder with multiple rows
        const urlEl = document.getElementById('lan-url');
        const copyEl = document.getElementById('lan-copy-btn');

        if (urlEl && links.length === 1) {
            // Single IP — original simple display
            urlEl.textContent = links[0].gameUrl;
            copyEl?.addEventListener('click', () => {
                navigator.clipboard.writeText(links[0].gameUrl);
                copyEl.textContent = '✅ Copied!';
                setTimeout(() => copyEl.textContent = 'Copy', 2000);
            });
        } else if (urlEl) {
            // Multiple IPs — replace with a list
            const parent = urlEl.closest('.lan-url-row') || urlEl.parentElement;
            parent.innerHTML = links.map(l =>
                `<div class="lan-link-row">
                    <span class="lan-iface">${escHtml(l.iface)}</span>
                    <code class="lan-link-code">${escHtml(l.gameUrl)}</code>
                    <button class="copy-pill" data-url="${escHtml(l.gameUrl)}">Copy</button>
                </div>`
            ).join('');

            parent.querySelectorAll('.copy-pill[data-url]').forEach(btn => {
                btn.addEventListener('click', () => {
                    navigator.clipboard.writeText(btn.dataset.url);
                    btn.textContent = '✅';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                });
            });
        }

        if (banner) banner.classList.remove('hidden');
    } catch { /* server offline — skip banner */ }
}

// ── DOM refs ──────────────────────────────────────────────────────────────────
const lobbyScreen = document.getElementById('lobby-screen');
const waitScreen = document.getElementById('wait-screen');
const gameScreen = document.getElementById('game-screen');
const canvas = document.getElementById('game-canvas');

const createForm = document.getElementById('create-form');
const nameInput = document.getElementById('player-name');
const roomInput = document.getElementById('room-name-input');
const createBtn = document.getElementById('create-btn');
const roomsList = document.getElementById('rooms-list');
const roomsStatus = document.getElementById('rooms-status');
const waitMsg = document.getElementById('wait-msg');
const waitRoomId = document.getElementById('wait-room-id');
const cancelBtn = document.getElementById('cancel-btn');
const localBtn = document.getElementById('local-btn');

// ── Screen switching ──────────────────────────────────────────────────────────
function showLobby() {
    lobbyScreen.classList.remove('hidden');
    waitScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
}
function showWait(roomId) {
    lobbyScreen.classList.add('hidden');
    waitScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    waitRoomId.textContent = roomId;
}
function showGame() {
    lobbyScreen.classList.add('hidden');
    waitScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
}

// ── Init canvas ────────────────────────────────────────────────────────────────
function initCanvas() {
    canvas.width = C.W;
    canvas.height = C.H;
}

// ── Lobby connection ──────────────────────────────────────────────────────────
async function connectToServer() {
    console.log('[Main] connectToServer start');
    mp = new Multiplayer();

    try {
        await mp.connect();
        console.log('[Main] Connected successfully');
        setLobbyStatus('✅ Connected to server');
    } catch (e) {
        console.error('[Main] Connection failed:', e);
        setLobbyStatus('⚠️ Server offline — only local play available', true);
        mp = null;
        return;
    }

    // Register server event handlers
    mp.on('ROOMS_LIST', (msg) => renderRooms(msg.rooms));

    mp.on('ROOM_CREATED', (msg) => {
        mp.roomId = msg.roomId;
        mp.playerId = msg.playerId;
        showWait(msg.roomId);
        waitMsg.textContent = `Room created! Share the Room ID with your friend.`;
    });

    mp.on('ROOM_JOINED', (msg) => {
        mp.roomId = msg.roomId;
        mp.playerId = msg.playerId;
        waitMsg.textContent = `Joined room! Starting soon…`;
    });

    mp.on('GAME_START', (msg) => {
        startMultiplayerGame(msg);
    });

    mp.on('TURN_RESULT', (msg) => {
        if (game) game.applyServerResult(msg.col, msg.row, msg.player, msg.nextPlayer);
    });

    // Opponent threw — simulate same ball flight locally so both players see it
    mp.on('THROW_START', (msg) => {
        if (game) game.applyOpponentThrow(msg.vx, msg.vy);
    });

    mp.on('GAME_OVER', (msg) => {
        if (game) {
            game.winner = msg.winner;
            game._showWinModal();
        }
    });

    mp.on('RECEIVE_CHAT', (msg) => {
        appendChatMessage(msg.player, msg.message);
    });

    mp.on('OPPONENT_LEFT', () => {
        alert('Your opponent disconnected. Returning to lobby.');
        mp.disconnect();
        mp = null;
        window.location.reload();
    });

    mp.on('ERROR', (msg) => {
        alert('Error: ' + msg.message);
    });

    // Start polling rooms list every 3 seconds
    mp.listRooms();
    setInterval(() => mp?.listRooms(), 3000);
}

function setLobbyStatus(msg, warn = false) {
    const el = document.getElementById('server-status');
    if (el) {
        el.textContent = msg.toUpperCase(); // NBA style uppercase
        el.style.color = warn ? '#FDB927' : 'rgba(255,255,255,0.6)';
    }
}

// ── Rooms rendering ───────────────────────────────────────────────────────────
function renderRooms(rooms) {
    roomsStatus.classList.add('hidden');

    const waiting = rooms.filter(r => r.status === 'waiting');
    if (waiting.length === 0) {
        roomsList.innerHTML = `<div class="no-rooms">No open rooms yet. Create one!</div>`;
        return;
    }

    roomsList.innerHTML = waiting.map(room => `
        <div class="room-card" data-id="${room.id}">
            <div class="room-info">
                <span class="room-name">${escHtml(room.name)}</span>
                <span class="room-meta">🏀 ${escHtml(room.host)} · ID: <code>${room.id}</code></span>
            </div>
            <button class="join-btn btn-yellow" data-id="${room.id}">Join</button>
        </div>
    `).join('');

    roomsList.querySelectorAll('.join-btn').forEach(btn => {
        btn.addEventListener('click', () => joinRoom(btn.dataset.id));
    });
}

// ── Actions ───────────────────────────────────────────────────────────────────
function createRoom() {
    if (!mp) { alert('Server not connected.'); return; }
    playerName = nameInput.value.trim() || 'Player 1';
    const roomName = roomInput.value.trim() || `${playerName}'s Room`;
    mp.createRoom(roomName, playerName);
}

function joinRoom(roomId) {
    if (!mp) { alert('Server not connected.'); return; }
    playerName = nameInput.value.trim() || 'Player 2';
    mp.joinRoom(roomId, playerName);
    showWait(roomId);
    waitMsg.textContent = `Joining room ${roomId}…`;
}

function startMultiplayerGame(msg) {
    showGame();
    initCanvas();
    game = new Game(canvas, {
        myPlayerId: mp.playerId,
        mp,
        p1Name: msg.p1Name,
        p2Name: msg.p2Name,
    });
    document.getElementById('p1-name-label').textContent = msg.p1Name;
    document.getElementById('p2-name-label').textContent = msg.p2Name;
    const cb = document.getElementById('chatbox');
    if (cb) cb.classList.remove('hidden');
}

function startLocalGame() {
    playerName = nameInput.value.trim() || 'Player 1';
    showGame();
    initCanvas();
    game = new Game(canvas, {
        myPlayerId: 1,
        mp: null,
        p1Name: playerName,
        p2Name: 'Player 2',
    });
    // Set HUD name labels
    const l1 = document.getElementById('p1-name-label');
    const l2 = document.getElementById('p2-name-label');
    if (l1) l1.textContent = playerName;
    if (l2) l2.textContent = 'Player 2';
}

// ── Wire up UI ────────────────────────────────────────────────────────────────
createBtn.addEventListener('click', createRoom);
roomInput.addEventListener('keydown', e => { if (e.key === 'Enter') createRoom(); });

cancelBtn?.addEventListener('click', () => {
    mp?.disconnect();
    mp = null;
    window.location.reload();
});

localBtn?.addEventListener('click', startLocalGame);

// ── Chat Logic ──
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

function appendChatMessage(author, text) {
    if (!chatMessages) return;
    const line = document.createElement('div');
    line.className = 'msg-line';
    line.innerHTML = `<span class="msg-author">[${escHtml(author)}]</span> <span class="msg-text">${escHtml(text)}</span>`;
    chatMessages.appendChild(line);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text && mp) {
        mp.sendChat(text);
        chatInput.value = '';
    }
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
console.log('[Main] Bootstrapping...');
showLobby();
connectToServer();
loadLanUrl(); // fetch and display LAN share URL

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

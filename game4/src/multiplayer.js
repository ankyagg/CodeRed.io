// Multiplayer WebSocket client wrapper
// Events emitted via callbacks

// WebSocket URL — auto-detects proxy vs direct dev-server mode:
//   • Direct (Vite on :5176)  → connect straight to WS backend on :3004
//   • Via proxy / ngrok       → use /hoop-ws path so the proxy can forward it
const isDirect = window.location.port === '5176';
const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
const WS_URL = isDirect
    ? `ws://${window.location.hostname}:3004`
    : `${wsProto}://${window.location.host}/hoop-ws`;

export default class Multiplayer {
    constructor() {
        this.ws = null;
        this.callbacks = {};
        this.roomId = null;
        this.playerId = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL);
            this.ws = ws;

            ws.onopen = () => resolve();
            ws.onerror = () => reject(new Error('Cannot connect to game server'));

            ws.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data);
                    this._dispatch(msg);
                } catch (_) { }
            };

            ws.onclose = () => {
                this._dispatch({ type: 'DISCONNECTED' });
            };
        });
    }

    on(event, cb) {
        this.callbacks[event] = cb;
        return this;
    }

    _dispatch(msg) {
        const cb = this.callbacks[msg.type];
        if (cb) cb(msg);
        const any = this.callbacks['*'];
        if (any) any(msg);
    }

    _send(obj) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(obj));
        }
    }

    listRooms() {
        this._send({ type: 'LIST_ROOMS' });
    }

    createRoom(roomName, playerName) {
        this._send({ type: 'CREATE_ROOM', roomName, playerName });
    }

    joinRoom(roomId, playerName) {
        this._send({ type: 'JOIN_ROOM', roomId, playerName });
    }

    // Send velocity immediately on throw so opponent sees the ball fly
    sendThrowStart(vx, vy) {
        this._send({ type: 'THROW_START', vx, vy });
    }

    sendThrow(col, row) {
        this._send({ type: 'THROW', roomId: this.roomId, col, row });
    }

    sendGameOver(winner) {
        this._send({ type: 'GAME_OVER', winner, roomId: this.roomId });
    }

    disconnect() {
        this.ws?.close();
    }
}

import * as C from './Constants';
import Physics from './Physics';
import Renderer from './Renderer';
import InputController from './InputController';

const makeGrid = () => Array.from({ length: C.COLS }, () => Array(C.ROWS).fill(null));

// Minimum ms the opponent's ball must be visible before result snaps in
const MIN_OPPONENT_FLIGHT_MS = 700;

export default class Game {
    constructor(canvas, { myPlayerId = 1, mp = null, p1Name = 'Player 1', p2Name = 'Player 2' } = {}) {
        this.canvas = canvas;
        this.myPlayerId = myPlayerId;
        this.mp = mp;
        this.p1Name = p1Name;
        this.p2Name = p2Name;

        this.physics = new Physics(canvas);
        this.renderer = new Renderer(canvas, this);
        this.input = new InputController(canvas, this._onThrow.bind(this));

        this.grid = makeGrid();
        this.currentPlayer = 1;
        this.gameState = 'aiming';   // aiming | flying | placing | over | draw
        this.winner = null;
        this.winLine = null;
        this.isAiming = false;
        this.scores = { 1: 0, 2: 0 };
        this.dropAnim = null;   // { col, row, player, progress }
        this.scoredFlash = null;

        this._throwTimer = null;
        this._opponentLaunchTime = null; // timestamp when opponent ball launched
        this._pendingResult = null; // TURN_RESULT that arrived before min flight time
        this._resultApplied = false; // prevent double-apply

        this._init();
    }

    // ── Setup ─────────────────────────────────────────────────────────────────
    _init() {
        this._prepTurn();
        this._loop();
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.mp?.disconnect();
            window.location.reload();
        });
    }

    // ── Turn management ───────────────────────────────────────────────────────
    _prepTurn() {
        this.gameState = 'aiming';
        this._throwTimer = null;
        this._opponentLaunchTime = null;
        this._pendingResult = null;
        this._resultApplied = false;

        const myTurn = !this.mp || this.currentPlayer === this.myPlayerId;
        this.isAiming = myTurn;

        if (myTurn) {
            this.physics.spawnBall();
            this.input.enable();
        } else {
            // Opponent's turn: no ball yet — wait for THROW_START
            this.physics.removeActiveBall();
            this.input.disable();
        }
        this._updateHUD();
    }

    // ── My throw ─────────────────────────────────────────────────────────────
    _onThrow(vx, vy) {
        if (this.gameState !== 'aiming' || !this.isAiming) return;
        this.isAiming = false;
        this.gameState = 'flying';
        this.input.disable();

        if (this.mp) this.mp.sendThrowStart(vx, vy); // tell opponent's screen to animate
        this.physics.launch(vx, vy);
        this._setStatus('Watching…');
    }

    // ── Opponent throw received from server ───────────────────────────────────
    applyOpponentThrow(vx, vy) {
        // Only accept while awaiting opponent's throw
        if (this.gameState !== 'aiming' || this.isAiming) return;

        this.gameState = 'flying';
        this._opponentLaunchTime = Date.now();
        this._resultApplied = false;

        this.physics.spawnBall();
        this.physics.launch(vx, vy);

        const name = this.currentPlayer === 1 ? this.p1Name : this.p2Name;
        this._setStatus(`${name} shoots! 🏀`);

        // If TURN_RESULT already arrived (extremely fast LAN + near-instant score),
        // apply it after the guaranteed minimum flight window
        if (this._pendingResult) {
            const r = this._pendingResult;
            this._pendingResult = null;
            setTimeout(() => this._finalizeResult(r.col, r.row, r.player, r.nextPlayer), MIN_OPPONENT_FLIGHT_MS);
        }
    }

    // ── Game loop ─────────────────────────────────────────────────────────────
    _loop() {
        const dt = 1000 / 60;

        if (this.isAiming && this.gameState === 'aiming') {
            this.physics.pinAtSpawn();
        }

        this.physics.update(dt);

        // Advance drop animation
        if (this.dropAnim) {
            this.dropAnim.progress = Math.min(1, this.dropAnim.progress + 0.055);
            if (this.dropAnim.progress >= 1) this.dropAnim = null;
        }

        this._tick();
        this.renderer.render();
        requestAnimationFrame(() => this._loop());
    }

    _tick() {
        if (this.gameState !== 'flying') return;

        const isMyBall = !this.mp || this.currentPlayer === this.myPlayerId;

        if (isMyBall) {
            // ── Active player: detect score/miss ──────────────────────────────
            const col = this.physics.detectHoopScore();
            if (col !== -1) {
                const row = this._findRow(col);
                if (row !== -1) { this._onScore(col, row); return; }
                else { this._onMiss(); return; }
            }
            if (this.physics.isOutOfBounds()) { this._onMiss(); return; }

            if (!this._throwTimer) this._throwTimer = Date.now();
            if (Date.now() - this._throwTimer > 9000 || this.physics.isBallSettled()) {
                this._onMiss();
            }
        } else {
            // ── Waiting player: just watch — don't detect anything ─────────────
            // Silently clean up if ball escapes bounds (result comes from server)
            if (this.physics.isOutOfBounds()) {
                this.physics.removeActiveBall();
                // Stay in 'flying' — TURN_RESULT from server will finalize
            }
        }
    }

    // ── Active player scored ──────────────────────────────────────────────────
    _onScore(col, row) {
        this._throwTimer = null;
        this.physics.removeActiveBall();
        this.gameState = 'placing';

        // ★ Start drop animation IMMEDIATELY — no waiting for server round-trip
        this._beginDrop(col, row, this.currentPlayer);

        if (this.mp) {
            this.mp.sendThrow(col, row);
            // TURN_RESULT will call applyServerResult → _finalizeResult
        } else {
            const next = this.currentPlayer === 1 ? 2 : 1;
            this._finalizeResult(col, row, this.currentPlayer, next);
        }
    }

    // ── Active player missed ──────────────────────────────────────────────────
    _onMiss() {
        this._throwTimer = null;
        this.physics.removeActiveBall();
        this.gameState = 'placing';
        const next = this.currentPlayer === 1 ? 2 : 1;

        if (this.mp) {
            this.mp.sendThrow(-1, -1);
        } else {
            this.currentPlayer = next;
            setTimeout(() => this._afterPlace(), 380);
        }
    }

    // ── Server result (from main.js, for both players) ────────────────────────
    applyServerResult(col, row, player, nextPlayer) {
        if (this._resultApplied) return; // guard against duplicate calls
        this._resultApplied = true;

        const isMyBall = !this.mp || player === this.myPlayerId;

        if (isMyBall) {
            // Active player: drop already started in _onScore — just finalize grid
            this.physics.removeActiveBall();
            this.gameState = 'placing';
            this._finalizeResult(col, row, player, nextPlayer);
        } else {
            // Waiting player: enforce minimum flight time so ball is always visible
            const elapsed = this._opponentLaunchTime ? Date.now() - this._opponentLaunchTime : 9999;
            const remaining = MIN_OPPONENT_FLIGHT_MS - elapsed;

            if (remaining > 0 && this.gameState === 'flying') {
                // Store and apply after minimum window
                this._pendingResult = { col, row, player, nextPlayer };
                setTimeout(() => {
                    if (this._pendingResult) {
                        const r = this._pendingResult;
                        this._pendingResult = null;
                        this._applyOpponentResult(r.col, r.row, r.player, r.nextPlayer);
                    }
                }, remaining);
            } else {
                this._applyOpponentResult(col, row, player, nextPlayer);
            }
        }
    }

    // Apply result visually for the waiting player
    _applyOpponentResult(col, row, player, nextPlayer) {
        this.physics.removeActiveBall();
        this.gameState = 'placing';

        if (col !== -1 && row !== -1) {
            this._beginDrop(col, row, player);
            this._finalizeResult(col, row, player, nextPlayer);
        } else {
            // Miss — just switch turns
            this.currentPlayer = nextPlayer;
            setTimeout(() => this._afterPlace(), 380);
        }
    }

    // ── Core: place in grid, check win, schedule next turn ───────────────────
    _beginDrop(col, row, player) {
        this.dropAnim = { col, row, player, progress: 0 };
        this.scoredFlash = { col, row };
        setTimeout(() => { this.scoredFlash = null; }, 900);
    }

    _finalizeResult(col, row, player, nextPlayer) {
        if (col === -1 || row === -1) {
            // Miss path (local only)
            this.currentPlayer = nextPlayer;
            setTimeout(() => this._afterPlace(), 380);
            return;
        }

        // Place ball in grid
        this.grid[col][row] = player;

        const win = this._checkWin();
        if (win) {
            this.winner = win.player;
            this.winLine = win.line;
            this.gameState = 'over';
            this.scores[win.player]++;
            this.physics.removeActiveBall(); // clear any spawn ball
            this._updateHUD();               // update score badges immediately
            if (this.mp) this.mp.sendGameOver(this.winner);
            // Delay modal so drop animation finishes first
            setTimeout(() => this._showWinModal(), 750);
        } else if (this._isBoardFull()) {
            this.gameState = 'draw';
            this.physics.removeActiveBall();
            this._updateHUD();
            if (this.mp) this.mp.sendGameOver(0);
            setTimeout(() => this._showDrawModal(), 750);
        } else {
            this.currentPlayer = nextPlayer;
            // Delay next turn so drop animation completes before new ball appears
            setTimeout(() => this._afterPlace(), 820);
        }
    }

    _afterPlace() {
        if (this.gameState === 'over' || this.gameState === 'draw') return;
        this._prepTurn();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    _findRow(col) {
        for (let r = 0; r < C.ROWS; r++) {
            if (!this.grid[col][r]) return r;
        }
        return -1;
    }

    _isBoardFull() {
        return this.grid.every(col => col.every(cell => cell !== null));
    }

    // ── Win check ─────────────────────────────────────────────────────────────
    _checkWin() {
        const g = this.grid;
        const m = (cells) => { const p = cells[0]; return p && cells.every(c => c === p) ? p : null; };

        for (let r = 0; r < C.ROWS; r++)
            for (let c = 0; c <= C.COLS - 4; c++) {
                const p = m([g[c][r], g[c + 1][r], g[c + 2][r], g[c + 3][r]]);
                if (p) return { player: p, line: [{ c, r }, { c: c + 1, r }, { c: c + 2, r }, { c: c + 3, r }] };
            }
        for (let c = 0; c < C.COLS; c++)
            for (let r = 0; r <= C.ROWS - 4; r++) {
                const p = m([g[c][r], g[c][r + 1], g[c][r + 2], g[c][r + 3]]);
                if (p) return { player: p, line: [{ c, r }, { c, r: r + 1 }, { c, r: r + 2 }, { c, r: r + 3 }] };
            }
        for (let c = 0; c <= C.COLS - 4; c++)
            for (let r = 0; r <= C.ROWS - 4; r++) {
                const p = m([g[c][r], g[c + 1][r + 1], g[c + 2][r + 2], g[c + 3][r + 3]]);
                if (p) return { player: p, line: [{ c, r }, { c: c + 1, r: r + 1 }, { c: c + 2, r: r + 2 }, { c: c + 3, r: r + 3 }] };
            }
        for (let c = 3; c < C.COLS; c++)
            for (let r = 0; r <= C.ROWS - 4; r++) {
                const p = m([g[c][r], g[c - 1][r + 1], g[c - 2][r + 2], g[c - 3][r + 3]]);
                if (p) return { player: p, line: [{ c, r }, { c: c - 1, r: r + 1 }, { c: c - 2, r: r + 2 }, { c: c - 3, r: r + 3 }] };
            }
        return null;
    }

    // ── HUD ───────────────────────────────────────────────────────────────────
    _updateHUD() {
        document.getElementById('p1-indicator')?.classList.toggle('active', this.currentPlayer === 1);
        document.getElementById('p2-indicator')?.classList.toggle('active', this.currentPlayer === 2);

        // Always update score badges
        const s1 = document.getElementById('p1-score');
        const s2 = document.getElementById('p2-score');
        if (s1) s1.textContent = this.scores[1];
        if (s2) s2.textContent = this.scores[2];

        // Don't overwrite "Game Over!" / "Draw!" status messages
        if (this.gameState === 'over' || this.gameState === 'draw') return;

        const isMyTurn = !this.mp || this.currentPlayer === this.myPlayerId;
        const name = this.currentPlayer === 1 ? this.p1Name : this.p2Name;
        this._setStatus(isMyTurn ? '🏀 Your Turn — drag & release!' : `⏳ ${name}'s turn…`);
    }

    _setStatus(msg) {
        const el = document.getElementById('status-message');
        if (el) el.innerText = msg;
    }

    _showWinModal() {
        if (this.gameState !== 'over') return;
        document.getElementById('win-modal')?.classList.remove('hidden');
        const t = document.getElementById('winner-text');
        const isMe = !this.mp || this.winner === this.myPlayerId;
        t.innerText = isMe ? '🎉 You Win!' : `${this.winner === 1 ? this.p1Name : this.p2Name} Wins!`;
        t.style.color = this.winner === 1 ? C.COLORS.P1 : C.COLORS.P2;
        document.getElementById('win-subtext').textContent = isMe ? 'Outstanding shot! 🏆' : 'Better luck next time!';
        this._setStatus('Game Over!');
    }

    _showDrawModal() {
        document.getElementById('win-modal')?.classList.remove('hidden');
        const t = document.getElementById('winner-text');
        t.innerText = "It's a Draw!";
        t.style.color = '#94a3b8';
        document.getElementById('win-subtext').textContent = 'The board is full — no winner!';
        this._setStatus('Draw!');
    }
}

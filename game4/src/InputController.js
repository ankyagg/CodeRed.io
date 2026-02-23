
import { PHYSICS } from './Constants';
import * as C from './Constants';

export default class InputController {
    constructor(canvas, onThrow) {
        this.canvas = canvas;
        this.onThrow = onThrow;
        this.disabled = true;
        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this._setupListeners();
    }

    _toCanvas(cx, cy) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
    }

    _setupListeners() {
        this.canvas.addEventListener('mousedown', e => { e.preventDefault(); this._start(e.clientX, e.clientY); });
        document.addEventListener('mousemove', e => this._move(e.clientX, e.clientY));
        document.addEventListener('mouseup', () => this._end());

        this.canvas.addEventListener('touchstart', e => { e.preventDefault(); this._start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        document.addEventListener('touchmove', e => { if (this.isDragging) this._move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        document.addEventListener('touchend', () => this._end());
    }

    _start(cx, cy) {
        if (this.disabled) return;
        this.isDragging = true;
        this.startPos = { x: C.SPAWN.x, y: C.SPAWN.y };
        this.currentPos = this._toCanvas(cx, cy);
    }

    _move(cx, cy) {
        if (!this.isDragging || this.disabled) return;
        this.currentPos = this._toCanvas(cx, cy);
    }

    _getLaunchVelocity(dx, dy) {
        let vx = dx * 0.12, vy = dy * 0.12;
        const G = C.GRAVITY * 0.001 * Math.pow(1000 / 60, 2);
        const FRICTION = 1 - 0.015;

        // 1. Simulate trajectory to see where it crosses the hoops
        let px = C.SPAWN.x, py = C.SPAWN.y;
        let simVx = vx, simVy = vy;
        let crossX = null;

        for (let i = 0; i < 150; i++) {
            let ppy = py, ppx = px;
            simVx *= FRICTION;
            simVy = (simVy * FRICTION) + G;
            px += simVx;
            py += simVy;

            // Only care about falling DOWN through the hoop plane
            if (ppy < C.HOOP_Y && py >= C.HOOP_Y) {
                const t = (C.HOOP_Y - ppy) / (py - ppy);
                crossX = ppx + t * (px - ppx);
                break;
            }
        }

        // 2. Aim Assist: Snap to exact hoop center
        if (crossX !== null) {
            const col = Math.floor((crossX - C.GRID_LEFT) / C.CELL_W);
            // Must be within a valid column
            if (col >= 0 && col < C.COLS) {
                const targetX = C.GRID_LEFT + col * C.CELL_W + C.CELL_W / 2;
                const curDelta = crossX - C.SPAWN.x;
                const tgtDelta = targetX - C.SPAWN.x;
                // Scale lateral velocity to precisely hit the target center
                if (Math.abs(curDelta) > 0.01) {
                    vx = vx * (tgtDelta / curDelta);
                }
            }
        }

        return { vx, vy };
    }

    _end() {
        if (!this.isDragging || this.disabled) return;
        this.isDragging = false;

        const dx = this.startPos.x - this.currentPos.x;
        const dy = this.startPos.y - this.currentPos.y;
        if (Math.hypot(dx, dy) < 6) return;

        const { vx, vy } = this._getLaunchVelocity(dx, dy);

        if (Math.hypot(vx, vy) < 0.3) return;
        this.onThrow(vx, vy);
    }

    // Preview arc
    getPoints() {
        if (!this.isDragging) return [];
        const dx = this.startPos.x - this.currentPos.x;
        const dy = this.startPos.y - this.currentPos.y;
        if (Math.hypot(dx, dy) < 6) return [];

        let { vx, vy } = this._getLaunchVelocity(dx, dy);
        let px = C.SPAWN.x, py = C.SPAWN.y;
        const pts = [];
        const G = C.GRAVITY * 0.001 * Math.pow(1000 / 60, 2);
        const FRICTION = 1 - 0.015;

        for (let i = 0; i < 140; i++) {
            pts.push({ x: px, y: py });
            vx *= FRICTION;
            vy = (vy * FRICTION) + G;
            px += vx;
            py += vy;
            if (py > C.H + 100) break;
        }
        return pts;
    }

    getTrajectoryPoints() { return this.getPoints(); }

    enable() { this.disabled = false; this.isDragging = false; }
    disable() { this.disabled = true; this.isDragging = false; }
}


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

    _end() {
        if (!this.isDragging || this.disabled) return;
        this.isDragging = false;

        const dx = this.startPos.x - this.currentPos.x;
        const dy = this.startPos.y - this.currentPos.y;

        // Generous velocity scale so even small drags produce visible throws
        const VEL = 0.12;
        const vx = dx * VEL;
        const vy = dy * VEL;

        if (Math.hypot(vx, vy) < 0.3) return;
        this.onThrow(vx, vy);
    }

    // Preview arc
    getPoints() {
        if (!this.isDragging) return [];
        const dx = this.startPos.x - this.currentPos.x;
        const dy = this.startPos.y - this.currentPos.y;
        if (Math.hypot(dx, dy) < 6) return [];

        const VEL = 0.12;
        let vx = dx * VEL, vy = dy * VEL;
        let px = C.SPAWN.x, py = C.SPAWN.y;
        const pts = [];
        const G = 0.9; // approx gravity per tick (matches Matter.js 60fps)

        for (let i = 0; i < 80; i++) {
            pts.push({ x: px, y: py });
            vx *= 0.99;
            vy += G;
            px += vx;
            py += vy;
            if (py > C.GRID_BOTTOM + 40) break;
        }
        return pts;
    }

    getTrajectoryPoints() { return this.getPoints(); }

    enable() { this.disabled = false; this.isDragging = false; }
    disable() { this.disabled = true; this.isDragging = false; }
}

import * as C from './Constants';

// ── Colour helpers ────────────────────────────────────────────────────────────
function hexRgb(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function lighter(h, a) { const [r, g, b] = hexRgb(h); return `rgb(${Math.min(255, r + a)},${Math.min(255, g + a)},${Math.min(255, b + a)})`; }
function darker(h, a) { const [r, g, b] = hexRgb(h); return `rgb(${Math.max(0, r - a)},${Math.max(0, g - a)},${Math.max(0, b - a)})`; }

// Easing for drop animation
function easeOutBounce(t) {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
    if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
    t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
}

export default class Renderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.game = game;
        this.W = canvas.width;
        this.H = canvas.height;
        this._t = 0; // frame counter
    }

    render() {
        this._t++;
        const { ctx, W, H } = this;
        ctx.clearRect(0, 0, W, H);

        this._drawBg();
        this._drawCourtArea();
        this._drawHoops();
        this._drawGridPanel();
        this._drawGridBalls();
        this._drawDropAnim();
        this._drawActiveBall();
        this._drawSpawnHint();
        this._drawTrajectory();
        this._drawWinLine();
    }

    // ── Background ────────────────────────────────────────────────────────────
    _drawBg() {
        // Transparent so CSS arena_bg.png shows through
        const { ctx, W, H } = this;
        ctx.clearRect(0, 0, W, H);
    }

    // ── Court floor (below grid) ──────────────────────────────────────────────
    _drawCourtArea() {
        // Removed to allow CSS full-width floor.
    }

    // ── Basketball hoops ──────────────────────────────────────────────────────
    _drawHoops() {
        for (let col = 0; col < C.COLS; col++) this._drawHoop(col);
    }

    _drawHoop(col) {
        const { ctx } = this;
        const cx = C.GRID_LEFT + col * C.CELL_W + C.CELL_W / 2;
        const hy = C.HOOP_Y;
        const hw = C.HOOP_W / 2;

        // ── Backboard ──
        const bbTop = hy - 35;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(cx - hw - 4, bbTop, (hw + 4) * 2, 16, 1);
        ctx.fill();
        // Red target box
        ctx.strokeStyle = '#C8102E';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(cx - 9, bbTop + 3, 18, 9);

        // ── Net ──
        const netT = hy + 5;
        const netB = hy + 30;
        const nW = hw * 0.85;
        const nShrk = nW * 0.38;
        const segs = 6;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const x0 = cx - nW + t * nW * 2;
            const x1 = cx - (nW - nShrk) + t * (nW - nShrk) * 2;
            ctx.beginPath();
            ctx.moveTo(x0, netT);
            ctx.bezierCurveTo(x0, netT + 12, x1, netB - 8, x1, netB);
            ctx.stroke();
        }

        // ── Rim ──
        const rimGrad = ctx.createLinearGradient(cx - hw, hy - 4, cx + hw, hy + 6);
        rimGrad.addColorStop(0, '#ff4d4d');
        rimGrad.addColorStop(0.5, '#C8102E');
        rimGrad.addColorStop(1, '#8B0000');
        ctx.beginPath();
        ctx.ellipse(cx, hy, hw, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = rimGrad;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, hy + 1, hw * 0.78, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fill();
    }

    // ── Metallic grid panel ──────────────────────────────────────────────────
    _drawGridPanel() {
        const { ctx } = this;
        const L = C.GRID_LEFT;
        const T = C.GRID_TOP;
        const PW = C.COLS * C.CELL_W;
        const PH = C.ROWS * C.CELL_H;
        const D = 10;

        // Sides
        ctx.fillStyle = '#0a1018';
        ctx.beginPath();
        ctx.moveTo(L + PW, T);
        ctx.lineTo(L + PW + D, T + D);
        ctx.lineTo(L + PW + D, T + PH + D);
        ctx.lineTo(L + PW, T + PH);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#05080c';
        ctx.beginPath();
        ctx.moveTo(L, T + PH);
        ctx.lineTo(L + D, T + PH + D);
        ctx.lineTo(L + PW + D, T + PH + D);
        ctx.lineTo(L + PW, T + PH);
        ctx.closePath();
        ctx.fill();

        // Front Face
        const g = ctx.createLinearGradient(L, T, L, T + PH);
        g.addColorStop(0, '#101a2a');
        g.addColorStop(0.5, '#0c121c');
        g.addColorStop(1, '#080c14');
        ctx.fillStyle = g;
        ctx.fillRect(L, T, PW, PH);

        // Sheen
        const sh = ctx.createLinearGradient(L, T, L, T + PH * 0.5);
        sh.addColorStop(0, 'rgba(255,255,255,0.08)');
        sh.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sh;
        ctx.fillRect(L, T, PW, PH * 0.5);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let c = 0; c <= C.COLS; c++) {
            ctx.beginPath(); ctx.moveTo(L + c * C.CELL_W, T); ctx.lineTo(L + c * C.CELL_W, T + PH); ctx.stroke();
        }
        for (let r = 0; r <= C.ROWS; r++) {
            ctx.beginPath(); ctx.moveTo(L, T + r * C.CELL_H); ctx.lineTo(L + PW, T + r * C.CELL_H); ctx.stroke();
        }

        // Holes
        for (let col = 0; col < C.COLS; col++)
            for (let row = 0; row < C.ROWS; row++)
                this._drawHole(col, row);
    }

    _cellXY(col, row) {
        return {
            x: C.GRID_LEFT + col * C.CELL_W + C.CELL_W / 2,
            y: C.GRID_TOP + (C.ROWS - 1 - row) * C.CELL_H + C.CELL_H / 2,
        };
    }

    _drawHole(col, row) {
        const { ctx } = this;
        const { x, y } = this._cellXY(col, row);
        const r = Math.min(C.CELL_W, C.CELL_H) * 0.39;
        const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.05, x, y, r);
        g.addColorStop(0, '#060a12');
        g.addColorStop(0.75, '#04060b');
        g.addColorStop(1, '#020305');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r * 0.78, Math.PI * 0.9, Math.PI * 1.55);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    _drawGridBalls() {
        const { game } = this;
        const winSet = new Set((game.winLine || []).map(p => `${p.c},${p.r}`));
        for (let col = 0; col < C.COLS; col++) {
            for (let row = 0; row < C.ROWS; row++) {
                const player = game.grid[col][row];
                if (!player) continue;
                if (game.dropAnim && game.dropAnim.col === col && game.dropAnim.row === row) continue;
                const { x, y } = this._cellXY(col, row);
                const color = player === 1 ? C.COLORS.P1 : C.COLORS.P2;
                const isWin = winSet.has(`${col},${row}`);
                const pulse = isWin ? 1 + 0.12 * Math.sin(this._t * 0.15) : 1;
                this._draw3dBall(x, y, Math.min(C.CELL_W, C.CELL_H) * 0.41 * pulse, color, isWin, player === 1);
            }
        }
    }

    _drawDropAnim() {
        const { game } = this;
        if (!game.dropAnim) return;
        const { col, row, player, progress } = game.dropAnim;
        const { x, y } = this._cellXY(col, row);
        const color = player === 1 ? C.COLORS.P1 : C.COLORS.P2;
        const startY = C.HOOP_Y + 10;
        const ease = easeOutBounce(Math.min(1, progress * 1.05));
        const currY = startY + (y - startY) * ease;
        const scale = 1 + 0.18 * Math.max(0, 1 - progress * 3);
        this._draw3dBall(x, currY, Math.min(C.CELL_W, C.CELL_H) * 0.41 * scale, color, false, player === 1);
    }

    _drawActiveBall() {
        const { game } = this;
        const ball = game.physics.activeBall;
        if (!ball) return;
        const { x, y } = ball.position;
        const z = ball.z || 0;
        const scale = C.SCALE_CLOSE - (z * (C.SCALE_CLOSE - C.SCALE_FAR));
        const radius = C.BALL_R * scale;

        const isMyBall = !game.mp || game.currentPlayer === game.myPlayerId;
        const color = game.currentPlayer === 1 ? C.COLORS.P1 : C.COLORS.P2;
        const { ctx } = this;
        ctx.save();
        if (!isMyBall) {
            const pulse = 0.3 + 0.2 * Math.sin(this._t * 0.2);
            ctx.beginPath(); ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = pulse;
            ctx.shadowBlur = 18; ctx.shadowColor = color; ctx.stroke();
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
        ctx.translate(x, y);
        ctx.rotate(ball.angle);
        this._draw3dBall(0, 0, radius, color, false, game.currentPlayer === 1);
        ctx.restore();
    }

    _draw3dBall(x, y, r, color, glowing, isP1) {
        const { ctx } = this;
        ctx.save();
        if (glowing) { ctx.shadowBlur = 20; ctx.shadowColor = color; }

        // Scaled shadow offset
        const off = r * 0.1;
        ctx.beginPath(); ctx.arc(x + off, y + off, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill();

        ctx.shadowBlur = 0;

        // Player 1: WNBA ball (mostly white, orange side panels) - 2nd from right in image
        // Player 2: Wilson EVO NXT (bright orange) - 1st from right in image
        const baseColor = isP1 ? '#f8f8f8' : '#ff7100';
        const panelColor = isP1 ? '#f05b0c' : null;
        const lineColor = '#1a1a1a';

        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.save(); // apply clip constraints
        ctx.clip();

        // Base
        ctx.fillStyle = baseColor;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);

        // Optional secondary panels
        if (isP1) {
            ctx.fillStyle = panelColor;

            // Left crescent panel (filling area between edge and inner ellipse)
            ctx.beginPath();
            ctx.arc(x, y, r, Math.PI / 2, Math.PI * 1.5);
            ctx.ellipse(x - r * 0.28, y, r * 0.58, r, 0, Math.PI * 1.5, Math.PI / 2, true);
            ctx.fill();

            // Right crescent panel
            ctx.beginPath();
            ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
            ctx.ellipse(x + r * 0.28, y, r * 0.58, r, 0, Math.PI / 2, -Math.PI / 2, true);
            ctx.fill();
        }

        // Inner shading gradient
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.04, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.25)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.0)');
        g.addColorStop(0.75, 'rgba(0,0,0,0.15)');
        g.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);

        // Black grooves/lines
        const sw = Math.max(1.8, r * 0.04);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = sw;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.85;

        // Horiz equator
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke();
        // Vert pole
        ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();

        // Left C-curve. It runs from top to bottom pole, bulging left.
        ctx.beginPath(); ctx.ellipse(x - r * 0.28, y, r * 0.58, r, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        // Right C-curve
        ctx.beginPath(); ctx.ellipse(x + r * 0.28, y, r * 0.58, r, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();

        ctx.restore(); // remove clip mask

        // Static Specular gloss (light reflection on the very top face)
        const spec = ctx.createRadialGradient(x - r * 0.35, y - r * 0.42, 0, x - r * 0.2, y - r * 0.28, r * 0.55);
        spec.addColorStop(0, 'rgba(255,255,255,0.48)');
        spec.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        spec.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = spec; ctx.fill();

        ctx.restore();
    }

    _drawSpawnHint() {
        if (!this.game.isAiming) return;
        const { ctx } = this;
        const { x, y } = C.SPAWN;
        const t = (this._t % 90) / 90;
        const a = 0.08 + 0.14 * Math.sin(t * Math.PI * 2);
        const radius = (C.BALL_R * C.SCALE_CLOSE) + 12;
        ctx.setLineDash([5, 6]);
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(255,255,255,${a * 1.6})`;
        ctx.font = 'bold 11px Barlow, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('▲  DRAG DOWN TO AIM', x, y - radius - 16);
        ctx.textAlign = 'left';
        const inp = this.game.input;
        if (inp.isDragging) this._drawRubberBand(inp.startPos, inp.currentPos);
    }

    _drawTrajectory() {
        const inp = this.game.input;
        if (!this.game.isAiming || !inp.isDragging) return;
        const pts = inp.getPoints();
        if (pts.length < 2) return;
        const { ctx } = this;
        ctx.save(); ctx.setLineDash([5, 7]);
        for (let i = 0; i < pts.length - 1; i++) {
            const t = i / pts.length;
            const pt = pts[i];
            const nextPt = pts[i + 1];

            // Trajectory scale logic
            const z = Math.max(0, Math.min(1, (C.SPAWN.y - pt.y) / (C.SPAWN.y - C.HOOP_Y)));
            const scale = C.SCALE_CLOSE - (z * (C.SCALE_CLOSE - C.SCALE_FAR));

            ctx.lineWidth = 2 * scale;
            ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - t)})`;
            ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(nextPt.x, nextPt.y); ctx.stroke();
        }
        const end = pts[pts.length - 1];
        const endZ = Math.max(0, Math.min(1, (C.SPAWN.y - end.y) / (C.SPAWN.y - C.HOOP_Y)));
        const endScale = C.SCALE_CLOSE - (endZ * (C.SCALE_CLOSE - C.SCALE_FAR));

        ctx.setLineDash([]); ctx.globalAlpha = 0.22;
        const color = this.game.currentPlayer === 1 ? C.COLORS.P1 : C.COLORS.P2;
        ctx.beginPath(); ctx.arc(end.x, end.y, C.BALL_R * endScale * 0.72, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        ctx.restore();
    }

    _drawRubberBand(from, to) {
        if (!from || !to) return;
        const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy);
        if (len < 6) return;
        const { ctx } = this;
        ctx.save();
        ctx.strokeStyle = 'rgba(253,185,39,0.65)'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
        ctx.setLineDash([]);
        const angle = Math.atan2(dy, dx);
        ctx.fillStyle = 'rgba(253,185,39,0.85)';
        ctx.beginPath(); ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - 14 * Math.cos(angle - 0.45), to.y - 14 * Math.sin(angle - 0.45));
        ctx.lineTo(to.x - 14 * Math.cos(angle + 0.45), to.y - 14 * Math.sin(angle + 0.45));
        ctx.closePath(); ctx.fill();
        const power = Math.min(len / 220, 1);
        ctx.globalAlpha = 0.3 * power; ctx.fillStyle = C.COLORS.P2;
        ctx.beginPath(); ctx.arc(to.x, to.y, 8 + power * 18, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    _drawWinLine() {
        const { game, ctx } = this;
        if (!game.winner || !game.winLine) return;
        const positions = game.winLine.map(({ c, r }) => this._cellXY(c, r));
        ctx.save(); ctx.shadowBlur = 32; ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.beginPath();
        positions.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke(); ctx.restore();
        positions.forEach(p => {
            const color = game.winner === 1 ? C.COLORS.P1 : C.COLORS.P2;
            this._draw3dBall(p.x, p.y, Math.min(C.CELL_W, C.CELL_H) * 0.46, color, true, game.winner === 1);
        });
    }
}

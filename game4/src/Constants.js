
// ── Canvas ────────────────────────────────────────────────
// ── Canvas ────────────────────────────────────────────────
export const W = 700;
export const H = 900;

// ── Grid ─────────────────────────────────────────────────
export const COLS = 7;
export const ROWS = 6;
export const CELL_W = 54 * 1.5;   // 81
export const CELL_H = 54 * 1.2;   // 64.8

export const GRID_W = COLS * CELL_W;           // 567
export const GRID_H = ROWS * CELL_H;           // 388.8
export const GRID_LEFT = (W - GRID_W) / 2;     // 66.5
export const GRID_TOP = 180;
export const GRID_BOTTOM = GRID_TOP + GRID_H;

// ── Hoops  ────────────────────────────────────────────────
export const HOOP_Y = GRID_TOP - 40;
export const HOOP_W = CELL_W * 0.7;
export const HOOP_DETECT_BAND = 30;

// ── Ball ──────────────────────────────────────────────────
export const BALL_R = 17;
export const SCALE_CLOSE = 2.6;  // Adjusted to match new spawn
export const SCALE_FAR = 1.0;

// ── Spawn — Placed just below the grid to allow plenty of pull-back space ────
export const SPAWN = { x: W / 2, y: 650 };

// ── Physics ───────────────────────────────────────────────
export const GRAVITY = 1;
export const SETTLE_THRESHOLD = 0.4;   // higher = faster "at rest" detection

// ── Colors ────────────────────────────────────────────────
export const COLORS = {
    P1: '#C8102E',  // NBA Red
    P2: '#FDB927',  // NBA Gold
    HIGHLIGHT: '#ffffff',
    RIM: '#ffffff',
    TEXT: '#ffffff',
};

// Legacy alias used by InputController
export const PHYSICS = {
    GRAVITY,
    BALL_RADIUS: BALL_R,
    GRID_COLS: COLS,
    GRID_ROWS: ROWS,
    CELL_SIZE: CELL_W,
    GRID_BOTTOM,
    HOOP_Y,
    BALL_SPAWN: SPAWN,
    SETTLE_THRESHOLD,
};

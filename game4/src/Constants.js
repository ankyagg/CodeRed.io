
// ── Canvas ────────────────────────────────────────────────
export const W = 560;
export const H = 700;

// ── Grid ─────────────────────────────────────────────────
export const COLS = 7;
export const ROWS = 6;
export const CELL = 54;   // px per cell — slightly smaller to fit

const GRID_W = COLS * CELL;           // 378
export const GRID_LEFT = (W - GRID_W) / 2;  // 91
export const GRID_TOP = 200;
export const GRID_BOTTOM = GRID_TOP + ROWS * CELL; // 524

// ── Hoops  ────────────────────────────────────────────────
// Placed just above the grid so the ball arcs through them
export const HOOP_Y = GRID_TOP - 36;  // 164
export const HOOP_W = CELL * 0.68;    // opening width
export const HOOP_DETECT_BAND = 30;             // detection band above/below HOOP_Y

// ── Ball ──────────────────────────────────────────────────
export const BALL_R = 17;

// ── Spawn — centred horizontally, well below the grid ────
export const SPAWN = { x: W / 2, y: 640 };

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
    CELL_SIZE: CELL,
    GRID_BOTTOM,
    HOOP_Y,
    BALL_SPAWN: SPAWN,
    SETTLE_THRESHOLD,
};

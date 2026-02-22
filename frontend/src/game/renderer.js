const TILE_SIZE = 20;

// ── Tile Colors ──
const TILE_COLORS = {
    grass: '#2d5a27',
    tree: '#1a3d12',
    stone: '#6b6b6b',
    food: '#e8a838',
    gold: '#c9961a',
    diamond: '#1a9ea8',
    medkit: '#f1f2f6'
};

const TILE_BORDER_COLORS = {
    grass: '#3a7233',
    tree: '#245218',
    stone: '#585858',
    food: '#c8902e',
    gold: '#e0b84f',
    diamond: '#3bc4cf',
    medkit: '#dcdde1'
};

export const PALETTE = {
    'b': '#000000', 'w': '#ffffff', 'g': '#7f8c8d', 'd': '#2c3e50',
    'S': '#B48A76', 'H': '#312520', 'P': '#4B3F72', 'N': '#9B7462', 'M': '#9C6F59', 'B': '#462C22',
    'c': '#2ecc71', 'C': '#27ae60',
    'Z': '#2A5D37', 'z': '#418A4F',
    's': '#bdc3c7', 'K': '#34495e',
    'p': '#f1a9a0', 'o': '#d24d57',
    'e': '#111111', 'E': '#e056fd',
    'x': '#2d3436', 'r': '#e84118', 'R': '#c23616',
    'v': '#e67e22', 'V': '#d35400', 'U': '#27ae60'
};

export const AVATARS = {
    steve: [
        "HHHHHHHH",
        "HHHHHHHH",
        "HSSSSSSH",
        "SwPSSPws",
        "SSSSNNSS",
        "SSNBNNSS",
        "SSBBBSSS",
        "SSSSSSSS"
    ],
    creeper: [
        "cccccccc",
        "cccccccc",
        "ccbbccbb",
        "ccbbccbb",
        "cccbbccc",
        "ccbbbbcc",
        "ccbbbbcc",
        "cccbbccc"
    ],
    zombie: [
        "ZZZZZZZZ",
        "ZZZZZZZZ",
        "ZzZZZZzZ",
        "ZzbbbbzZ",
        "ZZZZZZZZ",
        "ZZbbbbZZ",
        "ZZbbbbZZ",
        "ZZZZZZZZ"
    ],
    enderman: [
        "eeeeeeee",
        "eeeeeeee",
        "eeeeeeee",
        "eeeeeeee",
        "eeeeeeee",
        "wEEeewEE",
        "eeeeeeee",
        "eeeeeeee"
    ],
    skeleton: [
        "ssssssss",
        "ssssssss",
        "sKKssKKs",
        "ssKssKss",
        "sssKKsss",
        "sssKKsss",
        "sKssKssK",
        "ssssssss"
    ],
    pig: [
        "pppppppp",
        "pppppppp",
        "pppppppp",
        "pbppppbp",
        "pppppppp",
        "ppoopooo",
        "ppoopooo",
        "pppppppp"
    ],
    spider: [
        "xxxxxxxx",
        "xxxxxxxx",
        "xxxxxxxx",
        "rxxrrxxr",
        "RxxRRxxR",
        "xxxxxxxx",
        "xxxxxxxx",
        "xxxxxxxx"
    ],
    villager: [
        "HHHHHHHH",
        "HHHHHHHH",
        "SSSSSSSS",
        "SbwSSwbS",
        "SSSUUSSS",
        "SSVVVVSS",
        "SSVVVVSS",
        "SSSSSSSS"
    ]
};

// ── Draw icons on special tiles ──
function drawTileIcon(ctx, type, x, y, size) {
    const cx = x + size / 2;
    const cy = y + size / 2;

    if (type === 'tree') {
        // Tree trunk
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(cx - 2, cy + 2, 4, size / 2 - 4);
        // Tree canopy
        ctx.fillStyle = '#2ecc40';
        ctx.beginPath();
        ctx.arc(cx, cy - 2, size / 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'stone') {
        // Rock shape
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 1, size / 3, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.ellipse(cx - 2, cy - 2, size / 5, size / 6, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'food') {
        // Berry / apple
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(cx, cy, size / 4, 0, Math.PI * 2);
        ctx.fill();
        // Leaf
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.ellipse(cx + 3, cy - 4, 3, 2, 0.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'gold') {
        // Gold ore / ingot
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(cx - 4, cy - 3, 8, 6);
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(cx - 2, cy - 1, 4, 2);
    } else if (type === 'diamond') {
        // Diamond gem
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5);
        ctx.lineTo(cx + 4, cy);
        ctx.lineTo(cx, cy + 5);
        ctx.lineTo(cx - 4, cy);
        ctx.closePath();
        ctx.fill();
    } else if (type === 'medkit') {
        // Red cross Medkit
        ctx.fillStyle = '#ff4757'; // bright red cross
        // Horizontal bar
        ctx.fillRect(cx - 4, cy - 1.5, 8, 3);
        // Vertical bar
        ctx.fillRect(cx - 1.5, cy - 4, 3, 8);
    }
}

// ── Interpolation State ──
const LERP_FACTOR = 0.2;
const interpState = {
    players: {},
    mobs: {},
    worldHealth: {},
    worldType: {},
    particles: [],
    shakeTimes: {}
};

function spawnParticles(c, r, type) {
    let color = '#fff';
    if (type === 'diamond') color = '#00ffff';
    else if (type === 'gold') color = '#f1c40f';
    else if (type === 'stone') color = '#999';
    else if (type === 'tree') color = '#5c3a1e';
    else if (type === 'food') color = '#e74c3c';
    else if (type === 'medkit') color = '#ff4757';

    for (let i = 0; i < 8; i++) {
        interpState.particles.push({
            x: c * TILE_SIZE + TILE_SIZE / 2,
            y: r * TILE_SIZE + TILE_SIZE / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            life: 1.0,
            color
        });
    }
}

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

/**
 * Render the full game scene on a canvas context.
 */
export function renderGame(ctx, canvas, world, players, mobs, myId) {
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    if (!world || world.length === 0) return;

    // ── Interpolate Entities ──
    for (const [id, p] of Object.entries(players)) {
        if (!interpState.players[id]) interpState.players[id] = { x: p.x, y: p.y };
        // Snap if teleported (respawned far away)
        if (Math.abs(interpState.players[id].x - p.x) > 2 || Math.abs(interpState.players[id].y - p.y) > 2) {
            interpState.players[id].x = p.x;
            interpState.players[id].y = p.y;
        } else {
            interpState.players[id].x = lerp(interpState.players[id].x, p.x, LERP_FACTOR);
            interpState.players[id].y = lerp(interpState.players[id].y, p.y, LERP_FACTOR);
        }
    }
    for (const id of Object.keys(interpState.players)) {
        if (!players[id]) delete interpState.players[id];
    }

    for (const [id, m] of Object.entries(mobs)) {
        if (!interpState.mobs[id]) interpState.mobs[id] = { x: m.x, y: m.y };
        if (Math.abs(interpState.mobs[id].x - m.x) > 2 || Math.abs(interpState.mobs[id].y - m.y) > 2) {
            interpState.mobs[id].x = m.x;
            interpState.mobs[id].y = m.y;
        } else {
            interpState.mobs[id].x = lerp(interpState.mobs[id].x, m.x, LERP_FACTOR);
            interpState.mobs[id].y = lerp(interpState.mobs[id].y, m.y, LERP_FACTOR);
        }
    }
    for (const id of Object.keys(interpState.mobs)) {
        if (!mobs[id]) delete interpState.mobs[id];
    }

    // ── Camera: center on current player ──
    const meInterp = interpState.players[myId];
    let camX = 0;
    let camY = 0;
    if (meInterp) {
        camX = meInterp.x * TILE_SIZE - width / 2 + TILE_SIZE / 2;
        camY = meInterp.y * TILE_SIZE - height / 2 + TILE_SIZE / 2;
    }

    // ── Calculate visible tile range ──
    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
    const endCol = Math.min(world[0]?.length || 0, Math.ceil((camX + width) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
    const endRow = Math.min(world.length, Math.ceil((camY + height) / TILE_SIZE) + 1);

    const now = Date.now();

    // ── Draw Tiles ──
    for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
            const tile = world[row][col];
            const key = `${col},${row}`;

            if (tile.type !== 'grass') {
                if (interpState.worldHealth[key] !== undefined && tile.health < interpState.worldHealth[key]) {
                    spawnParticles(col, row, tile.type);
                    interpState.shakeTimes[key] = now + 150;
                }
                interpState.worldHealth[key] = tile.health;
                interpState.worldType[key] = tile.type;
            } else if (interpState.worldHealth[key]) {
                spawnParticles(col, row, interpState.worldType[key]);
                delete interpState.worldHealth[key];
                delete interpState.worldType[key];
            }

            let screenX = col * TILE_SIZE - camX;
            let screenY = row * TILE_SIZE - camY;

            // Apply shake
            if (interpState.shakeTimes[key] && interpState.shakeTimes[key] > now) {
                screenX += (Math.random() - 0.5) * 4;
                screenY += (Math.random() - 0.5) * 4;
            }

            // Base tile
            ctx.fillStyle = TILE_COLORS[tile.type] || '#333';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Tile border (subtle grid)
            ctx.strokeStyle = TILE_BORDER_COLORS[tile.type] || '#444';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Icon for non-grass
            if (tile.type !== 'grass') {
                drawTileIcon(ctx, tile.type, screenX, screenY, TILE_SIZE);
            }
        }
    }

    // ── Draw Mobs ──
    for (const mob of Object.values(mobs)) {
        const mInterp = interpState.mobs[mob.id] || mob;
        const screenX = mInterp.x * TILE_SIZE - camX;
        const screenY = mInterp.y * TILE_SIZE - camY;

        let bodyColor = '#e74c3c'; // Normal Red
        let maxHealth = 30;
        let pSize = TILE_SIZE - 4;
        let offset = 2;

        if (mob.type === 'RUNNER') {
            bodyColor = '#f39c12'; // Orange Fast
            maxHealth = 15;
            pSize = TILE_SIZE - 8;
            offset = 4;
        } else if (mob.type === 'BRUTE') {
            bodyColor = '#8e44ad'; // Purple Tank
            maxHealth = 80;
            pSize = TILE_SIZE; // Takes full tile
            offset = 0;
        }

        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(screenX + offset, screenY + offset, pSize, pSize);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(screenX + 5, screenY + 6, 3, 3);
        ctx.fillRect(screenX + 12, screenY + 6, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 6, screenY + 7, 1.5, 1.5);
        ctx.fillRect(screenX + 13, screenY + 7, 1.5, 1.5);

        // Health bar above mob
        const healthPct = mob.health / maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 4, TILE_SIZE, 3);
        ctx.fillStyle = healthPct > 0.5 ? '#2ecc40' : healthPct > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(screenX, screenY - 4, TILE_SIZE * healthPct, 3);
    }

    // ── Draw Players ──
    for (const p of Object.values(players)) {
        const pInterp = interpState.players[p.id] || p;
        const screenX = pInterp.x * TILE_SIZE - camX;
        const screenY = pInterp.y * TILE_SIZE - camY;
        const isMe = p.id === myId;

        // Outline for current player (optional selection ring)
        if (isMe) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX - 1, screenY - 1, TILE_SIZE + 2, TILE_SIZE + 2);
        }

        // ── Draw Pixel Art Avatar ──
        const px = TILE_SIZE / 8;
        const avatarGrid = AVATARS[p.avatar || 'steve'] || AVATARS.steve;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const colorCode = avatarGrid[r][c];
                if (colorCode && PALETTE[colorCode]) {
                    ctx.fillStyle = PALETTE[colorCode];
                    ctx.fillRect(screenX + c * px, screenY + r * px, px, px);
                }
            }
        }

        // Direction indicator (tiny weapon/hand on the side)
        if (p.facing) {
            const hx = screenX + TILE_SIZE / 2 + p.facing.dx * (TILE_SIZE / 2);
            const hy = screenY + TILE_SIZE / 2 + p.facing.dy * (TILE_SIZE / 2);
            ctx.fillStyle = '#d1d5db'; // Iron color
            ctx.beginPath();
            ctx.arc(hx, hy, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw player name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(p.name || 'Survivor', screenX + TILE_SIZE / 2, screenY - 12);
        ctx.shadowBlur = 0; // reset

        // Health bar above player
        const healthPct = p.health / 100;
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 6, TILE_SIZE, 3);
        ctx.fillStyle = healthPct > 0.5 ? '#2ecc40' : healthPct > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(screenX, screenY - 6, TILE_SIZE * healthPct, 3);
    }

    // ── Draw facing indicator for current player ──
    const me = players[myId];
    if (me && me.facing) {
        const targetX = (me.x + me.facing.dx) * TILE_SIZE - camX;
        const targetY = (me.y + me.facing.dy) * TILE_SIZE - camY;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(targetX, targetY, TILE_SIZE, TILE_SIZE);
    }

    // ── Draw Particles ──
    for (let i = interpState.particles.length - 1; i >= 0; i--) {
        const p = interpState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.life -= 0.05;

        if (p.life <= 0) {
            interpState.particles.splice(i, 1);
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(p.x - camX, p.y - camY, 4, 4);
            ctx.globalAlpha = 1.0;
        }
    }
}

const { TILE, MAP_WIDTH, MAP_HEIGHT, TILE_HEALTH, SOLID_TILES } = require('./constants');
const { MOB_TYPES, MOB_AGGRO_RANGE, MOB_COUNT, MOB_TICK_MS } = require('./constants');
const { MAX_HEALTH, MAX_HUNGER, HUNGER_LOSS_PER_TICK, STARVATION_DAMAGE, FOOD_HUNGER_RESTORE, MEDKIT_HEALTH_RESTORE, HUNGER_TICK_MS } = require('./constants');
const { SCORE_PER_KILL, SCORE_PER_BLOCK_BREAK, SCORE_PER_SURVIVAL_TICK, SCORE_PER_FOOD, LEADERBOARD_BROADCAST_MS, MAX_SCORE } = require('./constants');

let nextRoomId = 1;

class Room {
    constructor(name, hostId) {
        this.id = `room_${nextRoomId++}`;
        this.name = name;
        this.hostId = hostId;
        this.createdAt = Date.now();

        this.world = [];
        this.dirtyTiles = [];
        this.players = {};
        this.mobs = {};
        this.nextMobId = 1;

        // Generate world + spawn mobs
        this._generateWorld();
        this._spawnMobs(MOB_COUNT);

        // Start tick intervals
        this.hungerInterval = setInterval(() => this._tickHunger(), HUNGER_TICK_MS);
        this.mobInterval = setInterval(() => this._tickMobs(), MOB_TICK_MS);
        this.leaderboardInterval = setInterval(() => this._tickLeaderboard(), LEADERBOARD_BROADCAST_MS);
        this.medkitInterval = setInterval(() => this._spawnMedkits(1), 60000); // 1 every minute

        // Broadcast callback (set by handler)
        this.onStateChange = null;
        this.onPlayerDied = null;
        this.onLeaderboardUpdate = null;
        this.onSavePlayerStats = null;
        this.onMatchOver = null;
        this.finished = false;
    }

    checkWinCondition(player) {
        if (this.finished) return;
        if (player.score >= MAX_SCORE) {
            this.finished = true;
            if (this.onMatchOver) {
                this.onMatchOver(this, player);
            }
        }
    }

    // ══════════════════════════════════════
    //  WORLD
    // ══════════════════════════════════════

    _generateWorld() {
        this.world = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                    row.push({ type: TILE.GRASS, health: 0 });
                    continue;
                }
                const rand = Math.random();
                let type;
                if (rand < 0.65) type = TILE.GRASS;
                else if (rand < 0.82) type = TILE.TREE;
                else if (rand < 0.92) type = TILE.STONE;
                else if (rand < 0.98) type = TILE.FOOD;
                else if (rand < 0.995) type = TILE.GOLD;
                else type = TILE.DIAMOND;

                const health = TILE_HEALTH[type] || 0;
                row.push({ type, health });
            }
            this.world.push(row);
        }

        // Spawn extra mob guardians around diamonds
        this._spawnDiamondGuardians();

        // Spawn initial medkits (2 to 3)
        const medkitCount = Math.floor(Math.random() * 2) + 2;
        this._spawnMedkits(medkitCount);
    }

    _spawnMedkits(count) {
        for (let i = 0; i < count; i++) {
            const spawnRow = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
            const spawnCol = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;

            // Only overwrite if it's grass to not destroy walls or players
            if (this.world[spawnRow][spawnCol].type === TILE.GRASS) {
                this.world[spawnRow][spawnCol].type = TILE.MEDKIT;
                this.world[spawnRow][spawnCol].health = TILE_HEALTH[TILE.MEDKIT];
                this.dirtyTiles.push({ x: spawnCol, y: spawnRow, tile: this.world[spawnRow][spawnCol] });
            }
        }
        if (this.onStateChange) this.onStateChange(this); // Broadcast updates
    }

    getTile(x, y) {
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return null;
        return this.world[y][x];
    }

    isSolid(x, y) {
        const tile = this.getTile(x, y);
        if (!tile) return true;
        return SOLID_TILES.has(tile.type);
    }

    isInBounds(x, y) {
        return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT;
    }

    damageTile(x, y, amount = 1, playerId = null) {
        if (!this.isInBounds(x, y)) return null;
        const tile = this.world[y][x];
        if (tile.type === TILE.GRASS) return null;

        tile.health -= amount;
        if (tile.health <= 0) {
            let pts = SCORE_PER_BLOCK_BREAK;
            if (tile.type === TILE.GOLD) pts = 50;
            if (tile.type === TILE.DIAMOND) pts = 100;

            tile.type = TILE.GRASS;
            tile.health = 0;

            // Reward player for breaking a block
            if (playerId && this.players[playerId]) {
                const p = this.players[playerId];
                p.score += pts;
                p.blocksBroken += 1;
                this.checkWinCondition(p);
            }
        }

        this.dirtyTiles.push({ x, y, tile });
        return tile;
    }



    findRandomGrassTile() {
        let attempts = 0;
        while (attempts < 1000) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            if (this.world[y][x].type === TILE.GRASS) return { x, y };
            attempts++;
        }
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (this.world[y][x].type === TILE.GRASS) return { x, y };
            }
        }
        return { x: 1, y: 1 };
    }

    // ══════════════════════════════════════
    //  PLAYERS
    // ══════════════════════════════════════

    addPlayer(socketId, name, avatar) {
        const spawn = this.findRandomGrassTile();
        const player = {
            id: socketId,
            name: name || 'Survivor',
            avatar: avatar || 'steve',
            x: spawn.x,
            y: spawn.y,
            health: MAX_HEALTH,
            hunger: MAX_HUNGER,
            facing: { dx: 0, dy: -1 },
            // Scoring
            score: 0,
            kills: 0,
            deaths: 0,
            blocksBroken: 0,
            joinedAt: Date.now()
        };
        this.players[socketId] = player;
        return player;
    }

    removePlayer(socketId) {
        const p = this.players[socketId];
        if (p && this.onSavePlayerStats) {
            this.onSavePlayerStats(p); // Save stats before removing
        }
        delete this.players[socketId];
        return Object.keys(this.players).length === 0;
    }

    getPlayer(id) {
        return this.players[id] || null;
    }

    getAllPlayers() {
        return this.players;
    }

    movePlayer(id, dx, dy) {
        const player = this.players[id];
        if (!player) return false;

        dx = Math.sign(dx);
        dy = Math.sign(dy);
        if (dx === 0 && dy === 0) return false;

        player.facing = { dx, dy };

        const newX = player.x + dx;
        const newY = player.y + dy;

        if (!this.isInBounds(newX, newY)) return false;
        if (this.isSolid(newX, newY)) return false;

        player.x = newX;
        player.y = newY;
        return true;
    }

    eatFood(id) {
        const player = this.players[id];
        if (!player) return false;
        player.hunger = Math.min(MAX_HUNGER, player.hunger + FOOD_HUNGER_RESTORE);
        player.score += SCORE_PER_FOOD;
        this.checkWinCondition(player);
        return true;
    }

    useMedkit(id) {
        const player = this.players[id];
        if (!player) return false;
        player.health = Math.min(MAX_HEALTH, player.health + MEDKIT_HEALTH_RESTORE);
        player.score += SCORE_PER_FOOD * 2; // Extra points for big item
        this.checkWinCondition(player);
        return true;
    }

    damagePlayer(id, amount) {
        const player = this.players[id];
        if (!player) return false;
        player.health = Math.max(0, player.health - amount);
        return player.health <= 0;
    }

    getFacingTile(id) {
        const player = this.players[id];
        if (!player) return null;
        return {
            x: player.x + player.facing.dx,
            y: player.y + player.facing.dy,
        };
    }

    _tickHunger() {
        for (const id of Object.keys(this.players)) {
            const p = this.players[id];

            // Add survival score for staying alive
            if (p.health > 0) {
                p.score += SCORE_PER_SURVIVAL_TICK;
                this.checkWinCondition(p);
            }

            p.hunger = Math.max(0, p.hunger - HUNGER_LOSS_PER_TICK);
            if (p.hunger <= 0) {
                p.health = Math.max(0, p.health - STARVATION_DAMAGE);
            }
        }
        if (this.onStateChange) this.onStateChange(this);
    }

    // ══════════════════════════════════════
    //  MOBS
    // ══════════════════════════════════════

    _spawnMobs(count) {
        const types = Object.keys(MOB_TYPES);
        for (let i = 0; i < count; i++) {
            const spawn = this.findRandomGrassTile();
            const id = `mob_${this.nextMobId++}`;
            const typeKey = types[Math.floor(Math.random() * types.length)];
            const typeData = MOB_TYPES[typeKey];

            this.mobs[id] = {
                id,
                type: typeKey,
                x: spawn.x,
                y: spawn.y,
                health: typeData.health,
            };
        }
    }

    _spawnDiamondGuardians() {
        const types = Object.keys(MOB_TYPES);
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (this.world[y][x].type === TILE.DIAMOND) {
                    // Try to spawn 2 mobs near each diamond
                    for (let i = 0; i < 2; i++) {
                        const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]];
                        for (const [dx, dy] of offsets.sort(() => Math.random() - 0.5)) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (this.isInBounds(nx, ny) && this.world[ny][nx].type === TILE.GRASS) {
                                const id = `mob_guardian_${this.nextMobId++}`;
                                const typeKey = Math.random() > 0.3 ? 'BRUTE' : 'NORMAL'; // Diamonds get tougher guards
                                const typeData = MOB_TYPES[typeKey];

                                this.mobs[id] = {
                                    id,
                                    type: typeKey,
                                    x: nx,
                                    y: ny,
                                    health: typeData.health,
                                };
                                break; // Only spawn one per attempt
                            }
                        }
                    }
                }
            }
        }
    }

    getAllMobs() {
        return this.mobs;
    }

    getMobAt(x, y) {
        for (const mob of Object.values(this.mobs)) {
            if (mob.x === x && mob.y === y) return mob;
        }
        return null;
    }

    damageMob(id, amount, playerId = null) {
        const mob = this.mobs[id];
        if (!mob) return false;
        mob.health = Math.max(0, mob.health - amount);
        if (mob.health <= 0) {
            delete this.mobs[id];

            // Reward player for kill
            if (playerId && this.players[playerId]) {
                const p = this.players[playerId];
                p.score += SCORE_PER_KILL;
                p.kills += 1;
                this.checkWinCondition(p);
            }
            return true;
        }
        return false;
    }

    _distance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    _findClosestPlayer(mob) {
        let closest = null;
        let closestDist = Infinity;
        for (const p of Object.values(this.players)) {
            const d = this._distance(mob, p);
            if (d <= MOB_AGGRO_RANGE && d < closestDist) {
                closest = p;
                closestDist = d;
            }
        }
        return closest;
    }

    _tickMobs() {
        const attacks = [];

        for (const mob of Object.values(this.mobs)) {
            const target = this._findClosestPlayer(mob);

            if (target) {
                const dx = Math.sign(target.x - mob.x);
                const dy = Math.sign(target.y - mob.y);

                let moveX = mob.x;
                let moveY = mob.y;

                if (Math.abs(target.x - mob.x) >= Math.abs(target.y - mob.y)) {
                    moveX += dx;
                } else {
                    moveY += dy;
                }

                if (this.isInBounds(moveX, moveY) && !this.isSolid(moveX, moveY)) {
                    mob.x = moveX;
                    mob.y = moveY;
                }

                if (this._distance(mob, target) <= 1) {
                    const dmg = MOB_TYPES[mob.type]?.damage || 10;
                    attacks.push({ playerId: target.id, damage: dmg });
                }
            } else {
                const dirs = [
                    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                ];
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                const newX = mob.x + dir.dx;
                const newY = mob.y + dir.dy;
                if (this.isInBounds(newX, newY) && !this.isSolid(newX, newY)) {
                    mob.x = newX;
                    mob.y = newY;
                }
            }
        }

        // Apply mob attacks
        for (const atk of attacks) {
            const died = this.damagePlayer(atk.playerId, atk.damage);
            if (died) {
                const p = this.players[atk.playerId];
                if (p) {
                    p.deaths += 1;
                    if (this.onSavePlayerStats) {
                        this.onSavePlayerStats(p); // Save stats on death
                    }
                    p.score = Math.floor(p.score / 2); // Penalty for dying
                    p.joinedAt = Date.now(); // Reset survival timer
                }

                if (this.onPlayerDied) {
                    this.onPlayerDied(this, atk.playerId);
                }
            }
        }

        if (this.onStateChange) this.onStateChange(this);
    }

    _tickLeaderboard() {
        if (!this.onLeaderboardUpdate || Object.keys(this.players).length === 0) return;

        const leaderboard = Object.values(this.players).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            kills: p.kills,
            deaths: p.deaths,
            survivalTimeSec: Math.floor((Date.now() - p.joinedAt) / 1000)
        })).sort((a, b) => b.score - a.score);

        this.onLeaderboardUpdate(this, leaderboard);
    }

    // ══════════════════════════════════════
    //  STATE & LIFECYCLE
    getState() {
        return {
            world: this.world,
            players: this.players,
            mobs: this.mobs,
        };
    }

    getDelta() {
        const delta = {
            tiles: this.dirtyTiles,
            players: this.players,
            mobs: this.mobs,
        };
        this.dirtyTiles = []; // Clear after building delta
        return delta;
    }

    getInfo() {
        return {
            id: this.id,
            name: this.name,
            playerCount: Object.keys(this.players).length,
            hostId: this.hostId,
        };
    }

    destroy() {
        // Save stats for remaining players before destroy
        for (const p of Object.values(this.players)) {
            if (this.onSavePlayerStats) {
                this.onSavePlayerStats(p);
            }
        }

        clearInterval(this.hungerInterval);
        clearInterval(this.mobInterval);
        clearInterval(this.leaderboardInterval);
        clearInterval(this.medkitInterval);
        this.players = {};
        this.mobs = {};
        this.world = [];
    }
}

module.exports = Room;

// ── Tile Types ──
const TILE = {
  GRASS: 'grass',
  TREE: 'tree',
  STONE: 'stone',
  FOOD: 'food',
  GOLD: 'gold',
  DIAMOND: 'diamond',
  MEDKIT: 'medkit' // New rare item!
};

// ── Map ──
const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;

// ── Tile Health ──
const TILE_HEALTH = {
  [TILE.TREE]: 3,
  [TILE.STONE]: 5,
  [TILE.FOOD]: 1,
  [TILE.GOLD]: 20,
  [TILE.DIAMOND]: 30,
  [TILE.MEDKIT]: 1
};

// ── Solid tiles (block movement) ──
const SOLID_TILES = new Set([TILE.TREE, TILE.STONE, TILE.GOLD, TILE.DIAMOND]);

// ── Player ──
const MAX_HEALTH = 100;
const MAX_HUNGER = 100;
const HUNGER_TICK_MS = 5000;       // lose 2 hunger every 5s
const HUNGER_LOSS_PER_TICK = 2;
const STARVATION_DAMAGE = 5;       // damage when hunger is 0
const FOOD_HUNGER_RESTORE = 20;
const MEDKIT_HEALTH_RESTORE = 50; // New! Replenishes massive health
const PLAYER_ATTACK_DAMAGE = 15;

// ── Match ──
const MAX_SCORE = 1000;

// ── Mobs ──
const MOB_COUNT = 15; // Increased spawn counts!
const MOB_TICK_MS = 800; // Slightly faster globally
const MOB_AGGRO_RANGE = 5;

const MOB_TYPES = {
  NORMAL: { health: 30, damage: 10, sprite: 'zombie' },
  RUNNER: { health: 15, damage: 5, sprite: 'skeleton' },
  BRUTE: { health: 80, damage: 20, sprite: 'creeper' }
};

// ── Scoring ──
const SCORE_PER_KILL = 50;
const SCORE_PER_BLOCK_BREAK = 5;
const SCORE_PER_SURVIVAL_TICK = 1;
const SCORE_PER_FOOD = 15;

// ── Leaderboard ──
const LEADERBOARD_BROADCAST_MS = 1000; // Update leaderboard every 1 second

module.exports = {
  TILE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_HEALTH,
  SOLID_TILES,
  MAX_HEALTH,
  MAX_HUNGER,
  HUNGER_TICK_MS,
  HUNGER_LOSS_PER_TICK,
  STARVATION_DAMAGE,
  FOOD_HUNGER_RESTORE,
  MEDKIT_HEALTH_RESTORE,
  PLAYER_ATTACK_DAMAGE,
  MAX_SCORE,
  MOB_COUNT,
  MOB_TYPES,
  MOB_AGGRO_RANGE,
  MOB_TICK_MS,
  SCORE_PER_KILL,
  SCORE_PER_BLOCK_BREAK,
  SCORE_PER_SURVIVAL_TICK,
  SCORE_PER_FOOD,
  LEADERBOARD_BROADCAST_MS,
};

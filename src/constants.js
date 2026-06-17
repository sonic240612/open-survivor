export const CONSTANTS = {
    SWORD_ORBIT_RADIUS: 100,
    PLAYER_BASE_SPEED: 310,
    WORLD_WIDTH: 4000,
    WORLD_HEIGHT: 4000,
    ABSOLUTE_MAX_ENEMY_SPEED: 260,
    BASE_SPAWN_RATE: 1300,
    BASE_ENEMY_HP: 12,
    BASE_ENEMY_SPEED: 140,

    SPAWN_RADIUS: 650,
    BOSS_SPAWN_RADIUS: 500,
    BULLET_RANGE: 450,
    BULLET_SPEED: 650,
    RAILGUN_SPEED: 820,
    ENEMY_BULLET_SPEED: 350,
    MAGNET_BASE_RANGE: 140,
    MAGNET_PULL_SPEED: 550,
    BULLET_LIFETIME: 7000,
    PLAYER_SENSOR_RADIUS: 15,

    BOSS_BASE_HP: 17000,
    BOSS_HP_PER_MIN: 3000,
    MINIBOSS_BASE_HP: 4200,
    MINIBOSS_HP_PER_MIN: 1100,
    BOSS_TIMEOUT_MS: 180000,
    BOSS_PHASE_COOLDOWN_REDUCTION: 350,
    BOSS_MIN_COOLDOWN: 700,

    HEAL_BASE: 9,
    HEAL_MAX: 30,
    INVULN_WINDOW_MS: 300,
    PLASMA_COOLDOWN_MS: 180,
    PLASMA_STRIKE_COOLDOWN_MS: 520,
    SHOOTER_FIRE_COOLDOWN: 1450,
    SHOOTER_FIRE_GLOBAL_COOLDOWN: 210,
    BUFFER_RADIUS: 120,
    BOSS_HP_BAR_WIDTH: 100,
    MINIBOSS_HP_BAR_WIDTH: 70,

    SCREEN_CX: 400,
    SCREEN_CY: 300,
    SCREEN_W: 800,
    SCREEN_H: 600,

    FONT_FAMILY: "'Apple SD Gothic Neo', 'Apple SD 산돌고딕 Neo', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    COLORS: {
        PLAYER: 0x00ff00,
        ENEMY: 0xff0000,
        ELITE: 0xffff00,
        MINIBOSS: 0xffaa00,
        BOSS: 0xff0055,
        GEM_CYAN: 0x00ffff,
        GEM_GREEN: 0x00ff00,
        GEM_PURPLE: 0xff00ff,
        GEM_GOLD: 0xffff00,
        BEAM: 0x00ffff,
        HP_BAR: 0xff0000,
        GRID_BG: 0x151515,
        GRID_LINE: 0x222222
    }
};

function createState(initial, name) {
    return new Proxy(initial, {
        set(target, key, value) {
            target[key] = value;
            return true;
        },
        get(target, key) {
            return target[key];
        }
    });
}

const _playerStats = {
    hp: 100, maxHp: 100, currentExp: 0, nextLevelExp: 10, currentLevel: 1,
    bulletFireRate: 850, bulletDamage: 10, fireRateLevel: 0, bulletDamageLevel: 0,
    railgun: false, swordCount: 0, swordDamage: 1, swordDamageLevel: 0, plasmaBlade: false,
    lightningCount: 0, lightningDamage: 45, stormCaller: false, magnetLevel: 0, magnetRange: CONSTANTS.MAGNET_BASE_RANGE, maxHpLevel: 0,
    critChance: 0, critMultiplier: 1.25, critLevel: 0, critDamageLevel: 0,
    moveSpeed: CONSTANTS.PLAYER_BASE_SPEED
};

const _gameState = {
    worldX: 0, worldY: 0, gameTime: 0, lastFired: 0, lastLightning: 0,
    lastPlasmaBlade: 0, lastPlayerHit: 0, lastShooterFire: 0,
    lastBossSpawnInterval: 0, lastMiniBossSpawnInterval: -1,
    paused: false, enemiesKilled: 0, isGodMode: false, gameOverTriggered: false,
    damageStats: {}
};

const playerStats = createState(_playerStats, 'playerStats');
const gameState = createState(_gameState, 'gameState');

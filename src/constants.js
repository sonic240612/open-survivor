const CONSTANTS = {
    SWORD_ORBIT_RADIUS: 100,
    PLAYER_BASE_SPEED: 310,
    WORLD_WIDTH: 4000,
    WORLD_HEIGHT: 4000,
    ABSOLUTE_MAX_ENEMY_SPEED: 260,
    BASE_SPAWN_RATE: 1300,
    BASE_ENEMY_HP: 12,
    BASE_ENEMY_SPEED: 140,
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

const playerStats = {
    hp: 100, maxHp: 100, currentExp: 0, nextLevelExp: 10, currentLevel: 1,
    bulletFireRate: 850, bulletDamage: 10, fireRateLevel: 0, bulletDamageLevel: 0,
    railgun: false, swordCount: 0, swordDamage: 1, swordDamageLevel: 0, plasmaBlade: false,
    lightningCount: 0, lightningDamage: 45, stormCaller: false, magnetLevel: 0, magnetRange: 140, maxHpLevel: 0,
    moveSpeed: CONSTANTS.PLAYER_BASE_SPEED
};

const gameState = {
    worldX: 0, worldY: 0, gameTime: 0, lastFired: 0, lastLightning: 0,
    lastPlasmaBlade: 0, lastPlayerHit: 0, lastShooterFire: 0,
    lastBossSpawnInterval: 0, lastMiniBossSpawnInterval: -1,
    paused: false, enemiesKilled: 0, isGodMode: false
};

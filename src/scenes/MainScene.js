class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const createTex = (key, size, color, isRect) => {
            g.clear(); g.fillStyle(color, 1);
            if (isRect) g.fillRect(0, 0, size, size / 4 || 4);
            else g.fillCircle(size / 2, size / 2, size / 2);
            g.generateTexture(key, size, size);
        };

        createTex('p_tex', 32, CONSTANTS.COLORS.PLAYER);
        createTex('e_tex', 32, CONSTANTS.COLORS.ENEMY);
        createTex('elite_tex', 48, CONSTANTS.COLORS.ELITE);
        this.createEnemyTexture(g, 'runner_tex', 0xff5c7a, 'runner');
        this.createEnemyTexture(g, 'tanker_tex', 0x9b6bff, 'tanker');
        this.createEnemyTexture(g, 'splitter_tex', 0xffc857, 'splitter');
        this.createEnemyTexture(g, 'shooter_tex', 0x7dd3fc, 'shooter');
        this.createEnemyTexture(g, 'buffer_tex', 0x64ff9a, 'buffer');
        createTex('miniboss_tex', 64, CONSTANTS.COLORS.MINIBOSS);
        createTex('boss_tex', 80, CONSTANTS.COLORS.BOSS);
        this.createGemTexture(g, 'gem_cyan', 0x00ffff, 16);
        this.createGemTexture(g, 'gem_green', 0x00ff70, 16);
        this.createGemTexture(g, 'gem_purple', 0xff66ff, 20);
        this.createGemTexture(g, 'gem_gold', 0xffe76a, 24);
        createTex('b_tex', 12, 0xffffff, true);
        g.clear();
        g.fillStyle(0xff3333, 1);
        g.fillTriangle(7, 0, 14, 7, 7, 14);
        g.fillTriangle(7, 0, 0, 7, 7, 14);
        g.generateTexture('enemy_bullet_tex', 14, 14);
        g.clear();
        this.createSwordTexture(g, 'sword_tex', 0xffffff, 0xeaf7ff, 0xffffff);
        this.createSwordTexture(g, 'plasma_sword_tex', 0x72f7ff, 0xdffcff, 0x72f7ff);
        createTex('spark_tex', 4, 0xffffff);
    }

    createEnemyTexture(g, key, color, type) {
        g.clear();
        g.fillStyle(color, 0.94);
        if (type === 'runner') {
            g.fillTriangle(18, 2, 34, 18, 18, 34);
            g.fillTriangle(18, 2, 2, 18, 18, 34);
        } else if (type === 'tanker') {
            g.fillRoundedRect(3, 3, 42, 42, 9);
            g.lineStyle(3, 0xffffff, 0.28);
            g.strokeRoundedRect(7, 7, 34, 34, 7);
        } else if (type === 'splitter') {
            g.fillCircle(18, 18, 16);
            g.fillStyle(0xffffff, 0.32);
            g.fillCircle(10, 13, 5);
            g.fillCircle(25, 23, 4);
        } else if (type === 'shooter') {
            g.fillCircle(18, 18, 16);
            g.fillStyle(0x071018, 0.86);
            g.fillCircle(18, 18, 7);
            g.fillStyle(0xffffff, 0.72);
            g.fillCircle(18, 18, 3);
        } else if (type === 'buffer') {
            g.fillCircle(20, 20, 18);
            g.lineStyle(3, 0xffffff, 0.34);
            g.strokeCircle(20, 20, 12);
            g.lineStyle(2, 0xffffff, 0.26);
            g.strokeCircle(20, 20, 18);
        }
        const size = type === 'tanker' ? 48 : (type === 'buffer' ? 40 : 36);
        g.generateTexture(key, size, size);
    }

    createSwordTexture(g, key, hazeColor, bladeColor, edgeColor) {
        g.clear();
        g.fillStyle(hazeColor, 0.14);
        g.fillTriangle(6, 12, 36, 4, 52, 12);
        g.fillTriangle(6, 12, 36, 20, 52, 12);
        g.fillStyle(bladeColor, 0.96);
        g.fillTriangle(11, 12, 38, 7, 56, 12);
        g.fillTriangle(11, 12, 38, 17, 56, 12);
        g.lineStyle(2, edgeColor, 0.72);
        g.strokeTriangle(11, 12, 38, 7, 56, 12);
        g.strokeTriangle(11, 12, 38, 17, 56, 12);
        g.lineStyle(1, edgeColor, 0.42);
        g.lineBetween(16, 12, 49, 12);
        g.fillStyle(0x101a24, 0.96);
        g.fillRoundedRect(5, 9, 10, 7, 3);
        g.fillStyle(edgeColor, 0.72);
        g.fillRoundedRect(0, 10, 13, 4, 2);
        g.fillStyle(0xffe76a, 0.9);
        g.fillCircle(12, 12, 2.5);
        g.generateTexture(key, 60, 24);
    }

    createGemTexture(g, key, color, size) {
        const center = size / 2;
        g.clear();
        g.fillStyle(color, 0.16);
        g.fillCircle(center, center, center);
        g.fillStyle(color, 0.34);
        g.fillCircle(center, center, center * 0.68);
        g.fillStyle(color, 0.95);
        g.fillCircle(center, center, center * 0.42);
        g.fillStyle(0xffffff, 0.86);
        g.fillCircle(center - center * 0.18, center - center * 0.2, Math.max(2, center * 0.16));
        g.lineStyle(1, 0xffffff, 0.58);
        g.strokeCircle(center, center, center * 0.44);
        g.generateTexture(key, size, size);
    }

    create() {
        this.resetGameData();

        this.playerManager = new PlayerManager(this);
        this.weaponManager = new WeaponManager(this);
        this.enemyManager = new EnemyManager(this);
        this.projectileManager = new ProjectileManager(this);
        this.collisionManager = new CollisionManager(this);
        this.effectsManager = new EffectsManager(this);
        this.uiManager = new UIManager(this);
        this.modalManager = new ModalManager(this);
        this.adminConsole = new AdminConsole(this);
        this.skinUploader = new SkinUploader(this);

        this.playerManager.create();
        this.weaponManager.create();
        this.enemyManager.create();
        this.projectileManager.create();
        this.effectsManager.create();
        this.uiManager.create();
        this.uiManager.resetWebUI();

        this.collisionManager.setup();
        this.skinUploader.setup();
        this.adminConsole.setup();
        this.setupPauseSystem();
        this.setGamePaused(false);
    }

    resetGameData() {
        playerStats.hp = 100;
        playerStats.maxHp = 100;
        playerStats.currentExp = 0;
        playerStats.nextLevelExp = 10;
        playerStats.currentLevel = 1;
        playerStats.bulletFireRate = 850;
        playerStats.bulletDamage = 10;
        playerStats.fireRateLevel = 0;
        playerStats.bulletDamageLevel = 0;
        playerStats.railgun = false;
        playerStats.swordCount = 0;
        playerStats.swordDamage = 7;
        playerStats.plasmaBlade = false;
        playerStats.lightningCount = 0;
        playerStats.lightningDamage = 45;
        playerStats.stormCaller = false;
        playerStats.magnetLevel = 0;
        playerStats.magnetRange = 140;
        playerStats.maxHpLevel = 0;
        playerStats.moveSpeed = CONSTANTS.PLAYER_BASE_SPEED;
        gameState.gameTime = 0;
        gameState.lastFired = 0;
        gameState.lastLightning = 0;
        gameState.lastPlasmaBlade = 0;
        gameState.lastPlayerHit = 0;
        gameState.lastShooterFire = 0;
        gameState.lastBossSpawnInterval = 0;
        gameState.lastMiniBossSpawnInterval = -1;
        gameState.enemiesKilled = 0;
        gameState.paused = false;
        gameState.isGodMode = false;
        gameState.worldX = 0;
        gameState.worldY = 0;
    }

    setGamePaused(paused) {
        gameState.paused = paused;
        if (!this.physics || !this.physics.world) return;
        if (paused) this.physics.world.pause();
        else this.physics.world.resume();
    }

    setupPauseSystem() {
        const pauseBtn = document.getElementById('pause-btn');
        const pauseModal = document.getElementById('pause-modal');
        const resumeBtn = document.getElementById('resume-btn');
        if (pauseBtn && pauseModal && resumeBtn) {
            pauseBtn.onclick = () => {
                this.setGamePaused(true);
                pauseModal.style.display = 'flex';
            };
            resumeBtn.onclick = () => {
                this.setGamePaused(false);
                pauseModal.style.display = 'none';
            };
        }
    }

    update(time, delta) {
        if (gameState.paused) return;

        const dt = delta / 1000;
        gameState.gameTime += delta;
        const totalSec = Math.floor(gameState.gameTime / 1000);
        this.uiManager.updateTimerUI(totalSec);
        this.uiManager.updateScoreUI();
        this.uiManager.updateWeaponDashboard();

        this.enemyManager.checkBossEvents(totalSec);

        const mins = totalSec / 60;
        const targetRate = this.enemyManager.getSpawnRate(mins);
        if (this.spawnTimer.delay !== targetRate) this.spawnTimer.delay = targetRate;

        const { dx, dy } = this.playerManager.update(dt);

        this.weaponManager.handleWeapons(time);

        this.enemyManager.simulateEnemies(dx, dy, dt, mins);

        this.uiManager.updateBossGlobalHP();

        this.projectileManager.updateProjectiles(dx, dy, dt);
    }
}

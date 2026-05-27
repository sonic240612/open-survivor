/**
 * 오픈 서바이버 (Open Survivor) - v1.0.24
 * 
 * [시스템 개조 리포트]
 * 1. 레벨 비례 난이도 심화: 레벨업 시 적의 체력, 속도, 스폰 속도가 동적으로 강화됩니다.
 * 2. 코드 구조화: StartScene과 MainScene 클래스로 명확히 분리 및 캡슐화 진행.
 * 3. UI 동기화: 폰트 및 요소 ID 정밀 조율 (Apple SD Gothic Neo 지원).
 * 4. 안정성: 캡슐화된 상태 객체를 통해 데이터 무결성 보장.
 * 
 * 작성자: 네코즈카 히비키 (밀레니엄 엔지니어부)
 */

// --- 1. 시스템 상수 관리 ---
const CONSTANTS = {
    SWORD_ORBIT_RADIUS: 100,
    PLAYER_BASE_SPEED: 280,
    ABSOLUTE_MAX_ENEMY_SPEED: 260, // 난이도 조정을 위해 최대 속도 상한 소폭 상향
    BASE_SPAWN_RATE: 1300,
    BASE_ENEMY_HP: 12,
    BASE_ENEMY_SPEED: 140,
    // 브라우저 범용 시스템 폰트 스택
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

// --- 2. 전역 상태 객체 (캡슐화 보조) ---
const playerStats = {
    hp: 100,
    maxHp: 100,
    currentExp: 0,
    nextLevelExp: 10,
    currentLevel: 1,
    bulletFireRate: 850,
    bulletDamage: 10,
    fireRateLevel: 0,
    bulletDamageLevel: 0,
    railgun: false,
    swordCount: 0,
    swordDamage: 7,
    plasmaBlade: false,
    lightningCount: 0,
    lightningDamage: 45,
    stormCaller: false,
    magnetLevel: 0,
    magnetRange: 60,
    maxHpLevel: 0,
    moveSpeed: CONSTANTS.PLAYER_BASE_SPEED
};

const gameState = {
    worldX: 0,
    worldY: 0,
    gameTime: 0,
    lastFired: 0,
    lastLightning: 0,
    lastPlasmaBlade: 0,
    lastPlayerHit: 0,
    lastShooterFire: 0,
    lastBossSpawnSec: -1,
    lastMiniBossSpawnSec: -1,
    paused: false,
    enemiesKilled: 0,
    isGodMode: false
};

// --- 3. 게임 시작 화면 클래스 ---
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        // 배경 그리드 텍스처 생성
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(CONSTANTS.COLORS.GRID_BG, 1);
        g.fillRect(0, 0, 100, 100);
        g.lineStyle(1, CONSTANTS.COLORS.GRID_LINE, 1);
        g.strokeRect(0, 0, 100, 100);
        g.generateTexture('grid', 100, 100);
    }

    create() {
        this.add.tileSprite(400, 300, 800, 600, 'grid');

        // 타이틀 텍스트
        this.add.text(400, 200, '오픈 서바이버', {
            fontSize: '64px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            fontWeight: 'bold',
            color: '#dffcff',
            stroke: '#071018',
            strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 0, color: '#00ffcc', blur: 18, fill: true }
        }).setOrigin(0.5);

        // 시작 버튼
        const btnGlow = this.add.rectangle(400, 400, 270, 94, 0x00ffb0, 0.11).setStrokeStyle(2, 0x72f7ff, 0.42);
        const btnBg = this.add.rectangle(400, 400, 250, 80, 0x06121c, 0.76).setStrokeStyle(2, 0x00ffb0, 0.88);
        const btnText = this.add.text(400, 400, '게임 시작', {
            fontSize: '32px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            color: '#f5fbff',
            fontWeight: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#00ffb0', blur: 12, fill: true }
        }).setOrigin(0.5);

        btnBg.setInteractive({ cursor: 'pointer' });
        btnBg.on('pointerover', () => {
            btnBg.setScale(1.06);
            btnText.setScale(1.06);
            btnGlow.setScale(1.08);
            btnBg.setFillStyle(0x082a28, 0.86);
        });
        btnBg.on('pointerout', () => {
            btnBg.setScale(1);
            btnText.setScale(1);
            btnGlow.setScale(1);
            btnBg.setFillStyle(0x06121c, 0.76);
        });
        btnBg.on('pointerdown', () => this.scene.start('MainScene'));
    }
}

/**
 * 메인 게임 씬 클래스
 */
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const createTex = (key, size, color, isRect = false) => {
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
        createTex('enemy_bullet_tex', 10, 0xff7aa8);
        this.createSwordTexture(g, 'sword_tex', 0xffffff, 0xeaf7ff, 0xffffff);
        this.createSwordTexture(g, 'plasma_sword_tex', 0x72f7ff, 0xdffcff, 0x72f7ff);
        createTex('spark_tex', 4, 0xffffff); // 스파크/폭발 연출용 미세 텍스처 추가
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

        // Soft outer energy haze
        g.fillStyle(hazeColor, 0.14);
        g.fillTriangle(6, 12, 36, 4, 52, 12);
        g.fillTriangle(6, 12, 36, 20, 52, 12);

        // Main blade silhouette
        g.fillStyle(bladeColor, 0.96);
        g.fillTriangle(11, 12, 38, 7, 56, 12);
        g.fillTriangle(11, 12, 38, 17, 56, 12);

        // Cyan edge and inner highlight
        g.lineStyle(2, edgeColor, 0.72);
        g.strokeTriangle(11, 12, 38, 7, 56, 12);
        g.strokeTriangle(11, 12, 38, 17, 56, 12);
        g.lineStyle(1, edgeColor, 0.42);
        g.lineBetween(16, 12, 49, 12);

        // Guard and handle
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
        // 시스템 및 데이터 초기화
        this.resetGameData();
        this.resetWebUI();

        // 맵 및 플레이어 배치
        this.background = this.add.tileSprite(400, 300, 800, 600, 'grid');
        this.player = this.add.sprite(400, 300, 'p_tex').setDepth(10);
        this.player.setDisplaySize(32, 32);
        this.playerSensor = this.add.circle(400, 300, 15);
        this.physics.add.existing(this.playerSensor);
        if (this.playerSensor.body) {
            this.playerSensor.body.setCircle(15); // 사각형이 아닌 완벽한 원형 충돌 판정 구현
        }

        // 개체 그룹 초기화
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.gems = this.physics.add.group();
        this.orbitalSwords = this.physics.add.group();
        this.hpBarGraphics = this.add.graphics().setDepth(20);

        // 파티클 이미터 초기화 (Phaser 3.60.0+ 호환)
        this.sparkEmitter = this.add.particles(0, 0, 'spark_tex', {
            lifespan: { min: 150, max: 350 },
            speed: { min: 80, max: 220 },
            scale: { start: 1.5, end: 0 },
            blendMode: 'ADD',
            emitting: false
        }).setDepth(15);

        // 입력 장치 매핑
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');

        // 스폰 엔진 기동
        this.spawnTimer = this.time.addEvent({
            delay: CONSTANTS.BASE_SPAWN_RATE,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this.setupCollisions();
        this.setupUploader();
        this.setupAdminConsole();
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
        playerStats.magnetRange = 60;
        playerStats.maxHpLevel = 0;
        playerStats.moveSpeed = CONSTANTS.PLAYER_BASE_SPEED;
        gameState.gameTime = 0;
        gameState.lastFired = 0;
        gameState.lastLightning = 0;
        gameState.lastPlasmaBlade = 0;
        gameState.lastPlayerHit = 0;
        gameState.lastShooterFire = 0;
        gameState.lastBossSpawnSec = -1;
        gameState.lastMiniBossSpawnSec = -1;
        gameState.enemiesKilled = 0;
        gameState.paused = false;
        gameState.isGodMode = false;
        gameState.worldX = 0;
        gameState.worldY = 0;
    }

    resetWebUI() {
        // HTML 요소 안전 접근
        const updateText = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
        const updateWidth = (id, pct) => { const el = document.getElementById(id); if (el) el.style.width = pct; };

        updateText('level', 'Lv. 1');
        updateWidth('exp-fill', '0%');
        updateWidth('hp-fill', '100%');
        updateText('timer', '00:00');
        this.updateWeaponDashboard();

        const gameOverModal = document.getElementById('game-over-modal');
        if (gameOverModal) gameOverModal.style.display = 'none';
    }

    setGamePaused(paused) {
        gameState.paused = paused;
        if (!this.physics || !this.physics.world) return;
        if (paused) this.physics.world.pause();
        else this.physics.world.resume();
    }

    setupCollisions() {
        this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
            if (!e.active || !b.active) return;
            this.hitEnemy(e, playerStats.bulletDamage, 'bullet');
            if (playerStats.railgun) {
                b.pierceLeft = (b.pierceLeft ?? 3) - 1;
                if (b.pierceLeft <= 0) b.destroy();
            } else {
                b.destroy();
            }
        });

        this.physics.add.overlap(this.orbitalSwords, this.enemies, (s, e) => {
            if (!e.active) return;
            this.hitEnemy(e, playerStats.swordDamage, 'sword');
            this.triggerPlasmaBladeStrike(e);
        });

        this.physics.add.overlap(this.playerSensor, this.enemies, (s, e) => {
            if (gameState.paused || !e.active || gameState.isGodMode) return;
            this.damagePlayer(e.isBoss ? 5 : 2);
        });

        this.physics.add.overlap(this.playerSensor, this.enemyBullets, (s, b) => {
            if (gameState.paused || !b.active || gameState.isGodMode) return;
            b.destroy();
            this.damagePlayer(3);
        });

        this.physics.add.overlap(this.playerSensor, this.gems, (s, g) => {
            if (!g.active) return;
            this.gainExp(g.expValue);
            g.destroy();
        });
    }

    damagePlayer(amount) {
        const now = this.time.now;
        if (now - gameState.lastPlayerHit < 300) return;
        gameState.lastPlayerHit = now;

        playerStats.hp -= amount;
        this.updateHPUI();
        this.cameras.main.shake(90, 0.004);

        if (playerStats.hp <= 0) this.triggerGameOver();
    }

    // 데미지 플로팅 텍스트 유틸리티
    showDamageNumber(x, y, amount, color = '#ffffff') {
        const txt = this.add.text(x + Phaser.Math.Between(-12, 12), y - 12, amount, {
            fontSize: '18px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            color: color,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: txt,
            y: txt.y - 45,
            alpha: 0,
            scale: 1.3,
            duration: 500,
            onComplete: () => txt.destroy()
        });
    }

    // 적 통합 피격 처리 (흰색 플래시 + 파티클 + 데미지 표기 + 사망 연출)
    hitEnemy(enemy, damage, type) {
        if (!enemy.active) return;
        enemy.hp -= damage;

        // 1. 데미지 플로팅 표시
        let color = '#ffffff';
        if (type === 'bullet') color = '#ffffff';
        else if (type === 'sword') color = '#e0e0e0';
        else if (type === 'lightning') color = '#ffffff';
        else if (type === 'plasma') color = '#72f7ff';
        this.showDamageNumber(enemy.x, enemy.y, damage, color);

        // 2. 피격 흰색 단색 플래시 (setTintFill)
        enemy.setTintFill(0xffffff);
        this.time.delayedCall(80, () => {
            if (enemy.active) enemy.clearTint();
        });

        // 3. 피격 스파크 파티클 튐
        this.sparkEmitter.emitParticleAt(enemy.x, enemy.y, (type === 'lightning' || type === 'plasma') ? 12 : 5);

        // 4. 체력 이하 사망 처리
        if (enemy.hp <= 0) {
            // 사망 시 화려한 폭발 파편 비산 파티클
            this.sparkEmitter.emitParticleAt(enemy.x, enemy.y, 16);
            this.onEnemyDeath(enemy);
        }
    }

    update(time, delta) {
        if (gameState.paused) return;

        const dt = delta / 1000;
        gameState.gameTime += delta;
        const totalSec = Math.floor(gameState.gameTime / 1000);
        this.updateTimerUI(totalSec);
        this.updateWeaponDashboard();

        this.checkBossEvents(totalSec);

        // [난이도 개조] 시간 + 레벨 복합 스케일링
        const mins = totalSec / 60;
        const targetRate = this.getSpawnRate(mins);
        if (this.spawnTimer.delay !== targetRate) this.spawnTimer.delay = targetRate;

        // 이동 및 배경 연산
        let dx = 0, dy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx = -playerStats.moveSpeed;
        else if (this.cursors.right.isDown || this.keys.D.isDown) dx = playerStats.moveSpeed;
        if (this.cursors.up.isDown || this.keys.W.isDown) dy = -playerStats.moveSpeed;
        else if (this.cursors.down.isDown || this.keys.S.isDown) dy = playerStats.moveSpeed;

        gameState.worldX += dx * dt;
        gameState.worldY += dy * dt;
        this.background.tilePositionX = gameState.worldX;
        this.background.tilePositionY = gameState.worldY;

        // 무기 로직
        this.handleWeapons(time);

        // 적 및 개체 시뮬레이션
        this.simulateEntities(dx, dy, dt, mins);
    }

    handleWeapons(time) {
        const activeEnemies = this.enemies.getChildren().filter(e => e.active);

        // 자동 소총 사격
        if (time > gameState.lastFired && activeEnemies.length > 0) {
            let closest = this.physics.closest(this.player, activeEnemies);
            if (closest && Phaser.Math.Distance.Between(400, 300, closest.x, closest.y) < 450) {
                const b = this.bullets.create(400, 300, 'b_tex');
                const ang = Phaser.Math.Angle.Between(400, 300, closest.x, closest.y);
                b.setRotation(ang);
                b.pierceLeft = playerStats.railgun ? 4 : 1;
                b.setTint(playerStats.railgun ? 0x72f7ff : 0xffffff);
                b.setDisplaySize(playerStats.railgun ? 22 : 12, playerStats.railgun ? 6 : 4);
                this.physics.velocityFromRotation(ang, playerStats.railgun ? 820 : 650, b.body.velocity);
                gameState.lastFired = time + playerStats.bulletFireRate;
            }
        }

        // 에너지 블레이드 오비탈
        this.orbitalSwords.getChildren().forEach((s, i) => {
            const ang = (time * 0.0035) + (i * (Math.PI * 2 / playerStats.swordCount));
            s.x = 400 + Math.cos(ang) * CONSTANTS.SWORD_ORBIT_RADIUS;
            s.y = 300 + Math.sin(ang) * CONSTANTS.SWORD_ORBIT_RADIUS;
            s.rotation = ang + Math.PI / 2;
            s.alpha = 0.82 + Math.sin(time * 0.008 + i) * 0.12;
            s.body.updateFromGameObject();
        });

        // 라이트닝 낙뢰
        if (playerStats.lightningCount > 0 && time > gameState.lastLightning && activeEnemies.length > 0) {
            for (let i = 0; i < playerStats.lightningCount; i++) {
                let t = Phaser.Utils.Array.GetRandom(activeEnemies);
                if (t) {
                    let beam = this.add.graphics().lineStyle(4, 0xffffff, 0.62).lineBetween(t.x, 0, t.x, t.y);
                    this.time.delayedCall(80, () => beam.destroy());
                    this.hitEnemy(t, playerStats.lightningDamage, 'lightning');
                    if (playerStats.stormCaller) this.chainStormLightning(t, activeEnemies);
                }
            }
            gameState.lastLightning = time + (playerStats.stormCaller ? 1900 : 2400);
        }
    }

    simulateEntities(dx, dy, dt, mins) {
        this.hpBarGraphics.clear();
        const activeBuffers = this.enemies.getChildren().filter(e => e.active && e.enemyType === 'buffer');

        this.enemies.getChildren().forEach(e => {
            if (!e.active) return;
            e.x -= dx * dt; e.y -= dy * dt;

            const ang = Phaser.Math.Angle.Between(e.x, e.y, 400, 300);
            const dist = Phaser.Math.Distance.Between(e.x, e.y, 400, 300);
            let curSpd = Math.min(CONSTANTS.ABSOLUTE_MAX_ENEMY_SPEED, CONSTANTS.BASE_ENEMY_SPEED + (mins * 11) + (playerStats.currentLevel * 3.2));
            let finalSpd = curSpd * (e.speedMult || 1);
            if (e.isElite) finalSpd *= 0.85;
            if (e.isBoss || e.isMiniBoss) finalSpd *= 0.4;
            if (this.isBuffedByEnemy(e, activeBuffers)) finalSpd *= 1.18;
            if (e.enemyType === 'shooter' && dist < 260) finalSpd *= -0.55;
            else if (e.enemyType === 'shooter' && dist < 360) finalSpd = 0;

            e.x += Math.cos(ang) * finalSpd * dt;
            e.y += Math.sin(ang) * finalSpd * dt;
            if (e.enemyType === 'shooter') this.tryShooterFire(e);

            // 체력 바
            this.hpBarGraphics.fillStyle(0xff0000);
            const bw = e.isBoss ? 60 : (e.isMiniBoss ? 40 : 30);
            const barY = e.y - (e.displayHeight / 2) - 10;
            this.hpBarGraphics.fillRect(e.x - bw / 2, barY, (e.hp / e.maxHP) * bw, 4);
            if (e.enemyType === 'buffer') {
                this.hpBarGraphics.lineStyle(1, 0x64ff9a, 0.16);
                this.hpBarGraphics.strokeCircle(e.x, e.y, 120);
            }

            if (Phaser.Math.Distance.Between(400, 300, e.x, e.y) > 1300 && !e.isBoss && !e.isMiniBoss) e.destroy();
        });

        // 투사체 및 보석 업데이트
        [this.bullets, this.enemyBullets, this.gems].forEach(grp => {
            grp.getChildren().forEach(obj => {
                obj.x -= dx * dt; obj.y -= dy * dt;
                if (grp === this.gems) {
                    const d = Phaser.Math.Distance.Between(400, 300, obj.x, obj.y);
                    if (d < playerStats.magnetRange) {
                        const a = Phaser.Math.Angle.Between(obj.x, obj.y, 400, 300);
                        obj.x += Math.cos(a) * 550 * dt; obj.y += Math.sin(a) * 550 * dt;
                    }
                }
                if (Phaser.Math.Distance.Between(400, 300, obj.x, obj.y) > 1200) obj.destroy();
            });
        });
    }

    isBuffedByEnemy(enemy, buffers) {
        if (enemy.enemyType === 'buffer') return false;
        return buffers.some(buffer => Phaser.Math.Distance.Between(enemy.x, enemy.y, buffer.x, buffer.y) < 120);
    }

    tryShooterFire(enemy) {
        const now = this.time.now;
        if (now - enemy.lastShot < 1450 || now - gameState.lastShooterFire < 210) return;
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, 400, 300);
        if (dist < 220 || dist > 520) return;

        const shot = this.enemyBullets.create(enemy.x, enemy.y, 'enemy_bullet_tex');
        shot.setDepth(11);
        shot.setAlpha(0.78);
        const ang = Phaser.Math.Angle.Between(enemy.x, enemy.y, 400, 300);
        this.physics.velocityFromRotation(ang, 275, shot.body.velocity);
        enemy.lastShot = now;
        gameState.lastShooterFire = now;
    }

    chainStormLightning(source, activeEnemies) {
        const candidates = activeEnemies
            .filter(e => e.active && e !== source && Phaser.Math.Distance.Between(source.x, source.y, e.x, e.y) < 180)
            .slice(0, 2);
        candidates.forEach((target, i) => {
            const beam = this.add.graphics()
                .lineStyle(2, 0xffffff, 0.46)
                .lineBetween(source.x, source.y, target.x, target.y);
            this.time.delayedCall(75 + i * 20, () => beam.destroy());
            this.hitEnemy(target, Math.floor(playerStats.lightningDamage * 0.45), 'lightning');
        });
    }

    spawnEnemy() {
        if (gameState.paused) return;
        const ang = Math.random() * Math.PI * 2, r = 650;
        const x = 400 + Math.cos(ang) * r, y = 300 + Math.sin(ang) * r;
        const mins = gameState.gameTime / 60000;
        const enemyType = this.pickEnemyType(mins);
        const config = this.getEnemyConfig(enemyType, mins);
        const isElite = !config.noElite && Math.random() * 100 < Math.min(24, 4 + Math.floor(mins) * 3.8);

        const e = this.enemies.create(x, y, isElite ? 'elite_tex' : config.tex);
        const ts = isElite ? Math.floor(config.size * 1.25) : config.size;
        e.setDisplaySize(ts, ts);

        const waveScale = 1.12 + (Math.min(mins, 15) * 0.2) + (playerStats.currentLevel * 0.05);
        e.hp = Math.floor(config.hp * waveScale * (isElite ? 2.3 : 1));
        e.maxHP = e.hp;
        e.isElite = isElite;
        e.enemyType = enemyType;
        e.speedMult = config.speedMult * (isElite ? 0.9 : 1);
        e.expBonus = config.expBonus || 0;
        e.canSplit = enemyType === 'splitter';
        e.lastShot = 0;
        if (e.body) {
            e.body.enable = true;
            e.body.setCircle(ts / 2); // 원형 충돌 판정 정밀화
        }
    }

    getSpawnRate(mins) {
        let rate;
        if (mins < 3) rate = 1050 - mins * 115;
        else if (mins < 7) rate = 790 - (mins - 3) * 85;
        else if (mins < 12) rate = 520 - (mins - 7) * 45;
        else rate = 330 - Math.min(mins - 12, 8) * 18;

        const seconds = Math.floor(gameState.gameTime / 1000);
        const bossSoon = seconds > 0 && (600 - (seconds % 600)) <= 30;
        if (bossSoon) rate += 180;

        return Math.max(135, Math.floor(rate - playerStats.currentLevel * 8));
    }

    pickEnemyType(mins) {
        const pool = mins < 3
            ? ['normal', 'normal', 'runner', 'runner', 'splitter']
            : mins < 7
                ? ['normal', 'runner', 'runner', 'tanker', 'splitter', 'splitter']
                : mins < 12
                    ? ['runner', 'runner', 'tanker', 'splitter', 'splitter', 'shooter', 'buffer']
                    : ['runner', 'tanker', 'tanker', 'splitter', 'shooter', 'shooter', 'buffer'];
        return Phaser.Utils.Array.GetRandom(pool);
    }

    getEnemyConfig(type) {
        const configs = {
            normal: { tex: 'e_tex', size: 32, hp: CONSTANTS.BASE_ENEMY_HP + 3, speedMult: 1.08, expBonus: 0 },
            runner: { tex: 'runner_tex', size: 30, hp: 10, speedMult: 1.58, expBonus: 1 },
            tanker: { tex: 'tanker_tex', size: 48, hp: 52, speedMult: 0.66, expBonus: 5 },
            splitter: { tex: 'splitter_tex', size: 36, hp: 25, speedMult: 1.02, expBonus: 3 },
            shooter: { tex: 'shooter_tex', size: 36, hp: 24, speedMult: 0.82, expBonus: 4 },
            buffer: { tex: 'buffer_tex', size: 40, hp: 38, speedMult: 0.76, expBonus: 6, noElite: true }
        };
        return configs[type] || configs.normal;
    }

    onEnemyDeath(e) {
        if (!e.active) return;
        gameState.enemiesKilled++;
        if (e.canSplit) this.spawnSplitterChildren(e.x, e.y);
        let type = 'gem_cyan', val = 1;
        const mins = Math.floor(gameState.gameTime / 60000);
        const roll = Math.random() * 100;
        if (e.isBoss) { type = 'gem_gold'; val = 200; }
        else if (e.isMiniBoss) { type = 'gem_purple'; val = 50; }
        else if (mins >= 10) { if (roll < 10) { type = 'gem_gold'; val = 100; } else if (roll < 40) { type = 'gem_purple'; val = 25; } else { type = 'gem_green'; val = 5; } }
        else { if (mins >= 5 && roll < 15) { type = 'gem_purple'; val = 20; } else if (mins >= 2 && roll < 30) { type = 'gem_green'; val = 5; } }
        val += e.expBonus || 0;
        const gem = this.gems.create(e.x, e.y, type).setDepth(5);
        gem.expValue = val;
        gem.setBlendMode(Phaser.BlendModes.ADD);
        gem.setAlpha(0.92);
        e.destroy();
    }

    spawnSplitterChildren(x, y) {
        const count = Phaser.Math.Between(2, 3);
        for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 / count) * i + Phaser.Math.FloatBetween(-0.25, 0.25);
            const child = this.enemies.create(x + Math.cos(ang) * 24, y + Math.sin(ang) * 24, 'runner_tex');
            child.setDisplaySize(22, 22);
            child.enemyType = 'runner';
            child.hp = 6 + Math.floor(playerStats.currentLevel * 0.8);
            child.maxHP = child.hp;
            child.speedMult = 1.55;
            child.expBonus = 0;
            child.canSplit = false;
            if (child.body) child.body.setCircle(11);
        }
    }

    gainExp(amount) {
        playerStats.currentExp += amount;
        let levelsGained = 0;
        while (playerStats.currentExp >= playerStats.nextLevelExp) {
            playerStats.currentExp -= playerStats.nextLevelExp;
            playerStats.currentLevel++;
            playerStats.nextLevelExp = Math.floor(playerStats.nextLevelExp * 1.15);
            levelsGained++;
        }
        const levelText = document.getElementById('level');
        if (levelText) levelText.innerText = `Lv. ${playerStats.currentLevel}`;
        if (levelsGained > 0) this.showLevelUpModal();

        const expFill = document.getElementById('exp-fill');
        if (expFill) expFill.style.width = `${(playerStats.currentExp / playerStats.nextLevelExp) * 100}%`;
    }

    showLevelUpModal() {
        const modal = document.getElementById('level-up-modal');
        const container = document.getElementById('options');
        if (!modal || !container) return;
        this.setGamePaused(true);
        modal.style.display = 'flex'; container.innerHTML = '';
        const pool = [
            { name: '연사 강화', desc: '총 연사 속도 20% 증가', fn: () => { playerStats.bulletFireRate *= 0.8; playerStats.fireRateLevel++; } },
            { name: '화력 상향', desc: '총 공격력 +15', fn: () => { playerStats.bulletDamage += 15; playerStats.bulletDamageLevel++; } },
            { name: '낙뢰 폭풍', desc: '라이트닝 수 +1', fn: () => playerStats.lightningCount++ },
            { name: '자기장 증폭', desc: '보석 자석 범위 +70px', fn: () => { playerStats.magnetRange += 70; playerStats.magnetLevel++; } },
            { name: '바이탈 코어', desc: '최대 체력 +20 및 체력 20 회복', fn: () => { playerStats.maxHp += 20; playerStats.maxHpLevel++; playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 20); this.updateHPUI(); } },
            { name: '긴급 복구', desc: '체력 60% 즉시 복구', fn: () => { playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 60); this.updateHPUI(); } }
        ];
        if (playerStats.swordCount < 6) {
            pool.push({ name: '에너지 블레이드', desc: '공전하는 블레이드 추가 (최대 6개)', fn: () => this.addOrbitalSword() });
        }
        if (!playerStats.plasmaBlade && playerStats.swordCount >= 6 && playerStats.lightningCount >= 3) {
            pool.push({ name: '플라즈마 블레이드', desc: '블레이드 타격 시 하늘색 라이트닝 추가', evolution: true, fn: () => this.upgradePlasmaBlade() });
        }
        if (!playerStats.railgun && playerStats.bulletDamageLevel >= 3 && playerStats.fireRateLevel >= 3) {
            pool.push({ name: '레일건', desc: '탄환 속도 증가 및 최대 4회 관통', evolution: true, fn: () => { playerStats.railgun = true; playerStats.bulletDamage += 20; } });
        }
        if (!playerStats.stormCaller && playerStats.lightningCount >= 5 && playerStats.magnetLevel >= 2) {
            pool.push({ name: '스톰 콜러', desc: '낙뢰 쿨다운 감소 및 주변 적 연쇄 타격', evolution: true, fn: () => { playerStats.stormCaller = true; playerStats.lightningDamage += 15; } });
        }

        const evolutionOptions = pool.filter(opt => opt.evolution);
        const choices = evolutionOptions.length > 0
            ? [...evolutionOptions.slice(0, 2), ...Phaser.Utils.Array.Shuffle(pool.filter(opt => !opt.evolution)).slice(0, 3 - Math.min(2, evolutionOptions.length))]
            : Phaser.Utils.Array.Shuffle(pool).slice(0, 3);

        choices.forEach(opt => {
            const card = document.createElement('div'); card.className = 'option-card';
            card.innerHTML = `<h3>${opt.name}</h3><p>${opt.desc}</p>`;
            card.onclick = () => {
                opt.fn();
                this.updateWeaponDashboard();
                modal.style.display = 'none';
                this.setGamePaused(false);
            };
            container.appendChild(card);
        });
    }

    triggerGameOver() {
        this.setGamePaused(true);
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.style.display = 'flex';
        const score = (Math.floor(gameState.gameTime / 1000) * 15) + (gameState.enemiesKilled * 60);
        document.getElementById('final-stats').innerHTML = `플레이 시간: ${document.getElementById('timer').innerText}<br>제거한 적: ${gameState.enemiesKilled}<br>최종 평가 점수: ${score.toLocaleString()}`;
    }

    checkBossEvents(sec) {
        if (sec > 0 && sec % 600 === 0 && gameState.lastBossSpawnSec !== sec) {
            gameState.lastBossSpawnSec = sec;
            this.spawnSpecialEnemy('boss_tex', 1000 + (sec / 60 * 450), true);
            this.showAlert("스테이지 보스 출현!");
        } else if (sec > 0 && (sec - 300) % 600 === 0 && gameState.lastMiniBossSpawnSec !== sec) {
            gameState.lastMiniBossSpawnSec = sec;
            this.spawnSpecialEnemy('miniboss_tex', 450 + (sec / 60 * 220), false);
            this.showAlert("미니 보스 출현!");
        }
    }

    spawnSpecialEnemy(tex, hp, isBoss) {
        const ang = Math.random() * Math.PI * 2, r = 500;
        const e = this.enemies.create(400 + Math.cos(ang) * r, 300 + Math.sin(ang) * r, tex);
        e.hp = hp; e.maxHP = hp; e.isBoss = isBoss; e.isMiniBoss = !isBoss;
        const sz = isBoss ? 80 : 64;
        e.setDisplaySize(sz, sz);
        if (e.body) {
            e.body.enable = true;
            e.body.setCircle(sz / 2); // 원형 충돌 판정 정밀화
        }
    }

    showAlert(txt) { const box = document.getElementById('alert-box'); if (box) { box.innerText = txt; box.style.display = 'block'; setTimeout(() => box.style.display = 'none', 3000); } }
    updateTimerUI(sec) { const m = Math.floor(sec / 60).toString().padStart(2, '0'); const s = (sec % 60).toString().padStart(2, '0'); document.getElementById('timer').innerText = `${m}:${s}`; }
    updateHPUI() { document.getElementById('hp-fill').style.width = `${(playerStats.hp / playerStats.maxHp) * 100}%`; }
    addOrbitalSword() {
        playerStats.swordCount++;
        const sword = this.orbitalSwords.create(400, 300, playerStats.plasmaBlade ? 'plasma_sword_tex' : 'sword_tex');
        sword.setDepth(12);
        sword.setBlendMode(Phaser.BlendModes.ADD);
        sword.setAlpha(0.92);
        if (sword.body) {
            sword.body.setSize(48, 12);
            sword.body.setOffset(6, 6);
            sword.body.setImmovable(true);
        }
    }
    upgradePlasmaBlade() {
        playerStats.plasmaBlade = true;
        this.orbitalSwords.getChildren().forEach(sword => {
            if (sword.active) sword.setTexture('plasma_sword_tex');
        });
    }
    triggerPlasmaBladeStrike(enemy) {
        if (!playerStats.plasmaBlade || !enemy.active) return;
        const now = this.time.now;
        if (now - gameState.lastPlasmaBlade < 180) return;
        if (enemy.lastPlasmaStrike && now - enemy.lastPlasmaStrike < 520) return;
        gameState.lastPlasmaBlade = now;
        enemy.lastPlasmaStrike = now;

        const beam = this.add.graphics()
            .lineStyle(3, 0x72f7ff, 0.74)
            .lineBetween(enemy.x, enemy.y - 140, enemy.x, enemy.y + 8);
        this.time.delayedCall(70, () => beam.destroy());
        this.hitEnemy(enemy, Math.floor(playerStats.lightningDamage * 0.65), 'plasma');
    }
    updateWeaponDashboard() {
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };
        const weaponTypes = [playerStats.railgun ? '레일건' : '자동 소총'];
        if (playerStats.lightningCount > 0) weaponTypes.push(playerStats.stormCaller ? '스톰 콜러' : '낙뢰');
        if (playerStats.swordCount > 0) weaponTypes.push(playerStats.plasmaBlade ? '플라즈마 블레이드' : '에너지 블레이드');

        setText('weapon-types', weaponTypes.join(' / '));
        setText('weapon-fire-rate', `${(1000 / playerStats.bulletFireRate).toFixed(2)}/s`);
        setText('weapon-damage', playerStats.bulletDamage.toLocaleString());
        setText('weapon-lightning', `${playerStats.lightningCount}개`);
        setText('weapon-swords', `${playerStats.swordCount}개`);
    }

    setupAdminConsole() {
        const lvlText = document.getElementById('level');
        const panel = document.getElementById('admin-panel');
        if (lvlText && panel) lvlText.onclick = () => panel.style.display = (panel.style.display === 'block' ? 'none' : 'block');
        document.getElementById('god-btn').onclick = () => {
            gameState.isGodMode = !gameState.isGodMode;
            document.getElementById('god-btn').innerText = `무적 모드: ${gameState.isGodMode ? 'ON' : 'OFF'}`;
            document.getElementById('hp-fill').style.background = gameState.isGodMode ? "#ffdd00" : "#ff3333";
        };
        document.getElementById('time-btn').onclick = () => gameState.gameTime += 60000;
        document.getElementById('lvl-btn').onclick = () => this.gainExp(playerStats.nextLevelExp);
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

    setupUploader() {
        // 이미지를 원형 크롭 후 텍스처로 등록하는 범용 핸들러
        const handle = (id, tex, displaySize, filterFn, callback) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 128; canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        ctx.beginPath(); ctx.arc(64, 64, 64, 0, Math.PI * 2); ctx.clip();
                        ctx.drawImage(img, 0, 0, 128, 128);
                        this.textures.remove(tex);
                        this.textures.addCanvas(tex, canvas);
                        // 인게임 활성화된 해당 유형의 적 실시간 갱신
                        this.enemies.getChildren().forEach(c => {
                            if (filterFn(c)) {
                                c.setTexture(tex);
                                c.setDisplaySize(displaySize, displaySize);
                                if (c.body) c.body.setCircle(displaySize / 2);
                            }
                        });
                        if (callback) callback(tex);
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            };
        };

        // 플레이어 스킨
        handle('p-up', 'p_tex', 32,
            () => false, // 적 필터 없음
            (t) => { this.player.setTexture(t); this.player.setDisplaySize(32, 32); }
        );

        // 일반 적 스킨 (isElite가 아닌 기본 몹)
        handle('e-up', 'e_tex', 32,
            (c) => !c.isElite && !c.isBoss && !c.isMiniBoss
        );

        // 엘리트 적 스킨
        handle('elite-up', 'elite_tex', 48,
            (c) => c.isElite
        );

        // 미니 보스 스킨
        handle('miniboss-up', 'miniboss_tex', 64,
            (c) => c.isMiniBoss
        );

        // 스테이지 보스 스킨
        handle('boss-up', 'boss_tex', 80,
            (c) => c.isBoss
        );
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800, height: 600,
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [StartScene, MainScene]
};

const game = new Phaser.Game(config);

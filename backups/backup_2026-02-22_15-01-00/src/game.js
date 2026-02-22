// 게임 설정 및 전역 상태를 관리하는 상수
const CONSTANTS = {
    SWORD_ORBIT_RADIUS: 100,
    PLAYER_BASE_SPEED: 280,
    ABSOLUTE_MAX_ENEMY_SPEED: 245,
    BASE_SPAWN_RATE: 1300,
    BASE_ENEMY_HP: 12,
    BASE_ENEMY_SPEED: 140,
    // 모든 브라우저에서 일관된 macOS 느낌을 유지하기 위한 폰트 스택
    FONT_FAMILY: "'Apple SD Gothic Neo', 'Apple SD 산돌고딕 Neo'",
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
        BULLET: 0xffffff,
        SWORD: 0xaaaaaa,
        GRID_BG: 0x151515,
        GRID_LINE: 0x222222,
        BEAM: 0x00ffff,
        HP_BAR: 0xff0000
    }
};

// 플레이어의 스탯을 관리하는 객체
const playerStats = {
    hp: 100,
    maxHp: 100,
    currentExp: 0,
    nextLevelExp: 10,
    currentLevel: 1,
    bulletFireRate: 850,
    bulletDamage: 10,
    swordCount: 0,
    swordDamage: 7,
    lightningCount: 0,
    lightningDamage: 45,
    magnetRange: 60,
    moveSpeed: CONSTANTS.PLAYER_BASE_SPEED
};

// 게임의 주요 상태를 관리하는 객체
const gameState = {
    worldX: 0,
    worldY: 0,
    gameTime: 0,
    lastFired: 0,
    lastLightning: 0,
    paused: false,
    enemiesKilled: 0,
    isGodMode: false
};

/**
 * 게임 시작 화면 클래스
 */
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(CONSTANTS.COLORS.GRID_BG, 1);
        g.fillRect(0, 0, 100, 100);
        g.lineStyle(1, CONSTANTS.COLORS.GRID_LINE, 1);
        g.strokeRect(0, 0, 100, 100);
        g.generateTexture('grid', 100, 100);
    }

    create() {
        this.add.tileSprite(400, 300, 800, 600, 'grid');

        // 게임 제목 (애플 SD 산돌고딕 Neo 적용)
        this.add.text(400, 200, '오픈 서바이버', {
            fontSize: '64px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            fontWeight: 'bold',
            color: '#00ff88',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        const btnBg = this.add.rectangle(400, 400, 250, 80, 0x00ff88).setStrokeStyle(2, 0xffffff);
        const btnText = this.add.text(400, 400, '게임 시작', {
            fontSize: '32px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            color: '#000',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        btnBg.setInteractive({ cursor: 'pointer' });

        btnBg.on('pointerover', () => {
            btnBg.setScale(1.1);
            btnText.setScale(1.1);
            btnBg.setFillStyle(0x00cc66);
        });
        btnBg.on('pointerout', () => {
            btnBg.setScale(1);
            btnText.setScale(1);
            btnBg.setFillStyle(0x00ff88);
        });
        btnBg.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        this.add.text(790, 585, 'v1.0.23', {
            fontSize: '14px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            color: '#666'
        }).setOrigin(1, 1);
    }
}

// 메인 게임 씬을 클래스로 캡슐화
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        const createTexture = (key, width, height, color, isRect = false, drawFn = null) => {
            g.clear();
            g.fillStyle(color, 1);
            if (drawFn) {
                drawFn(g);
            } else if (isRect) {
                g.fillRect(0, 0, width, height);
            } else {
                g.fillCircle(width / 2, height / 2, width / 2);
            }
            g.generateTexture(key, width, height);
        };

        createTexture('p_tex', 32, 32, CONSTANTS.COLORS.PLAYER);
        createTexture('e_tex', 32, 32, CONSTANTS.COLORS.ENEMY);
        createTexture('elite_tex', 48, 48, CONSTANTS.COLORS.ELITE);
        createTexture('miniboss_tex', 64, 64, CONSTANTS.COLORS.MINIBOSS);
        createTexture('boss_tex', 80, 80, CONSTANTS.COLORS.BOSS);
        createTexture('gem_cyan', 12, 12, CONSTANTS.COLORS.GEM_CYAN);
        createTexture('gem_green', 12, 12, CONSTANTS.COLORS.GEM_GREEN);
        createTexture('gem_purple', 16, 16, CONSTANTS.COLORS.GEM_PURPLE);
        createTexture('gem_gold', 20, 20, CONSTANTS.COLORS.GEM_GOLD);
        createTexture('b_tex', 12, 4, CONSTANTS.COLORS.BULLET, true);
        createTexture('sword_tex', 48, 8, CONSTANTS.COLORS.SWORD, true);
    }

    create() {
        // 데이터 초기화
        playerStats.hp = 100;
        playerStats.currentExp = 0;
        playerStats.nextLevelExp = 10;
        playerStats.currentLevel = 1;
        playerStats.swordCount = 0;
        gameState.gameTime = 0;
        gameState.enemiesKilled = 0;
        gameState.paused = false;
        gameState.worldX = 0;
        gameState.worldY = 0;

        // UI 텍스트 초기화
        const levelText = document.getElementById('level-ui');
        if (levelText) levelText.innerText = 'Lv. 1';
        const expFill = document.getElementById('exp-bar-fill');
        if (expFill) expFill.style.width = '0%';
        const hpFill = document.getElementById('hp-fill');
        if (hpFill) hpFill.style.width = '100%';
        const timerText = document.getElementById('timer');
        if (timerText) timerText.innerText = '00:00';

        this.background = this.add.tileSprite(400, 300, 800, 600, 'grid');
        this.player = this.add.sprite(400, 300, 'p_tex').setDepth(10);
        this.player.setDisplaySize(32, 32);
        this.playerSensor = this.add.circle(400, 300, 15);
        this.physics.add.existing(this.playerSensor);

        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.gems = this.physics.add.group();
        this.orbitalSwords = this.physics.add.group();
        this.hpBarGraphics = this.add.graphics().setDepth(20);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');

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
    }

    setupCollisions() {
        this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
            if (!e.active || !b.active) return;
            b.destroy();
            e.hp -= playerStats.bulletDamage;
            if (e.hp <= 0) this.onEnemyDeath(e);
        });

        this.physics.add.overlap(this.orbitalSwords, this.enemies, (s, e) => {
            if (!e.active) return;
            e.hp -= playerStats.swordDamage;
            if (e.hp <= 0) this.onEnemyDeath(e);
        });

        this.physics.add.overlap(this.playerSensor, this.enemies, (s, e) => {
            if (gameState.paused || !e.active || gameState.isGodMode) return;
            playerStats.hp -= (e.isBoss ? 1.2 : 0.4);
            this.updateHPUI();
            if (playerStats.hp <= 0) this.triggerGameOver();
        });

        this.physics.add.overlap(this.playerSensor, this.gems, (s, g) => {
            if (!g.active) return;
            this.gainExp(g.expValue);
            g.destroy();
        });
    }

    update(time, delta) {
        if (gameState.paused) return;

        const dt = delta / 1000;
        gameState.gameTime += delta;
        const totalSec = Math.floor(gameState.gameTime / 1000);
        this.updateTimerUI(totalSec);

        this.checkBossEvents(totalSec);

        const mins = totalSec / 60;
        const targetRate = Math.max(150, CONSTANTS.BASE_SPAWN_RATE - (Math.min(mins, 15) * 180));
        if (this.spawnTimer.delay !== targetRate) this.spawnTimer.delay = targetRate;

        const { dx, dy } = this.handleMovement(dt);
        this.handleWeapons(time, dt);
        this.handleEntities(dx, dy, dt, mins);
    }

    handleMovement(dt) {
        let dx = 0, dy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx = -playerStats.moveSpeed;
        else if (this.cursors.right.isDown || this.keys.D.isDown) dx = playerStats.moveSpeed;

        if (this.cursors.up.isDown || this.keys.W.isDown) dy = -playerStats.moveSpeed;
        else if (this.cursors.down.isDown || this.keys.S.isDown) dy = playerStats.moveSpeed;

        gameState.worldX += dx * dt;
        gameState.worldY += dy * dt;
        this.background.tilePositionX = gameState.worldX;
        this.background.tilePositionY = gameState.worldY;

        return { dx, dy };
    }

    handleWeapons(time, dt) {
        const activeEnemies = this.enemies.getChildren().filter(e => e.active);

        if (time > gameState.lastFired && activeEnemies.length > 0) {
            let closest = this.physics.closest(this.player, activeEnemies);
            if (closest && Phaser.Math.Distance.Between(400, 300, closest.x, closest.y) < 450) {
                const b = this.bullets.create(400, 300, 'b_tex');
                const ang = Phaser.Math.Angle.Between(400, 300, closest.x, closest.y);
                b.setRotation(ang);
                this.physics.velocityFromRotation(ang, 650, b.body.velocity);
                gameState.lastFired = time + playerStats.bulletFireRate;
            }
        }

        this.orbitalSwords.getChildren().forEach((s, i) => {
            const ang = (time * 0.0035) + (i * (Math.PI * 2 / playerStats.swordCount));
            s.x = 400 + Math.cos(ang) * CONSTANTS.SWORD_ORBIT_RADIUS;
            s.y = 300 + Math.sin(ang) * CONSTANTS.SWORD_ORBIT_RADIUS;
            s.rotation = ang + Math.PI / 2;
            s.body.updateFromGameObject();
        });

        if (playerStats.lightningCount > 0 && time > gameState.lastLightning && activeEnemies.length > 0) {
            for (let i = 0; i < playerStats.lightningCount; i++) {
                let t = Phaser.Utils.Array.GetRandom(activeEnemies);
                if (t) {
                    let beam = this.add.graphics()
                        .lineStyle(3, CONSTANTS.COLORS.BEAM, 1)
                        .lineBetween(t.x, 0, t.x, t.y);
                    this.time.delayedCall(80, () => beam.destroy());
                    t.hp -= playerStats.lightningDamage;
                    if (t.hp <= 0) this.onEnemyDeath(t);
                }
            }
            gameState.lastLightning = time + 2400;
        }
    }

    handleEntities(dx, dy, dt, mins) {
        this.hpBarGraphics.clear();

        this.enemies.getChildren().forEach(e => {
            if (!e.active) return;
            e.x -= dx * dt;
            e.y -= dy * dt;

            const ang = Phaser.Math.Angle.Between(e.x, e.y, 400, 300);
            let curSpd = Math.min(CONSTANTS.ABSOLUTE_MAX_ENEMY_SPEED, CONSTANTS.BASE_ENEMY_SPEED + (mins * 8));
            const finalSpd = (e.isElite ? curSpd * 0.55 : (e.isBoss || e.isMiniBoss ? curSpd * 0.4 : curSpd));

            e.x += Math.cos(ang) * finalSpd * dt;
            e.y += Math.sin(ang) * finalSpd * dt;

            this.hpBarGraphics.fillStyle(CONSTANTS.COLORS.HP_BAR);
            const bw = e.isBoss ? 60 : (e.isMiniBoss ? 40 : 30);
            const barY = e.y - (e.displayHeight / 2) - 10;
            this.hpBarGraphics.fillRect(e.x - bw / 2, barY, (e.hp / e.maxHP) * bw, 4);

            if (Phaser.Math.Distance.Between(400, 300, e.x, e.y) > 1300 && !e.isBoss && !e.isMiniBoss) e.destroy();
        });

        this.bullets.getChildren().forEach(b => {
            b.x -= dx * dt;
            b.y -= dy * dt;
            if (Phaser.Math.Distance.Between(400, 300, b.x, b.y) > 1000) b.destroy();
        });

        this.gems.getChildren().forEach(g => {
            if (!g.active) return;
            g.x -= dx * dt;
            g.y -= dy * dt;
            const d = Phaser.Math.Distance.Between(400, 300, g.x, g.y);
            if (d < playerStats.magnetRange) {
                const ang = Phaser.Math.Angle.Between(g.x, g.y, 400, 300);
                g.x += Math.cos(ang) * 550 * dt;
                g.y += Math.sin(ang) * 550 * dt;
            }
            if (d > 1300) g.destroy();
        });
    }

    spawnEnemy() {
        if (gameState.paused) return;
        const ang = Math.random() * Math.PI * 2;
        const r = 650;
        const x = 400 + Math.cos(ang) * r;
        const y = 300 + Math.sin(ang) * r;
        const mins = Math.floor(gameState.gameTime / 60000);
        const isElite = Math.random() * 100 < Math.min(30, mins * 8);
        const e = this.enemies.create(x, y, isElite ? 'elite_tex' : 'e_tex');
        const ts = isElite ? 48 : 32;
        e.setDisplaySize(ts, ts);
        e.hp = (isElite ? CONSTANTS.BASE_ENEMY_HP * 6 : CONSTANTS.BASE_ENEMY_HP) + (Math.min(mins, 15) * 8);
        e.maxHP = e.hp;
        e.isElite = isElite;
        if (e.body) e.body.enable = true;
    }

    checkBossEvents(sec) {
        if (sec > 0 && sec % 600 === 0 && gameState.gameTime % 1000 < 50) {
            this.spawnSpecialEnemy('boss_tex', 1000 + (sec / 60 * 450), true);
            this.showAlert("스테이지 보스 출현!");
        } else if (sec > 0 && (sec - 300) % 600 === 0 && gameState.gameTime % 1000 < 50) {
            this.spawnSpecialEnemy('miniboss_tex', 450 + (sec / 60 * 220), false);
            this.showAlert("미니 보스 출현!");
        }
    }

    spawnSpecialEnemy(tex, hp, isBoss) {
        const ang = Math.random() * Math.PI * 2, r = 500;
        const e = this.enemies.create(400 + Math.cos(ang) * r, 300 + Math.sin(ang) * r, tex);
        e.hp = hp; e.maxHP = hp; e.isBoss = isBoss; e.isMiniBoss = !isBoss;
        const sz = isBoss ? 80 : 64; e.setDisplaySize(sz, sz);
        if (e.body) e.body.enable = true;
    }

    onEnemyDeath(e) {
        if (!e.active) return;
        gameState.enemiesKilled++;
        let type = 'gem_cyan', val = 1;
        const mins = Math.floor(gameState.gameTime / 60000);
        const roll = Math.random() * 100;
        if (e.isBoss) { type = 'gem_gold'; val = 200; }
        else if (e.isMiniBoss) { type = 'gem_purple'; val = 50; }
        else if (mins >= 10) {
            if (roll < 10) { type = 'gem_gold'; val = 100; }
            else if (roll < 40) { type = 'gem_purple'; val = 25; }
            else { type = 'gem_green'; val = 5; }
        } else {
            if (mins >= 5 && roll < 15) { type = 'gem_purple'; val = 20; }
            else if (mins >= 2 && roll < 30) { type = 'gem_green'; val = 5; }
        }
        this.gems.create(e.x, e.y, type).setDepth(5).expValue = val;
        e.destroy();
    }

    gainExp(amount) {
        playerStats.currentExp += amount;
        if (playerStats.currentExp >= playerStats.nextLevelExp) {
            playerStats.currentExp -= playerStats.nextLevelExp;
            playerStats.currentLevel++;
            playerStats.nextLevelExp = Math.floor(playerStats.nextLevelExp * 1.15);
            const levelText = document.getElementById('level');
            if (levelText) levelText.innerText = `Lv. ${playerStats.currentLevel}`;
            this.showLevelUpModal();
        }
        const expFill = document.getElementById('exp-fill');
        if (expFill) expFill.style.width = `${(playerStats.currentExp / playerStats.nextLevelExp) * 100}%`;
    }

    showLevelUpModal() {
        gameState.paused = true;
        const modal = document.getElementById('level-up-modal');
        const container = document.getElementById('options');
        if (!modal || !container) return;
        modal.style.display = 'flex';
        container.innerHTML = '';
        const pool = [
            { name: '연사 강화', desc: '총 연사 속도 20% 증가', fn: () => playerStats.bulletFireRate *= 0.8 },
            { name: '화력 상향', desc: '총 공격력 +15', fn: () => playerStats.bulletDamage += 15 },
            { name: '낙뢰 폭풍', desc: '라이트닝 수 +1', fn: () => playerStats.lightningCount++ },
            { name: '자기장 증폭', desc: '보석 자석 범위 +70px', fn: () => playerStats.magnetRange += 70 },
            { name: '긴급 복구', desc: '체력 60% 즉시 복구', fn: () => { playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 60); this.updateHPUI(); } }
        ];
        if (playerStats.swordCount < 6) {
            pool.push({ name: '위성 검 가동', desc: '공전하는 위성 검 추가 (최대 6개)', fn: () => { playerStats.swordCount++; this.orbitalSwords.create(400, 300, 'sword_tex').body.setImmovable(true); } });
        }
        Phaser.Utils.Array.Shuffle(pool).slice(0, 3).forEach(opt => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = `<h3 style="font-family: ${CONSTANTS.FONT_FAMILY}">${opt.name}</h3><p style="font-family: ${CONSTANTS.FONT_FAMILY}">${opt.desc}</p>`;
            card.onclick = () => { opt.fn(); modal.style.display = 'none'; gameState.paused = false; };
            container.appendChild(card);
        });
    }

    triggerGameOver() {
        gameState.paused = true;
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.style.display = 'flex';
        const score = (Math.floor(gameState.gameTime / 1000) * 15) + (gameState.enemiesKilled * 60);
        const timerText = document.getElementById('timer') ? document.getElementById('timer').innerText : "00:00";
        document.getElementById('final-stats').innerHTML = `플레이 시간: ${timerText}<br>제거한 적: ${gameState.enemiesKilled}<br>최종 평가 점수: ${score.toLocaleString()}`;
    }

    showAlert(txt) {
        const box = document.getElementById('alert-box');
        if (box) { box.innerText = txt; box.style.display = 'block'; setTimeout(() => box.style.display = 'none', 3000); }
    }

    updateTimerUI(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        const el = document.getElementById('timer');
        if (el) el.innerText = `${m}:${s}`;
    }

    updateHPUI() {
        const el = document.getElementById('hp-fill');
        if (el) el.style.width = `${(playerStats.hp / playerStats.maxHp) * 100}%`;
    }

    setupAdminConsole() {
        const lvlText = document.getElementById('level');
        const panel = document.getElementById('admin-panel');
        if (lvlText && panel) lvlText.onclick = () => panel.style.display = (panel.style.display === 'block' ? 'none' : 'block');
        const godBtn = document.getElementById('god-btn');
        if (godBtn) godBtn.onclick = () => {
            gameState.isGodMode = !gameState.isGodMode;
            godBtn.innerText = `무적 모드: ${gameState.isGodMode ? 'ON' : 'OFF'}`;
            const hpFill = document.getElementById('hp-fill');
            if (hpFill) hpFill.style.background = gameState.isGodMode ? "#ffdd00" : "#ff3333";
        };
        const timeBtn = document.getElementById('time-btn');
        if (timeBtn) timeBtn.onclick = () => gameState.gameTime += 60000;
        const lvlBtn = document.getElementById('lvl-btn');
        if (lvlBtn) lvlBtn.onclick = () => this.gainExp(playerStats.nextLevelExp);
    }

    setupPauseSystem() {
        const pauseBtn = document.getElementById('pause-btn');
        const pauseModal = document.getElementById('pause-modal');
        const resumeBtn = document.getElementById('resume-btn');
        if (pauseBtn && pauseModal && resumeBtn) {
            pauseBtn.onclick = () => { gameState.paused = true; pauseModal.style.display = 'flex'; };
            resumeBtn.onclick = () => { gameState.paused = false; pauseModal.style.display = 'none'; };
        }
    }

    setupUploader() {
        const handle = (id, tex, callback) => {
            const el = document.getElementById(id);
            if (el) el.onchange = (e) => {
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
                        callback(tex);
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            };
        };
        handle('p-up', 'p_tex', (t) => { this.player.setTexture(t); this.player.setDisplaySize(32, 32); });
        handle('e-up', 'e_tex', (t) => {
            this.enemies.getChildren().forEach(c => {
                if (c.texture.key === t) {
                    c.setTexture(t);
                    const ts = c.isElite ? 48 : (c.isBoss ? 80 : (c.isMiniBoss ? 64 : 32));
                    c.setDisplaySize(ts, ts);
                    if (c.body) c.body.setSize(c.width, c.height);
                }
            });
        });
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

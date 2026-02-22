/**
 * 오픈 서바이버 (Open Survivor) - v1.0.25 Stable
 * 
 * [시스템 업데이트 리포트]
 * 1. 난이도 밸런싱: 시간 및 레벨 비례 난이도 상승폭을 적정 수준으로 조정 (v1.0.24 대비 하향).
 * 2. UI 정밀 튜닝: 게임 시작 화면의 버전 표기를 제거하고 사이드바 하단으로 일원화.
 * 3. 캡슐화 설계: StartScene과 MainScene 클래스 기반의 구조화된 코드 유지.
 * 4. 안정성 확보: 씬 전환 시 데이터 초기화 및 UI 동기화 로직 보강.
 * 
 * 제작: 네코즈카 히비키 (밀레니엄 엔지니어부)
 */

// --- 1. 시스템 상수 관리 ---
const CONST = {
    WIDTH: 800,
    HEIGHT: 600,
    ORBIT_RADIUS: 100,
    PLAYER_SPEED: 280,
    MAX_ENEMY_SPEED: 245,
    SPAWN_RATE: 1300,
    // macOS 시스템 폰트 느낌을 위한 폰트 스택
    FONT_FAMILY: "'Apple SD Gothic Neo', 'Apple SD 산돌고딕 Neo', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    COLORS: {
        BG: 0x151515,
        LINE: 0x222222,
        PLAYER: 0x00ff00,
        ENEMY: 0xff0000,
        BOSS: 0xff0055,
        EXP: 0x00ffff,
        GOLD: 0xffdd00
    }
};

/**
 * 게임 시작 화면 클래스 (StartScene)
 */
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(CONST.COLORS.BG, 1);
        g.fillRect(0, 0, 100, 100);
        g.lineStyle(1, CONST.COLORS.LINE, 1);
        g.strokeRect(0, 0, 100, 100);
        g.generateTexture('grid', 100, 100);
    }

    create() {
        this.add.tileSprite(400, 300, 800, 600, 'grid');

        // 타이틀 텍스트
        this.add.text(400, 200, '오픈 서바이버', {
            fontSize: '64px',
            fontFamily: CONST.FONT_FAMILY,
            fontWeight: 'bold',
            color: '#00ff88',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // 시작 버튼 컨테이너
        const btnBg = this.add.rectangle(0, 0, 250, 80, 0x00ff88).setStrokeStyle(2, 0xffffff);
        const btnText = this.add.text(0, 0, '게임 시작', {
            fontSize: '32px',
            fontFamily: CONST.FONT_FAMILY,
            color: '#000',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        const startButton = this.add.container(400, 400, [btnBg, btnText]);
        btnBg.setInteractive({ cursor: 'pointer' });

        btnBg.on('pointerover', () => { startButton.setScale(1.1); btnBg.setFillStyle(0x00cc66); });
        btnBg.on('pointerout', () => { startButton.setScale(1); btnBg.setFillStyle(0x00ff88); });
        btnBg.on('pointerdown', () => {
            console.log("시스템 가동: MainScene으로 진입합니다.");
            this.scene.start('MainScene');
        });

        // [수정] 시작 화면의 버전 표기를 제거하고 사이드바 하단으로 통합했습니다.
    }
}

/**
 * 메인 게임 엔진 클래스 (MainScene)
 */
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    /**
     * 게임 데이터 초기화 (캡슐화)
     */
    init() {
        this.worldX = 0;
        this.worldY = 0;
        this.gameTime = 0;
        this.paused = false;
        this.enemiesKilled = 0;
        this.isGodMode = false;
        this.lastFired = 0;
        this.lastLightning = 0;

        // 플레이어 상태 스탯
        this.playerStats = {
            hp: 100,
            maxHp: 100,
            level: 1,
            exp: 0,
            nextExp: 10,
            bulletFireRate: 850,
            bulletDamage: 10,
            swordCount: 0,
            swordDamage: 7,
            lightningCount: 0,
            lightningDamage: 45,
            magnetRange: 60
        };
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const genTex = (key, size, color, isRect = false) => {
            g.clear(); g.fillStyle(color, 1);
            if (isRect) g.fillRect(0, 0, size, size/4 || 4);
            else g.fillCircle(size/2, size/2, size/2);
            g.generateTexture(key, size, size);
        };

        genTex('p_tex', 32, 0x00ff00);
        genTex('e_tex', 32, 0xff0000);
        genTex('elite_tex', 48, 0xffff00);
        genTex('miniboss_tex', 64, 0xffaa00);
        genTex('boss_tex', 80, 0xff0055);
        genTex('gem_c', 12, 0x00ffff);
        genTex('gem_g', 12, 0x00ff00);
        genTex('gem_p', 16, 0xff00ff);
        genTex('gem_gold', 20, 0xffff00);
        genTex('b_tex', 12, 0xffffff, true);
        genTex('sword_tex', 48, 0xaaaaaa, true);
    }

    create() {
        this.resetWebUI();

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
            delay: CONST.SPAWN_RATE,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this.initCollisions();
        this.initExternalHandlers();
    }

    update(time, delta) {
        if (this.paused) return;

        const dt = delta / 1000;
        this.gameTime += delta;
        const totalSec = Math.floor(this.gameTime / 1000);

        this.updateTimeDisplay(totalSec);
        this.handleBossEvents(totalSec);

        // [난이도 조정] 시간 및 레벨 가중치를 최적화하여 밸런싱 (v1.0.24 대비 소폭 하향)
        const mins = totalSec / 60;
        const targetRate = Math.max(150, CONST.SPAWN_RATE - (Math.min(mins, 15) * 150) - (this.playerStats.level * 8));
        if (this.spawnTimer.delay !== targetRate) this.spawnTimer.delay = targetRate;

        let dx = 0, dy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx = -CONST.PLAYER_SPEED;
        else if (this.cursors.right.isDown || this.keys.D.isDown) dx = CONST.PLAYER_SPEED;
        if (this.cursors.up.isDown || this.keys.W.isDown) dy = -CONST.PLAYER_SPEED;
        else if (this.cursors.down.isDown || this.keys.S.isDown) dy = CONST.PLAYER_SPEED;

        this.worldX += dx * dt;
        this.worldY += dy * dt;
        this.background.tilePositionX = this.worldX;
        this.background.tilePositionY = this.worldY;

        this.handleCombat(time);
        this.hpBarGraphics.clear();
        this.simulateEntities(dx, dy, dt, mins);
    }

    initCollisions() {
        this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
            if (!e.active || !b.active) return;
            b.destroy();
            e.hp -= this.playerStats.bulletDamage;
            if (e.hp <= 0) this.onEnemyKill(e);
        });
        this.physics.add.overlap(this.orbitalSwords, this.enemies, (s, e) => {
            if (!e.active) return;
            e.hp -= this.playerStats.swordDamage;
            if (e.hp <= 0) this.onEnemyKill(e);
        });
        this.physics.add.overlap(this.playerSensor, this.enemies, (s, e) => {
            if (this.paused || !e.active || this.isGodMode) return;
            this.playerStats.hp -= (e.isBoss ? 1.2 : 0.4);
            this.updateHPUI();
            if (this.playerStats.hp <= 0) this.triggerGameOver();
        });
        this.physics.add.overlap(this.playerSensor, this.gems, (s, g) => {
            if (!g.active) return;
            this.addExp(g.expValue);
            g.destroy();
        });
    }

    handleCombat(time) {
        let activeE = this.enemies.getChildren().filter(e => e.active);
        
        if (time > this.lastFired && activeE.length > 0) {
            let target = this.physics.closest(this.player, activeE);
            if (target && Phaser.Math.Distance.Between(400, 300, target.x, target.y) < 450) {
                const b = this.bullets.create(400, 300, 'b_tex');
                const ang = Phaser.Math.Angle.Between(400, 300, target.x, target.y);
                b.setRotation(ang);
                this.physics.velocityFromRotation(ang, 650, b.body.velocity);
                this.lastFired = time + this.playerStats.bulletFireRate;
            }
        }

        this.orbitalSwords.getChildren().forEach((s, i) => {
            const ang = (time * 0.0035) + (i * (Math.PI * 2 / this.playerStats.swordCount));
            s.x = 400 + Math.cos(ang) * CONST.ORBIT_RADIUS;
            s.y = 300 + Math.sin(ang) * CONST.ORBIT_RADIUS;
            s.rotation = ang + Math.PI/2;
            s.body.updateFromGameObject();
        });
    }

    simulateEntities(dx, dy, dt, mins) {
        this.enemies.getChildren().forEach(e => {
            if (!e.active) return;
            e.x -= dx * dt; e.y -= dy * dt;
            const ang = Phaser.Math.Angle.Between(e.x, e.y, 400, 300);
            // [난이도 조정] 적 이동 속도 배율 소폭 하향
            let spd = Math.min(CONST.MAX_ENEMY_SPEED, 140 + (mins * 6) + (this.playerStats.level * 1.2));
            const finalSpd = e.isElite ? spd*0.55 : (e.isBoss ? spd*0.4 : spd);
            e.x += Math.cos(ang) * finalSpd * dt;
            e.y += Math.sin(ang) * finalSpd * dt;

            this.hpBarGraphics.fillStyle(0xff0000);
            const bw = e.isBoss ? 60 : 30;
            const barY = e.y - (e.displayHeight / 2) - 10;
            this.hpBarGraphics.fillRect(e.x - bw/2, barY, (e.hp / e.maxHP) * bw, 4);
            if (Phaser.Math.Distance.Between(400, 300, e.x, e.y) > 1300 && !e.isBoss) e.destroy();
        });

        [this.bullets, this.gems].forEach(grp => {
            grp.getChildren().forEach(obj => {
                obj.x -= dx * dt; obj.y -= dy * dt;
                if (grp === this.gems) {
                    const d = Phaser.Math.Distance.Between(400, 300, obj.x, obj.y);
                    if (d < this.playerStats.magnetRange) {
                        const a = Phaser.Math.Angle.Between(obj.x, obj.y, 400, 300);
                        obj.x += Math.cos(a) * 550 * dt; obj.y += Math.sin(a) * 550 * dt;
                    }
                }
                if (Phaser.Math.Distance.Between(400, 300, obj.x, obj.y) > 1200) obj.destroy();
            });
        });
    }

    spawnEnemy() {
        if (this.paused) return;
        const ang = Math.random() * Math.PI * 2, r = 650;
        const e = this.enemies.create(400 + Math.cos(ang) * r, 300 + Math.sin(ang) * r, 'e_tex');
        const mins = Math.floor(this.gameTime / 60000);
        // [난이도 조정] 적 체력 증가폭 하향
        e.hp = 12 + (mins * 6) + (this.playerStats.level * 2);
        e.maxHP = e.hp;
        if (e.body) e.body.enable = true;
    }

    onEnemyKill(enemy) {
        this.enemiesKilled++;
        const mins = Math.floor(this.gameTime / 60000);
        let type = 'gem_c', val = 1;
        if (enemy.isBoss) { type = 'gem_gold'; val = 200; }
        else if (mins >= 10) { type = 'gem_gold'; val = 100; }
        else if (mins >= 5) { type = 'gem_p'; val = 25; }
        else if (mins >= 2) { type = 'gem_g'; val = 5; }

        const g = this.gems.create(enemy.x, enemy.y, type).setDepth(5);
        g.expValue = val;
        enemy.destroy();
    }

    addExp(val) {
        this.playerStats.exp += val;
        if (this.playerStats.exp >= this.playerStats.nextExp) {
            this.playerStats.exp -= this.playerStats.nextExp;
            this.playerStats.level++;
            this.playerStats.nextExp = Math.floor(this.playerStats.nextExp * 1.15);
            const lvEl = document.getElementById('level');
            if (lvEl) lvEl.innerText = `Lv. ${this.playerStats.level}`;
            this.showUpgradeModal();
        }
        const fillEl = document.getElementById('exp-fill');
        if (fillEl) fillEl.style.width = `${(this.playerStats.exp / this.playerStats.nextExp) * 100}%`;
    }

    showUpgradeModal() {
        this.paused = true;
        const modal = document.getElementById('level-up-modal');
        const container = document.getElementById('options');
        if (modal && container) {
            modal.style.display = 'flex';
            container.innerHTML = '';
            const pool = [
                { name: '연사 강화', desc: '총 연사 속도 20% 증가', fn: () => this.playerStats.bulletFireRate *= 0.8 },
                { name: '화력 상향', desc: '총 공격력 +15', fn: () => this.playerStats.bulletDamage += 15 },
                { name: '위성 검 가동', desc: '공전하는 위성 검 추가 (최대 6개)', fn: () => { 
                    if(this.playerStats.swordCount < 6) {
                        this.playerStats.swordCount++;
                        this.orbitalSwords.create(400, 300, 'sword_tex').body.setImmovable(true);
                    }
                }}
            ];
            Phaser.Utils.Array.Shuffle(pool).forEach(opt => {
                const card = document.createElement('div');
                card.className = 'option-card';
                card.innerHTML = `<h3 style="font-family: ${CONST.FONT_FAMILY}">${opt.name}</h3><p style="font-family: ${CONST.FONT_FAMILY}">${opt.desc}</p>`;
                card.onclick = () => { opt.fn(); modal.style.display = 'none'; this.paused = false; };
                container.appendChild(card);
            });
        }
    }

    triggerGameOver() {
        this.paused = true;
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.style.display = 'flex';
        const score = (Math.floor(this.gameTime / 1000) * 15) + (this.enemiesKilled * 60);
        const timerText = document.getElementById('timer') ? document.getElementById('timer').innerText : "00:00";
        document.getElementById('final-stats').innerHTML = `플레이 시간: ${timerText}<br>처치 수: ${this.enemiesKilled}<br>최종 점수: ${score.toLocaleString()}`;
    }

    // --- 인터페이스 제어 ---

    resetWebUI() {
        const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
        setTxt('level', 'Lv. 1');
        setTxt('timer', '00:00');
        const expFill = document.getElementById('exp-fill');
        if (expFill) expFill.style.width = '0%';
        const hpFill = document.getElementById('hp-fill');
        if (hpFill) hpFill.style.width = '100%';
    }

    updateTimeDisplay(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        const el = document.getElementById('timer');
        if (el) el.innerText = `${m}:${s}`;
    }

    updateHPUI() {
        const el = document.getElementById('hp-fill');
        if (el) el.style.width = `${(this.playerStats.hp / this.playerStats.maxHp) * 100}%`;
    }

    initExternalHandlers() {
        // 일시정지
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) pauseBtn.onclick = () => { this.paused = true; document.getElementById('pause-modal').style.display = 'flex'; };
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) resumeBtn.onclick = () => { this.paused = false; document.getElementById('pause-modal').style.display = 'none'; };
        
        // 관리 콘솔
        const lvlEl = document.getElementById('level');
        if (lvlEl) lvlEl.onclick = () => { const p = document.getElementById('admin-panel'); p.style.display = (p.style.display === 'block' ? 'none' : 'block'); };
        
        const godBtn = document.getElementById('god-btn');
        if (godBtn) godBtn.onclick = () => {
            this.isGodMode = !this.isGodMode;
            godBtn.innerText = `무적 모드: ${this.isGodMode ? 'ON' : 'OFF'}`;
            const hpFill = document.getElementById('hp-fill');
            if (hpFill) hpFill.style.background = this.isGodMode ? "#ffdd00" : "#ff3333";
        };
        const timeBtn = document.getElementById('time-btn');
        if (timeBtn) timeBtn.onclick = () => this.gameTime += 60000;
        const lvlBtn = document.getElementById('lvl-btn');
        if (lvlBtn) lvlBtn.onclick = () => this.addExp(this.playerStats.nextExp);
    }

    handleBossEvents(sec) {
        if (sec > 0 && sec % 600 === 0 && this.gameTime % 1000 < 50) {
            this.spawnSpecialEnemy('boss_tex', 1000 + (sec/60 * 400), true);
        }
    }

    spawnSpecialEnemy(tex, hp, isBoss) {
        const ang = Math.random() * Math.PI * 2, r = 500;
        const e = this.enemies.create(400 + Math.cos(ang) * r, 300 + Math.sin(ang) * r, tex);
        e.hp = hp; e.maxHP = hp; e.isBoss = isBoss;
        e.setDisplaySize(isBoss ? 80 : 64, isBoss ? 80 : 64);
        if (e.body) e.body.enable = true;
    }
}

// --- 부팅 설정 ---
const config = {
    type: Phaser.AUTO,
    width: 800, height: 600,
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [StartScene, MainScene]
};

const game = new Phaser.Game(config);

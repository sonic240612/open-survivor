// 게임 설정 및 전역 상태를 관리하는 상수
const CONSTANTS = {
    SWORD_ORBIT_RADIUS: 100,
    PLAYER_BASE_SPEED: 280,
    ABSOLUTE_MAX_ENEMY_SPEED: 245,
    BASE_SPAWN_RATE: 1300,
    BASE_ENEMY_HP: 12,
    BASE_ENEMY_SPEED: 140,
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
    magnetRange: 60
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

// 메인 게임 씬을 클래스로 캡슐화
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    // 에셋 및 텍스처를 미리 메모리에 로드하는 함수
    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 동적으로 텍스처를 생성합니다 (도형 그리기)
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

        // 배경 그리드 패턴
        createTexture('grid', 100, 100, CONSTANTS.COLORS.GRID_BG, false, (graphics) => {
            graphics.fillRect(0, 0, 100, 100);
            graphics.lineStyle(1, CONSTANTS.COLORS.GRID_LINE, 1);
            graphics.strokeRect(0, 0, 100, 100);
        });
    }

    // 게임에 필요한 객체들을 생성하고 초기화하는 함수
    create() {
        // 무한 스크롤 배경 설정
        this.background = this.add.tileSprite(400, 300, 800, 600, 'grid');

        // 플레이어 캐릭터 설정
        this.player = this.add.sprite(400, 300, 'p_tex').setDepth(10);
        this.player.setDisplaySize(32, 32);

        // 플레이어 피격/습득 판정용 숨겨진 센서 생성
        this.playerSensor = this.add.circle(400, 300, 15);
        this.physics.add.existing(this.playerSensor);

        // 게임 내 여러 개체들을 그룹으로 관리 (적, 총알, 보석, 궤도 검)
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.gems = this.physics.add.group();
        this.orbitalSwords = this.physics.add.group();

        // 적 체력바를 그릴 그래픽스 객체
        this.hpBarGraphics = this.add.graphics().setDepth(20);

        // 키보드 입력 설정 (방향키 및 WASD)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');

        // 적 스폰 타이머 설정
        this.spawnTimer = this.time.addEvent({
            delay: CONSTANTS.BASE_SPAWN_RATE,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // 충돌 이벤트 설정
        this.setupCollisions();

        // UI 및 시스템 통합 로직
        this.setupUploader();
        this.setupAdminConsole();
        this.setupPauseSystem();
    }

    // 충돌 처리 로직 설정 함수
    setupCollisions() {
        // 총알과 적의 충돌 처리
        this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
            if (!e.active || !b.active) return;
            b.destroy();
            e.hp -= playerStats.bulletDamage;
            if (e.hp <= 0) this.onEnemyDeath(e);
        });

        // 위성 검과 적의 충돌 처리
        this.physics.add.overlap(this.orbitalSwords, this.enemies, (s, e) => {
            if (!e.active) return;
            e.hp -= playerStats.swordDamage;
            if (e.hp <= 0) this.onEnemyDeath(e);
        });

        // 플레이어 센서와 적의 충돌 처리 (피격)
        this.physics.add.overlap(this.playerSensor, this.enemies, (s, e) => {
            if (gameState.paused || !e.active || gameState.isGodMode) return;
            playerStats.hp -= (e.isBoss ? 1.2 : 0.4);
            this.updateHPUI();
            if (playerStats.hp <= 0) this.triggerGameOver();
        });

        // 플레이어 센서와 보석의 충돌 처리 (경험치 습득)
        this.physics.add.overlap(this.playerSensor, this.gems, (s, g) => {
            if (!g.active) return;
            this.gainExp(g.expValue);
            g.destroy();
        });
    }

    // 매 프레임마다 게임 상태를 업데이트하는 함수
    update(time, delta) {
        if (gameState.paused) return;

        const dt = delta / 1000;
        gameState.gameTime += delta;

        const totalSec = Math.floor(gameState.gameTime / 1000);
        this.updateTimerUI(totalSec);

        // 특정 시간마다 보스 이벤트 확인
        this.checkBossEvents(totalSec);

        // 적 생성 주기 조절 (시간이 지날수록 주기가 짧아짐)
        const mins = totalSec / 60;
        const targetRate = Math.max(150, CONSTANTS.BASE_SPAWN_RATE - (Math.min(mins, 15) * 180));
        if (this.spawnTimer.delay !== targetRate) this.spawnTimer.delay = targetRate;

        // 플레이어 이동 로직 처리
        const { dx, dy } = this.handleMovement(dt);

        // 무기 발사 및 스킬 사용 로직 처리
        this.handleWeapons(time, dt);

        // 적, 보석 등 엔티티 위치 갱신 로직 처리
        this.handleEntities(dx, dy, dt, mins);
    }

    // 플레이어 입력을 받아 이동 처리
    handleMovement(dt) {
        let dx = 0, dy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx = -CONSTANTS.PLAYER_BASE_SPEED;
        else if (this.cursors.right.isDown || this.keys.D.isDown) dx = CONSTANTS.PLAYER_BASE_SPEED;

        if (this.cursors.up.isDown || this.keys.W.isDown) dy = -CONSTANTS.PLAYER_BASE_SPEED;
        else if (this.cursors.down.isDown || this.keys.S.isDown) dy = CONSTANTS.PLAYER_BASE_SPEED;

        gameState.worldX += dx * dt;
        gameState.worldY += dy * dt;
        this.background.tilePositionX = gameState.worldX;
        this.background.tilePositionY = gameState.worldY;

        return { dx, dy };
    }

    // 총알 발사 및 궤도 검, 낙뢰 처리
    handleWeapons(time, dt) {
        const activeEnemies = this.enemies.getChildren().filter(e => e.active);

        // 총알 발사 로직 (가장 가까운 적을 목표로 함)
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

        // 궤도 검 순환 로직
        this.orbitalSwords.getChildren().forEach((s, i) => {
            const ang = (time * 0.0035) + (i * (Math.PI * 2 / playerStats.swordCount));
            s.x = 400 + Math.cos(ang) * CONSTANTS.SWORD_ORBIT_RADIUS;
            s.y = 300 + Math.sin(ang) * CONSTANTS.SWORD_ORBIT_RADIUS;
            s.rotation = ang + Math.PI / 2;
            s.body.updateFromGameObject();
        });

        // 낙뢰 이벤트 처리 로직 (랜덤 적 타격)
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
            gameState.lastLightning = time + 2400; // 2.4초마다 발사
        }
    }

    // 게임 내 움직이는 객체들에 대한 위치 및 로직 업데이트
    handleEntities(dx, dy, dt, mins) {
        this.hpBarGraphics.clear();

        // 적 이동 및 체력 바 갱신
        this.enemies.getChildren().forEach(e => {
            if (!e.active) return;
            e.x -= dx * dt;
            e.y -= dy * dt;

            const ang = Phaser.Math.Angle.Between(e.x, e.y, 400, 300);
            let curSpd = Math.min(CONSTANTS.ABSOLUTE_MAX_ENEMY_SPEED, CONSTANTS.BASE_ENEMY_SPEED + (mins * 8));
            const finalSpd = (e.isElite ? curSpd * 0.55 : (e.isBoss || e.isMiniBoss ? curSpd * 0.4 : curSpd));

            e.x += Math.cos(ang) * finalSpd * dt;
            e.y += Math.sin(ang) * finalSpd * dt;

            // 체력 바 비율 계산 및 그리기
            this.hpBarGraphics.fillStyle(CONSTANTS.COLORS.HP_BAR);
            const bw = e.isBoss ? 60 : (e.isMiniBoss ? 40 : 30);
            const barY = e.y - (e.displayHeight / 2) - 10;
            this.hpBarGraphics.fillRect(e.x - bw / 2, barY, (e.hp / e.maxHP) * bw, 4);

            // 범위를 너무 벗어나면 삭제 처리
            if (Phaser.Math.Distance.Between(400, 300, e.x, e.y) > 1300 && !e.isBoss && !e.isMiniBoss) e.destroy();
        });

        // 총알 이동 (월드 좌표에 따른 상대 이동)
        this.bullets.getChildren().forEach(b => {
            b.x -= dx * dt;
            b.y -= dy * dt;
            if (Phaser.Math.Distance.Between(400, 300, b.x, b.y) > 1000) b.destroy();
        });

        // 보석 자석 효과 및 이동
        this.gems.getChildren().forEach(g => {
            if (!g.active) return;
            g.x -= dx * dt;
            g.y -= dy * dt;
            const d = Phaser.Math.Distance.Between(400, 300, g.x, g.y);

            // 플레이어가 자석 범위를 가지면 보석이 끌려옵니다.
            if (d < playerStats.magnetRange) {
                const ang = Phaser.Math.Angle.Between(g.x, g.y, 400, 300);
                g.x += Math.cos(ang) * 550 * dt;
                g.y += Math.sin(ang) * 550 * dt;
            }
            if (d > 1300) g.destroy();
        });
    }

    // 맵 바깥에서 무작위 각도로 적을 스폰하는 함수
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

        // 체력 스케일링
        e.hp = (isElite ? CONSTANTS.BASE_ENEMY_HP * 6 : CONSTANTS.BASE_ENEMY_HP) + (Math.min(mins, 15) * 8);
        e.maxHP = e.hp;
        e.isElite = isElite;

        if (e.body) e.body.enable = true;
    }

    // 특정 시간에 보스 및 미니보스를 출현시킵니다
    checkBossEvents(sec) {
        // 10분 마다 보스 등장 (10분, 20분...)
        if (sec > 0 && sec % 600 === 0 && gameState.gameTime % 1000 < 50) {
            this.spawnSpecialEnemy('boss_tex', 1000 + (sec / 60 * 450), true);
            this.showAlert("스테이지 보스 출현!");
        }
        // 보스 등장 5분 뒤에 미니보스 등장 (5분, 15분...)
        else if (sec > 0 && (sec - 300) % 600 === 0 && gameState.gameTime % 1000 < 50) {
            this.spawnSpecialEnemy('miniboss_tex', 450 + (sec / 60 * 220), false);
            this.showAlert("미니 보스 출현!");
        }
    }

    // 보스/미니 보스를 스폰 처리합니다.
    spawnSpecialEnemy(tex, hp, isBoss) {
        const ang = Math.random() * Math.PI * 2;
        const r = 500;
        const e = this.enemies.create(400 + Math.cos(ang) * r, 300 + Math.sin(ang) * r, tex);

        e.hp = hp;
        e.maxHP = hp;
        e.isBoss = isBoss;
        e.isMiniBoss = !isBoss;

        const sz = isBoss ? 80 : 64;
        e.setDisplaySize(sz, sz);
        if (e.body) e.body.enable = true;
    }

    // 적이 처치되었을 때 호출 : 경험치 구슬 드랍 및 킬 카운트 증가
    onEnemyDeath(e) {
        if (!e.active) return;
        gameState.enemiesKilled++;

        let type = 'gem_cyan', val = 1;
        const mins = Math.floor(gameState.gameTime / 60000);
        const roll = Math.random() * 100;

        if (e.isBoss) {
            type = 'gem_gold'; val = 200;
        } else if (e.isMiniBoss) {
            type = 'gem_purple'; val = 50;
        } else if (mins >= 10) {
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

    // 경험치 습득 및 레벨 업 처리
    gainExp(amount) {
        playerStats.currentExp += amount;

        // 레벨업 조건을 만족하면
        if (playerStats.currentExp >= playerStats.nextLevelExp) {
            playerStats.currentExp -= playerStats.nextLevelExp;
            playerStats.currentLevel++;
            playerStats.nextLevelExp = Math.floor(playerStats.nextLevelExp * 1.15); // 요구 경험치 상승

            const levelText = document.getElementById('level');
            if (levelText) levelText.innerText = `Lv. ${playerStats.currentLevel}`;

            this.showLevelUpModal();
        }
        const expFill = document.getElementById('exp-fill');
        if (expFill) expFill.style.width = `${(playerStats.currentExp / playerStats.nextLevelExp) * 100}%`;
    }

    // UI: 레벨 업 시 선택할 수 있는 스킬 창을 띄웁니다
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
            {
                name: '긴급 복구', desc: '체력 60% 즉시 복구', fn: () => {
                    playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 60);
                    this.updateHPUI();
                }
            }
        ];

        if (playerStats.swordCount < 6) {
            pool.push({
                name: '위성 검 가동',
                desc: '공전하는 위성 검 추가 (최대 6개)',
                fn: () => {
                    playerStats.swordCount++;
                    this.orbitalSwords.create(400, 300, 'sword_tex').body.setImmovable(true);
                }
            });
        }

        // 스킬 풀을 섞고 상단 3개 선택 옵션 제공
        Phaser.Utils.Array.Shuffle(pool).slice(0, 3).forEach(opt => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = `<h3>${opt.name}</h3><p>${opt.desc}</p>`;
            card.onclick = () => {
                opt.fn();
                modal.style.display = 'none';
                gameState.paused = false;
            };
            container.appendChild(card);
        });
    }

    // 게임 오버 처리
    triggerGameOver() {
        gameState.paused = true;
        const modal = document.getElementById('game-over-modal');
        if (!modal) return;
        modal.style.display = 'flex';

        const score = (Math.floor(gameState.gameTime / 1000) * 15) + (gameState.enemiesKilled * 60);
        const timerText = document.getElementById('timer') ? document.getElementById('timer').innerText : "00:00";
        document.getElementById('final-stats').innerHTML = `플레이 시간: ${timerText}<br>제거한 적: ${gameState.enemiesKilled}<br>최종 평가 점수: ${score.toLocaleString()}`;
    }

    // UI: 플레이어에게 알림을 띄웁니다.
    showAlert(txt) {
        const box = document.getElementById('alert-box');
        if (!box) return;
        box.innerText = txt;
        box.style.display = 'block';
        setTimeout(() => box.style.display = 'none', 3000);
    }

    // UI: 경과 시간 텍스트 업데이트
    updateTimerUI(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        const timerElement = document.getElementById('timer');
        if (timerElement) timerElement.innerText = `${m}:${s}`;
    }

    // UI: 플레이어 체력 비율 바 업데이트
    updateHPUI() {
        const hpFill = document.getElementById('hp-fill');
        if (hpFill) hpFill.style.width = `${(playerStats.hp / playerStats.maxHp) * 100}%`;
    }

    // 개발자 모드 콘솔 기능 연결 (치트 등)
    setupAdminConsole() {
        const lvlText = document.getElementById('level');
        const panel = document.getElementById('admin-panel');
        if (!lvlText || !panel) return;

        // 레벨 텍스트 클릭 시 관리자 패널 열기/닫기
        lvlText.onclick = () => panel.style.display = (panel.style.display === 'block' ? 'none' : 'block');

        document.getElementById('god-btn').onclick = () => {
            gameState.isGodMode = !gameState.isGodMode;
            document.getElementById('god-btn').innerText = `무적 모드: ${gameState.isGodMode ? 'ON' : 'OFF'}`;
            document.getElementById('god-btn').classList.toggle('active', gameState.isGodMode);
            const hpFill = document.getElementById('hp-fill');
            if (hpFill) hpFill.style.background = gameState.isGodMode ? "#ffdd00" : "#ff3333";
        };

        // 게임 시간 1분 건너뛰기
        document.getElementById('time-btn').onclick = () => gameState.gameTime += 60000;
        // 즉시 레벨업 체험
        document.getElementById('lvl-btn').onclick = () => this.gainExp(playerStats.nextLevelExp);
    }

    // 일시정지 버튼 이벤트 연결
    setupPauseSystem() {
        const pauseBtn = document.getElementById('pause-btn');
        const pauseModal = document.getElementById('pause-modal');
        const resumeBtn = document.getElementById('resume-btn');
        if (!pauseBtn || !pauseModal || !resumeBtn) return;

        pauseBtn.onclick = () => {
            gameState.paused = true;
            pauseModal.style.display = 'flex';
        };
        resumeBtn.onclick = () => {
            gameState.paused = false;
            pauseModal.style.display = 'none';
        };
    }

    // 스킨(이미지 업로드) 적용 시스템 로직
    setupUploader() {
        const handle = (id, tex, objListCallback) => {
            const inputEl = document.getElementById(id);
            if (!inputEl) return;

            inputEl.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 128;
                        canvas.height = 128;
                        const ctx = canvas.getContext('2d');

                        // 이미지를 동그랗게 클리핑 (마스크) 처리
                        ctx.beginPath();
                        ctx.arc(64, 64, 64, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(img, 0, 0, 128, 128);

                        // 기존 텍스처를 제거하고 새로 업로드한 캔버스 이미지로 교체
                        this.textures.remove(tex);
                        this.textures.addCanvas(tex, canvas);

                        // 대상 객체들에 새로운 텍스처 적용
                        objListCallback(tex);
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            };
        };

        // 플레이어 텍스처 업로드 적용 처리
        handle('p-up', 'p_tex', (tex) => {
            this.player.setTexture(tex);
            this.player.setDisplaySize(32, 32);
        });

        // 적 텍스처 업로드 적용 처리
        handle('e-up', 'e_tex', (tex) => {
            this.enemies.getChildren().forEach(c => {
                if (c.texture.key === tex) {
                    c.setTexture(tex);
                    const ts = c.isElite ? 48 : (c.isBoss ? 80 : (c.isMiniBoss ? 64 : 32));
                    c.setDisplaySize(ts, ts);
                    if (c.body) c.body.setSize(c.width, c.height);
                }
            });
        });
    }
}

// 게임 환경설정 객체
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: MainScene // 생성한 씬 클래스로 교체
};

// 메인 Phaser 게임 객체 초기화
const game = new Phaser.Game(config);
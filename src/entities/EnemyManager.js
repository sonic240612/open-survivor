class EnemyManager {
    constructor(scene) { this.scene = scene; }

    create() {
        const s = this.scene;
        s.enemies = s.physics.add.group();
        s.spawnTimer = s.time.addEvent({
            delay: CONSTANTS.BASE_SPAWN_RATE,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    spawnEnemy() {
        if (gameState.paused) return;
        const s = this.scene;
        const ang = Math.random() * Math.PI * 2, r = 650;
        const x = 400 + Math.cos(ang) * r, y = 300 + Math.sin(ang) * r;
        const mins = gameState.gameTime / 60000;
        const enemyType = s.enemyManager.pickEnemyType(mins);
        const config = s.enemyManager.getEnemyConfig(enemyType);
        const isElite = !config.noElite && Math.random() * 100 < Math.min(24, 4 + Math.floor(mins) * 3.8);

        const eliteKey = `elite_${enemyType}_tex`;
        const tex = isElite ? (s.textures.exists(eliteKey) ? eliteKey : 'elite_tex') : config.tex;
        const e = s.enemies.create(x, y, tex);
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
            e.body.setCircle(ts / 2);
        }
    }

    simulateEnemies(dx, dy, dt, mins) {
        const s = this.scene;
        s.hpBarGraphics.clear();
        const activeBuffers = s.enemies.getChildren().filter(e => e.active && e.enemyType === 'buffer');

        s.enemies.getChildren().forEach(e => {
            if (!e.active) return;
            e.x -= dx * dt; e.y -= dy * dt;

            if (e.isBoss || e.isMiniBoss) {
                this.updateBossAI(e, s.time.now);

                if (e.isCharging) {
                    e.x += Math.cos(e.chargeAngle) * e.chargeSpeed * dt;
                    e.y += Math.sin(e.chargeAngle) * e.chargeSpeed * dt;
                    const chargeDist = Phaser.Math.Distance.Between(e.chargeOriginX, e.chargeOriginY, e.x, e.y);
                    if (chargeDist > 400 || chargeDist < 20) {
                        e.isCharging = false;
                        e.bossAttacking = false;
                        e.chargePhase = null;
                    }
                    this.drawBossHPBar(e);
                    return;
                }

                if (e.chargePhase === 'telegraph') {
                    this.drawBossHPBar(e);
                    return;
                }
            }

            const ang = Phaser.Math.Angle.Between(e.x, e.y, 400, 300);
            const dist = Phaser.Math.Distance.Between(e.x, e.y, 400, 300);
            let curSpd = Math.min(CONSTANTS.ABSOLUTE_MAX_ENEMY_SPEED, CONSTANTS.BASE_ENEMY_SPEED + (mins * 11) + (playerStats.currentLevel * 3.2));
            let finalSpd = curSpd * (e.speedMult || 1);
            if (e.isElite) finalSpd *= 0.85;
            if (e.isBoss || e.isMiniBoss) finalSpd *= 0.35;
            if (s.enemyManager.isBuffedByEnemy(e, activeBuffers)) finalSpd *= 1.18;
            if (e.enemyType === 'shooter' && dist < 260) finalSpd *= -0.55;
            else if (e.enemyType === 'shooter' && dist < 360) finalSpd = 0;

            if (e.enemyType === 'runner') finalSpd = Math.min(finalSpd, CONSTANTS.PLAYER_BASE_SPEED + 2);

            if (dist < 25 && finalSpd > 0) {
                finalSpd *= -0.4;
            }

            e.x += Math.cos(ang) * finalSpd * dt;
            e.y += Math.sin(ang) * finalSpd * dt;
            if (e.enemyType === 'shooter') s.enemyManager.tryShooterFire(e);

            if (e.isBoss || e.isMiniBoss) {
                this.drawBossHPBar(e);
            } else {
                s.hpBarGraphics.fillStyle(0xff0000);
                const bw = e.isElite ? 40 : 30;
                const barY = e.y - (e.displayHeight / 2) - 10;
                s.hpBarGraphics.fillRect(e.x - bw / 2, barY, (e.hp / e.maxHP) * bw, 4);
            }

            if (e.enemyType === 'buffer') {
                s.hpBarGraphics.lineStyle(1, 0x64ff9a, 0.16);
                s.hpBarGraphics.strokeCircle(e.x, e.y, 120);
            }

            const hw = CONSTANTS.WORLD_WIDTH / 2;
            const hh = CONSTANTS.WORLD_HEIGHT / 2;
            if (e.x > 400 + hw) { e.x -= CONSTANTS.WORLD_WIDTH; if (e.body) e.body.updateFromGameObject(); }
            else if (e.x < 400 - hw) { e.x += CONSTANTS.WORLD_WIDTH; if (e.body) e.body.updateFromGameObject(); }
            if (e.y > 300 + hh) { e.y -= CONSTANTS.WORLD_HEIGHT; if (e.body) e.body.updateFromGameObject(); }
            else if (e.y < 300 - hh) { e.y += CONSTANTS.WORLD_HEIGHT; if (e.body) e.body.updateFromGameObject(); }
        });
    }

    drawBossHPBar(e) {
        const s = this.scene;
        s.hpBarGraphics.fillStyle(0x330000, 0.7);
        const bw = e.isBoss ? 100 : 70;
        const barY = e.y - (e.displayHeight / 2) - 14;
        s.hpBarGraphics.fillRoundedRect(e.x - bw / 2, barY, bw, 8, 3);

        const phaseColors = [0x00cc44, 0xccdd00, 0xff8800, 0xff2222];
        const color = phaseColors[(e.bossPhase || 1) - 1] || 0xff0000;
        s.hpBarGraphics.fillStyle(color, 0.92);
        s.hpBarGraphics.fillRoundedRect(e.x - bw / 2, barY, (e.hp / e.maxHP) * bw, 8, 3);

        s.hpBarGraphics.lineStyle(1, 0xffffff, 0.35);
        s.hpBarGraphics.strokeRoundedRect(e.x - bw / 2, barY, bw, 8, 3);
    }

    // ─── BOSS TYPE / PHASE / AI ─────────────────────────────────────────

    getBossType() {
        const types = ['berserker', 'artillery', 'summoner'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getBossMaxHP(sec, bossType) {
        const base = 17000 + (sec / 60) * 5000;
        const mult = bossType === 'berserker' ? 0.8 : bossType === 'artillery' ? 1.2 : 1.0;
        return Math.floor(base * mult);
    }

    getMiniBossMaxHP(sec) {
        return 4200 + (sec / 60) * 1100;
    }

    spawnSpecialEnemy(tex, isBoss) {
        const s = this.scene;
        const ang = Math.random() * Math.PI * 2, r = 500;
        const e = s.enemies.create(400 + Math.cos(ang) * r, 300 + Math.sin(ang) * r, tex);
        const sz = isBoss ? 80 : 64;
        e.setDisplaySize(sz, sz);

        const bossType = this.getBossType();
        const maxHP = isBoss
            ? this.getBossMaxHP(Math.floor(gameState.gameTime / 1000), bossType)
            : this.getMiniBossMaxHP(Math.floor(gameState.gameTime / 1000));

        e.hp = maxHP;
        e.maxHP = maxHP;
        e.isBoss = isBoss;
        e.isMiniBoss = !isBoss;
        e.bossType = bossType;
        e.bossPhase = 1;
        e.bossAttacking = false;
        e.isCharging = false;
        e.lastAttackTime = 0;
        e.attackCooldown = this.getBossCooldown(bossType, 1);

        const typeTints = { berserker: 0xff4444, artillery: 0xbb66ff, summoner: 0x44ff66 };
        e.setTint(typeTints[bossType] || 0xffffff);

        if (e.body) {
            e.body.enable = true;
            e.body.setCircle(sz / 2);
        }

        s.uiManager.showAlert(this.getBossAlertText(bossType, isBoss));
    }

    getBossAlertText(type, isBoss) {
        const labels = {
            berserker: '광전사',
            artillery: '포격자',
            summoner: '소환사'
        };
        const label = labels[type] || '수호자';
        return isBoss ? `⚠️ 스테이지 보스 [${label}] 출현!` : `⚠️ 미니 보스 [${label}] 출현!`;
    }

    updateBossAI(boss, now) {
        if (!boss.active) return;

        const prevPhase = boss.bossPhase;
        const hpRatio = boss.hp / boss.maxHP;
        boss.bossPhase = hpRatio > 0.75 ? 1 : hpRatio > 0.50 ? 2 : hpRatio > 0.25 ? 3 : 4;

        if (boss.bossPhase !== prevPhase) {
            this.executePhaseTransition(boss);
        }

        if (boss.bossAttacking) return;

        if (now - boss.lastAttackTime < boss.attackCooldown) return;

        const attack = this.pickBossAttack(boss);
        boss.lastAttackTime = now;
        boss.bossAttacking = true;

        switch (attack) {
            case 'bulletRing': this.executeBulletRing(boss); break;
            case 'charge': this.executeCharge(boss); break;
            case 'summon': this.executeSummon(boss); break;
            case 'radialBurst': this.executeRadialBurst(boss); break;
            case 'laser': this.executeLaserBeam(boss); break;
        }
    }

    executePhaseTransition(boss) {
        const s = this.scene;
        s.cameras.main.flash(400, 255, 80, 80);

        const msgs = [
            '보스가 각성했다!',
            '보스가 분노했다!',
            '보스가 광폭화했다!'
        ];
        s.uiManager.showAlert(msgs[boss.bossPhase - 2] || '보스가 변했다!');

        boss.attackCooldown = this.getBossCooldown(boss.bossType, boss.bossPhase);

        const phaseTints = [null, 0xff8800, 0xff4400, 0xff0022];
        if (boss.bossPhase >= 2 && phaseTints[boss.bossPhase]) {
            const tp = boss.bossPhase;
            s.tweens.add({
                targets: boss,
                alpha: 0.4,
                duration: 100,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    if (boss.active) boss.setTint(phaseTints[tp]);
                }
            });
        }
    }

    getBossCooldown(type, phase) {
        const base = type === 'berserker' ? 2200 : type === 'artillery' ? 2800 : 3200;
        return Math.max(700, base - (phase - 1) * 350);
    }

    pickBossAttack(boss) {
        const weights = { charge: 0, bulletRing: 0, summon: 0, radialBurst: 0, laser: 0 };

        switch (boss.bossType) {
            case 'berserker':
                weights.charge = 50; weights.bulletRing = 15; weights.summon = 35;
                break;
            case 'artillery':
                weights.bulletRing = 25; weights.laser = 45; weights.summon = 10; weights.radialBurst = 20;
                break;
            case 'summoner':
                weights.summon = 45; weights.bulletRing = 15; weights.radialBurst = 30;
                break;
        }

        if (boss.bossPhase < 2) { weights.radialBurst = 0; }

        if (boss.isMiniBoss) {
            weights.laser = 0;
            weights.charge = Math.min(weights.charge, 25);
            weights.radialBurst = 0;
        }

        const pool = [];
        ['charge', 'bulletRing', 'summon', 'radialBurst', 'laser'].forEach(a => {
            for (let i = 0; i < weights[a]; i++) pool.push(a);
        });

        return pool.length > 0 ? Phaser.Utils.Array.GetRandom(pool) : 'bulletRing';
    }

    // ─── ATTACK PATTERNS ────────────────────────────────────────────────

    executeBulletRing(boss) {
        const s = this.scene;
        const count = (boss.isMiniBoss ? 6 : 8) + (boss.bossPhase - 1) * 2;
        const speed = 180 + boss.bossPhase * 25;

        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 / count) * i + Math.random() * 0.15;
            const b = s.enemyBullets.create(boss.x, boss.y, 'enemy_bullet_tex');
            b.setDepth(11);
            b.setAlpha(0.85);
            b.setRotation(a);
            b.setTint(boss.bossPhase >= 3 ? 0xff6666 : (boss.bossPhase === 2 ? 0xffaa44 : 0xff7aa8));
            if (b.body) s.physics.velocityFromRotation(a, speed, b.body.velocity);
        }

        s.time.delayedCall(100 + boss.bossPhase * 30, () => { boss.bossAttacking = false; });
    }

    executeCharge(boss) {
        const s = this.scene;
        const ang = Phaser.Math.Angle.Between(boss.x, boss.y, s.player.x, s.player.y);
        boss.chargeAngle = ang;
        boss.chargeSpeed = 650 + boss.bossPhase * 100;
        boss.chargeOriginX = boss.x;
        boss.chargeOriginY = boss.y;
        boss.chargePhase = 'telegraph';

        const maxCharge = 400;

        const telegraph = s.add.graphics().setDepth(50);
        telegraph.lineStyle(3, 0xff2222, 0.7);
        telegraph.lineBetween(boss.x, boss.y, boss.x + Math.cos(ang) * maxCharge, boss.y + Math.sin(ang) * maxCharge);

        const warnCircle = s.add.circle(boss.x + Math.cos(ang) * maxCharge, boss.y + Math.sin(ang) * maxCharge, 22, 0xff0000, 0.2).setDepth(50);

        boss.setTint(0xff0000);

        let elapsed = 0;
        const tick = s.time.addEvent({
            delay: 30,
            loop: true,
            callback: () => {
                if (!boss.active) { tick.destroy(); telegraph.destroy(); warnCircle.destroy(); return; }
                elapsed += 30;

                if (elapsed < 650) {
                    const cx = boss.x + Math.cos(ang) * maxCharge;
                    const cy = boss.y + Math.sin(ang) * maxCharge;
                    telegraph.clear();
                    telegraph.lineStyle(3, 0xff2222, 0.7);
                    telegraph.lineBetween(boss.x, boss.y, cx, cy);
                    warnCircle.setPosition(cx, cy);
                } else {
                    tick.destroy();
                    telegraph.destroy();
                    warnCircle.destroy();
                    if (boss.active) {
                        boss.chargePhase = 'charging';
                        boss.isCharging = true;
                        boss.clearTint();
                        const tintKey = boss.bossType === 'berserker' ? 0xff4444 : boss.bossType === 'artillery' ? 0xbb66ff : 0x44ff66;
                        boss.setTint(tintKey);
                    }
                }
            }
        });

        s.time.delayedCall(1200, () => {
            if (boss.active) {
                boss.chargePhase = null;
                boss.isCharging = false;
                boss.bossAttacking = false;
            }
        });
    }

    executeSummon(boss) {
        const s = this.scene;
        const count = (boss.isMiniBoss ? 2 : 3) + boss.bossPhase;

        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 / count) * i + Math.random() * 0.3;
            const r = 60 + Math.random() * 40;
            const type = boss.bossType === 'summoner' && Math.random() < 0.25 ? 'splitter' : 'runner';
            const cfg = this.getEnemyConfig(type);
            const ex = boss.x + Math.cos(a) * r;
            const ey = boss.y + Math.sin(a) * r;
            const minion = s.enemies.create(ex, ey, cfg.tex);
            const mSize = cfg.size * (boss.bossPhase >= 3 ? 1.1 : 1);
            minion.setDisplaySize(mSize, mSize);
            minion.hp = Math.floor((cfg.hp + playerStats.currentLevel * 2) * (boss.isMiniBoss ? 1 : 1.5));
            minion.maxHP = minion.hp;
            minion.enemyType = type;
            minion.speedMult = cfg.speedMult * 1.1;
            minion.expBonus = 0;
            minion.canSplit = type === 'splitter';
            minion.lastShot = 0;
            if (minion.body) {
                minion.body.enable = true;
                minion.body.setCircle(mSize / 2);
            }
        }

        s.time.delayedCall(300, () => { boss.bossAttacking = false; });
    }

    executeRadialBurst(boss) {
        const s = this.scene;
        const radius = 150;

        const burstCircle = s.add.graphics().setDepth(45);
        burstCircle.fillStyle(0xff4444, 0.08);
        burstCircle.fillCircle(boss.x, boss.y, radius * 0.2);
        burstCircle.lineStyle(2, 0xff4444, 0.4);
        burstCircle.strokeCircle(boss.x, boss.y, radius * 0.2);

        s.tweens.add({
            targets: burstCircle,
            alpha: 1,
            duration: 500,
            onUpdate: (tween) => {
                const progress = tween.progress;
                burstCircle.clear();
                burstCircle.fillStyle(0xff4444, 0.06 + progress * 0.12);
                burstCircle.fillCircle(boss.x, boss.y, radius * progress);
                burstCircle.lineStyle(2 + progress * 2, 0xff4444, 0.3 + progress * 0.4);
                burstCircle.strokeCircle(boss.x, boss.y, radius * progress);
            },
            onComplete: () => {
                burstCircle.destroy();
                const dist = Phaser.Math.Distance.Between(boss.x, boss.y, s.player.x, s.player.y);
                if (dist < radius) {
                    s.collisionManager.damagePlayer(boss.isBoss ? 8 : 5);
                }
                boss.bossAttacking = false;
            }
        });
    }

    executeLaserBeam(boss) {
        if (boss.isMiniBoss) { boss.bossAttacking = false; return; }

        const s = this.scene;
        const beamLen = 600;
        const gfx = s.add.graphics().setDepth(45);
        let elapsed = 0;
        let lockedAng = null;

        const tick = s.time.addEvent({
            delay: 30,
            loop: true,
            callback: () => {
                if (!boss.active) { tick.destroy(); gfx.destroy(); return; }
                elapsed += 30;

                if (elapsed < 350) {
                    const curAng = Phaser.Math.Angle.Between(boss.x, boss.y, s.player.x, s.player.y);
                    const ex = boss.x + Math.cos(curAng) * beamLen;
                    const ey = boss.y + Math.sin(curAng) * beamLen;
                    gfx.clear();
                    gfx.lineStyle(2, 0xff4488, 0.25);
                    gfx.lineBetween(boss.x, boss.y, ex, ey);
                } else if (elapsed < 500) {
                    if (lockedAng === null) {
                        lockedAng = Phaser.Math.Angle.Between(boss.x, boss.y, s.player.x, s.player.y);
                    }
                    const ex = boss.x + Math.cos(lockedAng) * beamLen;
                    const ey = boss.y + Math.sin(lockedAng) * beamLen;
                    gfx.clear();
                    gfx.lineStyle(3, 0xff4488, 0.4);
                    gfx.lineBetween(boss.x, boss.y, ex, ey);
                } else if (elapsed < 1000) {
                    const ex = boss.x + Math.cos(lockedAng) * beamLen;
                    const ey = boss.y + Math.sin(lockedAng) * beamLen;
                    gfx.clear();
                    gfx.lineStyle(8, 0xff2266, 0.7);
                    gfx.lineBetween(boss.x, boss.y, ex, ey);
                    gfx.lineStyle(3, 0xffffff, 0.5);
                    gfx.lineBetween(boss.x, boss.y, ex, ey);

                    const px = s.player.x, py = s.player.y;
                    const dist = Phaser.Math.Distance.Between(px, py, boss.x, boss.y);
                    const dx = ex - boss.x, dy = ey - boss.y;
                    const alpha = ((px - boss.x) * dx + (py - boss.y) * dy) / (beamLen * beamLen);
                    if (alpha >= 0 && alpha <= 1) {
                        const closestX = boss.x + alpha * dx;
                        const closestY = boss.y + alpha * dy;
                        const perpDist = Phaser.Math.Distance.Between(px, py, closestX, closestY);
                        if (perpDist < 25 && dist < beamLen) {
                            s.collisionManager.damagePlayer(3);
                        }
                    }
                } else {
                    tick.destroy();
                    gfx.destroy();
                    boss.bossAttacking = false;
                }
            }
        });
    }

    // ─── BOSS EVENT TRIGGERS ────────────────────────────────────────────

    checkBossEvents(sec) {
        const s = this.scene;
        const bossInterval = Math.floor(sec / 600);
        if (sec > 0 && bossInterval > gameState.lastBossSpawnInterval) {
            gameState.lastBossSpawnInterval = bossInterval;
            s.enemyManager.spawnSpecialEnemy('boss_tex', true);
        }
        const miniBossInterval = Math.floor((sec - 300) / 600);
        if (sec > 0 && miniBossInterval > gameState.lastMiniBossSpawnInterval) {
            gameState.lastMiniBossSpawnInterval = miniBossInterval;
            s.enemyManager.spawnSpecialEnemy('miniboss_tex', false);
        }
    }

    // ─── SHARED ─────────────────────────────────────────────────────────

    isBuffedByEnemy(enemy, buffers) {
        if (enemy.enemyType === 'buffer') return false;
        return buffers.some(buffer => Phaser.Math.Distance.Between(enemy.x, enemy.y, buffer.x, buffer.y) < 120);
    }

    tryShooterFire(enemy) {
        const s = this.scene;
        const now = s.time.now;
        if (now - enemy.lastShot < 1450 || now - gameState.lastShooterFire < 210) return;
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, 400, 300);
        if (dist < 220 || dist > 520) return;

        const shot = s.enemyBullets.create(enemy.x, enemy.y, 'enemy_bullet_tex');
        shot.spawnTime = now;
        shot.setDepth(11);
        shot.setAlpha(0.78);
        const ang = Phaser.Math.Angle.Between(enemy.x, enemy.y, 400, 300);
        shot.setRotation(ang);
        s.physics.velocityFromRotation(ang, 350, shot.body.velocity);
        enemy.lastShot = now;
        gameState.lastShooterFire = now;
    }

    onEnemyDeath(e) {
        if (!e.active) return;
        const s = this.scene;
        gameState.enemiesKilled++;
        if (e.canSplit) s.enemyManager.spawnSplitterChildren(e.x, e.y);

        if (e.isBoss || e.isMiniBoss) {
            s.cameras.main.flash(600, 255, 200, 100);
            s.cameras.main.shake(300, 0.008);
            for (let i = 0; i < 3; i++) {
                s.time.delayedCall(i * 120, () => {
                    if (s.sparkEmitter && s.sparkEmitter.emitParticleAt)
                        s.sparkEmitter.emitParticleAt(
                            e.x + Phaser.Math.Between(-60, 60),
                            e.y + Phaser.Math.Between(-60, 60), 20);
                });
            }
        }

        let type = 'gem_cyan', val = 1;
        const mins = Math.floor(gameState.gameTime / 60000);
        const roll = Math.random() * 100;
        if (e.isBoss) { type = 'gem_gold'; val = 200; }
        else if (e.isMiniBoss) { type = 'gem_purple'; val = 50; }
        else if (mins >= 10) { if (roll < 10) { type = 'gem_gold'; val = 100; } else if (roll < 40) { type = 'gem_purple'; val = 25; } else { type = 'gem_green'; val = 5; } }
        else { if (mins >= 5 && roll < 15) { type = 'gem_purple'; val = 20; } else if (mins >= 2 && roll < 30) { type = 'gem_green'; val = 5; } }
        val += e.expBonus || 0;
        const gem = s.gems.create(e.x, e.y, type).setDepth(5);
        gem.expValue = val;
        gem.setBlendMode(Phaser.BlendModes.ADD);
        gem.setAlpha(0.92);
        const healChance = e.isBoss ? 12 : e.isMiniBoss ? 7 : e.isElite ? 3 : 1;
        if (Math.random() * 100 < healChance) {
            s.heals.create(e.x, e.y, 'heal_tex').setDepth(5);
        }
        e.destroy();
    }

    spawnSplitterChildren(x, y) {
        const s = this.scene;
        const count = Phaser.Math.Between(2, 3);
        for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 / count) * i + Phaser.Math.FloatBetween(-0.25, 0.25);
            const child = s.enemies.create(x + Math.cos(ang) * 24, y + Math.sin(ang) * 24, 'runner_tex');
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

    pickEnemyType(mins) {
        const pool = mins < 3
            ? ['normal', 'normal', 'runner', 'runner', 'splitter']
            : mins < 5
                ? ['normal', 'runner', 'runner', 'tanker', 'splitter', 'splitter']
                : mins < 7
                    ? ['normal', 'runner', 'runner', 'tanker', 'splitter', 'splitter', 'shooter']
                    : mins < 12
                        ? ['runner', 'runner', 'tanker', 'splitter', 'splitter', 'shooter', 'buffer']
                        : ['runner', 'tanker', 'tanker', 'splitter', 'shooter', 'shooter', 'buffer'];
        return Phaser.Utils.Array.GetRandom(pool);
    }

    getEnemyConfig(type) {
        const configs = {
            normal: { tex: 'e_tex', size: 32, hp: CONSTANTS.BASE_ENEMY_HP + 3, speedMult: 1.08, expBonus: 0 },
            runner: { tex: 'runner_tex', size: 30, hp: 10, speedMult: 1.58, expBonus: 1 },
            tanker: { tex: 'tanker_tex', size: 48, hp: 156, speedMult: 0.66, expBonus: 5 },
            splitter: { tex: 'splitter_tex', size: 36, hp: 25, speedMult: 1.02, expBonus: 3 },
            shooter: { tex: 'shooter_tex', size: 36, hp: 24, speedMult: 0.82, expBonus: 4 },
            buffer: { tex: 'buffer_tex', size: 40, hp: 38, speedMult: 0.76, expBonus: 6, noElite: true }
        };
        return configs[type] || configs.normal;
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
}

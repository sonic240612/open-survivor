class CollisionManager {
    constructor(scene) { this.scene = scene; }

    setup() {
        const s = this.scene;

        s.physics.add.overlap(s.bullets, s.enemies, (b, e) => {
            if (!e.active || !b.active) return;
            if (b.hitEnemies?.has(e)) return;
            (b.hitEnemies ??= new Set()).add(e);
            s.collisionManager.hitEnemy(e, playerStats.bulletDamage, 'bullet');
            if (playerStats.railgun) {
                b.pierceLeft--;
                if (b.pierceLeft <= 0) b.destroy();
            } else {
                b.destroy();
            }
        });

        s.physics.add.overlap(s.orbitalSwords, s.enemies, (sw, e) => {
            if (!e.active) return;
            s.collisionManager.hitEnemy(e, playerStats.swordDamage, 'sword');
            s.collisionManager.triggerPlasmaBladeStrike(e);
        });

        s.physics.add.overlap(s.playerSensor, s.enemies, (sens, e) => {
            if (gameState.paused || !e.active || gameState.isGodMode) return;
            s.collisionManager.damagePlayer(e.isBoss ? 5 : 2);
        });

        s.physics.add.overlap(s.playerSensor, s.enemyBullets, (sens, b) => {
            if (gameState.paused || !b.active || gameState.isGodMode) return;
            b.destroy();
            s.collisionManager.damagePlayer(3);
        });

        s.physics.add.overlap(s.playerSensor, s.gems, (sens, g) => {
            if (!g.active) return;
            s.modalManager.gainExp(g.expValue);
            g.destroy();
        });

        s.physics.add.overlap(s.playerSensor, s.heals, (sens, h) => {
            if (!h.active) return;
            const healAmt = Math.min(30, 9 + playerStats.currentLevel);
            playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + healAmt);
            s.uiManager.updateHPUI();
            s.effectsManager.showDamageNumber(h.x, h.y, healAmt, '#00ff44');
            h.destroy();
        });
    }

    hitEnemy(enemy, damage, type) {
        if (!enemy.active) return;
        if (enemy.hp <= 0) return;
        const s = this.scene;
        let isCrit = false;
        if (playerStats.critChance > 0 && Math.random() < playerStats.critChance) {
            const mult = Math.min(1.75, playerStats.critMultiplier + playerStats.critDamageLevel * 0.05);
            damage = Math.floor(damage * mult);
            isCrit = true;
        }
        enemy.hp -= damage;
        gameState.damageStats[type] = (gameState.damageStats[type] || 0) + damage;

        let color = '#ffffff';
        if (type === 'bullet') color = '#ffffff';
        else if (type === 'sword') color = '#e0e0e0';
        else if (type === 'lightning') color = '#ffffff';
        else if (type === 'plasma') color = '#72f7ff';
        s.effectsManager.showDamageNumber(enemy.x, enemy.y, damage, color, isCrit);

        enemy.setTintFill(0xffffff);
        s.time.delayedCall(80, () => { if (enemy.active) enemy.clearTint(); });

        s.effectsManager.emitHitSpark(enemy.x, enemy.y, (type === 'lightning' || type === 'plasma') ? 12 : 5);

        if (enemy.hp <= 0) {
            s.effectsManager.emitHitSpark(enemy.x, enemy.y, 16);
            s.enemyManager.onEnemyDeath(enemy);
            s.uiManager.updateKillsUI();
        }
    }

    damagePlayer(amount) {
        const s = this.scene;
        const now = s.time.now;
        if (now - gameState.lastPlayerHit < 300) return;
        gameState.lastPlayerHit = now;
        const timeMult = 1 + (gameState.gameTime / 120000) * 0.25;
        amount = Math.floor(amount * Math.min(timeMult, 5));
        playerStats.hp -= amount;
        s.uiManager.updateHPUI();
        s.cameras.main.shake(90, 0.004);
        if (playerStats.hp <= 0 && !gameState.gameOverTriggered) {
            gameState.gameOverTriggered = true;
            s.modalManager.triggerGameOver();
        }
    }

    triggerPlasmaBladeStrike(enemy) {
        if (!playerStats.plasmaBlade || !enemy.active) return;
        const s = this.scene;
        const now = s.time.now;
        if (now - gameState.lastPlasmaBlade < 180) return;
        if (enemy.lastPlasmaStrike && now - enemy.lastPlasmaStrike < 520) return;
        gameState.lastPlasmaBlade = now;
        enemy.lastPlasmaStrike = now;

        const beam = s.add.graphics()
            .lineStyle(3, 0x72f7ff, 0.74)
            .lineBetween(enemy.x, enemy.y - 140, enemy.x, enemy.y + 8);
        s.time.delayedCall(70, () => beam.destroy());
        s.collisionManager.hitEnemy(enemy, Math.floor(playerStats.lightningDamage * 0.65), 'plasma');
    }
}

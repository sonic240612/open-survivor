class CollisionManager {
    constructor(scene) { this.scene = scene; }

    setup() {
        const s = this.scene;

        s.physics.add.overlap(s.bullets, s.enemies, (b, e) => {
            if (!e.active || !b.active) return;
            s.collisionManager.hitEnemy(e, playerStats.bulletDamage, 'bullet');
            if (playerStats.railgun) {
                b.pierceLeft = (b.pierceLeft ?? 3) - 1;
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
    }

    hitEnemy(enemy, damage, type) {
        if (!enemy.active) return;
        const s = this.scene;
        enemy.hp -= damage;

        let color = '#ffffff';
        if (type === 'bullet') color = '#ffffff';
        else if (type === 'sword') color = '#e0e0e0';
        else if (type === 'lightning') color = '#ffffff';
        else if (type === 'plasma') color = '#72f7ff';
        s.effectsManager.showDamageNumber(enemy.x, enemy.y, damage, color);

        enemy.setTintFill(0xffffff);
        s.time.delayedCall(80, () => { if (enemy.active) enemy.clearTint(); });

        s.effectsManager.emitHitSpark(enemy.x, enemy.y, (type === 'lightning' || type === 'plasma') ? 12 : 5);

        if (enemy.hp <= 0) {
            s.effectsManager.emitHitSpark(enemy.x, enemy.y, 16);
            s.enemyManager.onEnemyDeath(enemy);
        }
    }

    damagePlayer(amount) {
        const s = this.scene;
        const now = s.time.now;
        if (now - gameState.lastPlayerHit < 300) return;
        gameState.lastPlayerHit = now;
        playerStats.hp -= amount;
        s.uiManager.updateHPUI();
        s.cameras.main.shake(90, 0.004);
        if (playerStats.hp <= 0) s.modalManager.triggerGameOver();
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

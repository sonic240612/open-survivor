class WeaponManager {
    constructor(scene) { this.scene = scene; }

    create() {
        this.scene.orbitalSwords = this.scene.physics.add.group();
    }

    handleWeapons(time) {
        const s = this.scene;
        const activeEnemies = s.enemies.getChildren().filter(e => e.active);

        if (time > gameState.lastFired && activeEnemies.length > 0) {
            const closest = s.physics.closest(s.player, activeEnemies);
            if (closest && Phaser.Math.Distance.Between(400, 300, closest.x, closest.y) < 450) {
                const b = s.bullets.create(400, 300, 'b_tex');
                b.spawnTime = time;
                const ang = Phaser.Math.Angle.Between(400, 300, closest.x, closest.y);
                b.setRotation(ang);
                b.pierceLeft = playerStats.railgun ? 4 : 1;
                b.setTint(playerStats.railgun ? 0x72f7ff : 0xffffff);
                b.setDisplaySize(playerStats.railgun ? 22 : 12, playerStats.railgun ? 6 : 4);
                s.physics.velocityFromRotation(ang, playerStats.railgun ? 820 : 650, b.body.velocity);
                const trailLen = playerStats.railgun ? 16 : 10;
                const trailSpacing = playerStats.railgun ? 5 : 4;
                b.trailGfx = s.add.graphics().setDepth(1);
                b.trailPoints = [];
                b.trailColor = playerStats.railgun ? 0x72f7ff : 0xffffff;
                b.on('destroy', () => { if (b.trailGfx) b.trailGfx.destroy(); });
                gameState.lastFired = time + playerStats.bulletFireRate;
            }
        }

        s.orbitalSwords.getChildren().forEach((sw, i) => {
            if (!sw.active) return;
            const ang = (time * 0.0035) + (i * (Math.PI * 2 / playerStats.swordCount));
            sw.x = 400 + Math.cos(ang) * CONSTANTS.SWORD_ORBIT_RADIUS;
            sw.y = 300 + Math.sin(ang) * CONSTANTS.SWORD_ORBIT_RADIUS;
            sw.rotation = ang + Math.PI / 2;
            sw.alpha = 0.82 + Math.sin(time * 0.008 + i) * 0.12;
            sw.body.updateFromGameObject();
        });

        if (playerStats.lightningCount > 0 && time > gameState.lastLightning && activeEnemies.length > 0) {
            for (let i = 0; i < playerStats.lightningCount; i++) {
                const t = Phaser.Utils.Array.GetRandom(activeEnemies);
                if (t) {
                    const beam = s.add.graphics().lineStyle(6, 0xffffff, 0.3).lineBetween(t.x, 0, t.x, t.y);
                    s.time.delayedCall(80, () => beam.destroy());
                    s.collisionManager.hitEnemy(t, playerStats.lightningDamage, 'lightning');
                    if (playerStats.stormCaller) this.chainStormLightning(t, activeEnemies);
                }
            }
            gameState.lastLightning = time + (playerStats.stormCaller ? 1900 : 2400);
        }
    }

    chainStormLightning(source, activeEnemies) {
        const s = this.scene;
        const candidates = activeEnemies
            .filter(e => e.active && e !== source && Phaser.Math.Distance.Between(source.x, source.y, e.x, e.y) < 180)
            .slice(0, 2);
        candidates.forEach((target, i) => {
            const beam = s.add.graphics()
                .lineStyle(3, 0xffffff, 0.2)
                .lineBetween(source.x, source.y, target.x, target.y);
            s.time.delayedCall(75 + i * 20, () => beam.destroy());
            s.collisionManager.hitEnemy(target, Math.floor(playerStats.lightningDamage * 0.45), 'lightning');
        });
    }

    addOrbitalSword() {
        const s = this.scene;
        playerStats.swordCount++;
        const sword = s.orbitalSwords.create(400, 300, playerStats.plasmaBlade ? 'plasma_sword_tex' : 'sword_tex');
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
        this.scene.orbitalSwords.getChildren().forEach(sw => {
            if (sw.active) sw.setTexture('plasma_sword_tex');
        });
    }
}

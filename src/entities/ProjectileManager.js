class ProjectileManager {
    constructor(scene) { this.scene = scene; }

    create() {
        const s = this.scene;
        s.bullets = s.physics.add.group();
        s.enemyBullets = s.physics.add.group();
        s.gems = s.physics.add.group();
    }

    updateProjectiles(dx, dy, dt) {
        const s = this.scene;
        [s.bullets, s.enemyBullets, s.gems].forEach(grp => {
            grp.getChildren().forEach(obj => {
                obj.x -= dx * dt; obj.y -= dy * dt;
                if (grp === s.gems) {
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
}

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
        const hw = CONSTANTS.WORLD_WIDTH / 2, hh = CONSTANTS.WORLD_HEIGHT / 2;
        [s.bullets, s.enemyBullets, s.gems].forEach(grp => {
            grp.getChildren().forEach(obj => {
            obj.x -= dx * dt; obj.y -= dy * dt;
            if (grp === s.bullets && obj.trailPoints) {
                obj.trailPoints.forEach(p => { p.x -= dx * dt; p.y -= dy * dt; });
                obj.trailPoints.push({ x: obj.x, y: obj.y });
                while (obj.trailPoints.length > 12) obj.trailPoints.shift();
                obj.trailGfx.clear();
                const len = obj.trailPoints.length;
                for (let j = 1; j < len; j++) {
                    const alpha = (j / len) * 0.4;
                    obj.trailGfx.lineStyle(2, obj.trailColor || 0xffffff, alpha);
                    obj.trailGfx.lineBetween(obj.trailPoints[j-1].x, obj.trailPoints[j-1].y, obj.trailPoints[j].x, obj.trailPoints[j].y);
                }
            }
            if (grp === s.gems) {
                    const d = Phaser.Math.Distance.Between(400, 300, obj.x, obj.y);
                    if (d < playerStats.magnetRange) {
                        const a = Phaser.Math.Angle.Between(obj.x, obj.y, 400, 300);
                        obj.x += Math.cos(a) * 550 * dt; obj.y += Math.sin(a) * 550 * dt;
                    }
                }
                if (grp !== s.gems && obj.spawnTime && s.time.now - obj.spawnTime > 7000) {
                    obj.destroy();
                    return;
                }
                if (obj.x > 400 + hw) {
                    obj.x -= CONSTANTS.WORLD_WIDTH;
                    if (obj.trailPoints) obj.trailPoints.forEach(p => { p.x -= CONSTANTS.WORLD_WIDTH; });
                } else if (obj.x < 400 - hw) {
                    obj.x += CONSTANTS.WORLD_WIDTH;
                    if (obj.trailPoints) obj.trailPoints.forEach(p => { p.x += CONSTANTS.WORLD_WIDTH; });
                }
                if (obj.y > 300 + hh) {
                    obj.y -= CONSTANTS.WORLD_HEIGHT;
                    if (obj.trailPoints) obj.trailPoints.forEach(p => { p.y -= CONSTANTS.WORLD_HEIGHT; });
                } else if (obj.y < 300 - hh) {
                    obj.y += CONSTANTS.WORLD_HEIGHT;
                    if (obj.trailPoints) obj.trailPoints.forEach(p => { p.y += CONSTANTS.WORLD_HEIGHT; });
                }
            });
        });
    }
}

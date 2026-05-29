class PlayerManager {
    constructor(scene) { this.scene = scene; }

    create() {
        const s = this.scene;
        s.background = s.add.tileSprite(400, 300, 800, 600, 'grid');
        s.player = s.add.sprite(400, 300, 'p_tex').setDepth(10);
        s.player.setDisplaySize(32, 32);
        s.playerSensor = s.add.circle(400, 300, 15);
        s.physics.add.existing(s.playerSensor);
        if (s.playerSensor.body) s.playerSensor.body.setCircle(15);
        s.cursors = s.input.keyboard.createCursorKeys();
        s.keys = s.input.keyboard.addKeys('W,A,S,D');
    }

    update(dt) {
        const s = this.scene;
        let dx = 0, dy = 0;
        if (s.cursors.left.isDown || s.keys.A.isDown) dx = -playerStats.moveSpeed;
        else if (s.cursors.right.isDown || s.keys.D.isDown) dx = playerStats.moveSpeed;
        if (s.cursors.up.isDown || s.keys.W.isDown) dy = -playerStats.moveSpeed;
        else if (s.cursors.down.isDown || s.keys.S.isDown) dy = playerStats.moveSpeed;
        gameState.worldX += dx * dt;
        gameState.worldY += dy * dt;
        s.background.tilePositionX = gameState.worldX;
        s.background.tilePositionY = gameState.worldY;
        return { dx, dy };
    }
}

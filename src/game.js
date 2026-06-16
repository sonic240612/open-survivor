const config = {
    type: Phaser.AUTO,
    width: 800, height: 600,
    parent: 'game-container',
    roundPixels: true,
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [StartScene, MainScene]
};

const game = new Phaser.Game(config);

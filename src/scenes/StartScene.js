class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(CONSTANTS.COLORS.GRID_BG, 1);
        g.fillRect(0, 0, 100, 100);
        g.lineStyle(1, CONSTANTS.COLORS.GRID_LINE, 1);
        g.strokeRect(0, 0, 100, 100);
        g.generateTexture('grid', 100, 100);
    }

    create() {
        this.add.tileSprite(400, 300, 800, 600, 'grid');

        this.add.text(400, 200, '오픈 서바이버', {
            fontSize: '64px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            fontWeight: 'bold',
            color: '#dffcff',
            stroke: '#071018',
            strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 0, color: '#00ffcc', blur: 18, fill: true }
        }).setOrigin(0.5);

        const btnGlow = this.add.rectangle(400, 400, 270, 94, 0x00ffb0, 0.11).setStrokeStyle(2, 0x72f7ff, 0.42);
        const btnBg = this.add.rectangle(400, 400, 250, 80, 0x06121c, 0.76).setStrokeStyle(2, 0x00ffb0, 0.88);
        const btnText = this.add.text(400, 400, '게임 시작', {
            fontSize: '32px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            color: '#f5fbff',
            fontWeight: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#00ffb0', blur: 12, fill: true }
        }).setOrigin(0.5);

        btnBg.setInteractive({ cursor: 'pointer' });
        btnBg.on('pointerover', () => {
            btnBg.setScale(1.06);
            btnText.setScale(1.06);
            btnGlow.setScale(1.08);
            btnBg.setFillStyle(0x082a28, 0.86);
        });
        btnBg.on('pointerout', () => {
            btnBg.setScale(1);
            btnText.setScale(1);
            btnGlow.setScale(1);
            btnBg.setFillStyle(0x06121c, 0.76);
        });
        btnBg.on('pointerdown', () => this.scene.start('MainScene'));
    }
}

class EffectsManager {
    constructor(scene) { this.scene = scene; }

    create() {
        const s = this.scene;
        s.sparkEmitter = s.add.particles(0, 0, 'spark_tex', {
            lifespan: { min: 150, max: 350 },
            speed: { min: 80, max: 220 },
            scale: { start: 1.5, end: 0 },
            blendMode: 'ADD',
            emitting: false
        }).setDepth(15);
    }

    emitHitSpark(x, y, count) {
        this.scene.sparkEmitter.emitParticleAt(x, y, count);
    }

    showDamageNumber(x, y, amount, color, isCrit) {
        const s = this.scene;
        const txt = s.add.text(x + Phaser.Math.Between(-12, 12), y - 12, amount, {
            fontSize: '18px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            color: isCrit ? '#ffdd00' : (color || '#ffffff'),
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(30);

        s.tweens.add({
            targets: txt,
            y: txt.y - 45,
            alpha: 0,
            scale: isCrit ? 1.25 : 1.3,
            duration: 500,
            onComplete: () => txt.destroy()
        });
    }
}

export class SkinUploader {
    constructor(scene) { this.scene = scene; }

    setup() {
        const s = this.scene;
        const handle = (id, tex, displaySize, filterFn, callback) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 128; canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        ctx.beginPath(); ctx.arc(64, 64, 64, 0, Math.PI * 2); ctx.clip();
                        ctx.drawImage(img, 0, 0, 128, 128);
                        s.textures.remove(tex);
                        s.textures.addCanvas(tex, canvas);
                        s.enemies.getChildren().forEach(c => {
                            if (filterFn(c)) {
                                c.setTexture(tex);
                                c.setDisplaySize(displaySize, displaySize);
                                if (c.body) c.body.setCircle(displaySize / 2);
                            }
                        });
                        if (callback) callback(tex);
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            };
        };

        handle('p-up', 'p_tex', 32, () => false, (t) => { s.player.setTexture(t); s.player.setDisplaySize(32, 32); });
        handle('e-up', 'e_tex', 32, (c) => !c.isElite && !c.isBoss && !c.isMiniBoss);
        handle('elite-up', 'elite_tex', 48, (c) => c.isElite);
        handle('miniboss-up', 'miniboss_tex', 64, (c) => c.isMiniBoss);
        handle('boss-up', 'boss_tex', 80, (c) => c.isBoss);
    }
}

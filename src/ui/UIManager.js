class UIManager {
    constructor(scene) { this.scene = scene; }

    create() {
        const s = this.scene;
        s.hpBarGraphics = s.add.graphics().setDepth(20);
        this.bossBarGraphics = s.add.graphics().setDepth(25);
        this.bossNameText = s.add.text(400, 34, '', {
            fontSize: '11px',
            fontFamily: CONSTANTS.FONT_FAMILY,
            color: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(26).setVisible(false);
    }

    resetWebUI() {
        const updateText = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
        const updateWidth = (id, pct) => { const el = document.getElementById(id); if (el) el.style.width = pct; };
        updateText('level', 'Lv. 1');
        updateWidth('exp-fill', '0%');
        updateWidth('hp-fill', '100%');
        updateText('timer', '00:00');
        this.updateKillsUI();
        this.updateWeaponDashboard();
        const gameOverModal = document.getElementById('game-over-modal');
        if (gameOverModal) gameOverModal.style.display = 'none';
    }

    updateTimerUI(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        const el = document.getElementById('timer');
        if (el) el.innerText = `${m}:${s}`;
    }

    updateKillsUI() {
        const el = document.getElementById('kills');
        if (el) el.innerText = `💀 ${gameState.enemiesKilled}`;
        this.updateScoreUI();
    }

    updateScoreUI() {
        const el = document.getElementById('score');
        if (el) {
            const timeSec = Math.floor(gameState.gameTime / 1000);
            const score = (timeSec * 15) + (gameState.enemiesKilled * 60);
            el.innerText = `★ ${score.toLocaleString()}`;
        }
    }

    updateHPUI() {
        const el = document.getElementById('hp-fill');
        if (el) el.style.width = `${(playerStats.hp / playerStats.maxHp) * 100}%`;
    }

    updateWeaponDashboard() {
        this.updateLeftSidebar();
    }

    updateLeftSidebar() {
        const setText = (id, value) => { const el = document.getElementById(id); if (el) el.innerText = value; };
        const setDisplay = (id, show) => { const el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; };

        const isRailgun = playerStats.railgun;
        setText('weapon-primary-name', isRailgun ? '레일건' : '자동 소총');
        setText('weapon-primary-icon', isRailgun ? '🔱' : '🔫');
        setText('left-reinf-fire-rate', `Lv.${playerStats.fireRateLevel}`);
        setText('left-reinf-damage', `Lv.${playerStats.bulletDamageLevel}`);
        setText('left-reinf-magnet', `Lv.${playerStats.magnetLevel}`);

        const hasLightning = playerStats.lightningCount > 0;
        setDisplay('weapon-lightning-card', hasLightning);
        if (hasLightning) {
            setText('weapon-lightning-name', playerStats.stormCaller ? '스톰 콜러' : '낙뢰');
            setText('weapon-lightning-icon', playerStats.stormCaller ? '🌩️' : '⚡');
            setText('left-lightning-count', `Lv.${playerStats.lightningCount}`);
        }

        const hasSword = playerStats.swordCount > 0;
        setDisplay('weapon-sword-card', hasSword);
        if (hasSword) {
            setText('weapon-sword-name', playerStats.plasmaBlade ? '플라즈마 블레이드' : '에너지 블레이드');
            setText('weapon-sword-icon', playerStats.plasmaBlade ? '💠' : '🗡️');
            setText('left-sword-count', `${playerStats.swordCount}개`);
            setText('left-sword-damage-lv', `Lv.${playerStats.swordDamageLevel}`);
        }
    }

    showAlert(txt) {
        const box = document.getElementById('alert-box');
        if (box) {
            box.innerText = txt;
            box.style.display = 'block';
            setTimeout(() => box.style.display = 'none', 3000);
        }
    }

    updateBossGlobalHP() {
        const g = this.bossBarGraphics;
        g.clear();

        const boss = this.findActiveBoss();
        if (!boss) {
            this.bossNameText.setVisible(false);
            return;
        }

        const hpRatio = Phaser.Math.Clamp(boss.hp / boss.maxHP, 0, 1);
        const labels = { berserker: '광전사', artillery: '포격자', summoner: '소환사' };
        const name = (boss.isBoss ? '★ ' : '☆ ') + (labels[boss.bossType] || '수호자');
        const phase = boss.bossPhase || 1;

        const cx = 400, cy = 34;
        const w = 340, h = 18;

        g.fillStyle(0x000000, 0.55);
        g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 5);

        const phaseColors = [0x00cc44, 0xccdd00, 0xff8800, 0xff2222];
        g.fillStyle(phaseColors[phase - 1] || 0xff0000, 0.88);
        if (hpRatio > 0) g.fillRoundedRect(cx - w / 2, cy - h / 2, w * hpRatio, h, 5);

        g.lineStyle(1, 0xffffff, 0.3);
        g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 5);

        this.bossNameText.setText(`${name}  Phase ${phase}`);
        this.bossNameText.setVisible(true);
    }

    findActiveBoss() {
        const enemies = this.scene.enemies;
        if (!enemies) return null;
        const bosses = enemies.getChildren().filter(e => e.active && (e.isBoss || e.isMiniBoss));
        return bosses.length > 0 ? bosses[0] : null;
    }
}

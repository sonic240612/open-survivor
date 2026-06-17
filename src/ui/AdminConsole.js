class AdminConsole {
    constructor(scene) { this.scene = scene; }

    setup() {
        const lvlText = document.getElementById('level');
        const panel = document.getElementById('admin-panel');
        if (lvlText && panel) lvlText.onclick = () => panel.style.display = (panel.style.display === 'block' ? 'none' : 'block');

        const godBtn = document.getElementById('god-btn');
        if (godBtn) godBtn.onclick = () => {
            gameState.isGodMode = !gameState.isGodMode;
            godBtn.innerText = `무적 모드: ${gameState.isGodMode ? 'ON' : 'OFF'}`;
            const hpFill = document.getElementById('hp-fill');
            if (hpFill) hpFill.style.background = gameState.isGodMode ? "#ffdd00" : "#ff3333";
        };

        const timeBtn = document.getElementById('time-btn');
        if (timeBtn) timeBtn.onclick = () => gameState.gameTime += 60000;

        const lvlBtn = document.getElementById('lvl-btn');
        if (lvlBtn) lvlBtn.onclick = () => this.scene.modalManager.gainExp(playerStats.nextLevelExp);
    }
}

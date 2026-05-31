class ModalManager {
    constructor(scene) { this.scene = scene; }

    gainExp(amount) {
        playerStats.currentExp += amount;
        let levelsGained = 0;
        while (playerStats.currentExp >= playerStats.nextLevelExp) {
            playerStats.currentExp -= playerStats.nextLevelExp;
            playerStats.currentLevel++;
            playerStats.nextLevelExp = Math.floor(playerStats.nextLevelExp * 1.15);
            levelsGained++;
        }
        const levelText = document.getElementById('level');
        if (levelText) levelText.innerText = `Lv. ${playerStats.currentLevel}`;
        if (levelsGained > 0) this.showLevelUpModal();
        const expFill = document.getElementById('exp-fill');
        if (expFill) expFill.style.width = `${(playerStats.currentExp / playerStats.nextLevelExp) * 100}%`;
    }

    showLevelUpModal() {
        const modal = document.getElementById('level-up-modal');
        const container = document.getElementById('options');
        if (!modal || !container) return;
        const scene = this.scene;
        scene.setGamePaused(true);
        modal.style.display = 'flex';
        container.innerHTML = '';

        const pool = [
            { name: '연사 강화', desc: '총 연사 속도 20% 증가', weight: 1, fn: () => { playerStats.bulletFireRate *= 0.8; playerStats.fireRateLevel++; } },
            { name: '화력 상향', desc: '총 공격력 +15', weight: 1, fn: () => { playerStats.bulletDamage += 15; playerStats.bulletDamageLevel++; } },
            { name: '낙뢰 폭풍', desc: '라이트닝 수 +1', weight: 3, fn: () => playerStats.lightningCount++ },
            { name: '자기장 증폭', desc: '보석 자석 범위 +70px', weight: 2, fn: () => { playerStats.magnetRange += 70; playerStats.magnetLevel++; } },
            { name: '바이탈 코어', desc: '최대 체력 +20 및 체력 20 회복', weight: 2, fn: () => { playerStats.maxHp += 20; playerStats.maxHpLevel++; playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 20); scene.uiManager.updateHPUI(); } },
            { name: '긴급 복구', desc: '체력 60% 즉시 복구', weight: 2, fn: () => { playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 60); scene.uiManager.updateHPUI(); } }
        ];
        if (playerStats.swordCount < 6) {
            pool.push({ name: '에너지 블레이드', desc: '공전하는 블레이드 추가 (최대 6개)', fn: () => scene.weaponManager.addOrbitalSword() });
        }
        if (!playerStats.plasmaBlade && playerStats.swordCount >= 6 && playerStats.lightningCount >= 3) {
            pool.push({ name: '플라즈마 블레이드', desc: '블레이드 타격 시 하늘색 라이트닝 추가', evolution: true, fn: () => scene.weaponManager.upgradePlasmaBlade() });
        }
        if (!playerStats.railgun && playerStats.bulletDamageLevel >= 3 && playerStats.fireRateLevel >= 3) {
            pool.push({ name: '레일건', desc: '탄환 속도 증가 및 최대 4회 관통', evolution: true, fn: () => { playerStats.railgun = true; playerStats.bulletDamage += 20; } });
        }
        if (!playerStats.stormCaller && playerStats.lightningCount >= 5 && playerStats.magnetLevel >= 2) {
            pool.push({ name: '스톰 콜러', desc: '낙뢰 쿨다운 감소 및 주변 적 연쇄 타격', evolution: true, fn: () => { playerStats.stormCaller = true; playerStats.lightningDamage += 15; } });
        }

        const weightedPick = (arr, n) => {
            const result = [], remaining = [...arr];
            for (let i = 0; i < n && remaining.length > 0; i++) {
                const total = remaining.reduce((s, o) => s + (o.weight || 1), 0);
                let r = Math.random() * total;
                for (let j = 0; j < remaining.length; j++) {
                    r -= (remaining[j].weight || 1);
                    if (r <= 0) { result.push(remaining[j]); remaining.splice(j, 1); break; }
                }
            }
            return result;
        };
        const evolutionOptions = pool.filter(opt => opt.evolution);
        const choices = evolutionOptions.length > 0
            ? [...evolutionOptions.slice(0, 2), ...weightedPick(pool.filter(opt => !opt.evolution), 3 - Math.min(2, evolutionOptions.length))]
            : weightedPick(pool, 3);

        choices.forEach(opt => {
            const card = document.createElement('div'); card.className = 'option-card';
            card.innerHTML = `<h3>${opt.name}</h3><p>${opt.desc}</p>`;
            card.onclick = () => {
                opt.fn();
                scene.uiManager.updateWeaponDashboard();
                modal.style.display = 'none';
                scene.setGamePaused(false);
            };
            container.appendChild(card);
        });
    }

    triggerGameOver() {
        const scene = this.scene;
        scene.setGamePaused(true);
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.style.display = 'flex';
        const score = (Math.floor(gameState.gameTime / 1000) * 15) + (gameState.enemiesKilled * 60);
        const timerEl = document.getElementById('timer');
        const statsEl = document.getElementById('final-stats');
        if (statsEl) statsEl.innerHTML = `플레이 시간: ${timerEl ? timerEl.innerText : '00:00'}<br>제거한 적: ${gameState.enemiesKilled}<br>최종 평가 점수: ${score.toLocaleString()}`;
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.onclick = () => scene.scene.start('MainScene');
    }
}

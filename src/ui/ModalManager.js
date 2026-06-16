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
            { name: '연사 강화', desc: '총 연사 속도 15% 증가', weight: 1, fn: () => { playerStats.bulletFireRate *= 0.85; playerStats.fireRateLevel++; } },
            { name: '화력 상향', desc: '총 공격력 +5', weight: 1, fn: () => { playerStats.bulletDamage += 5; playerStats.bulletDamageLevel++; } },
            { name: '낙뢰 폭풍', desc: '라이트닝 수 +1', weight: 1, fn: () => playerStats.lightningCount++ },
            { name: '자기장 증폭', desc: '보석 자석 범위 +70px', weight: 1, fn: () => { playerStats.magnetRange += 70; playerStats.magnetLevel++; } }
        ];
        if (playerStats.critChance < 0.9) {
            pool.push({ name: '치명타 강화', desc: '치명타 확률 +3% (최대 90%)', weight: 1, fn: () => { playerStats.critChance = Math.min(0.9, playerStats.critChance + 0.03); playerStats.critLevel++; } });
        }
        if (playerStats.swordCount < 6) {
            pool.push({ name: '에너지 블레이드', desc: '공전하는 블레이드 추가 (최대 6개)', fn: () => scene.weaponManager.addOrbitalSword() });
        }
        if (playerStats.swordCount > 0) {
            pool.push({ name: '블레이드 강화', desc: '블레이드 공격력 +1', fn: () => { playerStats.swordDamage++; playerStats.swordDamageLevel++; } });
        }
        if (!playerStats.plasmaBlade && playerStats.swordCount >= 6 && playerStats.lightningCount >= 3) {
            pool.push({ name: '플라즈마 블레이드', desc: '블레이드 타격 시 하늘색 라이트닝 추가', evolution: true, fn: () => scene.weaponManager.upgradePlasmaBlade() });
        }
        if (!playerStats.railgun && playerStats.bulletDamageLevel >= 2 && playerStats.fireRateLevel >= 5) {
            pool.push({ name: '레일건', desc: '탄환 속도 증가 및 최대 4회 관통', evolution: true, fn: () => { playerStats.railgun = true; playerStats.bulletDamage += 10; } });
        }
        if (!playerStats.stormCaller && playerStats.lightningCount >= 5 && playerStats.magnetLevel >= 2) {
            pool.push({ name: '스톰 콜러', desc: '낙뢰 쿨다운 감소 및 주변 적 연쇄 타격', evolution: true, fn: () => { playerStats.stormCaller = true; playerStats.lightningDamage += 15; } });
        }
        if (playerStats.critLevel >= 5 && playerStats.critMultiplier + playerStats.critDamageLevel * 0.05 < 1.75) {
            pool.push({ name: '치명타 데미지 강화', desc: '치명타 배율 +5% (최대 ×1.75)', weight: 1, fn: () => { playerStats.critDamageLevel++; } });
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
        if (statsEl) {
            const labels = {
                bullet: playerStats.railgun ? '레일건' : '자동 소총',
                sword: playerStats.plasmaBlade ? '플라즈마 블레이드' : '에너지 블레이드',
                lightning: playerStats.stormCaller ? '스톰 콜러' : '낙뢰',
                plasma: '플라즈마 스트라이크'
            };
            const types = ['bullet', 'sword', 'lightning', 'plasma'];
            let totalDmg = 0;
            const damageRows = types.map(t => {
                const dmg = gameState.damageStats[t] || 0;
                totalDmg += dmg;
                return { type: t, dmg };
            });
            let html = `플레이 시간: ${timerEl ? timerEl.innerText : '00:00'}<br>제거한 적: ${gameState.enemiesKilled}<br>최종 평가 점수: ${score.toLocaleString()}`;
            if (totalDmg > 0) {
                html += `<br><br><div style="border-top:1px solid #555;padding-top:8px;text-align:left;display:inline-block">`;
                html += `<div style="font-weight:bold;margin-bottom:4px">─ 데미지 통계 ─</div>`;
                damageRows.forEach(({ type, dmg }) => {
                    if (dmg === 0) return;
                    const pct = ((dmg / totalDmg) * 100).toFixed(1);
                    html += `<div style="display:flex;justify-content:space-between;gap:20px"><span>${labels[type]}</span><span>${dmg.toLocaleString()} (${pct}%)</span></div>`;
                });
                html += `<div style="border-bottom:1px solid #444;margin:4px 0"></div>`;
                html += `<div style="display:flex;justify-content:space-between;gap:20px;font-weight:bold"><span>총 데미지</span><span>${totalDmg.toLocaleString()}</span></div>`;
                html += `</div>`;
            }
            statsEl.innerHTML = html;
        }
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.onclick = () => scene.scene.start('MainScene');
    }

    triggerBossTimeout() {
        const scene = this.scene;
        scene.setGamePaused(true);
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.style.display = 'flex';
        const score = (Math.floor(gameState.gameTime / 1000) * 15) + (gameState.enemiesKilled * 60);
        const timerEl = document.getElementById('timer');
        const statsEl = document.getElementById('final-stats');
        if (statsEl) statsEl.innerHTML = `⏰ 보스를 제때 처치하지 못했습니다!<br><br>플레이 시간: ${timerEl ? timerEl.innerText : '00:00'}<br>제거한 적: ${gameState.enemiesKilled}<br>최종 평가 점수: ${score.toLocaleString()}`;
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.onclick = () => scene.scene.start('MainScene');
    }
}

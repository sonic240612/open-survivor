const SUPABASE_URL = 'https://kgkyuqpsaogypbgqnauy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ej9QiqAwmw6IznYMzN-e6A_3W3NzYbc';

async function submitScore(playerName, score, kills, playTime, level) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            player_name: playerName,
            score,
            kills,
            play_time_seconds: Math.floor(playTime / 1000),
            level,
        })
    });
    return res.ok;
}

async function getTopScores(limit = 20) {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/leaderboard?order=score.desc&limit=${limit}`,
        { headers: { 'apikey': SUPABASE_ANON_KEY } }
    );
    if (!res.ok) return [];
    return res.json();
}

async function updateLeaderboardUI() {
    const el = document.getElementById('leaderboard-list');
    if (!el) return;
    const data = await getTopScores(10);
    if (!data || data.length === 0) {
        el.innerHTML = '<div style="color:#666;text-align:center;padding:8px 0">아직 기록이 없습니다</div>';
        return;
    }
    let html = '';
    data.forEach((entry, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const color = i < 3 ? '#ffdd00' : 'var(--text-muted)';
        const timeM = Math.floor(entry.play_time_seconds / 60);
        const timeS = entry.play_time_seconds % 60;
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0" title="Lv.${entry.level} | ${timeM}:${timeS.toString().padStart(2, '0')}">
            <span><span style="color:${color}">${medal}</span> ${entry.player_name}</span>
            <span style="color:#fff">${entry.score.toLocaleString()}</span>
        </div>`;
    });
    el.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', updateLeaderboardUI);

(() => {
  if (typeof state === 'undefined' || !window.logic || !window.ui || !window.teamSystem || !window.metaSystem) {
    console.warn('[career-expansion-v14] Required systems are not ready.');
    return;
  }

  const ACH_KEY = 'cs-career:achievements:v1';
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function readAchievements() {
    try { return JSON.parse(localStorage.getItem(ACH_KEY) || '{}'); } catch (_) { return {}; }
  }
  function writeAchievements(value) {
    localStorage.setItem(ACH_KEY, JSON.stringify(value));
  }

  function trophyCount() {
    return (state.flags?.cWins || 0) + (state.flags?.bWins || 0) + (state.flags?.aWins || 0)
      + (state.flags?.sWins || 0) + (state.flags?.majorWins || 0);
  }
  function top1Count() {
    return (state.hltvHistory || []).filter((row) => /^Top\s*1$/i.test(String(row?.rank || '').trim())).length;
  }
  function majorRows() {
    return (state.history || []).filter((row) => row?.level === 'Major');
  }
  function hasBackToBackMajorWins() {
    let streak = 0;
    for (const row of majorRows()) {
      if (String(row.result || '').includes('冠军')) streak += 1;
      else streak = 0;
      if (streak >= 2) return true;
    }
    return false;
  }
  function hasDoubleMajorYear() {
    const byYear = {};
    majorRows().forEach((row) => {
      if (!String(row.result || '').includes('冠军')) return;
      const year = row.year || 0;
      byYear[year] = (byYear[year] || 0) + 1;
    });
    return Object.values(byYear).some((count) => count >= 2);
  }
  function majorFinals() {
    return majorRows().filter((row) => {
      const result = String(row.result || '');
      return result.includes('冠军') || result.includes('亚军') || result.includes('决赛');
    }).length;
  }
  function ratingCareer() {
    const ratings = (state.history || []).map((row) => Number(row?.rating)).filter((value) => Number.isFinite(value) && value > 0);
    return {
      count: ratings.length,
      average: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0,
    };
  }

  const ACHIEVEMENTS = [
    { id:'first-contract', icon:'fa-file-signature', name:'第一份合同', desc:'正式加入一支职业战队。', test:()=>!!state.started && !!state.teamSystem?.currentTeamId },
    { id:'official-debut', icon:'fa-gamepad', name:'职业首秀', desc:'完成第一场正式赛事。', test:()=> (state.history?.length || 0) >= 1 },
    { id:'starting-five', icon:'fa-users', name:'站稳脚跟', desc:'成为战队首发。', test:()=>['starter','core'].includes(teamSystem.getRole?.()) },
    { id:'team-core', icon:'fa-crown', name:'队内核心', desc:'成为战队核心选手。', test:()=>teamSystem.getRole?.()==='core' },
    { id:'first-transfer', icon:'fa-right-left', name:'新的征程', desc:'完成第一次转会。', test:()=> (state.teamSystem?.transferHistory?.length || 0) >= 1 },
    { id:'top20-team', icon:'fa-ranking-star', name:'跻身一线', desc:'所在战队进入世界前20。', test:()=> (tournamentWorld?.getRank?.() || 99) <= 20 },
    { id:'top10-team', icon:'fa-medal', name:'世界前十', desc:'所在战队进入世界前10。', test:()=> (tournamentWorld?.getRank?.() || 99) <= 10 },
    { id:'world-number-one', icon:'fa-globe', name:'世界第一', desc:'所在战队登上世界排名第一。', test:()=> tournamentWorld?.getRank?.() === 1 },
    { id:'first-trophy', icon:'fa-trophy', name:'第一座奖杯', desc:'赢得任意级别赛事冠军。', test:()=>trophyCount() >= 1 },
    { id:'s-tier-champ', icon:'fa-star', name:'顶级赛事冠军', desc:'赢得一次S级赛事冠军。', test:()=> (state.flags?.sWins || 0) >= 1 },
    { id:'major-champ', icon:'fa-gem', name:'Major Champion', desc:'赢得一次Major。', test:()=> (state.flags?.majorWins || 0) >= 1 },
    { id:'veteran', icon:'fa-calendar', name:'职业老将', desc:'职业生涯进入第4年。', test:()=> (state.date?.year || 1) >= 4 },

    { id:'major-back-to-back', icon:'fa-fire', name:'Major二连冠', desc:'连续两届Major夺冠。', test:()=>hasBackToBackMajorWins() },
    { id:'major-double-year', icon:'fa-bolt', name:'一年双Major', desc:'同一个赛季包揽春季与冬季Major。', test:()=>hasDoubleMajorYear() },
    { id:'major-three', icon:'fa-gem', name:'Major三冠王', desc:'职业生涯赢得3座Major。', test:()=> (state.flags?.majorWins || 0) >= 3 },
    { id:'major-five', icon:'fa-chess-king', name:'Major王朝', desc:'职业生涯赢得5座Major。', test:()=> (state.flags?.majorWins || 0) >= 5 },
    { id:'top1-first', icon:'fa-1', name:'年度世界第一', desc:'第一次获得HLTV年度Top1。', test:()=>top1Count() >= 1 },
    { id:'top1-two', icon:'fa-ranking-star', name:'两度年度第一', desc:'两次获得HLTV年度Top1。', test:()=>top1Count() >= 2 },
    { id:'top1-three', icon:'fa-crown', name:'三度登顶', desc:'三次获得HLTV年度Top1。', test:()=>top1Count() >= 3 },
    { id:'top1-five', icon:'fa-trophy', name:'五度封王', desc:'五次获得HLTV年度Top1。', test:()=>top1Count() >= 5 },
    { id:'s-three', icon:'fa-star', name:'S级统治者', desc:'赢得3座S级赛事冠军。', test:()=> (state.flags?.sWins || 0) >= 3 },
    { id:'ten-trophies', icon:'fa-trophy', name:'奖杯收藏家', desc:'职业生涯累计赢得10座正式赛事奖杯。', test:()=>trophyCount() >= 10 },
    { id:'major-finals-three', icon:'fa-medal', name:'Major决赛常客', desc:'至少3次打进Major决赛。', test:()=>majorFinals() >= 3 },
    { id:'rating-superstar', icon:'fa-chart-line', name:'超级巨星', desc:'至少8项正式赛事后，生涯平均Rating达到1.20。', test:()=>{const r=ratingCareer();return r.count>=8&&r.average>=1.20;} },
    { id:'world1-major', icon:'fa-earth-americas', name:'王座与Major', desc:'成为世界第一战队成员，并至少赢得1座Major。', test:()=>tournamentWorld?.getRank?.()===1&&(state.flags?.majorWins||0)>=1 },
    { id:'iron-career', icon:'fa-hourglass-half', name:'职业常青树', desc:'职业生涯进入第6年。', test:()=> (state.date?.year || 1) >= 6 },
  ];

  function toast(achievement) {
    const el = document.createElement('div');
    el.className = 'achievement-toast';
    el.innerHTML = `<i class="fa-solid ${achievement.icon}"></i><div><strong>成就解锁</strong><span>${achievement.name}</span></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2600);
  }

  function checkAchievements(showToast = true) {
    if (!state.started) return;
    const unlocked = readAchievements();
    let changed = false;
    ACHIEVEMENTS.forEach((achievement) => {
      if (unlocked[achievement.id]) return;
      let passed = false;
      try { passed = !!achievement.test(); } catch (_) { passed = false; }
      if (!passed) return;
      unlocked[achievement.id] = {
        unlockedAt: new Date().toISOString(),
        year: state.date?.year || 1,
        month: state.date?.month || 1,
      };
      changed = true;
      if (showToast) toast(achievement);
    });
    if (changed) writeAchievements(unlocked);
  }

  function showAchievements() {
    checkAchievements(false);
    const home = document.getElementById('career-home');
    const card = home?.querySelector('.home-card');
    if (!home || !card) return;
    const unlocked = readAchievements();
    const count = ACHIEVEMENTS.filter((achievement) => unlocked[achievement.id]).length;
    home.style.display = 'flex';
    card.innerHTML = `
      <div class="home-kicker">ACHIEVEMENTS</div>
      <h1>成就中心</h1>
      <p class="home-subtitle">已解锁 ${count} / ${ACHIEVEMENTS.length}</p>
      <div class="achievement-grid">
        ${ACHIEVEMENTS.map((achievement) => {
          const on = !!unlocked[achievement.id];
          return `<div class="achievement-card ${on ? 'unlocked' : 'locked'}"><i class="fa-solid ${achievement.icon}"></i><div><strong>${achievement.name}</strong><span>${achievement.desc}</span>${on ? `<small>Y${unlocked[achievement.id].year}/M${unlocked[achievement.id].month} 解锁</small>` : '<small>尚未解锁</small>'}</div></div>`;
        }).join('')}
      </div>
      <button class="home-secondary" onclick="metaSystem.showHome()"><i class="fa-solid fa-arrow-left"></i> 返回首页</button>`;
  }
  metaSystem.showAchievements = showAchievements;

  function showSaveDialog() {
    ui.showModal('保存游戏', `
      <div style="display:grid;gap:8px">
        <button class="manual-save-row" onclick="careerExpansionV14.saveSlot(1)"><span><strong>存档 1</strong><small>覆盖/写入手动存档1</small></span><i class="fa-solid fa-floppy-disk"></i></button>
        <button class="manual-save-row" onclick="careerExpansionV14.saveSlot(2)"><span><strong>存档 2</strong><small>覆盖/写入手动存档2</small></span><i class="fa-solid fa-floppy-disk"></i></button>
        <button class="manual-save-row" onclick="careerExpansionV14.saveSlot(3)"><span><strong>存档 3</strong><small>覆盖/写入手动存档3</small></span><i class="fa-solid fa-floppy-disk"></i></button>
      </div>
      <p style="font-size:.75rem;color:#94a3b8;margin-top:10px">进入下个月仍会自动保存。</p>`,
    [{ text:'取消', class:'btn-outline', cb:()=>ui.closeModal() }]);
  }

  function ensureSaveButton() {
    if (!state.started) return;
    let button = document.getElementById('btn-save-game');
    if (button) {
      button.onclick = showSaveDialog;
      button.style.display = '';
      return;
    }
    const anchor = document.getElementById('btn-team-hub')
      || document.querySelector('.area-stats button[onclick*="showHonorRoom"]')
      || document.querySelector('.area-stats button');
    const parent = anchor?.parentElement || document.querySelector('.area-stats');
    if (!parent) return;
    button = document.createElement('button');
    button.id = 'btn-save-game';
    button.className = 'btn btn-outline';
    button.style.flex = '1';
    button.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 保存';
    button.onclick = showSaveDialog;
    parent.appendChild(button);
  }

  function teamAverageOvr(team) {
    if (!team?.roster?.length) return Number(team?.base || 0);
    return team.roster.reduce((sum, row) => sum + Number(team.base || 0) + Number(row?.[2] || 0), 0) / team.roster.length;
  }

  function lowerAbilityTeams() {
    const currentId = state.teamSystem?.currentTeamId;
    const playerOvr = Number(teamSystem.getUserOvr?.() || 0);
    return (teamSystem.getTeams?.() || [])
      .filter((team) => team.id !== currentId && teamAverageOvr(team) < playerOvr)
      .sort((a, b) => teamAverageOvr(b) - teamAverageOvr(a));
  }

  function showFreeChoice() {
    const choices = lowerAbilityTeams();
    const playerOvr = Number(teamSystem.getUserOvr?.() || 0);
    if (!choices.length) {
      ui.showModal('自由球员市场', `你的当前 OVR 为 <strong>${playerOvr}</strong>，目前没有平均能力低于你的可选现役战队。`, [
        { text:'查看普通报价', class:'btn-primary', cb:()=>{ ui.closeModal(); setTimeout(()=>teamSystem.enterFreeAgency?.(), 80); } },
      ]);
      return;
    }
    const html = choices.map((team) => {
      const avg = Math.round(teamAverageOvr(team));
      return `<div class="transfer-offer" style="margin-bottom:7px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><div style="font-weight:800">${team.name}</div><div style="font-size:.76rem;color:#64748b">队伍平均 OVR ${avg} · Prestige ${team.prestige} · Valve快照 #${team.valveRank}</div></div><button class="btn btn-success" onclick="careerExpansionV14.chooseFreeAgentTeam('${team.id}')">加入</button></div></div>`;
    }).join('');
    ui.showModal('不续约 · 自由选择战队', `<p style="font-size:.84rem;color:#475569;margin-bottom:10px">你的 OVR：<strong>${playerOvr}</strong>。合同到期后，你可以直接加入任意<strong>队伍平均 OVR 低于你</strong>的现役战队。</p><div style="max-height:360px;overflow:auto">${html}</div>`, [
      { text:'返回', class:'btn-outline', cb:()=>ui.closeModal() },
    ]);
  }

  function chooseFreeAgentTeam(teamId) {
    const team = lowerAbilityTeams().find((row) => row.id === teamId);
    if (!team) return;
    const current = teamSystem.getTeam?.();
    const signBonus = clamp(Math.max(1, Number(team.salary || 1)), 1, 6);
    const contractMonths = team.prestige >= 84 ? 24 : 18;
    state.teamSystem.activeOffers = [{ teamId: team.id, signBonus, contractMonths }];
    logic.log(`合同到期后选择加盟 ${team.name}（队伍平均 OVR ${Math.round(teamAverageOvr(team))} < 你的 OVR ${teamSystem.getUserOvr()}）`, 'pos');
    teamSystem.acceptOffer(team.id);
    if (current) checkAchievements(true);
  }

  // Replace only the contract-expiry modal. Mid-contract transfer windows remain unchanged.
  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => {
    if (String(title || '') === '合同到期') {
      const team = teamSystem.getTeam?.();
      return previousShowModal('合同到期', `<p><strong>${team?.name || '当前战队'}</strong> 希望与你续约。</p><p style="font-size:.82rem;color:#64748b;margin-top:7px">如果不续约，你可以自由选择任意平均能力低于你个人 OVR 的现役战队加盟。</p>`, [
        { text:'续约', class:'btn-primary', cb:()=>teamSystem.renewContract?.() },
        { text:'不续约 · 自由选队', class:'btn-warning', cb:()=>{ ui.closeModal(); setTimeout(showFreeChoice, 90); } },
      ]);
    }
    return previousShowModal(title, html, buttons);
  };

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    ensureSaveButton();
    checkAchievements(true);
    return out;
  };

  ensureSaveButton();
  checkAchievements(false);
  window.careerExpansionV14 = {
    showSaveDialog,
    saveSlot: (slot) => metaSystem.saveSlot(slot),
    ensureSaveButton,
    showFreeChoice,
    chooseFreeAgentTeam,
    checkAchievements,
    achievements: ACHIEVEMENTS,
  };
  console.info(`[career-expansion-v14] Save button guard, free-choice renewal exit, and ${ACHIEVEMENTS.length} achievements loaded.`);
})();

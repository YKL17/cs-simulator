(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem) {
    console.warn('[tournament-world] Core/team systems are not ready.');
    return;
  }

  const WORLD_TEAMS = [
    { id: 'gamerlegion', name: 'GamerLegion', prestige: 50 },
    { id: 'monte', name: 'Monte', prestige: 52 },
    { id: 'pain', name: 'paiN', prestige: 55 },
    { id: 'big', name: 'BIG', prestige: 58 },
    { id: 'complexity', name: 'Complexity', prestige: 64 },
    { id: 'fnatic', name: 'fnatic', prestige: 66 },
    { id: 'nip', name: 'Ninjas in Pyjamas', prestige: 68 },
    { id: 'liquid', name: 'Team Liquid', prestige: 72 },
    { id: 'furia', name: 'FURIA', prestige: 73 },
    { id: 'vp', name: 'Virtus.pro', prestige: 75 },
    { id: 'mouz', name: 'MOUZ', prestige: 78 },
    { id: 'g2', name: 'G2', prestige: 84 },
    { id: 'astralis', name: 'Astralis', prestige: 86 },
    { id: 'faze', name: 'FaZe', prestige: 88 },
    { id: 'navi', name: 'Natus Vincere', prestige: 91 },
    { id: 'vitality', name: 'Vitality', prestige: 93 },
    { id: 'spirit', name: 'Team Spirit', prestige: 94 },
  ];

  const CALENDAR = {
    1: { id: 'open-winter', name: 'Winter Open Series', level: 'C', type: 'open', inviteLimit: 99, optional: true, worldReward: 32, desc: '公开预选赛。所有战队都能报名，是新人和低排名战队追积分的主要入口。' },
    2: { id: 'regional-masters', name: 'Regional Masters', level: 'B', type: 'ranked', inviteLimit: 16, worldReward: 52, desc: '世界排名前 16 获得正赛资格。' },
    3: { id: 'international-open', name: 'International Open', level: 'A', type: 'ranked', inviteLimit: 12, worldReward: 82, desc: '世界排名前 12 受邀参加国际赛事。' },
    4: { id: 'spring-elite', name: 'Spring Elite', level: 'S', type: 'ranked', inviteLimit: 8, worldReward: 125, desc: '世界排名前 8 的顶级赛事，也是春季 Major 前最重要的积分赛。' },
    5: { id: 'spring-major-cutoff', name: 'Spring Major 排名截止 / 集训', level: 'Major', type: 'major_prep', inviteLimit: 12, desc: '月底锁定 Major 种子。前 12 获得资格，排名越高进入的 Stage 越靠后。' },
    6: { id: 'spring-major', name: 'Spring Major', level: 'Major', type: 'major', desc: 'Major 月。比赛由 Stage 1 → Stage 2 → Stage 3 → Playoffs 推进。' },
    7: { id: 'summer-break', name: '夏季休赛期', level: '-', type: 'break', desc: '转会窗口与夏季特训。没有固定正式赛事。' },
    8: { id: 'summer-cup', name: 'Summer Cup', level: 'B', type: 'ranked', inviteLimit: 16, worldReward: 52, desc: '下半赛季第一站，世界排名前 16 获得资格。' },
    9: { id: 'global-clash', name: 'Global Clash', level: 'A', type: 'ranked', inviteLimit: 12, worldReward: 82, desc: '世界排名前 12 的国际赛事。' },
    10: { id: 'fall-elite', name: 'Fall Elite', level: 'S', type: 'ranked', inviteLimit: 8, worldReward: 125, desc: '冬季 Major 前的最后一场顶级积分赛事。' },
    11: { id: 'winter-major-cutoff', name: 'Winter Major 排名截止 / 集训', level: 'Major', type: 'major_prep', inviteLimit: 12, desc: '月底锁定第二次 Major 种子。' },
    12: { id: 'winter-major', name: 'Winter Major', level: 'Major', type: 'major', desc: '年度第二次 Major，结束后进行年度 Top 20 评选。' },
  };

  const world = {
    initialized: false,
    points: {},
    currentEvent: null,
    resolvedEventKeys: {},
    majorSeeds: {},
    majorPrepScores: {},
    news: [],
    seasonResults: [],
    lastRanking: [],
  };
  state.tournamentWorld = world;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const monthKey = (year = state.date.year, month = state.date.month) => `${year}-${month}`;
  const currentTeamId = () => state.teamSystem?.currentTeamId || null;
  const currentTeam = () => WORLD_TEAMS.find((t) => t.id === currentTeamId()) || WORLD_TEAMS[0];
  const teamById = (id) => WORLD_TEAMS.find((t) => t.id === id);

  function addNews(text) {
    world.news.unshift({ key: monthKey(), text });
    world.news = world.news.slice(0, 24);
  }

  function rankings() {
    const rows = WORLD_TEAMS.map((team) => ({ ...team, points: Math.max(0, Math.round(world.points[team.id] || 0)) }))
      .sort((a, b) => b.points - a.points || b.prestige - a.prestige)
      .map((team, index) => ({ ...team, rank: index + 1 }));
    world.lastRanking = rows;
    return rows;
  }

  function rankOf(teamId = currentTeamId()) {
    return rankings().find((r) => r.id === teamId)?.rank || WORLD_TEAMS.length;
  }

  function initializePoints() {
    WORLD_TEAMS.forEach((team) => {
      const noise = Math.floor(Math.random() * 41) - 20;
      world.points[team.id] = 180 + team.prestige * 7 + noise;
    });
  }

  function worldStrength(teamId) {
    const team = teamById(teamId);
    if (!team) return 70;
    const pts = world.points[teamId] || 500;
    let strength = team.prestige * 0.72 + pts / 28;
    if (teamId === currentTeamId()) {
      strength += (teamSystem.getUserOvr() - 80) * 0.32;
      strength += (teamSystem.averageRelation() - 50) * 0.07;
    }
    return strength;
  }

  function addWorldPoints(teamId, amount, reason) {
    if (!teamId || !world.points.hasOwnProperty(teamId)) return;
    world.points[teamId] = Math.max(0, (world.points[teamId] || 0) + Math.round(amount));
    if (teamId === currentTeamId() && reason) logic.log(`世界排名积分 ${amount >= 0 ? '+' : ''}${Math.round(amount)} (${reason})`, amount >= 0 ? 'pos' : 'neg');
  }

  function decayWorldPoints() {
    WORLD_TEAMS.forEach((team) => {
      world.points[team.id] = Math.max(100, Math.round((world.points[team.id] || 0) * 0.992));
    });
  }

  function getCalendarEvent(month = state.date.month) {
    return CALENDAR[month] || null;
  }

  function nextPlayableEvent(afterMonth = state.date.month) {
    for (let step = 1; step <= 12; step++) {
      const m = ((afterMonth - 1 + step) % 12) + 1;
      const evt = CALENDAR[m];
      if (evt && !['break', 'major'].includes(evt.type)) return { ...evt, month: m };
    }
    return null;
  }

  function invitationFor(event, teamId = currentTeamId()) {
    if (!event) return false;
    if (event.type === 'open') return true;
    if (event.type === 'ranked') return rankOf(teamId) <= event.inviteLimit;
    if (event.type === 'major_prep') return rankOf(teamId) <= event.inviteLimit;
    return false;
  }

  function rosterSelection() {
    const role = teamSystem.getRole();
    if (role === 'reserve') return { selected: false, role, reason: '你目前是替补，本项赛事没有进入首发名单。' };
    if (role === 'rotation') {
      const selected = Math.random() < 0.68;
      return { selected, role, reason: selected ? '教练决定本次赛事让你进入首发。' : '轮换竞争中，教练本次选择了另一套首发。' };
    }
    return { selected: true, role, reason: role === 'core' ? '你是队内核心，默认进入首发。' : '你是固定首发，进入参赛名单。' };
  }

  function primarySlot() {
    if (!state.slots.length) state.slots.push({ id: 1, status: 'empty' });
    return state.slots[0];
  }

  function clearLegacySlots() {
    state.slots.forEach((slot, index) => {
      if (index === 0) return;
      slot.status = 'empty';
      delete slot.worldEventId;
    });
  }

  function setupPrepSlot(event, majorPrep = false) {
    const slot = primarySlot();
    slot.status = 'planning';
    slot.name = event.name;
    slot.level = majorPrep ? 'S' : event.level;
    slot.scores = { tac: 0, trn: 0, real: 0 };
    slot.worldEventId = event.id;
    slot.worldMajorPrep = majorPrep;
    clearLegacySlots();
    return slot;
  }

  function initializeCurrentMonth() {
    if (!state.started) return;
    const base = getCalendarEvent();
    if (!base) return;
    const key = monthKey();

    if (base.type === 'ranked' || base.type === 'open') {
      const invited = invitationFor(base);
      const selection = invited ? rosterSelection() : { selected: false, role: teamSystem.getRole(), reason: '战队未获得本项赛事资格。' };
      world.currentEvent = {
        ...base,
        key,
        invited,
        selected: selection.selected,
        selectionReason: selection.reason,
        status: world.resolvedEventKeys[key] ? 'completed' : 'planning',
      };
      if (world.currentEvent.status === 'planning' && invited && selection.selected) setupPrepSlot(world.currentEvent, false);
      else primarySlot().status = 'empty';
    } else if (base.type === 'major_prep') {
      world.currentEvent = { ...base, key, invited: invitationFor(base), selected: true, status: 'planning' };
      setupPrepSlot(world.currentEvent, true);
    } else {
      world.currentEvent = { ...base, key, status: 'calendar' };
      primarySlot().status = 'empty';
    }
  }

  function initializeWorld() {
    if (world.initialized) return;
    initializePoints();
    world.initialized = true;
    const rows = rankings();
    const me = rows.find((r) => r.id === currentTeamId());
    logic.log(`世界排名系统启动：${currentTeam().name} 初始排名 #${me?.rank || '-'}。`, 'pos');
    addNews(`新赛季开始，${rows[0].name} 暂列世界第一。`);
    initializeCurrentMonth();
  }

  function placementWorldReward(event, result) {
    const max = event.worldReward || 30;
    if (result.includes('冠军')) return max;
    if (result.includes('亚军') || result.includes('决赛')) return Math.round(max * 0.68);
    if (result.includes('四强')) return Math.round(max * 0.46);
    if (result.includes('八强')) return Math.round(max * 0.30);
    if (result.includes('16强') || result.includes('晋级')) return Math.round(max * 0.18);
    if (result.includes('小组')) return Math.round(max * 0.10);
    return Math.max(2, Math.round(max * 0.06));
  }

  function simulatedPlacement(index, total) {
    if (index === 0) return '冠军';
    if (index === 1) return '亚军';
    if (index < 4) return '四强';
    if (index < 8) return '八强';
    if (index < 16) return '16强';
    return total > 16 ? '小组出局' : '首轮出局';
  }

  function eligibleTeamIds(event) {
    if (event.type === 'open') return WORLD_TEAMS.map((t) => t.id);
    const rows = rankings();
    const limit = event.inviteLimit || WORLD_TEAMS.length;
    return rows.slice(0, limit).map((r) => r.id);
  }

  function simulateAiTournament(event, includeCurrent = false) {
    if (!event || !['open', 'ranked'].includes(event.type)) return null;
    let ids = eligibleTeamIds(event);
    if (!includeCurrent) ids = ids.filter((id) => id !== currentTeamId());
    if (!ids.length) return null;

    const table = ids.map((id) => ({ id, perf: worldStrength(id) + (Math.random() * 24 - 12) }))
      .sort((a, b) => b.perf - a.perf);
    table.forEach((row, index) => {
      const result = simulatedPlacement(index, table.length);
      addWorldPoints(row.id, placementWorldReward(event, result), '');
    });
    return { winnerId: table[0].id, table };
  }

  function simulateTeamWithoutPlayer(event, reason = '未进入首发') {
    if (!event || !invitationFor(event)) return null;
    const rank = rankOf();
    const strength = worldStrength(currentTeamId()) + (Math.random() * 24 - 12) - 2;
    const field = eligibleTeamIds(event).filter((id) => id !== currentTeamId())
      .map((id) => worldStrength(id) + (Math.random() * 24 - 12))
      .sort((a, b) => b - a);
    const index = field.filter((score) => score > strength).length;
    const result = simulatedPlacement(index, field.length + 1);
    addWorldPoints(currentTeamId(), placementWorldReward(event, result), `${reason}，战队${result}`);
    addNews(`${currentTeam().name} 在 ${event.name} 取得${result}（你${reason}）。`);
    world.resolvedEventKeys[event.key] = true;
    if (world.currentEvent?.key === event.key) world.currentEvent.status = 'team-simulated';
    return { result, rank };
  }

  function openQualifier(event) {
    const slot = primarySlot();
    const rank = rankOf();
    const prep = (slot.scores.tac + slot.scores.trn + slot.scores.real) / 3;
    const chance = clamp(0.48 + (18 - rank) * 0.018 + (teamSystem.getUserOvr() - 80) * 0.009 + prep * 0.012, 0.30, 0.88);
    if (Math.random() > chance) {
      const kills = Math.max(8, Math.round(teamSystem.getUserOvr() / 5 + Math.random() * 12));
      state.flags.careerKills += kills;
      state.history.push({ name: `${event.name} Open Qualifier`, level: 'C', points: 0, k: kills, money: 0, result: '预选出局', year: state.date.year });
      addWorldPoints(currentTeamId(), 2, '参加公开预选');
      world.resolvedEventKeys[event.key] = true;
      event.status = 'completed';
      slot.status = 'empty';
      ui.showModal('Open Qualifier', `<p>你们参加了 ${event.name} 的公开预选，但没能拿到正赛席位。</p><h3 style="text-align:center;margin:18px 0;color:#ef4444">预选出局</h3><p style="font-size:.85rem;color:#64748b">晋级概率 ${(chance * 100).toFixed(0)}%</p>`, [
        { text: '继续赛季', class: 'btn-primary', cb: () => { ui.closeModal(); ui.render(); } },
      ]);
      return false;
    }
    logic.log(`${event.name} Open Qualifier 晋级，进入正赛！`, 'pos');
    return true;
  }

  function playCurrentEvent() {
    const event = world.currentEvent;
    if (!event || !['open', 'ranked'].includes(event.type)) return;
    if (event.status !== 'planning') return;
    if (!event.invited) return;
    if (!event.selected) {
      simulateTeamWithoutPlayer(event, '未进入首发');
      ui.render();
      return;
    }

    if (event.type === 'open' && !openQualifier(event)) return;
    const slot = primarySlot();
    slot.level = event.level;
    slot.name = event.name;
    slot.savedScores = { ...slot.scores };
    slot.status = 'resolving';
    slot.worldEventId = event.id;
    slot.worldEventKey = event.key;
    setTimeout(() => logic.triggerMatchEvent(slot.id), 80);
    ui.render();
  }

  function requestRestAndAdvance() {
    const event = world.currentEvent;
    if (!event) return;
    event.status = 'rested';
    world.resolvedEventKeys[event.key] = true;
    primarySlot().status = 'empty';
    logic.modStat('san', 2, '主动轮休');
    logic.modStat('coach', -1, '缺席正式赛事');
    simulateTeamWithoutPlayer(event, '申请轮休');
    ui.closeModal();
    setTimeout(() => logic.nextMonth(), 100);
  }

  function gameNextMonth() {
    const event = world.currentEvent;
    if (event && ['ranked'].includes(event.type) && event.invited && event.selected && event.status === 'planning') {
      ui.showModal('本月正式赛事尚未完成', `${currentTeam().name} 已获得 <strong>${event.name}</strong> 的参赛资格。作为${teamSystem.getRole() === 'core' ? '队内核心' : '首发选手'}，你不能像旧版本一样直接跳过赛历。`, [
        { text: '进入赛事', class: 'btn-primary', cb: () => { ui.closeModal(); playCurrentEvent(); } },
        { text: '申请轮休', class: 'btn-outline', cb: requestRestAndAdvance },
      ]);
      return;
    }
    logic.nextMonth();
  }

  function lockMajorSeed(year, half) {
    const key = `${year}-${half}`;
    const rows = rankings();
    const currentRank = rows.find((r) => r.id === currentTeamId())?.rank || WORLD_TEAMS.length;
    const qualified = rows.slice(0, 12).map((r) => r.id);
    world.majorSeeds[key] = { rank: currentRank, qualified, snapshot: rows.map((r) => ({ id: r.id, rank: r.rank, points: r.points })) };
    const slot = primarySlot();
    if (slot.worldMajorPrep && slot.scores) world.majorPrepScores[key] = { ...slot.scores };
    addNews(`${half === 'spring' ? 'Spring' : 'Winter'} Major 排名锁定：${rows[0].name} 为头号种子，${currentTeam().name} 排名 #${currentRank}。`);
  }

  function winProbability(aId, bId, prepBonus = 0, playerActive = true) {
    let diff = worldStrength(aId) - worldStrength(bId);
    if (aId === currentTeamId()) diff += prepBonus * 0.55 + (playerActive ? (teamSystem.getUserOvr() - 82) * 0.18 : -3);
    if (bId === currentTeamId()) diff -= prepBonus * 0.55 + (playerActive ? (teamSystem.getUserOvr() - 82) * 0.18 : -3);
    return clamp(0.50 + diff / 72, 0.18, 0.82);
  }

  function majorOpponent(pool, used) {
    const available = pool.filter((id) => id !== currentTeamId() && !used.includes(id));
    if (available.length) return sample(available);
    return sample(pool.filter((id) => id !== currentTeamId()));
  }

  function simulateSwiss(stageName, pool, prepBonus, playerActive, logLines) {
    let wins = 0;
    let losses = 0;
    const used = [];
    while (wins < 3 && losses < 3) {
      const opp = majorOpponent(pool, used);
      used.push(opp);
      const p = winProbability(currentTeamId(), opp, prepBonus, playerActive);
      const win = Math.random() < p;
      if (win) wins++; else losses++;
      logLines.push(`<div style="display:flex;justify-content:space-between;gap:8px"><span>${stageName} · vs ${teamById(opp)?.name || 'Opponent'}</span><strong style="color:${win ? '#059669' : '#dc2626'}">${win ? '胜' : '负'} (${wins}-${losses})</strong></div>`);
    }
    return wins === 3;
  }

  function simulateMajor(half) {
    const year = state.date.year;
    const seedKey = `${year}-${half}`;
    const seed = world.majorSeeds[seedKey] || (() => {
      lockMajorSeed(year, half);
      return world.majorSeeds[seedKey];
    })();
    const rank = seed.rank;
    const qualified = seed.qualified.includes(currentTeamId());
    const label = half === 'spring' ? 'Spring Major' : 'Winter Major';
    const eventName = `${label} ${year}`;

    if (!qualified) {
      state.history.push({ name: eventName, level: 'Major', points: 0, k: 0, money: 0, result: '未获资格', year });
      addNews(`${currentTeam().name} 世界排名 #${rank}，未获得 ${label} 资格。`);
      ui.showModal(eventName, `<p>Major 邀请名单正式公布。</p><h2 style="text-align:center;color:#dc2626;margin:18px 0">未获资格</h2><p>${currentTeam().name} 在排名截止时位列 <strong>#${rank}</strong>，未进入前 12。</p>`, [
        { text: '继续赛季', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      primarySlot().status = 'empty';
      return;
    }

    const role = teamSystem.getRole();
    const playerActive = role === 'core' || role === 'starter' || (role === 'rotation' && Math.random() < 0.72);
    const prep = world.majorPrepScores[seedKey] || { tac: 0, trn: 0, real: 0 };
    const prepBonus = Math.round((prep.tac + prep.trn + prep.real) / 3);
    const pool = seed.qualified.slice();
    const lines = [];
    let result = '';
    let reached = rank <= 4 ? 3 : rank <= 8 ? 2 : 1;

    if (reached <= 1 && !simulateSwiss('Stage 1', pool, prepBonus, playerActive, lines)) result = 'Stage 1 出局';
    if (!result && reached <= 2 && !simulateSwiss('Stage 2', pool, prepBonus, playerActive, lines)) result = 'Stage 2 出局';
    if (!result && !simulateSwiss('Stage 3', pool, prepBonus, playerActive, lines)) result = 'Stage 3 出局';

    const playoffRounds = [
      { label: 'Quarterfinal', lose: '八强' },
      { label: 'Semifinal', lose: '四强' },
      { label: 'Final', lose: '亚军' },
    ];
    if (!result) {
      const used = [];
      for (const round of playoffRounds) {
        const opp = majorOpponent(pool, used);
        used.push(opp);
        const p = winProbability(currentTeamId(), opp, prepBonus, playerActive);
        const win = Math.random() < p;
        lines.push(`<div style="display:flex;justify-content:space-between;gap:8px"><span>${round.label} · vs ${teamById(opp)?.name || 'Opponent'}</span><strong style="color:${win ? '#059669' : '#dc2626'}">${win ? '胜' : '负'}</strong></div>`);
        if (!win) { result = round.lose; break; }
      }
      if (!result) result = '冠军';
    }

    const rewards = {
      'Stage 1 出局': [0, 1, 35, 8],
      'Stage 2 出局': [1, 2, 60, 18],
      'Stage 3 出局': [2, 4, 90, 34],
      '八强': [4, 10, 150, 65],
      '四强': [6, 20, 220, 95],
      '亚军': [8, 40, 300, 135],
      '冠军': [10, 100, 480, 210],
    };
    const [careerPts, money, baseKills, worldPts] = rewards[result];
    const kills = playerActive ? Math.round(baseKills * (0.75 + Math.random() * 0.5)) : 0;
    const personalMoney = playerActive ? money : Math.floor(money * 0.35);
    const personalPts = playerActive ? careerPts : 0;
    const historyResult = playerActive ? result : `替补 · ${result}`;

    if (personalPts) state.flags.totalScore += personalPts;
    if (personalMoney) {
      logic.modStat('money', personalMoney, 'Major 奖金');
      state.flags.totalMoney += personalMoney;
    }
    if (kills) state.flags.careerKills += kills;
    if (['八强', '四强', '亚军', '冠军'].includes(result)) logic.modStat('coach', Math.min(5, 1 + Math.floor(careerPts / 2)), 'Major 表现');
    if (result === '冠军') {
      state.flags.majorWins++;
      state.flags.majorBest = 8;
    }
    addWorldPoints(currentTeamId(), worldPts, `Major ${result}`);
    state.history.push({ name: eventName, level: 'Major', points: personalPts, k: kills, money: personalMoney, result: historyResult, year });
    addNews(`${currentTeam().name} 在 ${label} 取得${result}${playerActive ? '' : '，你本届以替补身份随队'}。`);

    const seedText = rank <= 4 ? '直接进入 Stage 3' : rank <= 8 ? '从 Stage 2 开始' : '从 Stage 1 开始';
    ui.showModal(eventName, `
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:12px">
        <div><strong>排名截止：</strong>#${rank} · ${seedText}</div>
        <div><strong>你的身份：</strong>${playerActive ? '参赛阵容' : '替补名单'}</div>
        <div><strong>Major 备战：</strong>${prepBonus}</div>
      </div>
      <div style="display:grid;gap:5px;font-size:.83rem;max-height:230px;overflow-y:auto">${lines.join('')}</div>
      <h2 style="text-align:center;color:var(--primary);margin:18px 0">${historyResult}</h2>
      <p style="font-size:.85rem;color:#64748b">个人奖励：职业积分 +${personalPts} · 金币 +${personalMoney} · 击杀 +${kills}</p>
    `, [{ text: '结束 Major', class: 'btn-primary', cb: () => { ui.closeModal(); ui.render(); } }]);
    primarySlot().status = 'empty';
  }

  function triggerMajorOverride() {
    if (!world.initialized) initializeWorld();
    const half = state.date.month === 6 ? 'spring' : 'winter';
    simulateMajor(half);
  }

  function captureActualTournamentResult(slot, beforeHistoryLength) {
    if (!slot?.worldEventKey || state.history.length <= beforeHistoryLength) return;
    const event = world.currentEvent;
    if (!event || event.key !== slot.worldEventKey) return;
    const entry = state.history[state.history.length - 1];
    const worldPts = placementWorldReward(event, entry.result);
    addWorldPoints(currentTeamId(), worldPts, `${event.name} ${entry.result}`);
    world.resolvedEventKeys[event.key] = true;
    event.status = 'completed';
    event.result = entry.result;
    addNews(`${currentTeam().name} 在 ${event.name} 取得${entry.result}。`);
  }

  function settleAiForOutgoingMonth() {
    const event = world.currentEvent;
    if (!event) return;
    if (['open', 'ranked'].includes(event.type)) {
      const currentResolved = Boolean(world.resolvedEventKeys[event.key]);
      const ai = simulateAiTournament(event, false);
      if (!currentResolved) {
        if (event.invited && !event.selected) simulateTeamWithoutPlayer(event, '未进入首发');
        else if (event.type === 'open') {
          event.status = 'skipped';
          world.resolvedEventKeys[event.key] = true;
          addNews(`${currentTeam().name} 放弃了 ${event.name} 的公开预选。`);
        } else if (event.invited) simulateTeamWithoutPlayer(event, '本月未出场');
      }
      if (ai?.winnerId) {
        const currentWon = event.result?.includes('冠军');
        const winner = currentWon ? currentTeam() : teamById(ai.winnerId);
        if (winner) addNews(`${winner.name} 赢得 ${event.name}。`);
      }
    }

    if (event.type === 'major_prep') {
      const half = state.date.month === 5 ? 'spring' : 'winter';
      lockMajorSeed(state.date.year, half);
    }
  }

  function monthlyWorldTick() {
    decayWorldPoints();
    rankings();
    initializeCurrentMonth();
    const me = rankings().find((r) => r.id === currentTeamId());
    if (me) logic.log(`当前世界排名：#${me.rank}（${me.points} 分）`);
  }

  function openWorldHub() {
    if (!world.initialized) initializeWorld();
    const rows = rankings();
    const me = rows.find((r) => r.id === currentTeamId());
    const calendarRows = Object.entries(CALENDAR).map(([m, evt]) => {
      const active = Number(m) === state.date.month;
      const label = evt.level === '-' ? '' : `[${evt.level}] `;
      return `<div style="display:grid;grid-template-columns:35px 1fr;gap:8px;padding:6px 8px;border-radius:6px;${active ? 'background:#eff6ff;font-weight:700;' : ''}"><span>${m}月</span><span>${label}${evt.name}</span></div>`;
    }).join('');
    const rankRows = rows.map((row) => `
      <div style="display:grid;grid-template-columns:34px 1fr 60px;gap:8px;padding:6px 8px;border-bottom:1px solid #f1f5f9;${row.id === currentTeamId() ? 'background:#eff6ff;font-weight:700;' : ''}">
        <span>#${row.rank}</span><span>${row.name}</span><span style="text-align:right">${row.points}</span>
      </div>`).join('');
    const news = world.news.length ? world.news.slice(0, 8).map((n) => `<div style="padding:5px 0;border-bottom:1px solid #f1f5f9"><span style="color:#94a3b8;margin-right:6px">Y${n.key.replace('-', '/M')}</span>${n.text}</div>`).join('') : '<div style="color:#94a3b8">暂无世界新闻</div>';

    ui.showModal('CS 世界赛事中心', `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div class="team-summary-card"><div class="team-summary-value">#${me?.rank || '-'}</div><div class="team-summary-label">当前世界排名</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${me?.points || 0}</div><div class="team-summary-label">排名积分</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${currentTeam().name}</div><div class="team-summary-label">当前战队</div></div>
      </div>
      <div style="font-weight:800;margin:8px 0">世界排名</div>
      <div style="max-height:205px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px">${rankRows}</div>
      <div style="font-weight:800;margin:14px 0 8px">年度赛历</div>
      <div style="max-height:205px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px">${calendarRows}</div>
      <div style="font-weight:800;margin:14px 0 8px">世界新闻</div>
      <div style="font-size:.8rem">${news}</div>
      <div style="font-size:.72rem;color:#94a3b8;margin-top:12px">赛事名、积分与排名均为本模拟器世界设定，不代表现实赛事安排或官方排名。</div>
    `, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  }

  function addWorldButton() {
    if (document.getElementById('btn-world-hub')) return;
    const teamButton = document.getElementById('btn-team-hub');
    const honorButton = document.querySelector('.area-stats button[onclick="ui.showHonorRoom()"]');
    const anchor = teamButton || honorButton;
    if (!anchor?.parentElement) return;
    const btn = document.createElement('button');
    btn.id = 'btn-world-hub';
    btn.className = 'btn btn-warning';
    btn.style.flex = '1';
    btn.innerHTML = '<i class="fa-solid fa-earth-americas"></i> 世界';
    btn.onclick = openWorldHub;
    anchor.parentElement.appendChild(btn);
  }

  function prepScoresHtml(slot) {
    const scores = slot?.scores || { tac: 0, trn: 0, real: 0 };
    return `<div class="slot-scores" style="margin:8px 0"><span class="score-badge">战术 ${scores.tac}</span><span class="score-badge">训练 ${scores.trn}</span><span class="score-badge">实战 ${scores.real}</span></div>`;
  }

  function renderWorldWorkstation() {
    const container = document.getElementById('slots-container');
    if (!container) return;
    if (!world.initialized) {
      container.innerHTML = '<div style="padding:18px;color:#64748b">开始生涯后生成世界赛历。</div>';
      return;
    }
    const event = world.currentEvent || getCalendarEvent();
    const rank = rankOf();
    const slot = primarySlot();
    const next = nextPlayableEvent();

    if (!event) return;
    if (event.type === 'break') {
      container.innerHTML = `<div class="slot-card"><div class="slot-header"><span>7月 · 夏季休赛期</span><span style="color:#059669">转会窗口</span></div><p style="font-size:.85rem;color:#64748b;margin:8px 0">本月没有固定赛事。可以专注特训、恢复和转会。</p><div style="font-size:.8rem">当前世界排名：<strong>#${rank}</strong></div><div style="font-size:.78rem;color:#94a3b8;margin-top:8px">下一站：${next?.month}月 ${next?.name}</div></div>`;
      return;
    }
    if (event.type === 'major') {
      container.innerHTML = `<div class="slot-card active" style="border-color:#f59e0b"><div class="slot-header"><span>${event.name}</span><span style="color:#d97706">Major 月</span></div><p style="font-size:.85rem;color:#64748b;margin:8px 0">Major 会在进入本月时依据上月锁定的世界排名自动进行。</p><div style="font-size:.8rem">当前世界排名：<strong>#${rank}</strong></div></div>`;
      return;
    }
    if (event.type === 'major_prep') {
      const projected = rank <= 4 ? '预计直接进入 Stage 3' : rank <= 8 ? '预计从 Stage 2 开始' : rank <= 12 ? '预计从 Stage 1 开始' : '当前无法获得 Major 资格';
      container.innerHTML = `<div class="slot-card active" style="border-color:#f59e0b"><div class="slot-header"><span>${event.name}</span><span style="color:#d97706">排名截止月</span></div><p style="font-size:.82rem;color:#64748b;margin:7px 0">${event.desc}</p><div style="font-size:.85rem">当前世界排名：<strong>#${rank}</strong> · ${projected}</div>${prepScoresHtml(slot)}<div style="font-size:.75rem;color:#94a3b8">本月的想战术 / 训练赛 / 天梯会转化为 Major 备战分。进入下个月后锁定种子并开始 Major。</div></div>`;
      return;
    }

    const invitedText = event.type === 'open' ? '公开报名' : `邀请线：世界前 ${event.inviteLimit}`;
    let statusHtml = '';
    let buttonHtml = '';
    if (!event.invited) {
      statusHtml = `<div style="padding:9px;background:#fef2f2;border-radius:7px;color:#991b1b;font-size:.82rem">当前排名 #${rank}，未达到本赛事邀请线。战队本月没有正赛可打。</div>`;
    } else if (!event.selected) {
      statusHtml = `<div style="padding:9px;background:#fff7ed;border-radius:7px;color:#9a3412;font-size:.82rem">战队已获得资格，但${event.selectionReason}</div>`;
    } else if (event.status === 'completed') {
      statusHtml = `<div style="padding:9px;background:#ecfdf5;border-radius:7px;color:#065f46;font-size:.82rem">本月赛事已完成：${event.result || '已结算'}</div>`;
    } else if (event.status === 'rested') {
      statusHtml = '<div style="padding:9px;background:#f8fafc;border-radius:7px;color:#64748b;font-size:.82rem">你申请轮休，战队由其他选手完成本项赛事。</div>';
    } else if (event.status === 'team-simulated') {
      statusHtml = '<div style="padding:9px;background:#f8fafc;border-radius:7px;color:#64748b;font-size:.82rem">你未进入名单，本项赛事由战队自动模拟完成。</div>';
    } else {
      statusHtml = `<div style="font-size:.8rem;color:#475569">${event.selectionReason || ''}</div>${prepScoresHtml(slot)}`;
      buttonHtml = `<button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="tournamentWorld.playCurrentEvent()"><i class="fa-solid fa-play"></i> ${event.type === 'open' ? '报名 Open Qualifier' : '进入正式赛事'}</button>`;
    }

    container.innerHTML = `<div class="slot-card ${event.invited ? 'active' : ''}"><div class="slot-header"><span>${event.name}</span><span style="color:var(--primary)">${event.level}级</span></div><div style="font-size:.76rem;color:#94a3b8;margin-bottom:6px">${invitedText} · 当前世界 #${rank}</div><p style="font-size:.82rem;color:#64748b;margin-bottom:8px">${event.desc}</p>${statusHtml}${buttonHtml}</div>`;
  }

  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    const before = state.history.length;
    const eventKey = slot?.worldEventKey;
    const result = previousFinalize(slot, mods);
    if (eventKey) captureActualTournamentResult(slot, before);
    ui.render();
    return result;
  };

  logic.triggerMajor = triggerMajorOverride;

  const previousInit = logic.init.bind(logic);
  logic.init = (roleId) => {
    previousInit(roleId);
    initializeWorld();
    addWorldButton();
    ui.render();
  };

  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    if (!world.initialized) initializeWorld();
    settleAiForOutgoingMonth();
    previousNextMonth();
    monthlyWorldTick();
    addWorldButton();
    ui.render();
  };

  game.nextMonth = gameNextMonth;
  game.openPlan = () => {
    ui.showModal('赛事报名方式已升级', '现在不能随时创建 C/B/A/S 杯赛。赛事由年度赛历生成，C级 Open Qualifier 可以主动报名，其余赛事需要战队达到世界排名邀请线。', [
      { text: '查看世界赛历', class: 'btn-primary', cb: () => { ui.closeModal(); openWorldHub(); } },
      { text: '知道了', class: 'btn-outline', cb: () => ui.closeModal() },
    ]);
  };
  game.signUp = () => playCurrentEvent();
  game.discardPlan = () => {
    const event = world.currentEvent;
    if (event?.type === 'open') {
      event.status = 'skipped';
      world.resolvedEventKeys[event.key] = true;
      primarySlot().status = 'empty';
      logic.log(`放弃 ${event.name} Open Qualifier`);
      ui.render();
    }
  };

  const previousRenderWorkstation = ui.renderWorkstation.bind(ui);
  ui.renderWorkstation = () => {
    if (!world.initialized && !state.started) return previousRenderWorkstation();
    renderWorldWorkstation();
  };

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    previousRender();
    addWorldButton();
  };

  const tournamentWorld = {
    openWorldHub,
    playCurrentEvent,
    getRankings: rankings,
    getRank: rankOf,
    getCalendarEvent,
    addWorldPoints,
  };
  window.tournamentWorld = tournamentWorld;

  addWorldButton();
  console.info('[tournament-world] World ranking, calendar, invitation and staged Major systems loaded.');
})();
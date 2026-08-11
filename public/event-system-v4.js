(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.tournamentWorld) {
    console.warn('[event-system-v4] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const teamState = state.teamSystem;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const monthKey = () => `${state.date.year}-${state.date.month}`;
  const LEVEL_WEIGHT = { C: 8, B: 14, A: 20, S: 28, Major: 40 };
  const BANDS = {
    S: { min: 1, max: 8 },
    A: { min: 9, max: 16 },
    B: { min: 17, max: 24 },
    C: { min: 25, max: 32 },
  };
  const MONTH_NAMES = {
    1: ['Winter Elite', 'Winter International', 'Winter Masters', 'Winter Challenger'],
    2: ['February Elite', 'February International', 'February Masters', 'February Challenger'],
    3: ['Spring Elite', 'Spring International', 'Spring Masters', 'Spring Challenger'],
    4: ['April Elite', 'April International', 'April Masters', 'April Challenger'],
    5: ['Major Prelude Elite', 'Major Prelude International', 'Major Prelude Masters', 'Major Prelude Challenger'],
    6: ['Summer Elite', 'Summer International', 'Summer Masters', 'Summer Challenger'],
    7: ['July Elite', 'July International', 'July Masters', 'July Challenger'],
    8: ['August Elite', 'August International', 'August Masters', 'August Challenger'],
    9: ['Fall Elite', 'Fall International', 'Fall Masters', 'Fall Challenger'],
    10: ['October Elite', 'October International', 'October Masters', 'October Challenger'],
    11: ['Major Prelude Elite II', 'Major Prelude International II', 'Major Prelude Masters II', 'Major Prelude Challenger II'],
    12: ['Year-End Elite', 'Year-End International', 'Year-End Masters', 'Year-End Challenger'],
  };

  world.v4 = world.v4 || { majorSeeds: {}, majorResults: {}, regularResults: {}, initialized: false };

  function rows() { return tournamentWorld.getRankings().slice(0, 32); }
  function teamById(id) { return teamSystem.getTeams().find((t) => t.id === id) || null; }
  function myId() { return teamState.currentTeamId; }
  function myRank() { return rows().find((r) => r.id === myId())?.rank || 32; }
  function bandForRank(rank) {
    if (rank <= 8) return 'S';
    if (rank <= 16) return 'A';
    if (rank <= 24) return 'B';
    return 'C';
  }
  function eventName(level, month = state.date.month) {
    const names = MONTH_NAMES[month] || MONTH_NAMES[1];
    return names[{ S: 0, A: 1, B: 2, C: 3 }[level]];
  }
  function monthEvents(month = state.date.month, rankingRows = rows()) {
    return ['S', 'A', 'B', 'C'].map((level) => {
      const band = BANDS[level];
      const participants = rankingRows.slice(band.min - 1, band.max).map((r) => r.id);
      return {
        id: `v4-${state.date.year}-${month}-${level}`,
        key: `${state.date.year}-${month}-${level}`,
        name: eventName(level, month),
        level,
        type: 'ranked',
        minRank: band.min,
        maxRank: band.max,
        inviteLimit: 8,
        participantIds: participants,
        desc: `世界排名 #${band.min}–#${band.max} 的 8 支战队参加。`,
      };
    });
  }
  function currentTeamEvent() {
    const rankingRows = rows();
    const rank = rankingRows.find((r) => r.id === myId())?.rank || 32;
    const level = bandForRank(rank);
    return monthEvents(state.date.month, rankingRows).find((e) => e.level === level);
  }

  function roleSelection() {
    const role = teamSystem.getRole();
    if (role === 'reserve') return { selected: false, role, reason: '你目前是替补，本项赛事不在首发名单。' };
    if (role === 'rotation') {
      const p = clamp(0.55 + (teamState.selectionMomentum || 0) * 0.045, 0.55, 0.86);
      const selected = Math.random() < p;
      return { selected, role, reason: selected ? '轮换竞争成功，本月进入首发。' : '本月轮换中未进入首发。' };
    }
    return { selected: true, role, reason: role === 'core' ? '队内核心，自动进入首发。' : '固定首发，进入参赛名单。' };
  }

  function setupSlot(event) {
    if (!state.slots?.length) state.slots = [{ id: 1, status: 'empty' }];
    const slot = state.slots[0];
    slot.status = event.selected && event.status === 'planning' ? 'planning' : 'empty';
    slot.name = event.name;
    slot.level = event.level;
    slot.worldEventId = event.id;
    slot.worldEventKey = event.key;
    slot.eventPrep = 0;
    slot.prepEventId = event.id;
    slot.scores = { tac: 0, trn: 0, real: 0 };
    return slot;
  }

  function setupCurrentMonth() {
    if (!state.started || !world.initialized) return;
    const base = currentTeamEvent();
    const selection = roleSelection();
    const resolved = !!world.v4.regularResults[base.key];
    world.currentEvent = {
      ...base,
      invited: true,
      selected: selection.selected,
      selectionReason: selection.reason,
      status: resolved ? 'completed' : 'planning',
      v4: true,
    };
    setupSlot(world.currentEvent);
  }

  function bucket(result) {
    const text = String(result || '');
    if (text.includes('冠军')) return { min: 1, max: 1, type: 'champion' };
    if (text.includes('亚军') || text.includes('决赛')) return { min: 2, max: 2, type: 'runner' };
    if (text.includes('四强') || text.includes('半决赛')) return { min: 3, max: 4, type: 'top4' };
    if (text.includes('八强')) return { min: 5, max: 8, type: 'top8' };
    return { min: 9, max: 16, type: 'group' };
  }

  function rankingDelta(level, seed, result, total = 8) {
    const b = bucket(result);
    const w = LEVEL_WEIGHT[level] || 10;
    if (b.type === 'champion') {
      const floor = Math.max(4, Math.round(w * 0.55));
      const bonus = seed > 1 ? Math.round(w * clamp((seed - 1) / Math.max(3, total - 1), 0.15, 1)) : 0;
      return floor + Math.max(0, bonus);
    }
    if (b.type === 'runner') {
      const floor = Math.max(2, Math.round(w * 0.30));
      const bonus = seed > 2 ? Math.round(w * clamp((seed - 2) / Math.max(3, total - 2), 0.12, 0.75)) : 0;
      return floor + Math.max(0, bonus);
    }
    if (b.type === 'top4') {
      if (seed <= 4) return 0;
      return Math.max(2, Math.round(w * clamp((seed - 4) / Math.max(2, total - 4), 0.15, 0.65)));
    }
    if (b.type === 'group') {
      const penalty = seed <= 4 ? 1.0 : seed <= 8 ? 0.65 : 0.45;
      return -Math.max(3, Math.round(w * penalty));
    }
    if (seed >= 5 && seed <= 8) return 0;
    if (seed > 8) return Math.max(2, Math.round(w * 0.2));
    return -Math.max(2, Math.round(w * clamp((5 - seed) / 4, 0.18, 0.65)));
  }

  function performance(id) {
    const team = teamById(id);
    const row = rows().find((r) => r.id === id);
    const rankBoost = row ? (33 - row.rank) * 0.25 : 0;
    const userBoost = id === myId() ? (teamSystem.getUserOvr() - 70) * 0.16 : 0;
    return (team?.prestige || 65) + rankBoost + userBoost + (Math.random() * 24 - 12);
  }

  function placementLabel(pos, total = 8) {
    if (pos === 1) return '冠军';
    if (pos === 2) return '亚军';
    if (pos <= 4) return '四强';
    if (pos <= 8) return '八强';
    return '小组未出线';
  }

  function setPoints(id, value) { world.points[id] = Math.max(300, Math.round(value)); }

  function simulateRegularField(event, skipUser = false) {
    const rankingRows = rows();
    const participantRows = event.participantIds.map((id) => rankingRows.find((r) => r.id === id)).filter(Boolean);
    const table = participantRows.map((r) => ({ id: r.id, perf: performance(r.id) })).sort((a, b) => b.perf - a.perf);
    table.forEach((entry, index) => {
      if (skipUser && entry.id === myId()) return;
      const seed = participantRows.findIndex((r) => r.id === entry.id) + 1;
      const result = placementLabel(index + 1, table.length);
      const delta = rankingDelta(event.level, seed, result, table.length);
      setPoints(entry.id, (world.points[entry.id] || 0) + delta);
    });
    return table;
  }

  function simulateMyTeamWithoutPlayer(event, reason = '未进入首发') {
    const rankingRows = rows();
    const participants = event.participantIds.map((id) => rankingRows.find((r) => r.id === id)).filter(Boolean);
    const seed = participants.findIndex((r) => r.id === myId()) + 1;
    const field = event.participantIds.map((id) => ({ id, perf: performance(id) + (id === myId() ? -2 : 0) })).sort((a, b) => b.perf - a.perf);
    const pos = field.findIndex((x) => x.id === myId()) + 1;
    const result = placementLabel(pos, field.length);
    const delta = rankingDelta(event.level, seed, result, field.length);
    setPoints(myId(), (world.points[myId()] || 0) + delta);
    world.v4.regularResults[event.key] = { result, delta, seed, reason };
    world.resolvedEventKeys[event.key] = true;
    event.status = 'team-simulated';
    logic.log(`${event.name}：你${reason}，战队${result} · 排名积分 ${delta >= 0 ? '+' : ''}${delta}`, delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'normal');
  }

  function cleanRankingLogsSince(index) {
    if (!Array.isArray(state.logs)) return;
    const before = state.logs.slice(0, index);
    const after = state.logs.slice(index).filter((row) => {
      const msg = String(row?.msg || '');
      return !msg.includes('世界排名积分') && !msg.startsWith('排名积分 ') && !msg.startsWith('赛事排名积分 ');
    });
    state.logs = before.concat(after);
  }

  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    const event = world.currentEvent?.v4 ? { ...world.currentEvent, participantIds: [...world.currentEvent.participantIds] } : null;
    if (!event) return previousFinalize(slot, mods);
    const rankingRows = rows();
    const participants = event.participantIds.map((id) => rankingRows.find((r) => r.id === id)).filter(Boolean);
    const seed = participants.findIndex((r) => r.id === myId()) + 1;
    const beforePoints = world.points[myId()] || 0;
    const historyBefore = state.history?.length || 0;
    const logsBefore = state.logs?.length || 0;
    const out = previousFinalize(slot, mods);
    if ((state.history?.length || 0) > historyBefore) {
      const history = state.history[state.history.length - 1];
      const delta = rankingDelta(event.level, seed, history?.result, participants.length);
      setPoints(myId(), beforePoints + delta);
      world.v4.regularResults[event.key] = { result: history?.result || '-', delta, seed };
      world.resolvedEventKeys[event.key] = true;
      if (world.currentEvent?.key === event.key) {
        world.currentEvent.status = 'completed';
        world.currentEvent.result = history?.result || '-';
      }
      cleanRankingLogsSince(logsBefore);
      logic.log(`赛事排名积分 ${delta >= 0 ? '+' : ''}${delta}（${event.level}级 · 赛前赛事种子 #${seed} · ${history?.result || '-'}）`, delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'normal');
    }
    return out;
  };

  function majorKey(year = state.date.year, month = state.date.month) { return `${year}-${month === 6 ? 'spring' : 'winter'}`; }
  function lockMajor(year, half) {
    const key = `${year}-${half}`;
    if (world.v4.majorSeeds[key]) return world.v4.majorSeeds[key];
    const snapshot = rows();
    const qualified = snapshot.slice(0, 16).map((r) => r.id);
    world.v4.majorSeeds[key] = { qualified, snapshot: snapshot.map((r) => ({ id: r.id, rank: r.rank, points: r.points })) };
    return world.v4.majorSeeds[key];
  }
  function currentMajorSeed() {
    const half = state.date.month === 6 ? 'spring' : 'winter';
    return lockMajor(state.date.year, half);
  }
  function majorEligible() {
    if (![6, 12].includes(state.date.month)) return false;
    return currentMajorSeed().qualified.includes(myId());
  }

  function majorWinChance(oppId, prep, active) {
    const myTeam = teamById(myId());
    const opp = teamById(oppId);
    let diff = (myTeam?.prestige || 65) - (opp?.prestige || 65);
    diff += (teamSystem.getUserOvr() - 72) * (active ? 0.22 : 0.05);
    diff += prep * 0.45;
    if (!active) diff -= 3;
    return clamp(0.5 + diff / 70, 0.18, 0.82);
  }

  function playMajorV4() {
    if (![6, 12].includes(state.date.month)) return;
    const key = majorKey();
    if (world.v4.majorResults[key]) return;
    const seedData = currentMajorSeed();
    const snapshot = seedData.snapshot;
    const mySeed = snapshot.find((r) => r.id === myId())?.rank || 99;
    const label = state.date.month === 6 ? `Spring Major ${state.date.year}` : `Winter Major ${state.date.year}`;
    if (!seedData.qualified.includes(myId())) {
      world.v4.majorResults[key] = { result: '未获资格', delta: 0, seed: mySeed };
      state.history.push({ name: label, level: 'Major', points: 0, k: 0, money: 0, result: '未获资格', year: state.date.year });
      ui.showModal(label, `<h2 style="text-align:center;color:#dc2626">未获资格</h2><p>Major 排名截止时位列 <strong>#${mySeed}</strong>，前16获得资格。</p>`, [{ text: '继续', class: 'btn-primary', cb: () => ui.closeModal() }]);
      return;
    }

    const role = teamSystem.getRole();
    const active = role === 'core' || role === 'starter' || (role === 'rotation' && Math.random() < 0.72);
    const slot = state.slots?.[0];
    const prep = clamp(Math.round(slot?.eventPrep || 0), 0, 20);
    const pool = seedData.qualified.filter((id) => id !== myId());
    const lines = [];
    let wins = 0, losses = 0;
    const used = [];
    while (wins < 3 && losses < 3) {
      const available = pool.filter((id) => !used.includes(id));
      const opp = sample(available.length ? available : pool);
      used.push(opp);
      const win = Math.random() < majorWinChance(opp, prep, active);
      if (win) wins++; else losses++;
      lines.push(`Swiss vs ${teamById(opp)?.name || 'Opponent'}：${win ? '胜' : '负'}（${wins}-${losses}）`);
    }

    let result = '';
    if (losses === 3) result = '小组未出线';
    if (!result) {
      const rounds = [['Quarterfinal', '八强'], ['Semifinal', '四强'], ['Final', '亚军']];
      for (const [round, loseResult] of rounds) {
        const opp = sample(pool);
        const win = Math.random() < majorWinChance(opp, prep, active);
        lines.push(`${round} vs ${teamById(opp)?.name || 'Opponent'}：${win ? '胜' : '负'}`);
        if (!win) { result = loseResult; break; }
      }
      if (!result) result = '冠军';
    }

    const delta = rankingDelta('Major', mySeed, result, 16);
    setPoints(myId(), (world.points[myId()] || 0) + delta);
    const reward = {
      '小组未出线': [0, 0], '八强': [3, 8], '四强': [5, 16], '亚军': [7, 28], '冠军': [10, 50],
    }[result] || [0, 0];
    const personalPts = active ? reward[0] : 0;
    const money = active ? reward[1] : Math.floor(reward[1] * 0.3);
    const kills = active ? Math.max(20, Math.round((wins + 3) * (teamSystem.getUserOvr() * 0.7 + Math.random() * 20))) : 0;
    if (personalPts) state.flags.totalScore = (state.flags.totalScore || 0) + personalPts;
    if (money) { logic.modStat('money', money, 'Major 奖金'); state.flags.totalMoney = (state.flags.totalMoney || 0) + money; }
    state.flags.careerKills = (state.flags.careerKills || 0) + kills;
    if (result === '冠军') state.flags.majorWins = (state.flags.majorWins || 0) + 1;
    const historyResult = active ? result : `替补 · ${result}`;
    state.history.push({ name: label, level: 'Major', points: personalPts, k: kills, money, result: historyResult, year: state.date.year });
    world.v4.majorResults[key] = { result, delta, seed: mySeed, active };
    logic.log(`Major 排名积分 ${delta >= 0 ? '+' : ''}${delta}（赛前种子 #${mySeed} · ${result}）`, delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'normal');
    ui.showModal(label, `
      <div style="font-size:.82rem;color:#64748b;margin-bottom:10px">16队 Swiss → 8队淘汰赛 · 种子 #${mySeed} · ${active ? '参赛阵容' : '替补名单'} · 准备度 ${prep}/20</div>
      <div style="display:grid;gap:5px;max-height:230px;overflow:auto;font-size:.82rem">${lines.map((x) => `<div>${x}</div>`).join('')}</div>
      <h2 style="text-align:center;margin:16px 0;color:var(--primary)">${historyResult}</h2>
      <div>排名积分 ${delta >= 0 ? '+' : ''}${delta} · 个人积分 +${personalPts} · 奖金 +${money}</div>
    `, [{ text: '结束 Major', class: 'btn-primary', cb: () => { ui.closeModal(); ui.render(); } }]);
  }

  function simulateAiMajorIfNeeded(year, half) {
    const key = `${year}-${half}`;
    const seedData = world.v4.majorSeeds[key];
    if (!seedData || world.v4[`aiMajor-${key}`]) return;
    const table = seedData.qualified.map((id) => ({ id, perf: performance(id) })).sort((a, b) => b.perf - a.perf);
    table.forEach((entry, index) => {
      if (entry.id === myId() && world.v4.majorResults[key]) return;
      const seed = seedData.snapshot.find((r) => r.id === entry.id)?.rank || 16;
      const result = index === 0 ? '冠军' : index === 1 ? '亚军' : index < 4 ? '四强' : index < 8 ? '八强' : '小组未出线';
      const delta = rankingDelta('Major', seed, result, 16);
      setPoints(entry.id, (world.points[entry.id] || 0) + delta);
    });
    world.v4[`aiMajor-${key}`] = true;
  }

  function settleMonthV4() {
    const rankingRows = rows();
    const events = monthEvents(state.date.month, rankingRows);
    const currentKey = world.currentEvent?.v4 ? world.currentEvent.key : null;
    events.forEach((event) => simulateRegularField(event, event.key === currentKey && !!world.v4.regularResults[event.key]));
    if (world.currentEvent?.v4 && !world.v4.regularResults[world.currentEvent.key]) {
      simulateMyTeamWithoutPlayer(world.currentEvent, world.currentEvent.selected ? '未完成赛事' : '未进入首发');
    }
    if (state.date.month === 5) lockMajor(state.date.year, 'spring');
    if (state.date.month === 11) lockMajor(state.date.year, 'winter');
    if (state.date.month === 6) simulateAiMajorIfNeeded(state.date.year, 'spring');
    if (state.date.month === 12) simulateAiMajorIfNeeded(state.date.year, 'winter');
  }

  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    settleMonthV4();
    const saved = world.currentEvent;
    world.currentEvent = { id: 'v4-suppressed', key: `v4-suppressed-${monthKey()}`, type: 'break', level: '-', status: 'calendar' };
    const out = previousNextMonth();
    setupCurrentMonth();
    return out;
  };

  game.nextMonth = () => {
    const event = world.currentEvent;
    if (event?.v4 && event.status === 'planning' && event.selected) {
      ui.showModal('本月正式赛事尚未完成', `${teamSystem.getTeam()?.name || '当前战队'} 本月参加 <strong>${event.level}级 ${event.name}</strong>。`, [
        { text: '进入赛事', class: 'btn-primary', cb: () => { ui.closeModal(); tournamentWorld.playCurrentEvent(); } },
        { text: '由战队完成', class: 'btn-outline', cb: () => { simulateMyTeamWithoutPlayer(event, '主动轮休'); ui.closeModal(); ui.render(); } },
      ]);
      return;
    }
    if ([6, 12].includes(state.date.month)) {
      const key = majorKey();
      if (!world.v4.majorResults[key] && majorEligible()) {
        ui.showModal('Major 尚未完成', `本月还有 <strong>${state.date.month === 6 ? 'Spring Major' : 'Winter Major'}</strong>。普通赛事与 Major 是两项独立赛事。`, [
          { text: '进入 Major', class: 'btn-warning', cb: () => { ui.closeModal(); setTimeout(playMajorV4, 60); } },
        ]);
        return;
      }
      if (!world.v4.majorResults[key] && !majorEligible()) {
        world.v4.majorResults[key] = { result: '未获资格', delta: 0, seed: myRank() };
      }
    }
    logic.nextMonth();
  };

  const previousPlay = tournamentWorld.playCurrentEvent.bind(tournamentWorld);
  tournamentWorld.playCurrentEvent = () => {
    const event = world.currentEvent;
    if (!event?.v4) return previousPlay();
    if (!event.selected || event.status !== 'planning') return;
    const slot = state.slots[0];
    const prep = clamp(Math.round(slot?.eventPrep || 0), 0, 20);
    slot.scores = { tac: prep, trn: prep, real: prep };
    return previousPlay();
  };

  function openWorldHubV4() {
    const rankingRows = rows();
    const me = rankingRows.find((r) => r.id === myId());
    const rankingHtml = rankingRows.map((r) => `<div style="display:grid;grid-template-columns:36px 1fr 70px;gap:8px;padding:6px 8px;border-bottom:1px solid #f1f5f9;${r.id === myId() ? 'background:#eff6ff;font-weight:700;' : ''}"><span>#${r.rank}</span><span>${r.name}</span><span style="text-align:right">${r.points}</span></div>`).join('');
    const events = monthEvents().map((e) => `<div style="padding:8px;border-bottom:1px solid #f1f5f9;${e.participantIds.includes(myId()) ? 'background:#eff6ff;font-weight:700;' : ''}"><strong>[${e.level}] ${e.name}</strong><div style="font-size:.76rem;color:#64748b">排名 #${e.minRank}–#${e.maxRank} · 8队赛事</div></div>`).join('');
    const major = [6, 12].includes(state.date.month)
      ? `<div style="margin-top:10px;padding:9px;border:1px solid #f59e0b;border-radius:8px;background:#fffbeb"><strong>Major 月</strong><div style="font-size:.78rem;color:#92400e">额外举行16队 Major：Swiss 3胜晋级/3负淘汰 → 8队淘汰赛。</div></div>`
      : '';
    ui.showModal('CS 世界赛事中心', `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">
        <div class="team-summary-card"><div class="team-summary-value">#${me?.rank || '-'}</div><div class="team-summary-label">模拟世界排名</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${bandForRank(me?.rank || 32)}</div><div class="team-summary-label">本月赛事档位</div></div>
      </div>
      <div style="font-weight:800;margin-bottom:8px">${state.date.month}月 · 同期四项赛事</div>
      <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${events}</div>${major}
      <div style="font-weight:800;margin:14px 0 8px">世界排名</div>
      <div style="max-height:250px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px">${rankingHtml}</div>
      <div style="font-size:.75rem;color:#64748b;margin-top:10px">每月 S/A/B/C 各一场。排名变化后，下个月会自动升降到新的赛事档位。6月和12月额外举行 Major，不替代普通赛事。</div>
    `, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  }

  tournamentWorld.openWorldHub = openWorldHubV4;
  tournamentWorld.playMajor = playMajorV4;
  tournamentWorld.getMonthlyEvents = monthEvents;
  tournamentWorld.getCalendarEvent = () => world.currentEvent;

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    if (state.started && world.initialized && (!world.currentEvent?.v4 || !String(world.currentEvent.key || '').startsWith(`${state.date.year}-${state.date.month}-`))) setupCurrentMonth();
    return previousRender();
  };

  setupCurrentMonth();
  world.v4.initialized = true;
  console.info('[event-system-v4] Monthly S/A/B/C circuit and 16-team Major loaded.');
})();
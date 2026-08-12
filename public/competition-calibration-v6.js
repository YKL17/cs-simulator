(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.tournamentWorld) {
    console.warn('[competition-calibration-v6] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const teamState = state.teamSystem;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rows = () => tournamentWorld.getRankings().slice(0, 32);
  const teams = () => teamSystem.getTeams().slice(0, 32);
  const teamById = (id) => teams().find((t) => t.id === id) || null;
  const myId = () => teamState.currentTeamId;
  const primarySlot = () => state.slots?.[0] || null;
  const avgRelation = () => typeof teamSystem.averageRelation === 'function' ? teamSystem.averageRelation() : 50;
  const gaussianish = () => ((Math.random() + Math.random() + Math.random()) - 1.5) * 2;

  function playerImpact({ major = false, prep = 0, active = true } = {}) {
    if (!active) return 0;
    const ovr = teamSystem.getUserOvr();
    const relation = avgRelation();
    if (major) {
      return clamp((ovr - 70) * 0.28, -4, 8.5)
        + clamp(prep, 0, 20) * 0.25
        + clamp((relation - 50) * 0.06, -2, 3);
    }
    return clamp((ovr - 70) * 0.42, -5, 12.2)
      + clamp(prep, 0, 20) * 0.40
      + clamp((relation - 50) * 0.10, -3, 4);
  }

  function calibratedChance(aId, bId, { major = false, prep = 0, active = true, edge = 0 } = {}) {
    const a = teamById(aId);
    const b = teamById(bId);
    let diff = (a?.prestige || 65) - (b?.prestige || 65);
    if (aId === myId()) diff += playerImpact({ major, prep, active });
    if (bId === myId()) diff -= playerImpact({ major, prep, active });
    diff += gaussianish() * (major ? 3.2 : 2.7);
    const divisor = major ? 105 : 72;
    const raw = 0.5 + diff / divisor + edge;
    return clamp(raw, major ? 0.27 : 0.18, major ? 0.80 : 0.88);
  }

  function playOne(aId, bId, options = {}) {
    const chance = calibratedChance(aId, bId, options);
    return { win: Math.random() < chance, chance };
  }

  function resultBucket(result) {
    const text = String(result || '');
    if (text.includes('冠军')) return 'champion';
    if (text.includes('亚军') || text.includes('决赛')) return 'runner';
    if (text.includes('四强') || text.includes('半决赛')) return 'top4';
    if (text.includes('八强')) return 'top8';
    return 'group';
  }

  function regularRankingDelta(level, seed, result) {
    const w = { C: 8, B: 14, A: 20, S: 28 }[level] || 10;
    const type = resultBucket(result);
    if (type === 'champion') return Math.max(4, Math.round(w * 0.55)) + (seed > 1 ? Math.max(0, Math.round(w * clamp((seed - 1) / 7, 0.15, 0.8))) : 0);
    if (type === 'runner') return Math.max(2, Math.round(w * 0.30)) + (seed > 2 ? Math.max(0, Math.round(w * clamp((seed - 2) / 6, 0.12, 0.6))) : 0);
    if (type === 'top4') return seed <= 4 ? 0 : Math.max(2, Math.round(w * clamp((seed - 4) / 4, 0.15, 0.55)));
    if (type === 'top8') return seed >= 5 ? 0 : -Math.max(2, Math.round(w * clamp((5 - seed) / 4, 0.18, 0.65)));
    return -Math.max(3, Math.round(w * (seed <= 4 ? 1 : 0.65)));
  }

  function runS(event, mods = { self: 0, team: 0, opp: 0 }) {
    const prep = clamp(Math.round(primarySlot()?.eventPrep || 0), 0, 20);
    const edge = clamp(((mods.self || 0) + (mods.team || 0) - (mods.opp || 0)) * 0.004, -0.04, 0.04);
    const opponents = event.participantIds.filter((id) => id !== myId());
    const used = [];
    const lines = [];
    let result = '冠军';
    for (const [round, loseResult] of [['Quarterfinal', '八强'], ['Semifinal', '四强'], ['Final', '亚军']]) {
      const available = opponents.filter((id) => !used.includes(id));
      const opp = sample(available.length ? available : opponents);
      used.push(opp);
      const played = playOne(myId(), opp, { prep, active: true, major: false, edge });
      lines.push(`${round} vs ${teamById(opp)?.name || 'Opponent'}：${played.win ? '胜' : '负'}（胜率 ${(played.chance * 100).toFixed(0)}%）`);
      if (!played.win) { result = loseResult; break; }
    }
    return { result, lines, prep };
  }

  // Recalibrate only S-level player events. A/B/C retain the v5 system.
  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    const event = world.currentEvent?.v5 && world.currentEvent.type === 'ranked' && world.currentEvent.level === 'S'
      ? { ...world.currentEvent, participantIds: [...world.currentEvent.participantIds] }
      : null;
    if (!event) return previousFinalize(slot, mods);

    const historyBefore = state.history?.length || 0;
    const logsBefore = state.logs?.length || 0;
    const beforePoints = world.points[myId()] || 0;
    const realShowModal = ui.showModal;
    let captured = null;
    ui.showModal = (title, html, buttons = []) => { captured = { title, html, buttons }; };
    let out;
    try { out = previousFinalize(slot, mods); } finally { ui.showModal = realShowModal; }

    if ((state.history?.length || 0) <= historyBefore) {
      if (captured) realShowModal(captured.title, captured.html, captured.buttons);
      return out;
    }

    const history = state.history[state.history.length - 1];
    const oldResult = String(history.result || '');
    const oldChampion = oldResult.includes('冠军');
    const oldPts = Number(history.points || 0);
    const oldMoney = Number(history.money || 0);
    const seed = event.participantIds.findIndex((id) => id === myId()) + 1;
    const run = runS(event, mods);
    const newChampion = run.result.includes('冠军');
    const rewardMap = { '八强': [4, 6], '四强': [6, 9], '亚军': [8, 15], '冠军': [10, 30] };
    const [targetPts, targetMoney] = rewardMap[run.result] || [0, 0];

    history.result = run.result;
    history.points = targetPts;
    history.money = targetMoney;
    state.flags.totalScore = Math.max(0, (state.flags.totalScore || 0) + targetPts - oldPts);
    state.flags.totalMoney = Math.max(0, (state.flags.totalMoney || 0) + targetMoney - oldMoney);
    state.stats.money = Math.max(0, (state.stats.money || 0) + targetMoney - oldMoney);
    if (oldChampion !== newChampion) state.flags.sWins = Math.max(0, (state.flags.sWins || 0) + (newChampion ? 1 : -1));

    const delta = regularRankingDelta('S', seed, run.result);
    world.points[myId()] = Math.max(300, Math.round(beforePoints + delta));
    world.v4.regularResults[event.key] = { result: run.result, delta, seed, calibratedV6: true };
    world.resolvedEventKeys[event.key] = true;
    if (world.currentEvent?.key === event.key) {
      world.currentEvent.status = 'completed';
      world.currentEvent.result = run.result;
    }

    if (Array.isArray(state.logs)) {
      const before = state.logs.slice(0, logsBefore);
      const after = state.logs.slice(logsBefore).filter((row) => {
        const msg = String(row?.msg || '');
        return !msg.includes('世界排名积分') && !msg.startsWith('排名积分 ') && !msg.startsWith('赛事排名积分 ');
      });
      state.logs = before.concat(after);
    }
    logic.log(`赛事排名积分 ${delta >= 0 ? '+' : ''}${delta}（S级 · 赛前赛事种子 #${seed} · ${run.result}）`, delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'normal');
    const detail = run.lines.map((line) => `<div style="padding:5px 0;border-bottom:1px solid #f1f5f9">${line}</div>`).join('');
    realShowModal(event.name, `<div style="font-size:.82rem;color:#64748b;margin-bottom:9px">S级8队淘汰赛 · 准备 ${run.prep}/20 · 顶级状态仍保留爆冷空间</div><div style="font-size:.84rem">${detail}</div><h2 style="text-align:center;margin:16px 0;color:var(--primary)">${run.result}</h2>`, [{ text: '继续', class: 'btn-primary', cb: () => { ui.closeModal(); ui.render(); } }]);
    return out;
  };

  function majorKey() { return `${state.date.year}-${state.date.month === 6 ? 'spring' : 'winter'}`; }
  function majorSeedData() {
    const key = majorKey();
    if (world.v4.majorSeeds?.[key]) return world.v4.majorSeeds[key];
    const snapshot = rows();
    const data = { qualified: snapshot.slice(0, 16).map((r) => r.id), snapshot: snapshot.map((r) => ({ id: r.id, rank: r.rank, points: r.points })) };
    world.v4.majorSeeds[key] = data;
    return data;
  }
  function majorResultDelta(seed, result) {
    if (result === '冠军') return Math.max(22, regularRankingDelta('S', Math.min(seed, 8), '冠军'));
    if (result === '亚军') return Math.max(12, regularRankingDelta('S', Math.min(seed, 8), '亚军'));
    if (result === '四强') return seed <= 4 ? 0 : Math.max(0, Math.round((seed - 4) * 1.4));
    if (result === '八强') { if (seed <= 4) return -12; if (seed <= 8) return 0; return 8; }
    return -Math.max(8, Math.round(22 - Math.min(seed, 16) * 0.7));
  }

  const DECISIONS = [
    { title: '对手连续慢攻拖时间', text: '关键局开始前，教练问你希望怎样应对。', options: [['主动前压拿信息', 0.04], ['保持默认站位', 0.02], ['三人提前赌点', -0.03]] },
    { title: '对手经济局可能强起', text: '对手经济很差，但他们很可能强起制造混乱。', options: [['纪律执行，不追击', 0.03], ['主动找人扩大优势', -0.03], ['提前夹击重点区域', 0.02]] },
    { title: '对手连续拿到首杀', text: '你们的默认开局连续吃亏，需要临场调整。', options: [['改成双人协同拿图', 0.04], ['继续单人对枪', -0.04], ['提速避开强点', 0.02]] },
    { title: '关键局暂停', text: '双方已经互相读透，需要决定下一轮的节奏。', options: [['突然提速', 0.03], ['继续标准默认', 0.02], ['极端慢打到最后十秒', -0.02]] },
  ];

  function decisionModal(stage, oppId, callback) {
    const d = sample(DECISIONS);
    ui.showModal(`${stage} · 临场决策`, `<div style="font-weight:800;margin-bottom:6px">vs ${teamById(oppId)?.name || 'Opponent'}</div><p>${d.title}</p><p style="font-size:.82rem;color:#64748b;margin-top:6px">${d.text} 你的选择只会改变本场约2%–4%的胜率，不会直接决定结果。</p>`, d.options.map(([text, edge]) => ({
      text,
      class: edge >= 0.03 ? 'btn-primary' : 'btn-outline',
      cb: () => { ui.closeModal(); callback(edge); },
    })));
  }

  function startInteractiveMajor() {
    if (![6, 12].includes(state.date.month)) return;
    const key = majorKey();
    if (world.v4.majorResults?.[key]) return;
    const seedData = majorSeedData();
    const mySeed = seedData.snapshot.find((r) => r.id === myId())?.rank || 99;
    const label = state.date.month === 6 ? `Spring Major ${state.date.year}` : `Winter Major ${state.date.year}`;
    if (!seedData.qualified.includes(myId())) {
      world.v4.majorResults[key] = { result: '未获资格', delta: 0, seed: mySeed, calibratedV6: true };
      state.history.push({ name: label, level: 'Major', points: 0, k: 0, money: 0, result: '未获资格', year: state.date.year });
      ui.showModal(label, `<h2 style="text-align:center;color:#dc2626">未获资格</h2><p>排名锁定时位列 <strong>#${mySeed}</strong>，前16进入 Major。</p>`, [{ text: '继续', class: 'btn-primary', cb: () => ui.closeModal() }]);
      return;
    }

    const role = teamSystem.getRole();
    const active = role === 'core' || role === 'starter' || (role === 'rotation' && Math.random() < 0.70);
    const prep = clamp(Math.round(primarySlot()?.eventPrep || 0), 0, 20);
    const pool = seedData.qualified.filter((id) => id !== myId());
    const ctx = { key, label, mySeed, active, prep, pool, used: [], wins: 0, losses: 0, lines: [], result: '' };

    const pickOpp = () => {
      const available = ctx.pool.filter((id) => !ctx.used.includes(id));
      if (!available.length) ctx.used = [];
      const list = ctx.pool.filter((id) => !ctx.used.includes(id));
      const opp = sample(list.length ? list : ctx.pool);
      ctx.used.push(opp);
      return opp;
    };

    const playSwiss = () => {
      if (ctx.wins >= 3 || ctx.losses >= 3) {
        if (ctx.losses >= 3) { ctx.result = '小组未出线'; finishMajor(); }
        else playKnockout(0);
        return;
      }
      const opp = pickOpp();
      const keyMatch = ctx.wins === 2 || ctx.losses === 2;
      const resolve = (edge = 0) => {
        const played = playOne(myId(), opp, { prep: ctx.prep, active: ctx.active, major: true, edge });
        if (played.win) ctx.wins++; else ctx.losses++;
        ctx.lines.push(`Swiss vs ${teamById(opp)?.name || 'Opponent'}：${played.win ? '胜' : '负'}（${ctx.wins}-${ctx.losses}，胜率 ${(played.chance * 100).toFixed(0)}%${edge ? `，决策 ${edge > 0 ? '+' : ''}${Math.round(edge * 100)}%` : ''}）`);
        setTimeout(playSwiss, 50);
      };
      if (keyMatch) decisionModal(`Swiss关键场 ${ctx.wins}-${ctx.losses}`, opp, resolve); else resolve(0);
    };

    const rounds = [['Quarterfinal', '八强'], ['Semifinal', '四强'], ['Final', '亚军']];
    const playKnockout = (index) => {
      if (index >= rounds.length) { ctx.result = '冠军'; finishMajor(); return; }
      const [round, loseResult] = rounds[index];
      const opp = sample(ctx.pool);
      decisionModal(round, opp, (edge) => {
        const played = playOne(myId(), opp, { prep: ctx.prep, active: ctx.active, major: true, edge });
        ctx.lines.push(`${round} vs ${teamById(opp)?.name || 'Opponent'}：${played.win ? '胜' : '负'}（胜率 ${(played.chance * 100).toFixed(0)}%，决策 ${edge > 0 ? '+' : ''}${Math.round(edge * 100)}%）`);
        if (!played.win) { ctx.result = loseResult; finishMajor(); return; }
        setTimeout(() => playKnockout(index + 1), 60);
      });
    };

    const finishMajor = () => {
      const delta = majorResultDelta(ctx.mySeed, ctx.result);
      world.points[myId()] = Math.max(300, Math.round((world.points[myId()] || 0) + delta));
      const reward = { '小组未出线': [0, 1, 20], '八强': [4, 8, 65], '四强': [6, 18, 95], '亚军': [8, 35, 130], '冠军': [10, 70, 180] }[ctx.result];
      const [careerPts, money, killsBase] = reward;
      const kills = ctx.active ? Math.round(killsBase * (0.75 + Math.random() * 0.5)) : 0;
      const personalPts = ctx.active ? careerPts : 0;
      const personalMoney = ctx.active ? money : Math.floor(money * 0.3);
      if (personalPts) state.flags.totalScore = (state.flags.totalScore || 0) + personalPts;
      if (personalMoney) { state.stats.money = (state.stats.money || 0) + personalMoney; state.flags.totalMoney = (state.flags.totalMoney || 0) + personalMoney; }
      state.flags.careerKills = (state.flags.careerKills || 0) + kills;
      if (ctx.result === '冠军') state.flags.majorWins = (state.flags.majorWins || 0) + 1;
      world.v4.majorResults[ctx.key] = { result: ctx.result, delta, seed: ctx.mySeed, active: ctx.active, prep: ctx.prep, calibratedV6: true };
      state.history.push({ name: ctx.label, level: 'Major', points: personalPts, k: kills, money: personalMoney, result: ctx.active ? ctx.result : `替补 · ${ctx.result}`, year: state.date.year });
      logic.log(`Major 排名积分 ${delta >= 0 ? '+' : ''}${delta}（种子 #${ctx.mySeed} · ${ctx.result}）`, delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'normal');
      const detail = ctx.lines.map((line) => `<div style="padding:5px 0;border-bottom:1px solid #f1f5f9">${line}</div>`).join('');
      ui.showModal(ctx.label, `<div style="background:#f8fafc;padding:9px;border-radius:8px;margin-bottom:9px"><strong>种子：</strong>#${ctx.mySeed} · <strong>身份：</strong>${ctx.active ? '参赛阵容' : '替补'} · <strong>准备：</strong>${ctx.prep}/20</div><div style="font-size:.82rem;max-height:280px;overflow:auto">${detail}</div><h2 style="text-align:center;margin:16px 0;color:var(--primary)">${ctx.active ? ctx.result : `替补 · ${ctx.result}`}</h2><div style="font-size:.8rem;color:#64748b">Major 采用独立逐场概率。Swiss关键场和每轮淘汰赛都有临场选择，影响仅 ±2%–4%。</div>`, [{ text: '结束 Major', class: 'btn-primary', cb: () => { ui.closeModal(); ui.render(); } }]);
    };

    playSwiss();
  }

  tournamentWorld.playMajor = startInteractiveMajor;

  const previousGameNextMonth = game.nextMonth.bind(game);
  game.nextMonth = () => {
    const event = world.currentEvent;
    if (event?.v5 && event.type === 'ranked' && event.selected && event.status === 'planning') return previousGameNextMonth();
    if ([6, 12].includes(state.date.month)) {
      const seedData = majorSeedData();
      const eligible = seedData.qualified.includes(myId());
      const pending = eligible && !world.v4.majorResults?.[majorKey()];
      if (pending) {
        ui.showModal('Major 尚未完成', `本月还有 <strong>${state.date.month === 6 ? 'Spring Major' : 'Winter Major'}</strong>。`, [{ text: '进入 Major', class: 'btn-warning', cb: () => { ui.closeModal(); setTimeout(startInteractiveMajor, 60); } }]);
        return;
      }
    }
    return previousGameNextMonth();
  };

  window.competitionCalibrationV6 = { calibratedChance, startInteractiveMajor };
  console.info('[competition-calibration-v6] S odds recalibrated; Major key-match decisions enabled.');
})();
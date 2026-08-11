(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.tournamentWorld) {
    console.warn('[career-balance-v3] Required systems are not ready.');
    return;
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const world = state.tournamentWorld;
  const teamState = state.teamSystem;
  const MAX_SKILL = 30;

  // ---------------------------------------------------------------------------
  // 1) TRAINING: every focused training action gives +1 permanent skill.
  // ---------------------------------------------------------------------------
  function finishAction(key) {
    state.flags.usedMonthlyActions = state.flags.usedMonthlyActions || [];
    state.flags.usedMonthlyActions.push(key);
    ui.render();
  }

  game.actionDemo = () => {
    logic.modStat('san', -3, '枪法训练');
    logic.modStat('aim', 1, '专项枪法训练');
    teamState.selectionMomentum = clamp((teamState.selectionMomentum || 0) + 0.4, 0, 8);
    finishAction('aim-training');
  };

  game.actionWork = () => {
    logic.modStat('san', -2, '战术训练');
    logic.modStat('tactics', 1, '专项战术训练');
    teamState.selectionMomentum = clamp((teamState.selectionMomentum || 0) + 0.2, 0, 8);
    finishAction('tactics-training');
  };

  game.actionTactics = () => {
    logic.modStat('san', -2, '团队训练');
    logic.modStat('coach', 1, '团队训练表现');
    teamState.selectionMomentum = clamp((teamState.selectionMomentum || 0) + 0.8, 0, 8);
    if (teamState.roster?.length) {
      const mate = sample(teamState.roster);
      mate.relation = clamp((mate.relation || 50) + 2, 0, 100);
    }
    finishAction('team-training');
  };

  function rewriteActionLabels() {
    const labels = {
      'btn-demo': ['fa-crosshairs', '枪法训练', 'SAN-3 | 枪法永久+1'],
      'btn-work': ['fa-brain', '战术训练', 'SAN-2 | 战术永久+1'],
      'btn-tactics': ['fa-people-group', '团队训练', 'SAN-2 | 教练永久+1'],
    };
    Object.entries(labels).forEach(([id, [icon, title, desc]]) => {
      const button = document.getElementById(id);
      if (!button) return;
      button.innerHTML = `<i class="fa-solid ${icon}"></i> ${title}<span style="font-size:.75rem;color:#6b7280">${desc}</span>`;
    });
  }

  // ---------------------------------------------------------------------------
  // 2) 32-TEAM WORLD + TIERED EVENTS.
  // Low-tier events explicitly exclude elite teams.
  // ---------------------------------------------------------------------------
  const EVENT_SPECS = {
    1: { id: 'challenger-winter', name: 'Winter Challenger Cup', level: 'C', minRank: 17, maxRank: 32, desc: '世界第17–32名参加的挑战者赛事，顶级强队不参赛。' },
    2: { id: 'regional-masters-v3', name: 'Regional Masters', level: 'B', minRank: 9, maxRank: 24, desc: '世界第9–24名参加的区域大师赛。' },
    3: { id: 'challenger-spring', name: 'Spring Challenger Cup', level: 'C', minRank: 17, maxRank: 32, desc: '第二站挑战者赛事，为后半区战队提供稳定积分机会。' },
    4: { id: 'international-open-v3', name: 'International Open', level: 'A', minRank: 5, maxRank: 20, desc: '世界第5–20名参加的国际赛事。' },
    8: { id: 'challenger-summer', name: 'Summer Challenger Cup', level: 'C', minRank: 17, maxRank: 32, desc: '下半赛季挑战者赛事，世界前16不参加。' },
    9: { id: 'continental-masters-v3', name: 'Continental Masters', level: 'B', minRank: 9, maxRank: 24, desc: '世界第9–24名参加的中级赛事。' },
    10: { id: 'global-clash-v3', name: 'Global Clash', level: 'A', minRank: 5, maxRank: 20, desc: '世界第5–20名参加的高级赛事。' },
  };

  const LEVEL_WEIGHT = { C: 8, B: 14, A: 20, S: 28, Major: 40 };

  function rows() { return tournamentWorld.getRankings().slice(0, 32); }
  function participantsFor(spec, rankingRows = rows()) {
    return rankingRows.slice(spec.minRank - 1, Math.min(spec.maxRank, rankingRows.length));
  }

  function resultLabel(position, total) {
    if (position === 1) return '冠军';
    if (position === 2) return '亚军';
    if (position <= 4) return '四强';
    if (position <= 8) return '八强';
    return '小组出局';
  }

  function resultBucket(result, total = 16) {
    const text = String(result || '');
    if (text.includes('冠军')) return { min: 1, max: 1, floor: 'champion' };
    if (text.includes('亚军') || text.includes('决赛')) return { min: 2, max: 2, floor: 'runner' };
    if (text.includes('四强') || text.includes('半决赛')) return { min: 3, max: 4, floor: 'top4' };
    if (text.includes('八强')) return { min: 5, max: 8, floor: 'none' };
    if (text.includes('16强') || text.includes('小组') || text.includes('首轮') || text.includes('出局')) return { min: 9, max: total, floor: 'group' };
    return null;
  }

  function rankingDelta(level, seed, result, total = 16) {
    const bucket = resultBucket(result, total);
    if (!bucket || !seed) return 0;
    const weight = LEVEL_WEIGHT[level] || 10;
    const championFloor = Math.max(4, Math.round(weight * 0.55));
    const runnerFloor = Math.max(2, Math.round(weight * 0.30));

    if (bucket.floor === 'group') {
      const highSeedPenalty = Math.max(0, 9 - seed) / 8;
      return -Math.max(3, Math.round(weight * (0.45 + highSeedPenalty * 0.75)));
    }

    let expectation = 0;
    if (seed > bucket.max) {
      const distance = seed - bucket.max;
      expectation = Math.max(2, Math.round(weight * clamp(distance / Math.max(4, total / 3), 0.18, 1)));
    } else if (seed < bucket.min && bucket.floor !== 'top4') {
      const distance = bucket.min - seed;
      expectation = -Math.max(2, Math.round(weight * clamp(distance / Math.max(4, total / 3), 0.18, 1)));
    }

    if (bucket.floor === 'champion') return Math.max(championFloor, championFloor + Math.max(0, expectation));
    if (bucket.floor === 'runner') return Math.max(runnerFloor, runnerFloor + Math.max(0, expectation));
    if (bucket.floor === 'top4') return Math.max(0, expectation);
    return expectation;
  }

  function setupSlot(event) {
    if (!state.slots?.length) state.slots = [{ id: 1, status: 'empty' }];
    const slot = state.slots[0];
    if (event.invited && event.selected && event.status === 'planning') {
      slot.status = 'planning';
      slot.name = event.name;
      slot.level = event.level;
      slot.scores = { tac: 0, trn: 0, real: 0 };
      slot.eventPrep = 0;
      slot.prepEventId = event.id;
      slot.worldEventId = event.id;
      slot.worldEventKey = event.key;
    } else {
      slot.status = 'empty';
      slot.eventPrep = 0;
    }
  }

  function applyDivisionEvent() {
    if (!state.started || !world.initialized) return;
    const spec = EVENT_SPECS[state.date.month];
    if (!spec) return; // Keep Major prep, Major and summer break from tournament-world.js.

    const rankingRows = rows();
    const participants = participantsFor(spec, rankingRows);
    const participantIds = participants.map((r) => r.id);
    const teamId = teamState.currentTeamId;
    const invited = participantIds.includes(teamId);
    const role = teamSystem.getRole();
    const selected = invited && role !== 'reserve' && (role !== 'rotation' || Math.random() < 0.72);
    const key = `${state.date.year}-${state.date.month}`;

    world.currentEvent = {
      ...spec,
      type: 'ranked',
      inviteLimit: spec.maxRank,
      participantIds,
      key,
      invited,
      selected,
      status: world.resolvedEventKeys?.[key] ? 'completed' : 'planning',
      selectionReason: !invited
        ? `当前世界排名不在 #${spec.minRank}–#${spec.maxRank} 的参赛区间。`
        : selected
          ? `${role === 'core' ? '队内核心' : role === 'starter' ? '首发' : '轮换'}，进入赛事名单。`
          : '你目前没有进入本项赛事首发名单。',
    };
    setupSlot(world.currentEvent);
  }

  function simulateDivisionEvent(event, rankingRows) {
    if (!event?.participantIds?.length) return;
    const participantRows = event.participantIds.map((id) => rankingRows.find((r) => r.id === id)).filter(Boolean);
    const userId = teamState.currentTeamId;
    const userResolved = !!world.resolvedEventKeys?.[event.key];

    const table = participantRows.map((r) => {
      const team = teamSystem.getTeams().find((t) => t.id === r.id);
      const strength = (team?.prestige || 65) + (Math.random() * 24 - 12) + (r.id === userId ? (teamSystem.getUserOvr() - 70) * 0.18 : 0);
      return { id: r.id, strength };
    }).sort((a, b) => b.strength - a.strength);

    table.forEach((entry, index) => {
      if (entry.id === userId && userResolved) return;
      const seed = participantRows.findIndex((r) => r.id === entry.id) + 1;
      const result = resultLabel(index + 1, table.length);
      const delta = rankingDelta(event.level, seed, result, table.length);
      world.points[entry.id] = Math.max(300, Math.round((world.points[entry.id] || 0) + delta));
      if (entry.id === userId) {
        world.resolvedEventKeys[event.key] = true;
        event.status = 'team-simulated';
        logic.log(`战队在 ${event.name} 取得${result}，排名积分 ${delta >= 0 ? '+' : ''}${delta}`, delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'normal');
      }
    });

    const winner = teamSystem.getTeams().find((t) => t.id === table[0]?.id);
    if (winner) {
      world.news = world.news || [];
      world.news.unshift({ key: event.key, text: `${winner.name} 赢得 ${event.name}。` });
      world.news = world.news.slice(0, 30);
    }
  }

  // Correct the player's ranking delta after the legacy tournament pipeline resolves the match.
  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    const event = world.currentEvent?.participantIds ? { ...world.currentEvent, participantIds: [...world.currentEvent.participantIds] } : null;
    if (!event) return previousFinalize(slot, mods);

    const rankingRows = rows();
    const participantRows = event.participantIds.map((id) => rankingRows.find((r) => r.id === id)).filter(Boolean);
    const teamId = teamState.currentTeamId;
    const seed = participantRows.findIndex((r) => r.id === teamId) + 1;
    const before = world.points[teamId] || 0;
    const historyBefore = state.history?.length || 0;
    const result = previousFinalize(slot, mods);

    if ((state.history?.length || 0) > historyBefore && seed > 0) {
      const historyRow = state.history[state.history.length - 1];
      const delta = rankingDelta(event.level, seed, historyRow?.result, participantRows.length);
      world.points[teamId] = Math.max(300, Math.round(before + delta));
      world.resolvedEventKeys[event.key] = true;
      if (world.currentEvent) world.currentEvent.status = 'completed';
      logic.log(`赛事排名积分 ${delta >= 0 ? '+' : ''}${delta}（赛前赛事种子 #${seed} · ${historyRow?.result || '-'}）`, delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'normal');
    }
    return result;
  };

  // Suppress the legacy top-only AI field for our tiered events and simulate the correct field ourselves.
  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    const event = world.currentEvent?.participantIds ? { ...world.currentEvent, participantIds: [...world.currentEvent.participantIds] } : null;
    const rankingRows = rows();

    if (event) {
      simulateDivisionEvent(event, rankingRows);
      // tournament-world.js sees a break event and therefore does not run its old top-N simulation.
      if (world.currentEvent) world.currentEvent.type = 'break';
    }

    const result = previousNextMonth();
    applyDivisionEvent();
    rewriteActionLabels();
    return result;
  };

  // Make Next Month respect tiered events without relying on the old top-N invitation function.
  game.nextMonth = () => {
    const event = world.currentEvent;
    if (event?.participantIds && event.invited && event.selected && event.status === 'planning') {
      ui.showModal('本月正式赛事尚未完成', `${teamSystem.getTeam()?.name || '当前战队'} 已进入 <strong>${event.name}</strong>。`, [
        { text: '进入赛事', class: 'btn-primary', cb: () => { ui.closeModal(); tournamentWorld.playCurrentEvent(); } },
        { text: '本月轮休', class: 'btn-outline', cb: () => { event.status = 'rested'; logic.modStat('san', 2, '赛事轮休'); logic.nextMonth(); ui.closeModal(); } },
      ]);
      return;
    }
    logic.nextMonth();
  };

  // Replace world hub with a 32-team / tiered-calendar view.
  tournamentWorld.openWorldHub = () => {
    const rankingRows = rows();
    const me = rankingRows.find((r) => r.id === teamState.currentTeamId);
    const rankingHtml = rankingRows.map((r) => `<div style="display:grid;grid-template-columns:36px 1fr 70px;gap:8px;padding:6px 8px;border-bottom:1px solid #f1f5f9;${r.id === teamState.currentTeamId ? 'background:#eff6ff;font-weight:700;' : ''}"><span>#${r.rank}</span><span>${r.name}</span><span style="text-align:right">${r.points}</span></div>`).join('');
    const calendarHtml = Object.entries(EVENT_SPECS).map(([month, event]) => `<div style="padding:7px 8px;border-bottom:1px solid #f1f5f9;${Number(month) === state.date.month ? 'background:#eff6ff;font-weight:700;' : ''}"><strong>${month}月 [${event.level}] ${event.name}</strong><div style="font-size:.76rem;color:#64748b">参赛区间 #${event.minRank}–#${event.maxRank} · ${event.desc}</div></div>`).join('');
    ui.showModal('CS 世界赛事中心', `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">
        <div class="team-summary-card"><div class="team-summary-value">#${me?.rank || '-'}</div><div class="team-summary-label">模拟世界排名</div></div>
        <div class="team-summary-card"><div class="team-summary-value">32</div><div class="team-summary-label">活跃战队</div></div>
      </div>
      <div style="font-weight:800;margin:8px 0">世界排名</div>
      <div style="max-height:250px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px">${rankingHtml}</div>
      <div style="font-weight:800;margin:14px 0 8px">分级赛事</div>
      <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${calendarHtml}</div>
      <div style="font-size:.75rem;color:#64748b;margin-top:10px">C/B 级赛事限制参赛排名区间，顶级强队不会再进入低级别赛事。5/6月与11/12月继续使用 Major 排名截止与 Major。</div>
    `, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  };

  // ---------------------------------------------------------------------------
  // 3) WEAK-TEAM START inside the 32-team world.
  // The old route expected teams outside top 45; after the cap, use bottom 8.
  // ---------------------------------------------------------------------------
  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => {
    if (title === '选择职业起点' && buttons?.length) {
      const weakButton = buttons[0];
      const originalWeak = weakButton?.cb;
      if (originalWeak && !weakButton.__v3Wrapped) {
        weakButton.__v3Wrapped = true;
        weakButton.cb = () => {
          originalWeak();
          setTimeout(() => {
            const rankingRows = rows();
            const bottomIds = new Set(rankingRows.slice(-8).map((r) => r.id));
            const candidates = teamSystem.getTeams().filter((t) => bottomIds.has(t.id));
            const team = sample(candidates);
            if (!team) return;
            teamState.currentTeamId = team.id;
            teamState.roster = team.roster.map(([name, role, delta]) => ({
              id: `${team.id}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
              name, role, ovr: clamp(team.base + delta, 62, 98), relation: 48 + Math.floor(Math.random() * 10),
            }));
            teamState.startRoute = 'weak-starter';
            teamState.selectionMomentum = 8;
            teamState.initialized = true;
            applyDivisionEvent();
            logic.log(`弱队路线：加入当前世界后 8 名中的 ${team.name}，获得稳定首发机会。`, 'pos');
            ui.render();
          }, 140);
        };
      }
      html = String(html).replace(/从快照约 #45 以后的弱队开始。赛事资源较少，但新秀会得到较高信任，通常直接进入首发。/, '从当前32队世界排名后8名中获得合同。低级别赛事专门面向中下游战队，通常可以直接争取首发。');
    }
    return previousShowModal(title, html, buttons);
  };

  // ---------------------------------------------------------------------------
  // 4) CAREER SHOP. Old item buffs are replaced; one-use cheat stays as an egg.
  // ---------------------------------------------------------------------------
  function planningSlot() {
    return state.slots?.find((slot) => slot.status === 'planning') || null;
  }

  function shopItemCard(icon, name, desc, cost, action, disabled = false, accent = '') {
    return `<div style="border:1px solid #e5e7eb;padding:11px;border-radius:9px;display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px;${accent}">
      <div style="display:flex;gap:10px;align-items:center"><div style="width:38px;height:38px;border-radius:50%;background:#f3f4f6;display:flex;align-items:center;justify-content:center"><i class="fa-solid ${icon}"></i></div><div><div style="font-weight:800">${name}</div><div style="font-size:.78rem;color:#64748b">${desc}</div></div></div>
      <button class="btn btn-primary" ${disabled ? 'disabled' : ''} onclick="careerBalanceV3.buy('${action}')">${cost === 0 ? '彩蛋' : '$' + cost}</button>
    </div>`;
  }

  function openShop() {
    const money = state.stats.money || 0;
    const cheatUsed = !!state.flags.careerCheatUsed;
    const html = `
      <div style="font-size:.8rem;color:#64748b;margin-bottom:10px">金币 ${money} · 商店现在只提供与职业生涯直接相关的服务。</div>
      ${shopItemCard('fa-bottle-water', '运动恢复包', 'SAN +4。用于连续训练或赛事后的恢复。', 1, 'recovery', money < 1)}
      ${shopItemCard('fa-chart-line', '分析师加班', '当前赛事准备度 +5；没有赛事时不能购买。', 2, 'analyst', money < 2 || !planningSlot())}
      ${shopItemCard('fa-dumbbell', '私人教练课', '首发竞争状态 +1.5，不直接增加永久属性。', 2, 'coach', money < 2)}
      ${shopItemCard('fa-utensils', '全队聚餐', 'SAN +2，并让所有队友关系 +5。', 2, 'dinner', money < 2)}
      ${shopItemCard('fa-wand-magic-sparkles', '小金手指', cheatUsed ? '本生涯已经使用过。' : '彩蛋外挂：整个生涯仅一次，可把一个专项属性直接改成任意 0–30 数值。', 0, 'cheat', cheatUsed, 'border-style:dashed;background:#fffbeb;')}
    `;
    ui.showModal('职业商店', html, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  }

  function spend(cost, reason) {
    if ((state.stats.money || 0) < cost) return false;
    if (cost) logic.modStat('money', -cost, reason);
    return true;
  }

  function buy(action) {
    if (action === 'recovery') {
      if (!spend(1, '购买运动恢复包')) return;
      logic.modStat('san', 4, '运动恢复包');
      ui.closeModal(); ui.render(); return;
    }
    if (action === 'analyst') {
      const slot = planningSlot();
      if (!slot || !spend(2, '聘请分析师加班')) return;
      const current = typeof slot.eventPrep === 'number' ? slot.eventPrep : 0;
      slot.eventPrep = clamp(current + 5, 0, 20);
      slot.scores = { tac: slot.eventPrep, trn: slot.eventPrep, real: slot.eventPrep };
      logic.log(`赛事准备度 ${current} → ${slot.eventPrep}（分析师加班）`, 'pos');
      ui.closeModal(); ui.render(); return;
    }
    if (action === 'coach') {
      if (!spend(2, '私人教练课')) return;
      const old = teamState.selectionMomentum || 0;
      teamState.selectionMomentum = clamp(old + 1.5, 0, 8);
      logic.log(`首发竞争 ${old.toFixed(1)} → ${teamState.selectionMomentum.toFixed(1)}（私人教练课）`, 'pos');
      ui.closeModal(); ui.render(); return;
    }
    if (action === 'dinner') {
      if (!spend(2, '全队聚餐')) return;
      logic.modStat('san', 2, '全队聚餐');
      (teamState.roster || []).forEach((p) => { p.relation = clamp((p.relation || 50) + 5, 0, 100); });
      logic.log('全队关系 +5（聚餐）', 'pos');
      ui.closeModal(); ui.render(); return;
    }
    if (action === 'cheat') {
      if (state.flags.careerCheatUsed) return;
      ui.showModal('小金手指 · 一次性彩蛋', `
        <p style="margin-bottom:10px">选择要修改的专项，并输入目标值（0–30）。保存后本生涯无法再次使用。</p>
        <div style="display:grid;grid-template-columns:1fr 110px;gap:8px;align-items:center">
          <select id="cheat-stat" style="padding:8px;border:1px solid #d1d5db;border-radius:6px"><option value="aim">枪法</option><option value="tactics">战术</option><option value="coach">教练关系</option></select>
          <input id="cheat-value" type="number" min="0" max="30" value="20" style="padding:8px;border:1px solid #d1d5db;border-radius:6px;width:100%">
        </div>
      `, [
        { text: '发动金手指', class: 'btn-warning', cb: () => {
          const key = document.getElementById('cheat-stat')?.value;
          const raw = Number(document.getElementById('cheat-value')?.value);
          if (!['aim', 'tactics', 'coach'].includes(key) || !Number.isFinite(raw)) return;
          const value = clamp(Math.round(raw), 0, MAX_SKILL);
          const old = state.stats[key] || 0;
          state.stats[key] = value;
          state.flags.careerCheatUsed = true;
          const label = { aim: '枪法', tactics: '战术', coach: '教练关系' }[key];
          logic.log(`小金手指：${label} ${old} → ${value}`, value >= old ? 'pos' : 'neg');
          ui.closeModal(); ui.render();
        } },
        { text: '取消', class: 'btn-outline', cb: () => ui.closeModal() },
      ]);
    }
  }

  game.openShop = openShop;

  // Apply division schedule whenever a started game renders after initialization.
  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    if (state.started && world.initialized) {
      const spec = EVENT_SPECS[state.date.month];
      if (spec && (!world.currentEvent?.participantIds || world.currentEvent.id !== spec.id)) applyDivisionEvent();
    }
    const result = previousRender();
    rewriteActionLabels();
    return result;
  };

  window.careerBalanceV3 = { buy, openShop, applyDivisionEvent, rankingDelta, eventSpecs: EVENT_SPECS };
  applyDivisionEvent();
  rewriteActionLabels();
  console.info('[career-balance-v3] Training, 32-team tiered leagues and career shop loaded.');
})();
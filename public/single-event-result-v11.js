(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.tournamentWorld) {
    console.warn('[single-event-result-v11] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const teamState = state.teamSystem;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const gaussianish = () => ((Math.random() + Math.random() + Math.random()) - 1.5) * 2;
  const myId = () => teamState.currentTeamId;
  const teams = () => teamSystem.getTeams().slice(0, 32);
  const teamById = (id) => teams().find((team) => team.id === id) || null;
  const primarySlot = () => state.slots?.[0] || null;

  world.v4 = world.v4 || {};
  world.v4.regularResults = world.v4.regularResults || {};
  world.v4.singleResultV11 = true;

  function isRegularPlayerEvent(event = world.currentEvent) {
    return !!event
      && event.v5
      && event.type === 'ranked'
      && ['S', 'A', 'B', 'C'].includes(event.level)
      && Array.isArray(event.participantIds)
      && event.participantIds.includes(myId());
  }

  function selectionFor(event) {
    if (!event) return false;
    const cached = world.v4?.selectionByKey?.[event.key];
    return event.selected === true || cached?.selected === true;
  }

  function staleAutomaticResult(event = world.currentEvent) {
    if (!isRegularPlayerEvent(event)) return null;
    const result = world.v4.regularResults?.[event.key];
    if (!result || typeof result.reason !== 'string') return null;
    if (!result.reason.includes('未完成赛事')) return null;
    return result;
  }

  function repairStaleAutomaticResult(silent = false) {
    const event = world.currentEvent;
    const stale = staleAutomaticResult(event);
    if (!stale || !selectionFor(event)) return false;

    const delta = Number(stale.delta || 0);
    if (Number.isFinite(delta) && delta !== 0 && myId()) {
      world.points[myId()] = Math.max(300, Math.round((world.points[myId()] || 0) - delta));
    }

    delete world.v4.regularResults[event.key];
    if (world.resolvedEventKeys) delete world.resolvedEventKeys[event.key];
    event.status = 'planning';
    delete event.result;

    const slot = primarySlot();
    if (slot) {
      slot.status = 'planning';
      slot.name = event.name;
      slot.level = event.level;
      slot.worldEventId = event.id;
      slot.worldEventKey = event.key;
      if (window.prepNameFixV9?.syncPrep) window.prepNameFixV9.syncPrep({ capture: true });
    }

    if (!silent) logic.log(`已撤销 ${event.name} 的后台提前结算，赛事将由你的实际操作决定。`, 'pos');
    return true;
  }

  function prepValue() {
    if (window.prepNameFixV9?.syncPrep) {
      const value = Number(window.prepNameFixV9.syncPrep({ capture: true }));
      if (Number.isFinite(value)) return clamp(Math.round(value), 0, 20);
    }
    return clamp(Math.round(primarySlot()?.eventPrep || 0), 0, 20);
  }

  function relationValue() {
    const value = typeof teamSystem.averageRelation === 'function' ? Number(teamSystem.averageRelation()) : 50;
    return clamp(Number.isFinite(value) ? value : 50, 0, 100);
  }

  function v5TeamPower(id, activeUser = false) {
    const team = teamById(id);
    let power = team?.prestige || 65;
    if (id === myId()) {
      const ovr = teamSystem.getUserOvr();
      power += clamp((ovr - 70) * (activeUser ? 0.16 : 0.04), -2, 4.5);
      power += clamp((relationValue() - 50) * 0.025, -1.5, 1.5);
    }
    return power;
  }

  function regularChance(event, opponentId, prep, edge) {
    if (event.level === 'S' && window.competitionCalibrationV6?.calibratedChance) {
      return window.competitionCalibrationV6.calibratedChance(myId(), opponentId, {
        major: false,
        prep,
        active: true,
        edge,
      });
    }

    let diff = v5TeamPower(myId(), true) - v5TeamPower(opponentId, false);
    diff += prep * 0.22;
    diff += gaussianish() * 3.4;
    return clamp(0.5 + diff / 86 + edge, 0.20, 0.80);
  }

  function runRegularEvent(event, mods = { self: 0, team: 0, opp: 0 }) {
    const prep = prepValue();
    const edge = clamp(((mods.self || 0) + (mods.team || 0) - (mods.opp || 0)) * 0.004, -0.04, 0.04);
    const opponents = event.participantIds.filter((id) => id !== myId());
    const used = [];
    const lines = [];
    let result = '冠军';

    const rounds = [
      ['Quarterfinal', '八强'],
      ['Semifinal', '四强'],
      ['Final', '亚军'],
    ];

    for (const [round, loseResult] of rounds) {
      const available = opponents.filter((id) => !used.includes(id));
      const opponentId = sample(available.length ? available : opponents);
      used.push(opponentId);
      const chance = regularChance(event, opponentId, prep, edge);
      const win = Math.random() < chance;
      lines.push(`${round} vs ${teamById(opponentId)?.name || 'Opponent'}：${win ? '胜' : '负'}（胜率 ${(chance * 100).toFixed(0)}%）`);
      if (!win) {
        result = loseResult;
        break;
      }
    }

    return { result, prep, edge, lines };
  }

  function resultBucket(result) {
    const text = String(result || '');
    if (text.includes('冠军')) return { min: 1, max: 1, type: 'champion' };
    if (text.includes('亚军') || text.includes('决赛')) return { min: 2, max: 2, type: 'runner' };
    if (text.includes('四强') || text.includes('半决赛')) return { min: 3, max: 4, type: 'top4' };
    return { min: 5, max: 8, type: 'top8' };
  }

  function rankingDelta(level, seed, result, total = 8) {
    const weight = { C: 8, B: 14, A: 20, S: 28 }[level] || 10;
    const bucket = resultBucket(result);

    if (bucket.type === 'champion') {
      const floor = Math.max(4, Math.round(weight * 0.55));
      const bonus = seed > 1 ? Math.round(weight * clamp((seed - 1) / Math.max(3, total - 1), 0.15, 0.8)) : 0;
      return floor + Math.max(0, bonus);
    }
    if (bucket.type === 'runner') {
      const floor = Math.max(2, Math.round(weight * 0.30));
      const bonus = seed > 2 ? Math.round(weight * clamp((seed - 2) / Math.max(3, total - 2), 0.12, 0.6)) : 0;
      return floor + Math.max(0, bonus);
    }
    if (bucket.type === 'top4') {
      if (seed <= 4) return 0;
      return Math.max(2, Math.round(weight * clamp((seed - 4) / Math.max(2, total - 4), 0.15, 0.55)));
    }
    if (seed >= 5 && seed <= 8) return 0;
    return -Math.max(2, Math.round(weight * clamp((5 - seed) / 4, 0.18, 0.65)));
  }

  function careerReward(level, result) {
    const base = {
      '八强': { points: 2, money: 2 },
      '四强': { points: 3, money: 3 },
      '亚军': { points: 4, money: 5 },
      '冠军': { points: 5, money: 10 },
    }[result] || { points: 0, money: 0 };

    if (level === 'S') return { points: base.points * 2, money: base.money * 3 };
    if (level === 'A') return { points: Math.ceil(base.points * 1.5), money: Math.floor(base.money * 1.5) };
    return { points: base.points, money: base.money };
  }

  function ratingFor(result) {
    const ovr = teamSystem.getUserOvr();
    const bonus = result === '冠军' ? 0.18
      : result === '亚军' ? 0.12
        : result === '四强' ? 0.07
          : result === '八强' ? 0.02
            : -0.08;
    return Number(clamp(0.82 + (ovr - 70) * 0.010 + bonus + (Math.random() * 0.18 - 0.09), 0.65, 1.60).toFixed(2));
  }

  function updateSelectionMomentum(rating) {
    const old = Number(teamState.selectionMomentum || 0);
    let delta = 0;
    if (rating >= 1.18) delta = 1.6;
    else if (rating >= 1.05) delta = 0.8;
    else if (rating < 0.90) delta = -0.8;
    teamState.selectionMomentum = clamp(Math.round((old + delta) * 10) / 10, 0, 8);
  }

  function recordChampion(level) {
    const flag = { S: 'sWins', A: 'aWins', B: 'bWins', C: 'cWins' }[level];
    if (!flag) return;
    state.flags[flag] = (state.flags[flag] || 0) + 1;

    if (!state.flags.hasWonAny) {
      state.flags.hasWonAny = true;
      logic.modStat('aim', 1, '首胜奖励');
    }
    if (level === 'S' && state.flags.sWins === 1) logic.modStat('aim', 1, '首个S级奖励');
  }

  function settlePlayerEventOnce(event, mods) {
    const run = runRegularEvent(event, mods);
    const seed = Math.max(1, event.participantIds.findIndex((id) => id === myId()) + 1);
    const delta = rankingDelta(event.level, seed, run.result, event.participantIds.length);
    const reward = careerReward(event.level, run.result);
    const rating = ratingFor(run.result);

    world.points[myId()] = Math.max(300, Math.round((world.points[myId()] || 0) + delta));
    world.v4.regularResults[event.key] = {
      result: run.result,
      delta,
      seed,
      rating,
      prep: run.prep,
      manualSingleResultV11: true,
    };
    world.resolvedEventKeys = world.resolvedEventKeys || {};
    world.resolvedEventKeys[event.key] = true;

    if (world.currentEvent?.key === event.key) {
      world.currentEvent.status = 'completed';
      world.currentEvent.result = run.result;
    }

    state.flags.totalScore = (state.flags.totalScore || 0) + reward.points;
    state.stats.money = (state.stats.money || 0) + reward.money;
    state.flags.totalMoney = (state.flags.totalMoney || 0) + reward.money;
    if (run.result === '冠军') recordChampion(event.level);
    updateSelectionMomentum(rating);

    const record = {
      name: event.name,
      level: event.level,
      points: reward.points,
      money: reward.money,
      result: run.result,
      rating,
      year: state.date.year,
      month: state.date.month,
      eventKey: event.key,
    };
    state.history.push(record);

    const slot = primarySlot();
    if (slot) slot.status = 'empty';

    logic.log(`赛事排名积分 ${delta >= 0 ? '+' : ''}${delta}（${event.level}级 · 赛前赛事种子 #${seed} · ${run.result}）`, delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'normal');
    logic.log(`个人 Rating ${rating.toFixed(2)} · OVR ${teamSystem.getUserOvr()} · ${teamSystem.getRole() === 'core' ? '队内核心' : teamSystem.getRole() === 'starter' ? '首发' : '轮换'}`, rating >= 1.05 ? 'pos' : rating < 0.90 ? 'neg' : 'normal');

    if (window.annualRatingV10?.renderRecordCenter) window.annualRatingV10.renderRecordCenter();
    ui.render();

    const details = run.lines.map((line) => `<div style="padding:5px 0;border-bottom:1px solid #f1f5f9">${line}</div>`).join('');
    ui.showModal(event.name, `
      <div style="font-size:.82rem;color:#64748b;margin-bottom:9px">${event.level}级 · 8队淘汰赛 · 赛事准备 ${run.prep}/20 · 本场只结算一次</div>
      <div style="font-size:.84rem">${details}</div>
      <h2 style="text-align:center;margin:16px 0;color:var(--primary)">${run.result}</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;text-align:center;font-size:.8rem">
        <div style="background:#f8fafc;padding:8px;border-radius:7px"><strong>${rating.toFixed(2)}</strong><br>Rating</div>
        <div style="background:#f8fafc;padding:8px;border-radius:7px"><strong>${delta >= 0 ? '+' : ''}${delta}</strong><br>排名积分</div>
        <div style="background:#f8fafc;padding:8px;border-radius:7px"><strong>+${reward.money}</strong><br>奖金</div>
      </div>`,
    [{ text: '继续', class: 'btn-primary', cb: () => { ui.closeModal(); ui.render(); } }]);

    return { result: run.result, rating, delta };
  }

  // New v5 regular events never enter the legacy result pipeline. That old
  // pipeline used to roll a result first, then v5/v6 rolled another one.
  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    repairStaleAutomaticResult(true);
    const event = world.currentEvent;
    if (!isRegularPlayerEvent(event)) return previousFinalize(slot, mods);

    const existing = world.v4.regularResults?.[event.key];
    if (existing && !staleAutomaticResult(event)) {
      ui.showModal('赛事已经结算', `<p><strong>${event.name}</strong> 已经完成，本场不会重复计算结果。</p><p style="margin-top:8px">最终成绩：<strong>${existing.result || event.result || '-'}</strong></p>`, [
        { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      return existing;
    }

    if (!selectionFor(event)) return previousFinalize(slot, mods);
    return settlePlayerEventOnce(event, mods);
  };

  // If a prior save already contains the known background auto-result bug,
  // undo that one ranking delta and restore the event to planning.
  repairStaleAutomaticResult(false);

  // Never allow a direct logic.nextMonth call to auto-settle a selected player
  // event. game.nextMonth already offers Enter Event / Let Team Play explicitly.
  const previousLogicNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = (...args) => {
    repairStaleAutomaticResult(true);
    const event = world.currentEvent;
    const pending = isRegularPlayerEvent(event)
      && selectionFor(event)
      && ['planning', 'resolving'].includes(event.status)
      && !world.v4.regularResults?.[event.key];
    if (pending) {
      console.info(`[single-event-result-v11] Blocked background settlement for ${event.name}.`);
      return undefined;
    }
    return previousLogicNextMonth(...args);
  };

  // Clean up the known stale auto-result before the player enters the event.
  const previousPlayCurrentEvent = tournamentWorld.playCurrentEvent?.bind(tournamentWorld);
  if (previousPlayCurrentEvent) {
    tournamentWorld.playCurrentEvent = (...args) => {
      repairStaleAutomaticResult(true);
      const event = world.currentEvent;
      if (isRegularPlayerEvent(event) && world.v4.regularResults?.[event.key]) {
        const existing = world.v4.regularResults[event.key];
        ui.showModal('赛事已经结算', `<p><strong>${event.name}</strong> 已有最终成绩：<strong>${existing.result || '-'}</strong>。</p><p style="font-size:.82rem;color:#64748b;margin-top:7px">同一赛事不能重复参赛或再次结算。</p>`, [
          { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
        ]);
        return undefined;
      }
      return previousPlayCurrentEvent(...args);
    };
  }

  window.singleEventResultV11 = { repairStaleAutomaticResult, settlePlayerEventOnce };
  console.info('[single-event-result-v11] Player S/A/B/C events now have exactly one result pipeline.');
})();
(() => {
  if (typeof state === 'undefined' || !window.logic || !window.ui || !window.teamSystem || !window.tournamentWorld) {
    console.warn('[ranking-progression-v18] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  world.v4 = world.v4 || {};
  world.v4.regularResults = world.v4.regularResults || {};

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const myId = () => state.teamSystem?.currentTeamId;

  // Rankings start roughly 12 points apart. Moving through an eight-team band
  // therefore takes about 90-100 points. These rewards are intentionally sized
  // so sustained success can promote a team by one tier within a season.
  const REWARDS = {
    C: { champion: 36, runner: 22, top4: 8, top8: 0 },
    B: { champion: 42, runner: 26, top4: 10, top8: 0 },
    A: { champion: 48, runner: 30, top4: 12, top8: 0 },
    S: { champion: 54, runner: 34, top4: 14, top8: 0 },
  };

  function bucket(result) {
    const text = String(result || '');
    if (text.includes('冠军')) return 'champion';
    if (text.includes('亚军') || text.includes('决赛')) return 'runner';
    if (text.includes('四强') || text.includes('半决赛')) return 'top4';
    return 'top8';
  }

  function progressionDelta(level, seed, result, total = 8) {
    const table = REWARDS[level] || REWARDS.C;
    const type = bucket(result);
    const s = clamp(Number(seed) || total, 1, total);

    if (type === 'champion') {
      // Lower seeds get a modest upset bonus, max +8.
      return table.champion + Math.round(((s - 1) / Math.max(1, total - 1)) * 8);
    }
    if (type === 'runner') {
      // Runner-up still meaningfully advances a lower-tier team.
      return table.runner + Math.round(((Math.max(2, s) - 2) / Math.max(1, total - 2)) * 5);
    }
    if (type === 'top4') {
      // Repeated semifinal appearances should slowly move a team upward.
      const upset = s > 4 ? Math.round(((s - 4) / Math.max(1, total - 4)) * 4) : 0;
      return table.top4 + upset;
    }

    // Quarterfinal exits are neutral for lower seeds, but top seeds lose a few
    // points for clearly underperforming expectations.
    if (s <= 2) return -8;
    if (s <= 4) return -4;
    return table.top8;
  }

  function rewriteRankingLog(level, desired, seed, result) {
    if (!Array.isArray(state.logs)) return;
    const row = state.logs.find((entry) => String(entry?.msg || '').startsWith('赛事排名积分 '));
    if (!row) return;
    row.msg = `赛事排名积分 ${desired >= 0 ? '+' : ''}${desired}（${level}级 · 赛前赛事种子 #${seed} · ${result}）`;
    row.type = desired > 0 ? 'pos' : desired < 0 ? 'neg' : 'normal';
    ui.renderLogs?.();
  }

  function applyCorrection(event, beforePoints, existingBefore = null) {
    if (!event?.key || !myId()) return false;
    const resultRow = world.v4.regularResults?.[event.key];
    if (!resultRow || resultRow === existingBefore) return false;

    const seed = Number(resultRow.seed) || Math.max(1, event.participantIds?.findIndex((id) => id === myId()) + 1 || 1);
    const desired = progressionDelta(event.level, seed, resultRow.result, event.participantIds?.length || 8);
    const oldDelta = Number(resultRow.delta || 0);
    const correction = desired - oldDelta;

    if (correction !== 0) {
      world.points[myId()] = Math.max(300, Math.round((world.points[myId()] || beforePoints || 300) + correction));
    }
    resultRow.delta = desired;
    resultRow.progressionV18 = true;
    rewriteRankingLog(event.level, desired, seed, resultRow.result);
    return true;
  }

  // Player-controlled regular event: V11 performs the one-and-only match roll,
  // then V18 replaces only its world-ranking delta with the progression curve.
  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    const event = world.currentEvent?.v5 && world.currentEvent?.type === 'ranked'
      ? { ...world.currentEvent, participantIds: [...(world.currentEvent.participantIds || [])] }
      : null;
    const beforePoints = myId() ? Number(world.points?.[myId()] || 0) : 0;
    const existingBefore = event?.key ? world.v4.regularResults?.[event.key] || null : null;

    const out = previousFinalize(slot, mods);
    if (event && ['C', 'B', 'A', 'S'].includes(event.level)) {
      applyCorrection(event, beforePoints, existingBefore);
      ui.render?.();
    }
    return out;
  };

  // If the user is reserve/rotation and the team is simulated without them,
  // apply the exact same ranking progression curve to their team result.
  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    const event = world.currentEvent?.v5 && world.currentEvent?.type === 'ranked'
      ? { ...world.currentEvent, participantIds: [...(world.currentEvent.participantIds || [])] }
      : null;
    const beforePoints = myId() ? Number(world.points?.[myId()] || 0) : 0;
    const existingBefore = event?.key ? world.v4.regularResults?.[event.key] || null : null;

    const out = previousNextMonth();
    if (event && ['C', 'B', 'A', 'S'].includes(event.level)) {
      applyCorrection(event, beforePoints, existingBefore);
    }
    return out;
  };

  window.rankingProgressionV18 = { progressionDelta, bucket, rewards: REWARDS };
  console.info('[ranking-progression-v18] Tier progression scoring loaded.');
})();

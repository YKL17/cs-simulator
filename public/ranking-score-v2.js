(() => {
  if (typeof state === 'undefined' || !window.logic || !window.tournamentWorld) {
    console.warn('[ranking-score-v2] Tournament world is not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const LEVEL_WEIGHT = { C: 8, B: 14, A: 20, S: 28, Major: 40 };

  function eventParticipants(event, rows) {
    if (!event) return [];
    if (event.type === 'open') return rows.slice();
    const limit = event.inviteLimit || rows.length;
    return rows.slice(0, limit);
  }

  function seedFor(event, teamId, rows) {
    const participants = eventParticipants(event, rows);
    const index = participants.findIndex((r) => r.id === teamId);
    return index >= 0 ? index + 1 : null;
  }

  function resultBucket(result, total = 36) {
    const text = String(result || '');
    if (text.includes('冠军')) return { min: 1, max: 1, label: '冠军', top4: true, groupExit: false };
    if (text.includes('亚军') || text.includes('决赛')) return { min: 2, max: 2, label: '亚军', top4: true, groupExit: false };
    if (text.includes('四强') || text.includes('半决赛')) return { min: 3, max: 4, label: '四强', top4: true, groupExit: false };
    if (text.includes('八强')) return { min: 5, max: 8, label: '八强', top4: false, groupExit: false };
    if (text.includes('16强') || text.includes('十六强') || text.includes('晋级')) return { min: 9, max: Math.min(16, total), label: '16强', top4: false, groupExit: false };
    if (text.includes('小组') || text.includes('首轮') || text.includes('预选出局') || text.includes('出局')) {
      return { min: Math.min(17, total), max: total, label: '小组未出线', top4: false, groupExit: true };
    }
    return null;
  }

  function expectedDelta(event, seed, result, total) {
    if (!seed) return 0;
    const bucket = resultBucket(result, total);
    if (!bucket) return 0;
    const weight = LEVEL_WEIGHT[event?.level] || 10;

    // Missing the group/playoff cut always costs points. A high seed is punished more.
    if (bucket.groupExit) {
      const expectationPenalty = Math.max(0, 17 - seed) / 16;
      return -Math.max(3, Math.round(weight * (0.55 + expectationPenalty * 0.75)));
    }

    // Seed falls inside the finishing bucket: performance matched expectation.
    if (seed >= bucket.min && seed <= bucket.max) return 0;

    // Outperformed the pre-event seed.
    if (seed > bucket.max) {
      const distance = seed - bucket.max;
      const scale = Math.max(3, Math.ceil(total / 6));
      return Math.max(2, Math.round(weight * clamp(distance / scale, 0.18, 1)));
    }

    // Underperformed. Top-four finishes are protected from negative points.
    if (bucket.top4) return 0;
    const distance = bucket.min - seed;
    const scale = Math.max(3, Math.ceil(total / 6));
    return -Math.max(2, Math.round(weight * clamp(distance / scale, 0.18, 1)));
  }

  function legacyRewardMap(event) {
    const max = event?.worldReward || 30;
    return [
      { reward: max, result: '冠军' },
      { reward: Math.round(max * 0.68), result: '亚军' },
      { reward: Math.round(max * 0.46), result: '四强' },
      { reward: Math.round(max * 0.30), result: '八强' },
      { reward: Math.round(max * 0.18), result: '16强' },
      { reward: Math.max(2, Math.round(max * 0.08)), result: '小组出局' },
    ];
  }

  function inferLegacyResult(event, observedReward) {
    if (observedReward <= 1) return null;
    const choices = legacyRewardMap(event);
    return choices.reduce((best, item) => {
      const diff = Math.abs(item.reward - observedReward);
      return !best || diff < best.diff ? { ...item, diff } : best;
    }, null)?.result || null;
  }

  function normalizeInitialSpacing() {
    if (world.relativeScoringV2 || !world.initialized) return;
    const rows = tournamentWorld.getRankings();
    rows.forEach((row, index) => {
      // Preserve the starting order but make one tournament capable of moving teams.
      world.points[row.id] = 1600 - index * 12;
    });
    world.relativeScoringV2 = true;
    world.scoringVersion = 2;
  }

  function setTeamPoints(teamId, value) {
    world.points[teamId] = Math.max(300, Math.round(value));
  }

  // Replace the legacy fixed reward for the player's completed event with relative performance scoring.
  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    const event = world.currentEvent ? { ...world.currentEvent } : null;
    const rows = tournamentWorld.getRankings();
    const teamId = state.teamSystem?.currentTeamId;
    const seed = seedFor(event, teamId, rows);
    const beforePoints = teamId ? world.points[teamId] : null;
    const beforeHistory = state.history?.length || 0;

    const result = previousFinalize(slot, mods);

    if (event && teamId && seed && (state.history?.length || 0) > beforeHistory) {
      const historyRow = state.history[state.history.length - 1];
      const participants = eventParticipants(event, rows);
      const desired = expectedDelta(event, seed, historyRow?.result, participants.length);
      setTeamPoints(teamId, beforePoints + desired);
      logic.log(
        `排名积分 ${desired > 0 ? '+' : ''}${desired}：赛前种子 #${seed}，赛事成绩 ${historyRow?.result || '-'}`,
        desired > 0 ? 'pos' : desired < 0 ? 'neg' : 'normal'
      );
    }
    return result;
  };

  // AI events are still simulated by tournament-world.js. After its legacy reward is applied,
  // infer each result bucket, remove the old fixed reward, and replace it with expectation scoring.
  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    normalizeInitialSpacing();
    const event = world.currentEvent ? { ...world.currentEvent } : null;
    const beforeRows = tournamentWorld.getRankings();
    const beforePoints = Object.fromEntries(beforeRows.map((r) => [r.id, world.points[r.id]]));
    const participants = eventParticipants(event, beforeRows);
    const participantIds = new Set(participants.map((r) => r.id));
    const userTeamId = state.teamSystem?.currentTeamId;
    const userAlreadyResolved = !!(event?.key && world.resolvedEventKeys?.[event.key]);

    const result = previousNextMonth();

    if (event && ['open', 'ranked'].includes(event.type)) {
      participantIds.forEach((teamId) => {
        // Player result was already converted in finalizeMatch; during month advance it only decays.
        if (teamId === userTeamId && userAlreadyResolved) return;
        const before = beforePoints[teamId];
        const after = world.points[teamId];
        if (typeof before !== 'number' || typeof after !== 'number') return;

        const decayBaseline = Math.round(before * 0.994);
        const observedLegacyReward = Math.round(after - decayBaseline);
        const inferredResult = inferLegacyResult(event, observedLegacyReward);
        if (!inferredResult) return;

        const seed = seedFor(event, teamId, beforeRows);
        const desired = expectedDelta(event, seed, inferredResult, participants.length);
        setTeamPoints(teamId, decayBaseline + desired);
      });
    }

    return result;
  };

  const previousInit = logic.init.bind(logic);
  logic.init = (roleId) => {
    const result = previousInit(roleId);
    normalizeInitialSpacing();
    return result;
  };

  window.rankingScoreV2 = {
    expectedDelta,
    resultBucket,
    seedFor,
    normalizeInitialSpacing,
  };

  console.info('[ranking-score-v2] Relative seed-vs-result ranking scoring loaded.');
})();
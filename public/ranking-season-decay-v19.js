(() => {
  if (typeof state === 'undefined' || !window.logic || !window.tournamentWorld) {
    console.warn('[ranking-season-decay-v19] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const CENTER = 1000;
  const RETAIN = 0.80;
  const MIN_POINTS = 300;

  world.v4 = world.v4 || {};
  world.v4.seasonDecayV19 = world.v4.seasonDecayV19 || {};

  const myId = () => state.teamSystem?.currentTeamId || null;

  function compressed(value) {
    const points = Number(value);
    if (!Number.isFinite(points)) return value;
    return Math.max(MIN_POINTS, Math.round(CENTER + (points - CENTER) * RETAIN));
  }

  function seasonAlreadyCompressed(year) {
    return !!world.v4.seasonDecayV19[String(year)];
  }

  function canCompressNow() {
    if (!state.started || !world.initialized) return false;
    if (Number(state.date?.month) !== 12) return false;
    const year = Number(state.date?.year || 1);
    if (seasonAlreadyCompressed(year)) return false;

    // V10 prevents leaving December before the annual ranking is resolved.
    // Check it again here so direct logic.nextMonth calls cannot decay early.
    return (state.hltvHistory || []).some((row) => Number(row?.year) === year);
  }

  function applyCompression(year) {
    const before = { ...world.points };
    Object.keys(world.points || {}).forEach((teamId) => {
      world.points[teamId] = compressed(world.points[teamId]);
    });

    const teamId = myId();
    const myBefore = teamId ? Number(before[teamId]) : null;
    const myAfter = teamId ? Number(world.points[teamId]) : null;
    const valuesBefore = Object.values(before).map(Number).filter(Number.isFinite);
    const valuesAfter = Object.values(world.points).map(Number).filter(Number.isFinite);
    const spreadBefore = valuesBefore.length ? Math.max(...valuesBefore) - Math.min(...valuesBefore) : 0;
    const spreadAfter = valuesAfter.length ? Math.max(...valuesAfter) - Math.min(...valuesAfter) : 0;

    world.v4.seasonDecayV19[String(year)] = {
      retain: RETAIN,
      center: CENTER,
      spreadBefore: Math.round(spreadBefore),
      spreadAfter: Math.round(spreadAfter),
      appliedAt: `${year}-12`,
    };

    if (Number.isFinite(myBefore) && Number.isFinite(myAfter)) {
      logic.log(
        `新赛季排名积分压缩：${Math.round(myBefore)} → ${Math.round(myAfter)}（全联盟积分差距缩小20%）`,
        'normal'
      );
    } else {
      logic.log('新赛季世界排名积分完成20%差距压缩。', 'normal');
    }

    return before;
  }

  function rollbackCompression(year, before) {
    if (before) world.points = { ...before };
    delete world.v4.seasonDecayV19[String(year)];
  }

  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = (...args) => {
    const beforeYear = Number(state.date?.year || 1);
    const beforeMonth = Number(state.date?.month || 1);
    let snapshot = null;

    if (canCompressNow()) snapshot = applyCompression(beforeYear);

    const result = previousNextMonth(...args);

    // Keep the reset only if December really advanced into the next year.
    if (snapshot) {
      const advanced = Number(state.date?.year || 1) === beforeYear + 1 && Number(state.date?.month || 1) === 1;
      if (!advanced) rollbackCompression(beforeYear, snapshot);
    }

    return result;
  };

  window.rankingSeasonDecayV19 = {
    compressed,
    applyCompression,
    canCompressNow,
    retain: RETAIN,
    center: CENTER,
  };

  console.info('[ranking-season-decay-v19] Annual ranking spread compression loaded.');
})();

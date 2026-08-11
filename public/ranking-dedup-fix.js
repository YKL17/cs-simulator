(() => {
  if (typeof state === 'undefined' || !window.logic) {
    console.warn('[ranking-dedup-fix] Core logic is not ready.');
    return;
  }

  const previousFinalize = logic.finalizeMatch.bind(logic);

  function isRankingSettlement(message = '') {
    return message.startsWith('世界排名积分 ')
      || message.startsWith('排名积分 ')
      || message.startsWith('赛事排名积分 ');
  }

  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    const beforeLogs = Array.isArray(state.logs) ? state.logs.slice() : [];
    const beforeSet = new Set(beforeLogs);
    const result = previousFinalize(slot, mods);

    if (!Array.isArray(state.logs)) return result;

    const added = state.logs.filter((entry) => !beforeSet.has(entry));
    const rankingEntries = added.filter((entry) => isRankingSettlement(entry?.msg || ''));
    if (rankingEntries.length <= 1) return result;

    // Prefer the tiered-event settlement, because it uses the actual participant
    // field and seed rather than the legacy global invite assumptions.
    const keep = rankingEntries.find((entry) => (entry?.msg || '').startsWith('赛事排名积分 '))
      || rankingEntries.find((entry) => (entry?.msg || '').startsWith('排名积分 '))
      || rankingEntries[0];

    const removeSet = new Set(rankingEntries.filter((entry) => entry !== keep));
    state.logs = state.logs.filter((entry) => !removeSet.has(entry));
    if (window.ui?.renderLogs) ui.renderLogs();

    return result;
  };

  console.info('[ranking-dedup-fix] Single ranking settlement per match enabled.');
})();
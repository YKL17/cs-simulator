(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.tournamentWorld) {
    console.warn('[annual-rating-v10] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const isDecember = () => state.date.month === 12;
  const winterMajorKey = (year = state.date.year) => `${year}-winter`;
  const cleanResult = (value) => String(value || '').replace(/\s*·\s*R\s*\d+(?:\.\d+)?\s*$/i, '').trim();

  state.flags = state.flags || {};
  state.flags.annualTop20DeferredYears = state.flags.annualTop20DeferredYears || [];

  function outcomeBonus(result) {
    const text = cleanResult(result);
    if (text.includes('冠军')) return 0.18;
    if (text.includes('亚军') || text.includes('决赛')) return 0.12;
    if (text.includes('四强') || text.includes('半决赛')) return 0.07;
    if (text.includes('八强')) return 0.02;
    if (text.includes('出局') || text.includes('未出线')) return -0.08;
    return 0;
  }

  function canHaveRating(record) {
    const result = cleanResult(record?.result);
    if (!record || !record.level) return false;
    if (!result || result.includes('未获资格') || result.includes('未参赛') || result.includes('替补')) return false;
    return ['C', 'B', 'A', 'S', 'Major'].includes(record.level);
  }

  function generateRating(record) {
    if (!canHaveRating(record)) return null;
    const ovr = typeof teamSystem.getUserOvr === 'function' ? teamSystem.getUserOvr() : 75;
    const eventResult = cleanResult(record.result);
    const base = 0.82 + (ovr - 70) * 0.010 + outcomeBonus(eventResult);
    const variance = Math.random() * 0.18 - 0.09;
    return Number(clamp(base + variance, 0.65, 1.60).toFixed(2));
  }

  function normalizeRecordRating(record, force = false) {
    if (!record) return null;
    record.result = cleanResult(record.result);
    if (!canHaveRating(record)) {
      if (record.rating == null) record.rating = null;
      return null;
    }
    const existing = Number(record.rating);
    if (!force && Number.isFinite(existing) && existing > 0) {
      record.rating = Number(existing.toFixed(2));
      return record.rating;
    }
    record.rating = generateRating(record);
    return record.rating;
  }

  function ensureHistoryRatings() {
    if (!Array.isArray(state.history)) return;
    state.history.forEach((record) => normalizeRecordRating(record, false));
  }

  function careerAverageRating() {
    ensureHistoryRatings();
    const rated = (state.history || []).map((h) => Number(h.rating)).filter((r) => Number.isFinite(r) && r > 0);
    if (!rated.length) return null;
    return rated.reduce((sum, r) => sum + r, 0) / rated.length;
  }

  function yearRatingData(year = state.date.year) {
    ensureHistoryRatings();
    const rated = (state.history || [])
      .filter((h) => h.year === year)
      .map((h) => Number(h.rating))
      .filter((r) => Number.isFinite(r) && r > 0);
    const average = rated.length ? rated.reduce((sum, r) => sum + r, 0) / rated.length : 0;
    // Replaces the legacy kills/20 data term while keeping the old Top20
    // thresholds in a similar numerical range. Rating 1.00 ~= 15 data pts,
    // 1.20 ~= 27, 1.40 ~= 39.
    const score = rated.length ? clamp((average - 0.75) * 60, 0, 48) : 0;
    return { average, score, count: rated.length };
  }

  function resultClass(result) {
    const text = cleanResult(result);
    if (text.includes('冠军')) return 'res-win';
    if (text.includes('亚军') || text.includes('决赛')) return 'res-final';
    if (text.includes('四强')) return 'res-top4';
    if (text.includes('八强')) return 'res-top8';
    if (text.includes('16强') || text.includes('晋级')) return 'res-top16';
    return 'res-out';
  }

  function renderRecordCenter() {
    const stat = document.getElementById('stat-k');
    if (stat) {
      const avg = careerAverageRating();
      const label = stat.previousElementSibling;
      if (label) label.textContent = '生涯 Rating';
      stat.textContent = avg == null ? '—' : avg.toFixed(2);
    }

    const list = document.getElementById('history-list');
    if (!list || !Array.isArray(state.history)) return;
    const header = `<div class="history-item history-header"><div>赛事</div><div>级别</div><div>积分</div><div>Rating</div><div>奖金</div><div>结果</div></div>`;
    const rows = state.history.slice().reverse().map((h) => {
      const rating = Number(h.rating);
      const ratingText = Number.isFinite(rating) && rating > 0 ? rating.toFixed(2) : '—';
      return `<div class="history-item">
        <div>${h.name || '-'}</div>
        <div>${h.level || '-'}</div>
        <div>${h.points ?? 0}</div>
        <div style="font-weight:700">${ratingText}</div>
        <div>${h.money ?? 0}</div>
        <div><span class="result-tag ${resultClass(h.result)}">${cleanResult(h.result) || '-'}</span></div>
      </div>`;
    }).join('');
    list.innerHTML = header + rows;
  }

  // Event result screens should talk about Rating, not kill totals. The legacy
  // kill counters are left internally for save compatibility but are no longer
  // presented as a career/event performance statistic.
  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => {
    let nextHtml = String(html ?? '');
    const eventLike = /赛事|Major|Elite|International|Masters|Challenger|Cup|Open/i.test(String(title || ''));
    if (eventLike) {
      nextHtml = nextHtml
        .replace(/个人击杀、奖金与\s*Rating/g, '个人 Rating 与奖金')
        .replace(/[,，]?\s*击杀\+\d+/g, '')
        .replace(/击杀\+\d+\s*[,，]?/g, '');
    }
    return previousShowModal(title, nextHtml, buttons);
  };

  // Recompute the just-finished ordinary tournament Rating after every wrapper
  // has finalized the actual result. This avoids the older layer rating a
  // preliminary result that v5/v6 later replaces.
  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods) => {
    const before = Array.isArray(state.history) ? state.history.length : 0;
    const out = previousFinalize(slot, mods);
    if (Array.isArray(state.history) && state.history.length > before) {
      const record = state.history[state.history.length - 1];
      normalizeRecordRating(record, true);
      renderRecordCenter();
    }
    return out;
  };

  function winterMajorResolved(year = state.date.year) {
    return !!world.v4?.majorResults?.[winterMajorKey(year)];
  }

  function winterMajorEligible(year = state.date.year) {
    const seed = world.v4?.majorSeeds?.[winterMajorKey(year)];
    if (seed?.qualified) return seed.qualified.includes(state.teamSystem?.currentTeamId);
    const rankings = tournamentWorld.getRankings?.() || [];
    const row = rankings.find((r) => r.id === state.teamSystem?.currentTeamId);
    return !!row && row.rank <= 16;
  }

  function annualAlreadyDone(year = state.date.year) {
    return Array.isArray(state.hltvHistory) && state.hltvHistory.some((row) => row.year === year);
  }

  const legacyTriggerTop20 = logic.triggerTop20.bind(logic);

  function runRatingBasedTop20() {
    const year = state.date.year;
    if (annualAlreadyDone(year) || state.flags.annualTop20Running === year) return;
    ensureHistoryRatings();
    const data = yearRatingData(year);
    const yearRows = (state.history || []).filter((h) => h.year === year);
    const oldKills = yearRows.map((h) => h.k);

    // Feed the legacy award thresholds an equivalent Rating-derived data score.
    // Only the temporary values below are seen by triggerTop20; they are restored
    // immediately, and no UI uses K after this patch.
    yearRows.forEach((h) => { h.k = 0; });
    if (yearRows.length) yearRows[0].k = data.score * 20;

    const realShowModal = ui.showModal;
    ui.showModal = (title, html, buttons = []) => {
      let body = String(html || '');
      if (String(title).includes('HLTV 年度 Top 20')) {
        const avgText = data.count ? data.average.toFixed(2) : '—';
        body = body.replace(/\+\s*数据([0-9.]+)/, `+ Rating数据$1（年均 ${avgText}）`);
      }
      return realShowModal(title, body, buttons);
    };

    state.flags.annualTop20Running = year;
    try {
      legacyTriggerTop20();
    } finally {
      ui.showModal = realShowModal;
      yearRows.forEach((h, index) => { h.k = oldKills[index]; });
      state.flags.annualTop20Running = null;
      state.flags.annualTop20DeferredYears = (state.flags.annualTop20DeferredYears || []).filter((y) => y !== year);
    }
  }

  // December's legacy month hook calls Top20 immediately on entering the month.
  // Defer it until Winter Major has actually produced a result.
  logic.triggerTop20 = () => {
    const year = state.date.year;
    if (isDecember() && !winterMajorResolved(year)) {
      if (!state.flags.annualTop20DeferredYears.includes(year)) state.flags.annualTop20DeferredYears.push(year);
      console.info('[annual-rating-v10] Deferred Top20 until Winter Major completion.');
      return;
    }
    runRatingBasedTop20();
  };

  function maybeRunAnnualAfterMajor() {
    if (!isDecember()) return;
    const year = state.date.year;
    if (annualAlreadyDone(year)) return;
    if (!winterMajorResolved(year)) return;
    setTimeout(() => {
      if (isDecember() && winterMajorResolved(year) && !annualAlreadyDone(year)) runRatingBasedTop20();
    }, 80);
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    ensureHistoryRatings();
    const out = previousRender();
    renderRecordCenter();
    maybeRunAnnualAfterMajor();
    return out;
  };

  // If the player did not qualify for the December Major, there is no playable
  // Major button to complete. Treat the tournament as resolved for the player
  // when they try to leave December, show the annual ranking, then let the next
  // click advance the calendar.
  const previousGameNextMonth = game.nextMonth.bind(game);
  game.nextMonth = () => {
    if (isDecember() && !annualAlreadyDone(state.date.year)) {
      const key = winterMajorKey();
      if (!winterMajorResolved() && !winterMajorEligible()) {
        world.v4 = world.v4 || {};
        world.v4.majorResults = world.v4.majorResults || {};
        world.v4.majorResults[key] = { result: '未获资格', delta: 0, seed: 99, annualResolutionV10: true };
        runRatingBasedTop20();
        return;
      }
      if (winterMajorResolved()) {
        runRatingBasedTop20();
        return;
      }
    }
    return previousGameNextMonth();
  };

  ensureHistoryRatings();
  renderRecordCenter();
  window.annualRatingV10 = { ensureHistoryRatings, careerAverageRating, yearRatingData, renderRecordCenter };
  console.info('[annual-rating-v10] Annual Top20 now waits for Winter Major; record center uses Rating instead of kills.');
})();
(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui) {
    console.warn('[retirement-choice-v15] Required systems are not ready.');
    return;
  }

  state.flags = state.flags || {};
  const currentYear = () => Number(state.date?.year || 1);
  const currentMonth = () => Number(state.date?.month || 1);

  function annualDone(year = currentYear()) {
    return Array.isArray(state.hltvHistory)
      && state.hltvHistory.some((row) => Number(row?.year) === Number(year));
  }

  function careerAverageRating() {
    if (window.annualRatingV10?.careerAverageRating) {
      const value = Number(window.annualRatingV10.careerAverageRating());
      if (Number.isFinite(value)) return value;
    }
    const ratings = (state.history || [])
      .map((row) => Number(row?.rating))
      .filter((value) => Number.isFinite(value) && value > 0);
    return ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null;
  }

  function trophyCount() {
    return Number(state.flags.cWins || 0)
      + Number(state.flags.bWins || 0)
      + Number(state.flags.aWins || 0)
      + Number(state.flags.sWins || 0)
      + Number(state.flags.majorWins || 0);
  }

  function top1Count() {
    return (state.hltvHistory || []).filter((row) => /^Top\s*1$/i.test(String(row?.rank || '').trim())).length;
  }

  function disableCareerActions() {
    if (!state.flags.retired) return;
    ['btn-demo', 'btn-work', 'btn-tactics', 'btn-ladder', 'btn-next'].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.disabled = true;
    });
  }

  function showRetirementSummary() {
    const avg = careerAverageRating();
    const team = window.teamSystem?.getTeam?.();
    const forced = state.flags.retirementType === 'ten-year-limit';
    const year = Number(state.flags.retirementYear || currentYear());
    const month = Number(state.flags.retirementMonth || currentMonth());
    const reason = forced
      ? '你完成了完整的10年职业生涯。按照职业生涯模式规则，现在正式退役。'
      : `你在第${year}年${month}月主动宣布结束职业生涯。`;

    ui.showModal('光荣退役', `
      <p style="margin-bottom:12px">${reason}</p>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        <div style="padding:9px;background:#f8fafc;border-radius:8px"><div style="font-size:.72rem;color:#64748b">最终战队</div><strong>${team?.name || '-'}</strong></div>
        <div style="padding:9px;background:#f8fafc;border-radius:8px"><div style="font-size:.72rem;color:#64748b">生涯 Rating</div><strong>${avg == null ? '—' : avg.toFixed(2)}</strong></div>
        <div style="padding:9px;background:#f8fafc;border-radius:8px"><div style="font-size:.72rem;color:#64748b">Major冠军</div><strong>${state.flags.majorWins || 0}</strong></div>
        <div style="padding:9px;background:#f8fafc;border-radius:8px"><div style="font-size:.72rem;color:#64748b">S级冠军</div><strong>${state.flags.sWins || 0}</strong></div>
        <div style="padding:9px;background:#f8fafc;border-radius:8px"><div style="font-size:.72rem;color:#64748b">总冠军数</div><strong>${trophyCount()}</strong></div>
        <div style="padding:9px;background:#f8fafc;border-radius:8px"><div style="font-size:.72rem;color:#64748b">年度Top1</div><strong>${top1Count()}</strong></div>
      </div>
      <p style="font-size:.76rem;color:#94a3b8;margin-top:10px">退役后仍可保存当前档案，但不能继续推进职业生涯。</p>`,
    [{ text: '重新开始', class: 'btn-danger', cb: () => location.reload() }]);
  }

  function retire({ forced = false, year = currentYear(), month = currentMonth() } = {}) {
    if (state.flags.retired) {
      showRetirementSummary();
      return;
    }
    state.flags.retired = true;
    state.flags.retirementYear = Number(year);
    state.flags.retirementMonth = Number(month);
    state.flags.retirementType = forced ? 'ten-year-limit' : 'voluntary';
    logic.log(forced
      ? `第${year}年结束：达到10年职业生涯上限，正式退役。`
      : `第${year}年${month}月：你主动宣布退役。`, 'pos');
    ui.closeModal();
    setTimeout(() => {
      disableCareerActions();
      showRetirementSummary();
    }, 80);
  }

  // Compatibility hook. Years 1-9 no longer show a retirement prompt. Retirement
  // is a deliberate action in Settings. Year 10 remains the mandatory cap.
  function showRetirementDecision(year = currentYear()) {
    const y = Number(year);
    if (state.flags.retired || !annualDone(y)) return;
    if (y >= 10) retire({ forced: true, year: y, month: 12 });
  }

  // After the year-10 Top20 result is acknowledged, finish the career. Earlier
  // seasons are uninterrupted and never show an annual retirement popup.
  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => {
    const isAnnual = String(title || '').includes('HLTV 年度 Top 20');
    if (!isAnnual || currentYear() < 10) return previousShowModal(title, html, buttons);

    const year = currentYear();
    const wrappedButtons = (buttons || []).map((button) => ({
      ...button,
      cb: () => {
        const out = button.cb?.();
        setTimeout(() => {
          if (!state.flags.retired && annualDone(year)) retire({ forced: true, year, month: 12 });
        }, 90);
        return out;
      },
    }));
    return previousShowModal(title, html, wrappedButtons);
  };

  // If the player closes the year-10 Top20 modal with X, entering another month
  // is still blocked by mandatory retirement. The original >120-month core check
  // is also left intact as a second safety net.
  const previousGameNextMonth = game.nextMonth.bind(game);
  game.nextMonth = () => {
    if (state.flags.retired) {
      showRetirementSummary();
      return;
    }
    const year = currentYear();
    if (year >= 10 && state.date.month === 12 && annualDone(year)) {
      retire({ forced: true, year, month: 12 });
      return;
    }
    return previousGameNextMonth();
  };

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    disableCareerActions();
    return out;
  };

  disableCareerActions();
  window.retirementChoiceV15 = {
    showRetirementDecision,
    retire,
    showRetirementSummary,
    annualDone,
  };
  console.info('[retirement-choice-v15] Voluntary retirement moved to Settings; year 10 remains mandatory.');
})();

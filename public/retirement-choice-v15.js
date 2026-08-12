(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui) {
    console.warn('[retirement-choice-v15] Required systems are not ready.');
    return;
  }

  state.flags = state.flags || {};
  state.flags.retirementDecisionYears = Array.isArray(state.flags.retirementDecisionYears)
    ? state.flags.retirementDecisionYears
    : [];

  const currentYear = () => Number(state.date?.year || 1);

  function annualDone(year = currentYear()) {
    return Array.isArray(state.hltvHistory)
      && state.hltvHistory.some((row) => Number(row?.year) === Number(year));
  }

  function handled(year = currentYear()) {
    return state.flags.retirementDecisionYears.includes(Number(year));
  }

  function markHandled(year = currentYear()) {
    const y = Number(year);
    if (!state.flags.retirementDecisionYears.includes(y)) {
      state.flags.retirementDecisionYears.push(y);
    }
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
    const reason = forced
      ? '你完成了完整的10年职业生涯。按照职业生涯模式规则，现在正式退役。'
      : `你在第${year}年结束后选择主动结束职业生涯。`;

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

  function retire({ forced = false, year = currentYear() } = {}) {
    if (state.flags.retired) {
      showRetirementSummary();
      return;
    }
    markHandled(year);
    state.flags.retired = true;
    state.flags.retirementYear = Number(year);
    state.flags.retirementType = forced ? 'ten-year-limit' : 'voluntary';
    state.flags.retirementPromptOpenYear = null;
    logic.log(forced
      ? `第${year}年结束：达到10年职业生涯上限，正式退役。`
      : `第${year}年结束：你宣布退役。`, 'pos');
    ui.closeModal();
    setTimeout(() => {
      disableCareerActions();
      showRetirementSummary();
    }, 80);
  }

  function continueCareer(year = currentYear()) {
    markHandled(year);
    state.flags.retirementPromptOpenYear = null;
    logic.log(`第${year}年结束：选择继续职业生涯。`, 'pos');
    ui.closeModal();
    ui.render();
  }

  function showRetirementDecision(year = currentYear()) {
    const y = Number(year);
    if (state.flags.retired || handled(y) || !annualDone(y)) return;

    // The tenth season is the hard cap. There is intentionally no continue button.
    if (y >= 10) {
      retire({ forced: true, year: y });
      return;
    }

    if (state.flags.retirementPromptOpenYear === y && ui.isModalOpen) return;
    state.flags.retirementPromptOpenYear = y;
    const team = window.teamSystem?.getTeam?.();
    ui.showModal(`第${y}年 · 生涯决定`, `
      <p><strong>${team?.name || '当前战队'}</strong> 的这个赛季已经结束。</p>
      <p style="margin-top:8px">你要继续职业生涯，还是现在宣布退役？</p>
      <p style="font-size:.78rem;color:#64748b;margin-top:8px">每年年末都可以选择退役；如果一直继续，第10年结束后会强制退役。</p>`, [
      { text: '继续征战', class: 'btn-primary', cb: () => continueCareer(y) },
      { text: '宣布退役', class: 'btn-warning', cb: () => retire({ forced: false, year: y }) },
    ]);
  }

  function afterAnnualAward(year) {
    if (!annualDone(year) || handled(year) || state.flags.retired) return;
    setTimeout(() => showRetirementDecision(year), 100);
  }

  // Annual Rating V10 ultimately displays this modal after the December Major.
  // Wrap its confirmation button so the retirement decision follows the award,
  // never before the Winter Major or annual Top20 result.
  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => {
    const isAnnual = String(title || '').includes('HLTV 年度 Top 20');
    if (!isAnnual) return previousShowModal(title, html, buttons);

    const year = currentYear();
    const wrappedButtons = (buttons || []).map((button) => ({
      ...button,
      cb: () => {
        const out = button.cb?.();
        afterAnnualAward(year);
        return out;
      },
    }));
    return previousShowModal(title, html, wrappedButtons);
  };

  // Closing the annual modal with the X must not let the player bypass the
  // yearly choice. The next-month button is a hard gate until a decision exists.
  const previousGameNextMonth = game.nextMonth.bind(game);
  game.nextMonth = () => {
    if (state.flags.retired) {
      showRetirementSummary();
      return;
    }
    const year = currentYear();
    if (state.date.month === 12 && annualDone(year) && !handled(year)) {
      showRetirementDecision(year);
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

  // Keep the original core 120-month/10-year ending check untouched as a
  // second safety net. V15 only adds the annual voluntary choice and makes the
  // tenth year explicitly mandatory after the annual awards.
  disableCareerActions();
  window.retirementChoiceV15 = {
    showRetirementDecision,
    retire,
    showRetirementSummary,
    annualDone,
  };
  console.info('[retirement-choice-v15] Annual retirement choice loaded; year 10 remains a mandatory retirement cap.');
})();

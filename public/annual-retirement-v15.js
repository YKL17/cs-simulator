(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.metaSystem) {
    console.warn('[annual-retirement-v15] Required systems are not ready.');
    return;
  }

  state.flags = state.flags || {};
  state.flags.retirementDecisionYears = Array.isArray(state.flags.retirementDecisionYears)
    ? state.flags.retirementDecisionYears
    : [];
  state.flags.annualRetirementChoiceEnabled = true;

  const currentYear = () => Number(state.date?.year || 1);
  const isDecember = () => Number(state.date?.month || 1) === 12;
  const annualDone = (year = currentYear()) => (state.hltvHistory || []).some((row) => Number(row?.year) === year);
  const decided = (year = currentYear()) => state.flags.retirementDecisionYears.includes(year);
  const markDecided = (year = currentYear()) => {
    if (!decided(year)) state.flags.retirementDecisionYears.push(year);
  };

  function trophyCount() {
    return (state.flags.cWins || 0) + (state.flags.bWins || 0) + (state.flags.aWins || 0)
      + (state.flags.sWins || 0) + (state.flags.majorWins || 0);
  }

  function top1Count() {
    return (state.hltvHistory || []).filter((row) => /^Top\s*1$/i.test(String(row?.rank || '').trim())).length;
  }

  function careerRating() {
    if (window.annualRatingV10?.careerAverageRating) {
      const value = Number(window.annualRatingV10.careerAverageRating());
      if (Number.isFinite(value) && value > 0) return value;
    }
    const ratings = (state.history || []).map((row) => Number(row?.rating)).filter((value) => Number.isFinite(value) && value > 0);
    return ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null;
  }

  function retirementSummaryHtml() {
    const team = teamSystem.getTeam?.();
    const rating = careerRating();
    const top1 = top1Count();
    return `
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:.76rem;color:#64748b">CAREER COMPLETE</div>
        <h2 style="margin:5px 0;color:var(--primary)">第 ${state.flags.retiredYear || currentYear()} 年正式退役</h2>
        <div style="font-size:.84rem;color:#64748b">最后效力：${team?.name || '职业赛场'}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
        <div style="padding:10px;background:#f8fafc;border-radius:8px;text-align:center"><strong>${teamSystem.getUserOvr?.() || '-'}</strong><br><span style="font-size:.75rem;color:#64748b">最终 OVR</span></div>
        <div style="padding:10px;background:#f8fafc;border-radius:8px;text-align:center"><strong>${rating == null ? '—' : rating.toFixed(2)}</strong><br><span style="font-size:.75rem;color:#64748b">生涯 Rating</span></div>
        <div style="padding:10px;background:#f8fafc;border-radius:8px;text-align:center"><strong>${state.flags.majorWins || 0}</strong><br><span style="font-size:.75rem;color:#64748b">Major 冠军</span></div>
        <div style="padding:10px;background:#f8fafc;border-radius:8px;text-align:center"><strong>${state.flags.sWins || 0}</strong><br><span style="font-size:.75rem;color:#64748b">S级冠军</span></div>
        <div style="padding:10px;background:#f8fafc;border-radius:8px;text-align:center"><strong>${trophyCount()}</strong><br><span style="font-size:.75rem;color:#64748b">总冠军</span></div>
        <div style="padding:10px;background:#f8fafc;border-radius:8px;text-align:center"><strong>${top1}</strong><br><span style="font-size:.75rem;color:#64748b">年度 Top1</span></div>
      </div>
      <p style="font-size:.78rem;color:#64748b;margin-top:12px;text-align:center">退役存档仍会保留，可以回首页查看成就和生涯记录。</p>`;
  }

  function showRetirementSummary() {
    ui.showModal('光荣退役', retirementSummaryHtml(), [
      { text: '查看成就', class: 'btn-primary', cb: () => { ui.closeModal(); metaSystem.showAchievements?.(); } },
      { text: '返回首页', class: 'btn-outline', cb: () => { ui.closeModal(); metaSystem.showHome?.(); } },
    ]);
  }

  function disableRetiredControls() {
    if (!state.flags.retired) return;
    document.querySelectorAll('.action-btn').forEach((button) => {
      button.disabled = true;
      button.title = '职业生涯已经结束';
    });
    const career = document.getElementById('career-left');
    if (career) career.textContent = `已退役 · 生涯 ${state.flags.retiredYear || currentYear()} 年`;
  }

  function retireCareer(year = currentYear()) {
    markDecided(year);
    state.flags.retired = true;
    state.flags.retiredYear = year;
    state.flags.retiredMonth = Number(state.date?.month || 12);
    logic.log(`你在第 ${year} 年结束后宣布退役。`, 'pos');
    window.careerExpansionV14?.checkAchievements?.(true);
    metaSystem.autoSave?.();
    ui.closeModal();
    ui.render();
    setTimeout(showRetirementSummary, 90);
  }

  function continueCareer(year = currentYear()) {
    markDecided(year);
    logic.log(`第 ${year} 年结束：你决定继续职业生涯。`, 'pos');
    metaSystem.autoSave?.();
    ui.closeModal();
    ui.render();
  }

  function showRetirementChoice(year = currentYear()) {
    if (state.flags.retired || decided(year)) return;
    const row = (state.hltvHistory || []).find((item) => Number(item?.year) === year);
    const annualRank = row?.rank || '未入选';
    const rating = window.annualRatingV10?.yearRatingData?.(year)?.average;
    const ratingText = Number.isFinite(Number(rating)) && Number(rating) > 0 ? Number(rating).toFixed(2) : '—';
    ui.showModal(`${year} 年职业生涯结束`, `
      <p>本年度已经全部结束。你在 HLTV 年度评选中获得 <strong>${annualRank}</strong>，年度平均 Rating <strong>${ratingText}</strong>。</p>
      <p style="margin-top:10px;font-size:.84rem;color:#64748b">你可以继续征战下一年，也可以现在宣布退役。选择继续不会再受到原版“10年强制退役”的限制。</p>`, [
      { text: '继续征战', class: 'btn-primary', cb: () => continueCareer(year) },
      { text: '宣布退役', class: 'btn-danger', cb: () => retireCareer(year) },
    ]);
  }

  // Annual retirement appears immediately after the Top20 result is dismissed.
  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => {
    const text = String(title || '');
    if (text.includes('HLTV 年度 Top 20') && !state.flags.retired && !decided(currentYear())) {
      const year = currentYear();
      const wrapped = (buttons || []).map((button) => ({
        ...button,
        cb: () => {
          try { button.cb?.(); } finally {
            setTimeout(() => {
              if (!state.flags.retired && !decided(year) && annualDone(year)) showRetirementChoice(year);
            }, 100);
          }
        },
      }));
      return previousShowModal(title, html, wrapped);
    }
    return previousShowModal(title, html, buttons);
  };

  // Safety guard: the player can never leave December after Top20 without
  // making that year's retirement/continue decision.
  const previousNextMonth = game.nextMonth.bind(game);
  game.nextMonth = () => {
    if (state.flags.retired) {
      showRetirementSummary();
      return;
    }
    if (isDecember() && annualDone() && !decided()) {
      showRetirementChoice();
      return;
    }
    return previousNextMonth();
  };

  // Annual voluntary retirement replaces the original forced 10-year ending.
  const previousTriggerEnding = logic.triggerEnding?.bind(logic);
  if (previousTriggerEnding) {
    logic.triggerEnding = (type, ...args) => {
      if (state.flags.annualRetirementChoiceEnabled && (type === 'success' || type === 'pro_fail')) {
        if (!state.flags.legacyTenYearEndingSuppressed) {
          state.flags.legacyTenYearEndingSuppressed = true;
          logic.log('已进入长期职业阶段：10年强制退役取消，之后每年由你决定是否继续。', 'pos');
        }
        return;
      }
      return previousTriggerEnding(type, ...args);
    };
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    const career = document.getElementById('career-left');
    if (!state.flags.retired && career) career.textContent = `生涯第 ${currentYear()} 年 · 年末可选择退役`;
    disableRetiredControls();
    return out;
  };

  disableRetiredControls();
  window.annualRetirementV15 = {
    showRetirementChoice,
    showRetirementSummary,
    retireCareer,
    continueCareer,
  };
  console.info('[annual-retirement-v15] Voluntary retirement choice now appears after every annual Top20 result.');
})();

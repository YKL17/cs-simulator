(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.tournamentWorld) {
    console.warn('[major-month-fix-v7] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const isMajorMonth = (month = state.date.month) => month === 6 || month === 12;
  const monthKey = () => `${state.date.year}-${state.date.month}`;
  const majorKey = () => `${state.date.year}-${state.date.month === 6 ? 'spring' : 'winter'}`;
  const rows = () => tournamentWorld.getRankings().slice(0, 32);
  const myId = () => state.teamSystem?.currentTeamId;
  const primarySlot = () => state.slots?.[0] || null;

  function majorSeedData() {
    const key = majorKey();
    if (world.v4?.majorSeeds?.[key]) return world.v4.majorSeeds[key];
    const snapshot = rows();
    world.v4 = world.v4 || {};
    world.v4.majorSeeds = world.v4.majorSeeds || {};
    world.v4.majorSeeds[key] = {
      qualified: snapshot.slice(0, 16).map((r) => r.id),
      snapshot: snapshot.map((r) => ({ id: r.id, rank: r.rank, points: r.points })),
    };
    return world.v4.majorSeeds[key];
  }

  function seedNumber() {
    return majorSeedData().snapshot.find((r) => r.id === myId())?.rank || 99;
  }

  function isEligible() {
    return majorSeedData().qualified.includes(myId());
  }

  function suppressRegularEvent() {
    if (!state.started || !world.initialized || !isMajorMonth()) return;
    world.v4 = world.v4 || {};
    world.v4.monthlySettled = world.v4.monthlySettled || {};
    // A Major month intentionally contains no S/A/B/C event. Mark the regular
    // monthly circuit as settled so v5 cannot simulate hidden A/C or S/B fields.
    world.v4.monthlySettled[monthKey()] = true;

    const key = majorKey();
    const done = !!world.v4.majorResults?.[key];
    world.currentEvent = {
      id: `major-only-${key}`,
      key: `major-only-${key}`,
      name: state.date.month === 6 ? 'Spring Major' : 'Winter Major',
      level: 'Major',
      type: 'major',
      status: done ? 'completed' : 'planning',
      invited: isEligible(),
      selected: true,
      majorOnlyV7: true,
    };

    const slot = primarySlot();
    if (slot) {
      const prepId = `major-prep-${key}`;
      if (slot.prepEventId !== prepId) slot.eventPrep = 0;
      slot.prepEventId = prepId;
      slot.name = world.currentEvent.name;
      slot.level = 'Major';
      slot.worldEventId = world.currentEvent.id;
      slot.worldEventKey = world.currentEvent.key;
      slot.status = done || !isEligible() ? 'empty' : 'planning';
      const prep = Math.max(0, Math.min(20, Math.round(slot.eventPrep || 0)));
      slot.scores = { tac: prep, trn: prep, real: prep };
    }
  }

  // The original inline game and tournament-world both contain legacy Major
  // triggers. They must never resolve a v6/v7 Major automatically on entry.
  const legacyTriggerMajor = logic.triggerMajor?.bind(logic);
  logic.triggerMajor = (...args) => {
    if (isMajorMonth() && world.v4) {
      console.info('[major-month-fix-v7] Suppressed legacy automatic Major result.');
      return undefined;
    }
    return legacyTriggerMajor?.(...args);
  };

  const previousLogicNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    if (isMajorMonth()) {
      world.v4 = world.v4 || {};
      world.v4.monthlySettled = world.v4.monthlySettled || {};
      world.v4.monthlySettled[monthKey()] = true;
    }
    const out = previousLogicNextMonth();
    suppressRegularEvent();
    return out;
  };

  // Public calendar API also reports no ordinary event during Major months.
  const previousGetMonthlyEvents = tournamentWorld.getMonthlyEvents?.bind(tournamentWorld);
  tournamentWorld.getMonthlyEvents = (month = state.date.month, ...rest) => {
    if (isMajorMonth(month)) return [];
    return previousGetMonthlyEvents ? previousGetMonthlyEvents(month, ...rest) : [];
  };

  function renderMajorOnlyWorkstation() {
    if (!isMajorMonth() || !state.started) return;
    const container = document.getElementById('slots-container');
    if (!container) return;
    const key = majorKey();
    const done = !!world.v4?.majorResults?.[key];
    const result = world.v4?.majorResults?.[key]?.result;
    const eligible = isEligible();
    const seed = seedNumber();
    const prep = Math.max(0, Math.min(20, Math.round(primarySlot()?.eventPrep || 0)));
    const label = state.date.month === 6 ? 'Spring Major' : 'Winter Major';

    let body = '';
    if (done) {
      body = `<div style="padding:9px;background:#fffbeb;border-radius:7px;color:#92400e">已完成：<strong>${result || '-'}</strong></div>`;
    } else if (!eligible) {
      body = `<p style="font-size:.83rem;color:#991b1b">排名锁定时为 <strong>#${seed}</strong>，未进入世界前16，本届 Major 无参赛资格。</p>`;
    } else {
      body = `<div style="font-size:.79rem;color:#64748b">种子 #${seed} · 16队 Swiss → 8队淘汰赛 · 准备度 ${prep}/20</div>
        <p style="font-size:.8rem;color:#475569;margin-top:7px">本月只有 Major。可以先进行赛事备战，再正式参赛。</p>
        <button class="btn btn-warning" style="width:100%;margin-top:9px" onclick="tournamentWorld.playMajor()"><i class="fa-solid fa-trophy"></i> 进入 Major</button>`;
    }
    container.innerHTML = `<div class="slot-card active" style="border-color:#f59e0b">
      <div class="slot-header"><span>${label}</span><span style="color:#d97706">Major 专属月</span></div>
      ${body}
    </div>`;
  }

  const previousRenderWorkstation = ui.renderWorkstation?.bind(ui);
  if (previousRenderWorkstation) {
    ui.renderWorkstation = () => {
      if (!isMajorMonth()) return previousRenderWorkstation();
      suppressRegularEvent();
      renderMajorOnlyWorkstation();
    };
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    if (isMajorMonth()) {
      suppressRegularEvent();
      renderMajorOnlyWorkstation();
    }
    return out;
  };

  const previousOpenWorldHub = tournamentWorld.openWorldHub?.bind(tournamentWorld);
  tournamentWorld.openWorldHub = () => {
    if (!isMajorMonth()) return previousOpenWorldHub?.();
    const rankingRows = rows();
    const rankingHtml = rankingRows.map((r) => `<div style="display:grid;grid-template-columns:36px 1fr 70px;gap:8px;padding:6px 8px;border-bottom:1px solid #f1f5f9;${r.id === myId() ? 'background:#eff6ff;font-weight:700;' : ''}"><span>#${r.rank}</span><span>${r.name}</span><span style="text-align:right">${r.points}</span></div>`).join('');
    const label = state.date.month === 6 ? 'Spring Major' : 'Winter Major';
    ui.showModal('CS 世界赛事中心', `<div style="padding:11px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:12px"><strong>[Major] ${label}</strong><div style="font-size:.78rem;color:#92400e;margin-top:4px">6月和12月为 Major 专属月，不举办 S/A/B/C 普通赛事。世界前16获得资格。</div></div><div style="font-weight:800;margin:8px 0">世界排名</div><div style="max-height:300px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px">${rankingHtml}</div>`, [{ text:'关闭', class:'btn-outline', cb:()=>ui.closeModal() }]);
  };

  suppressRegularEvent();
  renderMajorOnlyWorkstation();
  window.majorMonthFixV7 = { suppressRegularEvent, isMajorMonth };
  console.info('[major-month-fix-v7] Major-only months and legacy-result guard loaded.');
})();
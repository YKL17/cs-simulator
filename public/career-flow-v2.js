(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem) {
    console.warn('[career-flow-v2] Core systems are not ready.');
    return;
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const teamState = state.teamSystem;
  const MAX_SKILL = 30;

  state.stats.maxAim = MAX_SKILL;
  state.stats.maxTactics = MAX_SKILL;
  state.stats.maxCoach = MAX_SKILL;
  state.trainingSystem = state.trainingSystem || { aimXp: 0, tacticsXp: 0, teamXp: 0 };

  function roleLabel(role) {
    return ({ reserve: '替补', rotation: '轮换', starter: '首发', core: '队内核心' })[role] || role;
  }

  function relationLabel(value) {
    if (value < 25) return '关系紧张';
    if (value < 45) return '生疏';
    if (value < 65) return '正常';
    if (value < 80) return '默契';
    return '挚友';
  }

  // Core game originally hard-capped permanent skills at 20. The current
  // career model uses a slower 0-30 scale instead.
  const originalModStat = logic.modStat.bind(logic);
  logic.modStat = (key, val, reason) => {
    if (!['aim', 'tactics', 'coach'].includes(key)) return originalModStat(key, val, reason);
    const old = state.stats[key] || 0;
    const next = clamp(old + val, 0, MAX_SKILL);
    state.stats[key] = next;
    if (next !== old) {
      const labels = { aim: '枪法', tactics: '战术', coach: '教练关系' };
      logic.log(`${labels[key]} ${old} → ${next}${reason ? `（${reason}）` : ''}`, next > old ? 'pos' : 'neg');
    }
    return next;
  };

  // The player signs a professional team at the start now, so the old
  // rookie -> pro "ascension" and extra tournament-slot unlocks are obsolete.
  ui.showAscensionModal = () => {};
  logic.checkUnlocks = () => {
    if (!state.slots.length) state.slots.push({ id: 1, status: 'empty' });
    if (state.slots.length > 1) state.slots.splice(1);
  };

  function teammateAverageOvr() {
    const roster = Array.isArray(teamState.roster) ? teamState.roster : [];
    if (!roster.length) return 75;
    return roster.reduce((sum, p) => sum + (p.ovr || 0), 0) / roster.length;
  }

  function getCareerOvr() {
    const score = Math.max(0, state.flags.totalScore || 0);
    const majors = Math.max(0, state.flags.majorWins || 0);
    const scoreBonus = Math.min(8, Math.sqrt(score) * 0.9);
    const value = 58
      + (state.stats.aim || 0) * 0.80
      + (state.stats.tactics || 0) * 0.55
      + (state.stats.coach || 0) * 0.25
      + scoreBonus
      + majors * 1.5
      + (teamState.captain ? 0.5 : 0);
    return clamp(Math.round(value), 50, 97);
  }

  function competitionScore() {
    return getCareerOvr() - teammateAverageOvr() + (teamState.selectionMomentum || 0);
  }

  function getCareerRole() {
    const diff = competitionScore();
    if (diff < -15) return 'reserve';
    if (diff < -7) return 'rotation';
    if (diff < 5) return 'starter';
    return 'core';
  }

  // Override the old high-starting OVR model used by tournaments and transfers.
  teamSystem.getUserOvr = getCareerOvr;
  teamSystem.getRole = getCareerRole;
  teamSystem.teammateAverageOvr = teammateAverageOvr;

  function makeRoster(team) {
    if (!team) return [];
    const playerId = (name) => `${team.id}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
    return team.roster.map(([name, role, delta]) => ({
      id: playerId(name),
      name,
      role,
      ovr: clamp(team.base + delta, 62, 98),
      relation: 46 + Math.floor(Math.random() * 14),
    }));
  }

  function routePool(route) {
    const teams = teamSystem.getTeams();
    // Weak route is intentionally truly weak so a new player can start.
    if (route === 'weak') return teams.filter((t) => t.valveRank >= 45);
    // Trial route is now clearly mid/upper-mid, not #19-21 fringe teams.
    return teams.filter((t) => t.valveRank >= 8 && t.valveRank <= 16);
  }

  function syncJanuaryEvent() {
    const world = state.tournamentWorld;
    const event = world?.currentEvent;
    if (!event || !['open', 'ranked'].includes(event.type)) return;

    const rank = window.tournamentWorld?.getRank?.() || 99;
    const role = teamSystem.getRole();
    event.invited = event.type === 'open' ? true : rank <= (event.inviteLimit || 99);
    event.selected = event.invited && role !== 'reserve';
    event.selectionReason = !event.invited
      ? '战队未达到赛事邀请线。'
      : event.selected
        ? `${roleLabel(role)}，进入本项赛事名单。`
        : '你目前是替补，需要通过训练和比赛机会争取名单。';
    event.status = 'planning';

    const slot = state.slots[0];
    if (!slot) return;
    if (event.invited && event.selected) {
      slot.status = 'planning';
      slot.name = event.name;
      slot.level = event.level;
      slot.scores = { tac: 0, trn: 0, real: 0 };
      slot.eventPrep = 0;
      slot.prepEventId = event.id;
      slot.worldEventId = event.id;
      slot.worldMajorPrep = false;
    } else {
      slot.status = 'empty';
      slot.eventPrep = 0;
    }
  }

  function applyStartRoute(route) {
    const pool = routePool(route);
    const team = sample(pool);
    if (!team) return;

    state.phase = 'pro';
    state.flags.ascensionOffered = true;
    state.flags.proGoalMetLogged = true;
    state.stats.maxAim = MAX_SKILL;
    state.stats.maxTactics = MAX_SKILL;
    state.stats.maxCoach = MAX_SKILL;

    teamState.currentTeamId = team.id;
    teamState.roster = makeRoster(team);
    teamState.contractMonths = 24;
    teamState.joinedYear = state.date.year;
    teamState.joinedMonth = state.date.month;
    teamState.startRoute = route === 'weak' ? 'weak-starter' : 'mid-bench';
    // Weak-team route receives trust from the coach; trial route starts on the bench.
    teamState.selectionMomentum = route === 'weak' ? 8.0 : 2.0;
    teamState.initialized = true;
    teamState.lastRole = getCareerRole();
    teamState.lastBalancedRole = getCareerRole();

    if (Array.isArray(state.logs)) {
      state.logs = state.logs.filter((l) => {
        const msg = l?.msg || '';
        return !msg.startsWith('签约 ') && !msg.startsWith('世界排名系统启动：') && !msg.includes('飞升');
      });
    }

    syncJanuaryEvent();
    const rank = window.tournamentWorld?.getRank?.() || '-';
    const routeText = route === 'weak'
      ? '弱队首发路线：从真正弱队获得稳定上场机会'
      : '中游/较强队试训：从替补席竞争轮换与首发';
    logic.log(`职业起点：${team.name}（快照 Valve #${team.valveRank}）· ${routeText}`, 'pos');
    logic.log(`初始 OVR ${getCareerOvr()} · 队内地位：${roleLabel(getCareerRole())} · 世界排名 #${rank}`, 'pos');
    ui.render();
  }

  // Replace the team hub so it uses the new slower OVR model everywhere.
  teamSystem.openHub = () => {
    const team = teamSystem.getTeam();
    if (!team) return;
    const roster = Array.isArray(teamState.roster) ? teamState.roster : [];
    const avgRelation = roster.length
      ? Math.round(roster.reduce((sum, p) => sum + (p.relation || 0), 0) / roster.length)
      : 50;
    const avgOvr = Math.round(teammateAverageOvr());
    const role = getCareerRole();
    const diff = competitionScore();
    const worldRow = window.tournamentWorld?.getRankings?.().find((r) => r.id === team.id);
    const rosterHtml = roster.map((player) => `
      <div class="teammate-card">
        <div class="teammate-head">
          <div><div class="teammate-name">${player.name}</div><div class="teammate-meta">${player.role} · OVR ${player.ovr}</div></div>
          <button class="btn btn-outline" style="padding:5px 9px;font-size:.75rem" onclick="teamSystem.interact('${player.id}')">互动</button>
        </div>
        <div class="relation-row">
          <span style="font-size:.75rem;min-width:58px">${relationLabel(player.relation)}</span>
          <div class="relation-track"><div class="relation-fill" style="width:${player.relation}%"></div></div>
          <span style="font-size:.75rem;font-weight:700">${player.relation}</span>
        </div>
      </div>`).join('');

    ui.showModal('战队中心', `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px">
        <div><div style="font-size:1.2rem;font-weight:800">${team.name}</div><div style="font-size:.8rem;color:#64748b">Valve 快照 #${team.valveRank}${worldRow?.rank ? ` · 模拟世界 #${worldRow.rank}` : ''}</div></div>
        <span class="result-tag res-top4">${roleLabel(role)}</span>
      </div>
      <div class="team-summary-grid">
        <div class="team-summary-card"><div class="team-summary-value">${getCareerOvr()}</div><div class="team-summary-label">你的 OVR</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${avgOvr}</div><div class="team-summary-label">队友平均 OVR</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${diff >= 0 ? '+' : ''}${diff.toFixed(1)}</div><div class="team-summary-label">首发竞争值</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${teamState.selectionMomentum.toFixed(1)}</div><div class="team-summary-label">近期训练状态</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${avgRelation}</div><div class="team-summary-label">队内化学反应</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${teamState.contractMonths}</div><div class="team-summary-label">合同剩余（月）</div></div>
      </div>
      <div style="font-size:.78rem;color:#64748b;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:8px;margin-bottom:10px">永久属性采用 0–30 成长制。OVR 是综合评分，不会再因为几次训练快速冲高。</div>
      <div style="font-weight:700;margin-bottom:8px">队友</div>${rosterHtml}
      ${teamState.activeOffers?.length ? `<button class="btn btn-warning" style="width:100%;margin-top:6px" onclick="teamSystem.showTransferWindow()">查看 ${teamState.activeOffers.length} 份转会报价</button>` : ''}
    `, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  };

  // Role selection is followed by a player-controlled team-level route.
  const existingInit = logic.init.bind(logic);
  logic.init = (roleId) => {
    if (state.started) return existingInit(roleId);
    ui.closeModal();
    setTimeout(() => {
      ui.showModal('选择职业起点', `
        <p style="color:#475569;margin-bottom:12px">出身属性确定后，选择第一份职业合同的路线。</p>
        <div style="display:grid;gap:10px">
          <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:9px;padding:12px">
            <div style="font-weight:800;color:#166534">弱队首发机会</div>
            <div style="font-size:.82rem;color:#475569;margin-top:4px">从快照约 #45 以后的弱队开始。赛事资源较少，但新秀会得到较高信任，通常直接进入首发。</div>
          </div>
          <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:9px;padding:12px">
            <div style="font-weight:800;color:#9a3412">中游 / 较强队试训</div>
            <div style="font-size:.82rem;color:#475569;margin-top:4px">从快照 #8–16 的中上游队伍开始。阵容明显更强，开局从替补竞争轮换和首发。</div>
          </div>
        </div>
      `, [
        {
          text: '选择弱队首发机会', class: 'btn-success', cb: () => {
            ui.closeModal();
            setTimeout(() => {
              existingInit(roleId);
              state.phase = 'pro';
              state.flags.ascensionOffered = true;
              applyStartRoute('weak');
            }, 60);
          },
        },
        {
          text: '选择中游 / 较强队试训', class: 'btn-warning', cb: () => {
            ui.closeModal();
            setTimeout(() => {
              existingInit(roleId);
              state.phase = 'pro';
              state.flags.ascensionOffered = true;
              applyStartRoute('mid');
            }, 60);
          },
        },
        { text: '返回选择角色', class: 'btn-outline', cb: () => location.reload() },
      ]);
    }, 80);
  };

  function currentPlanningSlot() {
    return state.slots.find((slot) => slot.status === 'planning' && slot.scores) || null;
  }

  function ensurePrep(slot) {
    if (!slot) return 0;
    const eventId = slot.worldEventId || slot.name || 'unknown';
    if (slot.prepEventId !== eventId) {
      const scores = slot.scores || { tac: 0, trn: 0, real: 0 };
      slot.eventPrep = Math.round(((scores.tac || 0) + (scores.trn || 0) + (scores.real || 0)) / 3);
      slot.prepEventId = eventId;
    }
    if (typeof slot.eventPrep !== 'number') slot.eventPrep = 0;
    return clamp(Math.round(slot.eventPrep), 0, 20);
  }

  function setPrep(slot, value) {
    if (!slot) return;
    const prep = clamp(Math.round(value), 0, 20);
    slot.eventPrep = prep;
    slot.prepEventId = slot.worldEventId || slot.name || 'unknown';
    slot.scores = { tac: prep, trn: prep, real: prep };
  }

  function addMomentum(amount, reason) {
    const old = typeof teamState.selectionMomentum === 'number' ? teamState.selectionMomentum : 0;
    teamState.selectionMomentum = clamp(Math.round((old + amount) * 10) / 10, 0, 8);
    if (reason && teamState.selectionMomentum !== old) {
      logic.log(`首发竞争 ${old.toFixed(1)} → ${teamState.selectionMomentum.toFixed(1)}（${reason}）`, amount >= 0 ? 'pos' : 'neg');
    }
  }

  function refreshCurrentSelection() {
    const event = state.tournamentWorld?.currentEvent;
    if (!event || !event.invited || event.status !== 'planning' || !['open', 'ranked'].includes(event.type)) return;
    const role = teamSystem.getRole();
    const selected = role !== 'reserve';
    if (selected && !event.selected) {
      event.selected = true;
      event.selectionReason = `${roleLabel(role)}，训练表现让你进入了本项赛事名单。`;
      const slot = state.slots[0];
      slot.status = 'planning';
      slot.name = event.name;
      slot.level = event.level;
      slot.scores = { tac: 0, trn: 0, real: 0 };
      slot.eventPrep = 0;
      slot.prepEventId = event.id;
      slot.worldEventId = event.id;
      logic.log(`进入 ${event.name} 参赛名单！`, 'pos');
    }
  }

  function finishAction(key) {
    state.flags.usedMonthlyActions.push(key);
    refreshCurrentSelection();
    ui.render();
  }

  function gainTrainingXp(key, stat, label) {
    const training = state.trainingSystem;
    training[key] = (training[key] || 0) + 1;
    if (training[key] >= 3) {
      training[key] -= 3;
      logic.modStat(stat, 1, `${label}积累`);
      return true;
    }
    logic.log(`${label}进度 ${training[key]}/3，累计 3 次提升 1 点永久属性`, 'pos');
    return false;
  }

  game.actionDemo = () => {
    logic.modStat('san', -3, '枪法训练');
    gainTrainingXp('aimXp', 'aim', '枪法训练');
    addMomentum(0.4, '个人训练状态');
    finishAction('aim-training');
  };

  game.actionWork = () => {
    logic.modStat('san', -2, '战术训练');
    gainTrainingXp('tacticsXp', 'tactics', '战术训练');
    addMomentum(0.2, '保持战术状态');
    finishAction('tactics-training');
  };

  game.actionTactics = () => {
    logic.modStat('san', -2, '团队训练');
    gainTrainingXp('teamXp', 'coach', '团队训练');
    addMomentum(0.8, '团队训练表现');
    if (teamState.roster?.length) {
      const mate = sample(teamState.roster);
      teamSystem.addRelation(mate.id, 2, '一起参加团队训练');
    }
    finishAction('team-training');
  };

  game.actionScrim = () => {
    const before = state.stats.san;
    logic.modStat('san', 4, '状态恢复');
    if (state.stats.san === before) logic.log('当前心态已经接近最佳状态');
    finishAction('recovery');
  };

  game.actionLadder = () => {
    const slot = currentPlanningSlot();
    if (!slot) {
      ui.showModal('本月没有可备战赛事', '赛事备战只影响当前已经进入名单的正式赛事或 Major 集训。本月可以选择个人训练或状态恢复。', [
        { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      return;
    }
    const old = ensurePrep(slot);
    setPrep(slot, old + 6);
    logic.modStat('san', -2, '赛事备战');
    logic.log(`赛事准备度 ${old} → ${ensurePrep(slot)}（${slot.name}）`, 'pos');
    finishAction('event-prep');
  };

  function updateActionLabels() {
    const config = {
      'btn-demo': ['fa-crosshairs', '枪法训练', 'SAN-3 | 每3次枪法+1'],
      'btn-work': ['fa-brain', '战术训练', 'SAN-2 | 每3次战术+1'],
      'btn-tactics': ['fa-people-group', '团队训练', 'SAN-2 | 每3次教练+1'],
      'btn-scrim': ['fa-heart-pulse', '状态恢复', 'SAN+4 | 恢复状态'],
      'btn-ladder': ['fa-clipboard-check', '赛事备战', 'SAN-2 | 准备度+6'],
    };
    Object.entries(config).forEach(([id, [icon, title, desc]]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${title}<span style="font-size:.75rem;color:#6b7280">${desc}</span>`;
    });
    const next = document.getElementById('btn-next');
    if (next) next.innerHTML = '<i class="fa-solid fa-calendar-check"></i> 进入下个月<span style="font-size:.75rem;color:rgba(255,255,255,.8)">结算赛季进度</span>';
  }

  function collapsePrepDisplay() {
    const container = document.getElementById('slots-container');
    if (!container) return;
    const slot = currentPlanningSlot();
    const prep = slot ? ensurePrep(slot) : 0;
    container.querySelectorAll('.slot-scores').forEach((node) => {
      node.innerHTML = `<span class="score-badge" style="font-weight:800">赛事准备 ${prep}/20</span>`;
    });
    container.innerHTML = container.innerHTML
      .replace(/本月的想战术\s*\/\s*训练赛\s*\/\s*天梯会转化为 Major 备战分。/g, '本月选择“赛事备战”可提升 Major 准备度。')
      .replace(/战术\s*\d+<\/span><span class="score-badge">训练\s*\d+<\/span><span class="score-badge">实战\s*\d+/g, `赛事准备 ${prep}\/20`);
  }

  function renderThirtyScale() {
    const rows = document.querySelectorAll('#stats-container .stat-row');
    const keys = ['san', 'aim', 'tactics', 'coach'];
    rows.forEach((row, index) => {
      const key = keys[index];
      if (!key) return;
      const max = key === 'san' ? state.stats.maxSan : MAX_SKILL;
      const value = state.stats[key] || 0;
      const valueNode = row.querySelector('.stat-label span:last-child');
      const fill = row.querySelector('.progress-fill');
      if (valueNode) valueNode.textContent = `${value}/${max}`;
      if (fill) fill.style.width = `${clamp((value / max) * 100, 0, 100)}%`;
    });

    const objective = document.getElementById('objective-display');
    if (objective && state.started) objective.textContent = '职业选手 · 争夺首发 / 世界排名 / Major';

    const chips = document.querySelectorAll('.player-career-strip .player-career-chip b');
    if (chips[0]) chips[0].textContent = `OVR ${getCareerOvr()}`;
    if (chips[1]) chips[1].textContent = roleLabel(getCareerRole());
    if (chips[2]) chips[2].textContent = `${(teamState.selectionMomentum || 0).toFixed(1)} / 8`;
  }

  // Track transfer-window modals so the mandatory window does not duplicate a
  // window already opened by the underlying team system.
  const monthKey = () => `${state.date.year}-${state.date.month}`;
  let pendingTransferKey = null;
  const originalShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => {
    if (title === '转会窗口') {
      state.flags.transferWindowShownKey = monthKey();
      pendingTransferKey = null;
    }
    return originalShowModal(title, html, buttons);
  };

  const originalCloseModal = ui.closeModal.bind(ui);
  ui.closeModal = () => {
    originalCloseModal();
    if (pendingTransferKey) setTimeout(tryMandatoryTransfer, 80);
  };

  function modalIsOpen() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return false;
    return window.getComputedStyle(overlay).display !== 'none';
  }

  function ensureTransferOffers() {
    if (teamState.activeOffers?.length) return;
    const current = teamSystem.getTeam();
    if (!current) return;
    let candidates = teamSystem.getTeams()
      .filter((t) => t.id !== current.id && t.prestige >= current.prestige - 8 && t.prestige <= current.prestige + 12)
      .sort((a, b) => Math.abs(a.prestige - current.prestige) - Math.abs(b.prestige - current.prestige));
    if (!candidates.length) {
      candidates = teamSystem.getTeams().filter((t) => t.id !== current.id)
        .sort((a, b) => Math.abs(a.prestige - current.prestige) - Math.abs(b.prestige - current.prestige));
    }
    teamState.activeOffers = candidates.slice(0, 3).map((t) => ({
      teamId: t.id,
      signBonus: clamp(1 + Math.round((t.prestige - current.prestige) / 12), 1, 6),
      contractMonths: t.prestige >= 84 ? 24 : 18,
    }));
  }

  function tryMandatoryTransfer() {
    if (!pendingTransferKey || pendingTransferKey !== monthKey()) return;
    if (state.flags.transferWindowShownKey === pendingTransferKey) {
      pendingTransferKey = null;
      return;
    }
    if (modalIsOpen()) return;
    ensureTransferOffers();
    teamSystem.showTransferWindow(false);
  }

  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    previousNextMonth();
    state.phase = 'pro';
    state.flags.ascensionOffered = true;
    if (state.date.month === 1 || state.date.month === 8) {
      const key = monthKey();
      if (state.flags.transferWindowShownKey !== key) {
        pendingTransferKey = key;
        setTimeout(tryMandatoryTransfer, 120);
      }
    }
  };

  const previousRenderWorkstation = ui.renderWorkstation.bind(ui);
  ui.renderWorkstation = () => {
    previousRenderWorkstation();
    collapsePrepDisplay();
  };

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    previousRender();
    updateActionLabels();
    collapsePrepDisplay();
    renderThirtyScale();
  };

  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    if (slot) {
      const prep = typeof slot.eventPrep === 'number'
        ? ensurePrep(slot)
        : Math.round((((slot.savedScores?.tac || 0) + (slot.savedScores?.trn || 0) + (slot.savedScores?.real || 0)) / 3));
      slot.eventPrep = prep;
      slot.savedScores = { tac: prep, trn: prep, real: prep };
    }
    return previousFinalize(slot, mods);
  };

  updateActionLabels();
  console.info('[career-flow-v2] Career starts, 0-30 skills, slower OVR, unified prep and mandatory transfer windows loaded.');
})();
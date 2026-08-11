(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem) {
    console.warn('[career-flow-v2] Core systems are not ready.');
    return;
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const teamState = state.teamSystem;

  state.trainingSystem = state.trainingSystem || {
    aimXp: 0,
    tacticsXp: 0,
    teamXp: 0,
  };

  function roleLabel(role) {
    return ({ reserve: '替补', rotation: '轮换', starter: '首发', core: '队内核心' })[role] || role;
  }

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
    if (route === 'weak') return teams.filter((t) => t.valveRank >= 36);
    return teams.filter((t) => t.valveRank >= 11 && t.valveRank <= 21);
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
        : '你目前仍是替补，需要先通过训练争取进入名单。';
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

    teamState.currentTeamId = team.id;
    teamState.roster = makeRoster(team);
    teamState.contractMonths = 24;
    teamState.joinedYear = state.date.year;
    teamState.joinedMonth = state.date.month;
    teamState.startRoute = route === 'weak' ? 'weak-starter' : 'mid-bench';
    teamState.selectionMomentum = route === 'weak' ? 5.5 : 1.0;
    teamState.initialized = true;
    teamState.lastRole = teamSystem.getRole();
    teamState.lastBalancedRole = teamSystem.getRole();

    // Remove the temporary random-start logs produced by the underlying systems.
    if (Array.isArray(state.logs)) {
      state.logs = state.logs.filter((l) => {
        const msg = l?.msg || '';
        return !msg.startsWith('签约 ') && !msg.startsWith('世界排名系统启动：');
      });
    }

    syncJanuaryEvent();
    const rank = window.tournamentWorld?.getRank?.() || '-';
    const routeText = route === 'weak'
      ? '弱队机会：更容易直接获得首发和核心地位'
      : '中游/较强队试训：阵容更强，需要竞争首发';
    logic.log(`职业起点：${team.name}（快照 Valve #${team.valveRank}）· ${routeText}`, 'pos');
    logic.log(`初始队内地位：${roleLabel(teamSystem.getRole())} · 世界排名 #${rank}`, 'pos');
    ui.render();
  }

  // Role selection is followed by a player-controlled career starting route.
  const existingInit = logic.init.bind(logic);
  logic.init = (roleId) => {
    if (state.started) return existingInit(roleId);
    ui.closeModal();
    setTimeout(() => {
      ui.showModal('选择职业起点', `
        <p style="color:#475569;margin-bottom:12px">出身属性确定后，再选择你希望从什么级别的战队开始职业生涯。</p>
        <div style="display:grid;gap:10px">
          <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:9px;padding:12px">
            <div style="font-weight:800;color:#166534">弱队机会</div>
            <div style="font-size:.82rem;color:#475569;margin-top:4px">从 Valve 快照约 #36 以后战队开始。队友 OVR 较低，更容易直接首发甚至成为核心，但高级赛事资格较少。</div>
          </div>
          <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:9px;padding:12px">
            <div style="font-weight:800;color:#9a3412">中游 / 较强队试训</div>
            <div style="font-size:.82rem;color:#475569;margin-top:4px">从约 #11–21 战队开始。赛事资源更好，但队友更强，通常要从轮换或替补竞争首发。</div>
          </div>
        </div>
      `, [
        {
          text: '选择弱队机会',
          class: 'btn-success',
          cb: () => {
            ui.closeModal();
            setTimeout(() => {
              existingInit(roleId);
              applyStartRoute('weak');
            }, 60);
          },
        },
        {
          text: '选择中游 / 较强队试训',
          class: 'btn-warning',
          cb: () => {
            ui.closeModal();
            setTimeout(() => {
              existingInit(roleId);
              applyStartRoute('mid');
            }, 60);
          },
        },
        {
          text: '返回选择角色',
          class: 'btn-outline',
          cb: () => location.reload(),
        },
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
    // Legacy match code receives one unified variable mirrored into its old fields.
    slot.scores = { tac: prep, trn: prep, real: prep };
  }

  function addMomentum(amount, reason) {
    const old = typeof teamState.selectionMomentum === 'number' ? teamState.selectionMomentum : 4;
    teamState.selectionMomentum = clamp(Math.round((old + amount) * 10) / 10, 0, 8);
    if (reason && teamState.selectionMomentum !== old) {
      logic.log(`首发竞争 ${old.toFixed(1)} → ${teamState.selectionMomentum.toFixed(1)} (${reason})`, amount >= 0 ? 'pos' : 'neg');
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
    if (training[key] >= 2) {
      training[key] -= 2;
      logic.modStat(stat, 1, `${label}积累`);
      return true;
    }
    logic.log(`${label}进度 1/2，下次同类训练可提升永久属性`, 'pos');
    return false;
  }

  // All monthly choices now either develop the player or prepare the current event.
  game.actionDemo = () => {
    logic.modStat('san', -3, '枪法训练');
    gainTrainingXp('aimXp', 'aim', '枪法训练');
    addMomentum(0.5, '个人训练状态');
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
    addMomentum(1.0, '团队训练表现');
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
    const gain = 6;
    setPrep(slot, old + gain);
    logic.modStat('san', -2, '赛事备战');
    logic.log(`赛事准备度 ${old} → ${ensurePrep(slot)}（${slot.name}）`, 'pos');
    finishAction('event-prep');
  };

  function updateActionLabels() {
    const config = {
      'btn-demo': ['fa-crosshairs', '枪法训练', 'SAN-3 | 每2次枪法+1'],
      'btn-work': ['fa-brain', '战术训练', 'SAN-2 | 每2次战术+1'],
      'btn-tactics': ['fa-people-group', '团队训练', 'SAN-2 | 教练/首发竞争'],
      'btn-scrim': ['fa-heart-pulse', '状态恢复', 'SAN+4 | 调整比赛状态'],
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
  };

  // Match resolution receives only the unified preparation value.
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
  console.info('[career-flow-v2] Selectable starting route and unified event preparation loaded.');
})();

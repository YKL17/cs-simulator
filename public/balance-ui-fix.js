(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem) {
    console.warn('[balance-ui-fix] Core systems are not ready.');
    return;
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const ROLE_LABELS = {
    reserve: '替补',
    rotation: '轮换',
    starter: '首发',
    core: '队内核心',
  };

  const teamState = state.teamSystem;
  if (typeof teamState.selectionMomentum !== 'number') teamState.selectionMomentum = 4;
  if (typeof teamState.lastBalancedRole !== 'string') teamState.lastBalancedRole = '';

  function teammateAverageOvr() {
    const roster = Array.isArray(teamState.roster) ? teamState.roster : [];
    if (!roster.length) return 84;
    return roster.reduce((sum, p) => sum + (p.ovr || 0), 0) / roster.length;
  }

  function getBalancedOvr() {
    const score = state.flags.totalScore || 0;
    const majors = state.flags.majorWins || 0;
    const proBonus = state.phase === 'pro' ? 1 : 0;
    const captainBonus = teamState.captain ? 1 : 0;
    const value = 72
      + state.stats.aim * 1.40
      + state.stats.tactics * 0.85
      + state.stats.coach * 0.45
      + score * 0.75
      + majors * 2.5
      + proBonus
      + captainBonus;
    return clamp(Math.round(value), 60, 99);
  }

  function competitionScore() {
    return getBalancedOvr() - teammateAverageOvr() + teamState.selectionMomentum;
  }

  function getBalancedRole() {
    const diff = competitionScore();
    if (diff < -12) return 'reserve';
    if (diff < -6) return 'rotation';
    if (diff < 4) return 'starter';
    return 'core';
  }

  function addSelectionMomentum(amount, reason = '') {
    const old = teamState.selectionMomentum;
    teamState.selectionMomentum = clamp(Math.round((old + amount) * 10) / 10, 0, 8);
    if (reason && Math.abs(teamState.selectionMomentum - old) >= 0.1) {
      logic.log(`首发竞争 ${old.toFixed(1)} → ${teamState.selectionMomentum.toFixed(1)} (${reason})`, amount >= 0 ? 'pos' : 'neg');
    }
  }

  function syncBalancedRole(logChange = true) {
    if (!state.started || !teamState.initialized) return;
    const role = getBalancedRole();
    if (!teamState.lastBalancedRole) {
      teamState.lastBalancedRole = role;
      return;
    }
    if (teamState.lastBalancedRole !== role) {
      const old = teamState.lastBalancedRole;
      teamState.lastBalancedRole = role;
      if (logChange) {
        logic.log(`队内地位：${ROLE_LABELS[old]} → ${ROLE_LABELS[role]}`, role === 'reserve' ? 'neg' : 'pos');
        if (role === 'starter' || role === 'core') logic.modStat('san', 1, '获得更多上场机会');
      }
    }
  }

  // Replace the exposed rating/role calculations used by the tournament system.
  teamSystem.getUserOvr = getBalancedOvr;
  teamSystem.getRole = getBalancedRole;

  // Hide the legacy role-change log, which still uses the old OVR model internally.
  const originalLog = logic.log.bind(logic);
  logic.log = (msg, type = 'normal') => {
    if (typeof msg === 'string' && msg.startsWith('队内地位变化：')) return;
    if (typeof msg === 'string' && msg.startsWith('签约 ') && msg.includes('，身份：')) {
      const prefix = msg.split('，身份：')[0];
      msg = `${prefix}，身份：${ROLE_LABELS[getBalancedRole()]}`;
    }
    return originalLog(msg, type);
  };

  function relationLabel(value) {
    if (value < 25) return '关系紧张';
    if (value < 45) return '生疏';
    if (value < 65) return '正常';
    if (value < 80) return '默契';
    return '挚友';
  }

  function currentTeamRow() {
    try {
      return window.tournamentWorld?.getRankings?.().find((r) => r.id === teamState.currentTeamId) || null;
    } catch (_) {
      return null;
    }
  }

  // Replace the team hub so the same OVR/role shown in tournaments is visible here too.
  const originalInteract = teamSystem.interact.bind(teamSystem);
  const originalShowTransferWindow = teamSystem.showTransferWindow.bind(teamSystem);
  teamSystem.interact = originalInteract;
  teamSystem.showTransferWindow = originalShowTransferWindow;
  teamSystem.openHub = () => {
    const team = currentTeamRow();
    const roster = Array.isArray(teamState.roster) ? teamState.roster : [];
    const avgRelation = roster.length
      ? Math.round(roster.reduce((sum, p) => sum + (p.relation || 0), 0) / roster.length)
      : 50;
    const teammateAvg = Math.round(teammateAverageOvr());
    const role = getBalancedRole();
    const ovr = getBalancedOvr();
    const diff = competitionScore();
    const rosterHtml = roster.map((player) => `
      <div class="teammate-card">
        <div class="teammate-head">
          <div>
            <div class="teammate-name">${player.name}</div>
            <div class="teammate-meta">${player.role} · OVR ${player.ovr}</div>
          </div>
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
        <div>
          <div style="font-size:1.2rem;font-weight:800">${team?.name || teamState.currentTeamId || '当前战队'}</div>
          <div style="font-size:.8rem;color:#64748b">队友平均 OVR ${teammateAvg}${team?.rank ? ` · 世界 #${team.rank}` : ''}</div>
        </div>
        <span class="result-tag res-top4" style="font-size:.8rem">${ROLE_LABELS[role]}</span>
      </div>
      <div class="team-summary-grid">
        <div class="team-summary-card"><div class="team-summary-value">${ovr}</div><div class="team-summary-label">你的 OVR</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${diff >= 0 ? '+' : ''}${diff.toFixed(1)}</div><div class="team-summary-label">首发竞争值</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${teamState.selectionMomentum.toFixed(1)}</div><div class="team-summary-label">近期训练状态</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${avgRelation}</div><div class="team-summary-label">队内化学反应</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${teamState.contractMonths}</div><div class="team-summary-label">合同剩余（月）</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${teamSystem.marketValue()}</div><div class="team-summary-label">市场身价</div></div>
      </div>
      <div style="font-size:.78rem;color:#64748b;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:8px;margin-bottom:10px">
        队内地位不再只看你和队友的 OVR 差距。训练赛、天梯和正式比赛会积累“近期训练状态”，帮助你从轮换竞争到首发；长期不训练则会缓慢回落。
      </div>
      <div style="font-weight:700;margin-bottom:8px">队友</div>
      ${rosterHtml}
      ${teamState.activeOffers?.length ? `<button class="btn btn-warning" style="width:100%;margin-top:6px" onclick="teamSystem.showTransferWindow()"><i class="fa-solid fa-right-left"></i> 查看 ${teamState.activeOffers.length} 份转会报价</button>` : ''}
    `, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  };

  function injectStyles() {
    if (document.getElementById('balance-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'balance-ui-styles';
    style.textContent = `
      .player-career-strip {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:5px;
        margin:0 0 9px;
        padding:7px;
        border:1px solid #dbeafe;
        border-radius:8px;
        background:#eff6ff;
      }
      .player-career-chip { min-width:0; }
      .player-career-chip b { display:block; font-size:.86rem; color:#1d4ed8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .player-career-chip span { display:block; font-size:.66rem; color:#64748b; margin-top:1px; }

      @media (min-width:1201px) {
        .area-actions { min-height:0 !important; overflow:hidden !important; }
        .area-actions .action-grid {
          flex:1 !important;
          height:auto !important;
          min-height:0 !important;
          overflow:hidden !important;
          grid-template-columns:repeat(3,minmax(0,1fr)) !important;
          grid-template-rows:repeat(2,minmax(0,1fr)) !important;
          gap:7px !important;
          padding:8px !important;
        }
        .area-actions .action-btn {
          height:100% !important;
          min-height:0 !important;
          min-width:0 !important;
          padding:6px 5px !important;
          gap:3px !important;
          font-size:.82rem !important;
          line-height:1.08 !important;
          overflow:hidden !important;
        }
        .area-actions .action-btn i { font-size:1.05rem !important; margin-bottom:0 !important; }
        .area-actions .action-btn span { font-size:.66rem !important; line-height:1.12 !important; white-space:normal !important; }
      }
      @media (min-width:1201px) and (max-height:760px) {
        #game-container { height:calc(100dvh - 16px) !important; grid-template-rows:50px minmax(0,1fr) 168px !important; gap:10px !important; }
        .area-actions .action-grid { padding:6px !important; gap:5px !important; }
        .area-actions .action-btn { font-size:.77rem !important; padding:4px !important; }
        .area-actions .action-btn span { font-size:.62rem !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function planningSlots() {
    return state.slots.filter((slot) => slot.status === 'planning' && slot.scores);
  }

  function buffValue(effectType) {
    const buff = state.buffs.find((b) => b.effectType === effectType);
    if (!buff) return 0;
    const value = buff.val || 0;
    if (buff.temp) logic.consumeBuff(effectType);
    return value;
  }

  function raisePrep(slot, key, amount, label) {
    const old = slot.scores[key] || 0;
    const next = clamp(old + amount, 0, 20);
    slot.scores[key] = next;
    if (next > old) logic.log(`${label} ${old} → ${next}`, 'pos');
  }

  function finishAction(key) {
    state.flags.usedMonthlyActions.push(key);
    syncBalancedRole(true);
    ui.render();
  }

  // Rebalanced actions: every option has a distinct, predictable purpose.
  game.actionDemo = () => {
    const cost = logic.hasBuff('monitor') ? 0 : -1;
    if (cost) logic.modStat('san', cost, '看 Demo');
    logic.modStat('tactics', 1, '录像学习');
    addSelectionMomentum(0.2, '保持比赛理解');
    finishAction('demo');
  };

  game.actionWork = () => {
    logic.modStat('san', -3, '打工');
    logic.modStat('money', 3, '打工');
    addSelectionMomentum(-0.2, '减少团队训练时间');
    finishAction('work');
  };

  game.actionTactics = () => {
    logic.modStat('san', -2, '战术准备');
    const bonus = buffValue('tactics_score');
    const gain = 3 + Math.floor(state.stats.tactics / 7) + bonus;
    planningSlots().forEach((slot) => raisePrep(slot, 'tac', gain, '赛事战术分'));
    addSelectionMomentum(0.5, '战术训练');
    finishAction('tactics');
  };

  game.actionScrim = () => {
    logic.modStat('san', -2, '训练赛');
    let sessions = 1 + (logic.hasBuff('server_buy') ? 1 : 0) + (logic.hasBuff('server_rent') ? 1 : 0);
    if (logic.hasBuff('server_rent')) logic.consumeBuff('train_count');
    const lesson = buffValue('scrim_score');
    const perSession = 3 + Math.floor(state.stats.coach / 7);
    planningSlots().forEach((slot) => raisePrep(slot, 'trn', perSession * sessions + lesson, '赛事训练分'));
    state.flags.balanceScrimCount = (state.flags.balanceScrimCount || 0) + 1;
    if (state.flags.balanceScrimCount % 2 === 0) logic.modStat('coach', 1, '稳定训练赛表现');
    addSelectionMomentum(1.5, '训练赛表现');
    finishAction('scrim');
  };

  game.actionLadder = () => {
    const cost = logic.hasBuff('keyboard') ? -1 : -3;
    logic.modStat('san', cost, '打天梯');
    const bonus = buffValue('ladder_score');
    const gain = 3 + Math.floor((state.stats.aim + state.stats.tactics) / 12) + bonus;
    planningSlots().forEach((slot) => raisePrep(slot, 'real', gain, '赛事实战分'));
    state.flags.balanceLadderCount = (state.flags.balanceLadderCount || 0) + 1;
    if (state.flags.balanceLadderCount % 2 === 0) logic.modStat('aim', 1, '持续天梯训练');
    addSelectionMomentum(1.0, '天梯状态');
    finishAction('ladder');
  };

  // Decay recent form a little each month so lineup status reacts to current training.
  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    const result = previousNextMonth();
    addSelectionMomentum(-0.5, '月度状态衰减');
    syncBalancedRole(true);
    return result;
  };

  // Formal matches now create a visible personal Rating and affect lineup momentum.
  const previousFinalizeMatch = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    const before = state.history.length;
    const result = previousFinalizeMatch(slot, mods);
    if (state.history.length > before) {
      const record = state.history[state.history.length - 1];
      const outcomeBonus = record.result.includes('冠军') ? 0.20
        : record.result.includes('亚军') || record.result.includes('决赛') ? 0.13
        : record.result.includes('四强') ? 0.08
        : record.result.includes('八强') ? 0.04
        : record.result.includes('出局') ? -0.08 : 0;
      const rating = clamp(0.78 + (getBalancedOvr() - 70) * 0.012 + outcomeBonus + (Math.random() * 0.18 - 0.09), 0.70, 1.55);
      record.rating = Number(rating.toFixed(2));
      if (!record.result.includes('R ')) record.result = `${record.result} · R ${record.rating.toFixed(2)}`;
      if (rating >= 1.18) addSelectionMomentum(1.6, '正式比赛高评分');
      else if (rating >= 1.05) addSelectionMomentum(0.8, '正式比赛表现稳定');
      else if (rating < 0.90) addSelectionMomentum(-0.8, '正式比赛状态不佳');
      logic.log(`个人 Rating ${record.rating.toFixed(2)} · OVR ${getBalancedOvr()} · ${ROLE_LABELS[getBalancedRole()]}`, rating >= 1.05 ? 'pos' : (rating < 0.90 ? 'neg' : 'normal'));
      syncBalancedRole(true);
      ui.render();
    }
    return result;
  };

  function renderPlayerStatus() {
    if (!state.started) return;
    const stats = document.getElementById('stats-container');
    if (!stats) return;
    const role = getBalancedRole();
    const ovr = getBalancedOvr();
    let rank = '-';
    try { rank = window.tournamentWorld?.getRank?.() || '-'; } catch (_) {}
    const html = `
      <div id="player-career-strip" class="player-career-strip">
        <div class="player-career-chip"><b>OVR ${ovr}</b><span>综合评分</span></div>
        <div class="player-career-chip"><b>${ROLE_LABELS[role]}</b><span>队内地位</span></div>
        <div class="player-career-chip"><b>${teamState.selectionMomentum.toFixed(1)} / 8</b><span>近期训练状态</span></div>
        <div class="player-career-chip"><b>#${rank}</b><span>战队世界排名</span></div>
      </div>`;
    stats.insertAdjacentHTML('afterbegin', html);
  }

  function updateActionLabels() {
    const labels = {
      'btn-demo': ['fa-video', '看 Demo', 'SAN-1 | 战术+1'],
      'btn-work': ['fa-briefcase', '打工', 'SAN-3 | 金币+3'],
      'btn-tactics': ['fa-chess-board', '想战术', 'SAN-2 | 战术备战 +3~5'],
      'btn-scrim': ['fa-crosshairs', '打训练赛', 'SAN-2 | 训练备战 | 首发竞争++'],
      'btn-ladder': ['fa-list-ol', '打天梯', 'SAN-3 | 实战备战 | 每2次枪法+1'],
      'btn-next': ['fa-calendar-check', '进入下个月', '结算赛历 / 恢复 / 事件'],
    };
    Object.entries(labels).forEach(([id, [icon, title, desc]]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${title}<span>${desc}</span>`;
    });
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    previousRender();
    renderPlayerStatus();
    updateActionLabels();
    syncBalancedRole(false);
  };

  injectStyles();
  updateActionLabels();
  console.info('[balance-ui-fix] Rebalanced OVR, lineup progression, actions and desktop layout.');
})();
(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem) {
    console.warn('[team-chemistry-prep-v8] Required systems are not ready.');
    return;
  }

  const teamState = state.teamSystem;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const monthKey = () => `${state.date.year}-${state.date.month}`;
  const isMajorMonth = () => state.date.month === 6 || state.date.month === 12;
  const majorKey = () => `${state.date.year}-${state.date.month === 6 ? 'spring' : 'winter'}`;
  const relationLabel = (v) => v < 25 ? '关系紧张' : v < 45 ? '生疏' : v < 65 ? '正常' : v < 80 ? '默契' : '高度默契';

  function rosterAverage() {
    const roster = Array.isArray(teamState.roster) ? teamState.roster : [];
    if (!roster.length) return 50;
    return Math.round(roster.reduce((sum, p) => sum + Number(p.relation || 50), 0) / roster.length);
  }

  function syncSharedRelation(forceNewTeam = false) {
    const teamId = teamState.currentTeamId || null;
    if (forceNewTeam || teamState.relationshipTeamId !== teamId || typeof teamState.sharedRelation !== 'number') {
      teamState.sharedRelation = clamp(rosterAverage(), 0, 100);
      teamState.relationshipTeamId = teamId;
    }
    const value = clamp(Math.round(teamState.sharedRelation), 0, 100);
    teamState.sharedRelation = value;
    if (Array.isArray(teamState.roster)) teamState.roster.forEach((p) => { p.relation = value; });
    return value;
  }

  function changeRelation(delta, reason = '') {
    const old = syncSharedRelation();
    const next = clamp(old + delta, 0, 100);
    teamState.sharedRelation = next;
    if (Array.isArray(teamState.roster)) teamState.roster.forEach((p) => { p.relation = next; });
    if (reason && next !== old) logic.log(`队内关系 ${old} → ${next}（${reason}）`, delta >= 0 ? 'pos' : 'neg');
    return next;
  }

  // One team-wide chemistry score replaces per-player relationship values.
  teamSystem.averageRelation = () => syncSharedRelation();
  teamSystem.addRelation = (_id, delta, reason = '') => changeRelation(delta, reason);
  teamSystem.addAllRelations = (delta, reason = '') => changeRelation(delta, reason);

  function markAction(key) {
    state.flags.usedMonthlyActions = state.flags.usedMonthlyActions || [];
    state.flags.usedMonthlyActions.push(key);
    ui.render();
  }

  // Free monthly action: improve chemistry by spending time, not money.
  game.actionTactics = () => {
    logic.modStat('san', -2, '团队磨合');
    logic.modStat('coach', 1, '团队训练表现');
    changeRelation(3, '团队训练与沟通');
    teamState.selectionMomentum = clamp((teamState.selectionMomentum || 0) + 0.7, 0, 8);
    markAction('team-training');
  };

  function prepIdentity(slot) {
    if (!slot) return null;
    if (isMajorMonth() && state.tournamentWorld?.currentEvent?.type === 'major') return `major-prep-${majorKey()}`;
    return slot.worldEventId || state.tournamentWorld?.currentEvent?.id || slot.name || 'current-event';
  }

  function currentPrepSlot() {
    const slot = state.slots?.[0];
    if (!slot) return null;
    const event = state.tournamentWorld?.currentEvent;
    const active = slot.status === 'planning' || (event && event.status === 'planning' && event.invited !== false);
    return active ? slot : null;
  }

  function normalizePrep(slot) {
    if (!slot) return 0;
    const id = prepIdentity(slot);
    if (slot.prepEventId !== id) {
      // If this is the same visible event but an older layer used another key,
      // preserve the displayed preparation instead of wiping it.
      const mirrored = slot.scores
        ? Math.round(((slot.scores.tac || 0) + (slot.scores.trn || 0) + (slot.scores.real || 0)) / 3)
        : Number(slot.eventPrep || 0);
      slot.eventPrep = clamp(Math.max(Number(slot.eventPrep || 0), mirrored), 0, 20);
      slot.prepEventId = id;
    }
    slot.eventPrep = clamp(Math.round(Number(slot.eventPrep || 0)), 0, 20);
    slot.scores = { tac: slot.eventPrep, trn: slot.eventPrep, real: slot.eventPrep };
    return slot.eventPrep;
  }

  // Single preparation path for C/B/A/S and Major.
  game.actionLadder = () => {
    const slot = currentPrepSlot();
    if (!slot) {
      ui.showModal('本月没有可备战赛事', '当前没有你可以参加并准备的正式赛事。本月可以进行个人训练、团队磨合或状态恢复。', [
        { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      return;
    }
    const old = normalizePrep(slot);
    const next = clamp(old + 6, 0, 20);
    slot.eventPrep = next;
    slot.prepEventId = prepIdentity(slot);
    slot.scores = { tac: next, trn: next, real: next };
    slot.savedScores = { tac: next, trn: next, real: next };
    logic.modStat('san', -2, '赛事备战');
    logic.log(`赛事准备度 ${old} → ${next}（${slot.name || '当前赛事'}）`, 'pos');
    markAction('event-prep');
  };

  function hasMoney(cost) {
    if ((state.stats.money || 0) < cost) {
      ui.showModal('资金不足', `需要 ${cost} 金币，当前只有 ${state.stats.money || 0}。`, [{ text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() }]);
      return false;
    }
    return true;
  }

  function finishPaidInteraction(cost, gain, label, sanGain = 0) {
    if (!hasMoney(cost)) return;
    logic.modStat('money', -cost, label);
    if (sanGain) logic.modStat('san', sanGain, label);
    changeRelation(gain, label);
    state.flags.teamInteractionMonth = monthKey();
    ui.closeModal();
    ui.render();
    setTimeout(() => teamSystem.openHub(), 100);
  }

  function openPaidInteraction() {
    const relation = syncSharedRelation();
    if (state.flags.teamInteractionMonth === monthKey()) {
      ui.showModal('本月已经互动过', `本月已经安排过一次额外队友活动。当前队内关系 <strong>${relation}</strong>。`, [{ text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() }]);
      return;
    }
    ui.showModal('队友互动', `<p>当前队内关系：<strong>${relation}/100</strong>（${relationLabel(relation)}）</p><p style="font-size:.82rem;color:#64748b;margin-top:6px">这里的互动不占训练行动，但需要花钱。关系提升作用于整支队伍，不再区分单个队友。</p>`, [
      { text: '请全队喝饮料 · 1金币 · 关系+5', class: 'btn-outline', cb: () => finishPaidInteraction(1, 5, '请全队喝饮料', 0) },
      { text: '赛后聚餐 · 2金币 · 关系+9', class: 'btn-primary', cb: () => finishPaidInteraction(2, 9, '赛后聚餐', 1) },
      { text: '休息日团建 · 3金币 · 关系+13', class: 'btn-warning', cb: () => finishPaidInteraction(3, 13, '休息日团建', 2) },
      { text: '取消', class: 'btn-outline', cb: () => { ui.closeModal(); setTimeout(() => teamSystem.openHub(), 80); } },
    ]);
  }

  // Auto-close the team hub before opening the secondary interaction modal.
  teamSystem.interact = () => {
    ui.closeModal();
    setTimeout(openPaidInteraction, 80);
  };

  function openUnifiedHub() {
    syncSharedRelation();
    const team = teamSystem.getTeam();
    if (!team) return;
    const relation = teamState.sharedRelation;
    const roleMap = { reserve: '替补', rotation: '轮换', starter: '首发', core: '队内核心' };
    const role = teamSystem.getRole();
    const avgOvr = Math.round(teamSystem.teammateAverageOvr?.() || team.base || 75);
    const worldRank = tournamentWorld?.getRankings?.().find((r) => r.id === team.id)?.rank || '-';
    const rosterHtml = (teamState.roster || []).map((p) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 9px;border-bottom:1px solid #f1f5f9"><span><strong>${p.name}</strong> <span style="font-size:.76rem;color:#64748b">${p.role}</span></span><span style="font-size:.78rem;color:#475569">OVR ${p.ovr}</span></div>`).join('');
    ui.showModal('战队中心', `<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:12px"><div><div style="font-size:1.2rem;font-weight:800">${team.name}</div><div style="font-size:.8rem;color:#64748b">模拟世界 #${worldRank} · Valve快照 #${team.valveRank}</div></div><span class="result-tag res-top4">${roleMap[role] || role}</span></div>
      <div class="team-summary-grid"><div class="team-summary-card"><div class="team-summary-value">${teamSystem.getUserOvr()}</div><div class="team-summary-label">你的 OVR</div></div><div class="team-summary-card"><div class="team-summary-value">${avgOvr}</div><div class="team-summary-label">队友平均 OVR</div></div><div class="team-summary-card"><div class="team-summary-value">${relation}</div><div class="team-summary-label">队内关系</div></div><div class="team-summary-card"><div class="team-summary-value">${teamState.contractMonths}</div><div class="team-summary-label">合同剩余（月）</div></div></div>
      <div style="margin:8px 0 12px"><div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:4px"><span>${relationLabel(relation)}</span><strong>${relation}/100</strong></div><div class="relation-track"><div class="relation-fill" style="width:${relation}%"></div></div></div>
      <button class="btn btn-primary" style="width:100%;margin-bottom:10px" onclick="teamSystem.interact()"><i class="fa-solid fa-utensils"></i> 队友互动（花钱提升关系）</button>
      <div style="font-weight:700;margin:8px 0">当前阵容</div><div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${rosterHtml}</div>
      ${teamState.activeOffers?.length ? `<button class="btn btn-warning" style="width:100%;margin-top:10px" onclick="teamSystem.showTransferWindow()">查看 ${teamState.activeOffers.length} 份转会报价</button>` : ''}
      <div style="font-size:.76rem;color:#64748b;margin-top:10px">免费提升关系：使用操作栏“团队磨合”。额外互动则用金币换取更大的关系提升。</div>`, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  }
  teamSystem.openHub = openUnifiedHub;

  function rewriteLabels() {
    const teamBtn = document.getElementById('btn-tactics');
    if (teamBtn) teamBtn.innerHTML = '<i class="fa-solid fa-people-group"></i> 团队磨合<span style="font-size:.75rem;color:#6b7280">SAN-2 | 教练+1 · 关系+3</span>';
    const prepBtn = document.getElementById('btn-ladder');
    if (prepBtn) prepBtn.innerHTML = '<i class="fa-solid fa-clipboard-check"></i> 赛事备战<span style="font-size:.75rem;color:#6b7280">SAN-2 | 当前赛事准备+6</span>';
  }

  const previousFinalize = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods) => {
    syncSharedRelation();
    if (slot) normalizePrep(slot);
    return previousFinalize(slot, mods);
  };

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    syncSharedRelation();
    const out = previousRender();
    rewriteLabels();
    return out;
  };

  syncSharedRelation();
  rewriteLabels();
  window.teamChemistryPrepV8 = { syncSharedRelation, changeRelation, normalizePrep };
  console.info('[team-chemistry-prep-v8] Unified chemistry and preparation state loaded.');
})();
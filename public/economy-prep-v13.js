(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.careerBalanceV3) {
    console.warn('[economy-prep-v13] Required systems are not ready.');
    return;
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const teamState = state.teamSystem;
  const monthKey = () => `${state.date.year}-${state.date.month}`;
  const primarySlot = () => state.slots?.[0] || null;
  const prepApi = () => window.prepStateFixV12 || window.prepNameFixV9 || null;

  function canPrepare() {
    const event = state.tournamentWorld?.currentEvent;
    const slot = primarySlot();
    const api = prepApi();
    if (!event || !slot || !api?.prepKey?.()) return false;
    if (event.status !== 'planning' || event.invited === false) return false;
    return slot.status === 'planning';
  }

  function addPreparation(amount, reason) {
    const api = prepApi();
    if (!api || !canPrepare()) return null;
    const old = clamp(Math.round(Number(api.syncPrep?.({ capture: true }) ?? primarySlot()?.eventPrep ?? 0)), 0, 20);
    const next = clamp(old + amount, 0, 20);
    api.applyPrep(next);
    logic.log(`赛事准备度 ${old} → ${next}（${reason}）`, 'pos');
    return { old, next };
  }

  // Free monthly preparation is deliberately strong: one action gives +10.
  game.actionLadder = () => {
    if (!canPrepare()) {
      ui.showModal('本月没有可备战赛事', '当前没有你已经进入名单、可以进行备战的正式赛事。', [
        { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      return;
    }
    const changed = addPreparation(10, state.tournamentWorld?.currentEvent?.name || '当前赛事');
    if (!changed) return;
    logic.modStat('san', -2, '赛事备战');
    state.flags.usedMonthlyActions = state.flags.usedMonthlyActions || [];
    state.flags.usedMonthlyActions.push('event-prep');
    ui.render();
  };

  function rewritePreparationLabel() {
    const button = document.getElementById('btn-ladder');
    if (!button) return;
    button.innerHTML = '<i class="fa-solid fa-clipboard-check"></i> 赛事备战<span style="font-size:.75rem;color:#6b7280">SAN-2 | 当前赛事准备+10</span>';
  }

  function shopCard(icon, name, desc, cost, action, disabled = false, extra = '') {
    return `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px;border:1px solid #e5e7eb;border-radius:9px;margin-bottom:8px;${extra}">
      <div style="display:flex;gap:10px;align-items:center"><div style="width:38px;height:38px;border-radius:50%;background:#f3f4f6;display:flex;align-items:center;justify-content:center"><i class="fa-solid ${icon}"></i></div><div><div style="font-weight:800">${name}</div><div style="font-size:.78rem;color:#64748b">${desc}</div></div></div>
      <button class="btn btn-primary" ${disabled ? 'disabled' : ''} onclick="careerBalanceV3.buy('${action}')">${cost === 0 ? '彩蛋' : cost + '金币'}</button>
    </div>`;
  }

  const previousShopBuy = window.careerBalanceV3.buy.bind(window.careerBalanceV3);

  function openShop() {
    const money = Number(state.stats.money || 0);
    const cheatUsed = !!state.flags.careerCheatUsed;
    const prepAvailable = canPrepare();
    const html = `
      <div style="font-size:.8rem;color:#64748b;margin-bottom:10px">金币 ${money} · 付费服务价格已按职业生涯后期经济重新平衡。</div>
      ${shopCard('fa-bottle-water', '运动恢复包', 'SAN +4。', 10, 'recovery', money < 10)}
      ${shopCard('fa-chart-line', '分析师加班', '当前赛事准备度 +5。', 20, 'analyst', money < 20 || !prepAvailable)}
      ${shopCard('fa-people-roof', '专项赛事集训', '当前赛事准备度 +10。', 40, 'intensive-prep', money < 40 || !prepAvailable, 'border-color:#bfdbfe;background:#eff6ff;')}
      ${shopCard('fa-dumbbell', '私人教练课', '首发竞争状态 +1.5。', 20, 'coach', money < 20)}
      ${shopCard('fa-utensils', '全队聚餐', 'SAN +2，队内关系 +5。', 20, 'dinner', money < 20)}
      ${shopCard('fa-wand-magic-sparkles', '小金手指', cheatUsed ? '本生涯已经使用过。' : '整个生涯仅一次，可把一个专项属性直接改成任意 0–30 数值。', 0, 'cheat', cheatUsed, 'border-style:dashed;background:#fffbeb;')}
      <div style="font-size:.74rem;color:#94a3b8;margin-top:8px">赛事准备最高 20/20。分析师 +5；专项赛事集训 +10。小金手指仍是免费彩蛋。</div>`;
    ui.showModal('职业商店', html, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  }

  function spend(cost, label) {
    if ((state.stats.money || 0) < cost) return false;
    logic.modStat('money', -cost, label);
    return true;
  }

  function buy(action) {
    if (action === 'cheat') return previousShopBuy('cheat');

    if (action === 'recovery') {
      if (!spend(10, '购买运动恢复包')) return;
      logic.modStat('san', 4, '运动恢复包');
    } else if (action === 'analyst') {
      if (!canPrepare() || !spend(20, '聘请分析师加班')) return;
      addPreparation(5, '分析师加班');
    } else if (action === 'intensive-prep') {
      if (!canPrepare() || !spend(40, '参加专项赛事集训')) return;
      addPreparation(10, '专项赛事集训');
    } else if (action === 'coach') {
      if (!spend(20, '私人教练课')) return;
      const old = Number(teamState.selectionMomentum || 0);
      const next = clamp(old + 1.5, 0, 8);
      teamState.selectionMomentum = next;
      logic.log(`首发竞争 ${old.toFixed(1)} → ${next.toFixed(1)}（私人教练课）`, 'pos');
    } else if (action === 'dinner') {
      if (!spend(20, '全队聚餐')) return;
      logic.modStat('san', 2, '全队聚餐');
      teamSystem.addAllRelations?.(5, '全队聚餐');
    } else {
      return previousShopBuy(action);
    }

    ui.closeModal();
    ui.render();
  }

  window.careerBalanceV3.openShop = openShop;
  window.careerBalanceV3.buy = buy;
  game.openShop = openShop;

  function hasMoney(cost) {
    if ((state.stats.money || 0) >= cost) return true;
    ui.showModal('资金不足', `需要 ${cost} 金币，当前只有 ${state.stats.money || 0}。`, [
      { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
    ]);
    return false;
  }

  function finishPaidInteraction(cost, gain, label, sanGain = 0) {
    if (!hasMoney(cost)) return;
    logic.modStat('money', -cost, label);
    if (sanGain) logic.modStat('san', sanGain, label);
    teamSystem.addAllRelations?.(gain, label);
    state.flags.teamInteractionMonth = monthKey();
    ui.closeModal();
    ui.render();
    setTimeout(() => teamSystem.openHub(), 100);
  }

  function openPaidInteraction() {
    const relation = typeof teamSystem.averageRelation === 'function' ? teamSystem.averageRelation() : 50;
    if (state.flags.teamInteractionMonth === monthKey()) {
      ui.showModal('本月已经互动过', `本月已经安排过一次额外队友活动。当前队内关系 <strong>${relation}</strong>。`, [
        { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      return;
    }
    ui.showModal('队友互动', `<p>当前队内关系：<strong>${relation}/100</strong></p><p style="font-size:.82rem;color:#64748b;margin-top:6px">额外互动每月一次，不占训练行动；价格提高为原来的10倍。</p>`, [
      { text: '请全队喝饮料 · 10金币 · 关系+5', class: 'btn-outline', cb: () => finishPaidInteraction(10, 5, '请全队喝饮料', 0) },
      { text: '赛后聚餐 · 20金币 · 关系+9', class: 'btn-primary', cb: () => finishPaidInteraction(20, 9, '赛后聚餐', 1) },
      { text: '休息日团建 · 30金币 · 关系+13', class: 'btn-warning', cb: () => finishPaidInteraction(30, 13, '休息日团建', 2) },
      { text: '取消', class: 'btn-outline', cb: () => { ui.closeModal(); setTimeout(() => teamSystem.openHub(), 80); } },
    ]);
  }

  teamSystem.interact = () => {
    ui.closeModal();
    setTimeout(openPaidInteraction, 80);
  };

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    rewritePreparationLabel();
    return out;
  };

  rewritePreparationLabel();
  window.economyPrepV13 = { addPreparation, canPrepare, openShop, openPaidInteraction };
  console.info('[economy-prep-v13] Prep +10 action, premium prep shop option, and 10x paid economy loaded.');
})();

(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.tournamentWorld) {
    console.warn('[prep-state-fix-v12] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const primarySlot = () => state.slots?.[0] || null;
  const isMajorMonth = (month = state.date.month) => month === 6 || month === 12;
  const majorHalf = (month = state.date.month) => month === 6 ? 'spring' : 'winter';

  world.v4 = world.v4 || {};
  world.v4.prepByEventV12 = world.v4.prepByEventV12 || {};
  world.v4.prepStateVersion = 12;
  const prepStore = world.v4.prepByEventV12;

  function prepKey(event = world.currentEvent) {
    if (!event) return null;
    if (isMajorMonth() && (event.type === 'major' || event.majorOnlyV7 || event.level === 'Major')) {
      return `major:${state.date.year}:${majorHalf()}`;
    }
    if (event.type === 'ranked' && ['S', 'A', 'B', 'C'].includes(event.level)) {
      return `regular:${event.key || event.id || `${state.date.year}-${state.date.month}-${event.level}`}`;
    }
    return null;
  }

  function canonicalPrepId(event = world.currentEvent) {
    if (!event) return null;
    if (isMajorMonth() && (event.type === 'major' || event.majorOnlyV7 || event.level === 'Major')) {
      return `major-prep-${state.date.year}-${majorHalf()}`;
    }
    return event.id || event.key || null;
  }

  function slotBelongsToCurrentEvent(slot = primarySlot(), event = world.currentEvent) {
    if (!slot || !event) return false;
    return slot.__prepV12Key === prepKey(event)
      || slot.worldEventId === event.id
      || slot.worldEventKey === event.key
      || slot.prepEventId === canonicalPrepId(event);
  }

  // IMPORTANT: savedScores is deliberately excluded. It is a match-start
  // snapshot and may belong to the previous tournament. Reading it back as
  // preparation was the source of the permanent 20/20 leak.
  function liveSlotPrep(slot = primarySlot()) {
    if (!slot) return 0;
    const values = [Number(slot.eventPrep || 0)];
    if (slot.scores) {
      values.push(Math.round(((Number(slot.scores.tac) || 0)
        + (Number(slot.scores.trn) || 0)
        + (Number(slot.scores.real) || 0)) / 3));
    }
    return clamp(Math.max(...values.filter(Number.isFinite), 0), 0, 20);
  }

  function currentDateLabel() {
    return `Y${state.date.year}/M${state.date.month}`;
  }

  // Existing saves may already contain an inherited v9 value. Rebuild the
  // current tournament's preparation from actual preparation logs in this
  // month. Both the free action and analyst purchase log old -> new values.
  function rebuildCurrentPrepFromLogs() {
    if (!Array.isArray(state.logs)) return 0;
    const date = currentDateLabel();
    let gained = 0;
    state.logs.forEach((row) => {
      if (row?.date !== date) return;
      const msg = String(row?.msg || '');
      const match = msg.match(/赛事准备度\s*(\d+)\s*→\s*(\d+)/);
      if (!match) return;
      const oldValue = Number(match[1]);
      const newValue = Number(match[2]);
      if (Number.isFinite(oldValue) && Number.isFinite(newValue) && newValue > oldValue) {
        gained += newValue - oldValue;
      }
    });
    return clamp(Math.round(gained), 0, 20);
  }

  function initializeStoreForCurrentEvent(key) {
    if (!key || Object.prototype.hasOwnProperty.call(prepStore, key)) return;
    // V12 is a migration boundary. Do not trust v9's current value because it
    // may have been copied from the previous event's savedScores.
    prepStore[key] = rebuildCurrentPrepFromLogs();
  }

  function applyPrep(value) {
    const event = world.currentEvent;
    const key = prepKey(event);
    const slot = primarySlot();
    if (!key || !slot) return 0;

    const prep = clamp(Math.round(Number(value || 0)), 0, 20);
    const prepId = canonicalPrepId(event);
    prepStore[key] = prep;

    // Keep the older store synchronized so its render wrapper cannot resurrect
    // a stale value on the next render.
    if (world.v4.prepByEventV9) world.v4.prepByEventV9[key] = prep;

    slot.__prepV12Key = key;
    slot.__prepV9Key = key;
    slot.prepEventId = prepId;
    slot.eventPrep = prep;
    slot.scores = { tac: prep, trn: prep, real: prep };
    if (event) event.eventPrep = prep;

    // A savedScores snapshot is valid only while a match is actually resolving.
    // During planning it must never survive from a previous event.
    if (slot.status !== 'resolving') delete slot.savedScores;
    return prep;
  }

  function clearInactiveSnapshot() {
    const slot = primarySlot();
    const event = world.currentEvent;
    if (!slot) return;
    if (prepKey(event)) return;
    if (slot.status === 'empty' || event?.status === 'completed' || event?.type === 'break') {
      slot.eventPrep = 0;
      if (slot.scores) slot.scores = { tac: 0, trn: 0, real: 0 };
      delete slot.savedScores;
      delete slot.__prepV12Key;
    }
  }

  function syncPrep({ capture = true } = {}) {
    const event = world.currentEvent;
    const key = prepKey(event);
    const slot = primarySlot();
    if (!key || !slot) {
      clearInactiveSnapshot();
      return 0;
    }

    initializeStoreForCurrentEvent(key);
    let stored = clamp(Math.round(Number(prepStore[key] || 0)), 0, 20);

    // Capture direct increases from other systems (for example the analyst shop)
    // only when V12 has already attached this slot to this exact event.
    if (capture && slot.__prepV12Key === key && slotBelongsToCurrentEvent(slot, event)) {
      const candidate = liveSlotPrep(slot);
      if (candidate > stored) stored = candidate;
    }

    return applyPrep(stored);
  }

  function canPrepare() {
    const event = world.currentEvent;
    const slot = primarySlot();
    if (!event || !slot) return false;
    if (!prepKey(event)) return false;
    if (event.status !== 'planning' || event.invited === false) return false;
    return slot.status === 'planning';
  }

  // Final preparation action: one source of truth, current tournament only.
  game.actionLadder = () => {
    if (!canPrepare()) {
      ui.showModal('本月没有可备战赛事', '当前没有你已经进入名单、可以进行备战的正式赛事。', [
        { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      return;
    }
    const old = syncPrep({ capture: true });
    const next = applyPrep(old + 6);
    logic.modStat('san', -2, '赛事备战');
    logic.log(`赛事准备度 ${old} → ${next}（${world.currentEvent?.name || primarySlot()?.name || '当前赛事'}）`, 'pos');
    state.flags.usedMonthlyActions = state.flags.usedMonthlyActions || [];
    state.flags.usedMonthlyActions.push('event-prep');
    ui.render();
  };

  function patchVisiblePrep() {
    const key = prepKey();
    if (!key) return;
    const prep = clamp(Math.round(Number(prepStore[key] || 0)), 0, 20);
    const container = document.getElementById('slots-container');
    if (!container) return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      node.nodeValue = String(node.nodeValue || '')
        .replace(/赛事准备\s*\d+\/20/g, `赛事准备 ${prep}/20`)
        .replace(/准备度\s*\d+\/20/g, `准备度 ${prep}/20`)
        .replace(/准备\s*\d+\/20/g, `准备 ${prep}/20`);
    });
  }

  // V9's public hooks are used by the single-result event system. Point them to
  // the strict V12 store so match probability always receives the same value the
  // player sees on screen.
  if (window.prepNameFixV9) {
    window.prepNameFixV9.syncPrep = syncPrep;
    window.prepNameFixV9.applyPrep = applyPrep;
    window.prepNameFixV9.prepKey = prepKey;
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    // Capture legitimate direct increases BEFORE older render wrappers run.
    syncPrep({ capture: true });
    const out = previousRender();
    // Never capture after older wrappers render; they are exactly where stale
    // savedScores used to leak back into eventPrep. Re-apply V12 instead.
    syncPrep({ capture: false });
    patchVisiblePrep();
    return out;
  };

  // Initial migration repairs a currently polluted save immediately.
  syncPrep({ capture: false });
  patchVisiblePrep();

  window.prepStateFixV12 = {
    syncPrep,
    applyPrep,
    prepKey,
    rebuildCurrentPrepFromLogs,
    liveSlotPrep,
  };
  console.info('[prep-state-fix-v12] Preparation is isolated per event; stale savedScores can no longer leak 20/20 forward.');
})();
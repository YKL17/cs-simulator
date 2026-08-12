(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.tournamentWorld) {
    console.warn('[prep-name-fix-v9] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const MONTH_NAMES = {
    1: 'Winter', 2: 'February', 3: 'Spring', 4: 'April', 5: 'May', 6: 'June',
    7: 'July', 8: 'August', 9: 'Fall', 10: 'October', 11: 'November', 12: 'December',
  };

  world.v4 = world.v4 || {};
  world.v4.prepByEventV9 = world.v4.prepByEventV9 || {};
  const prepStore = world.v4.prepByEventV9;

  const isMajorMonth = (month = state.date.month) => month === 6 || month === 12;
  const majorHalf = (month = state.date.month) => month === 6 ? 'spring' : 'winter';
  const primarySlot = () => state.slots?.[0] || null;

  function eventMonth(event = world.currentEvent) {
    const match = String(event?.key || event?.id || '').match(/(?:^|v5-)(\d+)-(\d+)-(?:S|A|B|C)/i);
    if (match) return Number(match[2]);
    return state.date.month;
  }

  function cleanLegacySName(text) {
    return String(text || '')
      .replace(/Major Prelude II Elite/g, 'November Elite Series')
      .replace(/Major Prelude Elite/g, 'May Elite Series');
  }

  function canonicalSName(event = world.currentEvent) {
    if (!event || event.level !== 'S' || event.type === 'major' || event.majorOnlyV7) return event?.name || '';
    const month = eventMonth(event);
    return `${MONTH_NAMES[month] || 'Premier'} Elite Series`;
  }

  function renameCurrentS() {
    const event = world.currentEvent;
    if (!event || event.level !== 'S' || event.type === 'major' || event.majorOnlyV7) return;
    const name = canonicalSName(event);
    event.name = name;
    const slot = primarySlot();
    if (slot && (slot.worldEventId === event.id || slot.worldEventKey === event.key || slot.level === 'S')) slot.name = name;
  }

  function prepKey() {
    const event = world.currentEvent;
    if (!event || event.status === 'completed') return null;
    if (isMajorMonth() && (event.type === 'major' || event.majorOnlyV7 || event.level === 'Major')) {
      return `major:${state.date.year}:${majorHalf()}`;
    }
    if (event.type === 'ranked' && event.level && ['S', 'A', 'B', 'C'].includes(event.level)) {
      return `regular:${event.key || event.id || `${state.date.year}-${state.date.month}-${event.level}`}`;
    }
    return null;
  }

  function canonicalPrepId() {
    const event = world.currentEvent;
    if (!event) return null;
    if (isMajorMonth() && (event.type === 'major' || event.majorOnlyV7 || event.level === 'Major')) {
      return `major-prep-${state.date.year}-${majorHalf()}`;
    }
    return event.id || event.key || null;
  }

  function mirroredPrep(slot) {
    if (!slot) return 0;
    const values = [Number(slot.eventPrep || 0)];
    if (slot.scores) values.push(Math.round(((slot.scores.tac || 0) + (slot.scores.trn || 0) + (slot.scores.real || 0)) / 3));
    if (slot.savedScores) values.push(Math.round(((slot.savedScores.tac || 0) + (slot.savedScores.trn || 0) + (slot.savedScores.real || 0)) / 3));
    return clamp(Math.max(...values.filter(Number.isFinite), 0), 0, 20);
  }

  function slotMatchesCurrent(slot, key, prepId) {
    const event = world.currentEvent;
    if (!slot || !event) return false;
    return slot.__prepV9Key === key
      || slot.prepEventId === prepId
      || slot.worldEventId === event.id
      || slot.worldEventKey === event.key;
  }

  function applyPrep(value) {
    const key = prepKey();
    if (!key) return 0;
    const slot = primarySlot();
    if (!slot) return 0;
    const prep = clamp(Math.round(Number(value || 0)), 0, 20);
    const prepId = canonicalPrepId();
    prepStore[key] = prep;
    slot.__prepV9Key = key;
    slot.prepEventId = prepId;
    slot.eventPrep = prep;
    slot.scores = { tac: prep, trn: prep, real: prep };
    slot.savedScores = { tac: prep, trn: prep, real: prep };
    if (world.currentEvent) world.currentEvent.eventPrep = prep;
    return prep;
  }

  function syncPrep({ capture = true } = {}) {
    const key = prepKey();
    const slot = primarySlot();
    if (!key || !slot) return 0;
    const prepId = canonicalPrepId();
    const matches = slotMatchesCurrent(slot, key, prepId);
    const candidate = mirroredPrep(slot);
    let stored = Number(prepStore[key]);

    if (!Number.isFinite(stored)) {
      stored = matches ? candidate : 0;
      prepStore[key] = stored;
    } else if (capture && matches && candidate > stored) {
      // Other systems (shop items, old saves) may still raise slot.eventPrep directly.
      // Capture increases, but never let a render-time reset overwrite saved preparation.
      stored = candidate;
      prepStore[key] = stored;
    }
    return applyPrep(stored);
  }

  function canPrepare() {
    const event = world.currentEvent;
    if (!event || event.status !== 'planning') return false;
    if (event.invited === false) return false;
    return !!prepKey();
  }

  game.actionLadder = () => {
    if (!canPrepare()) {
      ui.showModal('本月没有可备战赛事', '当前没有你可以参加并准备的正式赛事。本月可以进行个人训练、团队磨合或状态恢复。', [
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

  // Public event list should never label an S-tier event as a Major.
  const previousMonthlyEvents = tournamentWorld.getMonthlyEvents?.bind(tournamentWorld);
  if (previousMonthlyEvents) {
    tournamentWorld.getMonthlyEvents = (month = state.date.month, ...rest) => {
      const events = previousMonthlyEvents(month, ...rest) || [];
      return events.map((event) => {
        if (event?.level !== 'S' || event?.type === 'major') return event;
        return { ...event, name: `${MONTH_NAMES[month] || 'Premier'} Elite Series` };
      });
    };
  }

  // Catch legacy modal text such as "Major Prelude Elite" without touching real Majors.
  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => previousShowModal(cleanLegacySName(title), cleanLegacySName(html), buttons);

  function patchVisiblePrep() {
    const key = prepKey();
    if (!key) return;
    const prep = Number(prepStore[key] || 0);
    const container = document.getElementById('slots-container');
    if (!container) return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let text = node.nodeValue || '';
      text = text
        .replace(/赛事准备\s*\d+\/20/g, `赛事准备 ${prep}/20`)
        .replace(/准备度\s*\d+\/20/g, `准备度 ${prep}/20`)
        .replace(/准备\s*\d+\/20/g, `准备 ${prep}/20`);
      node.nodeValue = cleanLegacySName(text);
    });
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    renameCurrentS();
    syncPrep({ capture: true });
    const out = previousRender();
    renameCurrentS();
    syncPrep({ capture: true });
    patchVisiblePrep();
    return out;
  };

  // Make sure opening the world hub cannot surface the old S-tier "Major Prelude" labels.
  const previousWorldHub = tournamentWorld.openWorldHub?.bind(tournamentWorld);
  if (previousWorldHub) {
    tournamentWorld.openWorldHub = (...args) => {
      renameCurrentS();
      const out = previousWorldHub(...args);
      setTimeout(() => {
        document.querySelectorAll('.modal, .modal-content, #modal, #modal-content').forEach((root) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const nodes = [];
          while (walker.nextNode()) nodes.push(walker.currentNode);
          nodes.forEach((node) => { node.nodeValue = cleanLegacySName(node.nodeValue || ''); });
        });
      }, 0);
      return out;
    };
  }

  renameCurrentS();
  syncPrep({ capture: true });
  patchVisiblePrep();
  window.prepNameFixV9 = { syncPrep, applyPrep, prepKey, canonicalSName };
  console.info('[prep-name-fix-v9] Persistent per-event preparation and S/Major naming separation loaded.');
})();
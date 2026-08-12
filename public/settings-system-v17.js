(() => {
  if (typeof state === 'undefined' || !window.ui || !window.metaSystem) {
    console.warn('[settings-system-v17] Required systems are not ready.');
    return;
  }

  const SAVE_VERSION = 1;
  const AUTO_KEY = 'cs-career:auto:v1';
  const SLOT_KEYS = [1, 2, 3].map((n) => `cs-career:slot:${n}:v1`);
  const ACTIVE_KEY = 'cs-career:active-save:v1';
  const clone = (value) => JSON.parse(JSON.stringify(value));

  // Remove every V16 surface first. V17 uses fresh element IDs so cached V16
  // cannot keep handling clicks underneath the new settings panel.
  ['career-settings-overlay', 'btn-settings-game', 'career-settings-v16-styles'].forEach((id) => {
    document.getElementById(id)?.remove();
  });

  function readSave(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveLabel(data) {
    if (!data) return '空存档';
    const s = data.summary || {};
    return `${s.team || '战队'} · Y${s.year || 1}/M${s.month || 1} · OVR ${s.ovr || '-'}`;
  }

  function savedTime(data) {
    if (!data?.savedAt) return '';
    try { return new Date(data.savedAt).toLocaleString(); } catch (_) { return ''; }
  }

  function snapshot() {
    return {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      summary: {
        team: window.teamSystem?.getTeam?.()?.name || state.teamSystem?.currentTeamId || '未签约',
        year: state.date?.year || 1,
        month: state.date?.month || 1,
        ovr: window.teamSystem?.getUserOvr?.() || 0,
        rank: window.tournamentWorld?.getRank?.() || null,
      },
      core: clone({
        started: state.started,
        role: state.role,
        date: state.date,
        phase: state.phase,
        targetScore: state.targetScore,
        stats: state.stats,
        flags: state.flags,
        buffs: state.buffs,
        slots: state.slots,
        history: state.history,
        hltvHistory: state.hltvHistory,
        logs: state.logs,
      }),
      teamSystem: clone(state.teamSystem || {}),
      tournamentWorld: clone(state.tournamentWorld || {}),
      trainingSystem: clone(state.trainingSystem || {}),
    };
  }

  function saveSlot(slot) {
    const key = SLOT_KEYS[Number(slot) - 1];
    if (!key || !state.started) return;
    try {
      metaSystem.checkAchievements?.(false);
      localStorage.setItem(key, JSON.stringify(snapshot()));
      localStorage.setItem(ACTIVE_KEY, key);
      window.logic?.log?.(`手动存档 ${slot} 保存成功`, 'pos');
      renderSave(`存档 ${slot} 已保存`);
    } catch (_) {
      renderMessage('保存失败', '浏览器无法写入本地存储，请检查隐私模式或存储权限。');
    }
  }

  function installUi() {
    if (!document.getElementById('career-settings-v17-styles')) {
      const style = document.createElement('style');
      style.id = 'career-settings-v17-styles';
      style.textContent = `
        #career-settings-overlay-v17{position:fixed;inset:0;z-index:7200;display:none;background:rgba(15,23,42,.32);backdrop-filter:blur(2px);align-items:flex-start;justify-content:flex-end;padding:12px}
        #career-settings-panel-v17{width:min(400px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;background:#fff;border:1px solid #dbe3ee;border-radius:14px;box-shadow:0 18px 55px rgba(15,23,42,.32);padding:16px;color:#0f172a}
        .csv17-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}.csv17-head strong{font-size:1.05rem}.csv17-close{border:1px solid #d7dee8;background:#fff;border-radius:8px;width:34px;height:34px;cursor:pointer;color:#475569}
        .csv17-list{display:grid;gap:9px}.csv17-row{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:11px 12px;cursor:pointer;color:#0f172a}.csv17-row:hover{background:#f8fafc}.csv17-row:disabled{opacity:.45;cursor:not-allowed}.csv17-row.danger{border-color:#fecaca;background:#fff7f7}.csv17-row span{display:flex;flex-direction:column;gap:2px}.csv17-row small{font-size:.72rem;color:#94a3b8;font-weight:400}.csv17-row i{color:#64748b}
        .csv17-note{font-size:.74rem;color:#94a3b8;line-height:1.5;margin-top:10px}.csv17-status{padding:8px 10px;border-radius:8px;background:#ecfdf5;color:#047857;font-size:.78rem;margin-bottom:9px}.csv17-actions{display:flex;gap:8px;margin-top:12px}.csv17-actions button{flex:1;border-radius:8px;padding:9px 10px;cursor:pointer;border:1px solid #d7dee8;background:#fff;font-weight:700}.csv17-actions .danger{background:#dc2626;border-color:#dc2626;color:#fff}
        #btn-settings-game-v17{position:fixed;top:14px;right:14px;z-index:7100;display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(255,255,255,.97);box-shadow:0 5px 18px rgba(15,23,42,.18);border:1px solid #cbd5e1;border-radius:9px;font-weight:700;cursor:pointer}
        @media(max-width:650px){#btn-settings-game-v17 span{display:none}#btn-settings-game-v17{padding:9px 11px}#career-settings-overlay-v17{padding:8px}#career-settings-panel-v17{width:calc(100vw - 16px);max-height:calc(100vh - 16px)}}
      `;
      document.head.appendChild(style);
    }

    let overlay = document.getElementById('career-settings-overlay-v17');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'career-settings-overlay-v17';
      overlay.innerHTML = '<div id="career-settings-panel-v17"></div>';
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeSettings();
      });
      overlay.querySelector('#career-settings-panel-v17').addEventListener('click', handlePanelClick);
      document.body.appendChild(overlay);
    }

    let button = document.getElementById('btn-settings-game-v17');
    if (!button) {
      button = document.createElement('button');
      button.id = 'btn-settings-game-v17';
      button.type = 'button';
      button.innerHTML = '<i class="fa-solid fa-gear"></i><span>设置</span>';
      button.title = '设置 / 存档 / 载入 / 退役';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openSettings();
      }, true);
      document.body.appendChild(button);
    }
    button.style.visibility = state.started ? 'visible' : 'hidden';
    return overlay;
  }

  function panel() {
    return installUi().querySelector('#career-settings-panel-v17');
  }

  function header(title) {
    return `<div class="csv17-head"><strong>${title}</strong><button class="csv17-close" data-action="close"><i class="fa-solid fa-xmark"></i></button></div>`;
  }

  function openSettings() {
    const retired = !!state.flags?.retired;
    panel().innerHTML = `${header('设置')}
      <div class="csv17-list">
        <button class="csv17-row" data-action="save-screen"><span><strong>保存游戏</strong><small>写入3个手动存档槽之一</small></span><i class="fa-solid fa-floppy-disk"></i></button>
        <button class="csv17-row" data-action="load-screen"><span><strong>载入存档</strong><small>读取自动存档或手动存档</small></span><i class="fa-solid fa-folder-open"></i></button>
        <button class="csv17-row danger" data-action="retire-screen"><span><strong>${retired ? '查看退役总结' : '宣布退役'}</strong><small>${retired ? '查看这段职业生涯的最终成绩' : '主动结束当前职业生涯'}</small></span><i class="fa-solid fa-person-walking-arrow-right"></i></button>
      </div>
      <div class="csv17-note">设置面板不会进入游戏弹窗队列。点击“宣布退役”后，确认页会立即在这里出现。</div>`;
    installUi().style.display = 'flex';
  }

  function closeSettings() {
    const overlay = document.getElementById('career-settings-overlay-v17');
    if (overlay) overlay.style.display = 'none';
  }

  function renderSave(status = '') {
    const rows = SLOT_KEYS.map((key, index) => {
      const data = readSave(key);
      return `<button class="csv17-row" data-action="save-slot" data-slot="${index + 1}"><span><strong>手动存档 ${index + 1}</strong><small>${saveLabel(data)}${data ? ` · ${savedTime(data)}` : ''}</small></span><i class="fa-solid fa-floppy-disk"></i></button>`;
    }).join('');
    panel().innerHTML = `${header('保存游戏')}${status ? `<div class="csv17-status">${status}</div>` : ''}<div class="csv17-list">${rows}</div><div class="csv17-actions"><button data-action="home">返回设置</button></div>`;
  }

  function renderLoad() {
    const entries = [[AUTO_KEY, '自动存档'], ...SLOT_KEYS.map((key, index) => [key, `手动存档 ${index + 1}`])];
    const rows = entries.map(([key, title]) => {
      const data = readSave(key);
      return `<button class="csv17-row" ${data ? '' : 'disabled'} data-action="confirm-load" data-key="${key}"><span><strong>${title}</strong><small>${saveLabel(data)}${data ? ` · ${savedTime(data)}` : ''}</small></span><i class="fa-solid ${data ? 'fa-folder-open' : 'fa-ban'}"></i></button>`;
    }).join('');
    panel().innerHTML = `${header('载入存档')}<div class="csv17-list">${rows}</div><div class="csv17-actions"><button data-action="home">返回设置</button></div>`;
  }

  function renderLoadConfirm(key) {
    const data = readSave(key);
    if (!data) return;
    panel().innerHTML = `${header('确认载入')}<p style="font-size:.86rem;line-height:1.6;color:#475569">确定载入 <strong>${saveLabel(data)}</strong>？当前尚未保存的进度会丢失。</p><div class="csv17-actions"><button data-action="load-screen">取消</button><button data-action="load-now" data-key="${key}">确认载入</button></div>`;
  }

  function renderRetirementConfirm() {
    if (state.flags?.retired) {
      closeSettings();
      window.retirementChoiceV15?.showRetirementSummary?.();
      return;
    }
    const year = Number(state.date?.year || 1);
    const month = Number(state.date?.month || 1);
    panel().innerHTML = `${header('宣布退役')}<p style="font-size:.9rem;line-height:1.65;color:#475569">确定要在 <strong>第${year}年${month}月</strong> 宣布退役吗？</p><p style="font-size:.78rem;line-height:1.55;color:#94a3b8">确认后职业生涯立即结束。退役档仍可保存和查看，但不能继续训练、参赛或进入下个月。</p><div class="csv17-actions"><button data-action="home">取消</button><button class="danger" data-action="retire-now" data-year="${year}" data-month="${month}">确认宣布退役</button></div>`;
  }

  function loadNow(key) {
    closeSettings();
    const ok = metaSystem.loadSave?.(key);
    if (!ok) {
      setTimeout(() => {
        openSettings();
        renderMessage('载入失败', '这个存档无法读取。');
      }, 70);
    }
  }

  function retireNow(year, month) {
    closeSettings();
    // Retirement ends the current career, so clear any old queued gameplay
    // modal before V15 shows the retirement summary.
    if (Array.isArray(ui.modalQueue)) ui.modalQueue.length = 0;
    if (ui.isModalOpen) ui.closeModal();
    setTimeout(() => {
      window.retirementChoiceV15?.retire?.({ forced: false, year: Number(year), month: Number(month) });
    }, 80);
  }

  function renderMessage(title, text) {
    panel().innerHTML = `${header(title)}<p style="font-size:.86rem;line-height:1.6;color:#475569">${text}</p><div class="csv17-actions"><button data-action="home">返回设置</button></div>`;
  }

  function handlePanelClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const action = target.dataset.action;
    if (action === 'close') closeSettings();
    else if (action === 'home') openSettings();
    else if (action === 'save-screen') renderSave();
    else if (action === 'load-screen') renderLoad();
    else if (action === 'retire-screen') renderRetirementConfirm();
    else if (action === 'save-slot') saveSlot(target.dataset.slot);
    else if (action === 'confirm-load') renderLoadConfirm(target.dataset.key);
    else if (action === 'load-now') loadNow(target.dataset.key);
    else if (action === 'retire-now') retireNow(target.dataset.year, target.dataset.month);
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    // Cached V16 may recreate its button during render; remove it every time.
    document.getElementById('btn-settings-game')?.remove();
    document.getElementById('career-settings-overlay')?.remove();
    installUi();
    return out;
  };

  installUi();
  window.careerSettingsV17 = {
    openSettings,
    closeSettings,
    renderSave,
    renderLoad,
    renderRetirementConfirm,
    saveSlot,
    loadNow,
    retireNow,
  };
  console.info('[settings-system-v17] Fresh settings UI loaded; retirement confirmation is immediate and never queued.');
})();

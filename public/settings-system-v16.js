(() => {
  if (typeof state === 'undefined' || !window.ui || !window.metaSystem) {
    console.warn('[settings-system-v16] Required systems are not ready.');
    return;
  }

  const SAVE_VERSION = 1;
  const AUTO_KEY = 'cs-career:auto:v1';
  const SLOT_KEYS = [1, 2, 3].map((n) => `cs-career:slot:${n}:v1`);
  const ACTIVE_KEY = 'cs-career:active-save:v1';
  const clone = (value) => JSON.parse(JSON.stringify(value));

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
      logic?.log?.(`手动存档 ${slot} 保存成功`, 'pos');
      renderSaveScreen(`存档 ${slot} 已保存`);
    } catch (_) {
      renderMessage('保存失败', '浏览器无法写入本地存储，请检查隐私模式或存储权限。');
    }
  }

  function ensureOverlay() {
    let overlay = document.getElementById('career-settings-overlay');
    if (overlay) return overlay;

    const style = document.createElement('style');
    style.id = 'career-settings-v16-styles';
    style.textContent = `
      #career-settings-overlay{position:fixed;inset:0;z-index:5200;display:none;background:rgba(15,23,42,.30);backdrop-filter:blur(2px);align-items:flex-start;justify-content:flex-end;padding:12px}
      #career-settings-panel{width:min(390px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;background:#fff;border:1px solid #dbe3ee;border-radius:14px;box-shadow:0 18px 55px rgba(15,23,42,.28);padding:16px;color:#0f172a}
      .career-settings-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}.career-settings-head strong{font-size:1.05rem}.career-settings-close{border:1px solid #d7dee8;background:#fff;border-radius:8px;width:34px;height:34px;cursor:pointer;color:#475569}
      .career-settings-list{display:grid;gap:9px}.career-settings-row{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:11px 12px;cursor:pointer;color:#0f172a}.career-settings-row:hover{background:#f8fafc}.career-settings-row:disabled{opacity:.45;cursor:not-allowed}.career-settings-row.danger{border-color:#fecaca;background:#fff7f7}.career-settings-row span{display:flex;flex-direction:column;gap:2px}.career-settings-row small{font-size:.72rem;color:#94a3b8;font-weight:400}.career-settings-row i{color:#64748b}.career-settings-note{font-size:.74rem;color:#94a3b8;line-height:1.5;margin-top:10px}.career-settings-status{padding:8px 10px;border-radius:8px;background:#ecfdf5;color:#047857;font-size:.78rem;margin-bottom:9px}.career-settings-actions{display:flex;gap:8px;margin-top:11px}.career-settings-actions button{flex:1;border-radius:8px;padding:9px 10px;cursor:pointer;border:1px solid #d7dee8;background:#fff;font-weight:700}.career-settings-actions .danger{background:#dc2626;border-color:#dc2626;color:#fff}
      #btn-settings-game{position:fixed;top:14px;right:14px;z-index:5100;display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(255,255,255,.96);box-shadow:0 5px 18px rgba(15,23,42,.18);border:1px solid #cbd5e1;border-radius:9px;font-weight:700;cursor:pointer}
      @media(max-width:650px){#btn-settings-game span{display:none}#btn-settings-game{padding:9px 11px}#career-settings-overlay{padding:8px}#career-settings-panel{width:calc(100vw - 16px);max-height:calc(100vh - 16px)}}
    `;
    document.head.appendChild(style);

    overlay = document.createElement('div');
    overlay.id = 'career-settings-overlay';
    overlay.innerHTML = '<div id="career-settings-panel"></div>';
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeSettings();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function panel() {
    return ensureOverlay().querySelector('#career-settings-panel');
  }

  function header(title) {
    return `<div class="career-settings-head"><strong>${title}</strong><button class="career-settings-close" onclick="careerSettingsV16.closeSettings()"><i class="fa-solid fa-xmark"></i></button></div>`;
  }

  function openSettings() {
    const overlay = ensureOverlay();
    const retired = !!state.flags?.retired;
    panel().innerHTML = `${header('设置')}
      <div class="career-settings-list">
        <button class="career-settings-row" onclick="careerSettingsV16.renderSaveScreen()"><span><strong>保存游戏</strong><small>写入3个手动存档槽之一</small></span><i class="fa-solid fa-floppy-disk"></i></button>
        <button class="career-settings-row" onclick="careerSettingsV16.renderLoadScreen()"><span><strong>载入存档</strong><small>读取自动存档或手动存档</small></span><i class="fa-solid fa-folder-open"></i></button>
        <button class="career-settings-row danger" onclick="careerSettingsV16.renderRetirementConfirm()"><span><strong>${retired ? '查看退役总结' : '宣布退役'}</strong><small>${retired ? '查看这段职业生涯的最终成绩' : '主动结束当前职业生涯'}</small></span><i class="fa-solid fa-person-walking-arrow-right"></i></button>
      </div>
      <div class="career-settings-note">设置面板独立于赛事/转会/Major弹窗。打开或关闭设置不会关闭、排队或跳过当前游戏事件。第10年结束后仍会强制退役。</div>`;
    overlay.style.display = 'flex';
  }

  function closeSettings() {
    const overlay = document.getElementById('career-settings-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function renderSaveScreen(status = '') {
    const rows = SLOT_KEYS.map((key, index) => {
      const data = readSave(key);
      return `<button class="career-settings-row" onclick="careerSettingsV16.saveSlot(${index + 1})"><span><strong>手动存档 ${index + 1}</strong><small>${saveLabel(data)}${data ? ` · ${savedTime(data)}` : ''}</small></span><i class="fa-solid fa-floppy-disk"></i></button>`;
    }).join('');
    panel().innerHTML = `${header('保存游戏')}${status ? `<div class="career-settings-status">${status}</div>` : ''}<div class="career-settings-list">${rows}</div><div class="career-settings-actions"><button onclick="careerSettingsV16.openSettings()">返回设置</button></div><div class="career-settings-note">每次进入下个月仍会自动保存。手动保存不会关闭当前正在显示的比赛或事件弹窗。</div>`;
  }

  function renderLoadScreen() {
    const rows = [[AUTO_KEY, '自动存档'], ...SLOT_KEYS.map((key, index) => [key, `手动存档 ${index + 1}`])]
      .map(([key, title]) => {
        const data = readSave(key);
        return `<button class="career-settings-row" ${data ? '' : 'disabled'} onclick="careerSettingsV16.confirmLoad('${key}')"><span><strong>${title}</strong><small>${saveLabel(data)}${data ? ` · ${savedTime(data)}` : ''}</small></span><i class="fa-solid ${data ? 'fa-folder-open' : 'fa-ban'}"></i></button>`;
      }).join('');
    panel().innerHTML = `${header('载入存档')}<div class="career-settings-list">${rows}</div><div class="career-settings-actions"><button onclick="careerSettingsV16.openSettings()">返回设置</button></div><div class="career-settings-note">载入会替换当前游戏状态，因此正在显示的赛事/事件弹窗也会随存档一起切换。</div>`;
  }

  function confirmLoad(key) {
    const data = readSave(key);
    if (!data) return;
    panel().innerHTML = `${header('确认载入')}<p style="font-size:.86rem;line-height:1.6;color:#475569">确定载入 <strong>${saveLabel(data)}</strong>？当前尚未保存的进度会丢失。</p><div class="career-settings-actions"><button onclick="careerSettingsV16.renderLoadScreen()">取消</button><button onclick="careerSettingsV16.loadSave('${key}')">确认载入</button></div>`;
  }

  function loadSave(key) {
    closeSettings();
    const ok = metaSystem.loadSave?.(key);
    if (!ok) {
      setTimeout(() => {
        openSettings();
        renderMessage('载入失败', '这个存档无法读取。');
      }, 60);
    }
  }

  function renderRetirementConfirm() {
    if (state.flags?.retired) {
      closeSettings();
      window.retirementChoiceV15?.showRetirementSummary?.();
      return;
    }
    const year = Number(state.date?.year || 1);
    const month = Number(state.date?.month || 1);
    panel().innerHTML = `${header('宣布退役')}<p style="font-size:.86rem;line-height:1.6;color:#475569">确定要在 <strong>第${year}年${month}月</strong> 结束职业生涯吗？退役后仍可保存和查看档案，但不能再训练、参赛或推进月份。</p><div class="career-settings-actions"><button onclick="careerSettingsV16.openSettings()">取消</button><button class="danger" onclick="careerSettingsV16.retireNow(${year},${month})">确认退役</button></div>`;
  }

  function retireNow(year, month) {
    closeSettings();
    window.retirementChoiceV15?.retire?.({ forced: false, year, month });
  }

  function renderMessage(title, text) {
    panel().innerHTML = `${header(title)}<p style="font-size:.86rem;line-height:1.6;color:#475569">${text}</p><div class="career-settings-actions"><button onclick="careerSettingsV16.openSettings()">返回设置</button></div>`;
  }

  function ensureSettingsButton() {
    const oldSave = document.getElementById('btn-save-game');
    if (oldSave) oldSave.remove();

    let button = document.getElementById('btn-settings-game');
    if (!button) {
      button = document.createElement('button');
      button.id = 'btn-settings-game';
      button.type = 'button';
      button.innerHTML = '<i class="fa-solid fa-gear"></i><span>设置</span>';
      button.title = '设置 / 存档 / 载入 / 退役';
      document.body.appendChild(button);
    }
    if (button.parentElement !== document.body) document.body.appendChild(button);
    button.onclick = openSettings;
    button.style.visibility = state.started ? 'visible' : 'hidden';
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    ensureSettingsButton();
    return out;
  };

  ensureOverlay();
  ensureSettingsButton();
  window.careerSettingsV16 = {
    openSettings,
    closeSettings,
    renderSaveScreen,
    renderLoadScreen,
    renderRetirementConfirm,
    renderMessage,
    saveSlot,
    confirmLoad,
    loadSave,
    retireNow,
    ensureSettingsButton,
  };
  console.info('[settings-system-v16] Settings now uses an independent overlay and never waits on the game modal queue.');
})();

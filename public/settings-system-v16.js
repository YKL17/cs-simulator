(() => {
  if (typeof state === 'undefined' || !window.ui || !window.metaSystem) {
    console.warn('[settings-system-v16] Required systems are not ready.');
    return;
  }

  const AUTO_KEY = 'cs-career:auto:v1';
  const SLOT_KEYS = [1, 2, 3].map((n) => `cs-career:slot:${n}:v1`);

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

  function openSave() {
    ui.closeModal();
    setTimeout(() => {
      if (window.careerExpansionV14?.showSaveDialog) {
        window.careerExpansionV14.showSaveDialog();
        return;
      }
      ui.showModal('保存游戏', '当前保存界面暂不可用。', [
        { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
    }, 80);
  }

  function loadSave(key) {
    const data = readSave(key);
    if (!data) return;
    ui.closeModal();
    setTimeout(() => {
      const ok = metaSystem.loadSave?.(key);
      if (!ok) {
        ui.showModal('载入失败', '这个存档无法读取。', [
          { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
        ]);
      }
    }, 70);
  }

  function loadRow(key, title) {
    const data = readSave(key);
    return `<button class="manual-save-row" ${data ? '' : 'disabled'} onclick="careerSettingsV16.loadSave('${key}')">
      <span><strong>${title}</strong><small>${saveLabel(data)}</small></span>
      <i class="fa-solid ${data ? 'fa-folder-open' : 'fa-ban'}"></i>
    </button>`;
  }

  function openLoad() {
    ui.showModal('载入存档', `
      <div style="display:grid;gap:8px">
        ${loadRow(AUTO_KEY, '自动存档')}
        ${SLOT_KEYS.map((key, index) => loadRow(key, `手动存档 ${index + 1}`)).join('')}
      </div>
      <p style="font-size:.75rem;color:#94a3b8;margin-top:10px">载入后会直接回到该存档的游戏状态，不需要返回首页。</p>`,
    [{ text: '返回设置', class: 'btn-outline', cb: () => { ui.closeModal(); setTimeout(openSettings, 70); } }]);
  }

  function confirmRetirement() {
    if (state.flags?.retired) {
      window.retirementChoiceV15?.showRetirementSummary?.();
      return;
    }
    const year = Number(state.date?.year || 1);
    const month = Number(state.date?.month || 1);
    ui.showModal('宣布退役', `
      <p>确定要在 <strong>第${year}年${month}月</strong> 结束职业生涯吗？</p>
      <p style="font-size:.8rem;color:#64748b;margin-top:8px">退役后这个档仍然可以保存和查看，但不能再训练、参赛或推进月份。</p>`, [
      { text: '取消', class: 'btn-outline', cb: () => { ui.closeModal(); setTimeout(openSettings, 70); } },
      { text: '确认退役', class: 'btn-danger', cb: () => window.retirementChoiceV15?.retire?.({ forced: false, year, month }) },
    ]);
  }

  function openSettings() {
    const retired = !!state.flags?.retired;
    ui.showModal('设置', `
      <div style="display:grid;gap:9px">
        <button class="manual-save-row" onclick="careerSettingsV16.openSave()">
          <span><strong>保存游戏</strong><small>写入3个手动存档槽之一</small></span><i class="fa-solid fa-floppy-disk"></i>
        </button>
        <button class="manual-save-row" onclick="careerSettingsV16.openLoad()">
          <span><strong>载入存档</strong><small>读取自动存档或手动存档</small></span><i class="fa-solid fa-folder-open"></i>
        </button>
        <button class="manual-save-row" onclick="careerSettingsV16.confirmRetirement()" style="${retired ? 'opacity:.75;' : 'border-color:#fecaca;background:#fff7f7;'}">
          <span><strong>${retired ? '查看退役总结' : '宣布退役'}</strong><small>${retired ? '查看这段职业生涯的最终成绩' : '主动结束当前职业生涯'}</small></span><i class="fa-solid fa-person-walking-arrow-right"></i>
        </button>
      </div>
      <p style="font-size:.75rem;color:#94a3b8;margin-top:10px">第1–9年不会自动询问退役；第10年结束后仍会强制退役。</p>`,
    [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  }

  function ensureSettingsButton() {
    const oldSave = document.getElementById('btn-save-game');
    if (oldSave) oldSave.remove();

    let button = document.getElementById('btn-settings-game');
    if (!button) {
      button = document.createElement('button');
      button.id = 'btn-settings-game';
      button.type = 'button';
      button.className = 'btn btn-outline';
      button.innerHTML = '<i class="fa-solid fa-gear"></i><span>设置</span>';
      button.title = '设置 / 存档 / 载入 / 退役';
      document.body.appendChild(button);
    }

    // Keep Settings independent of the stats-row layout. Earlier versions
    // appended it beside Team/Honors where narrow layouts could clip it.
    if (button.parentElement !== document.body) document.body.appendChild(button);
    button.onclick = openSettings;
    button.style.cssText = [
      'position:fixed',
      'top:14px',
      'right:14px',
      'z-index:1800',
      'display:flex',
      'align-items:center',
      'gap:6px',
      'padding:8px 12px',
      'background:rgba(255,255,255,.96)',
      'box-shadow:0 5px 18px rgba(15,23,42,.18)',
      'border:1px solid #cbd5e1',
      'border-radius:9px',
      'font-weight:700'
    ].join(';');
    button.style.visibility = state.started ? 'visible' : 'hidden';
  }

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    ensureSettingsButton();
    return out;
  };

  ensureSettingsButton();
  window.careerSettingsV16 = {
    openSettings,
    openSave,
    openLoad,
    loadSave,
    confirmRetirement,
    ensureSettingsButton,
  };
  console.info('[settings-system-v16] Settings is pinned to the game top-right and owns save/load/voluntary retirement.');
})();

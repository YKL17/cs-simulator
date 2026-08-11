(() => {
  if (typeof state === 'undefined' || !window.logic || !window.ui || !window.game) {
    console.warn('[meta-system] Core game is not ready.');
    return;
  }

  const SAVE_VERSION = 1;
  const AUTO_KEY = 'cs-career:auto:v1';
  const SLOT_KEYS = [1, 2, 3].map((n) => `cs-career:slot:${n}:v1`);
  const ACH_KEY = 'cs-career:achievements:v1';
  const ACTIVE_KEY = 'cs-career:active-save:v1';
  const GITHUB_URL = 'https://github.com/YKL17/csgo1';
  const clone = (value) => JSON.parse(JSON.stringify(value));

  const ACHIEVEMENTS = [
    { id: 'first-contract', icon: 'fa-file-signature', name: '第一份合同', desc: '正式加入一支职业战队。', test: () => !!state.started && !!state.teamSystem?.currentTeamId },
    { id: 'official-debut', icon: 'fa-gamepad', name: '职业首秀', desc: '完成第一场正式赛事。', test: () => (state.history?.length || 0) >= 1 },
    { id: 'starting-five', icon: 'fa-users', name: '站稳脚跟', desc: '成为战队首发。', test: () => ['starter', 'core'].includes(window.teamSystem?.getRole?.()) },
    { id: 'team-core', icon: 'fa-crown', name: '队内核心', desc: '成为战队核心选手。', test: () => window.teamSystem?.getRole?.() === 'core' },
    { id: 'first-transfer', icon: 'fa-right-left', name: '新的征程', desc: '完成第一次转会。', test: () => (state.teamSystem?.transferHistory?.length || 0) >= 1 },
    { id: 'top20-team', icon: 'fa-ranking-star', name: '跻身一线', desc: '所在战队进入世界前 20。', test: () => (window.tournamentWorld?.getRank?.() || 99) <= 20 },
    { id: 'top10-team', icon: 'fa-medal', name: '世界前十', desc: '所在战队进入世界前 10。', test: () => (window.tournamentWorld?.getRank?.() || 99) <= 10 },
    { id: 'world-number-one', icon: 'fa-globe', name: '世界第一', desc: '所在战队登上世界排名第一。', test: () => window.tournamentWorld?.getRank?.() === 1 },
    { id: 'first-trophy', icon: 'fa-trophy', name: '第一座奖杯', desc: '赢得任意级别赛事冠军。', test: () => ((state.flags?.cWins || 0) + (state.flags?.bWins || 0) + (state.flags?.aWins || 0) + (state.flags?.sWins || 0) + (state.flags?.majorWins || 0)) >= 1 },
    { id: 's-tier-champ', icon: 'fa-star', name: '顶级赛事冠军', desc: '赢得一次 S 级赛事冠军。', test: () => (state.flags?.sWins || 0) >= 1 },
    { id: 'major-champ', icon: 'fa-gem', name: 'Major Champion', desc: '赢得一次 Major。', test: () => (state.flags?.majorWins || 0) >= 1 },
    { id: 'veteran', icon: 'fa-calendar', name: '职业老将', desc: '职业生涯进入第 4 年。', test: () => (state.date?.year || 1) >= 4 },
  ];

  function readAchievements() {
    try { return JSON.parse(localStorage.getItem(ACH_KEY) || '{}'); } catch (_) { return {}; }
  }
  function writeAchievements(value) { localStorage.setItem(ACH_KEY, JSON.stringify(value)); }

  function achievementToast(achievement) {
    const el = document.createElement('div');
    el.className = 'achievement-toast';
    el.innerHTML = `<i class="fa-solid ${achievement.icon}"></i><div><strong>成就解锁</strong><span>${achievement.name}</span></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2600);
  }

  function checkAchievements(showToast = true) {
    if (!state.started) return;
    const unlocked = readAchievements();
    let changed = false;
    ACHIEVEMENTS.forEach((achievement) => {
      if (unlocked[achievement.id]) return;
      let passed = false;
      try { passed = !!achievement.test(); } catch (_) { passed = false; }
      if (!passed) return;
      unlocked[achievement.id] = {
        unlockedAt: new Date().toISOString(),
        year: state.date?.year || 1,
        month: state.date?.month || 1,
      };
      changed = true;
      if (showToast) achievementToast(achievement);
    });
    if (changed) writeAchievements(unlocked);
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

  function saveTo(key, label, quiet = false) {
    if (!state.started) return false;
    checkAchievements(false);
    try {
      localStorage.setItem(key, JSON.stringify(snapshot()));
      localStorage.setItem(ACTIVE_KEY, key);
      if (!quiet) logic.log(`${label}保存成功`, 'pos');
      return true;
    } catch (error) {
      if (!quiet) ui.showModal('保存失败', '浏览器无法写入本地存储。请检查隐私模式或浏览器存储权限。', [{ text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() }]);
      return false;
    }
  }

  function autoSave() { return saveTo(AUTO_KEY, '自动存档', true); }

  function readSave(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function restoreObject(target, source) {
    if (!target || !source) return;
    Object.keys(target).forEach((key) => { if (!(key in source)) delete target[key]; });
    Object.entries(clone(source)).forEach(([key, value]) => { target[key] = value; });
  }

  function loadSave(key) {
    const data = readSave(key);
    if (!data?.core?.started) return false;

    const core = data.core;
    state.started = core.started;
    state.role = clone(core.role);
    state.date = clone(core.date);
    state.phase = core.phase;
    state.targetScore = core.targetScore;
    state.stats = clone(core.stats);
    state.flags = clone(core.flags);
    state.buffs = clone(core.buffs || []);
    state.slots = clone(core.slots || []);
    state.history = clone(core.history || []);
    state.hltvHistory = clone(core.hltvHistory || []);
    state.logs = clone(core.logs || []);

    if (state.teamSystem && data.teamSystem) restoreObject(state.teamSystem, data.teamSystem);
    if (state.tournamentWorld && data.tournamentWorld) restoreObject(state.tournamentWorld, data.tournamentWorld);
    if (data.trainingSystem) state.trainingSystem = clone(data.trainingSystem);

    localStorage.setItem(ACTIVE_KEY, key);
    ui.modalQueue = [];
    ui.isModalOpen = false;
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
    hideHome();
    ui.render();
    checkAchievements(false);
    logic.log('已载入本地存档', 'pos');
    return true;
  }

  function saveCard(key, title) {
    const data = readSave(key);
    if (!data) return `<button class="home-save-card empty" onclick="metaSystem.saveFromHomeUnavailable()"><strong>${title}</strong><span>空存档</span></button>`;
    const s = data.summary || {};
    const date = data.savedAt ? new Date(data.savedAt).toLocaleString() : '';
    return `<button class="home-save-card" onclick="metaSystem.loadSave('${key}')"><strong>${title}</strong><span>${s.team || '战队'} · Y${s.year || 1}/M${s.month || 1} · OVR ${s.ovr || '-'}</span><small>${date}</small></button>`;
  }

  function showLoadScreen() {
    const home = ensureHome();
    home.querySelector('.home-card').innerHTML = `
      <div class="home-kicker">CAREER ARCHIVE</div>
      <h1>载入存档</h1>
      <p class="home-subtitle">存档保存在当前浏览器的本地存储中。</p>
      <div class="home-save-list">
        ${saveCard(AUTO_KEY, '自动存档')}
        ${SLOT_KEYS.map((key, index) => saveCard(key, `手动存档 ${index + 1}`)).join('')}
      </div>
      <button class="home-secondary" onclick="metaSystem.showHome()"><i class="fa-solid fa-arrow-left"></i> 返回首页</button>`;
  }

  function showAchievements() {
    const home = ensureHome();
    const unlocked = readAchievements();
    const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
    home.querySelector('.home-card').innerHTML = `
      <div class="home-kicker">ACHIEVEMENTS</div>
      <h1>成就中心</h1>
      <p class="home-subtitle">已解锁 ${count} / ${ACHIEVEMENTS.length}</p>
      <div class="achievement-grid">
        ${ACHIEVEMENTS.map((a) => {
          const on = !!unlocked[a.id];
          return `<div class="achievement-card ${on ? 'unlocked' : 'locked'}"><i class="fa-solid ${a.icon}"></i><div><strong>${a.name}</strong><span>${a.desc}</span>${on ? `<small>Y${unlocked[a.id].year}/M${unlocked[a.id].month} 解锁</small>` : '<small>尚未解锁</small>'}</div></div>`;
        }).join('')}
      </div>
      <button class="home-secondary" onclick="metaSystem.showHome()"><i class="fa-solid fa-arrow-left"></i> 返回首页</button>`;
  }

  function showManualSave() {
    const cards = SLOT_KEYS.map((key, index) => {
      const data = readSave(key);
      const detail = data ? `${data.summary?.team || '战队'} · Y${data.summary?.year || 1}/M${data.summary?.month || 1}` : '空存档';
      return `<button class="manual-save-row" onclick="metaSystem.saveSlot(${index + 1})"><span><strong>存档 ${index + 1}</strong><small>${detail}</small></span><i class="fa-solid fa-floppy-disk"></i></button>`;
    }).join('');
    ui.showModal('保存游戏', `<div style="display:grid;gap:8px">${cards}</div><p style="font-size:.75rem;color:#94a3b8;margin-top:10px">每次进入下个月也会更新自动存档。</p>`, [{ text: '取消', class: 'btn-outline', cb: () => ui.closeModal() }]);
  }

  function ensureHome() {
    let home = document.getElementById('career-home');
    if (home) return home;
    home = document.createElement('div');
    home.id = 'career-home';
    home.innerHTML = '<div class="home-card"></div>';
    document.body.appendChild(home);
    return home;
  }

  function showHome() {
    checkAchievements(false);
    const home = ensureHome();
    const hasSave = !!readSave(AUTO_KEY) || SLOT_KEYS.some((key) => !!readSave(key));
    home.style.display = 'flex';
    home.querySelector('.home-card').innerHTML = `
      <div class="home-kicker">CS2 CAREER SIMULATION</div>
      <h1>Counter-Strike<br><span>Career Simulator</span></h1>
      <p class="home-subtitle">从弱队首发或强队试训开始，在真实现役战队生态中训练、争夺首发、征战赛事、冲击 Major，并通过转会书写自己的职业生涯。</p>
      <div class="home-feature-row"><span><i class="fa-solid fa-users"></i> 现役战队</span><span><i class="fa-solid fa-ranking-star"></i> 动态排名</span><span><i class="fa-solid fa-trophy"></i> Major 生涯</span></div>
      <div class="home-actions">
        <button class="home-primary" onclick="metaSystem.newGame()"><i class="fa-solid fa-play"></i> 新游戏</button>
        <button class="home-secondary" ${hasSave ? '' : 'disabled'} onclick="metaSystem.showLoad()"><i class="fa-solid fa-folder-open"></i> 载入存档</button>
        <button class="home-secondary" onclick="metaSystem.showAchievements()"><i class="fa-solid fa-medal"></i> 成就</button>
      </div>
      <a class="github-star-cta" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i><span><strong>喜欢这个项目？给它一个 Star ⭐</strong><small>查看源码、反馈建议并支持继续更新</small></span><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      <div class="home-footer">Open-source browser career simulator · Save data stays in your browser</div>`;
  }

  function hideHome() {
    const home = document.getElementById('career-home');
    if (home) home.style.display = 'none';
  }

  function newGame() {
    hideHome();
    originalUiInit();
  }

  function addGameButtons() {
    const honor = document.querySelector('.area-stats button[onclick="ui.showHonorRoom()"]');
    if (!honor || document.getElementById('btn-save-game')) return;
    const parent = honor.parentElement;
    const save = document.createElement('button');
    save.id = 'btn-save-game';
    save.className = 'btn btn-outline';
    save.style.flex = '1';
    save.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 保存';
    save.onclick = showManualSave;
    const home = document.createElement('button');
    home.id = 'btn-home-game';
    home.className = 'btn btn-outline';
    home.style.flex = '1';
    home.innerHTML = '<i class="fa-solid fa-house"></i> 首页';
    home.onclick = () => { autoSave(); showHome(); };
    parent.appendChild(save);
    parent.appendChild(home);
  }

  function injectStyles() {
    if (document.getElementById('meta-system-styles')) return;
    const style = document.createElement('style');
    style.id = 'meta-system-styles';
    style.textContent = `
      #career-home{position:fixed;inset:0;z-index:3000;display:none;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 18% 18%,rgba(37,99,235,.22),transparent 34%),radial-gradient(circle at 85% 80%,rgba(245,158,11,.16),transparent 30%),#07111f;color:#e5e7eb;overflow:auto}.home-card{width:min(760px,100%);background:rgba(15,23,42,.93);border:1px solid rgba(148,163,184,.22);box-shadow:0 30px 80px rgba(0,0,0,.45);border-radius:22px;padding:42px;backdrop-filter:blur(14px)}.home-kicker{font-size:.72rem;letter-spacing:.22em;color:#60a5fa;font-weight:800;margin-bottom:12px}.home-card h1{font-size:clamp(2.3rem,6vw,4.4rem);line-height:.95;color:#f8fafc;letter-spacing:-.05em;margin:0}.home-card h1 span{color:#60a5fa}.home-subtitle{color:#94a3b8;line-height:1.7;margin:20px 0}.home-feature-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}.home-feature-row span{background:#111d31;border:1px solid #24324a;border-radius:999px;padding:7px 11px;font-size:.78rem;color:#cbd5e1}.home-actions{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}.home-primary,.home-secondary{border:0;border-radius:10px;padding:12px 15px;font-weight:800;cursor:pointer;font-size:.92rem}.home-primary{background:#2563eb;color:white}.home-secondary{background:#182338;color:#e2e8f0;border:1px solid #2b3a54}.home-secondary:disabled{opacity:.38;cursor:not-allowed}.github-star-cta{display:flex;align-items:center;gap:12px;margin-top:18px;padding:14px 16px;border-radius:12px;background:#f8fafc;color:#0f172a;text-decoration:none}.github-star-cta>i:first-child{font-size:1.7rem}.github-star-cta span{display:flex;flex-direction:column;flex:1}.github-star-cta small{color:#64748b;margin-top:2px}.home-footer{text-align:center;color:#475569;font-size:.7rem;margin-top:16px}.home-save-list{display:grid;gap:9px;margin:18px 0}.home-save-card{display:flex;flex-direction:column;align-items:flex-start;text-align:left;border:1px solid #2b3a54;background:#111d31;color:#e2e8f0;border-radius:11px;padding:13px;cursor:pointer}.home-save-card strong{font-size:.95rem}.home-save-card span{font-size:.78rem;color:#94a3b8;margin-top:4px}.home-save-card small{font-size:.68rem;color:#64748b;margin-top:4px}.home-save-card.empty{opacity:.5;cursor:default}.achievement-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;max-height:50vh;overflow:auto;margin:18px 0}.achievement-card{display:flex;gap:11px;border-radius:10px;padding:12px;border:1px solid #293851;background:#111d31}.achievement-card>i{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:#1e293b;color:#64748b}.achievement-card div{display:flex;flex-direction:column}.achievement-card span,.achievement-card small{font-size:.72rem;color:#64748b;margin-top:3px}.achievement-card.unlocked{border-color:#3b82f6;background:#10203a}.achievement-card.unlocked>i{background:#2563eb;color:white}.achievement-card.unlocked strong{color:#f8fafc}.manual-save-row{display:flex;justify-content:space-between;align-items:center;border:1px solid #e5e7eb;background:white;border-radius:8px;padding:10px 12px;cursor:pointer}.manual-save-row span{display:flex;flex-direction:column;align-items:flex-start}.manual-save-row small{font-size:.72rem;color:#94a3b8;margin-top:2px}.achievement-toast{position:fixed;right:20px;top:20px;z-index:3500;display:flex;gap:10px;align-items:center;background:#0f172a;color:white;border:1px solid #334155;border-radius:12px;padding:12px 15px;box-shadow:0 12px 30px rgba(0,0,0,.3);transform:translateY(-20px);opacity:0;transition:.25s}.achievement-toast.show{transform:translateY(0);opacity:1}.achievement-toast>i{color:#f59e0b;font-size:1.35rem}.achievement-toast div{display:flex;flex-direction:column}.achievement-toast span{font-size:.78rem;color:#cbd5e1}@media(max-width:650px){.home-card{padding:26px 20px}.home-actions{grid-template-columns:1fr}.achievement-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  const originalUiInit = ui.init.bind(ui);
  ui.init = () => showHome();

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    previousRender();
    addGameButtons();
    checkAchievements(true);
  };

  const previousNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    const result = previousNextMonth();
    checkAchievements(true);
    autoSave();
    return result;
  };

  window.metaSystem = {
    showHome,
    showLoad: showLoadScreen,
    showAchievements,
    newGame,
    loadSave,
    saveSlot: (slot) => {
      const key = SLOT_KEYS[slot - 1];
      if (!key) return;
      saveTo(key, `手动存档 ${slot}`);
      ui.closeModal();
    },
    saveFromHomeUnavailable: () => {},
    autoSave,
    checkAchievements,
  };

  injectStyles();
  console.info('[meta-system] Home, saves, achievements and GitHub star CTA loaded.');
})();
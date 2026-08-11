(() => {
  if (typeof state === 'undefined' || !window.logic || !window.ui) {
    console.warn('[team-system] Core game objects are not ready.');
    return;
  }

  // Historical player names are used for flavor. OVR values below are internal
  // game-balance ratings, not official ratings and not a claim about current form.
  const PLAYER_POOL = [
    { id: 's1mple', name: 's1mple', role: 'AWPer', ovr: 98 },
    { id: 'zywoo', name: 'ZywOo', role: 'AWPer', ovr: 98 },
    { id: 'donk', name: 'donk', role: 'Entry', ovr: 97 },
    { id: 'niko', name: 'NiKo', role: 'Rifler', ovr: 96 },
    { id: 'device', name: 'device', role: 'AWPer', ovr: 95 },
    { id: 'coldzera', name: 'coldzera', role: 'Lurker', ovr: 95 },
    { id: 'monesy', name: 'm0NESY', role: 'AWPer', ovr: 94 },
    { id: 'getright', name: 'GeT_RiGhT', role: 'Lurker', ovr: 94 },
    { id: 'forest', name: 'f0rest', role: 'Rifler', ovr: 94 },
    { id: 'olofmeister', name: 'olofmeister', role: 'Rifler', ovr: 94 },
    { id: 'ropz', name: 'ropz', role: 'Lurker', ovr: 93 },
    { id: 'guardian', name: 'GuardiaN', role: 'AWPer', ovr: 93 },
    { id: 'kennys', name: 'kennyS', role: 'AWPer', ovr: 93 },
    { id: 'sh1ro', name: 'sh1ro', role: 'AWPer', ovr: 92 },
    { id: 'electronic', name: 'electronic', role: 'Rifler', ovr: 92 },
    { id: 'rain', name: 'rain', role: 'Entry', ovr: 92 },
    { id: 'dupreeh', name: 'dupreeh', role: 'Entry', ovr: 92 },
    { id: 'flusha', name: 'flusha', role: 'Lurker', ovr: 92 },
    { id: 'magisk', name: 'Magisk', role: 'Rifler', ovr: 91 },
    { id: 'krimz', name: 'KRIMZ', role: 'Rifler', ovr: 91 },
    { id: 'b1t', name: 'b1t', role: 'Rifler', ovr: 91 },
    { id: 'elige', name: 'EliGE', role: 'Rifler', ovr: 91 },
    { id: 'naf', name: 'NAF', role: 'Lurker', ovr: 91 },
    { id: 'twistzz', name: 'Twistzz', role: 'Rifler', ovr: 91 },
    { id: 'ax1le', name: 'Ax1Le', role: 'Rifler', ovr: 91 },
    { id: 'xantares', name: 'XANTARES', role: 'Rifler', ovr: 90 },
    { id: 'fer', name: 'fer', role: 'Entry', ovr: 90 },
    { id: 'snax', name: 'Snax', role: 'Lurker', ovr: 90 },
    { id: 'neo', name: 'NEO', role: 'Rifler', ovr: 90 },
    { id: 'frozen', name: 'frozen', role: 'Rifler', ovr: 90 },
    { id: 'scream', name: 'ScreaM', role: 'Rifler', ovr: 90 },
    { id: 'shox', name: 'shox', role: 'Lurker', ovr: 90 },
    { id: 'fallen', name: 'FalleN', role: 'IGL/AWP', ovr: 89 },
    { id: 'gla1ve', name: 'gla1ve', role: 'IGL', ovr: 89 },
    { id: 'apex', name: 'apEX', role: 'IGL', ovr: 89 },
    { id: 'broky', name: 'broky', role: 'AWPer', ovr: 89 },
    { id: 'jw', name: 'JW', role: 'AWPer', ovr: 89 },
    { id: 'pasha', name: 'pashaBiceps', role: 'Rifler', ovr: 89 },
    { id: 'taz', name: 'TaZ', role: 'IGL', ovr: 89 },
    { id: 'xizt', name: 'Xizt', role: 'IGL', ovr: 89 },
    { id: 'karrigan', name: 'karrigan', role: 'IGL', ovr: 88 },
    { id: 'cadian', name: 'cadiaN', role: 'IGL/AWP', ovr: 88 },
    { id: 'friberg', name: 'friberg', role: 'Entry', ovr: 88 },
    { id: 'taco', name: 'TACO', role: 'Support', ovr: 88 },
    { id: 'perfecto', name: 'Perfecto', role: 'Support', ovr: 88 },
    { id: 'jks', name: 'jks', role: 'Lurker', ovr: 88 },
    { id: 'yekindar', name: 'YEKINDAR', role: 'Entry', ovr: 88 },
    { id: 'stavn', name: 'stavn', role: 'Rifler', ovr: 88 },
    { id: 'jabbi', name: 'jabbi', role: 'Rifler', ovr: 87 },
    { id: 'mezii', name: 'mezii', role: 'Support', ovr: 87 },
    { id: 'torzsi', name: 'torzsi', role: 'AWPer', ovr: 87 },
    { id: 'xertion', name: 'xertioN', role: 'Entry', ovr: 87 },
    { id: 'jimpphat', name: 'Jimpphat', role: 'Lurker', ovr: 87 },
    { id: 'nbk', name: 'NBK-', role: 'Support', ovr: 87 },
    { id: 'fnx', name: 'fnx', role: 'Rifler', ovr: 87 },
    { id: 'happy', name: 'Happy', role: 'IGL/Lurker', ovr: 87 },
    { id: 'nertz', name: 'NertZ', role: 'Rifler', ovr: 86 },
    { id: 'flamez', name: 'flameZ', role: 'Entry', ovr: 86 },
    { id: 'w0nderful', name: 'w0nderful', role: 'AWPer', ovr: 86 },
    { id: 'aleksib', name: 'Aleksib', role: 'IGL', ovr: 86 },
    { id: 'siuhy', name: 'siuhy', role: 'IGL', ovr: 86 },
    { id: 'hunter', name: 'huNter-', role: 'Rifler', ovr: 86 },
    { id: 'malbs', name: 'malbsMd', role: 'Rifler', ovr: 86 },
    { id: 'spinx', name: 'Spinx', role: 'Lurker', ovr: 86 },
    { id: 'insani', name: 'insani', role: 'Rifler', ovr: 85 },
    { id: 'kscerato', name: 'KSCERATO', role: 'Rifler', ovr: 85 },
    { id: 'art', name: 'arT', role: 'IGL/Entry', ovr: 84 },
    { id: 'jame', name: 'Jame', role: 'IGL/AWP', ovr: 84 },
    { id: 'roman', name: 'roman', role: 'Rifler', ovr: 83 },
    { id: 'sener1', name: 'SENER1', role: 'Support', ovr: 82 },
  ];

  // Prestige and salary are game values, not current world rankings or salaries.
  const TEAM_CATALOG = [
    { id: 'gamerlegion', name: 'GamerLegion', prestige: 50, tier: 'C', salary: 0 },
    { id: 'monte', name: 'Monte', prestige: 52, tier: 'C', salary: 0 },
    { id: 'pain', name: 'paiN', prestige: 55, tier: 'C', salary: 0 },
    { id: 'big', name: 'BIG', prestige: 58, tier: 'C', salary: 1 },
    { id: 'complexity', name: 'Complexity', prestige: 64, tier: 'B', salary: 1 },
    { id: 'fnatic', name: 'fnatic', prestige: 66, tier: 'B', salary: 1 },
    { id: 'nip', name: 'Ninjas in Pyjamas', prestige: 68, tier: 'B', salary: 1 },
    { id: 'liquid', name: 'Team Liquid', prestige: 72, tier: 'A', salary: 2 },
    { id: 'furia', name: 'FURIA', prestige: 73, tier: 'A', salary: 2 },
    { id: 'vp', name: 'Virtus.pro', prestige: 75, tier: 'A', salary: 2 },
    { id: 'mouz', name: 'MOUZ', prestige: 78, tier: 'A', salary: 2 },
    { id: 'g2', name: 'G2', prestige: 84, tier: 'S', salary: 3 },
    { id: 'astralis', name: 'Astralis', prestige: 86, tier: 'S', salary: 3 },
    { id: 'faze', name: 'FaZe', prestige: 88, tier: 'S', salary: 3 },
    { id: 'navi', name: 'Natus Vincere', prestige: 91, tier: 'S', salary: 4 },
    { id: 'vitality', name: 'Vitality', prestige: 93, tier: 'S', salary: 4 },
    { id: 'spirit', name: 'Team Spirit', prestige: 94, tier: 'S', salary: 4 },
  ];

  const ROLE_LABELS = {
    reserve: '替补',
    rotation: '轮换',
    starter: '首发',
    core: '队内核心',
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);
  const currentDateKey = () => `${state.date.year}-${state.date.month}`;

  const teamState = {
    currentTeamId: null,
    roster: [],
    contractMonths: 24,
    joinedYear: 1,
    joinedMonth: 1,
    activeOffers: [],
    formerTeams: [],
    transferHistory: [],
    lastRole: null,
    initialized: false,
    captain: false,
  };

  state.teamSystem = teamState;

  function getTeam(id = teamState.currentTeamId) {
    return TEAM_CATALOG.find((team) => team.id === id) || null;
  }

  function getUserOvr() {
    const score = state.flags.totalScore || 0;
    const majorWins = state.flags.majorWins || 0;
    const value = 58
      + (state.stats.aim * 1.25)
      + (state.stats.tactics * 0.85)
      + (state.stats.coach * 0.45)
      + (score * 0.9)
      + (majorWins * 3)
      + (teamState.captain ? 1 : 0);
    return clamp(Math.round(value), 58, 99);
  }

  function marketValue() {
    const base = 42
      + state.stats.aim * 1.65
      + state.stats.tactics * 0.9
      + (state.flags.totalScore || 0) * 2.2
      + (state.flags.sWins || 0) * 1.2
      + (state.flags.majorWins || 0) * 7;
    return clamp(Math.round(base), 45, 99);
  }

  function relationLabel(value) {
    if (value < 25) return '关系紧张';
    if (value < 45) return '生疏';
    if (value < 65) return '正常';
    if (value < 80) return '默契';
    return '挚友';
  }

  function averageRelation() {
    if (!teamState.roster.length) return 50;
    return Math.round(teamState.roster.reduce((sum, player) => sum + player.relation, 0) / teamState.roster.length);
  }

  function teammateAverageOvr() {
    if (!teamState.roster.length) return 80;
    return teamState.roster.reduce((sum, player) => sum + player.ovr, 0) / teamState.roster.length;
  }

  function getRole() {
    const diff = getUserOvr() - teammateAverageOvr();
    if (diff < -12) return 'reserve';
    if (diff < -5) return 'rotation';
    if (diff < 5) return 'starter';
    return 'core';
  }

  function chemistryBoost() {
    const team = getTeam();
    if (!team) return 0;
    const prestigePart = (team.prestige - 65) / 18;
    const relationPart = (averageRelation() - 50) / 24;
    const captainPart = teamState.captain ? 0.4 : 0;
    return clamp(Math.round(prestigePart + relationPart + captainPart), -2, 3);
  }

  function targetRange(team) {
    if (team.prestige >= 90) return [89, 98];
    if (team.prestige >= 82) return [87, 96];
    if (team.prestige >= 72) return [85, 93];
    if (team.prestige >= 62) return [83, 91];
    return [82, 89];
  }

  function selectPlayer(predicate, min, max, used) {
    let pool = PLAYER_POOL.filter((p) => predicate(p) && p.ovr >= min && p.ovr <= max && !used.has(p.id));
    if (!pool.length) pool = PLAYER_POOL.filter((p) => predicate(p) && !used.has(p.id));
    if (!pool.length) pool = PLAYER_POOL.filter((p) => !used.has(p.id));
    const player = sample(pool);
    used.add(player.id);
    return player;
  }

  function makeRoster(team, excludeIds = []) {
    const [min, max] = targetRange(team);
    const used = new Set(excludeIds);
    const selected = [];

    selected.push(selectPlayer((p) => p.role.includes('IGL'), min, max, used));
    selected.push(selectPlayer((p) => p.role.includes('AWP'), min, max, used));
    selected.push(selectPlayer((p) => ['Entry', 'Rifler', 'Lurker'].some((r) => p.role.includes(r)), min, max, used));
    selected.push(selectPlayer((p) => ['Rifler', 'Lurker', 'Support', 'Entry'].some((r) => p.role.includes(r)), min, max, used));

    return selected.map((player) => ({
      ...player,
      relation: 42 + Math.floor(Math.random() * 22),
    }));
  }

  function addRelation(playerId, delta, reason = '') {
    const teammate = teamState.roster.find((p) => p.id === playerId);
    if (!teammate) return;
    const old = teammate.relation;
    teammate.relation = clamp(teammate.relation + delta, 0, 100);
    if (reason) logic.log(`${teammate.name} 好感 ${old} → ${teammate.relation} (${reason})`, delta >= 0 ? 'pos' : 'neg');
  }

  function addAllRelations(delta, reason = '') {
    teamState.roster.forEach((p) => {
      p.relation = clamp(p.relation + delta, 0, 100);
    });
    if (reason) logic.log(`全队关系 ${delta >= 0 ? '+' : ''}${delta} (${reason})`, delta >= 0 ? 'pos' : 'neg');
  }

  function initializeTeam() {
    if (teamState.initialized) return;
    const startingTeam = sample(TEAM_CATALOG.filter((team) => team.prestige <= 58));
    teamState.currentTeamId = startingTeam.id;
    teamState.roster = makeRoster(startingTeam);
    teamState.contractMonths = 24;
    teamState.joinedYear = state.date.year;
    teamState.joinedMonth = state.date.month;
    teamState.lastRole = getRole();
    teamState.initialized = true;
    logic.log(`签约 ${startingTeam.name}，身份：${ROLE_LABELS[teamState.lastRole]}`, 'pos');
  }

  function updateRole() {
    if (!teamState.initialized) return;
    const role = getRole();
    if (teamState.lastRole && role !== teamState.lastRole) {
      logic.log(`队内地位变化：${ROLE_LABELS[teamState.lastRole]} → ${ROLE_LABELS[role]}`, 'pos');
      if (role === 'starter' || role === 'core') logic.modStat('san', 1, '进入更重要的队内角色');
    }
    teamState.lastRole = role;
  }

  function addTeamButton() {
    const honorButton = document.querySelector('.area-stats button[onclick="ui.showHonorRoom()"]');
    if (!honorButton || document.getElementById('btn-team-hub')) return;
    const parent = honorButton.parentElement;
    const button = document.createElement('button');
    button.id = 'btn-team-hub';
    button.className = 'btn btn-primary';
    button.style.flex = '1';
    button.innerHTML = '<i class="fa-solid fa-users"></i> 战队';
    button.onclick = () => teamSystem.openHub();
    parent.appendChild(button);
  }

  function injectStyles() {
    if (document.getElementById('team-system-styles')) return;
    const style = document.createElement('style');
    style.id = 'team-system-styles';
    style.textContent = `
      .team-summary-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:14px; }
      .team-summary-card { background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:10px; text-align:center; }
      .team-summary-value { font-size:1.05rem; font-weight:700; color:#2563eb; }
      .team-summary-label { font-size:.75rem; color:#64748b; margin-top:2px; }
      .teammate-card { border:1px solid #e5e7eb; border-radius:8px; padding:10px; margin-bottom:8px; background:#fff; }
      .teammate-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .teammate-name { font-weight:700; }
      .teammate-meta { font-size:.78rem; color:#64748b; }
      .relation-row { display:flex; align-items:center; gap:8px; margin-top:8px; }
      .relation-track { height:7px; background:#e5e7eb; border-radius:99px; flex:1; overflow:hidden; }
      .relation-fill { height:100%; background:#10b981; border-radius:99px; }
      .transfer-offer { border:1px solid #dbeafe; background:#eff6ff; border-radius:9px; padding:12px; margin-bottom:10px; }
      .team-note { font-size:.75rem; color:#94a3b8; margin-top:12px; line-height:1.45; }
      @media(max-width:520px){ .team-summary-grid{ grid-template-columns:1fr 1fr; } }
    `;
    document.head.appendChild(style);
  }

  function teammateCardsHtml() {
    return teamState.roster.map((player) => `
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
      </div>
    `).join('');
  }

  function openHub() {
    if (!teamState.initialized) initializeTeam();
    const team = getTeam();
    const role = getRole();
    const chemistry = averageRelation();
    const html = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px">
        <div>
          <div style="font-size:1.2rem;font-weight:800">${team.name}</div>
          <div style="font-size:.8rem;color:#64748b">Tier ${team.tier} · 战队声望 ${team.prestige}</div>
        </div>
        <span class="result-tag res-top4" style="font-size:.8rem">${ROLE_LABELS[role]}</span>
      </div>
      <div class="team-summary-grid">
        <div class="team-summary-card"><div class="team-summary-value">${getUserOvr()}</div><div class="team-summary-label">你的 OVR</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${chemistry}</div><div class="team-summary-label">队内化学反应</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${teamState.contractMonths}</div><div class="team-summary-label">合同剩余（月）</div></div>
        <div class="team-summary-card"><div class="team-summary-value">${marketValue()}</div><div class="team-summary-label">市场身价</div></div>
      </div>
      <div style="font-weight:700;margin-bottom:8px">队友</div>
      ${teammateCardsHtml()}
      ${teamState.activeOffers.length ? `<button class="btn btn-warning" style="width:100%;margin-top:6px" onclick="teamSystem.showTransferWindow()"><i class="fa-solid fa-right-left"></i> 查看 ${teamState.activeOffers.length} 份转会报价</button>` : ''}
      <div class="team-note">模拟阵容会混合不同时代的 Counter-Strike 选手，仅用于游戏。OVR、战队声望和薪资是内部平衡数值，不代表现实排名、合同或当前阵容。</div>
    `;
    ui.showModal('战队中心', html, [{ text: '关闭', class: 'btn-outline', cb: () => ui.closeModal() }]);
  }

  function interact(playerId) {
    const teammate = teamState.roster.find((p) => p.id === playerId);
    if (!teammate) return;
    const usedKey = state.flags.teamInteractionMonth;
    if (usedKey === currentDateKey()) {
      ui.showModal('本月已经互动过', '训练和比赛安排很满，这个月你已经抽时间和队友单独交流过了。', [
        { text: '知道了', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      return;
    }

    ui.showModal(`和 ${teammate.name} 互动`, `
      <p style="margin-bottom:10px">当前关系：<strong>${teammate.relation}</strong>（${relationLabel(teammate.relation)}）</p>
      <p style="font-size:.85rem;color:#64748b">每个月只能进行一次额外队友互动。</p>
    `, [
      {
        text: '一起双排',
        class: 'btn-primary',
        cb: () => {
          state.flags.teamInteractionMonth = currentDateKey();
          logic.modStat('san', -1, '陪队友双排');
          addRelation(playerId, 8, '一起双排');
          ui.closeModal();
          ui.render();
        },
      },
      {
        text: '一起复盘',
        class: 'btn-outline',
        cb: () => {
          state.flags.teamInteractionMonth = currentDateKey();
          logic.modStat('san', -1, '额外复盘');
          if (Math.random() < 0.35) logic.modStat('tactics', 1, `和 ${teammate.name} 复盘`);
          addRelation(playerId, 6, '一起复盘');
          ui.closeModal();
          ui.render();
        },
      },
      {
        text: '请他吃饭',
        class: 'btn-warning',
        cb: () => {
          if (!logic.checkMoney(1)) return;
          state.flags.teamInteractionMonth = currentDateKey();
          logic.modStat('money', -1, '请队友吃饭');
          logic.modStat('san', 1, '轻松聚餐');
          addRelation(playerId, 10, '赛后聚餐');
          ui.closeModal();
          ui.render();
        },
      },
    ]);
  }

  function generateOffers(force = false) {
    if (!teamState.initialized) return [];
    const current = getTeam();
    const value = marketValue();
    let candidates = TEAM_CATALOG.filter((team) => team.id !== current.id);

    if (!force) {
      candidates = candidates.filter((team) => {
        const upper = value + (state.phase === 'pro' ? 8 : 4);
        const lower = Math.max(45, current.prestige - 4);
        return team.prestige <= upper && team.prestige >= lower;
      });
    } else {
      candidates = candidates.filter((team) => team.prestige <= value + 10);
    }

    candidates = shuffle(candidates)
      .sort((a, b) => Math.abs(a.prestige - value) - Math.abs(b.prestige - value))
      .slice(0, 3);

    teamState.activeOffers = candidates.map((team) => ({
      teamId: team.id,
      signBonus: clamp(1 + Math.round((team.prestige - current.prestige) / 12), 1, 6),
      contractMonths: team.prestige >= 84 ? 24 : 18,
    }));
    return teamState.activeOffers;
  }

  function showTransferWindow(force = false) {
    if (!teamState.activeOffers.length) generateOffers(force);
    const offers = teamState.activeOffers;
    if (!offers.length) {
      ui.showModal('转会市场', '经纪人转了一圈，目前没有收到比现状更合适的正式报价。', [
        { text: '留队继续打', class: 'btn-primary', cb: () => ui.closeModal() },
      ]);
      return;
    }

    const html = offers.map((offer) => {
      const team = getTeam(offer.teamId);
      return `
        <div class="transfer-offer">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <div>
              <div style="font-weight:800">${team.name}</div>
              <div style="font-size:.78rem;color:#64748b">Tier ${team.tier} · 声望 ${team.prestige} · 月薪加成 +${team.salary}</div>
              <div style="font-size:.78rem;color:#64748b">签字费 ${offer.signBonus} 金币 · ${offer.contractMonths} 个月合同</div>
            </div>
            <button class="btn btn-success" style="padding:7px 10px" onclick="teamSystem.acceptOffer('${team.id}')">接受</button>
          </div>
        </div>
      `;
    }).join('');

    ui.showModal('转会窗口', `
      <p style="margin-bottom:12px;color:#475569">你的市场身价：<strong>${marketValue()}</strong>。不同战队会提供不同薪资和队内竞争环境。</p>
      ${html}
    `, [
      {
        text: '留在当前战队',
        class: 'btn-outline',
        cb: () => {
          addAllRelations(1, '拒绝转会继续留队');
          teamState.activeOffers = [];
          ui.closeModal();
        },
      },
    ]);
  }

  function acceptOffer(teamId) {
    const offer = teamState.activeOffers.find((o) => o.teamId === teamId);
    const newTeam = getTeam(teamId);
    const oldTeam = getTeam();
    if (!offer || !newTeam || !oldTeam) return;

    const oldChemistry = averageRelation();
    const oldRoster = teamState.roster.map((p) => ({ id: p.id, name: p.name, relation: p.relation }));
    teamState.formerTeams.push({
      id: oldTeam.id,
      name: oldTeam.name,
      leftYear: state.date.year,
      leftMonth: state.date.month,
      roster: oldRoster,
    });
    teamState.transferHistory.push({ from: oldTeam.name, to: newTeam.name, year: state.date.year, month: state.date.month });

    teamState.currentTeamId = newTeam.id;
    teamState.roster = makeRoster(newTeam, oldRoster.map((p) => p.id));
    teamState.contractMonths = offer.contractMonths;
    teamState.joinedYear = state.date.year;
    teamState.joinedMonth = state.date.month;
    teamState.activeOffers = [];
    teamState.captain = false;

    logic.modStat('money', offer.signBonus, `${newTeam.name} 签字费`);
    if (oldChemistry >= 72) logic.modStat('san', -1, '和关系很好的老队友告别');
    logic.log(`完成转会：${oldTeam.name} → ${newTeam.name}`, 'pos');
    updateRole();
    ui.closeModal();
    ui.render();
    setTimeout(() => openHub(), 220);
  }

  function renewContract() {
    const team = getTeam();
    teamState.contractMonths = team.prestige >= 80 ? 24 : 18;
    logic.modStat('money', 2, `${team.name} 续约签字费`);
    logic.modStat('coach', 1, '完成续约');
    addAllRelations(2, '继续并肩作战');
    ui.closeModal();
  }

  function enterFreeAgency() {
    teamState.activeOffers = [];
    ui.closeModal();
    setTimeout(() => showTransferWindow(true), 220);
  }

  function showRenewal() {
    const team = getTeam();
    ui.showModal('合同到期', `${team.name} 希望和你续约。你也可以拒绝续约，直接进入自由市场。`, [
      { text: '续约', class: 'btn-primary', cb: renewContract },
      { text: '进入自由市场', class: 'btn-warning', cb: enterFreeAgency },
    ]);
  }

  function monthlyTeamTick() {
    if (!teamState.initialized || !state.started) return;
    const team = getTeam();
    teamState.contractMonths = Math.max(0, teamState.contractMonths - 1);

    if (team.salary > 0) logic.modStat('money', team.salary, `${team.name} 合同工资`);

    if (teamState.roster.length) {
      const teammate = sample(teamState.roster);
      const drift = Math.random() < 0.58 ? 1 : -1;
      teammate.relation = clamp(teammate.relation + drift, 0, 100);
    }

    updateRole();

    if (teamState.contractMonths === 0) showRenewal();

    // Two transfer windows per season. Rookie offers are more conservative.
    if ((state.date.month === 1 || state.date.month === 8) && teamState.contractMonths > 0) {
      const offers = generateOffers(false);
      const chance = state.phase === 'pro' ? 0.85 : 0.5;
      if (offers.length && Math.random() < chance) showTransferWindow(false);
    }
  }

  function replaceTeammate(playerId) {
    const index = teamState.roster.findIndex((p) => p.id === playerId);
    if (index < 0) return null;
    const team = getTeam();
    const used = teamState.roster.filter((_, i) => i !== index).map((p) => p.id);
    const [min, max] = targetRange(team);
    const replacement = selectPlayer(() => true, min, max, new Set(used));
    teamState.roster[index] = { ...replacement, relation: 45 + Math.floor(Math.random() * 15) };
    return replacement;
  }

  function randomTeammate() {
    return teamState.roster.length ? sample(teamState.roster) : null;
  }

  function lowestRelationTeammate() {
    return teamState.roster.slice().sort((a, b) => a.relation - b.relation)[0] || null;
  }

  function highestRelationTeammate() {
    return teamState.roster.slice().sort((a, b) => b.relation - a.relation)[0] || null;
  }

  function installTeamEvents() {
    if (typeof RANDOM_EVENTS === 'undefined') return;

    const events = [
      {
        id: 'team-duo-invite',
        title: '队友来敲门',
        condition: () => teamState.initialized && Boolean(randomTeammate()),
        text: () => {
          const mate = randomTeammate();
          state.flags.teamEventTarget = mate ? mate.id : null;
          return `${mate ? mate.name : '队友'} 问你晚上要不要一起打几把天梯。明天上午还有正式训练。`;
        },
        type: 'choice',
        choices: [
          {
            text: '陪他打（心态-1，关系提升）',
            cb: (l) => {
              const id = state.flags.teamEventTarget;
              l.modStat('san', -1, '陪队友双排');
              if (id) addRelation(id, 7, '一起打天梯');
            },
          },
          { text: '早点休息（心态+1）', cb: (l) => l.modStat('san', 1, '规律休息') },
        ],
      },
      {
        id: 'team-low-relation-conflict',
        title: '更衣室摩擦',
        condition: () => teamState.initialized && lowestRelationTeammate() && lowestRelationTeammate().relation <= 30,
        weight: 1.6,
        text: () => {
          const mate = lowestRelationTeammate();
          state.flags.teamEventTarget = mate ? mate.id : null;
          return `${mate ? mate.name : '一名队友'} 在复盘时直接质疑你的沟通方式，气氛瞬间变得很僵。`;
        },
        type: 'choice',
        choices: [
          {
            text: '私下把话说开（心态-1，关系+12）',
            cb: (l) => {
              const id = state.flags.teamEventTarget;
              l.modStat('san', -1, '处理队内矛盾');
              if (id) addRelation(id, 12, '坦诚沟通');
            },
          },
          {
            text: '当场顶回去（关系-8，教练-1）',
            cb: (l) => {
              const id = state.flags.teamEventTarget;
              if (id) addRelation(id, -8, '公开争执');
              l.modStat('coach', -1, '更衣室冲突');
            },
          },
        ],
      },
      {
        id: 'team-high-relation-support',
        title: '有人替你说话',
        condition: () => teamState.initialized && highestRelationTeammate() && highestRelationTeammate().relation >= 80,
        weight: 0.8,
        text: () => {
          const mate = highestRelationTeammate();
          state.flags.teamEventTarget = mate ? mate.id : null;
          return `最近外界对你的状态有不少质疑，${mate ? mate.name : '队友'} 在采访里主动替你说话：“他对这支队伍的重要性，外面的人看不到。”`;
        },
        effect: (l) => {
          l.modStat('san', 2, '队友公开支持');
          l.modStat('coach', 1, '队内团结');
        },
      },
      {
        id: 'team-teammate-slump',
        title: '队友陷入低谷',
        condition: () => teamState.initialized && Boolean(randomTeammate()),
        text: () => {
          const mate = randomTeammate();
          state.flags.teamEventTarget = mate ? mate.id : null;
          return `${mate ? mate.name : '队友'} 最近连续几场数据都很差，训练结束后一个人坐在电脑前没走。`;
        },
        type: 'choice',
        choices: [
          {
            text: '留下来陪他复盘（心态-1，关系+10，教练+1）',
            cb: (l) => {
              const id = state.flags.teamEventTarget;
              l.modStat('san', -1, '陪队友加班复盘');
              l.modStat('coach', 1, '帮助队友');
              if (id) addRelation(id, 10, '陪伴低谷');
            },
          },
          { text: '给他一点空间（无事发生）', cb: () => {} },
        ],
      },
      {
        id: 'team-teammate-offer',
        title: '队友也收到了报价',
        condition: () => teamState.initialized && state.phase === 'pro' && Boolean(randomTeammate()),
        weight: 0.65,
        text: () => {
          const mate = randomTeammate();
          state.flags.teamEventTarget = mate ? mate.id : null;
          return `${mate ? mate.name : '队友'} 私下告诉你，他收到另一支战队的报价，正在认真考虑离开。`;
        },
        type: 'choice',
        choices: [
          {
            text: '劝他留下（关系+8）',
            cb: () => {
              const id = state.flags.teamEventTarget;
              if (id) addRelation(id, 8, '希望继续并肩作战');
            },
          },
          {
            text: '支持他追求更好的机会',
            cb: (l) => {
              const id = state.flags.teamEventTarget;
              const mate = teamState.roster.find((p) => p.id === id);
              if (id) addRelation(id, 10, '尊重职业选择');
              if (mate && Math.random() < 0.38) {
                const replacement = replaceTeammate(id);
                l.modStat('san', -1, '熟悉的队友离队');
                logic.log(`${mate.name} 转会离队，${replacement ? replacement.name : '新选手'} 加入阵容`);
              }
            },
          },
        ],
      },
      {
        id: 'team-old-club-reunion',
        title: '遇到老东家',
        condition: () => teamState.formerTeams.length > 0 && state.phase === 'pro',
        weight: 0.8,
        text: () => {
          const former = teamState.formerTeams[teamState.formerTeams.length - 1];
          state.flags.teamFormerTarget = former.name;
          return `赛事抽签公布，你下一轮的对手正是老东家 ${former.name}。赛前通道里，你看到几个熟悉的面孔。`;
        },
        type: 'choice',
        choices: [
          {
            text: '主动过去打招呼（心态+2）',
            cb: (l) => l.modStat('san', 2, '和老队友重逢'),
          },
          {
            text: '先把情绪放一边（教练+1）',
            cb: (l) => l.modStat('coach', 1, '专注当前战队'),
          },
        ],
      },
      {
        id: 'team-captain-offer',
        title: '队长袖标',
        condition: () => teamState.initialized && !teamState.captain && getRole() === 'core' && state.stats.tactics >= 12 && state.stats.coach >= 12,
        weight: 1.2,
        text: '教练单独找你谈话，希望你承担更多临场沟通和队内责任，正式成为队长之一。',
        type: 'choice',
        choices: [
          {
            text: '接下队长职责（战术+1，全队关系+4）',
            cb: (l) => {
              teamState.captain = true;
              l.modStat('tactics', 1, '承担队长职责');
              addAllRelations(4, '成为队长');
            },
          },
          { text: '只想专注个人发挥（心态+1）', cb: (l) => l.modStat('san', 1, '减少额外责任') },
        ],
      },
      {
        id: 'team-bench-pressure',
        title: '替补席压力',
        condition: () => teamState.initialized && getRole() === 'reserve' && state.date.year >= 2,
        weight: 1.4,
        text: '最近正式比赛你连续坐在替补席。教练说，如果训练表现没有明显变化，短期内不会调整首发。',
        type: 'choice',
        choices: [
          {
            text: '加练证明自己（心态-2，枪法+1）',
            cb: (l) => {
              l.modStat('san', -2, '替补期加练');
              l.modStat('aim', 1, '争夺首发');
            },
          },
          { text: '耐心等机会（心态+1，教练+1）', cb: (l) => { l.modStat('san', 1, '调整心态'); l.modStat('coach', 1, '服从安排'); } },
        ],
      },
    ];

    RANDOM_EVENTS.push(...events);
    console.info(`[team-system] Added ${events.length} team/relationship career events.`);
  }

  // Team quality and chemistry slightly affect normal cup results by modifying
  // the locked preparation scores before the original match resolver runs.
  const originalFinalizeMatch = logic.finalizeMatch.bind(logic);
  logic.finalizeMatch = (slot, mods = { self: 0, team: 0, opp: 0 }) => {
    if (!teamState.initialized || !slot || !slot.savedScores) return originalFinalizeMatch(slot, mods);
    const originalScores = { ...slot.savedScores };
    const boost = chemistryBoost();
    slot.savedScores = {
      tac: Math.max(0, originalScores.tac + boost),
      trn: Math.max(0, originalScores.trn + boost),
      real: Math.max(0, originalScores.real + boost),
    };
    try {
      return originalFinalizeMatch(slot, mods);
    } finally {
      slot.savedScores = originalScores;
    }
  };

  const originalInit = logic.init.bind(logic);
  logic.init = (roleId) => {
    originalInit(roleId);
    initializeTeam();
    addTeamButton();
    ui.render();
  };

  const originalNextMonth = logic.nextMonth.bind(logic);
  logic.nextMonth = () => {
    originalNextMonth();
    monthlyTeamTick();
    ui.render();
  };

  const originalRender = ui.render.bind(ui);
  ui.render = () => {
    originalRender();
    addTeamButton();
  };

  const teamSystem = {
    openHub,
    interact,
    showTransferWindow,
    acceptOffer,
    renewContract,
    enterFreeAgency,
    getUserOvr,
    marketValue,
    getRole,
    averageRelation,
    addRelation,
  };

  window.teamSystem = teamSystem;
  injectStyles();
  addTeamButton();
  installTeamEvents();

  console.info(`[team-system] Loaded ${PLAYER_POOL.length} historical players and ${TEAM_CATALOG.length} simulated organizations.`);
})();

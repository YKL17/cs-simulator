(() => {
  if (typeof state === 'undefined' || !window.logic || !window.ui) {
    console.warn('[team-system] Core game objects are not ready.');
    return;
  }

  // Snapshot: Valve/HLTV lineups around 2026-08-03 to 2026-08-11.
  // OVR, prestige and salary are GAME BALANCE values. Player/team names and
  // starting five-man lineups follow the current competitive CS2 snapshot.
  const TEAM_CATALOG = [
    { id:'spirit', name:'Team Spirit', valveRank:1, prestige:95, tier:'S', salary:4, base:91, roster:[['sh1ro','AWPer',4],['magixx','Rifler',-1],['tN1R','Rifler',0],['zont1x','Rifler',1],['donk','Entry',7]] },
    { id:'falcons', name:'Falcons', valveRank:2, prestige:94, tier:'S', salary:4, base:91, roster:[['karrigan','IGL',-3],['NiKo','Rifler',4],['TeSeS','Rifler',0],['m0NESY','AWPer',6],['kyousuke','Entry',3]] },
    { id:'mouz', name:'MOUZ', valveRank:3, prestige:92, tier:'S', salary:4, base:88, roster:[['torzsi','AWPer',1],['Spinx','Rifler',3],['xertioN','Entry',2],['PR','Rifler',0],['xelex','Rifler',-1]] },
    { id:'9z', name:'9z', valveRank:4, prestige:91, tier:'S', salary:3, base:87, roster:[['max','IGL',0],['dgt','Rifler',2],['meyern','Rifler',-1],['luchov','Rifler',3],['HUASOPEEK','Rifler',1]] },
    { id:'vitality', name:'Vitality', valveRank:5, prestige:93, tier:'S', salary:4, base:90, roster:[['apEX','IGL',-2],['ropz','Lurker',4],['ZywOo','AWPer',8],['flameZ','Entry',1],['mezii','Support',0]] },
    { id:'navi', name:'Natus Vincere', valveRank:6, prestige:90, tier:'S', salary:4, base:87, roster:[['Aleksib','IGL',-2],['iM','Rifler',2],['b1t','Rifler',3],['w0nderful','AWPer',2],['makazze','Rifler',2]] },
    { id:'legacy', name:'Legacy', valveRank:7, prestige:87, tier:'A', salary:3, base:84, roster:[['arT','IGL/Entry',0],['dumau','Rifler',3],['latto','Rifler',1],['n1ssim','Rifler',1],['saadzin','AWPer',0]] },
    { id:'furia', name:'FURIA', valveRank:8, prestige:89, tier:'S', salary:3, base:87, roster:[['FalleN','IGL/AWP',-2],['yuurih','Rifler',2],['YEKINDAR','Entry',1],['KSCERATO','Rifler',4],['molodoy','AWPer',3]] },
    { id:'betboom', name:'BetBoom', valveRank:9, prestige:85, tier:'A', salary:3, base:84, roster:[['Boombl4','IGL',-1],['zorte','AWPer',2],['d1Ledez','Rifler',0],['FL4MUS','Entry',1],['Magnojez','Rifler',2]] },
    { id:'aurora', name:'Aurora', valveRank:10, prestige:85, tier:'A', salary:3, base:84, roster:[['XANTARES','Rifler',4],['woxic','AWPer',1],['Jimpphat','Lurker',2],['kyxsan','IGL',-1],['Wicadia','Entry',1]] },
    { id:'g2', name:'G2', valveRank:11, prestige:84, tier:'A', salary:3, base:84, roster:[['huNter-','Rifler',0],['NertZ','Rifler',2],['SunPayus','AWPer',2],['HeavyGod','Rifler',2],['MATYS','Entry',1]] },
    { id:'parivision', name:'PARIVISION', valveRank:12, prestige:82, tier:'A', salary:2, base:82, roster:[['HObbit','Rifler',0],['Jame','IGL/AWP',1],['xiELO','Rifler',1],['zweih','Rifler',2],['slaxejezzz','Rifler',0]] },
    { id:'faze', name:'FaZe', valveRank:13, prestige:83, tier:'A', salary:3, base:82, roster:[['frozen','Rifler',3],['Twistzz','Rifler',2],['Neityu','Rifler',0],['jcobbb','Rifler',0],['JBOEN','Player',-1]] },
    { id:'fut', name:'FUT', valveRank:14, prestige:81, tier:'A', salary:2, base:81, roster:[['dem0n','Rifler',1],['lauNX','Rifler',2],['Krabeni','Rifler',0],['cmtry','Player',0],['dziugss','Player',1]] },
    { id:'mongolz', name:'The MongolZ', valveRank:15, prestige:81, tier:'A', salary:2, base:81, roster:[['bLitz','IGL',0],['Techno','Rifler',2],['mzinho','Rifler',1],['910','AWPer',2],['cobrazera','Rifler',0]] },
    { id:'mibr', name:'MIBR', valveRank:16, prestige:80, tier:'A', salary:2, base:80, roster:[['LNZ','IGL',0],['nqz','AWPer',2],['brnz4n','Rifler',1],['insani','Rifler',3],['venomzera','Rifler',0]] },
    { id:'alliance', name:'Alliance', valveRank:17, prestige:78, tier:'B', salary:2, base:79, roster:[['twist','Rifler',0],['eraa','AWPer',1],['bobeksde','Rifler',1],['upE','Rifler',0],['avid','Rifler',1]] },
    { id:'tyloo', name:'TYLOO', valveRank:18, prestige:78, tier:'B', salary:2, base:79, roster:[['JamYoung','Rifler',2],['Jee','AWPer',1],['Mercury','Rifler',1],['Moseyuh','Rifler',2],['Zero','IGL',-1]] },
    { id:'astralis', name:'Astralis', valveRank:19, prestige:79, tier:'B', salary:2, base:80, roster:[['HooXi','IGL',-2],['phzy','AWPer',1],['jabbi','Rifler',2],['Staehr','Rifler',2],['ryu','Rifler',0]] },
    { id:'b8', name:'B8', valveRank:20, prestige:77, tier:'B', salary:2, base:79, roster:[['alex666','Rifler',1],['npl','Rifler',2],['kensizor','Rifler',1],['esenthial','Rifler',0],['s1zzi','Player',0]] },
    { id:'big', name:'BIG', valveRank:21, prestige:76, tier:'B', salary:2, base:78, roster:[['tabseN','IGL',-1],['JDC','Rifler',1],['faveN','Rifler',1],['blameF','Rifler',3],['gr1ks','AWPer',1]] },
    { id:'gamerlegion', name:'GamerLegion', valveRank:22, prestige:75, tier:'B', salary:2, base:78, roster:[['Snax','IGL',-1],['REZ','Rifler',1],['Tauson','Rifler',1],['PR','Rifler',1],['hypex','AWPer',0]] },
    { id:'magic', name:'magic', valveRank:23, prestige:73, tier:'B', salary:1, base:77, roster:[['MaSvAl','Player',1],['sFade8','Player',0],['AW','Player',1],['mo0N','Player',0],['tenzy','Player',1]] },
    { id:'luminosity', name:'Luminosity', valveRank:24, prestige:72, tier:'B', salary:1, base:77, roster:[['Rainwaker','Rifler',1],['Bymas','Rifler',1],['afro','AWPer',1],['Gizmy','Rifler',0],['AZUWU','Rifler',2]] },
    { id:'pain', name:'paiN', valveRank:26, prestige:70, tier:'B', salary:1, base:76, roster:[['vsm','Rifler',1],['biguzera','IGL',1],['piriajr','Rifler',0],['saffee','AWPer',1],['snow','Rifler',2]] },
    { id:'nip', name:'Ninjas in Pyjamas', valveRank:27, prestige:69, tier:'B', salary:1, base:76, roster:[['Snappi','IGL',-1],['stavn','Rifler',2],['sjuush','Support',1],['n0te','Rifler',0],['xKacpersky','Rifler',1]] },
    { id:'lynnvision', name:'Lynn Vision', valveRank:29, prestige:66, tier:'C', salary:1, base:75, roster:[['Westmelon','Rifler',1],['z4KR','Rifler',1],['Starry','Rifler',2],['EmiliaQAQ','Rifler',0],['C4LLM3SU3','Player',0]] },
    { id:'heroic', name:'HEROIC', valveRank:30, prestige:65, tier:'C', salary:1, base:75, roster:[['Brollan','Rifler',2],['nilo','Rifler',2],['susp','Rifler',0],['MartinezSa','AWPer',1],['Chr1zN','IGL',0]] },
    { id:'3dmax', name:'3DMAX', valveRank:31, prestige:64, tier:'C', salary:1, base:75, roster:[['Maka','AWPer',1],['Lucky','Rifler',1],['misutaaa','Rifler',1],['Kursy','Rifler',0],['Graviti','Rifler',0]] },
    { id:'liquid', name:'Team Liquid', valveRank:32, prestige:65, tier:'C', salary:1, base:76, roster:[['NAF','Rifler',3],['EliGE','Rifler',2],['malbsMd','Rifler',2],['siuhy','IGL',0],['ultimate','AWPer',1]] },
    { id:'m80', name:'M80', valveRank:36, prestige:59, tier:'C', salary:1, base:73, roster:[['slaxz-','AWPer',1],['Swisher','Rifler',1],['s1n','IGL',0],['JBa','Rifler',1],['Lake','Rifler',1]] },
    { id:'flyquest', name:'FlyQuest', valveRank:41, prestige:55, tier:'C', salary:1, base:72, roster:[['jks','Rifler',3],['Gratisfaction','AWPer',0],['INS','IGL',0],['Vexite','Rifler',1],['nettik','Rifler',1]] },
    { id:'gentlemates', name:'Gentle Mates', valveRank:45, prestige:52, tier:'C', salary:0, base:71, roster:[['CRUC1AL','AWPer',1],['alex','IGL',0],['mopoz','Entry',1],['sausol','Rifler',1],['dav1g','Rifler',0]] },
    { id:'nrg', name:'NRG', valveRank:49, prestige:49, tier:'C', salary:0, base:71, roster:[['nitr0','IGL',0],['Sonic','Rifler',1],['hallzerk','AWPer',1],['Grim','Rifler',2],['Jeorge','Rifler',1]] },
    { id:'imperial', name:'Imperial', valveRank:59, prestige:45, tier:'C', salary:0, base:69, roster:[['chelo','Rifler',1],['VINI','IGL',0],['decenty','Rifler',1],['noway','Rifler',1],['saadzin','AWPer',0]] },
    { id:'fnatic', name:'fnatic', valveRank:61, prestige:43, tier:'C', salary:0, base:68, roster:[['fEAR','IGL',0],['jambo','AWPer',1],['jackasmo','Rifler',1],['cairne','Rifler',1],['mazay','Rifler',0]] },
  ];

  const ROLE_LABELS = { reserve:'替补', rotation:'轮换', starter:'首发', core:'队内核心' };
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const sample = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const shuffle = (arr) => arr.slice().sort(() => Math.random()-0.5);
  const currentDateKey = () => `${state.date.year}-${state.date.month}`;
  const playerId = (teamId,name) => `${teamId}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g,'')}`;

  const teamState = {
    currentTeamId:null,
    roster:[],
    contractMonths:24,
    joinedYear:1,
    joinedMonth:1,
    activeOffers:[],
    formerTeams:[],
    transferHistory:[],
    lastRole:null,
    initialized:false,
    captain:false,
    selectionMomentum:4,
    startRoute:null,
  };
  state.teamSystem = teamState;

  function getTeam(id=teamState.currentTeamId){ return TEAM_CATALOG.find(t=>t.id===id)||null; }
  function getTeams(){ return TEAM_CATALOG.map(t=>({...t, roster:t.roster.map(r=>r.slice())})); }
  function makeRoster(team){
    if(!team) return [];
    return team.roster.map(([name,role,delta])=>({
      id:playerId(team.id,name), name, role, ovr:clamp(team.base+delta,62,98), relation:44+Math.floor(Math.random()*18)
    }));
  }
  function teammateAverageOvr(){
    if(!teamState.roster.length) return 75;
    return teamState.roster.reduce((s,p)=>s+p.ovr,0)/teamState.roster.length;
  }
  function getUserOvr(){
    const value=72+state.stats.aim*1.4+state.stats.tactics*.85+state.stats.coach*.45+(state.flags.totalScore||0)*.75+(state.flags.majorWins||0)*2.5+(state.phase==='pro'?1:0)+(teamState.captain?1:0);
    return clamp(Math.round(value),60,99);
  }
  function marketValue(){
    return clamp(Math.round(42+state.stats.aim*1.65+state.stats.tactics*.9+(state.flags.totalScore||0)*2.2+(state.flags.sWins||0)*1.2+(state.flags.majorWins||0)*7),45,99);
  }
  function getRole(){
    const momentum=typeof teamState.selectionMomentum==='number'?teamState.selectionMomentum:4;
    const diff=getUserOvr()-teammateAverageOvr()+momentum;
    if(diff<-12) return 'reserve';
    if(diff<-6) return 'rotation';
    if(diff<4) return 'starter';
    return 'core';
  }
  function relationLabel(v){ if(v<25)return'关系紧张'; if(v<45)return'生疏'; if(v<65)return'正常'; if(v<80)return'默契'; return'挚友'; }
  function averageRelation(){ return teamState.roster.length?Math.round(teamState.roster.reduce((s,p)=>s+p.relation,0)/teamState.roster.length):50; }
  function addRelation(id,delta,reason=''){
    const p=teamState.roster.find(x=>x.id===id); if(!p)return;
    const old=p.relation; p.relation=clamp(old+delta,0,100);
    if(reason) logic.log(`${p.name} 好感 ${old} → ${p.relation} (${reason})`,delta>=0?'pos':'neg');
  }
  function addAllRelations(delta,reason=''){
    teamState.roster.forEach(p=>p.relation=clamp(p.relation+delta,0,100));
    if(reason) logic.log(`全队关系 ${delta>=0?'+':''}${delta} (${reason})`,delta>=0?'pos':'neg');
  }

  function pickStartingTeam(){
    // Two career starts coexist: weaker team with a realistic chance to start,
    // or a stronger mid-table team where the player must fight for minutes.
    const weak=TEAM_CATALOG.filter(t=>t.valveRank>=36);
    const mid=TEAM_CATALOG.filter(t=>t.valveRank>=11&&t.valveRank<=18);
    const weakRoute=Math.random()<0.64;
    return { team:sample(weakRoute?weak:mid), route:weakRoute?'weak-starter':'mid-bench' };
  }
  function initializeTeam(){
    if(teamState.initialized)return;
    const start=pickStartingTeam();
    teamState.currentTeamId=start.team.id;
    teamState.roster=makeRoster(start.team);
    teamState.contractMonths=24;
    teamState.joinedYear=state.date.year;
    teamState.joinedMonth=state.date.month;
    teamState.startRoute=start.route;
    teamState.selectionMomentum=start.route==='weak-starter'?5.5:0.5;
    teamState.initialized=true;
    teamState.lastRole=getRole();
    const routeText=start.route==='weak-starter'?'弱队机会：更容易争取首发':'中游试训：阵容更强，需要竞争位置';
    logic.log(`签约 ${start.team.name}（当前快照 Valve #${start.team.valveRank}）· ${routeText} · 身份：${ROLE_LABELS[teamState.lastRole]}`,'pos');
  }
  function updateRole(){
    if(!teamState.initialized)return;
    const r=getRole();
    if(teamState.lastRole&&r!==teamState.lastRole){
      logic.log(`队内地位变化：${ROLE_LABELS[teamState.lastRole]} → ${ROLE_LABELS[r]}`,r==='reserve'?'neg':'pos');
      if(r==='starter'||r==='core') logic.modStat('san',1,'获得更多上场机会');
    }
    teamState.lastRole=r;
  }

  function injectStyles(){
    if(document.getElementById('team-system-styles'))return;
    const s=document.createElement('style'); s.id='team-system-styles'; s.textContent=`
      .team-summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px}.team-summary-card{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center}.team-summary-value{font-size:1.05rem;font-weight:700;color:#2563eb}.team-summary-label{font-size:.75rem;color:#64748b;margin-top:2px}.teammate-card{border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:8px;background:#fff}.teammate-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.teammate-name{font-weight:700}.teammate-meta{font-size:.78rem;color:#64748b}.relation-row{display:flex;align-items:center;gap:8px;margin-top:8px}.relation-track{height:7px;background:#e5e7eb;border-radius:99px;flex:1;overflow:hidden}.relation-fill{height:100%;background:#10b981;border-radius:99px}.transfer-offer{border:1px solid #dbeafe;background:#eff6ff;border-radius:9px;padding:12px;margin-bottom:10px}.team-note{font-size:.75rem;color:#94a3b8;margin-top:12px;line-height:1.45}`;
    document.head.appendChild(s);
  }
  function addTeamButton(){
    const honor=document.querySelector('.area-stats button[onclick="ui.showHonorRoom()"]');
    if(!honor||document.getElementById('btn-team-hub'))return;
    const b=document.createElement('button'); b.id='btn-team-hub'; b.className='btn btn-primary'; b.style.flex='1'; b.innerHTML='<i class="fa-solid fa-users"></i> 战队'; b.onclick=()=>teamSystem.openHub(); honor.parentElement.appendChild(b);
  }
  function teammateCardsHtml(){ return teamState.roster.map(p=>`<div class="teammate-card"><div class="teammate-head"><div><div class="teammate-name">${p.name}</div><div class="teammate-meta">${p.role} · OVR ${p.ovr}</div></div><button class="btn btn-outline" style="padding:5px 9px;font-size:.75rem" onclick="teamSystem.interact('${p.id}')">互动</button></div><div class="relation-row"><span style="font-size:.75rem;min-width:58px">${relationLabel(p.relation)}</span><div class="relation-track"><div class="relation-fill" style="width:${p.relation}%"></div></div><span style="font-size:.75rem;font-weight:700">${p.relation}</span></div></div>`).join(''); }
  function openHub(){
    if(!teamState.initialized)initializeTeam(); const t=getTeam();
    ui.showModal('战队中心',`<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:12px"><div><div style="font-size:1.2rem;font-weight:800">${t.name}</div><div style="font-size:.8rem;color:#64748b">2026-08 阵容快照 · Valve #${t.valveRank} · Tier ${t.tier}</div></div><span class="result-tag res-top4">${ROLE_LABELS[getRole()]}</span></div><div class="team-summary-grid"><div class="team-summary-card"><div class="team-summary-value">${getUserOvr()}</div><div class="team-summary-label">你的 OVR</div></div><div class="team-summary-card"><div class="team-summary-value">${Math.round(teammateAverageOvr())}</div><div class="team-summary-label">队友平均 OVR</div></div><div class="team-summary-card"><div class="team-summary-value">${averageRelation()}</div><div class="team-summary-label">化学反应</div></div><div class="team-summary-card"><div class="team-summary-value">${teamState.contractMonths}</div><div class="team-summary-label">合同剩余（月）</div></div></div>${teammateCardsHtml()}<div class="team-note">阵容基于 2026 年 8 月初现役 CS2 快照。OVR 与薪资是游戏平衡数值，不是官方评分或现实合同。</div>`,[{text:'关闭',class:'btn-outline',cb:()=>ui.closeModal()}]);
  }
  function interact(id){
    const p=teamState.roster.find(x=>x.id===id); if(!p)return;
    if(state.flags.teamInteractionMonth===currentDateKey()){ ui.showModal('本月已经互动过','这个月已经进行过一次额外队友互动。',[{text:'知道了',class:'btn-primary',cb:()=>ui.closeModal()}]); return; }
    ui.showModal(`和 ${p.name} 互动`,`<p>当前关系：<strong>${p.relation}</strong>（${relationLabel(p.relation)}）</p>`,[
      {text:'一起双排',class:'btn-primary',cb:()=>{state.flags.teamInteractionMonth=currentDateKey();logic.modStat('san',-1,'陪队友双排');addRelation(id,8,'一起双排');ui.closeModal();ui.render();}},
      {text:'一起复盘',cb:()=>{state.flags.teamInteractionMonth=currentDateKey();logic.modStat('san',-1,'额外复盘');if(Math.random()<.35)logic.modStat('tactics',1,`和 ${p.name} 复盘`);addRelation(id,6,'一起复盘');ui.closeModal();ui.render();}},
      {text:'请他吃饭',class:'btn-warning',cb:()=>{if(!logic.checkMoney(1))return;state.flags.teamInteractionMonth=currentDateKey();logic.modStat('money',-1,'请队友吃饭');logic.modStat('san',1,'轻松聚餐');addRelation(id,10,'赛后聚餐');ui.closeModal();ui.render();}}
    ]);
  }

  function generateOffers(force=false){
    const current=getTeam(); const value=marketValue();
    let pool=TEAM_CATALOG.filter(t=>t.id!==current.id);
    if(!force){ const targetPrestige=clamp(Math.round(value*.9),45,94); pool=pool.filter(t=>t.prestige<=targetPrestige+9&&t.prestige>=Math.max(43,current.prestige-8)); }
    pool=shuffle(pool).sort((a,b)=>Math.abs(b.prestige-current.prestige)-Math.abs(a.prestige-current.prestige)).slice(0,3);
    teamState.activeOffers=pool.map(t=>({teamId:t.id,signBonus:clamp(1+Math.round((t.prestige-current.prestige)/12),1,6),contractMonths:t.prestige>=84?24:18}));
    return teamState.activeOffers;
  }
  function showTransferWindow(force=false){
    if(!teamState.activeOffers.length)generateOffers(force); const offers=teamState.activeOffers;
    if(!offers.length){ui.showModal('转会市场','目前没有合适的正式报价。',[{text:'留队',class:'btn-primary',cb:()=>ui.closeModal()}]);return;}
    const html=offers.map(o=>{const t=getTeam(o.teamId);return `<div class="transfer-offer"><div style="display:flex;justify-content:space-between;gap:8px"><div><div style="font-weight:800">${t.name}</div><div style="font-size:.78rem;color:#64748b">Valve快照 #${t.valveRank} · Tier ${t.tier} · 阵容均值约 ${Math.round(t.roster.reduce((s,r)=>s+t.base+r[2],0)/5)}</div><div style="font-size:.78rem;color:#64748b">签字费 ${o.signBonus} · ${o.contractMonths}个月</div></div><button class="btn btn-success" onclick="teamSystem.acceptOffer('${t.id}')">接受</button></div></div>`}).join('');
    ui.showModal('转会窗口',`<p style="margin-bottom:12px;color:#475569">强队意味着更高赛事资源，但也意味着更激烈的首发竞争。</p>${html}`,[{text:'留在当前战队',class:'btn-outline',cb:()=>{addAllRelations(1,'拒绝转会继续留队');teamState.activeOffers=[];ui.closeModal();}}]);
  }
  function acceptOffer(teamId){
    const offer=teamState.activeOffers.find(o=>o.teamId===teamId); const next=getTeam(teamId), old=getTeam(); if(!offer||!next||!old)return;
    teamState.formerTeams.push({id:old.id,name:old.name,leftYear:state.date.year,leftMonth:state.date.month,roster:teamState.roster.map(p=>({id:p.id,name:p.name,relation:p.relation}))});
    teamState.transferHistory.push({from:old.name,to:next.name,year:state.date.year,month:state.date.month});
    teamState.currentTeamId=next.id; teamState.roster=makeRoster(next); teamState.contractMonths=offer.contractMonths; teamState.joinedYear=state.date.year; teamState.joinedMonth=state.date.month; teamState.activeOffers=[]; teamState.captain=false; teamState.selectionMomentum=Math.min(teamState.selectionMomentum||4,4);
    logic.modStat('money',offer.signBonus,`${next.name} 签字费`); logic.log(`完成转会：${old.name} → ${next.name}`,'pos'); updateRole(); ui.closeModal(); ui.render(); setTimeout(()=>teamSystem.openHub(),220);
  }
  function renewContract(){const t=getTeam();teamState.contractMonths=t.prestige>=80?24:18;logic.modStat('money',2,`${t.name} 续约签字费`);logic.modStat('coach',1,'完成续约');addAllRelations(2,'继续并肩作战');ui.closeModal();}
  function enterFreeAgency(){teamState.activeOffers=[];ui.closeModal();setTimeout(()=>showTransferWindow(true),220);}
  function showRenewal(){const t=getTeam();ui.showModal('合同到期',`${t.name} 希望和你续约。`,[{text:'续约',class:'btn-primary',cb:renewContract},{text:'进入自由市场',class:'btn-warning',cb:enterFreeAgency}]);}
  function monthlyTeamTick(){
    if(!teamState.initialized||!state.started)return; const t=getTeam(); teamState.contractMonths=Math.max(0,teamState.contractMonths-1); if(t.salary>0)logic.modStat('money',t.salary,`${t.name} 合同工资`);
    if(teamState.roster.length){const p=sample(teamState.roster);p.relation=clamp(p.relation+(Math.random()<.58?1:-1),0,100);} updateRole();
    if(teamState.contractMonths===0)showRenewal();
    if((state.date.month===1||state.date.month===8)&&teamState.contractMonths>0){const offers=generateOffers(false);if(offers.length&&Math.random()<(state.phase==='pro'?.82:.38))showTransferWindow(false);}
  }

  function installTeamEvents(){
    if(typeof RANDOM_EVENTS==='undefined')return;
    RANDOM_EVENTS.push(
      {id:'team-current-roster-duo',title:'队友来敲门',condition:()=>teamState.initialized&&teamState.roster.length,text:()=>{const p=sample(teamState.roster);state.flags.teamEventTarget=p.id;return `${p.name} 问你晚上要不要一起打几把天梯。`;},type:'choice',choices:[{text:'陪他打（关系+7，首发竞争↑）',cb:l=>{l.modStat('san',-1,'陪队友双排');addRelation(state.flags.teamEventTarget,7,'一起打天梯');teamState.selectionMomentum=clamp((teamState.selectionMomentum||4)+.5,0,8);}},{text:'早点休息（心态+1）',cb:l=>l.modStat('san',1,'规律休息')}]},
      {id:'team-current-roster-bench',title:'首发竞争',condition:()=>teamState.initialized&&(getRole()==='reserve'||getRole()==='rotation'),weight:1.3,text:'教练告诉你，最近的训练表现会直接决定下一项赛事的首发名单。',type:'choice',choices:[{text:'额外加练（SAN-2，首发竞争+1.2）',cb:l=>{l.modStat('san',-2,'争夺首发');teamState.selectionMomentum=clamp((teamState.selectionMomentum||4)+1.2,0,8);}},{text:'保持正常节奏（SAN+1）',cb:l=>l.modStat('san',1,'稳定心态')}]},
      {id:'team-current-roster-captain',title:'更多队内责任',condition:()=>teamState.initialized&&!teamState.captain&&getRole()==='core'&&state.stats.tactics>=12&&state.stats.coach>=12,weight:.8,text:'教练希望你承担更多临场沟通和队内责任。',type:'choice',choices:[{text:'接下职责（战术+1，全队关系+4）',cb:l=>{teamState.captain=true;l.modStat('tactics',1,'承担队内责任');addAllRelations(4,'成为队内领袖');}},{text:'专注个人发挥（SAN+1）',cb:l=>l.modStat('san',1,'减少额外责任')}]}
    );
  }

  const originalFinalize=logic.finalizeMatch.bind(logic);
  logic.finalizeMatch=(slot,mods={self:0,team:0,opp:0})=>{
    if(!teamState.initialized||!slot?.savedScores)return originalFinalize(slot,mods);
    const saved={...slot.savedScores}; const t=getTeam(); const boost=clamp(Math.round((t.prestige-65)/22+(averageRelation()-50)/28),-2,3); slot.savedScores={tac:Math.max(0,saved.tac+boost),trn:Math.max(0,saved.trn+boost),real:Math.max(0,saved.real+boost)};
    try{return originalFinalize(slot,mods);}finally{slot.savedScores=saved;}
  };
  const originalInit=logic.init.bind(logic);
  logic.init=(roleId)=>{originalInit(roleId);initializeTeam();addTeamButton();ui.render();};
  const originalNext=logic.nextMonth.bind(logic);
  logic.nextMonth=()=>{originalNext();monthlyTeamTick();ui.render();};
  const originalRender=ui.render.bind(ui);
  ui.render=()=>{originalRender();addTeamButton();};

  const teamSystem={openHub,interact,showTransferWindow,acceptOffer,renewContract,enterFreeAgency,getUserOvr,marketValue,getRole,averageRelation,addRelation,getTeam,getTeams,teammateAverageOvr};
  window.teamSystem=teamSystem;
  injectStyles(); addTeamButton(); installTeamEvents();
  console.info(`[team-system] Loaded ${TEAM_CATALOG.length} current 2026 teams with team-bound active rosters.`);
})();
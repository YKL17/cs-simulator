(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem) {
    console.warn('[tournament-world] Core/team systems are not ready.');
    return;
  }

  // One source of truth: use the current-roster catalog from team-system.js.
  const WORLD_TEAMS = teamSystem.getTeams().map((t) => ({
    id: t.id,
    name: t.name,
    prestige: t.prestige,
    valveRank: t.valveRank,
  }));

  const CALENDAR = {
    1:{id:'open-winter',name:'Winter Open Series',level:'C',type:'open',inviteLimit:99,optional:true,worldReward:34,desc:'公开预选赛。所有战队都能报名，是低排名战队追积分的主要入口。'},
    2:{id:'regional-masters',name:'Regional Masters',level:'B',type:'ranked',inviteLimit:16,worldReward:54,desc:'世界排名前 16 获得正赛资格。'},
    3:{id:'international-open',name:'International Open',level:'A',type:'ranked',inviteLimit:12,worldReward:84,desc:'世界排名前 12 受邀参加国际赛事。'},
    4:{id:'spring-elite',name:'Spring Elite',level:'S',type:'ranked',inviteLimit:8,worldReward:126,desc:'世界排名前 8 的顶级赛事，也是春季 Major 前的重要积分赛。'},
    5:{id:'spring-major-cutoff',name:'Spring Major 排名截止 / 集训',level:'Major',type:'major_prep',inviteLimit:12,desc:'月底锁定 Major 种子。前 12 获得资格。'},
    6:{id:'spring-major',name:'Spring Major',level:'Major',type:'major',desc:'Stage 1 → Stage 2 → Stage 3 → Playoffs。'},
    7:{id:'summer-break',name:'夏季休赛期',level:'-',type:'break',desc:'转会窗口与夏季特训。'},
    8:{id:'summer-cup',name:'Summer Cup',level:'B',type:'ranked',inviteLimit:16,worldReward:54,desc:'下半赛季第一站，世界排名前 16 获得资格。'},
    9:{id:'global-clash',name:'Global Clash',level:'A',type:'ranked',inviteLimit:12,worldReward:84,desc:'世界排名前 12 的国际赛事。'},
    10:{id:'fall-elite',name:'Fall Elite',level:'S',type:'ranked',inviteLimit:8,worldReward:126,desc:'冬季 Major 前最后一项顶级积分赛事。'},
    11:{id:'winter-major-cutoff',name:'Winter Major 排名截止 / 集训',level:'Major',type:'major_prep',inviteLimit:12,desc:'月底锁定第二次 Major 种子。'},
    12:{id:'winter-major',name:'Winter Major',level:'Major',type:'major',desc:'年度第二次 Major，结束后进行年度 Top 20 评选。'},
  };

  const world={initialized:false,points:{},currentEvent:null,resolvedEventKeys:{},majorSeeds:{},majorPrepScores:{},news:[],lastRanking:[]};
  state.tournamentWorld=world;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const sample=(a)=>a[Math.floor(Math.random()*a.length)];
  const monthKey=(y=state.date.year,m=state.date.month)=>`${y}-${m}`;
  const currentTeamId=()=>state.teamSystem?.currentTeamId||null;
  const teamById=(id)=>WORLD_TEAMS.find(t=>t.id===id)||null;
  const currentTeam=()=>teamById(currentTeamId())||WORLD_TEAMS[WORLD_TEAMS.length-1];

  function addNews(text){world.news.unshift({key:monthKey(),text});world.news=world.news.slice(0,30);}
  function rankings(){
    const rows=WORLD_TEAMS.map(t=>({...t,points:Math.max(0,Math.round(world.points[t.id]||0))}))
      .sort((a,b)=>b.points-a.points||a.valveRank-b.valveRank)
      .map((t,i)=>({...t,rank:i+1}));
    world.lastRanking=rows;return rows;
  }
  function rankOf(id=currentTeamId()){return rankings().find(r=>r.id===id)?.rank||WORLD_TEAMS.length;}
  function initializePoints(){
    // Keep the initial order aligned with the Aug 3 Valve snapshot, but compress
    // gaps because this simulation includes a curated 36-team world.
    WORLD_TEAMS.forEach(t=>{world.points[t.id]=Math.max(520,2200-(t.valveRank-1)*22);});
  }
  function worldStrength(id){
    const t=teamById(id);if(!t)return 65;
    const pts=world.points[id]||700;
    let s=t.prestige*.68+pts/35;
    if(id===currentTeamId()){s+=(teamSystem.getUserOvr()-78)*.22+(teamSystem.averageRelation()-50)*.05;}
    return s;
  }
  function addWorldPoints(id,amount,reason=''){
    if(!id||!Object.prototype.hasOwnProperty.call(world.points,id))return;
    world.points[id]=Math.max(350,(world.points[id]||0)+Math.round(amount));
    if(id===currentTeamId()&&reason)logic.log(`世界排名积分 ${amount>=0?'+':''}${Math.round(amount)} (${reason})`,amount>=0?'pos':'neg');
  }
  function decayWorldPoints(){WORLD_TEAMS.forEach(t=>world.points[t.id]=Math.max(350,Math.round((world.points[t.id]||0)*.994)));}
  function getCalendarEvent(m=state.date.month){return CALENDAR[m]||null;}
  function nextPlayableEvent(after=state.date.month){for(let i=1;i<=12;i++){const m=((after-1+i)%12)+1,e=CALENDAR[m];if(e&&!['break','major'].includes(e.type))return{...e,month:m};}return null;}
  function invitationFor(e,id=currentTeamId()){if(!e)return false;if(e.type==='open')return true;if(e.type==='ranked'||e.type==='major_prep')return rankOf(id)<=e.inviteLimit;return false;}
  function rosterSelection(){
    const role=teamSystem.getRole();
    if(role==='reserve')return{selected:false,role,reason:'你目前是替补，本项赛事没有进入首发名单。'};
    if(role==='rotation'){const p=clamp(.48+(state.teamSystem.selectionMomentum||0)*.055,.48,.88),selected=Math.random()<p;return{selected,role,reason:selected?'轮换竞争中，你拿到了本次首发。':'轮换竞争中，教练本次选择了另一套首发。'};}
    return{selected:true,role,reason:role==='core'?'你是队内核心，默认进入首发。':'你是固定首发，进入参赛名单。'};
  }
  function primarySlot(){if(!state.slots.length)state.slots.push({id:1,status:'empty'});return state.slots[0];}
  function clearLegacySlots(){state.slots.forEach((s,i)=>{if(i){s.status='empty';delete s.worldEventId;}});}
  function setupPrepSlot(e,majorPrep=false){const s=primarySlot();s.status='planning';s.name=e.name;s.level=majorPrep?'S':e.level;s.scores={tac:0,trn:0,real:0};s.worldEventId=e.id;s.worldMajorPrep=majorPrep;clearLegacySlots();return s;}

  function initializeCurrentMonth(){
    if(!state.started)return;const base=getCalendarEvent();if(!base)return;const key=monthKey();
    if(base.type==='ranked'||base.type==='open'){
      const invited=invitationFor(base);const sel=invited?rosterSelection():{selected:false,role:teamSystem.getRole(),reason:'战队未获得本项赛事资格。'};
      world.currentEvent={...base,key,invited,selected:sel.selected,selectionReason:sel.reason,status:world.resolvedEventKeys[key]?'completed':'planning'};
      if(world.currentEvent.status==='planning'&&invited&&sel.selected)setupPrepSlot(world.currentEvent,false);else primarySlot().status='empty';
    }else if(base.type==='major_prep'){
      world.currentEvent={...base,key,invited:invitationFor(base),selected:true,status:'planning'};setupPrepSlot(world.currentEvent,true);
    }else{world.currentEvent={...base,key,status:'calendar'};primarySlot().status='empty';}
  }
  function initializeWorld(){
    if(world.initialized)return;initializePoints();world.initialized=true;const rows=rankings(),me=rows.find(r=>r.id===currentTeamId());logic.log(`世界排名系统启动：${currentTeam().name} 初始模拟排名 #${me?.rank||'-'}（现实快照 Valve #${currentTeam().valveRank}）。`,'pos');addNews(`2026-08 阵容世界载入，${rows[0].name} 暂列模拟世界第一。`);initializeCurrentMonth();
  }

  function placementReward(e,result){const max=e.worldReward||30;if(result.includes('冠军'))return max;if(result.includes('亚军')||result.includes('决赛'))return Math.round(max*.68);if(result.includes('四强'))return Math.round(max*.46);if(result.includes('八强'))return Math.round(max*.30);if(result.includes('16强')||result.includes('晋级'))return Math.round(max*.18);return Math.max(2,Math.round(max*.08));}
  function simulatedPlacement(i,total){if(i===0)return'冠军';if(i===1)return'亚军';if(i<4)return'四强';if(i<8)return'八强';if(i<16)return'16强';return total>16?'小组出局':'首轮出局';}
  function eligibleIds(e){if(e.type==='open')return WORLD_TEAMS.map(t=>t.id);return rankings().slice(0,e.inviteLimit||WORLD_TEAMS.length).map(r=>r.id);}
  function simulateAiTournament(e,includeCurrent=false){
    let ids=eligibleIds(e);if(!includeCurrent)ids=ids.filter(id=>id!==currentTeamId());if(!ids.length)return null;
    const table=ids.map(id=>({id,perf:worldStrength(id)+(Math.random()*24-12)})).sort((a,b)=>b.perf-a.perf);
    table.forEach((r,i)=>addWorldPoints(r.id,placementReward(e,simulatedPlacement(i,table.length))));return{winnerId:table[0].id,table};
  }
  function simulateTeamWithoutPlayer(e,reason='未进入首发'){
    if(!e||!invitationFor(e))return null;
    const strength=worldStrength(currentTeamId())+(Math.random()*24-12)-2;
    const field=eligibleIds(e).filter(id=>id!==currentTeamId()).map(id=>worldStrength(id)+(Math.random()*24-12)).sort((a,b)=>b-a);
    const i=field.filter(x=>x>strength).length,result=simulatedPlacement(i,field.length+1);addWorldPoints(currentTeamId(),placementReward(e,result),`${reason}，战队${result}`);addNews(`${currentTeam().name} 在 ${e.name} 取得${result}（你${reason}）。`);world.resolvedEventKeys[e.key]=true;if(world.currentEvent?.key===e.key)world.currentEvent.status='team-simulated';return{result};
  }
  function openQualifier(e){
    const s=primarySlot(),rank=rankOf(),prep=(s.scores.tac+s.scores.trn+s.scores.real)/3;const chance=clamp(.42+(WORLD_TEAMS.length-rank)*.008+(teamSystem.getUserOvr()-75)*.008+prep*.012,.28,.86);
    if(Math.random()>chance){const kills=Math.max(8,Math.round(teamSystem.getUserOvr()/5+Math.random()*12));state.flags.careerKills+=kills;state.history.push({name:`${e.name} Open Qualifier`,level:'C',points:0,k:kills,money:0,result:'预选出局',year:state.date.year});addWorldPoints(currentTeamId(),3,'参加公开预选');world.resolvedEventKeys[e.key]=true;e.status='completed';s.status='empty';ui.showModal('Open Qualifier',`<p>你们参加了 ${e.name} 公开预选，但没能拿到正赛席位。</p><h3 style="text-align:center;color:#ef4444;margin:18px 0">预选出局</h3><p style="font-size:.85rem;color:#64748b">晋级概率 ${(chance*100).toFixed(0)}%</p>`,[{text:'继续赛季',class:'btn-primary',cb:()=>{ui.closeModal();ui.render();}}]);return false;}
    logic.log(`${e.name} Open Qualifier 晋级，进入正赛！`,'pos');return true;
  }
  function playCurrentEvent(){
    const e=world.currentEvent;if(!e||!['open','ranked'].includes(e.type)||e.status!=='planning'||!e.invited)return;
    if(!e.selected){simulateTeamWithoutPlayer(e,'未进入首发');ui.render();return;}
    if(e.type==='open'&&!openQualifier(e))return;const s=primarySlot();s.level=e.level;s.name=e.name;s.savedScores={...s.scores};s.status='resolving';s.worldEventId=e.id;s.worldEventKey=e.key;setTimeout(()=>logic.triggerMatchEvent(s.id),80);ui.render();
  }
  function requestRestAndAdvance(){const e=world.currentEvent;if(!e)return;e.status='rested';world.resolvedEventKeys[e.key]=true;primarySlot().status='empty';logic.modStat('san',2,'主动轮休');logic.modStat('coach',-1,'缺席正式赛事');simulateTeamWithoutPlayer(e,'申请轮休');ui.closeModal();setTimeout(()=>logic.nextMonth(),100);}
  function gameNextMonth(){
    const e=world.currentEvent;if(e&&e.type==='ranked'&&e.invited&&e.selected&&e.status==='planning'){ui.showModal('本月正式赛事尚未完成',`${currentTeam().name} 已获得 <strong>${e.name}</strong> 资格。`,[{text:'进入赛事',class:'btn-primary',cb:()=>{ui.closeModal();playCurrentEvent();}},{text:'申请轮休',class:'btn-outline',cb:requestRestAndAdvance}]);return;}logic.nextMonth();
  }

  function lockMajorSeed(year,half){const key=`${year}-${half}`,rows=rankings(),rank=rankOf(),qualified=rows.slice(0,12).map(r=>r.id);world.majorSeeds[key]={rank,qualified,snapshot:rows.map(r=>({id:r.id,rank:r.rank,points:r.points}))};const s=primarySlot();if(s.worldMajorPrep&&s.scores)world.majorPrepScores[key]={...s.scores};addNews(`${half==='spring'?'Spring':'Winter'} Major 排名锁定：${rows[0].name} 头号种子，${currentTeam().name} #${rank}。`);}
  function winProbability(a,b,prep=0,active=true){let diff=worldStrength(a)-worldStrength(b);if(a===currentTeamId())diff+=prep*.55+(active?(teamSystem.getUserOvr()-80)*.16:-3);if(b===currentTeamId())diff-=prep*.55+(active?(teamSystem.getUserOvr()-80)*.16:-3);return clamp(.5+diff/75,.18,.82);}
  function majorOpponent(pool,used){const a=pool.filter(id=>id!==currentTeamId()&&!used.includes(id));return sample(a.length?a:pool.filter(id=>id!==currentTeamId()));}
  function swiss(name,pool,prep,active,lines){let w=0,l=0,used=[];while(w<3&&l<3){const opp=majorOpponent(pool,used);used.push(opp);const win=Math.random()<winProbability(currentTeamId(),opp,prep,active);if(win)w++;else l++;lines.push(`<div style="display:flex;justify-content:space-between;gap:8px"><span>${name} · vs ${teamById(opp)?.name}</span><strong style="color:${win?'#059669':'#dc2626'}">${win?'胜':'负'} (${w}-${l})</strong></div>`);}return w===3;}
  function simulateMajor(half){
    const year=state.date.year,key=`${year}-${half}`;if(!world.majorSeeds[key])lockMajorSeed(year,half);const seed=world.majorSeeds[key],rank=seed.rank,label=half==='spring'?'Spring Major':'Winter Major',name=`${label} ${year}`;
    if(!seed.qualified.includes(currentTeamId())){state.history.push({name,level:'Major',points:0,k:0,money:0,result:'未获资格',year});addNews(`${currentTeam().name} #${rank}，未获得 ${label} 资格。`);ui.showModal(name,`<h2 style="text-align:center;color:#dc2626">未获资格</h2><p>${currentTeam().name} 排名截止时位列 <strong>#${rank}</strong>。</p>`,[{text:'继续赛季',class:'btn-primary',cb:()=>ui.closeModal()}]);primarySlot().status='empty';return;}
    const role=teamSystem.getRole(),active=role==='core'||role==='starter'||(role==='rotation'&&Math.random()<.72),prepObj=world.majorPrepScores[key]||{tac:0,trn:0,real:0},prep=Math.round((prepObj.tac+prepObj.trn+prepObj.real)/3),pool=seed.qualified.slice(),lines=[];let result='',stage=rank<=4?3:rank<=8?2:1;
    if(stage<=1&&!swiss('Stage 1',pool,prep,active,lines))result='Stage 1 出局';if(!result&&stage<=2&&!swiss('Stage 2',pool,prep,active,lines))result='Stage 2 出局';if(!result&&!swiss('Stage 3',pool,prep,active,lines))result='Stage 3 出局';
    if(!result){const rounds=[['Quarterfinal','八强'],['Semifinal','四强'],['Final','亚军']],used=[];for(const [r,lose] of rounds){const opp=majorOpponent(pool,used);used.push(opp);const win=Math.random()<winProbability(currentTeamId(),opp,prep,active);lines.push(`<div style="display:flex;justify-content:space-between"><span>${r} · vs ${teamById(opp)?.name}</span><strong style="color:${win?'#059669':'#dc2626'}">${win?'胜':'负'}</strong></div>`);if(!win){result=lose;break;}}if(!result)result='冠军';}
    const rw={'Stage 1 出局':[0,1,35,8],'Stage 2 出局':[1,2,60,18],'Stage 3 出局':[2,4,90,34],'八强':[4,10,150,65],'四强':[6,20,220,95],'亚军':[8,40,300,135],'冠军':[10,100,480,210]}[result];const [pts,money,k0,wp]=rw,kills=active?Math.round(k0*(.75+Math.random()*.5)):0,pm=active?money:Math.floor(money*.35),pp=active?pts:0,historyResult=active?result:`替补 · ${result}`;
    if(pp)state.flags.totalScore+=pp;if(pm){logic.modStat('money',pm,'Major 奖金');state.flags.totalMoney+=pm;}state.flags.careerKills+=kills;if(result==='冠军'){state.flags.majorWins++;state.flags.majorBest=8;}if(active&&['八强','四强','亚军','冠军'].includes(result))logic.modStat('coach',Math.min(4,1+Math.floor(pts/3)),'Major 表现');addWorldPoints(currentTeamId(),wp,`Major ${result}`);state.history.push({name,level:'Major',points:pp,k:kills,money:pm,result:historyResult,year});addNews(`${currentTeam().name} 在 ${label} 取得${result}${active?'':'，你以替补身份随队'}。`);
    ui.showModal(name,`<div style="background:#f8fafc;padding:10px;border-radius:8px;margin-bottom:10px"><strong>种子：</strong>#${rank} · <strong>身份：</strong>${active?'参赛阵容':'替补名单'} · <strong>备战：</strong>${prep}</div><div style="display:grid;gap:5px;font-size:.83rem;max-height:230px;overflow:auto">${lines.join('')}</div><h2 style="text-align:center;color:var(--primary);margin:18px 0">${historyResult}</h2><p>个人奖励：积分+${pp}，奖金+${pm}，击杀+${kills}</p>`,[{text:'结束 Major',class:'btn-primary',cb:()=>ui.closeModal()}]);primarySlot().status='empty';
  }
  function triggerMajorOverride(){simulateMajor(state.date.month===6?'spring':'winter');}

  function captureActualResult(slot,before){
    const e=world.currentEvent;if(!e||!slot?.worldEventKey||state.history.length<=before)return;const h=state.history[state.history.length-1];e.status='completed';e.result=h.result;world.resolvedEventKeys[e.key]=true;addWorldPoints(currentTeamId(),placementReward(e,h.result),`${e.name} ${h.result}`);addNews(`${currentTeam().name} 在 ${e.name} 取得${h.result}。`);
  }
  function settleOutgoingMonth(){
    const e=world.currentEvent;if(!e)return;
    if(e.type==='ranked'||e.type==='open'){
      const ai=simulateAiTournament(e,false);
      if(!world.resolvedEventKeys[e.key]&&e.invited&&!e.selected)simulateTeamWithoutPlayer(e,'未进入首发');
      if(ai?.winnerId&&!e.result?.includes('冠军'))addNews(`${teamById(ai.winnerId)?.name} 赢得 ${e.name}。`);
    }
    if(e.type==='major_prep')lockMajorSeed(state.date.year,state.date.month===5?'spring':'winter');
  }
  function monthlyWorldTick(){decayWorldPoints();rankings();initializeCurrentMonth();const me=rankings().find(r=>r.id===currentTeamId());if(me)logic.log(`当前模拟世界排名：#${me.rank}（${me.points} 分）`);}

  function openWorldHub(){
    if(!world.initialized)initializeWorld();const rows=rankings(),me=rows.find(r=>r.id===currentTeamId());const ranks=rows.map(r=>`<div style="display:grid;grid-template-columns:34px 1fr 64px 56px;gap:7px;padding:6px 8px;border-bottom:1px solid #f1f5f9;${r.id===currentTeamId()?'background:#eff6ff;font-weight:700;':''}"><span>#${r.rank}</span><span>${r.name}</span><span style="text-align:right">${r.points}</span><span style="text-align:right;color:#94a3b8">V#${r.valveRank}</span></div>`).join('');const cal=Object.entries(CALENDAR).map(([m,e])=>`<div style="display:grid;grid-template-columns:35px 1fr;gap:8px;padding:6px 8px;${+m===state.date.month?'background:#eff6ff;font-weight:700;':''}"><span>${m}月</span><span>${e.level==='-'?'':`[${e.level}] `}${e.name}</span></div>`).join('');const news=world.news.slice(0,8).map(n=>`<div style="padding:5px 0;border-bottom:1px solid #f1f5f9"><span style="color:#94a3b8;margin-right:6px">Y${n.key.replace('-', '/M')}</span>${n.text}</div>`).join('')||'<div style="color:#94a3b8">暂无</div>';
    ui.showModal('CS 世界赛事中心',`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px"><div class="team-summary-card"><div class="team-summary-value">#${me?.rank||'-'}</div><div class="team-summary-label">模拟世界排名</div></div><div class="team-summary-card"><div class="team-summary-value">V#${currentTeam().valveRank}</div><div class="team-summary-label">2026-08 Valve快照</div></div><div class="team-summary-card"><div class="team-summary-value">${currentTeam().name}</div><div class="team-summary-label">当前战队</div></div></div><div style="font-weight:800;margin:8px 0">36队世界排名</div><div style="max-height:225px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px">${ranks}</div><div style="font-weight:800;margin:14px 0 8px">年度赛历</div><div style="max-height:180px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px">${cal}</div><div style="font-weight:800;margin:14px 0 8px">世界新闻</div><div style="font-size:.8rem">${news}</div><div style="font-size:.72rem;color:#94a3b8;margin-top:12px">V# 为 2026-08-03 Valve 排名快照；游戏内模拟排名会随你的生涯继续变化。</div>`,[{text:'关闭',class:'btn-outline',cb:()=>ui.closeModal()}]);
  }
  function addWorldButton(){if(document.getElementById('btn-world-hub'))return;const anchor=document.getElementById('btn-team-hub')||document.querySelector('.area-stats button[onclick="ui.showHonorRoom()"]');if(!anchor?.parentElement)return;const b=document.createElement('button');b.id='btn-world-hub';b.className='btn btn-warning';b.style.flex='1';b.innerHTML='<i class="fa-solid fa-earth-americas"></i> 世界';b.onclick=openWorldHub;anchor.parentElement.appendChild(b);}
  function prepHtml(s){const x=s?.scores||{tac:0,trn:0,real:0};return `<div class="slot-scores" style="margin:8px 0"><span class="score-badge">战术 ${x.tac}</span><span class="score-badge">训练 ${x.trn}</span><span class="score-badge">实战 ${x.real}</span></div>`;}
  function renderWorldWorkstation(){
    const c=document.getElementById('slots-container');if(!c)return;if(!world.initialized){c.innerHTML='<div style="padding:18px;color:#64748b">开始生涯后生成世界赛历。</div>';return;}const e=world.currentEvent||getCalendarEvent(),rank=rankOf(),s=primarySlot(),next=nextPlayableEvent();if(!e)return;
    if(e.type==='break'){c.innerHTML=`<div class="slot-card"><div class="slot-header"><span>7月 · 夏季休赛期</span><span style="color:#059669">转会窗口</span></div><p style="font-size:.85rem;color:#64748b">本月没有固定赛事，可以恢复、特训和处理转会。</p><div style="font-size:.8rem">当前模拟世界排名：<strong>#${rank}</strong></div><div style="font-size:.78rem;color:#94a3b8;margin-top:8px">下一站：${next?.month}月 ${next?.name}</div></div>`;return;}
    if(e.type==='major'){c.innerHTML=`<div class="slot-card active" style="border-color:#f59e0b"><div class="slot-header"><span>${e.name}</span><span style="color:#d97706">Major 月</span></div><p style="font-size:.85rem;color:#64748b">依据上月锁定的排名种子自动进行多阶段 Major。</p><div>当前模拟世界排名：<strong>#${rank}</strong></div></div>`;return;}
    if(e.type==='major_prep'){const p=rank<=4?'预计直接 Stage 3':rank<=8?'预计从 Stage 2 开始':rank<=12?'预计从 Stage 1 开始':'当前无法获得 Major 资格';c.innerHTML=`<div class="slot-card active" style="border-color:#f59e0b"><div class="slot-header"><span>${e.name}</span><span style="color:#d97706">排名截止月</span></div><p style="font-size:.82rem;color:#64748b">${e.desc}</p><div>当前 #${rank} · ${p}</div>${prepHtml(s)}<div style="font-size:.75rem;color:#94a3b8">本月训练会转化为 Major 备战。</div></div>`;return;}
    let status='',button='';if(!e.invited)status=`<div style="padding:9px;background:#fef2f2;border-radius:7px;color:#991b1b;font-size:.82rem">当前排名 #${rank}，未达到邀请线。</div>`;else if(!e.selected)status=`<div style="padding:9px;background:#fff7ed;border-radius:7px;color:#9a3412;font-size:.82rem">战队有资格，但${e.selectionReason}</div>`;else if(e.status==='completed')status=`<div style="padding:9px;background:#ecfdf5;border-radius:7px;color:#065f46;font-size:.82rem">本月赛事已完成：${e.result||'已结算'}</div>`;else if(e.status==='team-simulated'||e.status==='rested')status='<div style="padding:9px;background:#f8fafc;border-radius:7px;color:#64748b;font-size:.82rem">本项赛事由战队其他选手完成。</div>';else{status=`<div style="font-size:.8rem;color:#475569">${e.selectionReason||''}</div>${prepHtml(s)}`;button=`<button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="tournamentWorld.playCurrentEvent()"><i class="fa-solid fa-play"></i> ${e.type==='open'?'报名 Open Qualifier':'进入正式赛事'}</button>`;}
    c.innerHTML=`<div class="slot-card ${e.invited?'active':''}"><div class="slot-header"><span>${e.name}</span><span style="color:var(--primary)">${e.level}级</span></div><div style="font-size:.76rem;color:#94a3b8;margin-bottom:6px">${e.type==='open'?'公开报名':`邀请线：世界前 ${e.inviteLimit}`} · 当前 #${rank}</div><p style="font-size:.82rem;color:#64748b">${e.desc}</p>${status}${button}</div>`;
  }

  const previousFinalize=logic.finalizeMatch.bind(logic);
  logic.finalizeMatch=(slot,mods={self:0,team:0,opp:0})=>{const before=state.history.length,key=slot?.worldEventKey,r=previousFinalize(slot,mods);if(key)captureActualResult(slot,before);ui.render();return r;};
  logic.triggerMajor=triggerMajorOverride;
  const previousInit=logic.init.bind(logic);
  logic.init=(roleId)=>{previousInit(roleId);initializeWorld();addWorldButton();ui.render();};
  const previousNext=logic.nextMonth.bind(logic);
  logic.nextMonth=()=>{if(!world.initialized)initializeWorld();settleOutgoingMonth();previousNext();monthlyWorldTick();addWorldButton();ui.render();};
  game.nextMonth=gameNextMonth;
  game.openPlan=()=>ui.showModal('赛事报名方式已升级','赛事由年度赛历生成，C级 Open Qualifier 可主动报名，其余赛事需要达到排名邀请线。',[{text:'查看世界赛历',class:'btn-primary',cb:()=>{ui.closeModal();openWorldHub();}},{text:'知道了',cb:()=>ui.closeModal()}]);
  game.signUp=()=>playCurrentEvent();
  game.discardPlan=()=>{const e=world.currentEvent;if(e?.type==='open'){e.status='skipped';world.resolvedEventKeys[e.key]=true;primarySlot().status='empty';logic.log(`放弃 ${e.name} Open Qualifier`);ui.render();}};
  const previousWorkstation=ui.renderWorkstation.bind(ui);ui.renderWorkstation=()=>{if(!world.initialized&&!state.started)return previousWorkstation();renderWorldWorkstation();};
  const previousRender=ui.render.bind(ui);ui.render=()=>{previousRender();addWorldButton();};

  window.tournamentWorld={openWorldHub,playCurrentEvent,getRankings:rankings,getRank:rankOf,getCalendarEvent,addWorldPoints};
  addWorldButton();
  console.info(`[tournament-world] Loaded current-roster world with ${WORLD_TEAMS.length} teams.`);
})();
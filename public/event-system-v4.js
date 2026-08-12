(() => {
  if (typeof state === 'undefined' || !window.logic || !window.game || !window.ui || !window.teamSystem || !window.tournamentWorld) {
    console.warn('[event-system-v4] Required systems are not ready.');
    return;
  }

  const world = state.tournamentWorld;
  const teamState = state.teamSystem;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const monthKey = (year = state.date.year, month = state.date.month) => `${year}-${month}`;
  const LEVEL_WEIGHT = { C: 8, B: 14, A: 20, S: 28, Major: 40 };
  const BANDS = { S: { min: 1, max: 8 }, A: { min: 9, max: 16 }, B: { min: 17, max: 24 }, C: { min: 25, max: 32 } };
  const MONTH_PAIRS = { odd: ['S', 'B'], even: ['A', 'C'] };
  const MONTH_PREFIX = { 1:'Winter',2:'February',3:'Spring',4:'April',5:'Major Prelude',6:'Summer',7:'July',8:'August',9:'Fall',10:'October',11:'Major Prelude II',12:'Year-End' };
  const LEVEL_SUFFIX = { S:'Elite', A:'International', B:'Masters', C:'Challenger' };

  world.v4 = world.v4 || {};
  world.v4.version = 5;
  world.v4.regularResults = world.v4.regularResults || {};
  world.v4.majorResults = world.v4.majorResults || {};
  world.v4.majorSeeds = world.v4.majorSeeds || {};
  world.v4.selectionByKey = world.v4.selectionByKey || {};
  world.v4.monthlySettled = world.v4.monthlySettled || {};

  const rows = () => tournamentWorld.getRankings().slice(0, 32);
  const teams = () => teamSystem.getTeams().slice(0, 32);
  const teamById = (id) => teams().find((t) => t.id === id) || null;
  const myId = () => teamState.currentTeamId;
  const myRank = () => rows().find((r) => r.id === myId())?.rank || 32;
  const activeLevels = (month = state.date.month) => month % 2 === 1 ? MONTH_PAIRS.odd : MONTH_PAIRS.even;
  const levelForRank = (rank) => rank <= 8 ? 'S' : rank <= 16 ? 'A' : rank <= 24 ? 'B' : 'C';
  const eventName = (level, month = state.date.month) => `${MONTH_PREFIX[month] || 'Circuit'} ${LEVEL_SUFFIX[level]}`;

  function eventForLevel(level, month = state.date.month, rankingRows = rows()) {
    const band = BANDS[level];
    return {
      id:`v5-${state.date.year}-${month}-${level}`, key:`${state.date.year}-${month}-${level}`, name:eventName(level,month), level, type:'ranked',
      minRank:band.min, maxRank:band.max, participantIds:rankingRows.slice(band.min-1,band.max).map((r)=>r.id),
      desc:`世界排名 #${band.min}–#${band.max} 的 8 支战队参加。`, v4:true, v5:true,
    };
  }
  function monthEvents(month = state.date.month, rankingRows = rows()) { return activeLevels(month).map((level)=>eventForLevel(level,month,rankingRows)); }
  function currentTeamEvent() {
    const rankingRows=rows(), rank=rankingRows.find((r)=>r.id===myId())?.rank||32, level=levelForRank(rank);
    if(!activeLevels(state.date.month).includes(level)) return null;
    return eventForLevel(level,state.date.month,rankingRows);
  }
  function roleSelection(event){
    if(!event)return{selected:false,role:teamSystem.getRole(),reason:'本月你的赛事级别没有排期。'};
    if(world.v4.selectionByKey[event.key])return world.v4.selectionByKey[event.key];
    const role=teamSystem.getRole();let result;
    if(role==='reserve')result={selected:false,role,reason:'你目前是替补，本项赛事不在首发名单。'};
    else if(role==='rotation'){const p=clamp(.54+(teamState.selectionMomentum||0)*.04,.54,.84),selected=Math.random()<p;result={selected,role,reason:selected?'轮换竞争成功，本项赛事进入首发。':'本项赛事轮换中未进入首发。'};}
    else result={selected:true,role,reason:role==='core'?'队内核心，进入首发。':'固定首发，进入参赛名单。'};
    world.v4.selectionByKey[event.key]=result;return result;
  }
  function primarySlot(){if(!state.slots?.length)state.slots=[{id:1,status:'empty'}];return state.slots[0];}
  function setupSlot(event){
    const slot=primarySlot();
    if(!event){slot.status='empty';delete slot.worldEventId;delete slot.worldEventKey;return slot;}
    slot.status=event.selected&&event.status==='planning'?'planning':'empty';slot.name=event.name;slot.level=event.level;slot.worldEventId=event.id;slot.worldEventKey=event.key;
    if(slot.prepEventId!==event.id)slot.eventPrep=0;slot.prepEventId=event.id;const prep=clamp(Math.round(slot.eventPrep||0),0,20);slot.scores={tac:prep,trn:prep,real:prep};return slot;
  }
  function setupCurrentMonth(force=false){
    if(!state.started||!world.initialized)return;const base=currentTeamEvent();
    if(!base){world.currentEvent={id:`v5-off-${monthKey()}`,key:`v5-off-${monthKey()}`,name:'本月无对应级别普通赛事',level:'-',type:'break',status:'calendar',v4:true,v5:true};setupSlot(null);return;}
    const selection=roleSelection(base),resolved=!!world.v4.regularResults[base.key];
    if(!force&&world.currentEvent?.key===base.key&&world.currentEvent.status===(resolved?'completed':'planning'))return;
    world.currentEvent={...base,invited:true,selected:selection.selected,selectionReason:selection.reason,status:resolved?'completed':'planning',result:world.v4.regularResults[base.key]?.result};setupSlot(world.currentEvent);
  }

  function resultBucket(result){const text=String(result||'');if(text.includes('冠军'))return{min:1,max:1,type:'champion'};if(text.includes('亚军')||text.includes('决赛'))return{min:2,max:2,type:'runner'};if(text.includes('四强')||text.includes('半决赛'))return{min:3,max:4,type:'top4'};if(text.includes('八强'))return{min:5,max:8,type:'top8'};return{min:9,max:16,type:'group'};}
  function rankingDelta(level,seed,result,total=8){
    const b=resultBucket(result),w=LEVEL_WEIGHT[level]||10;
    if(b.type==='champion'){const floor=Math.max(4,Math.round(w*.55)),bonus=seed>1?Math.round(w*clamp((seed-1)/Math.max(3,total-1),.15,.8)):0;return floor+Math.max(0,bonus);}
    if(b.type==='runner'){const floor=Math.max(2,Math.round(w*.30)),bonus=seed>2?Math.round(w*clamp((seed-2)/Math.max(3,total-2),.12,.6)):0;return floor+Math.max(0,bonus);}
    if(b.type==='top4'){if(seed<=4)return 0;return Math.max(2,Math.round(w*clamp((seed-4)/Math.max(2,total-4),.15,.55)));}
    if(b.type==='top8'){if(seed>=5&&seed<=8)return 0;return-Math.max(2,Math.round(w*clamp((5-seed)/4,.18,.65)));}
    return-Math.max(3,Math.round(w*(seed<=4?1:.65)));
  }
  function setPoints(id,value){world.points[id]=Math.max(300,Math.round(value));}
  function teamPower(id,activeUser=false){const team=teamById(id);let power=team?.prestige||65;if(id===myId()){const ovr=teamSystem.getUserOvr();power+=clamp((ovr-70)*(activeUser?.16:.04),-2,4.5);const chemistry=typeof teamSystem.averageRelation==='function'?teamSystem.averageRelation():50;power+=clamp((chemistry-50)*.025,-1.5,1.5);}return power;}
  const gaussianish=()=>((Math.random()+Math.random()+Math.random())-1.5)*2;
  function matchWinChance(aId,bId,{prep=0,activeUser=false,major=false,choiceEdge=0}={}){
    let diff=teamPower(aId,activeUser&&aId===myId())-teamPower(bId,activeUser&&bId===myId());
    if(aId===myId())diff+=clamp(prep,0,20)*(major?.18:.22);if(bId===myId())diff-=clamp(prep,0,20)*(major?.18:.22);diff+=gaussianish()*(major?4.2:3.4);
    const p=.5+diff/(major?92:86)+choiceEdge;return clamp(p,major?.24:.20,major?.76:.80);
  }
  function playOne(aId,bId,options={}){const chance=matchWinChance(aId,bId,options);return{win:Math.random()<chance,chance};}
  function regularUserRun(event,mods={self:0,team:0,opp:0}){
    const slot=primarySlot(),prep=clamp(Math.round(slot.eventPrep||0),0,20),active=!!event.selected,choiceEdge=clamp(((mods.self||0)+(mods.team||0)-(mods.opp||0))*.004,-.04,.04),opponents=event.participantIds.filter((id)=>id!==myId()),used=[],lines=[];
    const rounds=[['Quarterfinal','八强'],['Semifinal','四强'],['Final','亚军']];let result='冠军';
    for(const [round,loseResult] of rounds){const available=opponents.filter((id)=>!used.includes(id)),opp=sample(available.length?available:opponents);used.push(opp);const played=playOne(myId(),opp,{prep,activeUser:active,major:false,choiceEdge});lines.push(`${round} vs ${teamById(opp)?.name||'Opponent'}：${played.win?'胜':'负'}（赛前胜率 ${(played.chance*100).toFixed(0)}%）`);if(!played.win){result=loseResult;break;}}
    return{result,lines,prep};
  }
  function simulateRegularAiEvent(event,skipUser=false){
    const seeds=Object.fromEntries(event.participantIds.map((id,i)=>[id,i+1]));let alive=event.participantIds.filter((id)=>!(skipUser&&id===myId()));const resultById={};
    while(alive.length>1){const next=[],shuffled=alive.slice().sort(()=>Math.random()-.5);for(let i=0;i<shuffled.length;i+=2){if(!shuffled[i+1]){next.push(shuffled[i]);continue;}const a=shuffled[i],b=shuffled[i+1],played=playOne(a,b,{major:false}),winner=played.win?a:b,loser=played.win?b:a,remaining=alive.length;resultById[loser]=remaining>=8?'八强':remaining>=4?'四强':'亚军';next.push(winner);}alive=next;}if(alive[0])resultById[alive[0]]='冠军';
    Object.entries(resultById).forEach(([id,result])=>{if(skipUser&&id===myId())return;const delta=rankingDelta(event.level,seeds[id]||8,result,event.participantIds.length);setPoints(id,(world.points[id]||0)+delta);});return resultById;
  }
  function simulateMyTeamWithoutPlayer(event,reason='未进入首发'){const seed=event.participantIds.findIndex((id)=>id===myId())+1,run=regularUserRun({...event,selected:false}),delta=rankingDelta(event.level,seed,run.result,event.participantIds.length);setPoints(myId(),(world.points[myId()]||0)+delta);world.v4.regularResults[event.key]={result:run.result,delta,seed,reason};world.resolvedEventKeys[event.key]=true;event.status='team-simulated';logic.log(`${event.name}：你${reason}，战队${run.result} · 排名积分 ${delta>=0?'+':''}${delta}`,delta>0?'pos':delta<0?'neg':'normal');}
  function cleanRankingLogsSince(index){if(!Array.isArray(state.logs))return;const before=state.logs.slice(0,index),after=state.logs.slice(index).filter((row)=>{const msg=String(row?.msg||'');return!msg.includes('世界排名积分')&&!msg.startsWith('排名积分 ')&&!msg.startsWith('赛事排名积分 ');});state.logs=before.concat(after);}

  const previousFinalize=logic.finalizeMatch.bind(logic);
  logic.finalizeMatch=(slot,mods={self:0,team:0,opp:0})=>{
    const event=world.currentEvent?.v5&&world.currentEvent.type==='ranked'?{...world.currentEvent,participantIds:[...world.currentEvent.participantIds]}:null;if(!event)return previousFinalize(slot,mods);
    const pointsBefore={...world.points},logsBefore=state.logs?.length||0,historyBefore=state.history?.length||0,realShowModal=ui.showModal;let capturedModal=null;ui.showModal=(title,html,buttons=[])=>{capturedModal={title,html,buttons};};let out;
    try{out=previousFinalize(slot,mods);}finally{ui.showModal=realShowModal;}
    Object.keys(pointsBefore).forEach((id)=>{world.points[id]=pointsBefore[id];});cleanRankingLogsSince(logsBefore);
    if((state.history?.length||0)>historyBefore){const history=state.history[state.history.length-1],seed=event.participantIds.findIndex((id)=>id===myId())+1,run=regularUserRun(event,mods);history.result=run.result;const delta=rankingDelta(event.level,seed,run.result,event.participantIds.length);setPoints(myId(),(world.points[myId()]||0)+delta);world.v4.regularResults[event.key]={result:run.result,delta,seed};world.resolvedEventKeys[event.key]=true;if(world.currentEvent?.key===event.key){world.currentEvent.status='completed';world.currentEvent.result=run.result;}logic.log(`赛事排名积分 ${delta>=0?'+':''}${delta}（${event.level}级 · 赛前赛事种子 #${seed} · ${run.result}）`,delta>0?'pos':delta<0?'neg':'normal');const detail=run.lines.map((line)=>`<div style="padding:5px 0;border-bottom:1px solid #f1f5f9">${line}</div>`).join('');realShowModal(event.name,`<div style="font-size:.82rem;color:#64748b;margin-bottom:9px">8队淘汰赛 · 赛事准备 ${run.prep}/20 · 强队也存在爆冷概率</div><div style="font-size:.84rem">${detail}</div><h2 style="text-align:center;margin:16px 0;color:var(--primary)">${run.result}</h2><div style="font-size:.8rem;color:#64748b">个人击杀、奖金与 Rating 仍由比赛表现结算；世界排名积分本场只结算一次。</div>`,[{text:'继续',class:'btn-primary',cb:()=>{ui.closeModal();ui.render();}}]);}else if(capturedModal)realShowModal(capturedModal.title,capturedModal.html,capturedModal.buttons);return out;
  };

  const majorKey=(year=state.date.year,month=state.date.month)=>`${year}-${month===6?'spring':'winter'}`;
  function lockMajor(year,half){const key=`${year}-${half}`;if(world.v4.majorSeeds[key])return world.v4.majorSeeds[key];const snapshot=rows();world.v4.majorSeeds[key]={qualified:snapshot.slice(0,16).map((r)=>r.id),snapshot:snapshot.map((r)=>({id:r.id,rank:r.rank,points:r.points}))};return world.v4.majorSeeds[key];}
  const currentMajorSeed=()=>lockMajor(state.date.year,state.date.month===6?'spring':'winter');
  const majorEligible=()=>[6,12].includes(state.date.month)&&currentMajorSeed().qualified.includes(myId());
  function majorResultDelta(seed,result){if(result==='冠军')return Math.max(22,rankingDelta('Major',seed,result,16));if(result==='亚军')return Math.max(12,rankingDelta('Major',seed,result,16));if(result==='四强')return Math.max(0,rankingDelta('Major',seed,result,16));if(result==='八强'){if(seed<=4)return-12;if(seed<=8)return 0;return 8;}return-Math.max(8,Math.round(22-Math.min(seed,16)*.7));}
  function chooseMajorOpponent(pool,used){const available=pool.filter((id)=>id!==myId()&&!used.includes(id));return sample(available.length?available:pool.filter((id)=>id!==myId()));}
  function playMajorV5(){
    if(![6,12].includes(state.date.month))return;const key=majorKey();if(world.v4.majorResults[key])return;const seedData=currentMajorSeed(),snapshot=seedData.snapshot,mySeed=snapshot.find((r)=>r.id===myId())?.rank||99,label=state.date.month===6?`Spring Major ${state.date.year}`:`Winter Major ${state.date.year}`;
    if(!seedData.qualified.includes(myId())){world.v4.majorResults[key]={result:'未获资格',delta:0,seed:mySeed};state.history.push({name:label,level:'Major',points:0,k:0,money:0,result:'未获资格',year:state.date.year});ui.showModal(label,`<h2 style="text-align:center;color:#dc2626">未获资格</h2><p>Major 排名锁定时位列 <strong>#${mySeed}</strong>，前16获得资格。</p>`,[{text:'继续',class:'btn-primary',cb:()=>ui.closeModal()}]);return;}
    const role=teamSystem.getRole(),active=role==='core'||role==='starter'||(role==='rotation'&&Math.random()<.70),prep=clamp(Math.round(primarySlot()?.eventPrep||0),0,20),pool=seedData.qualified.slice(),used=[],lines=[];let wins=0,losses=0;
    while(wins<3&&losses<3){const opp=chooseMajorOpponent(pool,used);used.push(opp);const played=playOne(myId(),opp,{prep,activeUser:active,major:true});if(played.win)wins++;else losses++;lines.push(`Swiss vs ${teamById(opp)?.name||'Opponent'}：${played.win?'胜':'负'}（${wins}-${losses}，赛前胜率 ${(played.chance*100).toFixed(0)}%）`);}
    let result='';if(losses===3)result='小组未出线';if(!result){for(const [round,loseResult] of [['Quarterfinal','八强'],['Semifinal','四强'],['Final','亚军']]){const opp=chooseMajorOpponent(pool,[]),played=playOne(myId(),opp,{prep,activeUser:active,major:true});lines.push(`${round} vs ${teamById(opp)?.name||'Opponent'}：${played.win?'胜':'负'}（赛前胜率 ${(played.chance*100).toFixed(0)}%）`);if(!played.win){result=loseResult;break;}}if(!result)result='冠军';}
    const delta=majorResultDelta(mySeed,result);setPoints(myId(),(world.points[myId()]||0)+delta);const reward={'小组未出线':[0,1,20],'八强':[4,8,65],'四强':[6,18,95],'亚军':[8,35,130],'冠军':[10,70,180]}[result],[careerPts,money,killsBase]=reward,kills=active?Math.round(killsBase*(.75+Math.random()*.5)):0,personalPts=active?careerPts:0,personalMoney=active?money:Math.floor(money*.3);if(personalPts)state.flags.totalScore=(state.flags.totalScore||0)+personalPts;if(personalMoney)logic.modStat('money',personalMoney,'Major 奖金');state.flags.careerKills=(state.flags.careerKills||0)+kills;if(result==='冠军')state.flags.majorWins=(state.flags.majorWins||0)+1;world.v4.majorResults[key]={result,delta,seed:mySeed,active,prep};state.history.push({name:label,level:'Major',points:personalPts,k:kills,money:personalMoney,result:active?result:`替补 · ${result}`,year:state.date.year});logic.log(`Major 排名积分 ${delta>=0?'+':''}${delta}（种子 #${mySeed} · ${result}）`,delta>0?'pos':delta<0?'neg':'normal');const detail=lines.map((line)=>`<div style="padding:5px 0;border-bottom:1px solid #f1f5f9">${line}</div>`).join('');ui.showModal(label,`<div style="background:#f8fafc;padding:9px;border-radius:8px;margin-bottom:9px"><strong>Major 种子：</strong>#${mySeed} · <strong>身份：</strong>${active?'参赛阵容':'替补'} · <strong>准备：</strong>${prep}/20</div><div style="font-size:.82rem;max-height:260px;overflow:auto">${detail}</div><h2 style="text-align:center;margin:16px 0;color:var(--primary)">${active?result:`替补 · ${result}`}</h2><div style="font-size:.8rem;color:#64748b">Major 单场胜率始终限制在 24%–76%。能力、阵容和准备度提高胜率，但永远不会保证夺冠。</div>`,[{text:'结束 Major',class:'btn-primary',cb:()=>{ui.closeModal();ui.render();}}]);
  }
  function simulateAiMajorIfNeeded(year,half){const key=`${year}-${half}`,flag=`aiMajor-${key}-v5`;if(world.v4[flag])return;const seedData=lockMajor(year,half),seeds=Object.fromEntries(seedData.qualified.map((id,i)=>[id,i+1])),contenders=seedData.qualified.filter((id)=>id!==myId()),table=contenders.map((id)=>({id,perf:teamPower(id,false)+gaussianish()*7+(Math.random()<.08?(Math.random()*18-9):0)})).sort((a,b)=>b.perf-a.perf);table.forEach((entry,index)=>{const result=index===0?'冠军':index===1?'亚军':index<=3?'四强':index<=7?'八强':'小组未出线',delta=majorResultDelta(seeds[entry.id]||16,result);setPoints(entry.id,(world.points[entry.id]||0)+delta);});world.v4[flag]=true;}
  function settleRegularMonth(){const key=monthKey();if(world.v4.monthlySettled[key])return;const rankingRows=rows(),events=monthEvents(state.date.month,rankingRows),current=world.currentEvent?.v5?world.currentEvent:null;events.forEach((event)=>{const isMyEvent=current?.key===event.key;simulateRegularAiEvent(event,isMyEvent);if(isMyEvent&&!world.v4.regularResults[event.key])simulateMyTeamWithoutPlayer(current,current.selected?'未完成赛事，战队由其他选手出战':'未进入首发');});world.v4.monthlySettled[key]=true;}
  function applyDecay(){Object.keys(world.points).forEach((id)=>{world.points[id]=Math.max(300,Math.round((world.points[id]||0)*.996));});}

  const previousNextMonth=logic.nextMonth.bind(logic);
  logic.nextMonth=()=>{settleRegularMonth();if(state.date.month===5)lockMajor(state.date.year,'spring');if(state.date.month===11)lockMajor(state.date.year,'winter');if(state.date.month===6)simulateAiMajorIfNeeded(state.date.year,'spring');if(state.date.month===12)simulateAiMajorIfNeeded(state.date.year,'winter');const intendedPoints={...world.points};world.currentEvent={id:'v5-suppressed',key:`v5-suppressed-${monthKey()}`,type:'break',level:'-',status:'calendar'};const out=previousNextMonth();Object.keys(intendedPoints).forEach((id)=>{world.points[id]=intendedPoints[id];});applyDecay();setupCurrentMonth(true);return out;};
  const mustPlayMajorBeforeAdvance=()=>[6,12].includes(state.date.month)&&majorEligible()&&!world.v4.majorResults[majorKey()];
  game.nextMonth=()=>{const event=world.currentEvent;if(event?.v5&&event.type==='ranked'&&event.selected&&event.status==='planning'){ui.showModal('本月普通赛事尚未完成',`${teamSystem.getTeam()?.name||'当前战队'} 本月有 <strong>${event.name}</strong>。`,[{text:'进入赛事',class:'btn-primary',cb:()=>{ui.closeModal();tournamentWorld.playCurrentEvent();}},{text:'让战队其他人出战',class:'btn-outline',cb:()=>{simulateMyTeamWithoutPlayer(event,'主动轮休');ui.closeModal();ui.render();}}]);return;}if(mustPlayMajorBeforeAdvance()){ui.showModal('Major 尚未完成',`本月还有 <strong>${state.date.month===6?'Spring Major':'Winter Major'}</strong>。`,[{text:'进入 Major',class:'btn-warning',cb:()=>{ui.closeModal();setTimeout(playMajorV5,60);}}]);return;}logic.nextMonth();};

  function renderWorkstationV5(){const container=document.getElementById('slots-container');if(!container||!state.started)return;const event=world.currentEvent,rank=myRank(),currentLevel=levelForRank(rank),active=activeLevels(state.date.month),slot=primarySlot(),prep=clamp(Math.round(slot.eventPrep||0),0,20),majorMonth=[6,12].includes(state.date.month),majorKeyNow=majorMonth?majorKey():null,majorDone=majorKeyNow?!!world.v4.majorResults[majorKeyNow]:false;let regularHtml;
    if(!active.includes(currentLevel))regularHtml=`<div class="slot-card"><div class="slot-header"><span>本月普通赛事</span><span>${active.join(' / ')}级</span></div><p style="font-size:.83rem;color:#64748b">你当前世界排名 #${rank}，属于 ${currentLevel} 级。本月轮到 ${active.join('、')} 级赛事，因此本月没有你的普通赛事。</p></div>`;
    else if(!event||event.type!=='ranked')regularHtml=`<div class="slot-card"><div class="slot-header"><span>普通赛事</span><span>${currentLevel}级</span></div><p>赛事正在初始化。</p></div>`;
    else if(event.status==='completed'||event.status==='team-simulated')regularHtml=`<div class="slot-card active"><div class="slot-header"><span>${event.name}</span><span>${event.level}级</span></div><div style="padding:8px;background:#ecfdf5;border-radius:7px;color:#065f46">已完成：${event.result||world.v4.regularResults[event.key]?.result||'战队已结算'}</div></div>`;
    else if(!event.selected)regularHtml=`<div class="slot-card active"><div class="slot-header"><span>${event.name}</span><span>${event.level}级</span></div><p style="font-size:.82rem;color:#9a3412">${event.selectionReason}</p></div>`;
    else regularHtml=`<div class="slot-card active"><div class="slot-header"><span>${event.name}</span><span>${event.level}级</span></div><div style="font-size:.78rem;color:#64748b">8队淘汰赛 · 当前世界 #${rank} · 准备度 ${prep}/20</div><p style="font-size:.8rem;color:#475569;margin-top:6px">${event.selectionReason}</p><button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="tournamentWorld.playCurrentEvent()">进入赛事</button></div>`;
    let majorHtml='';if(majorMonth){const eligible=majorEligible(),seed=currentMajorSeed().snapshot.find((r)=>r.id===myId())?.rank||'-';if(majorDone)majorHtml=`<div class="slot-card active" style="border-color:#f59e0b"><div class="slot-header"><span>${state.date.month===6?'Spring':'Winter'} Major</span><span>Major</span></div><div style="padding:8px;background:#fffbeb;border-radius:7px">已完成：${world.v4.majorResults[majorKeyNow]?.result||'-'}</div></div>`;else if(!eligible)majorHtml=`<div class="slot-card" style="border-color:#f59e0b"><div class="slot-header"><span>${state.date.month===6?'Spring':'Winter'} Major</span><span>Major</span></div><p style="font-size:.82rem;color:#991b1b">排名锁定时 #${seed}，未进入前16。</p></div>`;else majorHtml=`<div class="slot-card active" style="border-color:#f59e0b"><div class="slot-header"><span>${state.date.month===6?'Spring':'Winter'} Major</span><span>Major</span></div><div style="font-size:.78rem;color:#64748b">种子 #${seed} · 16队 Swiss → 8队淘汰赛 · 单场胜率上限76%</div><button class="btn btn-warning" style="width:100%;margin-top:8px" onclick="tournamentWorld.playMajor()">进入 Major</button></div>`;}container.innerHTML=regularHtml+majorHtml;}
  function openWorldHubV5(){const rankingRows=rows(),active=activeLevels(state.date.month),events=monthEvents(state.date.month,rankingRows),rankingHtml=rankingRows.map((r)=>`<div style="display:grid;grid-template-columns:36px 1fr 70px;gap:8px;padding:6px 8px;border-bottom:1px solid #f1f5f9;${r.id===myId()?'background:#eff6ff;font-weight:700;':''}"><span>#${r.rank}</span><span>${r.name}</span><span style="text-align:right">${r.points}</span></div>`).join(''),eventHtml=events.map((e)=>`<div style="padding:8px;border-bottom:1px solid #f1f5f9"><strong>[${e.level}] ${e.name}</strong><div style="font-size:.76rem;color:#64748b">#${e.minRank}–#${e.maxRank} · 8队淘汰赛</div></div>`).join(''),majorText=[6,12].includes(state.date.month)?`<div style="padding:8px;background:#fffbeb"><strong>[Major] ${state.date.month===6?'Spring Major':'Winter Major'}</strong><div style="font-size:.76rem;color:#64748b">前16 · Swiss 3胜晋级/3负淘汰 → 八强淘汰赛</div></div>`:'';ui.showModal('CS 世界赛事中心',`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px"><div class="team-summary-card"><div class="team-summary-value">#${myRank()}</div><div class="team-summary-label">你的世界排名</div></div><div class="team-summary-card"><div class="team-summary-value">${levelForRank(myRank())}</div><div class="team-summary-label">当前赛事级别</div></div><div class="team-summary-card"><div class="team-summary-value">${active.join(' + ')}</div><div class="team-summary-label">本月举办</div></div></div><div style="font-weight:800;margin:8px 0">本月赛事</div><div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${eventHtml}${majorText}</div><div style="font-size:.75rem;color:#64748b;margin:9px 0">奇数月举办 S+B，偶数月举办 A+C；因此每个级别每两个月出现一次。Major 在6月和12月额外举行。</div><div style="font-weight:800;margin:12px 0 8px">世界排名</div><div style="max-height:260px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px">${rankingHtml}</div>`,[{text:'关闭',class:'btn-outline',cb:()=>ui.closeModal()}]);}

  tournamentWorld.openWorldHub=openWorldHubV5;tournamentWorld.playMajor=playMajorV5;tournamentWorld.getMonthlyEvents=monthEvents;tournamentWorld.getCalendarEvent=()=>world.currentEvent;
  tournamentWorld.playCurrentEvent=()=>{const event=world.currentEvent;if(!event?.v5||event.type!=='ranked'||event.status!=='planning'||!event.selected)return;const slot=primarySlot(),prep=clamp(Math.round(slot.eventPrep||0),0,20);slot.status='resolving';slot.name=event.name;slot.level=event.level;slot.worldEventKey=event.key;slot.worldEventId=event.id;slot.eventPrep=prep;slot.scores={tac:prep,trn:prep,real:prep};slot.savedScores={tac:prep,trn:prep,real:prep};setTimeout(()=>logic.triggerMatchEvent(slot.id),60);ui.render();};
  if(ui.renderWorkstation)ui.renderWorkstation=()=>renderWorkstationV5();
  const previousRender=ui.render.bind(ui);ui.render=()=>{const out=previousRender();if(state.started&&world.initialized){setupCurrentMonth(false);renderWorkstationV5();}return out;};
  setupCurrentMonth(true);console.info('[event-system-v4] v5 loaded: two rotating monthly tiers, capped probabilistic regular/Major results.');
})();
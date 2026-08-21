(() => {
  if (!window.csI18nV20) {
    console.warn('[i18n-v20-supplement] Base bilingual layer is not ready.');
    return;
  }

  const ZH_EN = {
    '生涯 Rating': 'Career Rating',
    '最终战队': 'Final Team',
    '总冠军数': 'Total Titles',
    '年度Top1': 'Year-End No. 1',
    '光荣退役': 'Retirement',
    '你完成了完整的10年职业生涯。按照职业生涯模式规则，现在正式退役。': 'You completed the full 10-year career. Under career mode rules, it is time to retire.',
    '退役后仍可保存当前档案，但不能继续推进职业生涯。': 'You can still save this career archive after retirement, but the career can no longer advance.',
    '重新开始': 'Start Over',
    'Major二连冠': 'Back-to-Back Major Champion',
    '连续两届Major夺冠。': 'Win two consecutive Majors.',
    '一年双Major': 'Double Major Year',
    '同一个赛季包揽春季与冬季Major。': 'Win both the Spring and Winter Major in one year.',
    'Major三冠王': 'Three-Time Major Champion',
    '职业生涯赢得3座Major。': 'Win three Majors in your career.',
    'Major王朝': 'Major Dynasty',
    '职业生涯赢得5座Major。': 'Win five Majors in your career.',
    '年度世界第一': 'Year-End World No. 1',
    '第一次获得HLTV年度Top1。': 'Finish HLTV year-end No. 1 for the first time.',
    '两度年度第一': 'Two-Time Year-End No. 1',
    '两次获得HLTV年度Top1。': 'Finish HLTV year-end No. 1 twice.',
    '三度登顶': 'Three-Time No. 1',
    '三次获得HLTV年度Top1。': 'Finish HLTV year-end No. 1 three times.',
    '五度封王': 'Five-Time No. 1',
    '五次获得HLTV年度Top1。': 'Finish HLTV year-end No. 1 five times.',
    'S级统治者': 'S-Tier Dominator',
    '赢得3座S级赛事冠军。': 'Win three S-tier events.',
    '奖杯收藏家': 'Trophy Collector',
    '职业生涯累计赢得10座正式赛事奖杯。': 'Win ten official tournament trophies in your career.',
    'Major决赛常客': 'Major Finals Regular',
    '至少3次打进Major决赛。': 'Reach at least three Major finals.',
    '超级巨星': 'Superstar',
    '至少8项正式赛事后，生涯平均Rating达到1.20。': 'After at least eight official events, reach a career average Rating of 1.20.',
    '王座与Major': 'No. 1 and a Major',
    '成为世界第一战队成员，并至少赢得1座Major。': 'Be a member of the world No. 1 team and win at least one Major.',
    '职业常青树': 'Iron Career',
    '职业生涯进入第6年。': 'Reach year 6 of your career.',
    '覆盖/写入手动存档1': 'Overwrite/write manual save 1',
    '覆盖/写入手动存档2': 'Overwrite/write manual save 2',
    '覆盖/写入手动存档3': 'Overwrite/write manual save 3',
    '进入下个月仍会自动保存。': 'Advancing to the next month will still autosave.',
    '自由球员市场': 'Free Agent Market',
    '查看普通报价': 'View Regular Offers',
    '不续约 · 自由选择战队': 'Decline Renewal · Choose a Team',
    '加入': 'Join',
    '当前战队': 'Current Team',
    '续约': 'Renew',
    '不续约 · 自由选队': 'Decline · Choose a Team',
    '战队中心': 'Team Hub',
    '你的 OVR': 'Your OVR',
    '队友平均 OVR': 'Teammate Avg. OVR',
    '化学反应': 'Chemistry',
    '合同剩余（月）': 'Contract Left (Months)',
    '互动': 'Interact',
    '阵容基于 2026 年 8 月初现役 CS2 快照。OVR 与薪资是游戏平衡数值，不是官方评分或现实合同。': 'Rosters use an early-August 2026 CS2 snapshot. OVR and salary are game-balance values, not official ratings or real contracts.',
    '本月已经互动过': 'Already Interacted This Month',
    '这个月已经进行过一次额外队友互动。': 'You have already used the extra teammate interaction this month.',
    '一起双排': 'Queue Together',
    '一起复盘': 'Review Demos Together',
    '请他吃饭': 'Buy Dinner',
    '转会市场': 'Transfer Market',
    '目前没有合适的正式报价。': 'There are no suitable formal offers right now.',
    '留队': 'Stay',
    '转会窗口': 'Transfer Window',
    '强队意味着更高赛事资源，但也意味着更激烈的首发竞争。': 'Stronger teams offer better tournament access, but starting spots are more competitive.',
    '留在当前战队': 'Stay with Current Team',
    '接受': 'Accept',
    '进入自由市场': 'Enter Free Agency',
    '队友来敲门': 'Teammate Knocks',
    '首发竞争': 'Starting Spot Competition',
    '教练告诉你，最近的训练表现会直接决定下一项赛事的首发名单。': 'The coach says recent practice performance will directly determine the starting lineup for the next event.',
    '额外加练（SAN-2，首发竞争+1.2）': 'Extra practice (SAN-2, lineup momentum +1.2)',
    '保持正常节奏（SAN+1）': 'Keep the normal routine (SAN+1)',
    '更多队内责任': 'More Team Responsibility',
    '教练希望你承担更多临场沟通和队内责任。': 'The coach wants you to take on more in-game communication and team responsibility.',
    '接下职责（战术+1，全队关系+4）': 'Accept the responsibility (Tactics +1, team relations +4)',
    '专注个人发挥（SAN+1）': 'Focus on individual play (SAN+1)',
    '弱队机会：更容易争取首发': 'Underdog opportunity: easier path to a starting spot',
    '中游试训：阵容更强，需要竞争位置': 'Mid-tier trial: stronger roster, tougher lineup competition',
    '你目前是替补，本项赛事没有进入首发名单。': 'You are currently a reserve and were not selected for this event.',
    '轮换竞争中，你拿到了本次首发。': 'You won the rotation battle and will start this event.',
    '轮换竞争中，教练本次选择了另一套首发。': 'The coach chose a different lineup for this event.',
    '你是队内核心，默认进入首发。': 'As the team core, you are automatically in the starting lineup.',
    '你是固定首发，进入参赛名单。': 'You are a regular starter and made the event roster.',
    '战队未获得本项赛事资格。': 'Your team did not qualify for this event.',
    '公开预选赛。所有战队都能报名，是低排名战队追积分的主要入口。': 'Open qualifier. Every team can enter, making it the main points route for lower-ranked teams.',
    '世界排名前 16 获得正赛资格。': 'The world top 16 qualify for the main event.',
    '世界排名前 12 受邀参加国际赛事。': 'The world top 12 receive invitations to the international event.',
    '世界排名前 8 的顶级赛事，也是春季 Major 前的重要积分赛。': 'An elite event for the world top 8 and a key points stop before the Spring Major.',
    '月底锁定 Major 种子。前 12 获得资格。': 'Major seeds lock at month-end. The top 12 qualify.',
    'Stage 1 → Stage 2 → Stage 3 → Playoffs。': 'Stage 1 → Stage 2 → Stage 3 → Playoffs.',
    '夏季休赛期': 'Summer Break',
    '转会窗口与夏季特训。': 'Transfer window and summer training.',
    '下半赛季第一站，世界排名前 16 获得资格。': 'The first event of the second half; the world top 16 qualify.',
    '世界排名前 12 的国际赛事。': 'An international event for the world top 12.',
    '冬季 Major 前最后一项顶级积分赛事。': 'The final elite points event before the Winter Major.',
    '月底锁定第二次 Major 种子。': 'Seeds for the second Major lock at month-end.',
    '年度第二次 Major，结束后进行年度 Top 20 评选。': 'The second Major of the year, followed by the year-end Top 20 ranking.',
    '预选出局': 'Qualifier Exit',
    '参加公开预选': 'Open Qualifier Participation',
    '继续赛季': 'Continue Season',
    '本月正式赛事尚未完成': 'Official Event Still Pending',
    '进入赛事': 'Enter Event',
    '申请轮休': 'Request Rest',
    '主动轮休': 'Requested Rest',
    '缺席正式赛事': 'Missed Official Event',
    '未进入首发': 'Not in Starting Lineup',
    '未获资格': 'Did Not Qualify',
    '未参赛': 'Did Not Play',
    '小组出局': 'Group Stage Exit',
    '首轮出局': 'First-Round Exit',
    '半决赛': 'Semifinal',
    '未出线': 'Eliminated',
    'HLTV 年度 Top 20': 'HLTV Year-End Top 20',
    'Rating数据': 'Rating Data'
  };

  const EN_ZH = Object.fromEntries(Object.entries(ZH_EN).map(([zh, en]) => [en, zh]));
  const canonical = new WeakMap();
  let busy = false;

  function lang() {
    return window.csI18nV20?.language === 'en' ? 'en' : 'zh';
  }

  function transform(text, target = lang()) {
    const raw = String(text ?? '');
    if (!raw.trim()) return raw;
    if (target === 'en') {
      if (ZH_EN[raw] !== undefined) return ZH_EN[raw];
      let out = raw;
      out = out.replace(/你在第(\d+)年(\d+)月主动宣布结束职业生涯。/g, 'You voluntarily ended your career in Year $1, Month $2.');
      out = out.replace(/第(\d+)年结束：达到10年职业生涯上限，正式退役。/g, 'End of Year $1: the 10-year career limit was reached. You retire.');
      out = out.replace(/第(\d+)年(\d+)月：你主动宣布退役。/g, 'Year $1, Month $2: you announced your retirement.');
      out = out.replace(/当前关系：/g, 'Current relation: ');
      out = out.replace(/和 (.+?) 互动/g, 'Interact with $1');
      out = out.replace(/(.+?) 希望和你续约。/g, '$1 wants to renew your contract.');
      out = out.replace(/队伍平均 OVR\s*(\d+)/g, 'Team Avg. OVR $1');
      out = out.replace(/Valve快照/g, 'Valve Snapshot');
      out = out.replace(/签字费\s*(\d+)\s*·\s*(\d+)个月/g, 'Signing Bonus $1 · $2 months');
      out = out.replace(/世界排名积分/g, 'World Ranking Points');
      out = out.replace(/晋级概率/g, 'Qualification Chance');
      out = out.replace(/公开预选/g, 'Open Qualifier');
      out = out.replace(/正赛席位/g, 'main-event spot');
      out = out.replace(/头号种子/g, 'No. 1 seed');
      return out;
    }
    if (EN_ZH[raw] !== undefined) return EN_ZH[raw];
    let out = raw;
    out = out.replace(/You voluntarily ended your career in Year (\d+), Month (\d+)\./g, '你在第$1年$2月主动宣布结束职业生涯。');
    out = out.replace(/End of Year (\d+): the 10-year career limit was reached\. You retire\./g, '第$1年结束：达到10年职业生涯上限，正式退役。');
    out = out.replace(/Year (\d+), Month (\d+): you announced your retirement\./g, '第$1年$2月：你主动宣布退役。');
    out = out.replace(/Current relation:\s*/g, '当前关系：');
    out = out.replace(/Interact with (.+)/g, '和 $1 互动');
    out = out.replace(/(.+?) wants to renew your contract\./g, '$1 希望和你续约。');
    out = out.replace(/Team Avg\. OVR\s*(\d+)/g, '队伍平均 OVR $1');
    out = out.replace(/Valve Snapshot/g, 'Valve快照');
    out = out.replace(/Signing Bonus\s*(\d+)\s*·\s*(\d+) months/g, '签字费 $1 · $2个月');
    out = out.replace(/World Ranking Points/g, '世界排名积分');
    out = out.replace(/Qualification Chance/g, '晋级概率');
    out = out.replace(/Open Qualifier/g, '公开预选');
    return out;
  }

  function translateNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    if (!canonical.has(node)) canonical.set(node, node.nodeValue || '');
    const source = canonical.get(node) || '';
    const next = transform(source);
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  function translateRoot(root = document.body) {
    if (!root) return;
    busy = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) translateNode(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) translateNode(walker.currentNode);
    } finally {
      busy = false;
    }
  }

  const observer = new MutationObserver((mutations) => {
    if (busy) return;
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const current = mutation.target.nodeValue || '';
        const oldSource = canonical.get(mutation.target);
        const expected = oldSource == null ? null : transform(oldSource);
        if (oldSource == null || current !== expected) canonical.set(mutation.target, current);
        translateNode(mutation.target);
      } else {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) translateNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) translateRoot(node);
        });
      }
    }
  });

  window.addEventListener('cs-language-change', () => queueMicrotask(() => translateRoot(document.body)));
  translateRoot(document.body);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  console.info('[i18n-v20-supplement] Extended bilingual coverage loaded.');
})();

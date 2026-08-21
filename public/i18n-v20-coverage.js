(() => {
  const api = window.csI18nV20;
  if (!api) {
    console.warn('[i18n-v20-coverage] base i18n layer not found');
    return;
  }

  const originals = new WeakMap();
  const attrOriginals = new WeakMap();
  let applying = false;

  const EXACT = new Map(Object.entries({
    '准备中...':'Loading...',
    '等待开始':'Waiting to start',
    '个人属性':'Player Stats',
    '请先选择出身':'Choose a background first',
    '当前 Buff':'Active Buffs',
    '战绩中心':'Results Center',
    '操作':'Actions',
    '游戏日志':'Game Log',
    '游戏初始化...':'Initializing game...',
    '赛事工作站':'Tournament Desk',
    '标题':'Title',
    '商店':'Shop',
    '荣誉':'Honors',
    '战队':'Team',
    '战队中心':'Team Hub',
    '保存':'Save',
    '读取':'Load',
    '设置':'Settings',
    '互动':'Interact',
    '关闭':'Close',
    '确定':'Confirm',
    '确认':'Confirm',
    '取消':'Cancel',
    '继续':'Continue',
    '返回':'Back',
    '接受':'Accept',
    '拒绝':'Decline',
    '查看':'View',
    '进入赛事':'Enter Event',
    '申请休息':'Request Rest',
    '查看报价':'View Offers',
    '查看转会报价':'View Transfer Offers',
    '转会市场':'Transfer Market',
    '转会窗口':'Transfer Window',
    '自由市场':'Free Agency',
    '续约':'Renew Contract',
    '合同':'Contract',
    '合同剩余（月）':'Contract Months Left',
    '市场身价':'Market Value',
    '近期训练状态':'Recent Form',
    '首发竞争值':'Starting Competition',
    '队内化学反应':'Team Chemistry',
    '队友':'Teammates',
    '你的 OVR':'Your OVR',
    '队友平均 OVR':'Teammate Avg OVR',
    '当前战队':'Current Team',
    '队内地位':'Team Role',
    '关系紧张':'Tense',
    '生疏':'Distant',
    '正常':'Normal',
    '默契':'Good Chemistry',
    '挚友':'Close Friend',
    '替补':'Reserve',
    '轮换':'Rotation',
    '首发':'Starter',
    '队内核心':'Team Core',
    '职业积分':'Career Points',
    '总击杀':'Total Kills',
    '总奖金':'Total Prize',
    'S级冠军':'S-Tier Titles',
    'Major冠军':'Major Titles',
    '赛事':'Event',
    '级别':'Tier',
    '积分':'Points',
    '奖金':'Prize',
    '结果':'Result',
    '冠军':'Champion',
    '亚军':'Runner-up',
    '四强':'Top 4',
    '八强':'Top 8',
    '十六强':'Top 16',
    '16强':'Top 16',
    '出局':'Eliminated',
    '晋级':'Qualified',
    '未参赛':'Did Not Play',
    '未获得资格':'Not Qualified',
    '小组出局':'Group Stage Exit',
    '首轮出局':'First Round Exit',
    '半决赛':'Semifinal',
    '决赛':'Final',
    '公开预选':'Open Qualifier',
    '封闭预选':'Closed Qualifier',
    '正赛':'Main Event',
    '休赛期':'Off-season',
    '夏歇期':'Summer Break',
    'Major备战':'Major Preparation',
    '年度排名':'Year-end Ranking',
    '世界排名':'World Ranking',
    '世界第一':'World #1',
    '年度第一':'Year-end #1',
    '生涯总览':'Career Overview',
    '退役总结':'Retirement Summary',
    '主动退役':'Voluntary Retirement',
    '被迫退役':'Forced Retirement',
    '继续征战':'Keep Playing',
    '宣布退役':'Retire',
    '年度评分':'Annual Rating',
    '最终战队':'Final Team',
    '总冠军数':'Total Titles',
    '年度世界第一次数':'Year-end #1 Finishes',
    '成就':'Achievements',
    '已解锁':'Unlocked',
    '未解锁':'Locked',
    '新游戏':'New Game',
    '载入存档':'Load Save',
    '手动存档':'Manual Save',
    '自动存档':'Autosave',
    '空存档':'Empty Slot',
    '覆盖存档':'Overwrite Save',
    '删除存档':'Delete Save',
    '角色选择':'Choose a Background',
    '普通选手':'Regular Player',
    '枪法天才':'Aim Prodigy',
    '战术大师':'Tactical Mastermind',
    '富二代':'Born Rich',
    '教练爱徒':'Coach’s Favorite',
    '天选之子':'Chosen One',
    '金钱':'Money',
    '心态':'Mental',
    '枪法':'Aim',
    '战术':'Tactics',
    '教练认可':'Coach Trust',
    '职业生涯':'Career',
    '剩余生涯':'Career Left',
    '目标':'Objective',
    '看 Demo':'Watch Demo',
    '打工':'Part-time Job',
    '想战术':'Tactics Prep',
    '打训练赛':'Scrim',
    '打天梯':'Play Ladder',
    '进入下个月':'Next Month',
    '结算':'Advance',
    '录像学习':'VOD Review',
    '战术准备':'Tactics Prep',
    '训练赛':'Scrim',
    '天梯':'Ladder',
    '比赛':'Match',
    '正式比赛':'Official Match',
    '比赛表现':'Match Performance',
    '稳定训练赛表现':'Consistent Scrim Performance',
    '训练赛表现':'Scrim Performance',
    '保持比赛理解':'Maintain Game Sense',
    '减少团队训练时间':'Less Team Practice',
    '战术训练':'Tactical Practice',
    '赛事战术分':'Event Tactics',
    '赛事训练分':'Event Practice',
    '赛事实战分':'Event Match Practice',
    '获得更多上场机会':'Earned More Playing Time',
    '队内地位变化':'Team Role Change',
    '首发竞争':'Starting Competition',
    '签约':'Signed',
    '身份':'Role',
    '工资':'Salary',
    '签字费':'Signing Bonus',
    '月薪':'Monthly Salary',
    '报价':'Offer',
    '转会报价':'Transfer Offer',
    '接受报价':'Accept Offer',
    '拒绝报价':'Decline Offer',
    '合同到期':'Contract Expired',
    '续约报价':'Renewal Offer',
    '自由球员':'Free Agent',
    '年度Top 20':'Annual Top 20',
    '暂无':'None',
    '无':'None',
    '是':'Yes',
    '否':'No'
  }));

  const FRAGMENTS = [
    ['职业积分：','Career Points: '],
    ['职业积分:','Career Points: '],
    ['目标:','Objective:'],
    ['目标：','Objective: '],
    ['第','Year '],
    ['年 第',' · Month '],
    ['年',' Year'],
    ['月',' Month'],
    ['个月',' months'],
    ['剩余',' left'],
    ['合同剩余','Contract left: '],
    ['当前战队','Current Team'],
    ['世界 #','World #'],
    ['世界排名 #','World Ranking #'],
    ['世界排名','World Ranking'],
    ['排名','Rank'],
    ['队友平均 OVR','Teammate Avg OVR'],
    ['你的 OVR','Your OVR'],
    ['首发竞争值','Starting Competition'],
    ['近期训练状态','Recent Form'],
    ['队内化学反应','Team Chemistry'],
    ['合同剩余（月）','Contract Months Left'],
    ['市场身价','Market Value'],
    ['队内地位','Team Role'],
    ['近期状态','Recent Form'],
    ['关系','Relationship'],
    ['互动','Interact'],
    ['份转会报价',' transfer offers'],
    ['查看 ','View '],
    [' 份转会报价',' transfer offers'],
    ['转会报价','Transfer Offers'],
    ['转会市场','Transfer Market'],
    ['转会窗口','Transfer Window'],
    ['自由市场','Free Agency'],
    ['续约报价','Renewal Offer'],
    ['续约','Renew'],
    ['合同','Contract'],
    ['签约','Sign'],
    ['签字费','Signing Bonus'],
    ['工资','Salary'],
    ['月薪','Monthly Salary'],
    ['奖金','Prize'],
    ['赛事','Event'],
    ['公开预选','Open Qualifier'],
    ['封闭预选','Closed Qualifier'],
    ['预选赛','Qualifier'],
    ['正赛','Main Event'],
    ['小组赛','Group Stage'],
    ['淘汰赛','Playoffs'],
    ['四分之一决赛','Quarterfinal'],
    ['半决赛','Semifinal'],
    ['决赛','Final'],
    ['冠军','Champion'],
    ['亚军','Runner-up'],
    ['四强','Top 4'],
    ['八强','Top 8'],
    ['十六强','Top 16'],
    ['16强','Top 16'],
    ['出局','Eliminated'],
    ['晋级','Qualified'],
    ['获得资格','Qualified'],
    ['未获得资格','Not Qualified'],
    ['未参赛','Did Not Play'],
    ['休息','Rest'],
    ['备战','Preparation'],
    ['训练','Practice'],
    ['训练赛','Scrim'],
    ['天梯','Ladder'],
    ['比赛','Match'],
    ['表现','Performance'],
    ['击杀','Kills'],
    ['战术','Tactics'],
    ['枪法','Aim'],
    ['心态','Mental'],
    ['教练认可','Coach Trust'],
    ['金币','Money'],
    ['金钱','Money'],
    ['声望','Reputation'],
    ['化学反应','Chemistry'],
    ['首发竞争','Starting Competition'],
    ['队内核心','Team Core'],
    ['替补','Reserve'],
    ['轮换','Rotation'],
    ['首发','Starter'],
    ['队友','Teammate'],
    ['战队','Team'],
    ['教练','Coach'],
    ['选手','Player'],
    ['自由球员','Free Agent'],
    ['职业生涯','Career'],
    ['退役','Retirement'],
    ['年度','Annual'],
    ['评分','Rating'],
    ['成就','Achievement'],
    ['已解锁','Unlocked'],
    ['未解锁','Locked'],
    ['保存','Save'],
    ['载入','Load'],
    ['删除','Delete'],
    ['覆盖','Overwrite'],
    ['设置','Settings'],
    ['商店','Shop'],
    ['荣誉','Honors'],
    ['购买','Buy'],
    ['价格','Price'],
    ['效果','Effect'],
    ['拥有','Owned'],
    ['已购买','Purchased'],
    ['不足','Insufficient'],
    ['关闭','Close'],
    ['确认','Confirm'],
    ['确定','Confirm'],
    ['取消','Cancel'],
    ['继续','Continue'],
    ['返回','Back'],
    ['接受','Accept'],
    ['拒绝','Decline'],
    ['选择','Choose'],
    ['进入','Enter'],
    ['查看','View'],
    ['当前','Current'],
    ['最终','Final'],
    ['总计','Total'],
    ['总','Total '],
    ['本月','This Month'],
    ['本年','This Year'],
    ['赛季','Season'],
    ['机会','Chance'],
    ['概率','Chance'],
    ['积分','Points'],
    ['名次','Placement'],
    ['排名点数','Ranking Points'],
    ['排名分','Ranking Points'],
    ['增加','Increased'],
    ['下降','Decreased'],
    ['提升','Improved'],
    ['降低','Reduced'],
    ['获得','Gained'],
    ['失去','Lost'],
    ['解锁','Unlocked'],
    ['完成','Completed'],
    ['失败','Failed'],
    ['成功','Success'],
    ['暂无','None'],
    ['没有','No '],
    ['等待','Waiting'],
    ['准备中','Loading'],
    ['游戏日志','Game Log'],
    ['操作','Actions'],
    ['个人属性','Player Stats'],
    ['当前 Buff','Active Buffs'],
    ['战绩中心','Results Center'],
    ['赛事工作站','Tournament Desk']
  ].sort((a, b) => b[0].length - a[0].length);

  const DYNAMIC = [
    [/职业积分\s*[:：]\s*(\d+(?:\.\d+)?)/g, 'Career Points: $1'],
    [/第\s*(\d+)\s*年\s*第\s*(\d+)\s*月/g, 'Year $1 · Month $2'],
    [/第\s*(\d+)\s*年/g, 'Year $1'],
    [/第\s*(\d+)\s*月/g, 'Month $1'],
    [/合同剩余\s*(\d+)\s*个月/g, 'Contract: $1 months left'],
    [/剩余\s*(\d+)\s*个月/g, '$1 months left'],
    [/查看\s*(\d+)\s*份转会报价/g, 'View $1 transfer offers'],
    [/世界\s*#(\d+)/g, 'World #$1'],
    [/排名\s*#?(\d+)/g, 'Rank #$1'],
    [/关系\s*[:：]?\s*(\d+)/g, 'Relationship: $1'],
    [/OVR\s*(\d+)/g, 'OVR $1'],
    [/\+(\d+)\s*金币/g, '+$1 Money'],
    [/(\d+)\s*金币/g, '$1 Money'],
    [/(\d+)\s*个月/g, '$1 months'],
    [/(\d+)\s*份报价/g, '$1 offers'],
    [/(\d+)\s*次/g, '$1 times']
  ];

  function hasHan(text) {
    return /[\u3400-\u9fff]/.test(text || '');
  }

  function translate(text) {
    if (!text || !hasHan(text)) return text;
    const trimmed = text.trim();
    if (EXACT.has(trimmed)) {
      const lead = text.match(/^\s*/)?.[0] || '';
      const trail = text.match(/\s*$/)?.[0] || '';
      return `${lead}${EXACT.get(trimmed)}${trail}`;
    }

    let out = text;
    DYNAMIC.forEach(([pattern, replacement]) => { out = out.replace(pattern, replacement); });
    FRAGMENTS.forEach(([zh, en]) => { out = out.split(zh).join(en); });

    out = out
      .replace(/，/g, ', ')
      .replace(/。/g, '. ')
      .replace(/；/g, '; ')
      .replace(/：/g, ': ')
      .replace(/（/g, ' (')
      .replace(/）/g, ') ')
      .replace(/\s{2,}/g, ' ');
    return out;
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const current = node.nodeValue || '';
    if (api.language === 'en') {
      if (hasHan(current) && !originals.has(node)) originals.set(node, current);
      const source = originals.get(node) || current;
      const translated = translate(source);
      if (translated !== current) node.nodeValue = translated;
    } else if (originals.has(node)) {
      const original = originals.get(node);
      if (node.nodeValue !== original) node.nodeValue = original;
      originals.delete(node);
    }
  }

  function translateAttributes(el) {
    if (!(el instanceof Element)) return;
    const attrs = ['title', 'placeholder', 'aria-label', 'data-tip'];
    let saved = attrOriginals.get(el);

    if (api.language === 'en') {
      attrs.forEach((name) => {
        const current = el.getAttribute(name);
        if (!current || !hasHan(current)) return;
        if (!saved) saved = {};
        if (!(name in saved)) saved[name] = current;
        const next = translate(saved[name]);
        if (next !== current) el.setAttribute(name, next);
      });
      if (saved) attrOriginals.set(el, saved);
    } else if (saved) {
      Object.entries(saved).forEach(([name, value]) => el.setAttribute(name, value));
      attrOriginals.delete(el);
    }
  }

  function apply(root = document.body) {
    if (!root || applying) return;
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) translateTextNode(root);
      else {
        translateAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
          else translateAttributes(node);
        }
      }
    } finally {
      applying = false;
    }
  }

  window.addEventListener('cs-language-change', () => queueMicrotask(() => apply(document.body)));

  const observer = new MutationObserver((mutations) => {
    if (applying) return;
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') apply(mutation.target);
      mutation.addedNodes?.forEach((node) => apply(node));
    }
  });

  if (document.body) {
    apply(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.csI18nV20Coverage = { translate, apply };
})();

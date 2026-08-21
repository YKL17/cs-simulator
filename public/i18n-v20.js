(() => {
  if (!window.ui || !window.metaSystem) {
    console.warn('[i18n-v20] Required systems are not ready.');
    return;
  }

  const VERSION = '2.20';
  const STORAGE_KEY = 'cs-career:language:v20';
  const supported = new Set(['zh', 'en']);
  let language = localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
  let applying = false;

  const ZH_EN = {
    '准备中...': 'Preparing...',
    '目标:': 'Objective:',
    '等待开始': 'Waiting to start',
    '个人属性': 'Player Stats',
    '请先选择出身': 'Choose a background first',
    '商店': 'Shop',
    '荣誉': 'Honors',
    '当前 Buff': 'Active Buffs',
    '战绩中心': 'Career Results',
    '职业积分': 'Career Points',
    '总击杀': 'Total Kills',
    '总奖金': 'Total Prize Money',
    'S级冠军': 'S-Tier Titles',
    'Major冠军': 'Major Titles',
    '赛事': 'Event',
    '级别': 'Tier',
    '积分': 'Points',
    '奖金': 'Prize',
    '结果': 'Result',
    '操作': 'Actions',
    '看 Demo': 'Watch Demo',
    '打工': 'Side Job',
    '想战术': 'Study Tactics',
    '打训练赛': 'Scrim',
    '打天梯': 'Play Ladder',
    '进入下个月': 'Next Month',
    '结算': 'Advance',
    '游戏日志': 'Game Log',
    '游戏初始化...': 'Initializing...',
    '赛事工作站': 'Tournament Desk',
    '标题': 'Title',
    '心态': 'Mental',
    '枪法': 'Aim',
    '战术': 'Tactics',
    '教练': 'Coach',
    '教练好感': 'Coach Trust',
    '金币': 'Coins',
    '训练分': 'Training',
    '实战分': 'Match Practice',
    '当前无 Buff': 'No active buffs',
    '无': 'None',
    '冠军': 'Champion',
    '亚军': 'Runner-up',
    '四强': 'Top 4',
    '八强': 'Top 8',
    '16强': 'Top 16',
    '晋级': 'Advanced',
    '出局': 'Eliminated',
    '胜': 'Win',
    '负': 'Loss',
    '确定': 'OK',
    '确认': 'Confirm',
    '取消': 'Cancel',
    '关闭': 'Close',
    '返回': 'Back',
    '继续': 'Continue',
    '知道了': 'Got it',
    '新游戏': 'New Game',
    '载入存档': 'Load Save',
    '成就': 'Achievements',
    '现役战队': 'Active Teams',
    '动态排名': 'Dynamic Ranking',
    'Major 生涯': 'Major Career',
    '喜欢这个项目？给它一个 Star ⭐': 'Enjoying the project? Give it a Star ⭐',
    '查看源码、反馈建议并支持继续更新': 'View the source, send feedback, and support future updates',
    '开源浏览器职业生涯模拟器 · 存档仅保存在你的浏览器中': 'Open-source browser career simulator · Save data stays in your browser',
    '存档保存在当前浏览器的本地存储中。': 'Saves are stored locally in this browser.',
    '自动存档': 'Autosave',
    '手动存档': 'Manual Save',
    '空存档': 'Empty Slot',
    '战队': 'Team',
    '未签约': 'Unsigned',
    '载入存档': 'Load Save',
    '返回首页': 'Back to Home',
    '成就中心': 'Achievements',
    '尚未解锁': 'Locked',
    '保存游戏': 'Save Game',
    '保存': 'Save',
    '设置': 'Settings',
    '写入3个手动存档槽之一': 'Write to one of three manual save slots',
    '读取自动存档或手动存档': 'Load an autosave or manual save',
    '宣布退役': 'Retire',
    '查看退役总结': 'View Retirement Summary',
    '主动结束当前职业生涯': 'End the current career',
    '查看这段职业生涯的最终成绩': 'Review the final results of this career',
    '设置面板不会进入游戏弹窗队列。点击“宣布退役”后，确认页会立即在这里出现。': 'The settings panel is separate from the game modal queue. Retirement confirmation appears here immediately.',
    '返回设置': 'Back to Settings',
    '确认载入': 'Confirm Load',
    '当前尚未保存的进度会丢失。': 'Any unsaved progress will be lost.',
    '确认宣布退役': 'Confirm Retirement',
    '保存失败': 'Save Failed',
    '载入失败': 'Load Failed',
    '浏览器无法写入本地存储，请检查隐私模式或存储权限。': 'The browser could not write to local storage. Check private mode or storage permissions.',
    '这个存档无法读取。': 'This save could not be loaded.',
    '大多数': 'Regular Player',
    '没有任何属性变化': 'No starting stat changes',
    '天才枪男': 'Aim Prodigy',
    '枪法初始 +5': 'Starting Aim +5',
    '战术大师': 'Tactical Mastermind',
    '战术意识初始 +5': 'Starting Tactics +5',
    '富可敌国': 'Born Rich',
    '金币值初始 +5': 'Starting Coins +5',
    '教练宠儿': "Coach's Favorite",
    '教练好感度初始 +5': 'Starting Coach Trust +5',
    '天选之人': 'The Chosen One',
    '全属性 +2': 'All stats +2',
    '冰美式': 'Iced Americano',
    '心态值+2': 'Mental +2',
    '租训练服务器': 'Rent Training Server',
    'Buff: 下次打训练赛多打1次': 'Buff: +1 scrim next time',
    '战术复盘服务': 'Tactical Review Service',
    'Buff: 下次想战术分数+5': 'Buff: +5 next tactics action',
    '天梯加速器': 'Ladder Accelerator',
    'Buff: 下次打天梯分数+4': 'Buff: +4 next ladder action',
    '教练私教课': 'Private Coaching',
    'Buff: 下次打训练赛分数+4': 'Buff: +4 next scrim action',
    '机械键盘': 'Mechanical Keyboard',
    '每次打天梯心态消耗-3': 'Ladder Mental cost -3',
    '240Hz显示器': '240Hz Monitor',
    '看Demo心态消耗-1': 'Demo Mental cost -1',
    '人体工学椅': 'Ergonomic Chair',
    '每月恢复心态+1': 'Recover +1 Mental each month',
    '购买训练服务器': 'Buy Training Server',
    '每次打训练赛多打1次': '+1 scrim each time',
    '小金手指': 'Lucky Finger',
    '能力值+1 (每月限1次)': 'One stat +1 (once per month)',
    '替补': 'Reserve',
    '轮换': 'Rotation',
    '首发': 'Starter',
    '队内核心': 'Team Core',
    '决胜局残局': 'Deciding-Round Clutch',
    '比分 15:14，你剩下 1v1 残局，C4 已安放。你知道对手在 VIP。': 'The score is 15:14. You are in a 1v1 afterplant and know the opponent is in VIP.',
    '主动拉出去对枪 (拼枪法)': 'Swing for the duel (Aim)',
    '躲在死点拖时间 (拼智商)': 'Hide and play the clock (Game sense)',
    '你选择了相信自己的枪法！': 'You trust your aim!',
    '你选择了稳健的打法。': 'You choose the safer line.',
    '经济局指挥': 'Eco-Round Call',
    '全队只有 $2000，作为关键先生，队友在等你的信号。': 'The team has only $2,000 each and everyone is waiting for your call.',
    '全队 Rush B (赌博)': 'Rush B together (Gamble)',
    '纯 Eco 攒钱 (稳健)': 'Full eco and save (Safe)',
    '富贵险中求！': 'High risk, high reward!',
    '留得青山在。': 'Live to fight another round.',
    '暂停时刻': 'Timeout',
    '队伍连丢 5 分，教练叫了暂停，气氛凝重。': 'The team has lost five rounds in a row. The coach calls a timeout and the mood is tense.',
    '大声激励队友 (提振士气)': 'Fire up the team (Morale)',
    '分析对手站位 (战术调整)': 'Analyze enemy setups (Tactical adjustment)',
    '大家冷静分析了一波。': 'The team calmly works through the adjustment.',
    '第一份合同': 'First Contract',
    '正式加入一支职业战队。': 'Sign with a professional team.',
    '职业首秀': 'Pro Debut',
    '完成第一场正式赛事。': 'Complete your first official event.',
    '站稳脚跟': 'Established Starter',
    '成为战队首发。': 'Become a starting player.',
    '成为战队核心选手。': 'Become the team core.',
    '新的征程': 'A New Chapter',
    '完成第一次转会。': 'Complete your first transfer.',
    '跻身一线': 'Into the Elite',
    '所在战队进入世界前 20。': 'Reach the world top 20 with your team.',
    '世界前十': 'World Top 10',
    '所在战队进入世界前 10。': 'Reach the world top 10 with your team.',
    '世界第一': 'World No. 1',
    '所在战队登上世界排名第一。': 'Take your team to world No. 1.',
    '第一座奖杯': 'First Trophy',
    '赢得任意级别赛事冠军。': 'Win any tournament.',
    '顶级赛事冠军': 'S-Tier Champion',
    '赢得一次 S 级赛事冠军。': 'Win an S-tier event.',
    'Major Champion': 'Major Champion',
    '赢得一次 Major。': 'Win a Major.',
    '职业老将': 'Veteran',
    '职业生涯进入第 4 年。': 'Reach year 4 of your career.',
    '成就解锁': 'Achievement Unlocked',
    '随机抉择': 'Career Decision',
    '月度事件': 'Monthly Event',
    '队友生日': "Teammate's Birthday",
    '队友在训练结束后说今天是他生日，大家准备临时出去吃点东西。': 'After practice, a teammate mentions it is his birthday and everyone plans an impromptu dinner.',
    '一起去聚餐（金币-1，心态+2，教练+1）': 'Join the dinner (Coins -1, Mental +2, Coach +1)',
    '留下来加练（心态-1，枪法+1）': 'Stay and practice (Mental -1, Aim +1)',
    '版本大更新': 'Major Patch',
    '游戏突然迎来大版本更新。常用地图的道具点位、枪械手感和经济系统都有变化。': 'A major patch suddenly changes utility lineups, weapon feel, and the economy on familiar maps.',
    '通宵研究新版本（心态-2，战术+1）': 'Study the patch all night (Mental -2, Tactics +1)',
    '先按原来的方式打（无事发生）': 'Keep playing the old way (No effect)',
    '陌生人的私信': 'A Message from a Stranger',
    '你收到一条很长的私信。对方说因为看了你的比赛，才重新开始认真打 CS。': 'You receive a long message from someone who says watching you inspired them to take CS seriously again.',
    '评论区爆炸': 'Comment Section Meltdown',
    '一场训练赛片段被传到网上。评论区有人夸你，也有人说你“纯靠队友”。': 'A scrim clip goes online. Some praise you while others say you are carried by your teammates.',
    '关掉评论区继续训练（心态+1）': 'Close the comments and keep training (Mental +1)',
    '亲自下场对线（心态-2）': 'Argue in the comments yourself (Mental -2)',
    '外设坏了': 'Broken Gear',
    '训练时鼠标开始偶发双击。暂时还能用，但关键局出问题就麻烦了。': 'Your mouse starts double-clicking during practice. It still works, but a failure in a key round would be disastrous.',
    '直接换新的（金币-2，枪法+1）': 'Replace it now (Coins -2, Aim +1)',
    '先凑合用（心态-1）': 'Keep using it for now (Mental -1)',
    '录像复盘': 'VOD Review',
    '分析师剪了一整段你的个人录像，指出你在残局里经常提前暴露自己的意图。': 'The analyst reviews your VOD and points out that you often reveal your intentions too early in clutches.',
    '手感低谷': 'Aim Slump',
    '连续几天，你连平时十拿九稳的枪都打不中。越想找回手感，准星越像粘不住人。': 'For days, you miss shots you normally make. The harder you chase your form, the worse your crosshair feels.',
    '继续硬练（心态-2，枪法+1）': 'Keep grinding (Mental -2, Aim +1)',
    '休息两天（心态+2）': 'Take two days off (Mental +2)',
    '战队聚餐': 'Team Dinner',
    '管理层难得组织了一次没有复盘、没有训练计划的正式聚餐。': 'Management organizes a rare team dinner with no review session and no practice agenda.',
    '地图专家': 'Map Specialist',
    '队伍最近在一张地图上胜率很差，教练让你专门研究对手的默认和道具习惯。': 'The team has struggled on one map, so the coach asks you to study opponents’ defaults and utility habits.',
    '赛前感冒': 'Pre-Match Cold',
    '你醒来时嗓子发紧、脑袋发沉，但今天原本排了整天训练。': 'You wake up with a sore throat and heavy head on a day packed with practice.',
    '请假休息（心态+2，教练-1）': 'Take the day off (Mental +2, Coach -1)',
    '照常训练（心态-2）': 'Practice as usual (Mental -2)',
    '社区表演赛': 'Community Showmatch',
    '一个社区杯邀请你临时当嘉宾。比赛没什么奖金，但现场气氛非常热闹。': 'A community cup invites you as a guest. There is little prize money, but the atmosphere is lively.',
    '训练赛录像泄露': 'Scrim Footage Leak',
    '有人把队伍的一小段训练赛录像传了出去。教练要求所有人重新检查自己的账号和文件。': 'A piece of team scrim footage leaks online. The coach tells everyone to review account and file security.',
    '第一次线下赛': 'First LAN',
    '你第一次坐到真正的线下比赛电脑前。隔音耳机戴上之后，手还是忍不住有点抖。': 'You sit down at a LAN tournament PC for the first time. Even with the headset on, your hands are shaking.',
    '主动找队友聊天放松（心态+2，教练+1）': 'Talk with teammates and relax (Mental +2, Coach +1)',
    '一个人疯狂热手（枪法+1，心态-1）': 'Warm up intensely alone (Aim +1, Mental -1)',
    '替补机会': 'Substitute Opportunity',
    '主力临时有事，教练问你愿不愿意顶上一场本来轮不到你的正式比赛。': 'A starter is suddenly unavailable and the coach asks whether you can step into an official match.',
    '当然上！（心态-1，教练+2）': 'Absolutely! (Mental -1, Coach +2)',
    '还没准备好（心态+1，教练-1）': 'I am not ready yet (Mental +1, Coach -1)',
    '老选手的建议': "Veteran's Advice",
    '训练结束后，一位老队员没有走。他告诉你：“新人最容易犯的错，是每一枪都想证明自己。”': 'After practice, a veteran stays behind and tells you: “The biggest rookie mistake is trying to prove yourself with every shot.”',
    '工资晚了': 'Delayed Salary',
    '小战队的财务说这个月工资要晚几天到账。你手头的钱已经不太宽裕。': 'The team says this month’s salary will be a few days late, and your cash is already tight.',
    '先忍一忍（心态-2）': 'Wait it out (Mental -2)',
    '直接找管理层问清楚（教练-1，心态+1）': 'Ask management directly (Coach -1, Mental +1)',
    '定位讨论': 'Role Discussion',
    '教练问你更想成为“靠个人能力解决问题的人”，还是“能读懂全局的人”。': 'The coach asks whether you want to solve problems through mechanics or become someone who reads the whole game.',
    '我要靠枪说话（枪法+1）': 'Let my aim do the talking (Aim +1)',
    '我要学会读比赛（战术+1）': 'Learn to read the game (Tactics +1)',
    '家里来电话': 'Call from Home',
    '家里问你：“打职业到底稳定吗？要不要给自己留条后路？”': 'Your family asks: “Is going pro really stable? Should you keep a backup plan?”',
    '认真解释自己的计划（战术+1，心态-1）': 'Explain your plan seriously (Tactics +1, Mental -1)',
    '先不想这些（心态+1）': 'Do not think about it for now (Mental +1)',
    '基地杂活': 'Team House Chores',
    '基地里的饮料没了、快递堆了一地。作为新人，大家不约而同地看向你。': 'The team house is out of drinks and packages are piling up. As the rookie, everyone looks at you.',
    '第一次采访': 'First Interview',
    '一个小媒体想采访你，问题是：“你觉得自己多久能成为明星选手？”': 'A small outlet asks: “How long do you think it will take you to become a star?”',
    '“先把每场比赛打好。”（教练+1）': '“I will focus on one match at a time.” (Coach +1)',
    '“给我一年。”（心态+1，教练-1）': '“Give me one year.” (Mental +1, Coach -1)',
    '陌生战队试训': 'Secret Team Trial',
    '一支你不熟悉的队伍私下联系你，想让你参加一次线上试训。现战队并不知道这件事。': 'An unfamiliar team privately invites you to an online trial. Your current team does not know.',
    '偷偷去试试（枪法+1，教练-2）': 'Try out in secret (Aim +1, Coach -2)',
    '拒绝，专心现在的队伍（教练+2）': 'Decline and focus on your team (Coach +2)',
    '新人背锅': 'Rookie Takes the Blame',
    '训练赛输了以后，一位队友把问题几乎全归到你身上。复盘室里突然安静下来。': 'After a scrim loss, a teammate blames almost everything on you. The review room goes silent.',
    '拿录像逐回合说话（战术+1，教练+1，心态-1）': 'Use the VOD and go round by round (Tactics +1, Coach +1, Mental -1)',
    '先认下来（心态-2，教练+1）': 'Take the blame for now (Mental -2, Coach +1)',
    '赛后采访': 'Post-Match Interview',
    '记者问你：“现在这套战术体系真的适合你吗？”教练就在不远处。': 'A reporter asks: “Does this tactical system really suit you?” The coach is standing nearby.',
    '公开支持队伍体系（教练+2）': 'Publicly support the system (Coach +2)',
    '直说体系有问题（战术+1，教练-2）': 'Say the system has problems (Tactics +1, Coach -2)',
    '旧采访又被翻出来了': 'Old Interview Resurfaces',
    '战队最近成绩不好，你当年说“体系有问题”的采访突然重新爆火。': 'The team is struggling and your old interview saying “the system has problems” suddenly goes viral again.',
    '战队最近成绩不好，你当年公开力挺体系的采访被重新翻了出来。': 'The team is struggling and your old interview publicly defending the system resurfaces.',
    '转会传闻': 'Transfer Rumor',
    '社交媒体突然开始传你要离队，而且已经有人“确认”了下一站。你自己却什么都没听说。': 'Social media suddenly claims you are leaving and someone has even “confirmed” your destination, although you have heard nothing.',
    '公开辟谣（教练+1）': 'Deny it publicly (Coach +1)',
    '保持沉默（心态-1）': 'Stay silent (Mental -1)',
    '赞助商拍摄': 'Sponsor Shoot',
    '赞助商安排了一整天拍摄。你要重复念十几遍同一句广告词，晚上还有训练。': 'A sponsor books a full-day shoot. You repeat the same line over and over, then still have practice at night.',
    '跨洲比赛': 'Intercontinental Event',
    '落地之后时差完全没倒过来。凌晨四点你精神得像下午，正式比赛却在十小时后。': 'Jet lag hits hard. You feel wide awake at 4 a.m., but the official match starts ten hours later.',
    '强行调整作息（心态-1，教练+1）': 'Force your schedule to adjust (Mental -1, Coach +1)',
    '顺其自然（心态+1）': 'Go with the flow (Mental +1)',
    '战术会议争执': 'Tactical Meeting Dispute',
    '你认为教练准备的默认打法太容易被对手读懂，但教练坚持按照原计划执行。': 'You think the default setup is too predictable, but the coach insists on the original plan.',
    '坚持自己的判断（战术+1，教练-2）': 'Stand by your read (Tactics +1, Coach -2)',
    '服从安排（教练+1）': 'Follow the plan (Coach +1)',
    '签名会': 'Autograph Session',
    '赛后出口排起了长队。有人带着你几年前还在新人时期的照片来找你签名。': 'A long line forms after the match. One fan brings a photo from your rookie years for you to sign.',
    '经纪人找上门': 'Agent Offer',
    '一名经纪人说可以帮你谈商业合作，但以后每次额外收入都要抽成。': 'An agent offers to handle commercial deals in exchange for a cut of future extra income.',
    '签约（金币+3，心态+1）': 'Sign (Coins +3, Mental +1)',
    '自己处理（无事发生）': 'Handle it yourself (No effect)',
    '新的商业合作': 'New Commercial Deal',
    '经纪人又谈来一笔小合作。钱不算很多，但你几乎不用操心流程。': 'Your agent brings another small deal. It does not pay much, but you barely need to handle anything.',
    '高价赞助': 'High-Paying Sponsor',
    '一家来路有点复杂的平台愿意给出远高于市场价的个人赞助。合同看起来合法，但队友提醒你最好谨慎。': 'A questionable platform offers a personal sponsorship far above market rate. The contract looks legal, but teammates warn you to be careful.',
    '钱太多了，签（金币+6，教练-1）': 'The money is too good—sign (Coins +6, Coach -1)',
    '拒绝（教练+1）': 'Decline (Coach +1)',
    '赞助商爆雷': 'Sponsor Scandal',
    '你之前签下的高价赞助突然陷入巨大争议，品牌账号一夜之间全部停更。战队要求你立刻处理。': 'The high-paying sponsor you signed suddenly falls into a major scandal and disappears overnight. The team demands action.',
    '带新人': 'Mentor a Rookie',
    '队里新来了一名年轻替补。教练希望你每周抽一点时间陪他复盘。': 'A young substitute joins the team and the coach asks you to review demos with him every week.',
    '认真带他（心态-2，教练+2）': 'Mentor him seriously (Mental -2, Coach +2)',
    '让他自己成长（无事发生）': 'Let him develop on his own (No effect)',
    '替补救场': 'The Substitute Steps Up',
    '你临时状态不佳时，那名你一直带着复盘的替补顶了上来，而且打出了关键表现。': 'When your form dips, the substitute you mentored steps in and delivers a key performance.',
    '直播邀约': 'Streaming Offer',
    '直播平台提出固定合作：每个月播几次训练和天梯，收入不错，但教练担心对手会研究你的习惯。': 'A streaming platform offers a recurring deal. The pay is good, but the coach worries opponents will study your habits.',
    '开播（金币+3，教练-1）': 'Start streaming (Coins +3, Coach -1)',
    '不播，专注比赛（教练+1）': 'Decline and focus on competition (Coach +1)',
    '直播被研究了': 'Opponents Study Your Stream',
    '分析师发现最近几个对手明显在针对你直播里经常使用的站位和习惯。': 'The analyst notices recent opponents are clearly targeting positions and habits visible on your stream.',
    '停播一段时间（金币-2，教练+1）': 'Stop streaming for a while (Coins -2, Coach +1)',
    '故意在直播里放假信息（战术+1，心态-1）': 'Feed false information on stream (Tactics +1, Mental -1)',
    '队内核心之争': 'Battle for Star Status',
    '另一位明星队友最近也状态火热。媒体开始不断比较你们两个，队内气氛慢慢变得微妙。': 'Another star teammate is in great form. Media comparisons make the team atmosphere increasingly awkward.',
    '公开夸他（教练+2，心态+1）': 'Praise him publicly (Coach +2, Mental +1)',
    '用数据说话（枪法+1，心态-1）': 'Let the numbers talk (Aim +1, Mental -1)',
    '心理教练敲门': 'Sports Psychologist Checks In',
    '心理教练注意到你最近状态明显不对，主动问你要不要暂停一次训练聊聊。': 'The sports psychologist notices you are struggling and asks whether you want to skip a practice session to talk.',
    '聊一聊（心态+4）': 'Talk it through (Mental +4)',
    '我没事（心态-1）': 'I am fine (Mental -1)',
    '高光剪辑爆了': 'Highlight Reel Goes Viral',
    '有人把你最近几场比赛的击杀剪成了一段高光视频，一夜之间播放量暴涨。': 'Someone edits your recent kills into a highlight reel that explodes in views overnight.',
    '分析师来请教你': 'The Analyst Asks You',
    '赛前准备时，分析师反过来问你怎么看对手最近改变后的默认。你提出的几个细节被写进了正式战术板。': 'During prep, the analyst asks for your read on an opponent’s new default. Several of your ideas make the official game plan.',
    '关键局由你决定': 'You Make the Call',
    '暂停结束前，教练突然说：“最后这一局你来定。”所有队友都看向你。': 'Before the timeout ends, the coach says: “You call the last round.” Everyone looks at you.',
    '替补警告': 'Bench Warning',
    '教练把你单独留下，直说如果沟通和纪律再这样下去，下一场可能让替补先上。': 'The coach tells you privately that if communication and discipline do not improve, the substitute may start next match.',
    '主动道歉并加练（心态-2，教练+3）': 'Apologize and train extra (Mental -2, Coach +3)',
    '觉得自己没错（教练-1）': 'Insist you did nothing wrong (Coach -1)',
    '二手外设': 'Used Gear',
    '你想换掉已经磨损严重的键盘，但新的太贵。队友说他有一把旧键盘可以便宜卖给你。': 'Your keyboard is badly worn, but a new one is expensive. A teammate offers you his old one cheaply.',
    '买下来（金币-1，心态+1）': 'Buy it (Coins -1, Mental +1)',
    '继续用旧的（无事发生）': 'Keep the old one (No effect)',
    '豪华训练设备': 'Premium Training Setup',
    '你终于有钱把自己的训练设备一次性拉满：新显示器、桌椅、鼠标、耳机，全都可以换。': 'You can finally upgrade your entire setup: monitor, desk, chair, mouse, and headset.',
    '直接升级整套设备（金币-6，枪法+1，心态+2）': 'Upgrade everything (Coins -6, Aim +1, Mental +2)',
    '没必要乱花钱（无事发生）': 'Do not waste the money (No effect)',
    '纪录片邀请': 'Documentary Offer',
    '一家电竞媒体想拍一部关于你的短纪录片，从新人时期一路拍到 Major 冠军。': 'An esports outlet wants to make a short documentary about your path from rookie to Major champion.',
    '接受拍摄（金币+3，心态+2）': 'Accept the shoot (Coins +3, Mental +2)',
    '拒绝，保持低调（教练+1）': 'Decline and stay low-key (Coach +1)',
    '冠军后的松懈': 'Complacency after Winning',
    '连续拿到几个好成绩后，你发现自己训练时开始下意识觉得“差不多就行”。': 'After several strong results, you catch yourself thinking “good enough” during practice.',
    '给自己加训练量（心态-2，枪法+1）': 'Increase your training load (Mental -2, Aim +1)',
    '状态好就该休息（心态+2）': 'Good form deserves rest (Mental +2)',
    '老将的疲惫': 'Veteran Fatigue',
    '又一次收拾行李准备去机场时，你突然发现自己已经记不清这是职业生涯第多少次出差。': 'Packing for another airport trip, you realize you have lost count of how many times you have traveled in your career.',
    '我还想继续赢（心态-1，教练+1）': 'I still want to win (Mental -1, Coach +1)',
    '给自己放松一下（心态+3）': 'Give yourself a break (Mental +3)',
    '通宵练枪，手感火热但精神萎靡': 'You practice aim all night—your mechanics feel sharp, but you are exhausted.',
    '外卖吃到异物，心态大崩': 'Something disgusting turns up in your delivery order and ruins your mood.',
    '粉丝在推特上夸你操作细': 'A fan praises your mechanics on social media.',
    '训练赛因为队友迟到取消': 'A scrim is canceled because a teammate is late.',
    '直播收到大额打赏': 'You receive a large donation while streaming.',
    '打出 1v5 惊天残局，视频火了': 'You win an incredible 1v5 clutch and the clip goes viral.',
    '电脑显卡突然烧了': 'Your GPU suddenly dies.',
    '队友心情不好，是否请他吃顿大餐？': 'A teammate is in a bad mood. Treat him to a good meal?',
    '请客 (金币-2, 教练+2, 心态+2)': 'Treat him (Coins -2, Coach +2, Mental +2)',
    '下次一定 (无事发生)': 'Maybe next time (No effect)',
    '知名分析师开设了付费讲座，是否参加？': 'A well-known analyst is running a paid seminar. Attend?',
    '报名 (金币-3, 战术+2)': 'Sign up (Coins -3, Tactics +2)',
    '太贵了 (无事发生)': 'Too expensive (No effect)',
    'FPS 训练软件推出了高级会员，是否订阅？': 'An FPS training app launches a premium plan. Subscribe?',
    '订阅 (金币-2, 枪法+1)': 'Subscribe (Coins -2, Aim +1)',
    '用免费版 (无事发生)': 'Use the free version (No effect)',
    'SAN-2 | 战术++': 'SAN-2 | Tactics++',
    'SAN-4 | 金币+2': 'SAN-4 | Coins+2',
    'SAN-2 | 战术分UP': 'SAN-2 | Tactics UP',
    'SAN-3 | 训练分UP': 'SAN-3 | Training UP',
    'SAN-4 | 实战分UP': 'SAN-4 | Practice UP'
  };

  const EN_ZH = Object.fromEntries(Object.entries(ZH_EN).map(([zh, en]) => [en, zh]));
  EN_ZH['Open-source browser career simulator · Save data stays in your browser'] = '开源浏览器职业生涯模拟器 · 存档仅保存在你的浏览器中';

  function dynamicZhToEn(text) {
    let out = text;
    out = out.replace(/职业积分\s*:\s*(-?\d+(?:\.\d+)?)/g, 'Career Points: $1');
    out = out.replace(/第\s*(\d+)\s*年\s*(\d+)\s*月/g, 'Year $1 · Month $2');
    out = out.replace(/第\s*(\d+)\s*年/g, 'Year $1');
    out = out.replace(/已解锁\s*(\d+)\s*\/\s*(\d+)/g, 'Unlocked $1 / $2');
    out = out.replace(/手动存档\s*(\d+)/g, 'Manual Save $1');
    out = out.replace(/存档\s*(\d+)\s*已保存/g, 'Save $1 saved');
    out = out.replace(/存档\s*(\d+)/g, 'Save $1');
    out = out.replace(/世界排名\s*#?\s*(\d+)/g, 'World Rank #$1');
    out = out.replace(/排名\s*#?\s*(\d+)/g, 'Rank #$1');
    out = out.replace(/剩余\s*(\d+)\s*个月/g, '$1 months left');
    out = out.replace(/合同剩余\s*(\d+)\s*个月/g, 'Contract: $1 months left');
    out = out.replace(/目标\s*:/g, 'Objective:');
    return out;
  }

  function dynamicEnToZh(text) {
    let out = text;
    out = out.replace(/Career Points:\s*(-?\d+(?:\.\d+)?)/g, '职业积分: $1');
    out = out.replace(/Year\s*(\d+)\s*·\s*Month\s*(\d+)/g, '第$1年$2月');
    out = out.replace(/Year\s*(\d+)/g, '第$1年');
    out = out.replace(/Unlocked\s*(\d+)\s*\/\s*(\d+)/g, '已解锁 $1 / $2');
    out = out.replace(/Manual Save\s*(\d+)/g, '手动存档 $1');
    out = out.replace(/Save\s*(\d+)\s*saved/g, '存档 $1 已保存');
    out = out.replace(/Save\s*(\d+)/g, '存档 $1');
    out = out.replace(/World Rank\s*#?\s*(\d+)/g, '世界排名 #$1');
    out = out.replace(/Rank\s*#?\s*(\d+)/g, '排名 #$1');
    out = out.replace(/(\d+)\s*months left/g, '剩余$1个月');
    out = out.replace(/Contract:\s*(\d+)\s*months left/g, '合同剩余$1个月');
    return out;
  }

  function translateText(value, target = language) {
    const text = String(value ?? '');
    if (!text.trim()) return text;
    if (target === 'en') {
      if (ZH_EN[text] !== undefined) return ZH_EN[text];
      const dynamic = dynamicZhToEn(text);
      if (dynamic !== text) return dynamic;
      return text;
    }
    if (EN_ZH[text] !== undefined) return EN_ZH[text];
    const dynamic = dynamicEnToZh(text);
    if (dynamic !== text) return dynamic;
    return text;
  }

  const canonicalText = new WeakMap();
  const canonicalAttrs = new WeakMap();

  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    if (!canonicalText.has(node)) canonicalText.set(node, node.nodeValue || '');
    const source = canonicalText.get(node) || '';
    const next = translateText(source);
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttributes(el) {
    if (!(el instanceof Element)) return;
    let map = canonicalAttrs.get(el);
    if (!map) {
      map = {};
      canonicalAttrs.set(el, map);
    }
    ['title', 'aria-label', 'placeholder'].forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      if (!(attr in map)) map[attr] = el.getAttribute(attr) || '';
      const next = translateText(map[attr]);
      if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
    });
  }

  function translateRoot(root = document.body) {
    if (!root) return;
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) translateTextNode(root);
      if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) translateTextNode(walker.currentNode);
      root.querySelectorAll?.('*').forEach(translateAttributes);
    } finally {
      applying = false;
    }
  }

  function translateHtml(html) {
    if (language !== 'en') return html;
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html ?? '');
    const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) walker.currentNode.nodeValue = translateText(walker.currentNode.nodeValue, 'en');
    tpl.content.querySelectorAll?.('[title],[aria-label],[placeholder]').forEach((el) => {
      ['title', 'aria-label', 'placeholder'].forEach((attr) => {
        if (el.hasAttribute(attr)) el.setAttribute(attr, translateText(el.getAttribute(attr), 'en'));
      });
    });
    return tpl.innerHTML;
  }

  function ensureSwitcher() {
    let button = document.getElementById('btn-language-v20');
    if (!button) {
      button = document.createElement('button');
      button.id = 'btn-language-v20';
      button.type = 'button';
      button.innerHTML = '<span data-lang="zh">中</span><b>/</b><span data-lang="en">EN</span>';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setLanguage(language === 'zh' ? 'en' : 'zh');
      }, true);
      document.body.appendChild(button);
    }
    button.querySelectorAll('[data-lang]').forEach((el) => el.classList.toggle('active', el.dataset.lang === language));
    button.title = language === 'zh' ? 'Switch to English' : '切换到中文';
    return button;
  }

  function setLanguage(next) {
    if (!supported.has(next) || next === language) return;
    language = next;
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    ensureSwitcher();
    translateRoot(document.body);
    window.dispatchEvent(new CustomEvent('cs-language-change', { detail: { language } }));
  }

  if (!document.getElementById('i18n-v20-style')) {
    const style = document.createElement('style');
    style.id = 'i18n-v20-style';
    style.textContent = `
      #btn-language-v20{position:fixed;top:14px;right:116px;z-index:7150;display:flex;align-items:center;gap:5px;padding:8px 10px;background:rgba(255,255,255,.97);box-shadow:0 5px 18px rgba(15,23,42,.14);border:1px solid #cbd5e1;border-radius:9px;color:#64748b;font-weight:800;cursor:pointer;line-height:1}
      #btn-language-v20 span{opacity:.48;transition:opacity .15s,color .15s}#btn-language-v20 span.active{opacity:1;color:#2563eb}#btn-language-v20 b{font-weight:500;color:#cbd5e1}
      @media(max-width:650px){#btn-language-v20{right:58px;padding:9px 9px;top:14px}}
    `;
    document.head.appendChild(style);
  }

  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => {
    const translatedButtons = (buttons || []).map((button) => ({
      ...button,
      text: language === 'en' ? translateText(button.text, 'en') : translateText(button.text, 'zh'),
    }));
    return previousShowModal(
      translateText(title, language),
      language === 'en' ? translateHtml(html) : html,
      translatedButtons,
    );
  };

  const previousRender = ui.render.bind(ui);
  ui.render = (...args) => {
    const out = previousRender(...args);
    ensureSwitcher();
    queueMicrotask(() => translateRoot(document.body));
    return out;
  };

  const observer = new MutationObserver((mutations) => {
    if (applying) return;
    applying = true;
    try {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          canonicalText.set(mutation.target, mutation.target.nodeValue || '');
          const next = translateText(mutation.target.nodeValue, language);
          if (mutation.target.nodeValue !== next) mutation.target.nodeValue = next;
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              canonicalText.set(node, node.nodeValue || '');
              translateTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              translateRoot(node);
            }
          });
        }
      }
    } finally {
      applying = false;
    }
  });

  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  ensureSwitcher();
  translateRoot(document.body);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  window.csI18nV20 = {
    version: VERSION,
    get language() { return language; },
    setLanguage,
    t: translateText,
    translateRoot,
  };

  console.info(`[i18n-v20] CS Career Simulator v${VERSION} bilingual layer loaded (${language}).`);
})();

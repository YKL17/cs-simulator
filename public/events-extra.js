(() => {
  // This file extends the original single-file game without rewriting index.html.
  // It is loaded after the main game script by Vite's transformIndexHtml hook.
  if (typeof RANDOM_EVENTS === 'undefined' || typeof state === 'undefined' || !window.logic || !window.ui) {
    console.warn('[extra-events] Core game objects are not ready.');
    return;
  }

  const isRookie = () => state.phase === 'rookie';
  const isPro = () => state.phase === 'pro';
  const flag = (name) => Boolean(state.flags[name]);
  const setFlag = (name, value = true) => { state.flags[name] = value; };
  const stat = (name) => state.stats[name] ?? 0;

  const extraEvents = [
    // ---------------------------------------------------------------------
    // GENERAL CAREER EVENTS
    // ---------------------------------------------------------------------
    {
      id: 'general-teammate-birthday',
      title: '队友生日',
      text: '队友在训练结束后说今天是他生日，大家准备临时出去吃点东西。',
      type: 'choice',
      choices: [
        {
          text: '一起去聚餐（金币-1，心态+2，教练+1）',
          cb: (l) => {
            if (l.checkMoney(1)) {
              l.modStat('money', -1, '队友生日聚餐');
              l.modStat('san', 2, '队内气氛不错');
              l.modStat('coach', 1, '融入队伍');
            }
          },
        },
        {
          text: '留下来加练（心态-1，枪法+1）',
          cb: (l) => {
            l.modStat('san', -1, '独自加练');
            l.modStat('aim', 1, '额外练枪');
          },
        },
      ],
    },
    {
      id: 'general-patch-update',
      title: '版本大更新',
      text: '游戏突然迎来大版本更新。常用地图的道具点位、枪械手感和经济系统都有变化。',
      type: 'choice',
      choices: [
        {
          text: '通宵研究新版本（心态-2，战术+1）',
          cb: (l) => {
            l.modStat('san', -2, '研究新版本');
            l.modStat('tactics', 1, '版本理解领先');
          },
        },
        {
          text: '先按原来的方式打（无事发生）',
          cb: () => {},
        },
      ],
    },
    {
      id: 'general-fan-message',
      title: '陌生人的私信',
      text: '你收到一条很长的私信。对方说因为看了你的比赛，才重新开始认真打 CS。',
      effect: (l) => l.modStat('san', 2, '粉丝的认可'),
    },
    {
      id: 'general-toxic-comments',
      title: '评论区爆炸',
      text: '一场训练赛片段被传到网上。评论区有人夸你，也有人说你“纯靠队友”。',
      type: 'choice',
      choices: [
        {
          text: '关掉评论区继续训练（心态+1）',
          cb: (l) => l.modStat('san', 1, '远离争论'),
        },
        {
          text: '亲自下场对线（心态-2）',
          cb: (l) => l.modStat('san', -2, '网络对线'),
        },
      ],
    },
    {
      id: 'general-new-mouse',
      title: '外设坏了',
      text: '训练时鼠标开始偶发双击。暂时还能用，但关键局出问题就麻烦了。',
      type: 'choice',
      choices: [
        {
          text: '直接换新的（金币-2，枪法+1）',
          cb: (l) => {
            if (l.checkMoney(2)) {
              l.modStat('money', -2, '更换鼠标');
              l.modStat('aim', 1, '新外设手感不错');
            }
          },
        },
        {
          text: '先凑合用（心态-1）',
          cb: (l) => l.modStat('san', -1, '担心设备出问题'),
        },
      ],
    },
    {
      id: 'general-analyst-review',
      title: '录像复盘',
      text: '分析师剪了一整段你的个人录像，指出你在残局里经常提前暴露自己的意图。',
      effect: (l) => {
        l.modStat('tactics', 1, '针对性复盘');
        l.modStat('san', -1, '被逐帧挑错');
      },
    },
    {
      id: 'general-aim-slump',
      title: '手感低谷',
      text: '连续几天，你连平时十拿九稳的枪都打不中。越想找回手感，准星越像粘不住人。',
      type: 'choice',
      choices: [
        {
          text: '继续硬练（心态-2，枪法+1）',
          cb: (l) => {
            l.modStat('san', -2, '强行找手感');
            l.modStat('aim', 1, '机械训练');
          },
        },
        {
          text: '休息两天（心态+2）',
          cb: (l) => l.modStat('san', 2, '暂时离开游戏'),
        },
      ],
    },
    {
      id: 'general-team-dinner',
      title: '战队聚餐',
      text: '管理层难得组织了一次没有复盘、没有训练计划的正式聚餐。',
      effect: (l) => {
        l.modStat('san', 2, '放松了一晚');
        l.modStat('coach', 1, '团队关系升温');
      },
    },
    {
      id: 'general-map-specialist',
      title: '地图专家',
      text: '队伍最近在一张地图上胜率很差，教练让你专门研究对手的默认和道具习惯。',
      effect: (l) => {
        l.modStat('tactics', 1, '专项研究地图');
        l.modStat('san', -1, '额外分析工作');
      },
    },
    {
      id: 'general-sick-day',
      title: '赛前感冒',
      text: '你醒来时嗓子发紧、脑袋发沉，但今天原本排了整天训练。',
      type: 'choice',
      choices: [
        {
          text: '请假休息（心态+2，教练-1）',
          cb: (l) => {
            l.modStat('san', 2, '充分休息');
            l.modStat('coach', -1, '缺席训练');
          },
        },
        {
          text: '照常训练（心态-2）',
          cb: (l) => l.modStat('san', -2, '带病训练'),
        },
      ],
    },
    {
      id: 'general-community-cup',
      title: '社区表演赛',
      text: '一个社区杯邀请你临时当嘉宾。比赛没什么奖金，但现场气氛非常热闹。',
      effect: (l) => l.modStat('san', 2, '轻松的表演赛'),
    },
    {
      id: 'general-scrim-leak',
      title: '训练赛录像泄露',
      text: '有人把队伍的一小段训练赛录像传了出去。教练要求所有人重新检查自己的账号和文件。',
      effect: (l) => {
        l.modStat('san', -1, '训练内容泄露');
        l.modStat('coach', -1, '管理层不满');
      },
    },

    // ---------------------------------------------------------------------
    // ROOKIE-ONLY EVENTS
    // ---------------------------------------------------------------------
    {
      id: 'rookie-first-lan',
      title: '第一次线下赛',
      condition: isRookie,
      text: '你第一次坐到真正的线下比赛电脑前。隔音耳机戴上之后，手还是忍不住有点抖。',
      type: 'choice',
      choices: [
        {
          text: '主动找队友聊天放松（心态+2，教练+1）',
          cb: (l) => {
            l.modStat('san', 2, '适应线下氛围');
            l.modStat('coach', 1, '沟通积极');
          },
        },
        {
          text: '一个人疯狂热手（枪法+1，心态-1）',
          cb: (l) => {
            l.modStat('aim', 1, '赛前热手');
            l.modStat('san', -1, '过度紧张');
          },
        },
      ],
    },
    {
      id: 'rookie-substitute-chance',
      title: '替补机会',
      condition: () => isRookie() && !flag('rookieSubChanceDone'),
      text: '主力临时有事，教练问你愿不愿意顶上一场本来轮不到你的正式比赛。',
      type: 'choice',
      choices: [
        {
          text: '当然上！（心态-1，教练+2）',
          cb: (l) => {
            setFlag('rookieSubChanceDone');
            l.modStat('san', -1, '临时顶班的压力');
            l.modStat('coach', 2, '抓住机会');
          },
        },
        {
          text: '还没准备好（心态+1，教练-1）',
          cb: (l) => {
            setFlag('rookieSubChanceDone');
            l.modStat('san', 1, '避免临时压力');
            l.modStat('coach', -1, '错过机会');
          },
        },
      ],
    },
    {
      id: 'rookie-veteran-advice',
      title: '老选手的建议',
      condition: isRookie,
      text: '训练结束后，一位老队员没有走。他告诉你：“新人最容易犯的错，是每一枪都想证明自己。”',
      effect: (l) => l.modStat('tactics', 1, '老将指点'),
    },
    {
      id: 'rookie-delayed-pay',
      title: '工资晚了',
      condition: () => isRookie() && stat('money') <= 6,
      text: '小战队的财务说这个月工资要晚几天到账。你手头的钱已经不太宽裕。',
      type: 'choice',
      choices: [
        {
          text: '先忍一忍（心态-2）',
          cb: (l) => l.modStat('san', -2, '工资延迟'),
        },
        {
          text: '直接找管理层问清楚（教练-1，心态+1）',
          cb: (l) => {
            l.modStat('coach', -1, '质问管理层');
            l.modStat('san', 1, '至少问明白了');
          },
        },
      ],
    },
    {
      id: 'rookie-role-choice',
      title: '定位讨论',
      condition: () => isRookie() && !flag('rookieRoleTalk'),
      text: '教练问你更想成为“靠个人能力解决问题的人”，还是“能读懂全局的人”。',
      type: 'choice',
      choices: [
        {
          text: '我要靠枪说话（枪法+1）',
          cb: (l) => {
            setFlag('rookieRoleTalk');
            l.modStat('aim', 1, '明确个人定位');
          },
        },
        {
          text: '我要学会读比赛（战术+1）',
          cb: (l) => {
            setFlag('rookieRoleTalk');
            l.modStat('tactics', 1, '明确个人定位');
          },
        },
      ],
    },
    {
      id: 'rookie-family-pressure',
      title: '家里来电话',
      condition: isRookie,
      text: '家里问你：“打职业到底稳定吗？要不要给自己留条后路？”',
      type: 'choice',
      choices: [
        {
          text: '认真解释自己的计划（战术+1，心态-1）',
          cb: (l) => {
            l.modStat('tactics', 1, '重新规划生涯');
            l.modStat('san', -1, '现实压力');
          },
        },
        {
          text: '先不想这些（心态+1）',
          cb: (l) => l.modStat('san', 1, '暂时放下压力'),
        },
      ],
    },
    {
      id: 'rookie-bootcamp-chores',
      title: '基地杂活',
      condition: isRookie,
      text: '基地里的饮料没了、快递堆了一地。作为新人，大家不约而同地看向你。',
      effect: (l) => {
        l.modStat('san', -1, '新人杂活');
        l.modStat('coach', 1, '态度不错');
      },
    },
    {
      id: 'rookie-local-interview',
      title: '第一次采访',
      condition: () => isRookie() && !flag('firstInterviewDone'),
      text: '一个小媒体想采访你，问题是：“你觉得自己多久能成为明星选手？”',
      type: 'choice',
      choices: [
        {
          text: '“先把每场比赛打好。”（教练+1）',
          cb: (l) => {
            setFlag('firstInterviewDone');
            l.modStat('coach', 1, '稳重的采访表现');
          },
        },
        {
          text: '“给我一年。”（心态+1，教练-1）',
          cb: (l) => {
            setFlag('firstInterviewDone');
            l.modStat('san', 1, '给自己打气');
            l.modStat('coach', -1, '口气太大');
          },
        },
      ],
    },
    {
      id: 'rookie-trial-offer',
      title: '陌生战队试训',
      condition: () => isRookie() && stat('aim') >= 6,
      text: '一支你不熟悉的队伍私下联系你，想让你参加一次线上试训。现战队并不知道这件事。',
      type: 'choice',
      choices: [
        {
          text: '偷偷去试试（枪法+1，教练-2）',
          cb: (l) => {
            l.modStat('aim', 1, '额外高强度试训');
            l.modStat('coach', -2, '消息走漏');
          },
        },
        {
          text: '拒绝，专心现在的队伍（教练+2）',
          cb: (l) => l.modStat('coach', 2, '表现忠诚'),
        },
      ],
    },
    {
      id: 'rookie-teammate-conflict',
      title: '新人背锅',
      condition: isRookie,
      text: '训练赛输了以后，一位队友把问题几乎全归到你身上。复盘室里突然安静下来。',
      type: 'choice',
      choices: [
        {
          text: '拿录像逐回合说话（战术+1，教练+1，心态-1）',
          cb: (l) => {
            l.modStat('tactics', 1, '用录像沟通');
            l.modStat('coach', 1, '理性处理冲突');
            l.modStat('san', -1, '复盘压力');
          },
        },
        {
          text: '先认下来（心态-2，教练+1）',
          cb: (l) => {
            l.modStat('san', -2, '憋着没说');
            l.modStat('coach', 1, '没有扩大矛盾');
          },
        },
      ],
    },

    // ---------------------------------------------------------------------
    // PRO-ONLY EVENTS
    // ---------------------------------------------------------------------
    {
      id: 'pro-media-stance',
      title: '赛后采访',
      condition: () => isPro() && !flag('mediaStanceChosen'),
      text: '记者问你：“现在这套战术体系真的适合你吗？”教练就在不远处。',
      type: 'choice',
      choices: [
        {
          text: '公开支持队伍体系（教练+2）',
          cb: (l) => {
            setFlag('mediaStanceChosen');
            state.flags.mediaStance = 'team';
            l.modStat('coach', 2, '公开支持战队');
          },
        },
        {
          text: '直说体系有问题（战术+1，教练-2）',
          cb: (l) => {
            setFlag('mediaStanceChosen');
            state.flags.mediaStance = 'critical';
            l.modStat('tactics', 1, '公开表达战术观点');
            l.modStat('coach', -2, '采访引发争议');
          },
        },
      ],
    },
    {
      id: 'pro-media-stance-followup',
      title: '旧采访又被翻出来了',
      condition: () => isPro() && flag('mediaStanceChosen') && !flag('mediaStanceResolved') && state.date.year >= 4,
      text: () => state.flags.mediaStance === 'critical'
        ? '战队最近成绩不好，你当年说“体系有问题”的采访突然重新爆火。'
        : '战队最近成绩不好，你当年公开力挺体系的采访被重新翻了出来。',
      effect: (l) => {
        setFlag('mediaStanceResolved');
        if (state.flags.mediaStance === 'critical') {
          l.modStat('san', -1, '舆论重新发酵');
          l.modStat('tactics', 1, '观点被重新讨论');
        } else {
          l.modStat('coach', 1, '管理层记得你的支持');
          l.modStat('san', -1, '舆论压力');
        }
      },
    },
    {
      id: 'pro-transfer-rumor',
      title: '转会传闻',
      condition: isPro,
      text: '社交媒体突然开始传你要离队，而且已经有人“确认”了下一站。你自己却什么都没听说。',
      type: 'choice',
      choices: [
        {
          text: '公开辟谣（教练+1）',
          cb: (l) => l.modStat('coach', 1, '稳定军心'),
        },
        {
          text: '保持沉默（心态-1）',
          cb: (l) => l.modStat('san', -1, '传闻持续发酵'),
        },
      ],
    },
    {
      id: 'pro-sponsor-shoot',
      title: '赞助商拍摄',
      condition: isPro,
      text: '赞助商安排了一整天拍摄。你要重复念十几遍同一句广告词，晚上还有训练。',
      effect: (l) => {
        l.modStat('money', 2, '商业拍摄');
        l.modStat('san', -2, '商业活动占用训练时间');
      },
    },
    {
      id: 'pro-jetlag',
      title: '跨洲比赛',
      condition: isPro,
      text: '落地之后时差完全没倒过来。凌晨四点你精神得像下午，正式比赛却在十小时后。',
      type: 'choice',
      choices: [
        {
          text: '强行调整作息（心态-1，教练+1）',
          cb: (l) => {
            l.modStat('san', -1, '强行倒时差');
            l.modStat('coach', 1, '职业态度');
          },
        },
        {
          text: '顺其自然（心态+1）',
          cb: (l) => l.modStat('san', 1, '不再焦虑睡眠'),
        },
      ],
    },
    {
      id: 'pro-tactical-dispute',
      title: '战术会议争执',
      condition: () => isPro() && stat('tactics') >= 8,
      text: '你认为教练准备的默认打法太容易被对手读懂，但教练坚持按照原计划执行。',
      type: 'choice',
      choices: [
        {
          text: '坚持自己的判断（战术+1，教练-2）',
          cb: (l) => {
            l.modStat('tactics', 1, '坚持战术判断');
            l.modStat('coach', -2, '与教练争执');
          },
        },
        {
          text: '服从安排（教练+1）',
          cb: (l) => l.modStat('coach', 1, '执行教练安排'),
        },
      ],
    },
    {
      id: 'pro-autograph-line',
      title: '签名会',
      condition: () => isPro() && state.flags.totalScore >= 8,
      text: '赛后出口排起了长队。有人带着你几年前还在新人时期的照片来找你签名。',
      effect: (l) => l.modStat('san', 2, '被老粉丝认出来'),
    },
    {
      id: 'pro-agent-offer',
      title: '经纪人找上门',
      condition: () => isPro() && !flag('agentDecisionMade'),
      text: '一名经纪人说可以帮你谈商业合作，但以后每次额外收入都要抽成。',
      type: 'choice',
      choices: [
        {
          text: '签约（金币+3，心态+1）',
          cb: (l) => {
            setFlag('agentDecisionMade');
            setFlag('hasAgent');
            l.modStat('money', 3, '经纪人带来合作');
            l.modStat('san', 1, '有人处理场外事务');
          },
        },
        {
          text: '自己处理（无事发生）',
          cb: () => setFlag('agentDecisionMade'),
        },
      ],
    },
    {
      id: 'pro-agent-followup',
      title: '新的商业合作',
      condition: () => isPro() && flag('hasAgent'),
      weight: 0.6,
      text: '经纪人又谈来一笔小合作。钱不算很多，但你几乎不用操心流程。',
      effect: (l) => l.modStat('money', 2, '经纪人商业合作'),
    },
    {
      id: 'pro-risky-sponsor',
      title: '高价赞助',
      condition: () => isPro() && !flag('riskySponsorDecision'),
      text: '一家来路有点复杂的平台愿意给出远高于市场价的个人赞助。合同看起来合法，但队友提醒你最好谨慎。',
      type: 'choice',
      choices: [
        {
          text: '钱太多了，签（金币+6，教练-1）',
          cb: (l) => {
            setFlag('riskySponsorDecision');
            setFlag('riskySponsorActive');
            l.modStat('money', 6, '高价个人赞助');
            l.modStat('coach', -1, '管理层有顾虑');
          },
        },
        {
          text: '拒绝（教练+1）',
          cb: (l) => {
            setFlag('riskySponsorDecision');
            l.modStat('coach', 1, '谨慎处理商业合作');
          },
        },
      ],
    },
    {
      id: 'pro-risky-sponsor-fallout',
      title: '赞助商爆雷',
      condition: () => isPro() && flag('riskySponsorActive'),
      weight: 0.35,
      text: '你之前签下的高价赞助突然陷入巨大争议，品牌账号一夜之间全部停更。战队要求你立刻处理。',
      effect: (l) => {
        setFlag('riskySponsorActive', false);
        l.modStat('money', -3, '终止争议赞助');
        l.modStat('san', -3, '商业风波');
        l.modStat('coach', -2, '战队声誉受牵连');
      },
    },
    {
      id: 'pro-mentor-rookie',
      title: '带新人',
      condition: () => isPro() && !flag('mentoredRookie'),
      text: '队里新来了一名年轻替补。教练希望你每周抽一点时间陪他复盘。',
      type: 'choice',
      choices: [
        {
          text: '认真带他（心态-2，教练+2）',
          cb: (l) => {
            setFlag('mentoredRookie');
            l.modStat('san', -2, '额外带新人');
            l.modStat('coach', 2, '承担队内责任');
          },
        },
        {
          text: '让他自己成长（无事发生）',
          cb: () => setFlag('mentoredRookieDeclined'),
        },
      ],
    },
    {
      id: 'pro-mentor-rookie-payoff',
      title: '替补救场',
      condition: () => isPro() && flag('mentoredRookie') && !flag('mentoredRookiePaidOff'),
      weight: 0.5,
      text: '你临时状态不佳时，那名你一直带着复盘的替补顶了上来，而且打出了关键表现。',
      effect: (l) => {
        setFlag('mentoredRookiePaidOff');
        l.modStat('san', 3, '看到新人成长');
        l.modStat('coach', 2, '培养新人得到回报');
      },
    },
    {
      id: 'pro-public-stream',
      title: '直播邀约',
      condition: () => isPro() && !flag('streamDecisionMade'),
      text: '直播平台提出固定合作：每个月播几次训练和天梯，收入不错，但教练担心对手会研究你的习惯。',
      type: 'choice',
      choices: [
        {
          text: '开播（金币+3，教练-1）',
          cb: (l) => {
            setFlag('streamDecisionMade');
            setFlag('publicStreamer');
            l.modStat('money', 3, '直播签约');
            l.modStat('coach', -1, '训练内容暴露风险');
          },
        },
        {
          text: '不播，专注比赛（教练+1）',
          cb: (l) => {
            setFlag('streamDecisionMade');
            l.modStat('coach', 1, '专注比赛');
          },
        },
      ],
    },
    {
      id: 'pro-stream-counterstrat',
      title: '直播被研究了',
      condition: () => isPro() && flag('publicStreamer'),
      weight: 0.4,
      text: '分析师发现最近几个对手明显在针对你直播里经常使用的站位和习惯。',
      type: 'choice',
      choices: [
        {
          text: '停播一段时间（金币-2，教练+1）',
          cb: (l) => {
            setFlag('publicStreamer', false);
            l.modStat('money', -2, '暂停直播合作');
            l.modStat('coach', 1, '减少信息暴露');
          },
        },
        {
          text: '故意在直播里放假信息（战术+1，心态-1）',
          cb: (l) => {
            l.modStat('tactics', 1, '反向利用公开信息');
            l.modStat('san', -1, '额外设计假动作');
          },
        },
      ],
    },
    {
      id: 'pro-star-rivalry',
      title: '队内核心之争',
      condition: () => isPro() && stat('aim') >= 12,
      text: '另一位明星队友最近也状态火热。媒体开始不断比较你们两个，队内气氛慢慢变得微妙。',
      type: 'choice',
      choices: [
        {
          text: '公开夸他（教练+2，心态+1）',
          cb: (l) => {
            l.modStat('coach', 2, '维护队内关系');
            l.modStat('san', 1, '不参与比较');
          },
        },
        {
          text: '用数据说话（枪法+1，心态-1）',
          cb: (l) => {
            l.modStat('aim', 1, '竞争刺激训练');
            l.modStat('san', -1, '核心竞争压力');
          },
        },
      ],
    },

    // ---------------------------------------------------------------------
    // STATE-DEPENDENT EVENTS
    // ---------------------------------------------------------------------
    {
      id: 'state-low-san-psychologist',
      title: '心理教练敲门',
      condition: () => stat('san') <= 7,
      weight: 1.8,
      text: '心理教练注意到你最近状态明显不对，主动问你要不要暂停一次训练聊聊。',
      type: 'choice',
      choices: [
        {
          text: '聊一聊（心态+4）',
          cb: (l) => l.modStat('san', 4, '心理疏导'),
        },
        {
          text: '我没事（心态-1）',
          cb: (l) => l.modStat('san', -1, '继续硬扛'),
        },
      ],
    },
    {
      id: 'state-high-aim-highlight',
      title: '高光剪辑爆了',
      condition: () => stat('aim') >= 12,
      text: '有人把你最近几场比赛的击杀剪成了一段高光视频，一夜之间播放量暴涨。',
      effect: (l) => l.modStat('san', 2, '高光视频走红'),
    },
    {
      id: 'state-high-tactics-analyst',
      title: '分析师来请教你',
      condition: () => stat('tactics') >= 12,
      text: '赛前准备时，分析师反过来问你怎么看对手最近改变后的默认。你提出的几个细节被写进了正式战术板。',
      effect: (l) => l.modStat('coach', 2, '战术意见被采纳'),
    },
    {
      id: 'state-high-coach-trust',
      title: '关键局由你决定',
      condition: () => stat('coach') >= 14,
      text: '暂停结束前，教练突然说：“最后这一局你来定。”所有队友都看向你。',
      effect: (l) => {
        l.modStat('tactics', 1, '承担临场指挥');
        l.modStat('san', 1, '得到队伍信任');
      },
    },
    {
      id: 'state-low-coach-bench',
      title: '替补警告',
      condition: () => stat('coach') <= 4 && state.started,
      weight: 1.5,
      text: '教练把你单独留下，直说如果沟通和纪律再这样下去，下一场可能让替补先上。',
      type: 'choice',
      choices: [
        {
          text: '主动道歉并加练（心态-2，教练+3）',
          cb: (l) => {
            l.modStat('san', -2, '额外训练和沟通');
            l.modStat('coach', 3, '修复关系');
          },
        },
        {
          text: '觉得自己没错（教练-1）',
          cb: (l) => l.modStat('coach', -1, '拒绝让步'),
        },
      ],
    },
    {
      id: 'state-low-money-used-gear',
      title: '二手外设',
      condition: () => stat('money') <= 2,
      text: '你想换掉已经磨损严重的键盘，但新的太贵。队友说他有一把旧键盘可以便宜卖给你。',
      type: 'choice',
      choices: [
        {
          text: '买下来（金币-1，心态+1）',
          cb: (l) => {
            if (l.checkMoney(1)) {
              l.modStat('money', -1, '购买二手外设');
              l.modStat('san', 1, '设备问题缓解');
            }
          },
        },
        {
          text: '继续用旧的（无事发生）',
          cb: () => {},
        },
      ],
    },
    {
      id: 'state-high-money-custom-setup',
      title: '豪华训练设备',
      condition: () => stat('money') >= 15 && !flag('luxurySetupDecision'),
      text: '你终于有钱把自己的训练设备一次性拉满：新显示器、桌椅、鼠标、耳机，全都可以换。',
      type: 'choice',
      choices: [
        {
          text: '直接升级整套设备（金币-6，枪法+1，心态+2）',
          cb: (l) => {
            if (l.checkMoney(6)) {
              setFlag('luxurySetupDecision');
              l.modStat('money', -6, '升级整套训练设备');
              l.modStat('aim', 1, '训练环境升级');
              l.modStat('san', 2, '舒服的新设备');
            }
          },
        },
        {
          text: '没必要乱花钱（无事发生）',
          cb: () => setFlag('luxurySetupDecision'),
        },
      ],
    },
    {
      id: 'state-major-documentary',
      title: '纪录片邀请',
      condition: () => state.flags.majorWins >= 1 && !flag('majorDocumentaryDone'),
      text: '一家电竞媒体想拍一部关于你的短纪录片，从新人时期一路拍到 Major 冠军。',
      type: 'choice',
      choices: [
        {
          text: '接受拍摄（金币+3，心态+2）',
          cb: (l) => {
            setFlag('majorDocumentaryDone');
            l.modStat('money', 3, '纪录片合作');
            l.modStat('san', 2, '回顾自己的职业路');
          },
        },
        {
          text: '拒绝，保持低调（教练+1）',
          cb: (l) => {
            setFlag('majorDocumentaryDone');
            l.modStat('coach', 1, '专注队内事务');
          },
        },
      ],
    },
    {
      id: 'state-swin-confidence',
      title: '冠军后的松懈',
      condition: () => state.flags.sWins >= 2,
      text: '连续拿到几个好成绩后，你发现自己训练时开始下意识觉得“差不多就行”。',
      type: 'choice',
      choices: [
        {
          text: '给自己加训练量（心态-2，枪法+1）',
          cb: (l) => {
            l.modStat('san', -2, '重新提高训练强度');
            l.modStat('aim', 1, '保持竞争力');
          },
        },
        {
          text: '状态好就该休息（心态+2）',
          cb: (l) => l.modStat('san', 2, '享受成绩'),
        },
      ],
    },
    {
      id: 'state-late-career-fatigue',
      title: '老将的疲惫',
      condition: () => isPro() && state.date.year >= 8,
      weight: 1.4,
      text: '又一次收拾行李准备去机场时，你突然发现自己已经记不清这是职业生涯第多少次出差。',
      type: 'choice',
      choices: [
        {
          text: '我还想继续赢（心态-1，教练+1）',
          cb: (l) => {
            l.modStat('san', -1, '继续坚持');
            l.modStat('coach', 1, '老将责任感');
          },
        },
        {
          text: '给自己放松一下（心态+3）',
          cb: (l) => l.modStat('san', 3, '短暂放空'),
        },
      ],
    },
  ];

  // Give the original events stable IDs as well, so the anti-repeat logic can
  // treat old and new events in the same way.
  RANDOM_EVENTS.forEach((evt, index) => {
    if (!evt.id) evt.id = `legacy-${index}`;
    if (!evt.title) evt.title = evt.type === 'choice' ? '随机抉择' : '月度事件';
  });

  RANDOM_EVENTS.push(...extraEvents);

  function weightedPick(pool) {
    const total = pool.reduce((sum, evt) => sum + (evt.weight ?? 1), 0);
    let roll = Math.random() * total;
    for (const evt of pool) {
      roll -= evt.weight ?? 1;
      if (roll <= 0) return evt;
    }
    return pool[pool.length - 1];
  }

  // Replace the original simple random picker with a context-aware picker.
  // Existing event objects remain compatible.
  logic.triggerRandomEvent = () => {
    let pool = RANDOM_EVENTS.filter((evt) => {
      try {
        return !evt.condition || evt.condition();
      } catch (err) {
        console.warn('[extra-events] condition failed', evt.id, err);
        return false;
      }
    });

    if (!pool.length) return;

    const recent = Array.isArray(state.flags.recentRandomEvents)
      ? state.flags.recentRandomEvents
      : [];
    const freshPool = pool.filter((evt) => !recent.includes(evt.id));
    if (freshPool.length >= Math.min(6, pool.length)) pool = freshPool;

    const evt = weightedPick(pool);
    state.flags.recentRandomEvents = [evt.id, ...recent.filter((id) => id !== evt.id)].slice(0, 5);

    const text = typeof evt.text === 'function' ? evt.text() : evt.text;
    const title = evt.title || (evt.type === 'choice' ? '随机抉择' : '月度事件');

    if (evt.type === 'choice') {
      const buttons = evt.choices.map((choice) => ({
        text: choice.text,
        class: choice.class || 'btn-outline',
        cb: () => {
          choice.cb(logic);
          ui.closeModal();
          ui.render();
        },
      }));
      ui.showModal(title, text, buttons);
    } else {
      ui.showModal(title, text, [{
        text: '确定',
        class: 'btn-primary',
        cb: () => {
          evt.effect(logic);
          ui.closeModal();
          ui.render();
        },
      }]);
    }
  };

  console.info(`[extra-events] Loaded ${extraEvents.length} new career events. Total pool: ${RANDOM_EVENTS.length}.`);
})();

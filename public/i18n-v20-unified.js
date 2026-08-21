(() => {
  if (!window.ui) {
    console.warn('[i18n-v20-unified] UI is not ready.');
    return;
  }

  const VERSION = '2.20';
  const STORAGE_KEY = 'cs-career:language:v20';
  const ATTRS = ['title', 'aria-label', 'placeholder', 'data-tip'];
  const HAN = /[\u3400-\u9fff]/;
  const LEGACY_FILES = ['./i18n-v20.js', './i18n-v20-supplement.js', './i18n-v20-coverage.js'];

  let language = localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
  let observer = null;
  let applying = false;
  let dictionariesReady = false;

  const exact = new Map(Object.entries({
    '准备中...': 'Loading...',
    '等待开始': 'Waiting to start',
    '个人属性': 'Player Stats',
    '请先选择出身': 'Choose a background first',
    '当前 Buff': 'Active Buffs',
    '战绩中心': 'Results Center',
    '操作': 'Actions',
    '游戏日志': 'Game Log',
    '游戏初始化...': 'Initializing game...',
    '赛事工作站': 'Tournament Desk',
    '商店': 'Shop',
    '荣誉': 'Honors',
    '战队': 'Team',
    '保存': 'Save',
    '设置': 'Settings',
    '关闭': 'Close',
    '确认': 'Confirm',
    '确定': 'Confirm',
    '取消': 'Cancel',
    '继续': 'Continue',
    '返回': 'Back',
    '接受': 'Accept',
    '拒绝': 'Decline',
    '新游戏': 'New Game',
    '载入存档': 'Load Save',
    '成就': 'Achievements',
    '现役战队': 'Active Teams',
    '动态排名': 'Dynamic Ranking',
    'Major 生涯': 'Major Career',
    '战队中心': 'Team Hub',
    '转会市场': 'Transfer Market',
    '转会窗口': 'Transfer Window',
    '自由球员市场': 'Free Agent Market',
    '退役总结': 'Retirement Summary',
    '宣布退役': 'Retire',
    '职业积分': 'Career Points',
    '总击杀': 'Total Kills',
    '总奖金': 'Total Prize',
    'S级冠军': 'S-Tier Titles',
    'Major冠军': 'Major Titles',
    '赛事': 'Event',
    '级别': 'Tier',
    '积分': 'Points',
    '奖金': 'Prize',
    '结果': 'Result',
    '心态': 'Mental',
    '枪法': 'Aim',
    '战术': 'Tactics',
    '教练认可': 'Coach Trust',
    '金币': 'Money',
    '替补': 'Reserve',
    '轮换': 'Rotation',
    '首发': 'Starter',
    '队内核心': 'Team Core'
  }));

  const extraFragments = [
    ['本月正式赛事尚未完成', 'Official event still pending this month'],
    ['进入自由市场', 'Enter Free Agency'],
    ['查看转会报价', 'View Transfer Offers'],
    ['世界排名积分', 'World Ranking Points'],
    ['队伍平均 OVR', 'Team Avg. OVR'],
    ['队友平均 OVR', 'Teammate Avg. OVR'],
    ['首发竞争值', 'Starting Competition'],
    ['近期训练状态', 'Recent Form'],
    ['队内化学反应', 'Team Chemistry'],
    ['合同剩余（月）', 'Contract Months Left'],
    ['市场身价', 'Market Value'],
    ['当前战队', 'Current Team'],
    ['世界排名', 'World Ranking'],
    ['年度排名', 'Year-end Ranking'],
    ['年度评分', 'Annual Rating'],
    ['职业生涯', 'Career'],
    ['正式赛事', 'Official Event'],
    ['公开预选赛', 'Open Qualifier'],
    ['公开预选', 'Open Qualifier'],
    ['封闭预选', 'Closed Qualifier'],
    ['预选赛', 'Qualifier'],
    ['小组赛', 'Group Stage'],
    ['淘汰赛', 'Playoffs'],
    ['四分之一决赛', 'Quarterfinal'],
    ['半决赛', 'Semifinal'],
    ['首轮出局', 'First Round Exit'],
    ['小组出局', 'Group Stage Exit'],
    ['未获得资格', 'Not Qualified'],
    ['未获资格', 'Not Qualified'],
    ['未进入首发', 'Not in Starting Lineup'],
    ['未参赛', 'Did Not Play'],
    ['晋级概率', 'Qualification Chance'],
    ['转会报价', 'Transfer Offer'],
    ['续约报价', 'Renewal Offer'],
    ['自由球员', 'Free Agent'],
    ['签字费', 'Signing Bonus'],
    ['月薪', 'Monthly Salary'],
    ['合同剩余', 'Contract Left'],
    ['首发竞争', 'Starting Competition'],
    ['训练赛表现', 'Scrim Performance'],
    ['比赛表现', 'Match Performance'],
    ['赛事战术分', 'Event Tactics'],
    ['赛事训练分', 'Event Practice'],
    ['赛事实战分', 'Event Match Practice'],
    ['当前关系', 'Current Relationship'],
    ['化学反应', 'Chemistry'],
    ['互动', 'Interact'],
    ['续约', 'Renew'],
    ['签约', 'Sign'],
    ['合同', 'Contract'],
    ['工资', 'Salary'],
    ['冠军', 'Champion'],
    ['亚军', 'Runner-up'],
    ['四强', 'Top 4'],
    ['八强', 'Top 8'],
    ['十六强', 'Top 16'],
    ['16强', 'Top 16'],
    ['晋级', 'Qualified'],
    ['出局', 'Eliminated'],
    ['训练赛', 'Scrim'],
    ['天梯', 'Ladder'],
    ['比赛', 'Match'],
    ['教练', 'Coach'],
    ['队友', 'Teammate'],
    ['选手', 'Player'],
    ['成就', 'Achievement'],
    ['已解锁', 'Unlocked'],
    ['未解锁', 'Locked'],
    ['手动存档', 'Manual Save'],
    ['自动存档', 'Autosave'],
    ['删除存档', 'Delete Save'],
    ['覆盖存档', 'Overwrite Save'],
    ['商店', 'Shop'],
    ['荣誉', 'Honors'],
    ['购买', 'Buy'],
    ['价格', 'Price'],
    ['效果', 'Effect'],
    ['拥有', 'Owned'],
    ['已购买', 'Purchased'],
    ['不足', 'Insufficient'],
    ['当前', 'Current'],
    ['最终', 'Final'],
    ['总计', 'Total'],
    ['本月', 'This Month'],
    ['本年', 'This Year'],
    ['赛季', 'Season'],
    ['机会', 'Chance'],
    ['概率', 'Chance'],
    ['名次', 'Placement'],
    ['排名点数', 'Ranking Points'],
    ['排名分', 'Ranking Points'],
    ['增加', 'Increased'],
    ['下降', 'Decreased'],
    ['提升', 'Improved'],
    ['降低', 'Reduced'],
    ['获得', 'Gained'],
    ['失去', 'Lost'],
    ['解锁', 'Unlocked'],
    ['完成', 'Completed'],
    ['失败', 'Failed'],
    ['成功', 'Success'],
    ['暂无', 'None'],
    ['等待', 'Waiting'],
    ['准备中', 'Loading']
  ];

  let fragments = extraFragments.slice();

  const sourceText = new WeakMap();
  const renderedText = new WeakMap();
  const sourceAttrs = new WeakMap();
  const renderedAttrs = new WeakMap();
  const trackedText = new Set();
  const trackedElements = new Set();

  function skipNode(node) {
    const parent = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return !!parent?.closest?.('#btn-language-v20, script, style, noscript, template');
  }

  function extractLiteral(source, marker, openChar, closeChar) {
    const markerIndex = source.indexOf(marker);
    if (markerIndex < 0) return null;
    const start = source.indexOf(openChar, markerIndex + marker.length);
    if (start < 0) return null;
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let i = start; i < source.length; i += 1) {
      const ch = source[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === openChar) depth += 1;
      else if (ch === closeChar) {
        depth -= 1;
        if (depth === 0) return source.slice(start, i + 1);
      }
    }
    return null;
  }

  function evaluateLiteral(literal) {
    if (!literal) return null;
    try {
      return Function(`"use strict"; return (${literal});`)();
    } catch (error) {
      console.warn('[i18n-v20-unified] Could not parse legacy dictionary.', error);
      return null;
    }
  }

  async function fetchText(path) {
    const response = await fetch(new URL(path, document.baseURI), { cache: 'force-cache' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.text();
  }

  async function loadLegacyDictionaries() {
    try {
      const [baseSource, supplementSource, coverageSource] = await Promise.all(LEGACY_FILES.map(fetchText));

      const baseObject = evaluateLiteral(extractLiteral(baseSource, 'const ZH_EN =', '{', '}')) || {};
      const supplementObject = evaluateLiteral(extractLiteral(supplementSource, 'const ZH_EN =', '{', '}')) || {};
      const coverageObject = evaluateLiteral(extractLiteral(coverageSource, 'const EXACT = new Map(Object.entries(', '{', '}')) || {};
      const coverageFragments = evaluateLiteral(extractLiteral(coverageSource, 'const FRAGMENTS =', '[', ']')) || [];

      [baseObject, supplementObject, coverageObject].forEach((dictionary) => {
        Object.entries(dictionary).forEach(([zh, en]) => exact.set(zh, en));
      });

      fragments = [...coverageFragments, ...extraFragments]
        .filter((pair) => Array.isArray(pair) && pair.length >= 2 && pair[0])
        .sort((a, b) => String(b[0]).length - String(a[0]).length);
      dictionariesReady = true;
    } catch (error) {
      dictionariesReady = false;
      fragments = extraFragments.slice().sort((a, b) => b[0].length - a[0].length);
      console.warn('[i18n-v20-unified] Legacy dictionary load failed; using built-in fallback.', error);
    }
  }

  function translateDynamic(text) {
    let out = text;
    const rules = [
      [/职业积分\s*[:：]\s*(-?\d+(?:\.\d+)?)/g, 'Career Points: $1'],
      [/第\s*(\d+)\s*年\s*第?\s*(\d+)\s*月/g, 'Year $1 · Month $2'],
      [/第\s*(\d+)\s*年/g, 'Year $1'],
      [/第\s*(\d+)\s*月/g, 'Month $1'],
      [/合同剩余\s*(\d+)\s*个月/g, 'Contract: $1 months left'],
      [/剩余\s*(\d+)\s*个月/g, '$1 months left'],
      [/查看\s*(\d+)\s*份转会报价/g, 'View $1 transfer offers'],
      [/世界排名\s*#?\s*(\d+)/g, 'World Rank #$1'],
      [/世界\s*#\s*(\d+)/g, 'World #$1'],
      [/排名\s*#?\s*(\d+)/g, 'Rank #$1'],
      [/第\s*(\d+)\s*名/g, '#$1'],
      [/关系\s*[:：]?\s*(\d+)/g, 'Relationship: $1'],
      [/和\s+(.+?)\s+互动/g, 'Interact with $1'],
      [/(.+?)\s+希望和你续约。?/g, '$1 wants to renew your contract.'],
      [/队伍平均\s*OVR\s*(\d+)/g, 'Team Avg. OVR $1'],
      [/签字费\s*(\d+)\s*·\s*(\d+)\s*个月/g, 'Signing Bonus $1 · $2 months'],
      [/(\d+)\s*金币/g, '$1 Money'],
      [/(\d+)\s*个月/g, '$1 months'],
      [/(\d+)\s*份报价/g, '$1 offers'],
      [/(\d+)\s*次/g, '$1 times'],
      [/已解锁\s*(\d+)\s*\/\s*(\d+)/g, 'Unlocked $1 / $2'],
      [/手动存档\s*(\d+)/g, 'Manual Save $1'],
      [/存档\s*(\d+)\s*已保存/g, 'Save $1 saved'],
      [/存档\s*(\d+)/g, 'Save $1'],
      [/你在第(\d+)年(\d+)月主动宣布结束职业生涯。/g, 'You voluntarily ended your career in Year $1, Month $2.'],
      [/第(\d+)年结束：达到10年职业生涯上限，正式退役。/g, 'End of Year $1: the 10-year career limit was reached. You retire.'],
      [/第(\d+)年(\d+)月：你主动宣布退役。/g, 'Year $1, Month $2: you announced your retirement.']
    ];
    rules.forEach(([pattern, replacement]) => { out = out.replace(pattern, replacement); });
    return out;
  }

  function translateZhToEn(value) {
    const text = String(value ?? '');
    if (!text.trim() || !HAN.test(text)) return text;

    const trimmed = text.trim();
    if (exact.has(trimmed)) {
      const lead = text.match(/^\s*/)?.[0] || '';
      const trail = text.match(/\s*$/)?.[0] || '';
      return `${lead}${exact.get(trimmed)}${trail}`;
    }

    let out = translateDynamic(text);
    if (exact.has(out.trim())) {
      const lead = out.match(/^\s*/)?.[0] || '';
      const trail = out.match(/\s*$/)?.[0] || '';
      return `${lead}${exact.get(out.trim())}${trail}`;
    }

    fragments.forEach(([zh, en]) => {
      if (out.includes(zh)) out = out.split(zh).join(en);
    });

    return out
      .replace(/，/g, ', ')
      .replace(/。/g, '. ')
      .replace(/；/g, '; ')
      .replace(/：/g, ': ')
      .replace(/（/g, ' (')
      .replace(/）/g, ') ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1');
  }

  function translate(value, target = language) {
    return target === 'en' ? translateZhToEn(value) : String(value ?? '');
  }

  function rememberText(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || skipNode(node)) return;
    const current = node.nodeValue || '';
    const expected = renderedText.get(node);
    const source = sourceText.get(node);
    if (source === undefined || (expected !== undefined && current !== expected) || (expected === undefined && current !== source)) {
      sourceText.set(node, current);
    }
    trackedText.add(node);
  }

  function applyText(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || skipNode(node)) return;
    rememberText(node);
    const source = sourceText.get(node) || '';
    const next = language === 'en' ? translateZhToEn(source) : source;
    renderedText.set(node, next);
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function rememberElement(el) {
    if (!(el instanceof Element) || skipNode(el)) return;
    let source = sourceAttrs.get(el);
    let rendered = renderedAttrs.get(el);
    if (!source) source = {};
    if (!rendered) rendered = {};

    let hasTracked = false;
    ATTRS.forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      const current = el.getAttribute(attr) || '';
      if (!(attr in source) || ((attr in rendered) && current !== rendered[attr])) source[attr] = current;
      hasTracked = true;
    });
    if (hasTracked) {
      sourceAttrs.set(el, source);
      renderedAttrs.set(el, rendered);
      trackedElements.add(el);
    }
  }

  function applyElement(el) {
    if (!(el instanceof Element) || skipNode(el)) return;
    rememberElement(el);
    const source = sourceAttrs.get(el);
    if (!source) return;
    const rendered = renderedAttrs.get(el) || {};
    Object.entries(source).forEach(([attr, raw]) => {
      const next = language === 'en' ? translateZhToEn(raw) : raw;
      rendered[attr] = next;
      if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
    });
    renderedAttrs.set(el, rendered);
  }

  function scanSubtree(root) {
    if (!root || skipNode(root)) return;
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        applyText(root);
        return;
      }
      if (root.nodeType === Node.ELEMENT_NODE) applyElement(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE) applyText(node);
        else applyElement(node);
      }
    } finally {
      applying = false;
    }
  }

  function applyTracked() {
    applying = true;
    try {
      trackedText.forEach((node) => {
        if (!node.isConnected) {
          trackedText.delete(node);
          return;
        }
        applyText(node);
      });
      trackedElements.forEach((el) => {
        if (!el.isConnected) {
          trackedElements.delete(el);
          return;
        }
        applyElement(el);
      });
    } finally {
      applying = false;
    }
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
      });
      document.body.appendChild(button);
    }
    button.querySelectorAll('[data-lang]').forEach((el) => el.classList.toggle('active', el.dataset.lang === language));
    button.title = language === 'zh' ? 'Switch to English' : '切换到中文';
  }

  function setLanguage(next) {
    if (next !== 'zh' && next !== 'en') return;
    if (next === language) return;
    language = next;
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    ensureSwitcher();

    const start = performance.now();
    applyTracked();
    const elapsed = Math.round((performance.now() - start) * 10) / 10;
    window.dispatchEvent(new CustomEvent('cs-language-change', { detail: { language, elapsed } }));
  }

  function installStyle() {
    if (document.getElementById('i18n-v20-style')) return;
    const style = document.createElement('style');
    style.id = 'i18n-v20-style';
    style.textContent = `
      #btn-language-v20{position:fixed;top:14px;right:116px;z-index:7150;display:flex;align-items:center;gap:5px;padding:8px 10px;background:rgba(255,255,255,.97);box-shadow:0 5px 18px rgba(15,23,42,.14);border:1px solid #cbd5e1;border-radius:9px;color:#64748b;font-weight:800;cursor:pointer;line-height:1}
      #btn-language-v20 span{opacity:.48;transition:opacity .15s,color .15s}#btn-language-v20 span.active{opacity:1;color:#2563eb}#btn-language-v20 b{font-weight:500;color:#cbd5e1}
      @media(max-width:650px){#btn-language-v20{right:58px;padding:9px 9px;top:14px}}
    `;
    document.head.appendChild(style);
  }

  function installObserver() {
    observer = new MutationObserver((mutations) => {
      if (applying) return;
      applying = true;
      try {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData') {
            applyText(mutation.target);
          } else if (mutation.type === 'attributes') {
            applyElement(mutation.target);
          } else if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => scanSubtree(node));
          }
        }
      } finally {
        applying = false;
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  }

  window.csI18nV20 = {
    version: VERSION,
    get language() { return language; },
    get dictionariesReady() { return dictionariesReady; },
    setLanguage,
    t: translate,
    translateRoot: scanSubtree,
    refresh: applyTracked
  };

  installStyle();
  ensureSwitcher();
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';

  loadLegacyDictionaries().finally(() => {
    scanSubtree(document.body);
    installObserver();
    console.info(`[i18n-v20-unified] Loaded (${language}); legacy dictionaries: ${dictionariesReady ? 'yes' : 'fallback'}.`);
  });
})();
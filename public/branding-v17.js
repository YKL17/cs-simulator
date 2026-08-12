(() => {
  if (!window.ui || !window.metaSystem) {
    console.warn('[branding-v17] Required systems are not ready.');
    return;
  }

  const GAME_VERSION = '2.17';
  const GAME_NAME = 'CS Career Simulator';
  const GITHUB_URL = 'https://github.com/YKL17/cs-simulator';
  const PAGES_URL = 'https://ykl17.github.io/cs-simulator/';

  const replaceBranding = (value) => String(value ?? '')
    .replace(/CSGO/g, 'CS')
    .replace(/Counter-Strike 2/g, 'CS')
    .replace(/CS2 CAREER SIMULATION/g, 'CS CAREER SIMULATION')
    .replace(/YKL17\/csgo1/g, 'YKL17/cs-simulator')
    .replace(/ykl17\.github\.io\/csgo1\//g, 'ykl17.github.io/cs-simulator/');

  document.title = `${GAME_NAME} v${GAME_VERSION}`;

  function patchHome() {
    const home = document.getElementById('career-home');
    if (!home) return;

    const kicker = home.querySelector('.home-kicker');
    if (kicker) kicker.textContent = 'CS CAREER SIMULATION';

    const title = home.querySelector('h1');
    if (title) title.innerHTML = 'CS<br><span>Career Simulator</span>';

    let version = home.querySelector('.home-version-v17');
    if (!version) {
      version = document.createElement('div');
      version.className = 'home-version-v17';
      version.textContent = `Version ${GAME_VERSION}`;
      const subtitle = home.querySelector('.home-subtitle');
      if (subtitle?.parentElement) subtitle.parentElement.insertBefore(version, subtitle);
    } else {
      version.textContent = `Version ${GAME_VERSION}`;
    }

    const github = home.querySelector('.github-star-cta');
    if (github) github.href = GITHUB_URL;

    const footer = home.querySelector('.home-footer');
    if (footer) footer.textContent = `CS Career Simulator v${GAME_VERSION} · Open-source browser career simulator · Save data stays in your browser`;
  }

  function patchVisibleBranding(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const next = replaceBranding(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });

    root.querySelectorAll?.('a[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (/YKL17\/csgo1|ykl17\.github\.io\/csgo1\//.test(href)) {
        link.setAttribute('href', replaceBranding(href));
      }
    });
  }

  if (!document.getElementById('branding-v17-style')) {
    const style = document.createElement('style');
    style.id = 'branding-v17-style';
    style.textContent = `
      .home-version-v17 {
        display:inline-flex;
        align-items:center;
        width:max-content;
        margin:2px 0 12px;
        padding:4px 9px;
        border-radius:999px;
        border:1px solid #cbd5e1;
        background:#f8fafc;
        color:#475569;
        font-size:.72rem;
        font-weight:800;
        letter-spacing:.04em;
      }
    `;
    document.head.appendChild(style);
  }

  const previousShowHome = metaSystem.showHome?.bind(metaSystem);
  if (previousShowHome) {
    metaSystem.showHome = (...args) => {
      const out = previousShowHome(...args);
      patchHome();
      patchVisibleBranding(document.getElementById('career-home'));
      return out;
    };
  }

  const previousShowModal = ui.showModal.bind(ui);
  ui.showModal = (title, html, buttons = []) => previousShowModal(
    replaceBranding(title),
    replaceBranding(html),
    buttons,
  );

  const previousRender = ui.render.bind(ui);
  ui.render = () => {
    const out = previousRender();
    patchVisibleBranding(document.getElementById('game-container'));
    patchHome();
    return out;
  };

  patchHome();
  patchVisibleBranding();

  window.csSimulatorBrand = {
    version: GAME_VERSION,
    name: GAME_NAME,
    github: GITHUB_URL,
    pages: PAGES_URL,
    patchHome,
  };

  console.info(`[branding-v17] ${GAME_NAME} v${GAME_VERSION} branding loaded.`);
})();

(() => {
  const STYLE_ID = 'ui-layout-v20-fix-style';
  const GROUP_CLASS = 'stats-action-grid-v20';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .area-stats { min-width: 0; }
      .area-stats .${GROUP_CLASS} {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        align-items: stretch !important;
      }
      .area-stats .${GROUP_CLASS} > .btn,
      .area-stats .${GROUP_CLASS} > button,
      .area-stats .${GROUP_CLASS} > a {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 38px;
        padding: 7px 8px !important;
        white-space: normal !important;
        overflow-wrap: anywhere;
        line-height: 1.15 !important;
        text-align: center;
      }
      .area-stats .${GROUP_CLASS} > .btn i,
      .area-stats .${GROUP_CLASS} > button i,
      .area-stats .${GROUP_CLASS} > a i {
        flex: 0 0 auto;
      }
      .area-stats .btn {
        max-width: 100%;
      }
      @media (max-width: 420px) {
        .area-stats .${GROUP_CLASS} {
          grid-template-columns: minmax(0, 1fr) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeActionGroups(root = document) {
    const stats = root.querySelector?.('.area-stats') || document.querySelector('.area-stats');
    if (!stats) return;

    const candidates = new Set();
    stats.querySelectorAll('button, a.btn').forEach((control) => {
      const parent = control.parentElement;
      if (!parent || parent === stats) return;
      const directControls = Array.from(parent.children).filter((el) =>
        el.matches?.('button, a.btn, .btn')
      );
      if (directControls.length >= 2) candidates.add(parent);
    });

    candidates.forEach((group) => group.classList.add(GROUP_CLASS));
  }

  injectStyle();
  normalizeActionGroups();

  const observer = new MutationObserver(() => normalizeActionGroups());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();

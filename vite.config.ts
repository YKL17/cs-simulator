import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      {
        name: 'desktop-layout-and-career-systems',
        transformIndexHtml() {
          return [
            {
              tag: 'style',
              injectTo: 'head',
              children: `
                .area-actions { min-height: 0; }
                .area-actions .action-grid {
                  flex: 1;
                  height: auto;
                  min-height: 0;
                  grid-template-rows: repeat(2, minmax(0, 1fr));
                }
                .area-actions .action-btn { min-height: 0; }
                @media (min-width: 1201px) and (max-height: 750px) {
                  #game-container {
                    height: calc(100dvh - 24px);
                    grid-template-rows: 52px minmax(0, 1fr) 176px;
                    gap: 12px;
                  }
                  .area-actions .action-grid { gap: 8px; padding: 10px 12px; }
                  .area-actions .action-btn { gap: 4px; font-size: 0.85rem; }
                  .area-actions .action-btn i { font-size: 1.2rem; margin-bottom: 0; }
                }
              `,
            },
            { tag: 'script', attrs: { src: './events-extra.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './team-system.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './team-cap-32.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './tournament-world.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './balance-ui-fix.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './career-flow-v2.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './ranking-score-v2.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './career-balance-v3.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './shop-modal-fix.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './ranking-dedup-fix.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './event-system-v4.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './competition-calibration-v6.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './major-month-fix-v7.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './team-chemistry-prep-v8.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './meta-system.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './prep-name-fix-v9.js' }, injectTo: 'body' },
            { tag: 'script', attrs: { src: './annual-rating-v10.js' }, injectTo: 'body' },
          ];
        },
      },
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

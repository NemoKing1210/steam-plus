import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json' with { type: 'json' };

const RAW_BASE =
  'https://raw.githubusercontent.com/NemoKing1210/steam-plus/main';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2, pure_getters: true },
      mangle: true,
      format: { comments: false },
    },
    cssMinify: true,
    target: 'es2018',
    reportCompressedSize: true,
  },
  esbuild: {
    legalComments: 'none',
  },
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: {
          '': 'Steam Plus',
          ru: 'Steam Plus',
          'zh-CN': 'Steam Plus',
          es: 'Steam Plus',
          'pt-BR': 'Steam Plus',
          de: 'Steam Plus',
          fr: 'Steam Plus',
          ja: 'Steam Plus',
          ko: 'Steam Plus',
          pl: 'Steam Plus',
        },
        namespace: 'https://github.com/NemoKing1210/steam-plus',
        version: pkg.version,
        description: {
          '': 'Improves Steam functionality',
          ru: 'Улучшает функционал Steam',
          'zh-CN': '改善 Steam 的功能',
          es: 'Mejora la funcionalidad de Steam',
          'pt-BR': 'Melhora a funcionalidade do Steam',
          de: 'Verbessert die Funktionalität von Steam',
          fr: 'Améliore les fonctionnalités de Steam',
          ja: 'Steam の機能を改善',
          ko: 'Steam 기능 개선',
          pl: 'Poprawia funkcjonalność Steam',
        },
        author: 'NemoKing1210',
        tag: ['steam', 'translation'],
        homepageURL: 'https://github.com/NemoKing1210/steam-plus',
        supportURL: 'https://github.com/NemoKing1210/steam-plus/issues',
        updateURL: `${RAW_BASE}/steam-plus.user.js`,
        downloadURL: `${RAW_BASE}/steam-plus.user.js`,
        license: 'MIT',
        icon: 'https://store.steampowered.com/favicon.ico',
        match: [
          'https://store.steampowered.com/*',
          'https://steamcommunity.com/*',
        ],
        connect: ['translate.googleapis.com', 'open.er-api.com', 'cdn.jsdelivr.net'],
        'run-at': 'document-idle',
        noframes: true,
      },
      server: {
        prefix: 'dev:',
      },
      build: {
        fileName: 'steam-plus.user.js',
        metaFileName: true,
      },
    }),
  ],
});

import { defineConfig } from 'vite';

export default defineConfig({
  // .env lives at the repo root; only VITE_* values reach the browser.
  envDir: '../../',
  server: {
    port: 5180,
    strictPort: true,
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: { target: 'es2022', sourcemap: true },
  test: { environment: 'jsdom', include: ['test/**/*.test.js'] },
});

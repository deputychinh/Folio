import { defineConfig, devices } from '@playwright/test';

const WEB_URL = 'http://localhost:5180';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    ...devices['Desktop Chrome'],
    channel: process.env.CI ? undefined : 'chrome',
  },
  webServer: [
    { command: 'node --env-file=../../.env dist/main.js', cwd: 'apps/api', url: 'http://localhost:3001/api/v1/health', reuseExistingServer: true },
    { command: 'npx vite', cwd: 'apps/web', url: WEB_URL, reuseExistingServer: true },
  ],
});

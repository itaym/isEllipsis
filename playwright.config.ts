import { defineConfig, devices } from '@playwright/test';

// Real-browser tests. Two suites:
//  - e2e/isellipsis.spec.ts  drives the built isellipsis bundle via setContent,
//                       checked against a screenshot-diff oracle.
//  - e2e/react.spec.ts  drives the playground app (served below) to verify the
//                       reactive useIsEllipsis hook.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run playground:preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

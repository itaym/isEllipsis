import { defineConfig, devices } from '@playwright/test';

// Real-browser tests for isEllipsis. jsdom does no layout, so the unit tests in
// src/__tests__ can only check the "protocol" (types / error handling). These
// tests run in headless Chromium where scrollWidth / clientWidth are real.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

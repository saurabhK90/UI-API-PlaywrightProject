import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// Auth state files written by globalSetup — one per user role
export const AUTH_STATE_PATH = path.join('auth-state', 'standard-user.json');
export const PROBLEM_USER_AUTH_STATE_PATH = path.join('auth-state', 'problem-user.json');

export default defineConfig({
  testDir: './tests',

  // Single worker — appropriate for a demo website to avoid session conflicts
  workers: 1,
  fullyParallel: false,

  // Retry flaky tests in CI; run clean locally
  retries: process.env.CI ? 2 : 0,

  // Fail fast in CI after 10 consecutive failures to save runner minutes
  maxFailures: process.env.CI ? 10 : undefined,

  reporter: [
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // globalSetup runs once before any worker starts and creates the auth state file
  globalSetup: './src/fixtures/globalSetup.ts',

  projects: [
    // UI tests on Chrome — uses the storage state saved by globalSetup
    {
      name: 'ui-chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
      },
      testMatch: 'tests/ui/**/*.spec.ts',
    },

    // All API tests — tier selection (smoke/regression/e2e) is controlled via npm scripts
    {
      name: 'api',
      use: {
        baseURL: process.env.API_BASE_URL ?? process.env.BASE_URL,
      },
      testMatch: 'tests/api/**/*.spec.ts',
    },

    // Integration tests combining UI + API assertions
    {
      name: 'integration',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
      },
      testMatch: 'tests/integration/**/*.spec.ts',
    },
  ],

  // Allure and other generated output that should not be tracked
  outputDir: 'test-results',
});

import { chromium as playwrightChromium } from 'playwright-core'; // raw chromium — not affected by --headed CLI flag
import { FullConfig, request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Logger } from '@utils/Logger';

dotenv.config();

const log = Logger.getInstance();
const AUTH_STATE_DIR = path.resolve('auth-state');
const AUTH_STATE_PATH = path.join(AUTH_STATE_DIR, 'standard-user.json');
const ALLURE_RESULTS_DIR = path.resolve('allure-results');

/**
 * Runs once before any worker starts.
 * Performs login once and saves storage state (cookies + localStorage) to disk.
 * Workers load this file rather than performing UI login — no login overhead per test.
 * To force re-authentication, delete auth-state/standard-user.json before running.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
  cleanAllureResults();

  // Reuse existing auth state only if cookies have not expired.
  // Delete auth-state/standard-user.json to force a fresh login.
  if (fs.existsSync(AUTH_STATE_PATH)) {
    const saved = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8')) as {
      cookies?: { expires?: number }[];
    };
    const nowSec = Date.now() / 1000;
    const hasExpired = saved.cookies?.some(c => typeof c.expires === 'number' && c.expires > 0 && c.expires < nowSec);
    if (!hasExpired) {
      log.info('Auth state exists and cookies are valid — skipping login');
      return;
    }
    log.warn('Auth state exists but session cookies have expired — re-authenticating');
    fs.unlinkSync(AUTH_STATE_PATH);
  }

  log.info('Global setup: creating auth state for standard user');

  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  const baseURL = process.env.BASE_URL;

  if (!username || !password || !baseURL) {
    throw new Error(
      'Global setup failed: TEST_USERNAME, TEST_PASSWORD, and BASE_URL must be set in .env'
    );
  }

  // Attempt API-based login first (faster — no browser overhead)
  const apiBaseURL = process.env.API_BASE_URL ?? baseURL;
  const authState = await attemptAPILogin(apiBaseURL, username, password);

  if (authState) {
    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(authState, null, 2));
    log.info(`Auth state saved via API login → ${AUTH_STATE_PATH}`);
    return;
  }

  // Fallback: browser-based login (use when there's no direct API login endpoint)
  log.info('API login not available — falling back to browser-based login');
  await browserLogin(baseURL, username, password);
}

function cleanAllureResults(): void {
  if (!fs.existsSync(ALLURE_RESULTS_DIR)) return;
  let removed = 0;
  for (const file of fs.readdirSync(ALLURE_RESULTS_DIR)) {
    if (file.endsWith('-result.json') || file.endsWith('-container.json')) {
      fs.unlinkSync(path.join(ALLURE_RESULTS_DIR, file));
      removed++;
    }
  }
  if (removed > 0) log.info(`Allure results cleaned — removed ${removed} stale file(s)`);
}

async function attemptAPILogin(
  apiBaseURL: string,
  username: string,
  password: string
): Promise<object | null> {
  try {
    const apiContext = await request.newContext({ baseURL: apiBaseURL });

    const response = await apiContext.post('/api/login', {
      data: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok()) {
      log.warn(`API login returned ${response.status()} — will try browser login`);
      await apiContext.dispose();
      return null;
    }

    // Capture the full storage state from the API context (includes cookies set by the API)
    const state = await apiContext.storageState();
    await apiContext.dispose();
    return state;
  } catch (err) {
    log.warn('API login attempt failed', { error: String(err) });
    return null;
  }
}

async function browserLogin(baseURL: string, username: string, password: string): Promise<void> {
  const browser = await playwrightChromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto('/');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait until the inventory page loads (confirms successful login)
    await page.waitForURL(/\/inventory\.html/, { timeout: 30_000 });

    await context.storageState({ path: AUTH_STATE_PATH });
    log.info(`Auth state saved via browser login → ${AUTH_STATE_PATH}`);
  } finally {
    await browser.close();
  }
}

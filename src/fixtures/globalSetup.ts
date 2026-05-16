import { chromium as playwrightChromium } from 'playwright-core'; // raw chromium — not affected by --headed CLI flag
import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Logger } from '@utils/Logger';
import users from '@resources/testdata/users.json';

dotenv.config();

const log = Logger.getInstance();
const AUTH_STATE_DIR = path.resolve('auth-state');
const STANDARD_USER_AUTH_STATE_PATH = path.join(AUTH_STATE_DIR, 'standard-user.json');
const PROBLEM_USER_AUTH_STATE_PATH = path.join(AUTH_STATE_DIR, 'problem-user.json');
const ALLURE_RESULTS_DIR = path.resolve('allure-results');

/**
 * Runs once before any worker starts.
 * Saves a storage state file per user role (cookies + localStorage) so tests
 * load a pre-authenticated context instead of performing UI login each time.
 * To force re-authentication for a user, delete their file under auth-state/.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
  cleanAllureResults();

  const password = process.env.TEST_PASSWORD;
  const baseURL = process.env.BASE_URL;

  if (!password || !baseURL) {
    throw new Error('Global setup failed: TEST_PASSWORD and BASE_URL must be set in .env');
  }

  await ensureAuthState(users.standardUser.username, password, baseURL, STANDARD_USER_AUTH_STATE_PATH);
  await ensureAuthState(users.problemUser.username, password, baseURL, PROBLEM_USER_AUTH_STATE_PATH);
}

async function ensureAuthState(
  username: string,
  password: string,
  baseURL: string,
  statePath: string
): Promise<void> {
  if (fs.existsSync(statePath)) {
    const saved = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as {
      cookies?: { expires?: number }[];
    };
    const nowSec = Date.now() / 1000;
    const hasExpired = saved.cookies?.some(
      c => typeof c.expires === 'number' && c.expires > 0 && c.expires < nowSec
    );
    if (!hasExpired) {
      log.info(`Auth state valid — skipping login for ${username}`);
      return;
    }
    log.warn(`Auth state cookies expired — re-authenticating ${username}`);
    fs.unlinkSync(statePath);
  }

  log.info(`Global setup: creating auth state for ${username}`);

  const apiBaseURL = process.env.API_BASE_URL ?? baseURL;
  const authState = await attemptAPILogin(apiBaseURL, username, password);

  if (authState) {
    fs.writeFileSync(statePath, JSON.stringify(authState, null, 2));
    log.info(`Auth state saved via API login → ${statePath}`);
    return;
  }

  log.info(`API login not available — falling back to browser-based login for ${username}`);
  await browserLogin(baseURL, username, password, statePath);
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
  const { request } = await import('@playwright/test');
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

    const state = await apiContext.storageState();
    await apiContext.dispose();
    return state;
  } catch (err) {
    log.warn('API login attempt failed', { error: String(err) });
    return null;
  }
}

async function browserLogin(
  baseURL: string,
  username: string,
  password: string,
  statePath: string
): Promise<void> {
  const browser = await playwrightChromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto('/');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL(/\/inventory\.html/, { timeout: 30_000 });

    await context.storageState({ path: statePath });
    log.info(`Auth state saved via browser login → ${statePath}`);
  } finally {
    await browser.close();
  }
}

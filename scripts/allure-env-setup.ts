#!/usr/bin/env tsx
/**
 * Populates allure-results/environment.properties before each run.
 * Allure reads this file to display environment metadata in the report header.
 * Run automatically via "pretest" npm script.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

function main(): void {
  const allureResultsDir = path.resolve('allure-results');
  fs.mkdirSync(allureResultsDir, { recursive: true });

  const baseURL = process.env.BASE_URL ?? 'not-set';
  const playwrightVersion = (() => {
    try {
      const pkg = JSON.parse(fs.readFileSync('node_modules/@playwright/test/package.json', 'utf-8')) as { version: string };
      return pkg.version;
    } catch {
      return 'unknown';
    }
  })();

  const nodeVersion = process.version;
  const environment = process.env.TEST_ENV ?? 'local';

  const properties = [
    `Environment=${environment}`,
    `Browser=Chromium`,
    `Language=TypeScript`,
    `Base.URL=${baseURL}`,
    `Node.Version=${nodeVersion}`,
    `Playwright.Version=${playwrightVersion}`,
    `Run.Timestamp=${new Date().toISOString()}`,
  ].join('\n');

  fs.writeFileSync(path.join(allureResultsDir, 'environment.properties'), properties, 'utf-8');

  // Copy categories.json into allure-results so Allure can bucket failures
  const categoriesSource = path.resolve('config', 'allure', 'categories.json');
  if (fs.existsSync(categoriesSource)) {
    fs.copyFileSync(
      categoriesSource,
      path.join(allureResultsDir, 'categories.json')
    );
  }

  console.log('Allure environment properties written.');
}

try {
  main();
} catch (err) {
  console.warn('allure-env-setup failed (non-fatal):', err);
}

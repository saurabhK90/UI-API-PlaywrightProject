#!/usr/bin/env tsx
/**
 * Patches allure-playwright to report "TypeScript" instead of "JavaScript"
 * for the per-test language label. allure-playwright hardcodes "JavaScript"
 * in its dist — this script corrects it after every npm install.
 * Runs automatically via the "postinstall" npm script.
 */

import * as fs from 'fs';
import * as path from 'path';

const target = path.resolve('node_modules', 'allure-playwright', 'dist', 'index.js');

if (!fs.existsSync(target)) {
  console.warn('patch-allure-language: allure-playwright dist not found — skipping.');
  process.exit(0);
}

const original = fs.readFileSync(target, 'utf-8');
const patched  = original.replace(
  /addLabel\(allure_js_commons_1\.LabelName\.LANGUAGE,\s*"JavaScript"\)/g,
  'addLabel(allure_js_commons_1.LabelName.LANGUAGE, "TypeScript")'
);

if (original === patched) {
  console.log('patch-allure-language: already patched or pattern not found — no change made.');
} else {
  fs.writeFileSync(target, patched, 'utf-8');
  console.log('patch-allure-language: allure-playwright language label set to TypeScript ✓');
}

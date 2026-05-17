#!/usr/bin/env tsx
/**
 * Patches allure-playwright to correctly write *-result.json files when used with
 * Playwright 1.49+.
 *
 * Root cause: allure-playwright 2.x declares onTestEnd as async, returning a Promise.
 * Playwright's Multiplexer calls onTestEnd via synchronous wrap() which ignores the
 * returned Promise, so allureTest.endTest() — the call that writes *-result.json —
 * is never guaranteed to execute.
 *
 * Fix: make onTestEnd synchronous (queues the async work into _pendingTestEnds), then
 * make onEnd async and await all pending work before proceeding. Playwright DOES await
 * onEnd via wrapAsync(), so all result files are written before the run concludes.
 *
 * Runs automatically via the "postinstall" npm script.
 */

import * as fs from 'fs';
import * as path from 'path';

const target = path.resolve('node_modules', 'allure-playwright', 'dist', 'index.js');

if (!fs.existsSync(target)) {
  console.warn('patch-allure-async: allure-playwright dist not found — skipping.');
  process.exit(0);
}

let content = fs.readFileSync(target, 'utf-8');
let changed = false;

// Detect line endings used by the file (CRLF on Windows, LF on Unix)
const EOL = content.includes('\r\n') ? '\r\n' : '\n';
const e = EOL; // shorthand

// ── Patch 1: add _pendingTestEnds array to constructor ────────────────────────
const p1Old = `        this.processedDiffs = [];${e}        this.options = Object.assign`;
const p1New = `        this.processedDiffs = [];${e}        this._pendingTestEnds = [];${e}        this.options = Object.assign`;
if (content.includes(p1Old)) {
  content = content.replace(p1Old, p1New);
  changed = true;
  console.log('patch-allure-async [1/4]: added _pendingTestEnds to constructor ✓');
} else if (content.includes('this._pendingTestEnds')) {
  console.log('patch-allure-async [1/4]: already patched — skipping');
} else {
  console.error('patch-allure-async [1/4]: FAILED — constructor pattern not found');
  process.exit(1);
}

// ── Patch 2: convert async onTestEnd signature to sync + open IIFE ────────────
const p2Old = `    async onTestEnd(test, result) {${e}        const runtime = this.getAllureRuntime();`;
const p2New = `    onTestEnd(test, result) {${e}        const pendingEnd = (async () => {${e}        const runtime = this.getAllureRuntime();`;
if (content.includes(p2Old)) {
  content = content.replace(p2Old, p2New);
  changed = true;
  console.log('patch-allure-async [2/4]: onTestEnd signature changed to sync + IIFE open ✓');
} else if (content.includes('const pendingEnd = (async () => {')) {
  console.log('patch-allure-async [2/4]: already patched — skipping');
} else {
  console.error('patch-allure-async [2/4]: FAILED — onTestEnd signature pattern not found');
  process.exit(1);
}

// ── Patch 3: close IIFE after allureTest.endTest() and push to queue ──────────
const p3Old = `        allureTest.endTest();${e}    }${e}    addSkippedResults()`;
const p3New = `        allureTest.endTest();${e}        })();${e}        this._pendingTestEnds.push(pendingEnd);${e}    }${e}    addSkippedResults()`;
if (content.includes(p3Old)) {
  content = content.replace(p3Old, p3New);
  changed = true;
  console.log('patch-allure-async [3/4]: IIFE closed and queued in _pendingTestEnds ✓');
} else if (content.includes('this._pendingTestEnds.push(pendingEnd)')) {
  console.log('patch-allure-async [3/4]: already patched — skipping');
} else {
  console.error('patch-allure-async [3/4]: FAILED — endTest closing pattern not found');
  process.exit(1);
}

// ── Patch 4: make onEnd async and await all pending work ──────────────────────
const p4Old = `    onEnd() {${e}        var _a, _b, _c;${e}        this.addSkippedResults();`;
const p4New = `    async onEnd() {${e}        var _a, _b, _c;${e}        this.addSkippedResults();${e}        await Promise.all(this._pendingTestEnds);`;
if (content.includes(p4Old)) {
  content = content.replace(p4Old, p4New);
  changed = true;
  console.log('patch-allure-async [4/4]: onEnd made async + awaits _pendingTestEnds ✓');
} else if (content.includes('async onEnd()') && content.includes('await Promise.all(this._pendingTestEnds)')) {
  console.log('patch-allure-async [4/4]: already patched — skipping');
} else {
  console.error('patch-allure-async [4/4]: FAILED — onEnd pattern not found');
  process.exit(1);
}

if (changed) {
  fs.writeFileSync(target, content, 'utf-8');
  console.log('patch-allure-async: allure-playwright patched successfully ✓');
} else {
  console.log('patch-allure-async: no changes needed — already fully patched');
}

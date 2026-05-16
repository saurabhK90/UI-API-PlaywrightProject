/**
 * Single import point for all tests.
 * Every test file imports { test, expect } from here — never from @playwright/test directly.
 *
 * This gives all tests access to both UI and API fixtures without multiple imports.
 */

import { mergeTests, mergeExpects } from '@playwright/test';
import { test as baseTest, expect as baseExpect } from './baseFixtures';
import { test as apiTest, expect as apiExpect } from './apiFixtures';

export const test = mergeTests(baseTest, apiTest);
export const expect = mergeExpects(baseExpect, apiExpect);

export type { UIFixtures } from './baseFixtures';
export type { APIFixtures } from './apiFixtures';

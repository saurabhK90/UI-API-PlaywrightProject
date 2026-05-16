#!/usr/bin/env tsx
/**
 * CLI: npm run analyze-failures
 * Reads allure-results/ and uses Claude to analyse each failed test.
 * Requires ANTHROPIC_API_KEY in .env
 */

import * as dotenv from 'dotenv';
import { FailureAnalyzer } from '../src/ai/anthropic/FailureAnalyzer';

dotenv.config();

async function main(): Promise<void> {
  const analyzer = new FailureAnalyzer();
  const analyses = await analyzer.analyzeAll(process.argv[2] ?? 'allure-results');
  analyzer.printReport(analyses);
}

main().catch(err => {
  console.error('analyze-failures failed:', err);
  process.exit(1);
});

#!/usr/bin/env tsx
/**
 * CLI: npm run generate-tests -- --req path/to/requirements.txt --feature "Guest Checkout"
 * Generates a .generated.spec.ts scaffold using Claude.
 * Requires ANTHROPIC_API_KEY in .env (gracefully skips AI if absent)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { TestGenerator } from '../src/ai/anthropic/TestGenerator';

dotenv.config();

function parseArgs(): { reqPath: string; featureName: string; outputDir: string } {
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] ?? '' : '';
  };

  const reqPath = get('--req');
  const featureName = get('--feature') || 'New Feature';
  const outputDir = get('--output-dir') || 'tests/ui/regression';

  if (!reqPath) {
    console.error('Usage: npm run generate-tests -- --req requirements.txt --feature "Feature Name"');
    process.exit(1);
  }

  return { reqPath, featureName, outputDir };
}

async function main(): Promise<void> {
  const { reqPath, featureName, outputDir } = parseArgs();
  const requirements = fs.readFileSync(path.resolve(reqPath), 'utf-8');

  const slug = featureName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const outputPath = path.join(outputDir, `${slug}.generated.spec.ts`);

  const generator = new TestGenerator();
  await generator.generate({ requirements, featureName, outputPath });

  console.log(`\nNext steps:`);
  console.log(`  1. Review the generated file: ${outputPath}`);
  console.log(`  2. Run /implement-tests ${outputPath} in Claude Code for AI-assisted implementation`);
}

main().catch(err => {
  console.error('generate-tests failed:', err);
  process.exit(1);
});

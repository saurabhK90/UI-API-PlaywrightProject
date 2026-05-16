#!/usr/bin/env tsx
/**
 * CLI: npm run generate-schema -- --endpoint /users/123 --method GET --output UserModel.ts
 *
 * Calls a live API endpoint, inspects the response shape, and generates a Zod schema
 * TypeScript file as a starting point. Engineer reviews and commits the file.
 *
 * Only creates files that don't exist yet — subsequent runs use the committed schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

function parseArgs(): { endpoint: string; method: string; output: string } {
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] ?? '' : '';
  };

  const endpoint = get('--endpoint');
  const method = get('--method') || 'GET';
  const output = get('--output') || 'GeneratedModel.ts';

  if (!endpoint) {
    console.error('Usage: npm run generate-schema -- --endpoint /path --method GET --output ModelName.ts');
    process.exit(1);
  }

  return { endpoint, method: method.toUpperCase(), output };
}

function jsonToZodSchema(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  const innerPad = '  '.repeat(indent + 1);

  if (value === null) return 'z.null()';
  if (typeof value === 'boolean') return 'z.boolean()';
  if (typeof value === 'number') return Number.isInteger(value) ? 'z.number().int()' : 'z.number()';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'z.string().datetime()';
    if (/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) return 'z.string().email()';
    if (/^https?:\/\//.test(value)) return 'z.string().url()';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(value)) return 'z.string().uuid()';
    return 'z.string()';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'z.array(z.unknown())';
    return `z.array(\n${innerPad}${jsonToZodSchema(value[0], indent + 1)}\n${pad})`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return 'z.object({})';
    const fields = entries
      .map(([key, val]) => `${innerPad}${key}: ${jsonToZodSchema(val, indent + 1)}`)
      .join(',\n');
    return `z.object({\n${fields},\n${pad}})`;
  }
  return 'z.unknown()';
}

async function main(): Promise<void> {
  const { endpoint, method, output } = parseArgs();
  const outputPath = path.resolve('src', 'api', 'models', output);

  if (fs.existsSync(outputPath)) {
    console.log(`✓ ${outputPath} already exists — skipping generation. Delete it to regenerate.`);
    return;
  }

  const baseURL = process.env.API_BASE_URL ?? process.env.BASE_URL;
  if (!baseURL) {
    console.error('BASE_URL or API_BASE_URL must be set in .env');
    process.exit(1);
  }

  const url = `${baseURL}${endpoint}`;
  console.log(`Fetching: ${method} ${url}`);

  const response = await fetch(url, { method });
  const body = await response.json();

  const schemaName = output.replace('.ts', '');
  const zodSchema = jsonToZodSchema(body);

  const fileContent = `import { z } from 'zod';

/**
 * Generated from: ${method} ${endpoint}
 * Generated at: ${new Date().toISOString()}
 *
 * TODO: Review this schema and:
 *   1. Mark optional fields with .optional()
 *   2. Add union types where the field can be multiple types
 *   3. Tighten string validators (z.string().email(), .uuid(), etc.)
 *   4. Remove this comment block before committing
 */

export const ${schemaName}Schema = ${zodSchema};

export type ${schemaName} = z.infer<typeof ${schemaName}Schema>;
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`✓ Schema written to: ${outputPath}`);
  console.log('  Review the file, mark optional fields, then commit.');
}

main().catch(err => {
  console.error('generate-schema failed:', err);
  process.exit(1);
});

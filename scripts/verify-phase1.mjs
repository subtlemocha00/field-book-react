#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');

const REQUIRED_PATHS = [
  'package.json',
  'tsconfig.base.json',
  'tsconfig.json',
  'eslint.config.js',
  '.prettierrc',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'apps/web/vite.config.ts',
  'apps/web/index.html',
  'apps/web/src/main.tsx',
  'apps/web/src/App.tsx',
  'apps/api/package.json',
  'apps/api/tsconfig.json',
  'apps/api/wrangler.toml',
  'apps/api/src/index.ts',
  'packages/contracts/package.json',
  'packages/contracts/tsconfig.json',
  'packages/contracts/src/index.ts',
  'packages/domain/package.json',
  'packages/domain/src/index.ts',
  'packages/survey-core/package.json',
  'packages/survey-core/src/index.ts',
  'packages/sync-core/package.json',
  'packages/sync-core/src/index.ts',
  'packages/audit-core/package.json',
  'packages/audit-core/src/index.ts',
];

const PLACEHOLDER_PACKAGES = ['domain', 'survey-core', 'sync-core', 'audit-core'];

const errors = [];

for (const rel of REQUIRED_PATHS) {
  if (!existsSync(join(ROOT, rel))) {
    errors.push(`Missing required file: ${rel}`);
  }
}

for (const pkg of PLACEHOLDER_PACKAGES) {
  const srcDir = join(ROOT, 'packages', pkg, 'src');
  if (!existsSync(srcDir)) continue;
  const files = readdirSync(srcDir).filter((f) => statSync(join(srcDir, f)).isFile());
  if (files.length !== 1 || files[0] !== 'index.ts') {
    errors.push(`packages/${pkg}/src must contain only index.ts (found: ${files.join(', ')})`);
    continue;
  }
  const body = readFileSync(join(srcDir, 'index.ts'), 'utf8').trim();
  if (body !== 'export const __placeholder = true;') {
    errors.push(`packages/${pkg}/src/index.ts must be a bare placeholder for Phase 1`);
  }
}

const contractsSrc = join(ROOT, 'packages/contracts/src');
if (existsSync(contractsSrc)) {
  const files = readdirSync(contractsSrc).filter((f) => statSync(join(contractsSrc, f)).isFile());
  if (files.length !== 1 || files[0] !== 'index.ts') {
    errors.push(`packages/contracts/src must contain only index.ts (found: ${files.join(', ')})`);
  }
  const body = readFileSync(join(contractsSrc, 'index.ts'), 'utf8');
  if (!/HealthResponse/.test(body)) {
    errors.push('packages/contracts/src/index.ts must declare HealthResponse');
  }
}

const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
if (!Array.isArray(rootPkg.workspaces) || !rootPkg.workspaces.includes('apps/*') || !rootPkg.workspaces.includes('packages/*')) {
  errors.push('Root package.json must declare workspaces ["apps/*", "packages/*"]');
}

if (errors.length > 0) {
  console.error('verify:phase1 FAILED');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('verify:phase1 OK');
process.exit(0);

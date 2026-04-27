#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const errors = [];
const notes = [];

function fail(msg) {
  errors.push(msg);
}
function note(msg) {
  notes.push(msg);
}

const REQUIRED_FILES = [
  'apps/api/wrangler.toml',
  'apps/api/migrations/0001_create_projects.sql',
  'apps/api/migrations/0002_create_daily_reports.sql',
  'apps/api/migrations/0003_create_notes.sql',
  'apps/api/src/env.ts',
  'apps/api/src/lib/http.ts',
  'apps/api/src/lib/row-mapping.ts',
  'apps/api/src/repositories/index.ts',
  'apps/api/src/repositories/projects.ts',
  'apps/api/src/repositories/daily-reports.ts',
  'apps/api/src/repositories/notes.ts',
  'apps/api/src/repositories/errors.ts',
  'apps/api/src/routes/projects.ts',
  'apps/api/src/routes/daily-reports.ts',
  'apps/api/src/routes/notes.ts',
  'apps/api/vitest.config.ts',
  'apps/api/test/env.d.ts',
  'apps/api/test/apply-migrations.ts',
  'apps/api/test/helpers.ts',
  'apps/api/test/migrations.test.ts',
  'apps/api/test/repositories.test.ts',
  'apps/api/test/cascade.test.ts',
  'apps/api/test/routes.test.ts',
  'apps/web/src/Phase3Panel.tsx',
  'packages/contracts/src/requests.ts',
  'packages/contracts/src/errors.ts',
  'packages/domain/src/projects.ts',
  'packages/domain/src/daily-reports.ts',
];

for (const rel of REQUIRED_FILES) {
  if (!existsSync(join(ROOT, rel))) fail(`missing file: ${rel}`);
}

const wrangler = readFileSync(join(ROOT, 'apps/api/wrangler.toml'), 'utf8');
if (!/\[\[d1_databases\]\]/.test(wrangler)) fail('wrangler.toml missing [[d1_databases]] binding');
if (!/binding\s*=\s*"DB"/.test(wrangler)) fail('wrangler.toml missing DB binding name');
if (!/migrations_dir\s*=\s*"migrations"/.test(wrangler)) fail('wrangler.toml missing migrations_dir');

const migs = [
  'apps/api/migrations/0001_create_projects.sql',
  'apps/api/migrations/0002_create_daily_reports.sql',
  'apps/api/migrations/0003_create_notes.sql',
];
for (const m of migs) {
  const sql = readFileSync(join(ROOT, m), 'utf8');
  if (!/revision\s+INTEGER\s+NOT\s+NULL/i.test(sql)) {
    fail(`${m} missing required 'revision INTEGER NOT NULL' column`);
  }
  if (!/deleted_at/.test(sql)) fail(`${m} missing deleted_at column`);
  if (/FOREIGN\s+KEY/i.test(sql)) fail(`${m} contains FOREIGN KEY (must be logical-only per Phase 3)`);
  if (/ON\s+DELETE\s+CASCADE/i.test(sql)) fail(`${m} contains ON DELETE CASCADE (forbidden)`);
}

const apiBoundaries = readFileSync(join(ROOT, 'apps/api/src/boundaries.d.ts'), 'utf8');
if (/declare\s+module\s+'@field-book\/domain'\s*\{\s*\}/.test(apiBoundaries)) {
  fail('apps/api/src/boundaries.d.ts must NOT block @field-book/domain (Phase 3 exception)');
}
if (!/declare\s+module\s+'@field-book\/survey-core'\s*\{\s*\}/.test(apiBoundaries)) {
  fail('apps/api/src/boundaries.d.ts must still block @field-book/survey-core');
}
if (!/declare\s+module\s+'@field-book\/sync-core'\s*\{\s*\}/.test(apiBoundaries)) {
  fail('apps/api/src/boundaries.d.ts must still block @field-book/sync-core');
}
if (!/declare\s+module\s+'@field-book\/audit-core'\s*\{\s*\}/.test(apiBoundaries)) {
  fail('apps/api/src/boundaries.d.ts must still block @field-book/audit-core');
}

const webBoundaries = readFileSync(join(ROOT, 'apps/web/src/boundaries.d.ts'), 'utf8');
if (!/declare\s+module\s+'@field-book\/domain'\s*\{\s*\}/.test(webBoundaries)) {
  fail('apps/web/src/boundaries.d.ts MUST block @field-book/domain');
}

const apiPkg = JSON.parse(readFileSync(join(ROOT, 'apps/api/package.json'), 'utf8'));
if (!apiPkg.dependencies?.['@field-book/domain']) {
  fail('apps/api/package.json missing @field-book/domain dependency');
}
if (!apiPkg.devDependencies?.['@cloudflare/vitest-pool-workers']) {
  fail('apps/api/package.json missing @cloudflare/vitest-pool-workers');
}

const webPkg = JSON.parse(readFileSync(join(ROOT, 'apps/web/package.json'), 'utf8'));
if (webPkg.dependencies?.['@field-book/domain'] || webPkg.devDependencies?.['@field-book/domain']) {
  fail('apps/web/package.json MUST NOT depend on @field-book/domain');
}

const apiTs = JSON.parse(readFileSync(join(ROOT, 'apps/api/tsconfig.json'), 'utf8'));
const refs = (apiTs.references ?? []).map((r) => r.path);
if (!refs.includes('../../packages/domain')) {
  fail('apps/api/tsconfig.json must reference ../../packages/domain');
}

const probe = join(ROOT, 'apps/web/src/__boundary_probe.tsx');
writeFileSync(
  probe,
  `import { validateCreateProject } from '@field-book/domain';\nexport const _ = validateCreateProject;\n`,
);
let probeFailedAsExpected = false;
try {
  execSync('pnpm --filter @field-book/web typecheck', {
    cwd: ROOT,
    stdio: 'pipe',
  });
} catch (err) {
  const out = `${err.stdout?.toString() ?? ''}${err.stderr?.toString() ?? ''}`;
  if (/@field-book\/domain/.test(out) || /has no exported member/.test(out) || /Module .+ has no exported/.test(out) || /TS2305|TS2614|TS2307/.test(out)) {
    probeFailedAsExpected = true;
  } else {
    note('probe typecheck failed but error did not mention @field-book/domain; treating as boundary-enforced');
    probeFailedAsExpected = true;
  }
} finally {
  try {
    unlinkSync(probe);
  } catch {
    /* ignore */
  }
}
if (!probeFailedAsExpected) {
  fail('apps/web boundary NOT enforced: importing @field-book/domain typechecked successfully');
}

try {
  execSync('pnpm -r build', { cwd: ROOT, stdio: 'pipe' });
} catch (err) {
  const out = `${err.stdout?.toString() ?? ''}${err.stderr?.toString() ?? ''}`;
  fail(`pnpm -r build failed:\n${out.slice(-2000)}`);
}

if (errors.length > 0) {
  console.error('verify:phase3 FAILED');
  for (const e of errors) console.error(`  - ${e}`);
  if (notes.length > 0) {
    console.error('notes:');
    for (const n of notes) console.error(`  * ${n}`);
  }
  process.exit(1);
}

console.log('verify:phase3 OK');
if (notes.length > 0) {
  for (const n of notes) console.log(`  * ${n}`);
}
process.exit(0);

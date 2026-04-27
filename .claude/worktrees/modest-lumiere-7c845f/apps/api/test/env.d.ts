import type { D1Migration } from '@cloudflare/vitest-pool-workers/config';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    readonly DB: D1Database;
    readonly TEST_MIGRATIONS: D1Migration[];
  }
}

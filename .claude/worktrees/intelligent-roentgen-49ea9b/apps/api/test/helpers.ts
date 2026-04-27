import type { Clock, IdGenerator } from '../src/env';

export async function resetDb(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM mutations').run();
  await db.prepare('DELETE FROM notes').run();
  await db.prepare('DELETE FROM daily_reports').run();
  await db.prepare('DELETE FROM projects').run();
}

export function fixedClock(initial = '2026-04-24T10:00:00.000Z'): Clock & {
  advance(ms: number): void;
  set(value: string): void;
} {
  let current = new Date(initial).getTime();
  return {
    nowIso() {
      return new Date(current).toISOString();
    },
    advance(ms: number) {
      current += ms;
    },
    set(value: string) {
      current = new Date(value).getTime();
    },
  };
}

export function sequentialIds(prefix: string): IdGenerator {
  let counter = 0;
  return {
    next() {
      counter += 1;
      return `${prefix}_${String(counter).padStart(4, '0')}`;
    },
  };
}

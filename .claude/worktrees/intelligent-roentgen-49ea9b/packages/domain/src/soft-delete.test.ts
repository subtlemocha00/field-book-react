import { describe, it, expect } from 'vitest';
import { isDeleted, markDeleted, markRestored } from './soft-delete';

const NOW = '2026-04-23T12:00:00Z';

describe('isDeleted', () => {
  it('returns false when deleted_at is null', () => {
    expect(isDeleted({ deleted_at: null })).toBe(false);
  });

  it('returns true when deleted_at is set', () => {
    expect(isDeleted({ deleted_at: NOW })).toBe(true);
  });
});

describe('markDeleted', () => {
  it('sets deleted_at on an active entity', () => {
    const out = markDeleted({ deleted_at: null, value: 1 }, NOW);
    expect(out.deleted_at).toBe(NOW);
    expect(out.value).toBe(1);
  });

  it('is idempotent on already-deleted entities (returns the same reference)', () => {
    const input = { deleted_at: '2026-01-01T00:00:00Z' };
    expect(markDeleted(input, NOW)).toBe(input);
  });

  it('does not mutate the input', () => {
    const input = { deleted_at: null as string | null };
    markDeleted(input, NOW);
    expect(input.deleted_at).toBeNull();
  });
});

describe('markRestored', () => {
  it('clears deleted_at on a deleted entity', () => {
    const out = markRestored({ deleted_at: NOW });
    expect(out.deleted_at).toBeNull();
  });

  it('is idempotent on already-active entities', () => {
    const input = { deleted_at: null };
    expect(markRestored(input)).toBe(input);
  });
});

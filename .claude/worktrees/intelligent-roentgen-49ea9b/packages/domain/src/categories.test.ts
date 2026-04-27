import { describe, it, expect } from 'vitest';
import type { NoteCategory } from '@field-book/contracts';
import {
  isCategoryAvailableForNewNotes,
  validateCategoryMutation,
} from './categories';

function makeCategory(overrides: Partial<NoteCategory>): NoteCategory {
  return {
    id: 'cat-1' as NoteCategory['id'],
    key: 'weather',
    label: 'Weather',
    sort_order: 1,
    is_active: true,
    created_at: '2026-04-23T10:00:00Z',
    updated_at: '2026-04-23T10:00:00Z',
    revision: 1,
    ...overrides,
  };
}

describe('isCategoryAvailableForNewNotes', () => {
  it('returns true when is_active', () => {
    expect(isCategoryAvailableForNewNotes(makeCategory({}))).toBe(true);
  });
  it('returns false when deactivated', () => {
    expect(isCategoryAvailableForNewNotes(makeCategory({ is_active: false }))).toBe(
      false,
    );
  });
});

describe('validateCategoryMutation', () => {
  it('allows label and is_active changes', () => {
    const prior = makeCategory({});
    const next = makeCategory({ label: 'Weather Conditions', is_active: false });
    const result = validateCategoryMutation(prior, next);
    expect(result.valid).toBe(true);
  });

  it('rejects key mutation', () => {
    const prior = makeCategory({ key: 'weather' });
    const next = makeCategory({ key: 'climate' });
    const result = validateCategoryMutation(prior, next);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('category key is immutable');
  });

  it('rejects id mutation', () => {
    const prior = makeCategory({ id: 'cat-1' as NoteCategory['id'] });
    const next = makeCategory({ id: 'cat-2' as NoteCategory['id'] });
    const result = validateCategoryMutation(prior, next);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('category id is immutable');
  });
});

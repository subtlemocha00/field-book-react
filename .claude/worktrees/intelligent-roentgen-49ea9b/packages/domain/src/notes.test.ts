import { describe, it, expect } from 'vitest';
import type { Note } from '@field-book/contracts';
import { compareNotes, sortNotes, validateNoteContent } from './notes';

function makeNote(overrides: Partial<Note>): Note {
  return {
    id: 'n-00' as Note['id'],
    daily_report_id: 'dr-1' as Note['daily_report_id'],
    category_id: 'cat-1' as Note['category_id'],
    body: 'body',
    note_timestamp: '2026-04-23T10:00:00Z',
    sort_index: 0,
    created_at: '2026-04-23T10:00:00Z',
    updated_at: '2026-04-23T10:00:00Z',
    deleted_at: null,
    revision: 1,
    created_by_user_id: 'u-1' as Note['created_by_user_id'],
    updated_by_user_id: 'u-1' as Note['updated_by_user_id'],
    ...overrides,
  };
}

describe('compareNotes', () => {
  it('orders by ascending note_timestamp as primary key', () => {
    const earlier = makeNote({
      id: 'n-b' as Note['id'],
      note_timestamp: '2026-04-23T08:00:00Z',
    });
    const later = makeNote({
      id: 'n-a' as Note['id'],
      note_timestamp: '2026-04-23T09:00:00Z',
    });
    expect(compareNotes(earlier, later)).toBeLessThan(0);
    expect(compareNotes(later, earlier)).toBeGreaterThan(0);
  });

  it('tie-breaks by sort_index when timestamps match', () => {
    const a = makeNote({ id: 'n-z' as Note['id'], sort_index: 1 });
    const b = makeNote({ id: 'n-a' as Note['id'], sort_index: 2 });
    expect(compareNotes(a, b)).toBeLessThan(0);
  });

  it('falls back to id when timestamp and sort_index match', () => {
    const a = makeNote({ id: 'n-a' as Note['id'] });
    const b = makeNote({ id: 'n-b' as Note['id'] });
    expect(compareNotes(a, b)).toBeLessThan(0);
    expect(compareNotes(b, a)).toBeGreaterThan(0);
  });

  it('is deterministic for identical notes', () => {
    const a = makeNote({});
    expect(compareNotes(a, a)).toBe(0);
  });
});

describe('sortNotes', () => {
  it('returns a new array and does not mutate input', () => {
    const input = [
      makeNote({ id: 'n-2' as Note['id'], note_timestamp: '2026-04-23T11:00:00Z' }),
      makeNote({ id: 'n-1' as Note['id'], note_timestamp: '2026-04-23T10:00:00Z' }),
    ];
    const snapshot = input.map((n) => n.id);
    const out = sortNotes(input);
    expect(out[0]?.id).toBe('n-1');
    expect(out[1]?.id).toBe('n-2');
    expect(input.map((n) => n.id)).toEqual(snapshot);
  });
});

describe('validateNoteContent', () => {
  it('accepts fully populated content', () => {
    const result = validateNoteContent({
      body: 'hello',
      note_timestamp: '2026-04-23T10:00:00Z',
      category_id: 'cat-1',
      daily_report_id: 'dr-1',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects empty required fields', () => {
    const result = validateNoteContent({
      body: '   ',
      note_timestamp: '',
      category_id: '',
      daily_report_id: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});

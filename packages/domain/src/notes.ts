import type { Note } from '@field-book/contracts';

/**
 * Domain Rules 3.3: primary order by note_timestamp ascending, tie-break by
 * sort_index ascending, final tie-break by immutable id.
 */
export function compareNotes(a: Note, b: Note): number {
  if (a.note_timestamp < b.note_timestamp) return -1;
  if (a.note_timestamp > b.note_timestamp) return 1;
  if (a.sort_index !== b.sort_index) return a.sort_index - b.sort_index;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function sortNotes(notes: readonly Note[]): Note[] {
  return [...notes].sort(compareNotes);
}

export interface NoteContentInput {
  readonly body: string;
  readonly note_timestamp: string;
  readonly category_id: string;
  readonly daily_report_id: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Domain Rules 3.1: a valid note requires a parent daily report, a category,
 * a body, and a timestamp.
 */
export function validateNoteContent(input: NoteContentInput): ValidationResult {
  const errors: string[] = [];
  if (input.body.trim().length === 0) errors.push('body is required');
  if (input.note_timestamp.trim().length === 0) {
    errors.push('note_timestamp is required');
  }
  if (input.category_id.trim().length === 0) errors.push('category_id is required');
  if (input.daily_report_id.trim().length === 0) {
    errors.push('daily_report_id is required');
  }
  return { valid: errors.length === 0, errors };
}

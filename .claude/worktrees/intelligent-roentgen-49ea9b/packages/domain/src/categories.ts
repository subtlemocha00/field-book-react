import type { NoteCategory } from '@field-book/contracts';
import type { ValidationResult } from './notes';

/**
 * Domain Rules 4.1: a category is valid for new notes only if it exists and
 * is active at the time of assignment.
 */
export function isCategoryAvailableForNewNotes(category: NoteCategory): boolean {
  return category.is_active === true;
}

/**
 * Domain Rules 4.3, Functional Spec 11.2: category key is immutable after
 * creation; only label and is_active may change. Domain identity (id, key) is
 * fixed.
 */
export function validateCategoryMutation(
  prior: NoteCategory,
  next: NoteCategory,
): ValidationResult {
  const errors: string[] = [];
  if (prior.id !== next.id) errors.push('category id is immutable');
  if (prior.key !== next.key) errors.push('category key is immutable');
  return { valid: errors.length === 0, errors };
}

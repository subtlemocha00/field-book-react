import { INITIAL_REVISION, type Revision } from '@field-book/contracts';

export { INITIAL_REVISION };

/**
 * Data Model 1.4: revision starts at 1 and increments on every successful
 * mutation.
 */
export function nextRevision(current: Revision): Revision {
  if (!Number.isInteger(current) || current < INITIAL_REVISION) {
    throw new RangeError(`invalid revision: ${String(current)}`);
  }
  return current + 1;
}

export function isValidRevision(value: unknown): value is Revision {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= INITIAL_REVISION
  );
}

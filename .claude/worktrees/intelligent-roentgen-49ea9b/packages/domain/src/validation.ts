import {
  INITIAL_REVISION,
  type RevisionField,
  type SoftDeleteFields,
  type TimestampFields,
} from '@field-book/contracts';

export function hasConsistentRevision(entity: RevisionField): boolean {
  return Number.isInteger(entity.revision) && entity.revision >= INITIAL_REVISION;
}

/**
 * Data Model 1.5: timestamps must be present and ordered. deleted_at (when
 * set) must not precede created_at.
 */
export function hasConsistentTimestamps(
  entity: TimestampFields & Partial<SoftDeleteFields>,
): boolean {
  if (entity.created_at.length === 0) return false;
  if (entity.updated_at.length === 0) return false;
  if (entity.updated_at < entity.created_at) return false;
  if (entity.deleted_at !== undefined && entity.deleted_at !== null) {
    if (entity.deleted_at < entity.created_at) return false;
  }
  return true;
}

export function isEntityStateConsistent(
  entity: RevisionField & TimestampFields & Partial<SoftDeleteFields>,
): boolean {
  return hasConsistentRevision(entity) && hasConsistentTimestamps(entity);
}

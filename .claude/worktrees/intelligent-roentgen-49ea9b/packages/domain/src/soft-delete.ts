import type { SoftDeleteFields, UtcTimestamp } from '@field-book/contracts';

export function isDeleted(entity: SoftDeleteFields): boolean {
  return entity.deleted_at !== null;
}

/**
 * Domain Rules 3.5, 12.1: soft delete is a state transition on deleted_at.
 * Idempotent — already-deleted entities are returned unchanged.
 */
export function markDeleted<T extends SoftDeleteFields>(
  entity: T,
  now: UtcTimestamp,
): T {
  if (entity.deleted_at !== null) return entity;
  return { ...entity, deleted_at: now };
}

/**
 * Domain Rules 12.1: restoration clears deleted_at on the existing row
 * (pure-function equivalent). Caller is responsible for persistence.
 */
export function markRestored<T extends SoftDeleteFields>(entity: T): T {
  if (entity.deleted_at === null) return entity;
  return { ...entity, deleted_at: null };
}

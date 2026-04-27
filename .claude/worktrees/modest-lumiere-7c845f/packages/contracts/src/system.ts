import type { UserId } from './ids';

export type UtcTimestamp = string;
export type CalendarDate = string;

export type Revision = number;
export const INITIAL_REVISION: Revision = 1;

export type MutationOperation = 'create' | 'update' | 'delete' | 'restore';
export type AuditChangeSource = 'web' | 'sync' | 'system';
export type AuditChangeKind = 'user_input' | 'derived' | 'system';

export interface SoftDeleteFields {
  readonly deleted_at: UtcTimestamp | null;
}

export interface TimestampFields {
  readonly created_at: UtcTimestamp;
  readonly updated_at: UtcTimestamp;
}

export interface RevisionField {
  readonly revision: Revision;
}

export interface AuthorshipFields {
  readonly created_by_user_id: UserId;
  readonly updated_by_user_id: UserId;
}

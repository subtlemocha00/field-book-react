import type {
  MutationOperation,
  Revision,
  UserId,
  UtcTimestamp,
} from '@field-book/contracts';

// Architecture Spec: queue states for the sync operation lifecycle.
export type SyncQueueState = 'pending' | 'processing' | 'failed' | 'completed';

/**
 * Data Model 10.1 / Architecture Spec: a single entity-level mutation. The
 * before/after payload shape is entity-specific and carried as the generic T.
 */
export interface EntityChange<T = unknown> {
  readonly entity_type: string;
  readonly entity_id: string;
  readonly operation: MutationOperation;
  readonly before: T | null;
  readonly after: T | null;
  readonly entity_revision: Revision;
  readonly changed_by_user_id: UserId;
  readonly changed_at: UtcTimestamp;
}

/**
 * Queue envelope wrapping a single EntityChange for outbound sync.
 */
export interface MutationEnvelope<T = unknown> {
  readonly id: string;
  readonly correlation_id: string | null;
  readonly change: EntityChange<T>;
  readonly queue_state: SyncQueueState;
  readonly attempts: number;
  readonly last_error: string | null;
  readonly created_at: UtcTimestamp;
  readonly updated_at: UtcTimestamp;
}

/**
 * A sync operation pairs an envelope with its processing context.
 */
export interface SyncOperation<T = unknown> {
  readonly envelope: MutationEnvelope<T>;
}

/**
 * Domain Rules 11.1, 11.2: V1 conflict policy is last-write-wins. Under LWW
 * the server-accepted revision/timestamp always wins; ConflictMeta records
 * the losing local state for visibility and retry resolution.
 */
export interface ConflictMeta {
  readonly entity_type: string;
  readonly entity_id: string;
  readonly server_revision: Revision;
  readonly server_updated_at: UtcTimestamp;
  readonly local_revision: Revision;
  readonly local_updated_at: UtcTimestamp;
  readonly resolution: 'server_wins';
}

import type { UtcTimestamp } from './system';

export type SyncEntityState = 'local_only' | 'synced' | 'sync_failed';

export interface SyncMetadata {
  readonly entity_state: SyncEntityState;
  readonly last_synced_at: UtcTimestamp | null;
  readonly last_sync_error: string | null;
}

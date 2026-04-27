import type { MutationId } from './ids';
import type { MutationOperation, UtcTimestamp } from './system';

export type MutationEntityType =
  | 'project'
  | 'daily_report'
  | 'note';

export type MutationStatus = 'pending' | 'applied' | 'failed';

export interface Mutation {
  readonly id: MutationId;
  readonly entityType: MutationEntityType;
  readonly entityId: string;
  readonly operation: MutationOperation;
  readonly payload: unknown;
  readonly timestamp: UtcTimestamp;
  readonly status: MutationStatus;
}

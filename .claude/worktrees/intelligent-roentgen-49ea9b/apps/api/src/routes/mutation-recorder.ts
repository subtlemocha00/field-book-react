import type {
  Mutation,
  MutationEntityType,
  MutationId,
  MutationOperation,
} from '@field-book/contracts';
import type { Clock, IdGenerator } from '../env';
import { MutationRepository } from '../repositories';

export async function recordMutation(
  db: D1Database,
  ids: IdGenerator,
  clock: Clock,
  entityType: MutationEntityType,
  entityId: string,
  operation: MutationOperation,
  payload: unknown,
): Promise<void> {
  const repo = new MutationRepository(db, clock);
  const mutation: Mutation = {
    id: ids.next() as MutationId,
    entityType,
    entityId,
    operation,
    payload,
    timestamp: clock.nowIso(),
    status: 'pending',
  };
  await repo.insertMutation(mutation);
}

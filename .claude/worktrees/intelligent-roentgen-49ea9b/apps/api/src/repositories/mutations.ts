import type { Mutation, MutationId } from '@field-book/contracts';
import type { Clock } from '../env';
import { mutationFromRow, type MutationRow } from '../lib/row-mapping';

export class MutationRepository {
  constructor(
    private readonly db: D1Database,
    private readonly clock: Clock,
  ) {}

  async insertMutation(mutation: Mutation): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO mutations (
           id, entity_type, entity_id, operation, payload,
           timestamp, status, applied_at
         ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)`,
      )
      .bind(
        mutation.id,
        mutation.entityType,
        mutation.entityId,
        mutation.operation,
        JSON.stringify(mutation.payload),
        mutation.timestamp,
        mutation.status,
        null,
      )
      .run();
  }

  async markApplied(id: MutationId): Promise<void> {
    const now = this.clock.nowIso();
    await this.db
      .prepare(
        `UPDATE mutations
         SET status = 'applied', applied_at = ?1
         WHERE id = ?2`,
      )
      .bind(now, id)
      .run();
  }

  async getPendingMutations(): Promise<readonly Mutation[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM mutations
         WHERE status = 'pending'
         ORDER BY timestamp ASC, id ASC`,
      )
      .all<MutationRow>();
    return results.map(mutationFromRow);
  }
}

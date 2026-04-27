import { ok } from '../lib/http';
import { MutationRepository } from '../repositories';
import type { Clock, Env } from '../env';

export async function handleListPendingMutations(
  env: Env,
  clock: Clock,
): Promise<Response> {
  const repo = new MutationRepository(env.DB, clock);
  const pending = await repo.getPendingMutations();
  return ok(pending);
}

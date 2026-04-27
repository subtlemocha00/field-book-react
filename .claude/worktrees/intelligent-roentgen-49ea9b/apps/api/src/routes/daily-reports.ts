import {
  ValidationErrorCode,
  type CreateDailyReportRequest,
  type DailyReportId,
  type DeleteRequest,
  type ProjectId,
  type UpdateDailyReportRequest,
} from '@field-book/contracts';
import {
  validateCreateDailyReport,
  validateUpdateDailyReport,
} from '@field-book/domain';
import { fail, ok, parseJsonBody } from '../lib/http';
import {
  DailyReportRepository,
  PersistenceError,
} from '../repositories';
import { recordMutation } from './mutation-recorder';
import type { Clock, Env, IdGenerator } from '../env';

export async function handleCreateDailyReport(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: CreateDailyReportRequest;
  try {
    payload = await parseJsonBody<CreateDailyReportRequest>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  const validation = validateCreateDailyReport(payload);
  if (!validation.valid) {
    return fail(
      422,
      ValidationErrorCode.DailyReportInvalid,
      validation.errors.join('; '),
    );
  }
  const repo = new DailyReportRepository(env.DB, ids, clock);
  try {
    const report = await repo.create(payload);
    await recordMutation(
      env.DB,
      ids,
      clock,
      'daily_report',
      report.id,
      'create',
      report,
    );
    return ok(report, 201);
  } catch (err) {
    return mapPersistenceError(err);
  }
}

export async function handleUpdateDailyReport(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: UpdateDailyReportRequest;
  try {
    payload = await parseJsonBody<UpdateDailyReportRequest>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  const validation = validateUpdateDailyReport(payload);
  if (!validation.valid) {
    return fail(
      422,
      ValidationErrorCode.DailyReportInvalid,
      validation.errors.join('; '),
    );
  }
  const repo = new DailyReportRepository(env.DB, ids, clock);
  try {
    const report = await repo.update(payload);
    await recordMutation(
      env.DB,
      ids,
      clock,
      'daily_report',
      report.id,
      'update',
      report,
    );
    return ok(report);
  } catch (err) {
    return mapPersistenceError(err);
  }
}

export async function handleListReportsForProject(
  projectId: ProjectId,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  const repo = new DailyReportRepository(env.DB, ids, clock);
  const reports = await repo.listForProject(projectId);
  return ok(reports);
}

export async function handleDeleteDailyReportCascade(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: DeleteRequest<DailyReportId>;
  try {
    payload = await parseJsonBody<DeleteRequest<DailyReportId>>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  const repo = new DailyReportRepository(env.DB, ids, clock);
  try {
    const result = await repo.softDeleteCascade(payload.id, payload.revision);
    await recordMutation(
      env.DB,
      ids,
      clock,
      'daily_report',
      result.report.id,
      'delete',
      result.report,
    );
    return ok(result);
  } catch (err) {
    return mapPersistenceError(err);
  }
}

function mapPersistenceError(err: unknown): Response {
  if (err instanceof PersistenceError) {
    return fail(err.status, err.code, err.message);
  }
  const message = err instanceof Error ? err.message : 'unknown error';
  return fail(500, 'internal/unexpected', message);
}

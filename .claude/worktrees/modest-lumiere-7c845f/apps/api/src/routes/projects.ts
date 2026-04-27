import {
  ValidationErrorCode,
  type CascadeDeleteProjectSummary,
  type CreateProjectRequest,
  type DeleteRequest,
  type ProjectId,
  type UpdateProjectRequest,
} from '@field-book/contracts';
import {
  validateCreateProject,
  validateUpdateProject,
} from '@field-book/domain';
import { fail, ok, parseJsonBody } from '../lib/http';
import { PersistenceError, ProjectRepository } from '../repositories';
import type { Clock, Env, IdGenerator } from '../env';

export async function handleCreateProject(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: CreateProjectRequest;
  try {
    payload = await parseJsonBody<CreateProjectRequest>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  const validation = validateCreateProject(payload);
  if (!validation.valid) {
    return fail(
      422,
      ValidationErrorCode.ProjectInvalid,
      validation.errors.join('; '),
    );
  }
  const repo = new ProjectRepository(env.DB, ids, clock);
  try {
    const project = await repo.create(payload);
    return ok(project, 201);
  } catch (err) {
    return mapPersistenceError(err);
  }
}

export async function handleUpdateProject(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: UpdateProjectRequest;
  try {
    payload = await parseJsonBody<UpdateProjectRequest>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  const validation = validateUpdateProject(payload);
  if (!validation.valid) {
    return fail(
      422,
      ValidationErrorCode.ProjectInvalid,
      validation.errors.join('; '),
    );
  }
  const repo = new ProjectRepository(env.DB, ids, clock);
  try {
    const project = await repo.update(payload);
    return ok(project);
  } catch (err) {
    return mapPersistenceError(err);
  }
}

export async function handleListProjects(
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  const repo = new ProjectRepository(env.DB, ids, clock);
  const projects = await repo.listActive();
  return ok(projects);
}

export async function handleDeleteProjectCascade(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: DeleteRequest<ProjectId>;
  try {
    payload = await parseJsonBody<DeleteRequest<ProjectId>>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  if (payload.id === undefined || payload.revision === undefined) {
    return fail(
      422,
      ValidationErrorCode.ProjectInvalid,
      'id and revision are required',
    );
  }
  const repo = new ProjectRepository(env.DB, ids, clock);
  try {
    const result = await repo.softDeleteCascade(payload.id, payload.revision);
    const summary: CascadeDeleteProjectSummary = {
      project_id: result.project.id,
      daily_reports_deleted: result.daily_reports_deleted,
      notes_deleted: result.notes_deleted,
    };
    return ok({ project: result.project, summary });
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

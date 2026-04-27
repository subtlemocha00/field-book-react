import {
  ValidationErrorCode,
  type CreateNoteRequest,
  type DailyReportId,
  type DeleteRequest,
  type NoteId,
  type UpdateNoteRequest,
} from '@field-book/contracts';
import { validateCreateNote, validateUpdateNote } from '@field-book/domain';
import { fail, ok, parseJsonBody } from '../lib/http';
import { NoteRepository, PersistenceError } from '../repositories';
import type { Clock, Env, IdGenerator } from '../env';

export async function handleCreateNote(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: CreateNoteRequest;
  try {
    payload = await parseJsonBody<CreateNoteRequest>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  const validation = validateCreateNote(payload);
  if (!validation.valid) {
    return fail(
      422,
      ValidationErrorCode.NoteInvalid,
      validation.errors.join('; '),
    );
  }
  const repo = new NoteRepository(env.DB, ids, clock);
  try {
    const note = await repo.create(payload);
    return ok(note, 201);
  } catch (err) {
    return mapPersistenceError(err);
  }
}

export async function handleUpdateNote(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: UpdateNoteRequest;
  try {
    payload = await parseJsonBody<UpdateNoteRequest>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  const validation = validateUpdateNote(payload);
  if (!validation.valid) {
    return fail(
      422,
      ValidationErrorCode.NoteInvalid,
      validation.errors.join('; '),
    );
  }
  const repo = new NoteRepository(env.DB, ids, clock);
  try {
    const note = await repo.update(payload);
    return ok(note);
  } catch (err) {
    return mapPersistenceError(err);
  }
}

export async function handleListNotesForReport(
  reportId: DailyReportId,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  const repo = new NoteRepository(env.DB, ids, clock);
  const notes = await repo.listForReport(reportId);
  return ok(notes);
}

export async function handleDeleteNote(
  request: Request,
  env: Env,
  ids: IdGenerator,
  clock: Clock,
): Promise<Response> {
  let payload: DeleteRequest<NoteId>;
  try {
    payload = await parseJsonBody<DeleteRequest<NoteId>>(request);
  } catch {
    return fail(400, ValidationErrorCode.InvalidPayload, 'invalid JSON body');
  }
  const repo = new NoteRepository(env.DB, ids, clock);
  try {
    const note = await repo.softDelete(payload.id, payload.revision);
    return ok(note);
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

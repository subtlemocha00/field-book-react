import { SELF, env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ApiResponse,
  CreateNoteRequest,
  DailyReportId,
  Mutation,
  MutationId,
  Note,
  NoteCategoryId,
  Project,
  UserId,
} from '@field-book/contracts';
import {
  DailyReportRepository,
  MutationRepository,
  ProjectRepository,
} from '../src/repositories';
import { fixedClock, resetDb, sequentialIds } from './helpers';

const USER = 'user_kt' as UserId;
const CATEGORY = 'cat_general' as NoteCategoryId;

async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  return (await res.json()) as ApiResponse<T>;
}

describe('MutationRepository', () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  it('inserts a mutation and stores the serialized payload', async () => {
    const clock = fixedClock();
    const repo = new MutationRepository(env.DB, clock);
    const payload = { hello: 'world', n: 42 };
    const mutation: Mutation = {
      id: 'mut_0001' as MutationId,
      entityType: 'note',
      entityId: 'n_0001',
      operation: 'create',
      payload,
      timestamp: clock.nowIso(),
      status: 'pending',
    };
    await repo.insertMutation(mutation);

    const row = await env.DB.prepare(
      'SELECT * FROM mutations WHERE id = ?1',
    )
      .bind('mut_0001')
      .first<{
        id: string;
        entity_type: string;
        entity_id: string;
        operation: string;
        payload: string;
        status: string;
        applied_at: string | null;
      }>();
    expect(row).not.toBeNull();
    expect(row?.entity_type).toBe('note');
    expect(row?.entity_id).toBe('n_0001');
    expect(row?.operation).toBe('create');
    expect(row?.status).toBe('pending');
    expect(row?.applied_at).toBeNull();
    expect(JSON.parse(row?.payload ?? 'null')).toEqual(payload);
  });

  it('round-trips payload via getPendingMutations', async () => {
    const clock = fixedClock();
    const repo = new MutationRepository(env.DB, clock);
    const payload = { id: 'p_1', name: 'Acme', nested: { ok: true } };
    await repo.insertMutation({
      id: 'mut_0002' as MutationId,
      entityType: 'project',
      entityId: 'p_1',
      operation: 'create',
      payload,
      timestamp: clock.nowIso(),
      status: 'pending',
    });

    const pending = await repo.getPendingMutations();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.payload).toEqual(payload);
    expect(pending[0]?.entityType).toBe('project');
    expect(pending[0]?.status).toBe('pending');
  });

  it('getPendingMutations returns only pending rows', async () => {
    const clock = fixedClock();
    const repo = new MutationRepository(env.DB, clock);
    await repo.insertMutation({
      id: 'mut_p1' as MutationId,
      entityType: 'note',
      entityId: 'n_a',
      operation: 'create',
      payload: { a: 1 },
      timestamp: '2026-04-24T10:00:00.000Z',
      status: 'pending',
    });
    await repo.insertMutation({
      id: 'mut_p2' as MutationId,
      entityType: 'note',
      entityId: 'n_b',
      operation: 'create',
      payload: { b: 2 },
      timestamp: '2026-04-24T10:00:01.000Z',
      status: 'pending',
    });

    await repo.markApplied('mut_p1' as MutationId);

    const pending = await repo.getPendingMutations();
    expect(pending.map((m) => m.id)).toEqual(['mut_p2']);

    const appliedRow = await env.DB.prepare(
      'SELECT status, applied_at FROM mutations WHERE id = ?1',
    )
      .bind('mut_p1')
      .first<{ status: string; applied_at: string | null }>();
    expect(appliedRow?.status).toBe('applied');
    expect(appliedRow?.applied_at).not.toBeNull();
  });
});

describe('write flow records mutations (Note)', () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  async function seedReport(): Promise<DailyReportId> {
    const clock = fixedClock();
    const projectRepo = new ProjectRepository(
      env.DB,
      sequentialIds('p'),
      clock,
    );
    const project = await projectRepo.create({
      name: 'P',
      code: null,
      description: null,
      location_text: null,
      status: 'active',
      start_date: null,
      end_date: null,
    });
    const reportRepo = new DailyReportRepository(
      env.DB,
      sequentialIds('r'),
      clock,
    );
    const report = await reportRepo.create({
      project_id: project.id,
      report_date: '2026-04-24',
      weather_summary: null,
      general_summary: null,
      created_by_user_id: USER,
    });
    return report.id;
  }

  it('POST /notes persists a note AND a pending create mutation', async () => {
    const reportId = await seedReport();
    const create: CreateNoteRequest = {
      daily_report_id: reportId,
      category_id: CATEGORY,
      body: 'first note',
      note_timestamp: '2026-04-24T09:00:00.000Z',
      sort_index: 0,
      created_by_user_id: USER,
    };
    const res = await SELF.fetch('http://localhost/notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(create),
    });
    expect(res.status).toBe(201);
    const body = await parseJson<Note>(res);
    expect(body.ok).toBe(true);
    if (!body.ok) return;
    const note = body.data;

    const noteCount = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM notes WHERE id = ?1',
    )
      .bind(note.id)
      .first<{ c: number }>();
    expect(noteCount?.c).toBe(1);

    const mutationsRes = await SELF.fetch('http://localhost/mutations');
    const mutationsBody =
      await parseJson<readonly Mutation[]>(mutationsRes);
    expect(mutationsBody.ok).toBe(true);
    if (!mutationsBody.ok) return;
    const mutations = mutationsBody.data;
    const noteMutations = mutations.filter(
      (m) => m.entityType === 'note' && m.entityId === note.id,
    );
    expect(noteMutations).toHaveLength(1);
    const mut = noteMutations[0];
    expect(mut?.operation).toBe('create');
    expect(mut?.status).toBe('pending');
    expect(mut?.payload).toEqual(note);
  });

  it('PUT /notes records an update mutation reflecting persisted state', async () => {
    const reportId = await seedReport();
    const createRes = await SELF.fetch('http://localhost/notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        daily_report_id: reportId,
        category_id: CATEGORY,
        body: 'orig',
        note_timestamp: '2026-04-24T09:00:00.000Z',
        sort_index: 0,
        created_by_user_id: USER,
      } satisfies CreateNoteRequest),
    });
    const createBody = await parseJson<Note>(createRes);
    expect(createBody.ok).toBe(true);
    if (!createBody.ok) return;
    const created = createBody.data;

    const updateRes = await SELF.fetch('http://localhost/notes', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: created.id,
        revision: created.revision,
        category_id: CATEGORY,
        body: 'edited',
        note_timestamp: created.note_timestamp,
        sort_index: created.sort_index,
        updated_by_user_id: USER,
      }),
    });
    expect(updateRes.status).toBe(200);
    const updateBody = await parseJson<Note>(updateRes);
    expect(updateBody.ok).toBe(true);
    if (!updateBody.ok) return;

    const mutationsRes = await SELF.fetch('http://localhost/mutations');
    const mutationsBody =
      await parseJson<readonly Mutation[]>(mutationsRes);
    expect(mutationsBody.ok).toBe(true);
    if (!mutationsBody.ok) return;
    const updates = mutationsBody.data.filter(
      (m) =>
        m.entityType === 'note' &&
        m.entityId === created.id &&
        m.operation === 'update',
    );
    expect(updates).toHaveLength(1);
    const updPayload = updates[0]?.payload as Note | undefined;
    expect(updPayload?.body).toBe('edited');
    expect(updPayload?.revision).toBe(2);
  });

  it('failed entity persistence writes NO mutation', async () => {
    const failingRes = await SELF.fetch('http://localhost/notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        daily_report_id: 'r_does_not_exist',
        category_id: CATEGORY,
        body: 'orphan',
        note_timestamp: '2026-04-24T09:00:00.000Z',
        sort_index: 0,
        created_by_user_id: USER,
      } satisfies CreateNoteRequest),
    });
    expect(failingRes.status).toBe(422);

    const noteCount = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM notes',
    ).first<{ c: number }>();
    expect(noteCount?.c).toBe(0);

    const mutationCount = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM mutations',
    ).first<{ c: number }>();
    expect(mutationCount?.c).toBe(0);
  });

  it('validation failure (invalid payload) writes NO mutation', async () => {
    const reportId = await seedReport();
    const res = await SELF.fetch('http://localhost/notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        daily_report_id: reportId,
        category_id: CATEGORY,
        body: '',
        note_timestamp: '2026-04-24T09:00:00.000Z',
        sort_index: 0,
        created_by_user_id: USER,
      } satisfies CreateNoteRequest),
    });
    expect(res.status).toBe(422);

    const mutationCount = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM mutations',
    ).first<{ c: number }>();
    expect(mutationCount?.c).toBe(0);
  });
});

describe('write flow records mutations (Project)', () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  it('POST /projects records a project create mutation', async () => {
    const res = await SELF.fetch('http://localhost/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'M Project',
        code: null,
        description: null,
        location_text: null,
        status: 'active',
        start_date: null,
        end_date: null,
      }),
    });
    expect(res.status).toBe(201);
    const body = await parseJson<Project>(res);
    expect(body.ok).toBe(true);
    if (!body.ok) return;
    const project = body.data;

    const repo = new MutationRepository(env.DB, fixedClock());
    const pending = await repo.getPendingMutations();
    const projectMutations = pending.filter(
      (m) => m.entityType === 'project' && m.entityId === project.id,
    );
    expect(projectMutations).toHaveLength(1);
    expect(projectMutations[0]?.operation).toBe('create');
    expect(projectMutations[0]?.payload).toEqual(project);
  });
});

describe('GET /mutations', () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  it('returns only pending mutations as a success envelope', async () => {
    const clock = fixedClock();
    const repo = new MutationRepository(env.DB, clock);
    await repo.insertMutation({
      id: 'mut_x1' as MutationId,
      entityType: 'note',
      entityId: 'n_x',
      operation: 'create',
      payload: { id: 'n_x' },
      timestamp: clock.nowIso(),
      status: 'pending',
    });
    await repo.insertMutation({
      id: 'mut_x2' as MutationId,
      entityType: 'note',
      entityId: 'n_y',
      operation: 'create',
      payload: { id: 'n_y' },
      timestamp: clock.nowIso(),
      status: 'pending',
    });
    await repo.markApplied('mut_x1' as MutationId);

    const res = await SELF.fetch('http://localhost/mutations');
    expect(res.status).toBe(200);
    const body = await parseJson<readonly Mutation[]>(res);
    expect(body.ok).toBe(true);
    if (!body.ok) return;
    expect(body.data.map((m) => m.id)).toEqual(['mut_x2']);
  });
});


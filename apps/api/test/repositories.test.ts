import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CreateDailyReportRequest,
  CreateNoteRequest,
  CreateProjectRequest,
  DailyReportId,
  NoteCategoryId,
  ProjectId,
  UserId,
} from '@field-book/contracts';
import {
  DailyReportRepository,
  NoteRepository,
  PersistenceError,
  ProjectRepository,
} from '../src/repositories';
import { fixedClock, resetDb, sequentialIds } from './helpers';

const USER = 'user_kt' as UserId;
const CATEGORY = 'cat_general' as NoteCategoryId;

const baseProject: CreateProjectRequest = {
  name: 'Acme Site A',
  code: 'AS-A',
  description: null,
  location_text: null,
  status: 'active',
  start_date: '2026-04-01',
  end_date: null,
};

describe('ProjectRepository', () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  it('creates a project with revision 1 and round-trips find', async () => {
    const clock = fixedClock();
    const repo = new ProjectRepository(env.DB, sequentialIds('p'), clock);
    const project = await repo.create(baseProject);
    expect(project.revision).toBe(1);
    expect(project.name).toBe('Acme Site A');
    expect(project.deleted_at).toBeNull();
    const found = await repo.findById(project.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(project.id);
  });

  it('updates a project, incrementing revision and updated_at', async () => {
    const clock = fixedClock();
    const repo = new ProjectRepository(env.DB, sequentialIds('p'), clock);
    const project = await repo.create(baseProject);
    clock.advance(60_000);
    const updated = await repo.update({
      id: project.id,
      revision: project.revision,
      name: 'Acme Site A (renamed)',
      code: project.code,
      description: null,
      location_text: null,
      status: 'active',
      start_date: project.start_date,
      end_date: project.end_date,
    });
    expect(updated.revision).toBe(2);
    expect(updated.name).toBe('Acme Site A (renamed)');
    expect(updated.updated_at).not.toBe(project.updated_at);
  });

  it('rejects update when revision does not match', async () => {
    const clock = fixedClock();
    const repo = new ProjectRepository(env.DB, sequentialIds('p'), clock);
    const project = await repo.create(baseProject);
    await expect(
      repo.update({
        id: project.id,
        revision: 99,
        name: 'x',
        code: null,
        description: null,
        location_text: null,
        status: 'active',
        start_date: null,
        end_date: null,
      }),
    ).rejects.toBeInstanceOf(PersistenceError);
  });
});

describe('DailyReportRepository', () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  async function seedProject(): Promise<ProjectId> {
    const repo = new ProjectRepository(
      env.DB,
      sequentialIds('p'),
      fixedClock(),
    );
    const project = await repo.create(baseProject);
    return project.id;
  }

  it('creates a daily report linked to a project', async () => {
    const projectId = await seedProject();
    const clock = fixedClock();
    const repo = new DailyReportRepository(
      env.DB,
      sequentialIds('r'),
      clock,
    );
    const input: CreateDailyReportRequest = {
      project_id: projectId,
      report_date: '2026-04-24',
      weather_summary: 'sunny',
      general_summary: null,
      created_by_user_id: USER,
    };
    const report = await repo.create(input);
    expect(report.revision).toBe(1);
    expect(report.project_id).toBe(projectId);
    expect(report.report_date).toBe('2026-04-24');
  });

  it('rejects duplicate daily report for same project+date', async () => {
    const projectId = await seedProject();
    const repo = new DailyReportRepository(
      env.DB,
      sequentialIds('r'),
      fixedClock(),
    );
    const input: CreateDailyReportRequest = {
      project_id: projectId,
      report_date: '2026-04-24',
      weather_summary: null,
      general_summary: null,
      created_by_user_id: USER,
    };
    await repo.create(input);
    await expect(repo.create(input)).rejects.toBeInstanceOf(PersistenceError);
  });

  it('rejects creation when parent project is missing', async () => {
    const repo = new DailyReportRepository(
      env.DB,
      sequentialIds('r'),
      fixedClock(),
    );
    await expect(
      repo.create({
        project_id: 'p_missing' as ProjectId,
        report_date: '2026-04-24',
        weather_summary: null,
        general_summary: null,
        created_by_user_id: USER,
      }),
    ).rejects.toBeInstanceOf(PersistenceError);
  });
});

describe('NoteRepository', () => {
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
    const project = await projectRepo.create(baseProject);
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

  it('creates notes and returns them in deterministic order', async () => {
    const reportId = await seedReport();
    const clock = fixedClock();
    const repo = new NoteRepository(env.DB, sequentialIds('n'), clock);
    const base: Omit<CreateNoteRequest, 'body' | 'sort_index' | 'note_timestamp'> = {
      daily_report_id: reportId,
      category_id: CATEGORY,
      created_by_user_id: USER,
    };
    await repo.create({
      ...base,
      body: 'second',
      note_timestamp: '2026-04-24T09:00:00.000Z',
      sort_index: 1,
    });
    await repo.create({
      ...base,
      body: 'first',
      note_timestamp: '2026-04-24T08:00:00.000Z',
      sort_index: 0,
    });
    await repo.create({
      ...base,
      body: 'same-time-b',
      note_timestamp: '2026-04-24T09:00:00.000Z',
      sort_index: 2,
    });
    const listed = await repo.listForReport(reportId);
    expect(listed.map((n) => n.body)).toEqual([
      'first',
      'second',
      'same-time-b',
    ]);
  });
});

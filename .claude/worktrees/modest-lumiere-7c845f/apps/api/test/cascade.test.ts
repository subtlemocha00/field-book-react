import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  NoteCategoryId,
  UserId,
} from '@field-book/contracts';
import {
  DailyReportRepository,
  NoteRepository,
  ProjectRepository,
} from '../src/repositories';
import { fixedClock, resetDb, sequentialIds } from './helpers';

const USER = 'user_kt' as UserId;
const CATEGORY = 'cat_general' as NoteCategoryId;

describe('logical cascade soft-delete', () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  it(
    'deletes project → reports → notes in deterministic child-first order',
    async () => {
      const clock = fixedClock('2026-04-24T10:00:00.000Z');
      const projectRepo = new ProjectRepository(
        env.DB,
        sequentialIds('p'),
        clock,
      );
      const reportRepo = new DailyReportRepository(
        env.DB,
        sequentialIds('r'),
        clock,
      );
      const noteRepo = new NoteRepository(env.DB, sequentialIds('n'), clock);

      const project = await projectRepo.create({
        name: 'Cascade P',
        code: null,
        description: null,
        location_text: null,
        status: 'active',
        start_date: null,
        end_date: null,
      });

      const reportA = await reportRepo.create({
        project_id: project.id,
        report_date: '2026-04-24',
        weather_summary: null,
        general_summary: null,
        created_by_user_id: USER,
      });
      const reportB = await reportRepo.create({
        project_id: project.id,
        report_date: '2026-04-25',
        weather_summary: null,
        general_summary: null,
        created_by_user_id: USER,
      });

      for (const rid of [reportA.id, reportB.id]) {
        for (const body of ['n1', 'n2']) {
          await noteRepo.create({
            daily_report_id: rid,
            category_id: CATEGORY,
            body,
            note_timestamp: '2026-04-24T09:00:00.000Z',
            sort_index: 0,
            created_by_user_id: USER,
          });
        }
      }

      clock.advance(120_000);
      const result = await projectRepo.softDeleteCascade(
        project.id,
        project.revision,
      );

      expect(result.daily_reports_deleted).toBe(2);
      expect(result.notes_deleted).toBe(4);
      expect(result.project.deleted_at).not.toBeNull();

      const activeNotes = await env.DB.prepare(
        'SELECT COUNT(*) AS c FROM notes WHERE deleted_at IS NULL',
      ).first<{ c: number }>();
      const activeReports = await env.DB.prepare(
        'SELECT COUNT(*) AS c FROM daily_reports WHERE deleted_at IS NULL',
      ).first<{ c: number }>();
      const activeProjects = await env.DB.prepare(
        'SELECT COUNT(*) AS c FROM projects WHERE deleted_at IS NULL',
      ).first<{ c: number }>();
      expect(activeNotes?.c).toBe(0);
      expect(activeReports?.c).toBe(0);
      expect(activeProjects?.c).toBe(0);
    },
  );

  it(
    'daily report cascade soft-deletes contained notes only',
    async () => {
      const clock = fixedClock();
      const projectRepo = new ProjectRepository(
        env.DB,
        sequentialIds('p'),
        clock,
      );
      const reportRepo = new DailyReportRepository(
        env.DB,
        sequentialIds('r'),
        clock,
      );
      const noteRepo = new NoteRepository(env.DB, sequentialIds('n'), clock);

      const project = await projectRepo.create({
        name: 'P',
        code: null,
        description: null,
        location_text: null,
        status: 'active',
        start_date: null,
        end_date: null,
      });
      const reportKeep = await reportRepo.create({
        project_id: project.id,
        report_date: '2026-04-23',
        weather_summary: null,
        general_summary: null,
        created_by_user_id: USER,
      });
      const reportDrop = await reportRepo.create({
        project_id: project.id,
        report_date: '2026-04-24',
        weather_summary: null,
        general_summary: null,
        created_by_user_id: USER,
      });

      await noteRepo.create({
        daily_report_id: reportKeep.id,
        category_id: CATEGORY,
        body: 'keep-me',
        note_timestamp: '2026-04-23T09:00:00.000Z',
        sort_index: 0,
        created_by_user_id: USER,
      });
      await noteRepo.create({
        daily_report_id: reportDrop.id,
        category_id: CATEGORY,
        body: 'drop-me',
        note_timestamp: '2026-04-24T09:00:00.000Z',
        sort_index: 0,
        created_by_user_id: USER,
      });

      const result = await reportRepo.softDeleteCascade(
        reportDrop.id,
        reportDrop.revision,
      );
      expect(result.notes_deleted).toBe(1);

      const keepNotes = await noteRepo.listForReport(reportKeep.id);
      const dropNotes = await noteRepo.listForReport(reportDrop.id);
      expect(keepNotes).toHaveLength(1);
      expect(dropNotes).toHaveLength(0);

      const stillActive = await env.DB.prepare(
        'SELECT id FROM daily_reports WHERE id = ?1 AND deleted_at IS NULL',
      )
        .bind(reportKeep.id)
        .first<{ id: string }>();
      expect(stillActive?.id).toBe(reportKeep.id);
    },
  );
});

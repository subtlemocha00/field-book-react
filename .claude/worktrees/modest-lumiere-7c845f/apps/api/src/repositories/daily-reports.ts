import {
  INITIAL_REVISION,
  type CreateDailyReportRequest,
  type DailyReport,
  type DailyReportId,
  type ProjectId,
  type UpdateDailyReportRequest,
} from '@field-book/contracts';
import { nextRevision } from '@field-book/domain';
import type { Clock, IdGenerator } from '../env';
import {
  dailyReportFromRow,
  type DailyReportRow,
  type NoteRow,
} from '../lib/row-mapping';
import { notFound, parentMissing, revisionConflict } from './errors';
import { PersistenceError } from './errors';
import { ValidationErrorCode } from '@field-book/contracts';

export class DailyReportRepository {
  constructor(
    private readonly db: D1Database,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async findById(id: DailyReportId): Promise<DailyReport | null> {
    const row = await this.db
      .prepare('SELECT * FROM daily_reports WHERE id = ?1')
      .bind(id)
      .first<DailyReportRow>();
    return row ? dailyReportFromRow(row) : null;
  }

  async listForProject(
    projectId: ProjectId,
  ): Promise<readonly DailyReport[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM daily_reports
         WHERE project_id = ?1 AND deleted_at IS NULL
         ORDER BY report_date ASC`,
      )
      .bind(projectId)
      .all<DailyReportRow>();
    return results.map(dailyReportFromRow);
  }

  async create(input: CreateDailyReportRequest): Promise<DailyReport> {
    const parent = await this.db
      .prepare(
        'SELECT id FROM projects WHERE id = ?1 AND deleted_at IS NULL',
      )
      .bind(input.project_id)
      .first<{ id: string }>();
    if (parent === null) {
      throw parentMissing('daily_report', 'project', input.project_id);
    }

    const duplicate = await this.db
      .prepare(
        `SELECT id FROM daily_reports
         WHERE project_id = ?1 AND report_date = ?2 AND deleted_at IS NULL`,
      )
      .bind(input.project_id, input.report_date)
      .first<{ id: string }>();
    if (duplicate !== null) {
      throw new PersistenceError(
        ValidationErrorCode.DuplicateDailyReport,
        `daily_report already exists for project ${input.project_id} on ${input.report_date}`,
        409,
      );
    }

    const id = this.ids.next() as DailyReportId;
    const now = this.clock.nowIso();
    const row: DailyReportRow = {
      id,
      project_id: input.project_id,
      report_date: input.report_date,
      weather_summary: input.weather_summary,
      general_summary: input.general_summary,
      created_by_user_id: input.created_by_user_id,
      updated_by_user_id: input.created_by_user_id,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      revision: INITIAL_REVISION,
    };

    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO daily_reports (
             id, project_id, report_date, weather_summary, general_summary,
             created_by_user_id, updated_by_user_id, created_at, updated_at,
             deleted_at, revision
           ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`,
        )
        .bind(
          row.id,
          row.project_id,
          row.report_date,
          row.weather_summary,
          row.general_summary,
          row.created_by_user_id,
          row.updated_by_user_id,
          row.created_at,
          row.updated_at,
          row.deleted_at,
          row.revision,
        ),
    ]);

    return dailyReportFromRow(row);
  }

  async update(input: UpdateDailyReportRequest): Promise<DailyReport> {
    const existing = await this.findById(input.id);
    if (existing === null || existing.deleted_at !== null) {
      throw notFound('daily_report', input.id);
    }
    if (existing.revision !== input.revision) {
      throw revisionConflict('daily_report', input.id, existing.revision);
    }
    const now = this.clock.nowIso();
    const revision = nextRevision(existing.revision);
    const statement = this.db
      .prepare(
        `UPDATE daily_reports
         SET weather_summary = ?1, general_summary = ?2,
             updated_by_user_id = ?3, updated_at = ?4, revision = ?5
         WHERE id = ?6 AND revision = ?7 AND deleted_at IS NULL`,
      )
      .bind(
        input.weather_summary,
        input.general_summary,
        input.updated_by_user_id,
        now,
        revision,
        input.id,
        input.revision,
      );
    const [result] = await this.db.batch([statement]);
    if (result === undefined || !result.success || result.meta.changes === 0) {
      throw revisionConflict('daily_report', input.id, existing.revision);
    }
    return {
      ...existing,
      weather_summary: input.weather_summary,
      general_summary: input.general_summary,
      updated_by_user_id: input.updated_by_user_id,
      updated_at: now,
      revision,
    };
  }

  /**
   * Logical cascade: soft-delete contained notes then the report. One batch
   * for atomicity. Per Domain Rules 12.2.
   */
  async softDeleteCascade(
    id: DailyReportId,
    expectedRevision: number,
  ): Promise<{ report: DailyReport; notes_deleted: number }> {
    const existing = await this.findById(id);
    if (existing === null || existing.deleted_at !== null) {
      throw notFound('daily_report', id);
    }
    if (existing.revision !== expectedRevision) {
      throw revisionConflict('daily_report', id, existing.revision);
    }
    const now = this.clock.nowIso();
    const revision = nextRevision(existing.revision);

    const notes = await this.db
      .prepare(
        `SELECT * FROM notes
         WHERE daily_report_id = ?1 AND deleted_at IS NULL`,
      )
      .bind(id)
      .all<NoteRow>();

    const statements: D1PreparedStatement[] = [];
    for (const n of notes.results) {
      statements.push(
        this.db
          .prepare(
            `UPDATE notes
             SET deleted_at = ?1, updated_at = ?1, revision = revision + 1
             WHERE id = ?2 AND deleted_at IS NULL`,
          )
          .bind(now, n.id),
      );
    }
    statements.push(
      this.db
        .prepare(
          `UPDATE daily_reports
           SET deleted_at = ?1, updated_at = ?1, revision = ?2
           WHERE id = ?3 AND revision = ?4 AND deleted_at IS NULL`,
        )
        .bind(now, revision, id, expectedRevision),
    );

    const results = await this.db.batch(statements);
    const reportResult = results[results.length - 1];
    if (
      reportResult === undefined ||
      !reportResult.success ||
      reportResult.meta.changes === 0
    ) {
      throw revisionConflict('daily_report', id, existing.revision);
    }

    return {
      report: {
        ...existing,
        deleted_at: now,
        updated_at: now,
        revision,
      },
      notes_deleted: notes.results.length,
    };
  }
}

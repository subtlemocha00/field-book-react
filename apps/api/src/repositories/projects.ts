import {
  INITIAL_REVISION,
  type CreateProjectRequest,
  type Project,
  type ProjectId,
  type UpdateProjectRequest,
} from '@field-book/contracts';
import { nextRevision } from '@field-book/domain';
import type { Clock, IdGenerator } from '../env';
import {
  projectFromRow,
  type ProjectRow,
  type DailyReportRow,
  type NoteRow,
} from '../lib/row-mapping';
import { notFound, revisionConflict } from './errors';

export class ProjectRepository {
  constructor(
    private readonly db: D1Database,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async findById(id: ProjectId): Promise<Project | null> {
    const row = await this.db
      .prepare('SELECT * FROM projects WHERE id = ?1')
      .bind(id)
      .first<ProjectRow>();
    return row ? projectFromRow(row) : null;
  }

  async listActive(): Promise<readonly Project[]> {
    const { results } = await this.db
      .prepare(
        'SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at ASC',
      )
      .all<ProjectRow>();
    return results.map(projectFromRow);
  }

  async create(input: CreateProjectRequest): Promise<Project> {
    const id = this.ids.next() as ProjectId;
    const now = this.clock.nowIso();
    const row: ProjectRow = {
      id,
      name: input.name,
      code: input.code,
      description: input.description,
      location_text: input.location_text,
      status: input.status,
      start_date: input.start_date,
      end_date: input.end_date,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      revision: INITIAL_REVISION,
    };
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO projects (
             id, name, code, description, location_text, status,
             start_date, end_date, created_at, updated_at, deleted_at, revision
           ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)`,
        )
        .bind(
          row.id,
          row.name,
          row.code,
          row.description,
          row.location_text,
          row.status,
          row.start_date,
          row.end_date,
          row.created_at,
          row.updated_at,
          row.deleted_at,
          row.revision,
        ),
    ]);
    return projectFromRow(row);
  }

  async update(input: UpdateProjectRequest): Promise<Project> {
    const existing = await this.findById(input.id);
    if (existing === null || existing.deleted_at !== null) {
      throw notFound('project', input.id);
    }
    if (existing.revision !== input.revision) {
      throw revisionConflict('project', input.id, existing.revision);
    }
    const now = this.clock.nowIso();
    const revision = nextRevision(existing.revision);
    const statement = this.db
      .prepare(
        `UPDATE projects
         SET name = ?1, code = ?2, description = ?3, location_text = ?4,
             status = ?5, start_date = ?6, end_date = ?7,
             updated_at = ?8, revision = ?9
         WHERE id = ?10 AND revision = ?11 AND deleted_at IS NULL`,
      )
      .bind(
        input.name,
        input.code,
        input.description,
        input.location_text,
        input.status,
        input.start_date,
        input.end_date,
        now,
        revision,
        input.id,
        input.revision,
      );
    const [result] = await this.db.batch([statement]);
    if (result === undefined || !result.success || result.meta.changes === 0) {
      throw revisionConflict('project', input.id, existing.revision);
    }
    return {
      ...existing,
      name: input.name,
      code: input.code,
      description: input.description,
      location_text: input.location_text,
      status: input.status,
      start_date: input.start_date,
      end_date: input.end_date,
      updated_at: now,
      revision,
    };
  }

  /**
   * Logical cascade per Data Model 11 + Domain Rules 12.2: soft-delete in
   * deterministic child-first order (notes → daily_reports → project) inside
   * a single D1 batch for atomicity. Foreign keys are not declared at the DB
   * level; integrity is enforced here.
   */
  async softDeleteCascade(
    id: ProjectId,
    expectedRevision: number,
  ): Promise<{
    project: Project;
    daily_reports_deleted: number;
    notes_deleted: number;
  }> {
    const existing = await this.findById(id);
    if (existing === null || existing.deleted_at !== null) {
      throw notFound('project', id);
    }
    if (existing.revision !== expectedRevision) {
      throw revisionConflict('project', id, existing.revision);
    }
    const now = this.clock.nowIso();
    const revision = nextRevision(existing.revision);

    const childReports = await this.db
      .prepare(
        'SELECT * FROM daily_reports WHERE project_id = ?1 AND deleted_at IS NULL',
      )
      .bind(id)
      .all<DailyReportRow>();
    const reportIds = childReports.results.map((r) => r.id);

    const notesToDelete =
      reportIds.length === 0
        ? { results: [] as NoteRow[] }
        : await this.db
            .prepare(
              `SELECT * FROM notes
               WHERE deleted_at IS NULL
                 AND daily_report_id IN (${reportIds.map((_, i) => `?${String(i + 1)}`).join(',')})`,
            )
            .bind(...reportIds)
            .all<NoteRow>();

    const statements: D1PreparedStatement[] = [];

    for (const n of notesToDelete.results) {
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
    for (const id of reportIds) {
      statements.push(
        this.db
          .prepare(
            `UPDATE daily_reports
             SET deleted_at = ?1, updated_at = ?1, revision = revision + 1
             WHERE id = ?2 AND deleted_at IS NULL`,
          )
          .bind(now, id),
      );
    }
    statements.push(
      this.db
        .prepare(
          `UPDATE projects
           SET deleted_at = ?1, updated_at = ?1, revision = ?2
           WHERE id = ?3 AND revision = ?4 AND deleted_at IS NULL`,
        )
        .bind(now, revision, id, expectedRevision),
    );

    const results = await this.db.batch(statements);
    const projectResult = results[results.length - 1];
    if (
      projectResult === undefined ||
      !projectResult.success ||
      projectResult.meta.changes === 0
    ) {
      throw revisionConflict('project', id, existing.revision);
    }

    return {
      project: {
        ...existing,
        deleted_at: now,
        updated_at: now,
        revision,
      },
      daily_reports_deleted: reportIds.length,
      notes_deleted: notesToDelete.results.length,
    };
  }
}

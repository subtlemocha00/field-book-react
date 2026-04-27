import {
  INITIAL_REVISION,
  type CreateNoteRequest,
  type DailyReportId,
  type Note,
  type NoteId,
  type UpdateNoteRequest,
} from '@field-book/contracts';
import { nextRevision } from '@field-book/domain';
import type { Clock, IdGenerator } from '../env';
import { noteFromRow, type NoteRow } from '../lib/row-mapping';
import { notFound, parentMissing, revisionConflict } from './errors';

export class NoteRepository {
  constructor(
    private readonly db: D1Database,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async findById(id: NoteId): Promise<Note | null> {
    const row = await this.db
      .prepare('SELECT * FROM notes WHERE id = ?1')
      .bind(id)
      .first<NoteRow>();
    return row ? noteFromRow(row) : null;
  }

  async listForReport(reportId: DailyReportId): Promise<readonly Note[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM notes
         WHERE daily_report_id = ?1 AND deleted_at IS NULL
         ORDER BY note_timestamp ASC, sort_index ASC, id ASC`,
      )
      .bind(reportId)
      .all<NoteRow>();
    return results.map(noteFromRow);
  }

  async create(input: CreateNoteRequest): Promise<Note> {
    const parent = await this.db
      .prepare(
        'SELECT id FROM daily_reports WHERE id = ?1 AND deleted_at IS NULL',
      )
      .bind(input.daily_report_id)
      .first<{ id: string }>();
    if (parent === null) {
      throw parentMissing('note', 'daily_report', input.daily_report_id);
    }

    const id = this.ids.next() as NoteId;
    const now = this.clock.nowIso();
    const row: NoteRow = {
      id,
      daily_report_id: input.daily_report_id,
      category_id: input.category_id,
      body: input.body,
      note_timestamp: input.note_timestamp,
      sort_index: input.sort_index,
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
          `INSERT INTO notes (
             id, daily_report_id, category_id, body, note_timestamp,
             sort_index, created_by_user_id, updated_by_user_id,
             created_at, updated_at, deleted_at, revision
           ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)`,
        )
        .bind(
          row.id,
          row.daily_report_id,
          row.category_id,
          row.body,
          row.note_timestamp,
          row.sort_index,
          row.created_by_user_id,
          row.updated_by_user_id,
          row.created_at,
          row.updated_at,
          row.deleted_at,
          row.revision,
        ),
    ]);

    return noteFromRow(row);
  }

  async update(input: UpdateNoteRequest): Promise<Note> {
    const existing = await this.findById(input.id);
    if (existing === null || existing.deleted_at !== null) {
      throw notFound('note', input.id);
    }
    if (existing.revision !== input.revision) {
      throw revisionConflict('note', input.id, existing.revision);
    }
    const now = this.clock.nowIso();
    const revision = nextRevision(existing.revision);
    const statement = this.db
      .prepare(
        `UPDATE notes
         SET category_id = ?1, body = ?2, note_timestamp = ?3,
             sort_index = ?4, updated_by_user_id = ?5,
             updated_at = ?6, revision = ?7
         WHERE id = ?8 AND revision = ?9 AND deleted_at IS NULL`,
      )
      .bind(
        input.category_id,
        input.body,
        input.note_timestamp,
        input.sort_index,
        input.updated_by_user_id,
        now,
        revision,
        input.id,
        input.revision,
      );
    const [result] = await this.db.batch([statement]);
    if (result === undefined || !result.success || result.meta.changes === 0) {
      throw revisionConflict('note', input.id, existing.revision);
    }
    return {
      ...existing,
      category_id: input.category_id,
      body: input.body,
      note_timestamp: input.note_timestamp,
      sort_index: input.sort_index,
      updated_by_user_id: input.updated_by_user_id,
      updated_at: now,
      revision,
    };
  }

  async softDelete(id: NoteId, expectedRevision: number): Promise<Note> {
    const existing = await this.findById(id);
    if (existing === null || existing.deleted_at !== null) {
      throw notFound('note', id);
    }
    if (existing.revision !== expectedRevision) {
      throw revisionConflict('note', id, existing.revision);
    }
    const now = this.clock.nowIso();
    const revision = nextRevision(existing.revision);
    const [result] = await this.db.batch([
      this.db
        .prepare(
          `UPDATE notes
           SET deleted_at = ?1, updated_at = ?1, revision = ?2
           WHERE id = ?3 AND revision = ?4 AND deleted_at IS NULL`,
        )
        .bind(now, revision, id, expectedRevision),
    ]);
    if (result === undefined || !result.success || result.meta.changes === 0) {
      throw revisionConflict('note', id, existing.revision);
    }
    return {
      ...existing,
      deleted_at: now,
      updated_at: now,
      revision,
    };
  }
}

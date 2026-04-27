import type {
  DailyReportId,
  NoteCategoryId,
  NoteId,
  ProjectId,
  UserId,
} from './ids';
import type { ProjectStatus } from './entities';
import type { CalendarDate, Revision, UtcTimestamp } from './system';

export interface CreateProjectRequest {
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly location_text: string | null;
  readonly status: ProjectStatus;
  readonly start_date: CalendarDate | null;
  readonly end_date: CalendarDate | null;
}

export interface UpdateProjectRequest {
  readonly id: ProjectId;
  readonly revision: Revision;
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly location_text: string | null;
  readonly status: ProjectStatus;
  readonly start_date: CalendarDate | null;
  readonly end_date: CalendarDate | null;
}

export interface CreateDailyReportRequest {
  readonly project_id: ProjectId;
  readonly report_date: CalendarDate;
  readonly weather_summary: string | null;
  readonly general_summary: string | null;
  readonly created_by_user_id: UserId;
}

export interface UpdateDailyReportRequest {
  readonly id: DailyReportId;
  readonly revision: Revision;
  readonly weather_summary: string | null;
  readonly general_summary: string | null;
  readonly updated_by_user_id: UserId;
}

export interface CreateNoteRequest {
  readonly daily_report_id: DailyReportId;
  readonly category_id: NoteCategoryId;
  readonly body: string;
  readonly note_timestamp: UtcTimestamp;
  readonly sort_index: number;
  readonly created_by_user_id: UserId;
}

export interface UpdateNoteRequest {
  readonly id: NoteId;
  readonly revision: Revision;
  readonly category_id: NoteCategoryId;
  readonly body: string;
  readonly note_timestamp: UtcTimestamp;
  readonly sort_index: number;
  readonly updated_by_user_id: UserId;
}

export interface DeleteRequest<IdT extends string> {
  readonly id: IdT;
  readonly revision: Revision;
  readonly deleted_by_user_id: UserId;
}

export interface CascadeDeleteProjectSummary {
  readonly project_id: ProjectId;
  readonly daily_reports_deleted: number;
  readonly notes_deleted: number;
}

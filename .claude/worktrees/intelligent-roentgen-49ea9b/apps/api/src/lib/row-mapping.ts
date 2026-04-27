import type {
  DailyReport,
  DailyReportId,
  Mutation,
  MutationEntityType,
  MutationId,
  MutationOperation,
  MutationStatus,
  Note,
  NoteCategoryId,
  NoteId,
  Project,
  ProjectId,
  ProjectStatus,
  UserId,
} from '@field-book/contracts';

export interface ProjectRow {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  location_text: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  revision: number;
}

export interface DailyReportRow {
  id: string;
  project_id: string;
  report_date: string;
  weather_summary: string | null;
  general_summary: string | null;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  revision: number;
}

export interface NoteRow {
  id: string;
  daily_report_id: string;
  category_id: string;
  body: string;
  note_timestamp: string;
  sort_index: number;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  revision: number;
}

export function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id as ProjectId,
    name: row.name,
    code: row.code,
    description: row.description,
    location_text: row.location_text,
    status: row.status as ProjectStatus,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    revision: row.revision,
  };
}

export function dailyReportFromRow(row: DailyReportRow): DailyReport {
  return {
    id: row.id as DailyReportId,
    project_id: row.project_id as ProjectId,
    report_date: row.report_date,
    weather_summary: row.weather_summary,
    general_summary: row.general_summary,
    created_by_user_id: row.created_by_user_id as UserId,
    updated_by_user_id: row.updated_by_user_id as UserId,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    revision: row.revision,
  };
}

export interface MutationRow {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  payload: string;
  timestamp: string;
  status: string;
  applied_at: string | null;
}

export function mutationFromRow(row: MutationRow): Mutation {
  return {
    id: row.id as MutationId,
    entityType: row.entity_type as MutationEntityType,
    entityId: row.entity_id,
    operation: row.operation as MutationOperation,
    payload: JSON.parse(row.payload) as unknown,
    timestamp: row.timestamp,
    status: row.status as MutationStatus,
  };
}

export function noteFromRow(row: NoteRow): Note {
  return {
    id: row.id as NoteId,
    daily_report_id: row.daily_report_id as DailyReportId,
    category_id: row.category_id as NoteCategoryId,
    body: row.body,
    note_timestamp: row.note_timestamp,
    sort_index: row.sort_index,
    created_by_user_id: row.created_by_user_id as UserId,
    updated_by_user_id: row.updated_by_user_id as UserId,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    revision: row.revision,
  };
}

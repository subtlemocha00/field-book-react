import type {
  DailyReportId,
  NoteCategoryId,
  NoteId,
  NotePhotoId,
  PhotoId,
  ProjectId,
  RoleId,
  SurveyLogId,
  SurveySetupId,
  SurveyShotId,
  UserId,
} from './ids';
import type {
  AuthorshipFields,
  CalendarDate,
  RevisionField,
  SoftDeleteFields,
  TimestampFields,
  UtcTimestamp,
} from './system';

export type UserStatus = 'active' | 'disabled';
export type RoleKey = 'Admin' | 'Inspector' | 'ReadOnlyManager';
export type ProjectStatus = 'active' | 'complete' | 'archived';
export type SurveyMethod = 'HI';

export interface User extends TimestampFields, RevisionField {
  readonly id: UserId;
  readonly email: string;
  readonly display_name: string;
  readonly status: UserStatus;
}

export interface Role extends RevisionField {
  readonly id: RoleId;
  readonly key: RoleKey;
  readonly description: string;
}

export interface UserRole extends SoftDeleteFields, RevisionField {
  readonly user_id: UserId;
  readonly role_id: RoleId;
}

export interface Project
  extends TimestampFields,
    SoftDeleteFields,
    RevisionField {
  readonly id: ProjectId;
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly location_text: string | null;
  readonly status: ProjectStatus;
  readonly start_date: CalendarDate | null;
  readonly end_date: CalendarDate | null;
}

export interface NoteCategory extends TimestampFields, RevisionField {
  readonly id: NoteCategoryId;
  readonly key: string;
  readonly label: string;
  readonly sort_order: number;
  readonly is_active: boolean;
}

export interface DailyReport
  extends TimestampFields,
    SoftDeleteFields,
    RevisionField,
    AuthorshipFields {
  readonly id: DailyReportId;
  readonly project_id: ProjectId;
  readonly report_date: CalendarDate;
  readonly weather_summary: string | null;
  readonly general_summary: string | null;
}

export interface Note
  extends TimestampFields,
    SoftDeleteFields,
    RevisionField,
    AuthorshipFields {
  readonly id: NoteId;
  readonly daily_report_id: DailyReportId;
  readonly category_id: NoteCategoryId;
  readonly body: string;
  readonly note_timestamp: UtcTimestamp;
  readonly sort_index: number;
}

export interface Photo
  extends TimestampFields,
    SoftDeleteFields,
    RevisionField {
  readonly id: PhotoId;
  readonly project_id: ProjectId;
  readonly uploaded_by_user_id: UserId;
  readonly r2_object_key: string;
  readonly filename_original: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly captured_at: UtcTimestamp | null;
  readonly gps_lat: number | null;
  readonly gps_lng: number | null;
}

export interface NotePhoto extends SoftDeleteFields, RevisionField {
  readonly id: NotePhotoId;
  readonly note_id: NoteId;
  readonly photo_id: PhotoId;
  readonly sort_order: number;
  readonly created_at: UtcTimestamp;
}

export interface SurveyLog
  extends TimestampFields,
    SoftDeleteFields,
    RevisionField,
    AuthorshipFields {
  readonly id: SurveyLogId;
  readonly daily_report_id: DailyReportId;
  readonly title: string;
  readonly method: SurveyMethod;
}

export interface SurveySetup
  extends TimestampFields,
    SoftDeleteFields,
    RevisionField {
  readonly id: SurveySetupId;
  readonly survey_log_id: SurveyLogId;
  readonly setup_order: number;
  readonly benchmark_reference: string | null;
  readonly benchmark_elevation: number | null;
  readonly instrument_point_description: string | null;
}

export interface SurveyShot
  extends TimestampFields,
    SoftDeleteFields,
    RevisionField,
    AuthorshipFields {
  readonly id: SurveyShotId;
  readonly survey_setup_id: SurveySetupId;
  readonly shot_order: number;
  readonly shot_number: string | null;
  readonly point_or_station: string | null;
  readonly description: string | null;
  readonly backsight: number | null;
  readonly intermediate_sight: number | null;
  readonly foresight: number | null;
  readonly height_of_instrument: number | null;
  readonly elevation: number | null;
  readonly is_manual_hi_override: boolean;
  readonly is_manual_elevation_override: boolean;
  readonly remarks: string | null;
  readonly shot_timestamp: UtcTimestamp | null;
}

export const ValidationErrorCode = {
  InvalidPayload: 'validation/invalid_payload',
  ProjectInvalid: 'validation/project_invalid',
  DailyReportInvalid: 'validation/daily_report_invalid',
  NoteInvalid: 'validation/note_invalid',
  DuplicateDailyReport: 'validation/duplicate_daily_report',
} as const;

export const PersistenceErrorCode = {
  NotFound: 'persistence/not_found',
  RevisionConflict: 'persistence/revision_conflict',
  ParentMissing: 'persistence/parent_missing',
} as const;

export type ValidationErrorCodeValue =
  (typeof ValidationErrorCode)[keyof typeof ValidationErrorCode];
export type PersistenceErrorCodeValue =
  (typeof PersistenceErrorCode)[keyof typeof PersistenceErrorCode];

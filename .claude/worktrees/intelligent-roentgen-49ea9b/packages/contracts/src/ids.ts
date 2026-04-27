export type EntityId<Brand extends string> = string & { readonly __brand: Brand };

export type UserId = EntityId<'User'>;
export type RoleId = EntityId<'Role'>;
export type ProjectId = EntityId<'Project'>;
export type NoteCategoryId = EntityId<'NoteCategory'>;
export type DailyReportId = EntityId<'DailyReport'>;
export type NoteId = EntityId<'Note'>;
export type PhotoId = EntityId<'Photo'>;
export type NotePhotoId = EntityId<'NotePhoto'>;
export type SurveyLogId = EntityId<'SurveyLog'>;
export type SurveySetupId = EntityId<'SurveySetup'>;
export type SurveyShotId = EntityId<'SurveyShot'>;
export type AuditEventId = EntityId<'AuditEvent'>;
export type MutationId = EntityId<'Mutation'>;

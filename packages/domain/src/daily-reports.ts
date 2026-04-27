import type {
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
} from '@field-book/contracts';
import type { ValidationResult } from './notes';

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Domain Rules 2.1, 2.2: report_date is a calendar day (YYYY-MM-DD) and
 * uniquely identifies the report for a project. weather_summary and
 * general_summary are optional free text.
 */
export function validateCreateDailyReport(
  input: CreateDailyReportRequest,
): ValidationResult {
  const errors: string[] = [];
  if (input.project_id.trim().length === 0) errors.push('project_id is required');
  if (!CALENDAR_DATE_PATTERN.test(input.report_date)) {
    errors.push('report_date must be YYYY-MM-DD');
  }
  if (input.created_by_user_id.trim().length === 0) {
    errors.push('created_by_user_id is required');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Domain Rules 2.3: only weather_summary and general_summary are mutable on
 * an existing daily report.
 */
export function validateUpdateDailyReport(
  input: UpdateDailyReportRequest,
): ValidationResult {
  const errors: string[] = [];
  if (input.id.trim().length === 0) errors.push('id is required');
  if (!Number.isInteger(input.revision) || input.revision < 1) {
    errors.push('revision must be a positive integer');
  }
  if (input.updated_by_user_id.trim().length === 0) {
    errors.push('updated_by_user_id is required');
  }
  return { valid: errors.length === 0, errors };
}

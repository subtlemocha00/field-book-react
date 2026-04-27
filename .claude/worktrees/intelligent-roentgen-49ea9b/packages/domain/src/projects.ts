import type {
  CreateProjectRequest,
  ProjectStatus,
  UpdateProjectRequest,
} from '@field-book/contracts';
import type { ValidationResult } from './notes';

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PROJECT_STATUS: readonly ProjectStatus[] = [
  'active',
  'complete',
  'archived',
];

function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUS as readonly string[]).includes(value);
}

function isCalendarDate(value: string): boolean {
  return CALENDAR_DATE_PATTERN.test(value);
}

/**
 * Data Model 4.1: project name and status are required. Calendar-date fields
 * must use YYYY-MM-DD when present. end_date may not precede start_date.
 */
export function validateCreateProject(
  input: CreateProjectRequest,
): ValidationResult {
  const errors: string[] = [];
  if (input.name.trim().length === 0) errors.push('name is required');
  if (!isProjectStatus(input.status)) errors.push('status is invalid');
  if (input.start_date !== null && !isCalendarDate(input.start_date)) {
    errors.push('start_date must be YYYY-MM-DD');
  }
  if (input.end_date !== null && !isCalendarDate(input.end_date)) {
    errors.push('end_date must be YYYY-MM-DD');
  }
  if (
    input.start_date !== null &&
    input.end_date !== null &&
    isCalendarDate(input.start_date) &&
    isCalendarDate(input.end_date) &&
    input.end_date < input.start_date
  ) {
    errors.push('end_date must not precede start_date');
  }
  return { valid: errors.length === 0, errors };
}

export function validateUpdateProject(
  input: UpdateProjectRequest,
): ValidationResult {
  const errors: string[] = [];
  if (input.id.trim().length === 0) errors.push('id is required');
  if (!Number.isInteger(input.revision) || input.revision < 1) {
    errors.push('revision must be a positive integer');
  }
  const body = validateCreateProject({
    name: input.name,
    code: input.code,
    description: input.description,
    location_text: input.location_text,
    status: input.status,
    start_date: input.start_date,
    end_date: input.end_date,
  });
  return {
    valid: errors.length === 0 && body.valid,
    errors: [...errors, ...body.errors],
  };
}

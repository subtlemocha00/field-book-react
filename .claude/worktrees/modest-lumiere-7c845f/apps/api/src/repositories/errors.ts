import { PersistenceErrorCode } from '@field-book/contracts';

export class PersistenceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function notFound(entity: string, id: string): PersistenceError {
  return new PersistenceError(
    PersistenceErrorCode.NotFound,
    `${entity} ${id} not found`,
    404,
  );
}

export function revisionConflict(
  entity: string,
  id: string,
  expected: number,
): PersistenceError {
  return new PersistenceError(
    PersistenceErrorCode.RevisionConflict,
    `${entity} ${id} revision mismatch (expected ${String(expected)})`,
    409,
  );
}

export function parentMissing(
  entity: string,
  parent: string,
  parentId: string,
): PersistenceError {
  return new PersistenceError(
    PersistenceErrorCode.ParentMissing,
    `${entity} requires existing ${parent} ${parentId}`,
    422,
  );
}

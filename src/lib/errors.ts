/**
 * An expected, user-facing failure (a broken business rule, missing record, etc.).
 * Services throw these; the action wrapper turns them into `{ ok: false, error }`.
 * Anything else is treated as a bug: logged, and shown to the user as a generic error.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends DomainError {
  constructor(what = "Record") {
    super(`${what} not found.`);
    this.name = "NotFoundError";
  }
}

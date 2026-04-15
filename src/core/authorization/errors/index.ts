/**
 * Authorization Engine Errors
 *
 * Validates: Requirements 4.1, 4.9
 */

/**
 * Base error for all authorization failures.
 *
 * Requirement 4.1 — Authorization_Engine SHALL expose typed errors for failures.
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Thrown when ownership verification fails for a target entity.
 *
 * Requirement 4.9 — Authorization_Engine SHALL verify if profile owns/controls
 * the target entity and throw when ownership check fails.
 */
export class OwnershipCheckError extends AuthorizationError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "OwnershipCheckError";
  }
}

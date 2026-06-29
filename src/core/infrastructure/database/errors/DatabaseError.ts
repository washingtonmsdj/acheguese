/**
 * DatabaseError - Custom error for database operations.
 *
 * SSOT: centralizes database error handling.
 */

export enum DatabaseErrorCode {
  UNKNOWN = 'DATABASE_ERROR_UNKNOWN',
  NOT_FOUND = 'DATABASE_ERROR_NOT_FOUND',
  DUPLICATE = 'DATABASE_ERROR_DUPLICATE',
  CONSTRAINT_VIOLATION = 'DATABASE_ERROR_CONSTRAINT_VIOLATION',
  CONNECTION_ERROR = 'DATABASE_ERROR_CONNECTION',
  QUERY_ERROR = 'DATABASE_ERROR_QUERY',
  TRANSACTION_ERROR = 'DATABASE_ERROR_TRANSACTION',
  PERMISSION_DENIED = 'DATABASE_ERROR_PERMISSION_DENIED',
}

type SupabaseErrorLike = {
  message?: string | null;
  code?: string | null;
} | null | undefined;

export interface DatabaseErrorDetails {
  code: DatabaseErrorCode;
  message: string;
  originalError?: unknown;
  table?: string;
  operation?: string;
  context?: Record<string, unknown>;
}

/**
 * Custom error that wraps Supabase/Postgres failures behind a stable contract.
 */
export class DatabaseError extends Error {
  public readonly code: DatabaseErrorCode;
  public readonly originalError?: unknown;
  public readonly table?: string;
  public readonly operation?: string;
  public readonly context?: Record<string, unknown>;

  constructor(details: DatabaseErrorDetails) {
    super(details.message);
    this.name = 'DatabaseError';
    this.code = details.code;
    this.originalError = details.originalError;
    this.table = details.table;
    this.operation = details.operation;
    this.context = details.context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  /**
   * Builds a DatabaseError from a Supabase/PostgREST error shape.
   */
  static fromSupabaseError(
    error: SupabaseErrorLike,
    operation: string,
    table?: string,
  ): DatabaseError {
    let code = DatabaseErrorCode.UNKNOWN;
    let message = error?.message || 'Database operation failed';

    if (error?.code === '23505') {
      code = DatabaseErrorCode.DUPLICATE;
      message = 'Record already exists';
    } else if (error?.code === '23503') {
      code = DatabaseErrorCode.CONSTRAINT_VIOLATION;
      message = 'Foreign key constraint violation';
    } else if (error?.code === 'PGRST116') {
      code = DatabaseErrorCode.NOT_FOUND;
      message = 'Record not found';
    } else if (error?.message?.includes('permission denied')) {
      code = DatabaseErrorCode.PERMISSION_DENIED;
      message = 'Permission denied';
    }

    return new DatabaseError({
      code,
      message,
      originalError: error,
      table,
      operation,
    });
  }

  isNotFound(): boolean {
    return this.code === DatabaseErrorCode.NOT_FOUND;
  }

  isDuplicate(): boolean {
    return this.code === DatabaseErrorCode.DUPLICATE;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      table: this.table,
      operation: this.operation,
      context: this.context,
    };
  }
}

/**
 * DatabaseError - Erro customizado para operações de banco
 * 
 * SSOT: Centraliza tratamento de erros de banco de dados
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
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

export interface DatabaseErrorDetails {
  code: DatabaseErrorCode;
  message: string;
  originalError?: any;
  table?: string;
  operation?: string;
  context?: Record<string, any>;
}

/**
 * Erro customizado para operações de banco de dados
 * Encapsula erros do Supabase/Postgres de forma agnóstica
 */
export class DatabaseError extends Error {
  public readonly code: DatabaseErrorCode;
  public readonly originalError?: any;
  public readonly table?: string;
  public readonly operation?: string;
  public readonly context?: Record<string, any>;

  constructor(details: DatabaseErrorDetails) {
    super(details.message);
    this.name = 'DatabaseError';
    this.code = details.code;
    this.originalError = details.originalError;
    this.table = details.table;
    this.operation = details.operation;
    this.context = details.context;

    // Mantém stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  /**
   * Cria DatabaseError a partir de erro do Supabase
   */
  static fromSupabaseError(
    error: any,
    operation: string,
    table?: string
  ): DatabaseError {
    // Mapear códigos de erro do Postgres
    let code = DatabaseErrorCode.UNKNOWN;
    let message = error.message || 'Database operation failed';

    if (error.code === '23505') {
      code = DatabaseErrorCode.DUPLICATE;
      message = 'Record already exists';
    } else if (error.code === '23503') {
      code = DatabaseErrorCode.CONSTRAINT_VIOLATION;
      message = 'Foreign key constraint violation';
    } else if (error.code === 'PGRST116') {
      code = DatabaseErrorCode.NOT_FOUND;
      message = 'Record not found';
    } else if (error.message?.includes('permission denied')) {
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

  /**
   * Verifica se é erro de registro não encontrado
   */
  isNotFound(): boolean {
    return this.code === DatabaseErrorCode.NOT_FOUND;
  }

  /**
   * Verifica se é erro de duplicação
   */
  isDuplicate(): boolean {
    return this.code === DatabaseErrorCode.DUPLICATE;
  }

  /**
   * Converte para objeto JSON
   */
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

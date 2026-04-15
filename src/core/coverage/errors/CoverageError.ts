import { CoverageErrorCode } from '../types';

export class CoverageError extends Error {
  constructor(
    public code: CoverageErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CoverageError';
    Object.setPrototypeOf(this, CoverageError.prototype);
  }
}

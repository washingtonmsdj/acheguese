import { RolloutErrorCode } from '../types';

export class RolloutError extends Error {
  constructor(
    public code: RolloutErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RolloutError';
    Object.setPrototypeOf(this, RolloutError.prototype);
  }
}

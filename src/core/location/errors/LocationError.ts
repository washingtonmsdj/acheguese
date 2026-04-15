import { LocationErrorCode } from '../types';

export class LocationError extends Error {
  constructor(
    public code: LocationErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LocationError';
    Object.setPrototypeOf(this, LocationError.prototype);
  }
}

export type LogStatus = 'success' | 'error' | 'info';

export interface ValidationLog {
  timestamp: string;
  action: string;
  status: LogStatus;
  message: string;
}

export interface ProfileSummary {
  id: string;
  fullName: string | null;
  profileType: string | null;
}

export interface DriverDataSummary {
  profile_id: string;
  can_do_delivery: boolean | null;
  can_do_rides: boolean | null;
  is_online: boolean | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  subscription_active: boolean | null;
}

export interface RideSummary {
  id: string;
  status: string;
  ride_mode: string | null;
  driver_profile_id: string | null;
  recipient_name: string | null;
  package_size: string | null;
  created_at: string;
}

export interface RideAuditEntry {
  id: string;
  fromState: string | null;
  toState: string | null;
  reason: string | null;
  changedBy: string | null;
  changedAt: string | null;
}

export interface VerificationEntry {
  id: string;
  status: string;
  isRequired: boolean;
  attempts: number;
  createdAt: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
}

export interface GenericDbRow {
  [key: string]: unknown;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return 'Unknown error';
}

export function parseBoolean(value: unknown): boolean {
  return value === true;
}

export function toRideSummary(row: unknown): RideSummary | null {
  const typed = row as GenericDbRow;
  if (typeof typed.id !== 'string' || typeof typed.status !== 'string') {
    return null;
  }

  return {
    id: typed.id,
    status: typed.status,
    ride_mode: typeof typed.ride_mode === 'string' ? typed.ride_mode : null,
    driver_profile_id: typeof typed.driver_profile_id === 'string' ? typed.driver_profile_id : null,
    recipient_name: typeof typed.recipient_name === 'string' ? typed.recipient_name : null,
    package_size: typeof typed.package_size === 'string' ? typed.package_size : null,
    created_at: typeof typed.created_at === 'string' ? typed.created_at : new Date(0).toISOString(),
  };
}

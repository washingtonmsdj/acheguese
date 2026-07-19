export interface SupabaseBackupListPayload {
  backups: Array<Record<string, unknown>>;
  pitr_enabled?: boolean;
  region?: string;
  walg_enabled?: boolean;
}

export interface SupabaseBackupReadiness {
  backupCount: number;
  checkedAt: string;
  completedBackupCount: number;
  latestBackupAgeHours: number | null;
  latestBackupAt: string | null;
  pitrEnabled: boolean;
  projectRef: string;
  ready: boolean;
  region: string | null;
  walgEnabled: boolean;
}

export const MAX_COMPLETED_BACKUP_AGE_HOURS: number;

export function parseArguments(args: string[]): {
  json: boolean;
  projectRef?: string;
  requireRestorable: boolean;
};

export function validateProjectRef(projectRef: string): void;

export function parseSupabaseBackupListJson(
  output: unknown,
): SupabaseBackupListPayload;

export function evaluateBackupReadiness(
  payload: SupabaseBackupListPayload,
  projectRef: string,
  checkedAt?: Date,
): SupabaseBackupReadiness;

export function getSupabaseBackupReadiness(
  projectRef: string,
): SupabaseBackupReadiness;

export interface PrivateAlphaReadinessBlocker {
  area: string;
  code: string;
  command: string;
}

export interface PrivateAlphaReadinessSummary {
  blockers: PrivateAlphaReadinessBlocker[];
  checkedAt: string;
  containment: {
    activeInvites: number | null;
    admissionsEnabled: boolean | null;
    closed: boolean;
  };
  ready: boolean;
}

export function summarizePrivateAlphaReadiness(parts: {
  admission?: Record<string, unknown>;
  auth?: Record<string, unknown>;
  backup?: Record<string, unknown>;
  email?: Record<string, unknown>;
}): PrivateAlphaReadinessSummary;

export function auditPrivateAlphaReadiness(): Promise<Record<string, unknown>>;

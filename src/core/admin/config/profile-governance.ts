export const ADMIN_PROFILE_PERMISSION_GOVERNANCE_STATUS = {
  ACTIVE: 'active',
  LIMITED: 'limited',
  BLOCKED: 'blocked',
} as const;

export type AdminProfilePermissionGovernanceStatus =
  (typeof ADMIN_PROFILE_PERMISSION_GOVERNANCE_STATUS)[keyof typeof ADMIN_PROFILE_PERMISSION_GOVERNANCE_STATUS];

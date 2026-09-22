// Shared access contract used by the canonical Business dashboard guards.

export interface AccessPermissions {
  isMember: boolean;
  isAdmin: boolean;
  hasAccess: boolean;
  role?: string;
}

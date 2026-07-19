export interface SupabaseAuthReadiness {
  checkedAt: string;
  checkedUsers: number;
  failedPage: number | null;
  failureCode: string | null;
  permanentUsersWithoutIdentity: number;
  ready: boolean;
  reportedTotal: number | null;
}

export interface SupabaseAuthAdminClient {
  auth: {
    admin: {
      listUsers(options: { page: number; perPage: number }): Promise<{
        data?: { total?: number; users?: unknown[] } | null;
        error?: unknown;
      }>;
    };
  };
}

export function auditSupabaseAuthReadiness(
  admin: SupabaseAuthAdminClient,
  options?: { maxUsers?: number; pageSize?: number },
): Promise<SupabaseAuthReadiness>;

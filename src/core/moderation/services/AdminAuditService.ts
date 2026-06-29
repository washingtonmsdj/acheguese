/**
 * AdminAuditService - SSOT v2.0
 *
 * Domain service for admin audit logs.
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | Record<string, unknown>[]): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type AdminAuditDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const adminAuditDb = supabase as unknown as AdminAuditDbClient;

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface CreateAdminAuditLogData {
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: string;
}

class AdminAuditService {
  private readonly table = "admin_audit_logs";

  async getAllAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
    try {
      const { data, error } = await adminAuditDb
        .from<AdminAuditLog>(this.table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAuditService",
        action: "getAllAuditLogs",
      });
      logger.error("Erro ao buscar audit logs", error);
      return [];
    }
  }

  async getAdminAuditLogs(adminId: string, limit = 100): Promise<AdminAuditLog[]> {
    try {
      const { data, error } = await adminAuditDb
        .from<AdminAuditLog>(this.table)
        .select("*")
        .eq("admin_id", adminId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAuditService",
        action: "getAdminAuditLogs",
        metadata: { adminId },
      });
      logger.error("Erro ao buscar audit logs do admin", error);
      return [];
    }
  }

  async createAuditLog(data: CreateAdminAuditLogData): Promise<AdminAuditLog> {
    try {
      const { data: auditLog, error } = await adminAuditDb
        .from<AdminAuditLog>(this.table)
        .insert({ ...data })
        .select()
        .single();

      if (error) throw error;

      logger.info(`Audit log criado por admin ${data.admin_id}: ${data.action_type}`);
      return auditLog;
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAuditService",
        action: "createAuditLog",
        metadata: { data },
      });
      logger.error("Erro ao criar audit log", error);
      throw error;
    }
  }
}

export const adminAuditService = new AdminAuditService();

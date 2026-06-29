/**
 * UserWarningsService - SSOT v2.0
 *
 * Domain service for user warnings.
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

type UserWarningsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const userWarningsDb = supabase as unknown as UserWarningsDbClient;

export interface UserWarning {
  id: string;
  user_id: string;
  admin_id: string;
  tipo: "advertencia" | "suspensao_7d" | "suspensao_permanente";
  motivo: string;
  created_at: string;
}

export interface CreateUserWarningData {
  user_id: string;
  admin_id: string;
  tipo: "advertencia" | "suspensao_7d" | "suspensao_permanente";
  motivo: string;
}

class UserWarningsService {
  private readonly table = "user_warnings";

  async getAllWarnings(limit = 1000): Promise<UserWarning[]> {
    try {
      const { data, error } = await userWarningsDb
        .from<UserWarning>(this.table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      trackError(error as Error, {
        component: "UserWarningsService",
        action: "getAllWarnings",
      });
      logger.error("Erro ao buscar warnings", error);
      return [];
    }
  }

  async getUserWarnings(userId: string): Promise<UserWarning[]> {
    try {
      const { data, error } = await userWarningsDb
        .from<UserWarning>(this.table)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      trackError(error as Error, {
        component: "UserWarningsService",
        action: "getUserWarnings",
        metadata: { userId },
      });
      logger.error("Erro ao buscar warnings do usuario", error);
      return [];
    }
  }

  async createWarning(data: CreateUserWarningData): Promise<UserWarning> {
    try {
      const { data: warning, error } = await userWarningsDb
        .from<UserWarning>(this.table)
        .insert({ ...data })
        .select()
        .single();

      if (error) throw error;

      logger.info(`Warning criado para usuario ${data.user_id} por admin ${data.admin_id}`);
      return warning;
    } catch (error) {
      trackError(error as Error, {
        component: "UserWarningsService",
        action: "createWarning",
        metadata: { data },
      });
      logger.error("Erro ao criar warning", error);
      throw error;
    }
  }

  async getUserWarningCount(userId: string): Promise<number> {
    try {
      const { count, error } = await userWarningsDb
        .from<UserWarning>(this.table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      trackError(error as Error, {
        component: "UserWarningsService",
        action: "getUserWarningCount",
        metadata: { userId },
      });
      logger.error("Erro ao contar warnings do usuario", error);
      return 0;
    }
  }
}

export const userWarningsService = new UserWarningsService();

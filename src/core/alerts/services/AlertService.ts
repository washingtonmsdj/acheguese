/**
 * 🚨 AlertService — SSOT canônico de alertas comunitários com expiração automática
 */

import { supabase } from "@/integrations/supabase";
import { ALERT_STATUS } from "@/shared/types/constants";

type ErrorLike = {
  code?: string | null;
  message?: string | null;
};

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike | null;
};

type RpcPayload<TValue> = {
  data: TValue | null;
  error: ErrorLike | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  eq(column: string, value: unknown): TableClient<TRow>;
  insert(values: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>): TableClient<TRow>;
  limit(value: number): TableClient<TRow>;
  order(column: string, options?: { ascending?: boolean }): TableClient<TRow>;
  select(columns?: string): TableClient<TRow>;
  single(): Promise<SingleQueryPayload<TRow>>;
  update(values: Record<string, unknown>): TableClient<TRow>;
};

type AlertDbClient = {
  from<TRow>(table: string): TableClient<TRow>;
  rpc<TValue>(fn: string, params?: Record<string, unknown>): Promise<RpcPayload<TValue>>;
};

type AlertRow = {
  [key: string]: unknown;
  city: string;
  created_at: string;
  description: string;
  id: string;
  neighborhood: string | null;
  profile_id: string;
  status: string;
  street: string | null;
  title: string;
  type: string;
};

type AlertInsert = {
  city: string;
  description: string;
  expires_at: string;
  neighborhood?: string;
  profile_id: string;
  status: AlertStatus;
  street?: string;
  title: string;
  type: string;
};

type AlertUpdate = {
  status: AlertStatus;
};

const alertDb = supabase as unknown as AlertDbClient;

function mapAlertRow(row: AlertRow): Alert {
  return {
    ...row,
    neighborhood: row.neighborhood ?? undefined,
    status: row.status as AlertStatus,
    street: row.street ?? undefined,
  };
}

type AlertStatus = "active" | "resolved" | "expired";

interface Alert {
  [key: string]: unknown;
  id: string;
  profile_id: string;
  type: string;
  title: string;
  description: string;
  city: string;
  neighborhood?: string;
  street?: string;
  status: AlertStatus;
}

interface CreateAlertData {
  type: string;
  title: string;
  description: string;
  city: string;
  neighborhood?: string;
  street?: string;
}

class AlertError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AlertError";
  }
}

interface GetAlertsParams {
  city: string;
  neighborhood?: string;
  street?: string;
  status?: AlertStatus;
  limit?: number;
}

class AlertService {
  private readonly db = alertDb;
  /**
   * Cria um novo alerta (auto-define expires_at para 30 dias)
   */
  async createAlert(profileId: string, date: CreateAlertData): Promise<Alert> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const payload: AlertInsert = {
        city: date.city,
        description: date.description,
        expires_at: expiresAt.toISOString(),
        neighborhood: date.neighborhood,
        profile_id: profileId,
        status: ALERT_STATUS.ACTIVE,
        street: date.street,
        title: date.title,
        type: date.type,
      };

      const { data: alert, error } = await this.db
        .from<AlertRow>("alerts")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw new AlertError(error.message, error.code || "CREATE_FAILED");
      }

      return mapAlertRow(alert);
    } catch (error) {
      if (error instanceof AlertError) throw error;
      throw new AlertError("Unexpected error creating alert", "UNKNOWN_ERROR");
    }
  }

  /**
   * Busca alertas com filtro de localização (apenas actives por padrão)
   */
  async getAlerts(params: GetAlertsParams): Promise<Alert[]> {
    try {
      let query = this.db
        .from<AlertRow>("alerts")
        .select("*")
        .eq("city", params.city)
        .eq("status", params.status || ALERT_STATUS.ACTIVE)
        .order("created_at", { ascending: false });

      if (params.neighborhood) {
        query = query.eq("neighborhood", params.neighborhood);
      }

      if (params.street) {
        query = query.eq("street", params.street);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new AlertError(error.message, error.code || "FETCH_FAILED");
      }

      return (data || []).map(mapAlertRow);
    } catch (error) {
      if (error instanceof AlertError) throw error;
      throw new AlertError("Unexpected error fetching alerts", "UNKNOWN_ERROR");
    }
  }

  /**
   * Confirma um alerta (incrementa confirmations_count)
   * ✅ SSOT - Usa counter no próprio alerta, não tabela separada
   */
  async confirmAlert(alertId: string, profileId: string): Promise<void> {
    try {
      // Incrementa o contador de confirmações
      const { error } = await this.db.rpc<boolean>("increment_alert_confirmations", {
        alert_id: alertId,
      });

      if (error) {
        throw new AlertError(error.message, error.code || "CONFIRM_FAILED");
      }
    } catch (error) {
      if (error instanceof AlertError) throw error;
      throw new AlertError(
        "Unexpected error confirming alert",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Remove confirmação de um alerta
   * ✅ SSOT - Decrementa counter no próprio alerta
   */
  async unconfirmAlert(alertId: string, profileId: string): Promise<void> {
    try {
      // Decrementa o contador de confirmações
      const { error } = await this.db.rpc<boolean>("decrement_alert_confirmations", {
        alert_id: alertId,
      });

      if (error) {
        throw new AlertError(error.message, error.code || "UNCONFIRM_FAILED");
      }
    } catch (error) {
      if (error instanceof AlertError) throw error;
      throw new AlertError(
        "Unexpected error unconfirming alert",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Marca alerta como resolvido
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const payload: AlertUpdate = { status: ALERT_STATUS.RESOLVED };
      const { error } = await this.db
        .from<AlertRow>("alerts")
        .update(payload)
        .eq("id", alertId);

      if (error) {
        throw new AlertError(error.message, error.code || "RESOLVE_FAILED");
      }
    } catch (error) {
      if (error instanceof AlertError) throw error;
      throw new AlertError("Unexpected error resolving alert", "UNKNOWN_ERROR");
    }
  }

  /**
   * Busca alertas expirados (para histórico)
   */
  async getExpiredAlerts(params: GetAlertsParams): Promise<Alert[]> {
    return this.getAlerts({ ...params, status: "expired" });
  }
}

export const alertService = new AlertService();

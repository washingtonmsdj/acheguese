/**
 * Alert Service
 *
 * Gerencia alertas da comunidade com expiração automática
 */

import { supabase } from "@/integrations/supabase";
import type {
  Alert,
  CreateAlertData,
  AlertStatus,
} from "../../../services/alert/types";
import { AlertError } from "../../../services/alert/types";
import { ALERT_STATUS } from "@/shared/types/constants";
interface GetAlertsParams {
  city: string;
  neighborhood?: string;
  street?: string;
  status?: AlertStatus;
  limit?: number;
}

class AlertService {
  /**
   * Cria um novo alerta (auto-define expires_at para 30 dias)
   */
  async createAlert(profileId: string, date: CreateAlertData): Promise<Alert> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: alert, error } = await (supabase as any)
        .from("alerts")
        .insert({
          profile_id: profileId,
          type: date.type,
          title: date.title,
          description: date.description,
          city: date.city,
          neighborhood: date.neighborhood,
          street: date.street,
          status: ALERT_STATUS.ACTIVE,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new AlertError(error.message, error.code || "CREATE_FAILED");
      }

      return alert;
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
      let query = (supabase as any)
        .from("alerts")
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

      return data || [];
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
      const { error } = await (supabase as any).rpc("increment_alert_confirmations", {
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
      const { error } = await (supabase as any).rpc("decrement_alert_confirmations", {
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
      const { error } = await (supabase as any)
        .from("alerts")
        .update({ status: ALERT_STATUS.RESOLVED })
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

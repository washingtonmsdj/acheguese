// @ts-nocheck
/**
 * CommunityAlertService — SSOT de toda lógica de alertas comunitários
 *
 * REGRAS:
 * - ZERO acesso direto ao banco fora deste service
 * - Criação SEMPRE via RPC (create_community_alert)
 * - Hooks apenas fazem fetch/loading/error
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type {
  CommunityAlertPublic,
  CreateAlertPayload,
  UpdateAlertPayload,
  AlertFeedFilters,
  AlertRpcResult,
} from "../domain/types";

class CommunityAlertServiceClass {
  private readonly VIEW = "community_alerts_public";
  private readonly TABLE = "community_alerts";

  async getCountByProfile(profileId: string): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from(this.TABLE)
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profileId);

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error("CommunityAlertService.getCountByProfile", error);
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // LEITURA
  // --------------------------------------------------------------------------

  /**
   * Busca alertas ativos para o feed, filtrados por região.
   * Usa a view pública — campos sensíveis nunca expostos.
   */
  async getAlerts(filters: AlertFeedFilters): Promise<CommunityAlertPublic[]> {
    try {
      let query = (supabase as any)
        .from(this.VIEW)
        .select("*")
        .eq("city", filters.city)
        .order("created_at", { ascending: false });

      if (filters.neighborhood) {
        query = query.eq("neighborhood_display", filters.neighborhood);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as CommunityAlertPublic[]) ?? [];
    } catch (error) {
      logger.error("CommunityAlertService.getAlerts", error);
      return [];
    }
  }

  /**
   * Busca um alerta específico pelo ID (projeção pública).
   */
  async getAlertById(alertId: string): Promise<CommunityAlertPublic | null> {
    try {
      const { data, error } = await (supabase as any)
        .from(this.VIEW)
        .select("*")
        .eq("id", alertId)
        .maybeSingle();

      if (error) throw error;
      return data as CommunityAlertPublic | null;
    } catch (error) {
      logger.error("CommunityAlertService.getAlertById", error);
      return null;
    }
  }

  /**
   * Busca alertas criados por um perfil especifico.
   * Usado pelo workspace privado do perfil.
   */
  async getAlertsByProfile(
    profileId: string,
    limit = 20,
  ): Promise<CommunityAlertPublic[]> {
    try {
      const { data, error } = await (supabase as any)
        .from(this.TABLE)
        .select(`
          id,
          author_profile_id,
          category,
          status,
          neighborhood,
          neighborhood_display,
          city,
          description,
          seen_personally,
          started_at_approx,
          is_happening_now,
          still_risky,
          expires_at,
          report_count,
          edit_count,
          created_at,
          updated_at,
          ended_at
        `)
        .eq("author_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as CommunityAlertPublic[]) ?? [];
    } catch (error) {
      logger.error("CommunityAlertService.getAlertsByProfile", error);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // CRIAÇÃO (via RPC — INSERT direto bloqueado por RLS)
  // --------------------------------------------------------------------------

  /**
   * Cria um alerta via RPC server-side.
   * A RPC valida elegibilidade, termos proibidos, rate limit e deduplicação.
   */
  async createAlert(payload: CreateAlertPayload): Promise<AlertRpcResult> {
    try {
      const { data, error } = await (supabase as any).rpc(
        "create_community_alert",
        { payload }
      );

      if (error) {
        logger.error("CommunityAlertService.createAlert RPC error", error);
        return { error: "internal_error", detail: error.message };
      }

      return data as AlertRpcResult;
    } catch (error: any) {
      logger.error("CommunityAlertService.createAlert", error);
      return { error: "internal_error", detail: error.message };
    }
  }

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO (apenas autor, apenas campos permitidos)
  // --------------------------------------------------------------------------

  /**
   * Atualiza campos editáveis de um alerta.
   * RLS garante que apenas o autor pode atualizar.
   */
  async updateAlert(
    alertId: string,
    payload: UpdateAlertPayload
  ): Promise<boolean> {
    try {
      // Incrementa edit_count via RPC separada para evitar conflito com .update()
      const { error: rpcError } = await (supabase as any).rpc(
        "increment_alert_edit_count",
        { p_alert_id: alertId }
      );
      if (rpcError) throw rpcError;

      const { error } = await (supabase as any)
        .from(this.TABLE)
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", alertId)
        .eq("status", "ativo");

      if (error) throw error;

      await this._auditLog(alertId, "updated", payload as Record<string, unknown>);

      return true;
    } catch (error) {
      logger.error("CommunityAlertService.updateAlert", error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // ENCERRAMENTO (autor ou moderador)
  // --------------------------------------------------------------------------

  /**
   * Encerra um alerta manualmente.
   */
  async endAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from(this.TABLE)
        .update({
          status: "encerrado",
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", alertId)
        .eq("status", "ativo");

      if (error) throw error;

      await this._auditLog(alertId, "ended", {});

      return true;
    } catch (error) {
      logger.error("CommunityAlertService.endAlert", error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // REMOÇÃO (apenas moderador — via função SECURITY DEFINER futura)
  // --------------------------------------------------------------------------

  /**
   * Remove um alerta por moderação.
   * Registra motivo e audit log.
   */
  async removeAlert(alertId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from(this.TABLE)
        .update({
          status: "removido",
          removed_at: new Date().toISOString(),
          removal_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;

      await this._auditLog(alertId, "removed", { reason });

      return true;
    } catch (error) {
      logger.error("CommunityAlertService.removeAlert", error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // AUDIT LOG (interno)
  // --------------------------------------------------------------------------

  private async _auditLog(
    alertId: string,
    action: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) return;

      await (supabase as any).from("community_alert_audit").insert({
        alert_id: alertId,
        actor_id: user.id,
        action_type: action,
        metadata,
      });
    } catch (error) {
      // Audit log nunca deve quebrar o fluxo principal
      logger.error("CommunityAlertService._auditLog", error);
    }
  }

  // --------------------------------------------------------------------------
  // BUSCA GEOGRÁFICA
  // --------------------------------------------------------------------------

  /**
   * Busca alertas dentro de um bounding box geográfico.
   * Requer que os alertas tenham latitude/longitude preenchidos (migration 20260403000002).
   *
   * @param bounds [west, south, east, north]
   * @param options.limit Parâmetro operacional — revisar após medir volume real por bounds típico
   */
  async getByBounds(
    bounds: [number, number, number, number],
    options: { limit?: number; territoryFilter?: import('@/core/location/types').TerritoryFilter } = {}
  ): Promise<CommunityAlertPublic[]> {
    const [west, south, east, north] = bounds;
    const { limit = 200, territoryFilter } = options;

    try {
      let query = (supabase as any)
        .from(this.VIEW)
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('latitude', south)
        .lte('latitude', north)
        .gte('longitude', west)
        .lte('longitude', east)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Aplicar filtro territorial quando disponível
      if (territoryFilter) {
        const { applyTerritoryFilter } = await import('@/core/location/utils/applyTerritoryFilter');
        query = applyTerritoryFilter(query, territoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as CommunityAlertPublic[]) ?? [];
    } catch (error) {
      logger.error("CommunityAlertService.getByBounds", error);
      return [];
    }
  }
}

export const communityAlertService = new CommunityAlertServiceClass();

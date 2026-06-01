/**
 * CommunityIssueService — SSOT de toda lógica de problemas urbanos
 *
 * REGRAS:
 * - ZERO acesso direto ao banco fora deste service
 * - Criação SEMPRE via RPC (create_community_issue)
 * - Hooks apenas fazem fetch/loading/error
 * - Este service não conhece alertas nem posts
 */

import { supabase } from "@/integrations/supabase";
import { callRPC } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { TerritoryFilter } from "@/core/location/types";
import { SessionService } from "@/core/session/services/SessionService";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { Json } from "@/integrations/supabase";
import type {
  CommunityIssuePublic,
  CreateIssuePayload,
  UpdateIssuePayload,
  IssueFeedFilters,
  IssueRpcResult,
  CreateIssueReportPayload,
} from "../domain/types";

class CommunityIssueServiceClass {
  private readonly VIEW = "community_issues_public";
  private readonly TABLE = "community_issues";
  private readonly DB_SELECT = `
    id,
    author_profile_id,
    location_id,
    category,
    status,
    priority,
    title,
    description,
    images,
    neighborhood,
    neighborhood_display,
    city,
    address_reference,
    support_count,
    comments_count,
    report_count,
    resolved_at,
    created_at,
    updated_at
  `;

  async getCountByProfile(profileId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.TABLE)
        .select("id", { count: "exact", head: true })
        .eq("author_profile_id", profileId);

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error("CommunityIssueService.getCountByProfile", error);
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // LEITURA
  // --------------------------------------------------------------------------

  /**
   * Busca problemas ativos para o feed, filtrados por território.
   */
  async getIssues(filters: IssueFeedFilters): Promise<CommunityIssuePublic[]> {
    try {
      let query = supabase
        .from(this.TABLE)
        .select(this.DB_SELECT)
        .order("created_at", { ascending: false });

      if (filters.location_id) {
        query = query.eq("location_id", filters.location_id);
      } else if (filters.location_ids && filters.location_ids.length > 0) {
        query = query.in("location_id", filters.location_ids);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as unknown as CommunityIssuePublic[]) ?? [];
    } catch (error) {
      logger.error("CommunityIssueService.getIssues", error);
      return [];
    }
  }

  async getByTerritory(
    territoryFilter: TerritoryFilter,
    options: { category?: IssueFeedFilters["category"]; status?: IssueFeedFilters["status"]; limit?: number } = {}
  ): Promise<CommunityIssuePublic[]> {
    const { category, status, limit } = options;
    const filters: IssueFeedFilters = { category, status, limit };

    if (territoryFilter.scope === "location") {
      filters.location_id = territoryFilter.location_id;
    } else if (territoryFilter.scope === "group") {
      filters.location_ids = territoryFilter.location_ids;
    } else {
      return [];
    }

    return this.getIssues(filters);
  }

  /**
   * Busca um problema específico pelo ID (projeção pública).
   */
  async getIssueById(issueId: string): Promise<CommunityIssuePublic | null> {
    try {
      const { data, error } = await supabase
        .from(this.VIEW)
        .select("*")
        .eq("id", issueId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as CommunityIssuePublic | null;
    } catch (error) {
      logger.error("CommunityIssueService.getIssueById", error);
      return null;
    }
  }

  /**
   * Busca problemas por profile (para página de perfil).
   */
  async getIssuesByProfile(profileId: string, limit = 20): Promise<CommunityIssuePublic[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(this.DB_SELECT)
        .eq("author_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as unknown as CommunityIssuePublic[]) ?? [];
    } catch (error) {
      logger.error("CommunityIssueService.getIssuesByProfile", error);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // CRIAÇÃO (via RPC — INSERT direto bloqueado por RLS)
  // --------------------------------------------------------------------------

  /**
   * Cria um problema urbano via RPC server-side.
   * A RPC valida elegibilidade, rate limit e deduplicação.
   */
  async createIssue(payload: CreateIssuePayload): Promise<IssueRpcResult> {
    try {
      const { data, error } = await callRPC<IssueRpcResult>("create_community_issue", {
        payload: payload as unknown as Json,
      });

      if (error) {
        logger.error("CommunityIssueService.createIssue RPC error", error);
        return { error: "internal_error", detail: String(error) };
      }

      return data ?? { error: "internal_error" };
    } catch (error) {
      logger.error("CommunityIssueService.createIssue", error);
      return { error: "internal_error", detail: String(error) };
    }
  }

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO (apenas autor, apenas campos permitidos)
  // --------------------------------------------------------------------------

  /**
   * Atualiza campos editáveis de um problema.
   * RLS garante que apenas o autor pode atualizar.
   */
  async updateIssue(issueId: string, payload: UpdateIssuePayload): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", issueId)
        .in("status", ["aberto", "em_analise"]);

      if (error) throw error;

      await this._auditLog(issueId, "updated", payload as Record<string, unknown>);
      return true;
    } catch (error) {
      logger.error("CommunityIssueService.updateIssue", error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // SUPORTE (upvote)
  // --------------------------------------------------------------------------

  /**
   * Registra apoio de um perfil a um problema.
   * Incremento do contador via trigger no banco.
   */
  async supportIssue(issueId: string, profileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("community_issue_supports")
        .insert({ issue_id: issueId, profile_id: profileId });

      if (error) throw error;

      await this._auditLog(issueId, "supported", { profile_id: profileId });
      return true;
    } catch (error) {
      logger.error("CommunityIssueService.supportIssue", error);
      return false;
    }
  }

  /**
   * Remove apoio de um perfil a um problema.
   */
  async unsupportIssue(issueId: string, profileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("community_issue_supports")
        .delete()
        .eq("issue_id", issueId)
        .eq("profile_id", profileId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("CommunityIssueService.unsupportIssue", error);
      return false;
    }
  }

  /**
   * Verifica se um perfil já apoia um problema.
   */
  async isSupporting(issueId: string, profileId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("community_issue_supports")
        .select("id")
        .eq("issue_id", issueId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch (error) {
      logger.error("CommunityIssueService.isSupporting", error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // REPORT (denúncia de abuso)
  // --------------------------------------------------------------------------

  /**
   * Registra denúncia de abuso em um problema.
   * Moderação é tratada por core/moderation.
   */
  async reportIssue(payload: CreateIssueReportPayload): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) return false;
      const profileId = await this._getActiveProfileIdByUserId(user.id);
      if (!profileId) return false;

      const { error } = await supabase
        .from("community_issue_reports")
        .insert({
          issue_id: payload.issue_id,
          profile_id: profileId,
          reason: payload.reason,
        });

      if (error) throw error;

      await this._auditLog(payload.issue_id, "reported", { reason: payload.reason });
      return true;
    } catch (error) {
      logger.error("CommunityIssueService.reportIssue", error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // AUDIT LOG (interno)
  // --------------------------------------------------------------------------

  private async _auditLog(
    issueId: string,
    action: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) return;

      await supabase.from("community_issue_audit").insert({
        issue_id: issueId,
        actor_id: user.id,
        action,
        metadata: metadata as Json,
      });
    } catch (error) {
      // Audit log nunca deve quebrar o fluxo principal
      logger.error("CommunityIssueService._auditLog", error);
    }
  }

  private async _getActiveProfileIdByUserId(userId: string): Promise<string | null> {
    try {
      const profile = await profileService.getActiveProfile(userId);
      return profile?.id ?? null;
    } catch (error) {
      logger.error("CommunityIssueService._getActiveProfileIdByUserId", error);
      return null;
    }
  }
}

export const communityIssueService = new CommunityIssueServiceClass();

// @ts-nocheck
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
import { logger } from "@/shared/utils/logger";
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

  async getCountByProfile(profileId: string): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
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
   * Busca problemas ativos para o feed, filtrados por região.
   * 
   * NOTA TEMPORÁRIA: Filtros territoriais (city/neighborhood) removidos
   * até implementação completa da resolução location_id via LocationService.
   * Por ora, retorna todos os issues filtrados apenas por categoria/status.
   */
  async getIssues(filters: IssueFeedFilters): Promise<CommunityIssuePublic[]> {
    try {
      let query = (supabase as any)
        .from(this.TABLE)
        .select(`
          id,
          profile_id:author_profile_id,
          title,
          description,
          category,
          status,
          location_id,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false });

      // Filtrar por location_id se fornecido explicitamente
      if (filters.location_id) {
        query = query.eq("location_id", filters.location_id);
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

      return (data as CommunityIssuePublic[]) ?? [];
    } catch (error) {
      logger.error("CommunityIssueService.getIssues", error);
      return [];
    }
  }

  /**
   * Busca um problema específico pelo ID (projeção pública).
   */
  async getIssueById(issueId: string): Promise<CommunityIssuePublic | null> {
    try {
      const { data, error } = await (supabase as any)
        .from(this.VIEW)
        .select("*")
        .eq("id", issueId)
        .maybeSingle();

      if (error) throw error;
      return data as CommunityIssuePublic | null;
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
      const { data, error } = await (supabase as any)
        .from(this.TABLE)
        .select(`
          id,
          author_profile_id,
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
        `)
        .eq("author_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as CommunityIssuePublic[]) ?? [];
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
      const { data, error } = await (supabase as any).rpc(
        "create_community_issue",
        { payload }
      );

      if (error) {
        logger.error("CommunityIssueService.createIssue RPC error", error);
        return { error: "internal_error", detail: error.message };
      }

      return data as IssueRpcResult;
    } catch (error: any) {
      logger.error("CommunityIssueService.createIssue", error);
      return { error: "internal_error", detail: error.message };
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
      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any)
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
      const { data, error } = await (supabase as any)
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
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) return false;

      const { error } = await (supabase as any)
        .from("community_issue_reports")
        .insert({
          issue_id: payload.issue_id,
          reporter_profile_id: user.id,
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
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) return;

      await (supabase as any).from("community_issue_audit").insert({
        issue_id: issueId,
        actor_id: user.id,
        action_type: action,
        metadata,
      });
    } catch (error) {
      // Audit log nunca deve quebrar o fluxo principal
      logger.error("CommunityIssueService._auditLog", error);
    }
  }
}

export const communityIssueService = new CommunityIssueServiceClass();

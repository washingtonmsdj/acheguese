import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { AdminSupabaseClient, CommunityIssue, ProfessionalReport, ProfessionalData } from "../types/adminDatabase.types";
import { MobilityAdminQueryService } from "@/core/admin/services/MobilityAdminQueryService";
import { profileService } from "@/core/profiles/services/ProfileService";

export interface ModerationStats {
  total_posts: number;
  pending_posts: number;
  approved_posts: number;
  rejected_posts: number;
  flagged_posts: number;
  total_flags: number;
  posts_with_flags: number;
}

export interface CommunityPost {
  id: string;
  author_profile_id: string;
  author_name: string;
  author_neighborhood: string;
  content: string;
  intent: "offering" | "requesting";
  destination: string;
  moderation_status: "pending" | "approved" | "rejected" | "flagged";
  flag_count: number;
  interested_count: number;
  created_at: string;
  moderated_at?: string;
  moderation_reason?: string;
}

export interface PostFlag {
  id: string;
  reason: string;
  description?: string;
  flagged_by_name: string;
  created_at: string;
}

class AdminCommunityService {
  private readonly db = supabase as any;

  async getModerationStats(): Promise<ModerationStats | null> {
    try {
      const { data, error } = await this.db.rpc("get_moderation_stats");
      if (error) throw error;
      const rows = data as ModerationStats[] | null;
      if (!rows || rows.length === 0) return null;
      return rows[0] || null;
    } catch (error) {
      logger.error("Error fetching moderation stats", error as Error);
      throw error;
    }
  }

  async getCommunityPosts(
    filter?: "pending" | "approved" | "rejected" | "flagged",
  ): Promise<CommunityPost[]> {
    try {

      // ✅ Delegado para MobilityAdminQueryService
      const data = await MobilityAdminQueryService.getCommunityPosts(filter);

      const authorIds = [...new Set(data.map((p) => p.author_profile_id))] as string[];
      const profiles = await profileService.getProfilesSummaryExtended(authorIds);
      const profilesMap = new Map(profiles.map((p) => [p.id, p]));

      return data.map((p) => {
        const profile = profilesMap.get(p.author_profile_id);
        return {
          id: p.id,
          author_profile_id: p.author_profile_id,
          author_name: profile?.name || "Usuário",
          author_neighborhood: profile?.neighborhood || "",
          content: p.content,
          intent: p.intent as "offering" | "requesting",
          destination: p.destination,
          moderation_status: p.moderation_status as CommunityPost["moderation_status"],
          flag_count: p.flag_count,
          interested_count: p.interested_count,
          created_at: p.created_at,
          moderated_at: p.moderated_at,
          moderation_reason: p.moderation_reason,
        };
      });
    } catch (error) {
      logger.error("Error fetching community posts", error as Error);
      throw error;
    }
  }

  async getPostFlags(postId: string): Promise<PostFlag[]> {
    try {

      // ✅ Delegado para MobilityAdminQueryService
      const data = await MobilityAdminQueryService.getPostFlags(postId);

      const flaggedByIds = [...new Set(data.map((f) => f.flagged_by))] as string[];
      const profiles = await profileService.getProfilesSummary(flaggedByIds);
      const profilesMap = new Map(profiles.map((p) => [p.id, p]));

      return data.map((f) => ({
        id: f.id,
        reason: f.reason,
        description: f.description,
        flagged_by_name: profilesMap.get(f.flagged_by)?.name || "Usuário",
        created_at: f.created_at,
      }));
    } catch (error) {
      logger.error("Error fetching post flags", error as Error);
      throw error;
    }
  }

  async getCivicReports(status: string): Promise<(CommunityIssue & { reporter_name: string; is_critical: boolean; supporters_count: number })[]> {
    try {
      const { data, error } = await (this.db as unknown as AdminSupabaseClient)
        .from("community_issues")
        .select(`*, profiles!community_issues_profile_id_fkey(name)`)
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        ...(r as unknown as CommunityIssue),
        reporter_name: r.profiles?.name || "Anônimo",
        is_critical: false,
        supporters_count: 0,
      }));
    } catch (error) {
      logger.error("Error fetching civic reports", error as Error);
      return [];
    }
  }

  async getCivicReportStats(): Promise<Record<string, number>> {
    try {
      const { data, error } = await (this.db as unknown as AdminSupabaseClient)
        .from("community_issues")
        .select("status");

      if (error) throw error;

      const issues = (data || []) as unknown as CommunityIssue[];

      return {
        total: issues.length || 0,
        pendente: issues.filter((r) => r.status === "open").length || 0,
        em_analise: issues.filter((r) => r.status === "in_progress").length || 0,
        resolvido: issues.filter((r) => r.status === "resolved").length || 0,
        rejeitado: issues.filter((r) => r.status === "closed").length || 0,
        critical: 0,
      };
    } catch (error) {
      logger.error("Error fetching civic report stats", error as Error);
      return {};
    }
  }

  async updateCivicReportStatus(reportId: string, status: CommunityIssue['status']): Promise<void> {
    try {
      const { error } = await this.db
        .from("community_issues")
        .update({ status })
        .eq("id", reportId);

      if (error) throw error;
    } catch (error) {
      logger.error("Error updating civic report status", error as Error);
      throw error;
    }
  }

  async getProfessionalReports(): Promise<ProfessionalReport[]> {
    try {
      const { data, error } = await (this.db as unknown as AdminSupabaseClient)
        .from("professional_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ProfessionalReport[];
    } catch (error) {
      logger.error("Error fetching professional reports", error as Error);
      return [];
    }
  }

  async getAllProfessionals(): Promise<ProfessionalData[]> {
    try {
      const { data, error } = await (this.db as unknown as AdminSupabaseClient)
        .from("professional_data")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ProfessionalData[];
    } catch (error) {
      logger.error("Error fetching professionals", error as Error);
      return [];
    }
  }
}

export const adminCommunityService = new AdminCommunityService();

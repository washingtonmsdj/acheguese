import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { MobilityAdminQueryService } from "@/core/admin/services/MobilityAdminQueryService";
import { profileService } from "@/core/profiles/services/ProfileService";
import type {
  CommunityIssue,
  ProfessionalData,
  ProfessionalReport,
} from "../types/adminDatabase.types";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
};

type AdminCommunityDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: ErrorLike;
  }>;
};

const adminCommunityDb = supabase as unknown as AdminCommunityDbClient;

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

type CivicReportRow = CommunityIssue & {
  profiles?: {
    name?: string | null;
  } | null;
};

type CivicReportView = CommunityIssue & {
  reporter_name: string;
  is_critical: boolean;
  supporters_count: number;
};

class AdminCommunityService {
  private readonly db = adminCommunityDb;

  async getModerationStats(): Promise<ModerationStats | null> {
    try {
      const { data, error } = await this.db.rpc<ModerationStats[]>("get_moderation_stats");
      if (error) throw error;

      const rows = (data as ModerationStats[] | null) ?? [];
      return rows[0] ?? null;
    } catch (error) {
      logger.error("Error fetching moderation stats", error as Error);
      throw error;
    }
  }

  async getCommunityPosts(
    filter?: "pending" | "approved" | "rejected" | "flagged",
  ): Promise<CommunityPost[]> {
    try {
      const data = await MobilityAdminQueryService.getCommunityPosts(filter);

      const authorIds = [...new Set(data.map((post) => post.author_profile_id))];
      const profiles = await profileService.getProfilesSummaryExtended(authorIds);
      const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));

      return data.map((post) => {
        const profile = profilesMap.get(post.author_profile_id);

        return {
          id: post.id,
          author_profile_id: post.author_profile_id,
          author_name: profile?.displayName || "Usuario",
          author_neighborhood: profile?.neighborhood || "",
          content: post.content,
          intent: post.intent as CommunityPost["intent"],
          destination: post.destination,
          moderation_status: post.moderation_status as CommunityPost["moderation_status"],
          flag_count: post.flag_count,
          interested_count: post.interested_count,
          created_at: post.created_at,
          moderated_at: post.moderated_at,
          moderation_reason: post.moderation_reason,
        };
      });
    } catch (error) {
      logger.error("Error fetching community posts", error as Error);
      throw error;
    }
  }

  async getPostFlags(postId: string): Promise<PostFlag[]> {
    try {
      const data = await MobilityAdminQueryService.getPostFlags(postId);

      const flaggedByIds = [...new Set(data.map((flag) => flag.flagged_by))];
      const profiles = await profileService.getProfilesSummary(flaggedByIds);
      const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));

      return data.map((flag) => ({
        id: flag.id,
        reason: flag.reason,
        description: flag.description,
        flagged_by_name: profilesMap.get(flag.flagged_by)?.displayName || "Usuario",
        created_at: flag.created_at,
      }));
    } catch (error) {
      logger.error("Error fetching post flags", error as Error);
      throw error;
    }
  }

  async getCivicReports(status: string): Promise<CivicReportView[]> {
    try {
      const { data, error } = await this.db
        .from<CivicReportRow>("community_issues")
        .select("*, profiles!community_issues_profile_id_fkey(name)")
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data || []) as CivicReportRow[];
      return rows.map((row) => ({
        ...(row as CommunityIssue),
        reporter_name: row.profiles?.name || "Anonimo",
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
      const { data, error } = await this.db.from<CommunityIssue>("community_issues").select("status");
      if (error) throw error;

      const issues = (data || []) as CommunityIssue[];

      return {
        total: issues.length || 0,
        pendente: issues.filter((issue) => issue.status === "open").length || 0,
        em_analise: issues.filter((issue) => issue.status === "in_progress").length || 0,
        resolvido: issues.filter((issue) => issue.status === "resolved").length || 0,
        rejeitado: issues.filter((issue) => issue.status === "closed").length || 0,
        critical: 0,
      };
    } catch (error) {
      logger.error("Error fetching civic report stats", error as Error);
      return {};
    }
  }

  async updateCivicReportStatus(reportId: string, status: CommunityIssue["status"]): Promise<void> {
    try {
      const { error } = await this.db
        .from<CommunityIssue>("community_issues")
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
      const { data, error } = await this.db
        .from<ProfessionalReport>("professional_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProfessionalReport[];
    } catch (error) {
      logger.error("Error fetching professional reports", error as Error);
      return [];
    }
  }

  async getAllProfessionals(): Promise<ProfessionalData[]> {
    try {
      const { data, error } = await this.db
        .from<ProfessionalData>("professional_data")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProfessionalData[];
    } catch (error) {
      logger.error("Error fetching professionals", error as Error);
      return [];
    }
  }
}

export const adminCommunityService = new AdminCommunityService();

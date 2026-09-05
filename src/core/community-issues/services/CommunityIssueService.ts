/**
 * CommunityIssueService - SSOT for civic issue reads and writes.
 *
 * Rules:
 * - No direct database access outside this service.
 * - Writes always go through authenticated database brokers.
 * - Hooks only manage fetch/loading/error state.
 * - This service does not depend on alerts or posts.
 */

import { supabase } from "@/integrations/supabase";
import type { Database, Json } from "@/integrations/supabase";
import type { TerritoryFilter } from "@/core/location/types";
import { logger } from "@/shared/utils/logger";
import type {
  CommunityIssuePublic,
  CreateIssuePayload,
  CreateIssueReportPayload,
  IssueFeedFilters,
  IssueRpcResult,
  IssueSupportToggleResult,
  IssuePriority,
  IssueStatus,
  UpdateIssuePayload,
} from "../domain/types";

type CommunityIssueRow = Pick<
  Database["public"]["Tables"]["community_issues"]["Row"],
  | "id"
  | "author_profile_id"
  | "location_id"
  | "category"
  | "status"
  | "priority"
  | "title"
  | "description"
  | "images"
  | "neighborhood"
  | "neighborhood_display"
  | "city"
  | "address_reference"
  | "support_count"
  | "comments_count"
  | "report_count"
  | "resolved_at"
  | "created_at"
  | "updated_at"
>;

class CommunityIssueServiceClass {
  private readonly TABLE = "community_issues" as const;

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

  async getIssues(filters: IssueFeedFilters): Promise<CommunityIssuePublic[]> {
    try {
      const boundedLimit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
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

      query = query.limit(boundedLimit);

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => this.normalizeIssue(row));
    } catch (error) {
      logger.error("CommunityIssueService.getIssues", error);
      return [];
    }
  }

  async getByTerritory(
    territoryFilter: TerritoryFilter,
    options: {
      category?: IssueFeedFilters["category"];
      status?: IssueFeedFilters["status"];
      limit?: number;
    } = {},
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

  async getIssueById(issueId: string): Promise<CommunityIssuePublic | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(this.DB_SELECT)
        .eq("id", issueId)
        .maybeSingle();

      if (error) throw error;
      return data ? this.normalizeIssue(data) : null;
    } catch (error) {
      logger.error("CommunityIssueService.getIssueById", error);
      return null;
    }
  }

  async getIssuesByProfile(profileId: string, limit = 20): Promise<CommunityIssuePublic[]> {
    try {
      const boundedLimit = Math.min(Math.max(limit, 1), 100);
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(this.DB_SELECT)
        .eq("author_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(boundedLimit);

      if (error) throw error;
      return (data ?? []).map((row) => this.normalizeIssue(row));
    } catch (error) {
      logger.error("CommunityIssueService.getIssuesByProfile", error);
      return [];
    }
  }

  async createIssue(payload: CreateIssuePayload): Promise<IssueRpcResult> {
    try {
      const { data, error } = await supabase.rpc("create_community_issue", {
        payload: payload as unknown as Json,
      });

      if (error) throw error;
      return (data ?? { error: "internal_error" }) as IssueRpcResult;
    } catch (error) {
      logger.error("CommunityIssueService.createIssue", error);
      return { error: "internal_error", detail: String(error) };
    }
  }

  async updateIssue(issueId: string, payload: UpdateIssuePayload): Promise<boolean> {
    return this.mutateIssue("update", issueId, {
      p_title: payload.title,
      p_description: payload.description,
      p_images: payload.images,
      p_address_reference: payload.address_reference,
    });
  }

  async updateStatus(issueId: string, status: IssueStatus): Promise<boolean> {
    return this.mutateIssue("status", issueId, { p_status: status });
  }

  async updatePriority(issueId: string, priority: IssuePriority): Promise<boolean> {
    return this.mutateIssue("priority", issueId, { p_priority: priority });
  }

  async removeIssue(issueId: string, reason: string): Promise<boolean> {
    return this.mutateIssue("remove", issueId, { p_reason: reason });
  }

  async clearUnderReview(issueId: string): Promise<boolean> {
    return this.mutateIssue("clear_review", issueId);
  }

  async toggleIssueSupport(issueId: string): Promise<IssueSupportToggleResult> {
    const { data, error } = await supabase.rpc("toggle_community_issue_support", {
      p_issue_id: issueId,
    });

    if (error) {
      logger.error("CommunityIssueService.toggleIssueSupport", error);
      throw error;
    }

    const result = data as unknown as Partial<IssueSupportToggleResult>;
    if (typeof result.supported !== "boolean" || typeof result.new_count !== "number") {
      throw new Error("invalid_issue_support_response");
    }

    return { supported: result.supported, new_count: result.new_count };
  }

  async isSupporting(issueId: string, profileId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("community_issue_supports")
        .select("id")
        .eq("issue_id", issueId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return Boolean(data);
    } catch (error) {
      logger.error("CommunityIssueService.isSupporting", error);
      return false;
    }
  }

  async reportIssue(payload: CreateIssueReportPayload): Promise<boolean> {
    try {
      const insertData: Database["public"]["Tables"]["community_issue_reports"]["Insert"] = {
        issue_id: payload.issue_id,
        reason: payload.reason,
      };

      const { error } = await supabase.from("community_issue_reports").insert(insertData);
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("CommunityIssueService.reportIssue", error);
      return false;
    }
  }

  private normalizeIssue(row: CommunityIssueRow): CommunityIssuePublic {
    return {
      id: row.id,
      author_profile_id: row.author_profile_id,
      location_id: row.location_id ?? "",
      category: (row.category ?? "outro") as CommunityIssuePublic["category"],
      status: row.status as CommunityIssuePublic["status"],
      priority: row.priority as CommunityIssuePublic["priority"],
      title: row.title,
      description: row.description ?? "",
      images: row.images ?? [],
      neighborhood: row.neighborhood ?? "",
      neighborhood_display: row.neighborhood_display ?? row.neighborhood ?? "",
      city: row.city ?? "",
      address_reference: row.address_reference ?? undefined,
      support_count: row.support_count ?? 0,
      comments_count: row.comments_count ?? 0,
      report_count: row.report_count ?? 0,
      resolved_at: row.resolved_at ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private async mutateIssue(
    action: "update" | "status" | "priority" | "remove" | "clear_review",
    issueId: string,
    params: {
      p_title?: string;
      p_description?: string;
      p_images?: string[];
      p_address_reference?: string;
      p_status?: IssueStatus;
      p_priority?: IssuePriority;
      p_reason?: string;
    } = {},
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc("mutate_community_issue", {
        p_action: action,
        p_issue_id: issueId,
        ...params,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("CommunityIssueService.mutateIssue", error, { action, issueId });
      return false;
    }
  }
}

export const communityIssueService = new CommunityIssueServiceClass();

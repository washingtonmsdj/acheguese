import { supabase } from "@/integrations/supabase";
import type { Json, Tables } from "@/integrations/supabase";
import { communityIssueService } from "@/core/community/issues/services/CommunityIssueService";
import type {
  IssueCategory,
  IssuePriority,
  IssueReportReason,
  IssueStatus,
} from "@/core/community/issues/domain/types";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  or(filter: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  gt(column: string, value: unknown): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
};

type AdminCommunityIssuesDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminCommunityIssuesDbClient;

type CommunityIssueRow = Tables<"community_issues">;
type CommunityIssueReportRow = Tables<"community_issue_reports">;

type IssueAuthorProfile = {
  display_name?: string | null;
  avatar_url?: string | null;
};

type IssueReporterProfile = {
  display_name?: string | null;
};

type CommunityIssueWithRelationsRow = CommunityIssueRow & {
  author_profile?: IssueAuthorProfile | null;
};

type CommunityIssueReportWithRelationsRow = CommunityIssueReportRow & {
  reporter_profile?: IssueReporterProfile | null;
};

type CommunityIssueAdminStatsRpc = {
  total?: number;
  aberto?: number;
  em_analise?: number;
  em_andamento?: number;
  resolvido?: number;
  rejeitado?: number;
  under_review?: number;
  total_reports?: number;
  total_supports?: number;
  categories?: Partial<Record<IssueCategory, number>>;
};

export interface CommunityIssueAuditRow {
  id: string;
  issue_id: string;
  actor_id: string | null;
  action: string;
  metadata: Json | null;
  created_at: string;
}

interface CommunityIssue {
  id: string;
  author_profile_id: string;
  location_id: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  title: string;
  description: string;
  images?: string[];
  neighborhood: string;
  neighborhood_display: string;
  city: string;
  address_reference?: string;
  support_count: number;
  comments_count: number;
  report_count: number;
  under_review: boolean;
  removed_at?: string;
  removal_reason?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IssueStats {
  total: number;
  aberto: number;
  em_analise: number;
  em_andamento: number;
  resolvido: number;
  rejeitado: number;
  underReview: number;
  totalReports: number;
  totalSupports: number;
  avgSupportsPerIssue: number;
  categories: Record<IssueCategory, number>;
}

export interface IssueWithDetails extends CommunityIssue {
  author_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  reports?: Array<{
    id: string;
    reason: IssueReportReason;
    created_at: string;
    reporter_profile?: {
      display_name: string;
    };
  }>;
}

export interface IssueFilters {
  status?: IssueStatus;
  category?: IssueCategory;
  priority?: IssuePriority;
  underReview?: boolean;
  city?: string;
  neighborhood?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const EMPTY_STATS: IssueStats = {
  total: 0,
  aberto: 0,
  em_analise: 0,
  em_andamento: 0,
  resolvido: 0,
  rejeitado: 0,
  underReview: 0,
  totalReports: 0,
  totalSupports: 0,
  avgSupportsPerIssue: 0,
  categories: {} as Record<IssueCategory, number>,
};

function mapIssueRow(row: CommunityIssueRow): CommunityIssue {
  return {
    id: row.id,
    author_profile_id: row.author_profile_id,
    location_id: row.location_id ?? "",
    category: (row.category ?? "outro") as IssueCategory,
    status: row.status as IssueStatus,
    priority: row.priority as IssuePriority,
    title: row.title,
    description: row.description ?? "",
    images: row.images ?? undefined,
    neighborhood: row.neighborhood ?? "",
    neighborhood_display: row.neighborhood_display ?? "",
    city: row.city ?? "",
    address_reference: row.address_reference ?? undefined,
    support_count: row.support_count ?? 0,
    comments_count: row.comments_count ?? 0,
    report_count: row.report_count ?? 0,
    under_review: row.under_review ?? false,
    removed_at: row.removed_at ?? undefined,
    removal_reason: row.removal_reason ?? undefined,
    resolved_at: row.resolved_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapIssueWithDetailsRow(
  row: CommunityIssueWithRelationsRow,
  reports: IssueWithDetails["reports"] = [],
): IssueWithDetails {
  return {
    ...mapIssueRow(row),
    author_profile: row.author_profile?.display_name
      ? {
          display_name: row.author_profile.display_name,
          avatar_url: row.author_profile.avatar_url ?? undefined,
        }
      : undefined,
    reports,
  };
}

function mapIssueReportRow(
  row: CommunityIssueReportWithRelationsRow,
): NonNullable<IssueWithDetails["reports"]>[number] {
  return {
    id: row.id,
    reason: row.reason as IssueReportReason,
    created_at: row.created_at,
    reporter_profile: row.reporter_profile?.display_name
      ? { display_name: row.reporter_profile.display_name }
      : undefined,
  };
}

class AdminCommunityIssuesServiceClass {
  private readonly tableName = "community_issues";
  private readonly reportsTable = "community_issue_reports";

  async getStats(): Promise<IssueStats> {
    try {
      const aggregate = await this.getAdminAggregate();
      const total = aggregate.total ?? 0;
      const totalSupports = aggregate.total_supports ?? 0;

      return {
        total,
        aberto: aggregate.aberto ?? 0,
        em_analise: aggregate.em_analise ?? 0,
        em_andamento: aggregate.em_andamento ?? 0,
        resolvido: aggregate.resolvido ?? 0,
        rejeitado: aggregate.rejeitado ?? 0,
        underReview: aggregate.under_review ?? 0,
        totalReports: aggregate.total_reports ?? 0,
        totalSupports,
        avgSupportsPerIssue:
          total > 0 ? Math.round((totalSupports / total) * 10) / 10 : 0,
        categories: (aggregate.categories ?? {}) as Record<IssueCategory, number>,
      };
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getStats", error);
      return { ...EMPTY_STATS };
    }
  }

  async getAllIssues(filters: IssueFilters = {}): Promise<{
    data: IssueWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        status,
        category,
        priority,
        underReview,
        city,
        neighborhood,
        search,
        page = 1,
        limit = 20,
      } = filters;
      const safePage = Math.max(1, Math.floor(page));
      const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

      let query = db.from<CommunityIssueWithRelationsRow>(this.tableName).select(
        `
        *,
        author_profile:profiles!community_issues_author_profile_id_fkey(
          display_name,
          avatar_url
        )
        `,
        { count: "exact" },
      );

      if (status) query = query.eq("status", status);
      if (category) query = query.eq("category", category);
      if (priority) query = query.eq("priority", priority);
      if (underReview !== undefined) query = query.eq("under_review", underReview);
      if (city) query = query.eq("city", city);
      if (neighborhood) query = query.eq("neighborhood_display", neighborhood);

      if (search) {
        const searchFilter = buildSafeOrILikeFilter(
          ["title", "description", "neighborhood_display"],
          search,
        );
        if (searchFilter) query = query.or(searchFilter);
      }

      const from = (safePage - 1) * safeLimit;
      const to = from + safeLimit - 1;
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const rows = data ?? [];
      const reportsByIssue = await this.getReportsForIssues(rows.map((issue) => issue.id));
      const total = count ?? 0;

      return {
        data: rows.map((issue) =>
          mapIssueWithDetailsRow(issue, reportsByIssue.get(issue.id) ?? []),
        ),
        total,
        page: safePage,
        totalPages: Math.ceil(total / safeLimit),
      };
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getAllIssues", error);
      return { data: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  async getIssuesUnderReview(): Promise<IssueWithDetails[]> {
    try {
      const { data, error } = await db
        .from<CommunityIssueWithRelationsRow>(this.tableName)
        .select(
          `
          *,
          author_profile:profiles!community_issues_author_profile_id_fkey(
            display_name,
            avatar_url
          )
          `,
        )
        .eq("under_review", true)
        .order("report_count", { ascending: false })
        .limit(100);

      if (error) throw error;

      const rows = data ?? [];
      const reportsByIssue = await this.getReportsForIssues(rows.map((issue) => issue.id));
      return rows.map((issue) =>
        mapIssueWithDetailsRow(issue, reportsByIssue.get(issue.id) ?? []),
      );
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getIssuesUnderReview", error);
      return [];
    }
  }

  async getIssueReports(
    issueId: string,
  ): Promise<NonNullable<IssueWithDetails["reports"]>> {
    try {
      const reports = await this.getReportsForIssues([issueId]);
      return reports.get(issueId) ?? [];
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getIssueReports", error);
      return [];
    }
  }

  async updateStatus(issueId: string, status: IssueStatus): Promise<boolean> {
    return communityIssueService.updateStatus(issueId, status);
  }

  async updatePriority(issueId: string, priority: IssuePriority): Promise<boolean> {
    return communityIssueService.updatePriority(issueId, priority);
  }

  async removeIssue(issueId: string, reason: string): Promise<boolean> {
    return communityIssueService.removeIssue(issueId, reason);
  }

  async clearUnderReview(issueId: string): Promise<boolean> {
    return communityIssueService.clearUnderReview(issueId);
  }

  async getAuditLog(issueId: string): Promise<CommunityIssueAuditRow[]> {
    try {
      const { data, error } = await supabase.rpc("list_community_issue_audit", {
        p_issue_id: issueId,
        p_limit: 200,
      });

      if (error) throw error;
      return (data ?? []) as CommunityIssueAuditRow[];
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getAuditLog", error);
      return [];
    }
  }

  async getTopSupportedIssues(limit = 10): Promise<IssueWithDetails[]> {
    try {
      const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
      const { data, error } = await db
        .from<CommunityIssueWithRelationsRow>(this.tableName)
        .select(
          `
          *,
          author_profile:profiles!community_issues_author_profile_id_fkey(
            display_name,
            avatar_url
          )
          `,
        )
        .gt("support_count", 0)
        .order("support_count", { ascending: false })
        .limit(safeLimit);

      if (error) throw error;
      return (data ?? []).map((issue) => mapIssueWithDetailsRow(issue));
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getTopSupportedIssues", error);
      return [];
    }
  }

  async getTopReportedIssues(limit = 10): Promise<IssueWithDetails[]> {
    try {
      const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
      const { data, error } = await db
        .from<CommunityIssueWithRelationsRow>(this.tableName)
        .select(
          `
          *,
          author_profile:profiles!community_issues_author_profile_id_fkey(
            display_name,
            avatar_url
          )
          `,
        )
        .gt("report_count", 0)
        .order("report_count", { ascending: false })
        .limit(safeLimit);

      if (error) throw error;

      const rows = data ?? [];
      const reportsByIssue = await this.getReportsForIssues(rows.map((issue) => issue.id));
      return rows.map((issue) =>
        mapIssueWithDetailsRow(issue, reportsByIssue.get(issue.id) ?? []),
      );
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getTopReportedIssues", error);
      return [];
    }
  }

  async getStatsByCategory(): Promise<Record<IssueCategory, number>> {
    try {
      const aggregate = await this.getAdminAggregate();
      return (aggregate.categories ?? {}) as Record<IssueCategory, number>;
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getStatsByCategory", error);
      return {} as Record<IssueCategory, number>;
    }
  }

  async getStatsByStatus(): Promise<Record<IssueStatus, number>> {
    try {
      const aggregate = await this.getAdminAggregate();
      return {
        aberto: aggregate.aberto ?? 0,
        em_analise: aggregate.em_analise ?? 0,
        em_andamento: aggregate.em_andamento ?? 0,
        resolvido: aggregate.resolvido ?? 0,
        rejeitado: aggregate.rejeitado ?? 0,
      };
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getStatsByStatus", error);
      return {} as Record<IssueStatus, number>;
    }
  }

  async getResolutionRate(): Promise<{ total: number; resolved: number; rate: number }> {
    try {
      const aggregate = await this.getAdminAggregate();
      const total = aggregate.total ?? 0;
      const resolved = aggregate.resolvido ?? 0;
      return {
        total,
        resolved,
        rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      };
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getResolutionRate", error);
      return { total: 0, resolved: 0, rate: 0 };
    }
  }

  private async getAdminAggregate(): Promise<CommunityIssueAdminStatsRpc> {
    const { data, error } = await supabase.rpc("get_community_issue_admin_stats");
    if (error) throw error;
    return (data ?? {}) as CommunityIssueAdminStatsRpc;
  }

  private async getReportsForIssues(
    issueIds: string[],
  ): Promise<Map<string, NonNullable<IssueWithDetails["reports"]>>> {
    const result = new Map<string, NonNullable<IssueWithDetails["reports"]>>();
    const uniqueIssueIds = [...new Set(issueIds)].slice(0, 100);
    if (uniqueIssueIds.length === 0) return result;

    const { data, error } = await db
      .from<CommunityIssueReportWithRelationsRow>(this.reportsTable)
      .select(
        `
        *,
        reporter_profile:profiles!community_issue_reports_profile_id_fkey(
          display_name
        )
        `,
      )
      .in("issue_id", uniqueIssueIds)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) throw error;

    for (const row of data ?? []) {
      const reports = result.get(row.issue_id) ?? [];
      if (reports.length >= 100) continue;
      reports.push(mapIssueReportRow(row));
      result.set(row.issue_id, reports);
    }

    return result;
  }
}

export const adminCommunityIssuesService = new AdminCommunityIssuesServiceClass();

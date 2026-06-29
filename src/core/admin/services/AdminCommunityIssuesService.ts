import { supabase } from "@/integrations/supabase";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase";
import { SessionService } from "@/core/session/services/SessionService";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";

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
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  or(filter: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  gt(column: string, value: unknown): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type AdminCommunityIssuesDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminCommunityIssuesDbClient;

type IssueCategory =
  | "buraco_via"
  | "calcada_danificada"
  | "iluminacao_publica"
  | "lixo_acumulado"
  | "alagamento_cronico"
  | "arvore_risco"
  | "sinalizacao_danificada"
  | "esgoto_aberto"
  | "pichacao_vandalismo"
  | "outro";

type IssueStatus = "aberto" | "em_analise" | "em_andamento" | "resolvido" | "rejeitado";
type IssuePriority = "baixa" | "media" | "alta" | "urgente";
type IssueReportReason = "duplicate" | "false_report" | "inappropriate_content" | "spam" | "other";

type CommunityIssueRow = Tables<"community_issues">;
type CommunityIssueUpdate = Partial<CommunityIssueRow>;
type CommunityIssueReportRow = Tables<"community_issue_reports">;
type CommunityIssueAuditRow = Tables<"community_issue_audit">;
type CommunityIssueAuditInsert = TablesInsert<"community_issue_audit">;

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

type IssueStatsRow = Pick<
  CommunityIssueRow,
  "status" | "report_count" | "under_review" | "support_count"
>;

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

function toJsonMetadata(value: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

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
  const base = mapIssueRow(row);
  return {
    ...base,
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
  private readonly auditTable = "community_issue_audit";

  async getStats(): Promise<IssueStats> {
    try {
      const { data, error } = await db
        .from<IssueStatsRow>(this.tableName)
        .select("status, report_count, under_review, support_count");

      if (error) throw error;

      const rows = data || [];
      const stats: IssueStats = {
        total: rows.length,
        aberto: 0,
        em_analise: 0,
        em_andamento: 0,
        resolvido: 0,
        rejeitado: 0,
        underReview: 0,
        totalReports: 0,
        totalSupports: 0,
        avgSupportsPerIssue: 0,
      };

      rows.forEach((issue) => {
        switch (issue.status) {
          case "aberto":
            stats.aberto += 1;
            break;
          case "em_analise":
            stats.em_analise += 1;
            break;
          case "em_andamento":
            stats.em_andamento += 1;
            break;
          case "resolvido":
            stats.resolvido += 1;
            break;
          case "rejeitado":
            stats.rejeitado += 1;
            break;
        }

        if (issue.under_review) stats.underReview += 1;
        stats.totalReports += issue.report_count || 0;
        stats.totalSupports += issue.support_count || 0;
      });

      stats.avgSupportsPerIssue =
        stats.total > 0 ? Math.round((stats.totalSupports / stats.total) * 10) / 10 : 0;

      return stats;
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getStats", error);
      return {
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
      };
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
        const searchFilter = buildSafeOrILikeFilter(["title", "description", "neighborhood_display"], search);
        if (searchFilter) query = query.or(searchFilter);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error) throw error;

      const issuesWithReports = await Promise.all(
        (data || []).map(async (issue) => mapIssueWithDetailsRow(issue, await this.getIssueReports(issue.id))),
      );

      const total = count || 0;
      return {
        data: issuesWithReports,
        total,
        page,
        totalPages: Math.ceil(total / limit),
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
        .order("report_count", { ascending: false });

      if (error) throw error;

      return Promise.all(
        (data || []).map(async (issue) => mapIssueWithDetailsRow(issue, await this.getIssueReports(issue.id))),
      );
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getIssuesUnderReview", error);
      return [];
    }
  }

  async getIssueReports(issueId: string): Promise<NonNullable<IssueWithDetails["reports"]>> {
    try {
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
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapIssueReportRow);
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getIssueReports", error);
      return [];
    }
  }

  async updateStatus(issueId: string, status: IssueStatus): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error("not_authenticated");

      const { data: currentIssue } = await db
        .from<Pick<CommunityIssueRow, "status">>(this.tableName)
        .select("status")
        .eq("id", issueId)
        .single();

      const updateData: CommunityIssueUpdate = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "resolvido") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await db.from<CommunityIssueRow>(this.tableName).update(updateData).eq("id", issueId);
      if (error) throw error;

      const auditData: CommunityIssueAuditInsert = {
        issue_id: issueId,
        action: "status_change",
        actor_id: user.id,
        metadata: toJsonMetadata({
          previous_status: currentIssue?.status,
          new_status: status,
          notes: `Status alterado de ${currentIssue?.status} para ${status}`,
        }),
      };

      const { error: auditError } = await db
        .from<CommunityIssueAuditRow>(this.auditTable)
        .insert(auditData);

      if (auditError) throw auditError;
      return true;
    } catch (error) {
      logger.error("AdminCommunityIssuesService.updateStatus", error);
      return false;
    }
  }

  async updatePriority(issueId: string, priority: IssuePriority): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error("not_authenticated");

      const { error } = await db
        .from<CommunityIssueRow>(this.tableName)
        .update({ priority, updated_at: new Date().toISOString() })
        .eq("id", issueId);

      if (error) throw error;

      const auditData: CommunityIssueAuditInsert = {
        issue_id: issueId,
        action: "updated",
        actor_id: user.id,
        metadata: toJsonMetadata({ priority }),
      };

      await db.from<CommunityIssueAuditRow>(this.auditTable).insert(auditData);
      return true;
    } catch (error) {
      logger.error("AdminCommunityIssuesService.updatePriority", error);
      return false;
    }
  }

  async removeIssue(issueId: string, reason: string): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error("not_authenticated");

      const { error } = await db
        .from<CommunityIssueRow>(this.tableName)
        .update({
          removed_at: new Date().toISOString(),
          removal_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", issueId);

      if (error) throw error;

      const auditData: CommunityIssueAuditInsert = {
        issue_id: issueId,
        action: "removed",
        actor_id: user.id,
        metadata: toJsonMetadata({ reason }),
      };

      await db.from<CommunityIssueAuditRow>(this.auditTable).insert(auditData);
      return true;
    } catch (error) {
      logger.error("AdminCommunityIssuesService.removeIssue", error);
      return false;
    }
  }

  async clearUnderReview(issueId: string): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error("not_authenticated");

      const { error } = await db
        .from<CommunityIssueRow>(this.tableName)
        .update({
          under_review: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", issueId);

      if (error) throw error;

      const auditData: CommunityIssueAuditInsert = {
        issue_id: issueId,
        actor_id: user.id,
        action: "reviewed_cleared",
        metadata: toJsonMetadata({ cleared_at: new Date().toISOString() }),
      };

      await db.from<CommunityIssueAuditRow>(this.auditTable).insert(auditData);
      return true;
    } catch (error) {
      logger.error("AdminCommunityIssuesService.clearUnderReview", error);
      return false;
    }
  }

  async getAuditLog(issueId: string): Promise<CommunityIssueAuditRow[]> {
    try {
      const { data, error } = await db
        .from<CommunityIssueAuditRow>(this.auditTable)
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getAuditLog", error);
      return [];
    }
  }

  async getTopSupportedIssues(limit = 10): Promise<IssueWithDetails[]> {
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
        .gt("support_count", 0)
        .order("support_count", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((issue) => mapIssueWithDetailsRow(issue));
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getTopSupportedIssues", error);
      return [];
    }
  }

  async getTopReportedIssues(limit = 10): Promise<IssueWithDetails[]> {
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
        .gt("report_count", 0)
        .order("report_count", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return Promise.all(
        (data || []).map(async (issue) => mapIssueWithDetailsRow(issue, await this.getIssueReports(issue.id))),
      );
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getTopReportedIssues", error);
      return [];
    }
  }

  async getStatsByCategory(): Promise<Record<IssueCategory, number>> {
    try {
      const { data, error } = await db
        .from<Pick<CommunityIssueRow, "category">>(this.tableName)
        .select("category");

      if (error) throw error;

      const stats: Partial<Record<IssueCategory, number>> = {};
      (data || []).forEach((issue) => {
        const category = (issue.category ?? "outro") as IssueCategory;
        stats[category] = (stats[category] || 0) + 1;
      });

      return stats as Record<IssueCategory, number>;
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getStatsByCategory", error);
      return {} as Record<IssueCategory, number>;
    }
  }

  async getStatsByStatus(): Promise<Record<IssueStatus, number>> {
    try {
      const { data, error } = await db
        .from<Pick<CommunityIssueRow, "status">>(this.tableName)
        .select("status");

      if (error) throw error;

      const stats: Partial<Record<IssueStatus, number>> = {};
      (data || []).forEach((issue) => {
        const status = issue.status as IssueStatus;
        stats[status] = (stats[status] || 0) + 1;
      });

      return stats as Record<IssueStatus, number>;
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getStatsByStatus", error);
      return {} as Record<IssueStatus, number>;
    }
  }

  async getResolutionRate(): Promise<{ total: number; resolved: number; rate: number }> {
    try {
      const { data, error } = await db
        .from<Pick<CommunityIssueRow, "status">>(this.tableName)
        .select("status");

      if (error) throw error;

      const rows = data || [];
      const total = rows.length;
      const resolved = rows.filter((issue) => issue.status === "resolvido").length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return { total, resolved, rate };
    } catch (error) {
      logger.error("AdminCommunityIssuesService.getResolutionRate", error);
      return { total: 0, resolved: 0, rate: 0 };
    }
  }
}

export const adminCommunityIssuesService = new AdminCommunityIssuesServiceClass();

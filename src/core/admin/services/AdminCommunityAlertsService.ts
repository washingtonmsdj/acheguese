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

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  delete(): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  or(filter: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  gt(column: string, value: unknown): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
};

type AdminCommunityAlertsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminCommunityAlertsDbClient;

type AlertCategory =
  | "tiroteio_disparos"
  | "assalto_em_andamento"
  | "tentativa_de_invasao"
  | "incendio_explosao"
  | "acidente_grave"
  | "alagamento_deslizamento"
  | "risco_na_via"
  | "pessoa_vulneravel_em_risco";

type AlertStatus = "ativo" | "encerrado" | "expirado" | "removido";

type AlertReportReason =
  | "false_alert"
  | "promotes_crime"
  | "identifies_person"
  | "monitors_operation"
  | "hate_speech"
  | "spam"
  | "other";

type CommunityAlertRow = Tables<"community_alerts">;
type CommunityAlertUpdate = Partial<CommunityAlertRow>;
type CommunityAlertReportRow = Tables<"community_alert_reports">;
type BlockedTermRow = Tables<"alert_blocked_terms">;
type BlockedTermInsert = TablesInsert<"alert_blocked_terms">;

type CommunityAlertAuditRow = {
  id: string;
  alert_id: string;
  actor_id: string;
  action_type: string;
  metadata: Json | null;
  created_at: string;
};

type CommunityAlertAuditInsert = {
  alert_id: string;
  actor_id: string;
  action_type: string;
  metadata?: Json | null;
};

type AlertAuthorProfile = {
  display_name?: string | null;
  avatar_url?: string | null;
};

type AlertReporterProfile = {
  display_name?: string | null;
};

type CommunityAlertWithRelationsRow = CommunityAlertRow & {
  author_profile?: AlertAuthorProfile | null;
};

type CommunityAlertReportWithRelationsRow = CommunityAlertReportRow & {
  reporter_profile?: AlertReporterProfile | null;
};

type CommunityAlertStatsRow = Pick<CommunityAlertRow, "status" | "report_count" | "under_review">;

interface CommunityAlert {
  id: string;
  author_profile_id?: string;
  category: AlertCategory;
  status: AlertStatus;
  location_id: string;
  latitude: number | null;
  longitude: number | null;
  neighborhood_display: string | null;
  city: string | null;
  description: string;
  report_count: number;
  under_review: boolean;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  removed_at?: string;
  removal_reason?: string;
}

export interface AlertStats {
  total: number;
  active: number;
  ended: number;
  expired: number;
  removed: number;
  underReview: number;
  totalReports: number;
  avgReportsPerAlert: number;
}

export interface AlertWithDetails extends CommunityAlert {
  author_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  reports?: Array<{
    id: string;
    reason: AlertReportReason;
    created_at: string;
    reporter_profile?: {
      display_name: string;
    };
  }>;
}

export interface AlertFilters {
  status?: AlertStatus;
  category?: AlertCategory;
  underReview?: boolean;
  city?: string;
  neighborhood?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BlockedTerm {
  id: string;
  term: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function toJsonMetadata(value: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function mapAlertRow(row: CommunityAlertRow): CommunityAlert {
  return {
    id: row.id,
    author_profile_id: row.profile_id,
    category: row.type as AlertCategory,
    status: row.status as AlertStatus,
    location_id: row.location_id ?? "",
    latitude: row.latitude,
    longitude: row.longitude,
    neighborhood_display: row.neighborhood_display,
    city: row.city,
    description: row.description ?? "",
    report_count: row.report_count,
    under_review: row.under_review,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ended_at: undefined,
    removed_at: row.removed_at ?? undefined,
    removal_reason: row.removal_reason ?? undefined,
  };
}

function mapAlertWithDetailsRow(
  row: CommunityAlertWithRelationsRow,
  reports: AlertWithDetails["reports"] = [],
): AlertWithDetails {
  const base = mapAlertRow(row);
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

function mapAlertReportRow(
  row: CommunityAlertReportWithRelationsRow,
): NonNullable<AlertWithDetails["reports"]>[number] {
  return {
    id: row.id,
    reason: row.reason as AlertReportReason,
    created_at: row.created_at,
    reporter_profile: row.reporter_profile?.display_name
      ? { display_name: row.reporter_profile.display_name }
      : undefined,
  };
}

class AdminCommunityAlertsServiceClass {
  private readonly tableName = "community_alerts";
  private readonly reportsTable = "community_alert_reports";
  private readonly blockedTermsTable = "alert_blocked_terms";
  private readonly auditTable = "community_alert_audit";

  async getStats(): Promise<AlertStats> {
    try {
      const { data, error } = await db
        .from<CommunityAlertStatsRow>(this.tableName)
        .select("status, report_count, under_review");

      if (error) throw error;

      const rows = data || [];
      const stats: AlertStats = {
        total: rows.length,
        active: 0,
        ended: 0,
        expired: 0,
        removed: 0,
        underReview: 0,
        totalReports: 0,
        avgReportsPerAlert: 0,
      };

      rows.forEach((alert) => {
        switch (alert.status) {
          case "ativo":
            stats.active += 1;
            break;
          case "encerrado":
            stats.ended += 1;
            break;
          case "expirado":
            stats.expired += 1;
            break;
          case "removido":
            stats.removed += 1;
            break;
        }

        if (alert.under_review) {
          stats.underReview += 1;
        }

        stats.totalReports += alert.report_count || 0;
      });

      stats.avgReportsPerAlert =
        stats.total > 0 ? Math.round((stats.totalReports / stats.total) * 10) / 10 : 0;

      logger.info("AdminCommunityAlertsService.getStats", stats);
      return stats;
    } catch (error) {
      logger.error("AdminCommunityAlertsService.getStats", error);
      return {
        total: 0,
        active: 0,
        ended: 0,
        expired: 0,
        removed: 0,
        underReview: 0,
        totalReports: 0,
        avgReportsPerAlert: 0,
      };
    }
  }

  async getAllAlerts(filters: AlertFilters = {}): Promise<{
    data: AlertWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        status,
        category,
        underReview,
        city,
        neighborhood,
        search,
        page = 1,
        limit = 20,
      } = filters;

      let query = db.from<CommunityAlertWithRelationsRow>(this.tableName).select(
        `
        *,
        author_profile:profiles!community_alerts_profile_id_fkey(
          display_name,
          avatar_url
        )
        `,
        { count: "exact" },
      );

      if (status) query = query.eq("status", status);
      if (category) query = query.eq("type", category);
      if (underReview !== undefined) query = query.eq("under_review", underReview);
      if (city) query = query.eq("city", city);
      if (neighborhood) query = query.eq("neighborhood_display", neighborhood);

      if (search) {
        const searchFilter = buildSafeOrILikeFilter(["description", "neighborhood_display"], search);
        if (searchFilter) query = query.or(searchFilter);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error) throw error;

      const alertsWithReports = await Promise.all(
        (data || []).map(async (alert) => {
          const reports = await this.getAlertReports(alert.id);
          return mapAlertWithDetailsRow(alert, reports);
        }),
      );

      const total = count || 0;
      return {
        data: alertsWithReports,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("AdminCommunityAlertsService.getAllAlerts", error);
      return { data: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  async getAlertsUnderReview(): Promise<AlertWithDetails[]> {
    try {
      const { data, error } = await db
        .from<CommunityAlertWithRelationsRow>(this.tableName)
        .select(
          `
          *,
          author_profile:profiles!community_alerts_profile_id_fkey(
            display_name,
            avatar_url
          )
          `,
        )
        .eq("under_review", true)
        .in("status", ["ativo"])
        .order("report_count", { ascending: false });

      if (error) throw error;

      return Promise.all(
        (data || []).map(async (alert) => mapAlertWithDetailsRow(alert, await this.getAlertReports(alert.id))),
      );
    } catch (error) {
      logger.error("AdminCommunityAlertsService.getAlertsUnderReview", error);
      return [];
    }
  }

  async getAlertReports(alertId: string): Promise<NonNullable<AlertWithDetails["reports"]>> {
    try {
      const { data, error } = await db
        .from<CommunityAlertReportWithRelationsRow>(this.reportsTable)
        .select(
          `
          *,
          reporter_profile:profiles!community_alert_reports_reporter_id_fkey(
            display_name
          )
          `,
        )
        .eq("alert_id", alertId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapAlertReportRow);
    } catch (error) {
      logger.error("AdminCommunityAlertsService.getAlertReports", error);
      return [];
    }
  }

  async removeAlert(alertId: string, reason: string): Promise<boolean> {
    try {
      const payload: CommunityAlertUpdate = {
        status: "removido",
        removed_at: new Date().toISOString(),
        removal_reason: reason,
        updated_at: new Date().toISOString(),
      };

      const { error } = await db.from<CommunityAlertRow>(this.tableName).update(payload).eq("id", alertId);
      if (error) throw error;

      await this.writeAuditLog(alertId, "removed", { reason });
      return true;
    } catch (error) {
      logger.error("AdminCommunityAlertsService.removeAlert", error);
      return false;
    }
  }

  async clearUnderReview(alertId: string): Promise<boolean> {
    try {
      const { error } = await db
        .from<CommunityAlertRow>(this.tableName)
        .update({ under_review: false, updated_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;

      await this.writeAuditLog(alertId, "reviewed_cleared", {
        cleared_at: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      logger.error("AdminCommunityAlertsService.clearUnderReview", error);
      return false;
    }
  }

  async endAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await db
        .from<CommunityAlertRow>(this.tableName)
        .update({ status: "encerrado", updated_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;

      await this.writeAuditLog(alertId, "ended", {});
      return true;
    } catch (error) {
      logger.error("AdminCommunityAlertsService.endAlert", error);
      return false;
    }
  }

  async getAuditLog(alertId: string): Promise<CommunityAlertAuditRow[]> {
    try {
      const { data, error } = await db
        .from<CommunityAlertAuditRow>(this.auditTable)
        .select("*")
        .eq("alert_id", alertId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("AdminCommunityAlertsService.getAuditLog", error);
      return [];
    }
  }

  async getBlockedTerms(): Promise<BlockedTerm[]> {
    try {
      const { data, error } = await db
        .from<BlockedTermRow>(this.blockedTermsTable)
        .select("*")
        .order("term", { ascending: true });

      if (error) throw error;
      return (data || []) as BlockedTerm[];
    } catch (error) {
      logger.error("AdminCommunityAlertsService.getBlockedTerms", error);
      return [];
    }
  }

  async addBlockedTerm(term: string): Promise<boolean> {
    try {
      const payload: BlockedTermInsert = {
        term: term.toLowerCase().trim(),
        is_active: true,
      };

      const { error } = await db.from<BlockedTermRow>(this.blockedTermsTable).insert(payload);
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminCommunityAlertsService.addBlockedTerm", error);
      return false;
    }
  }

  async removeBlockedTerm(termId: string): Promise<boolean> {
    try {
      const { error } = await db.from<BlockedTermRow>(this.blockedTermsTable).delete().eq("id", termId);
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminCommunityAlertsService.removeBlockedTerm", error);
      return false;
    }
  }

  async toggleBlockedTerm(termId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await db
        .from<BlockedTermRow>(this.blockedTermsTable)
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", termId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminCommunityAlertsService.toggleBlockedTerm", error);
      return false;
    }
  }

  async getTopReportedAlerts(limit = 10): Promise<AlertWithDetails[]> {
    try {
      const { data, error } = await db
        .from<CommunityAlertWithRelationsRow>(this.tableName)
        .select(
          `
          *,
          author_profile:profiles!community_alerts_profile_id_fkey(
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
        (data || []).map(async (alert) => mapAlertWithDetailsRow(alert, await this.getAlertReports(alert.id))),
      );
    } catch (error) {
      logger.error("AdminCommunityAlertsService.getTopReportedAlerts", error);
      return [];
    }
  }

  async getStatsByCategory(): Promise<Record<AlertCategory, number>> {
    try {
      const { data, error } = await db
        .from<Pick<CommunityAlertRow, "type">>(this.tableName)
        .select("type");

      if (error) throw error;

      const stats: Partial<Record<AlertCategory, number>> = {};
      (data || []).forEach((alert) => {
        const category = alert.type as AlertCategory;
        stats[category] = (stats[category] || 0) + 1;
      });

      return stats as Record<AlertCategory, number>;
    } catch (error) {
      logger.error("AdminCommunityAlertsService.getStatsByCategory", error);
      return {} as Record<AlertCategory, number>;
    }
  }

  private async writeAuditLog(
    alertId: string,
    actionType: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const user = await SessionService.getCurrentUser();
    if (!user) return;

    const payload: CommunityAlertAuditInsert = {
      alert_id: alertId,
      actor_id: user.id,
      action_type: actionType,
      metadata: toJsonMetadata(metadata),
    };

    const { error } = await db.from<CommunityAlertAuditRow>(this.auditTable).insert(payload);
    if (error) throw error;
  }
}

export const adminCommunityAlertsService = new AdminCommunityAlertsServiceClass();

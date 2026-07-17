import { supabase } from "@/integrations/supabase";
import { COMMUNITY_RUNTIME_LIMITS } from "@/shared/constants/communityRuntime";
import type {
  ModerationFilters,
  ModerationStats,
  PendingComment,
  PendingPost,
} from "./types";

type SupabaseDynamicResult<TData> = {
  data: TData | null;
  error: unknown | null;
  count?: number | null;
};

type SupabaseDynamicQuery<TData> = PromiseLike<SupabaseDynamicResult<TData>> & {
  eq(column: string, value: unknown): SupabaseDynamicQuery<TData>;
  gte(column: string, value: unknown): SupabaseDynamicQuery<TData>;
  in(column: string, values: readonly unknown[]): SupabaseDynamicQuery<TData>;
  lt(column: string, value: unknown): SupabaseDynamicQuery<TData>;
  lte(column: string, value: unknown): SupabaseDynamicQuery<TData>;
  order(
    column: string,
    options?: { ascending?: boolean },
  ): SupabaseDynamicQuery<TData>;
  range(from: number, to: number): SupabaseDynamicQuery<TData>;
};

interface SupabaseDynamicClient {
  from(table: string): {
    select(
      columns: string,
      options?: { count?: "exact"; head?: boolean },
    ): SupabaseDynamicQuery<Record<string, unknown>[]>;
  };
}

type PendingPostReportRow = {
  id: string;
  content: string | null;
  type: string | null;
  images: unknown;
  author_profile_id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_reputation: number | null;
  author_previous_reports: number | null;
  reports: unknown;
  reports_count: number | null;
  priority: number | null;
  created_at: string;
  status: string;
};

type PendingCommentReportRow = {
  id: string;
  content: string;
  author_profile_id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_reputation: number | null;
  post_id: string;
  post_content: string | null;
  reports: unknown;
  reports_count: number | null;
  priority: number | null;
  created_at: string;
  status: string;
};

interface PendingPage<TItem> {
  items: TItem[];
  nextPage?: number;
}

export type CommunityContentModerationDecision = "dismiss" | "hide" | "remove";

export interface CommunityContentReviewResult {
  targetType: "post" | "comment";
  targetId: string;
  decision: CommunityContentModerationDecision;
  affectedReports: number;
  alreadyReviewed: boolean;
}

type CommunityModerationStatsRow = {
  pending_posts: number | null;
  pending_comments: number | null;
  approved_reports: number | null;
  rejected_reports: number | null;
  hidden_content: number | null;
  removed_content: number | null;
};

function boundedInteger(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}

function asReviewResult(value: unknown): CommunityContentReviewResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Resposta invalida da moderacao comunitaria.");
  }

  const row = value as Record<string, unknown>;
  if (
    (row.target_type !== "post" && row.target_type !== "comment") ||
    (row.decision !== "dismiss" &&
      row.decision !== "hide" &&
      row.decision !== "remove") ||
    typeof row.target_id !== "string"
  ) {
    throw new Error("Contrato invalido da moderacao comunitaria.");
  }

  return {
    targetType: row.target_type,
    targetId: row.target_id,
    decision: row.decision,
    affectedReports:
      typeof row.affected_reports === "number" ? row.affected_reports : 0,
    alreadyReviewed: row.already_reviewed === true,
  };
}

function normalizeStatus(status: unknown): string | undefined {
  if (Array.isArray(status))
    return typeof status[0] === "string" ? status[0] : undefined;
  return typeof status === "string" ? status : undefined;
}

function normalizeImages(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  return [];
}

function normalizeReports(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
  return [];
}

function applyPostPriorityFilter(
  query: SupabaseDynamicQuery<Record<string, unknown>[]>,
  priority?: "high" | "medium" | "low",
) {
  if (priority === "high") return query.gte("priority", 50);
  if (priority === "medium")
    return query.gte("priority", 20).lt("priority", 50);
  if (priority === "low") return query.lt("priority", 20);
  return query;
}

function applyCommentPriorityFilter(
  query: SupabaseDynamicQuery<Record<string, unknown>[]>,
  priority?: "high" | "medium" | "low",
) {
  if (priority === "high") return query.gte("priority", 3);
  if (priority === "medium") return query.eq("priority", 2);
  if (priority === "low") return query.lte("priority", 1);
  return query;
}

function mapPendingPost(row: PendingPostReportRow): PendingPost {
  const reports = normalizeReports(row.reports);
  return {
    id: row.id,
    content: row.content ?? "",
    type: row.type ?? "post",
    images: normalizeImages(row.images),
    author_profile_id: row.author_profile_id,
    author_name: row.author_name ?? "Usuario",
    author_avatar: row.author_avatar ?? "",
    author_reputation: row.author_reputation ?? 0,
    author_previous_reports: row.author_previous_reports ?? 0,
    reports,
    reports_count: row.reports_count ?? reports.length,
    priority: row.priority ?? 0,
    created_at: row.created_at,
    status: row.status,
  };
}

function mapPendingComment(row: PendingCommentReportRow): PendingComment {
  const reports = normalizeReports(row.reports);
  return {
    id: row.id,
    content: row.content,
    author_profile_id: row.author_profile_id,
    author_name: row.author_name ?? "Usuario",
    author_avatar: row.author_avatar ?? "",
    post_id: row.post_id,
    reports,
    reports_count: row.reports_count ?? reports.length,
    priority: row.priority ?? 0,
    created_at: row.created_at,
    status: row.status,
    author: {
      reputation: row.author_reputation ?? 0,
    },
    post: {
      content: row.post_content ?? "",
    },
  } as PendingComment;
}

class CommunityContentModerationService {
  private db(): SupabaseDynamicClient {
    return supabase as unknown as SupabaseDynamicClient;
  }

  async getStats(): Promise<ModerationStats> {
    const { data, error } = await supabase.rpc(
      "get_community_moderation_stats",
    );
    if (error) throw error;

    const row = (data?.[0] ?? null) as CommunityModerationStatsRow | null;
    const pendingPosts = row?.pending_posts ?? 0;
    const pendingComments = row?.pending_comments ?? 0;
    const approvedReports = row?.approved_reports ?? 0;
    const rejectedReports = row?.rejected_reports ?? 0;
    const hiddenTotal = row?.hidden_content ?? 0;
    const removedTotal = row?.removed_content ?? 0;

    const resolvedTotal = approvedReports + rejectedReports;

    return {
      pending_reports: {
        posts: pendingPosts,
        comments: pendingComments,
        total: pendingPosts + pendingComments,
      },
      resolved_reports: {
        approved: approvedReports,
        rejected: rejectedReports,
        total: resolvedTotal,
      },
      content_actions: {
        hidden: hiddenTotal,
        removed: removedTotal,
        total: hiddenTotal + removedTotal,
      },
    };
  }

  async listPendingPosts({
    filters = {},
    offset,
    pageSize,
  }: {
    filters?: ModerationFilters;
    offset: number;
    pageSize: number;
  }): Promise<PendingPage<PendingPost>> {
    if (offset > COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_OFFSET_MAX) {
      return { items: [] };
    }

    const boundedOffset = boundedInteger(
      offset,
      0,
      COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_OFFSET_MAX,
    );
    const boundedPageSize = boundedInteger(
      pageSize,
      1,
      COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_PAGE_SIZE,
    );
    const status = normalizeStatus(filters.status);
    let request = this.db()
      .from("admin_pending_post_reports")
      .select("*", { count: "exact" })
      .order("priority", { ascending: false })
      .order("latest_report_at", { ascending: false })
      .range(boundedOffset, boundedOffset + boundedPageSize - 1);

    if (status) request = request.eq("status", status);
    request = applyPostPriorityFilter(request, filters.priority);

    const { data, error, count } = await request;
    if (error) throw error;

    const rows = (data ?? []) as unknown as PendingPostReportRow[];
    const nextOffset = boundedOffset + rows.length;

    return {
      items: rows.map(mapPendingPost),
      nextPage:
        count &&
        nextOffset < count &&
        nextOffset <= COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_OFFSET_MAX
          ? nextOffset
          : undefined,
    };
  }

  async listPendingComments({
    filters = {},
    offset,
    pageSize,
  }: {
    filters?: ModerationFilters;
    offset: number;
    pageSize: number;
  }): Promise<PendingPage<PendingComment>> {
    if (offset > COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_OFFSET_MAX) {
      return { items: [] };
    }

    const boundedOffset = boundedInteger(
      offset,
      0,
      COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_OFFSET_MAX,
    );
    const boundedPageSize = boundedInteger(
      pageSize,
      1,
      COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_PAGE_SIZE,
    );
    const status = normalizeStatus(filters.status);
    let request = this.db()
      .from("admin_pending_comment_reports")
      .select("*", { count: "exact" })
      .order("priority", { ascending: false })
      .order("latest_report_at", { ascending: false })
      .range(boundedOffset, boundedOffset + boundedPageSize - 1);

    if (status) request = request.eq("status", status);
    request = applyCommentPriorityFilter(request, filters.priority);

    const { data, error, count } = await request;
    if (error) throw error;

    const rows = (data ?? []) as unknown as PendingCommentReportRow[];
    const nextOffset = boundedOffset + rows.length;

    return {
      items: rows.map(mapPendingComment),
      nextPage:
        count &&
        nextOffset < count &&
        nextOffset <= COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_OFFSET_MAX
          ? nextOffset
          : undefined,
    };
  }

  async reviewContentReports(input: {
    targetType: "post" | "comment";
    targetId: string;
    decision: CommunityContentModerationDecision;
    reason: string;
  }): Promise<CommunityContentReviewResult> {
    const reason = input.reason.trim();
    if (reason.length < 3 || reason.length > 1_000) {
      throw new Error("Informe um motivo entre 3 e 1000 caracteres.");
    }

    const { data, error } = await supabase.rpc(
      "review_community_content_reports",
      {
        p_target_type: input.targetType,
        p_target_id: input.targetId,
        p_decision: input.decision,
        p_reason: reason,
      },
    );

    if (error) throw error;
    return asReviewResult(data);
  }
}

export const communityContentModerationService =
  new CommunityContentModerationService();

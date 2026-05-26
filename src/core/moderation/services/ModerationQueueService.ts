import { supabase } from "@/core/infrastructure/supabase";
import { MODERATION_REPORT_STATUS } from "@/core/moderation/constants/reportStatus";
import type {
  ModerationFilters,
  ModerationStats,
  PendingComment,
  PendingPost,
} from "@/core/moderation/types";

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

function normalizeStatus(status: unknown): string | undefined {
  if (Array.isArray(status)) return typeof status[0] === "string" ? status[0] : undefined;
  return typeof status === "string" ? status : undefined;
}

function normalizeImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
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
  if (priority === "medium") return query.gte("priority", 20).lt("priority", 50);
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

class ModerationQueueServiceClass {
  private db(): SupabaseDynamicClient {
    return supabase as unknown as SupabaseDynamicClient;
  }

  private async countRows(
    table: string,
    build?: (
      query: SupabaseDynamicQuery<Record<string, unknown>[]>,
    ) => SupabaseDynamicQuery<Record<string, unknown>[]>,
  ): Promise<number> {
    let query = this.db().from(table).select("id", { count: "exact", head: true });
    if (build) query = build(query);

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  async getStats(): Promise<ModerationStats> {
    const [
      pendingPosts,
      pendingComments,
      approvedReports,
      rejectedReports,
      hiddenPosts,
      removedPosts,
      hiddenComments,
      removedComments,
    ] = await Promise.all([
      this.countRows("community_reports", (query) =>
        query.eq("target_type", "post").in("status", [
          MODERATION_REPORT_STATUS.PENDING,
          MODERATION_REPORT_STATUS.UNDER_REVIEW,
        ]),
      ),
      this.countRows("community_reports", (query) =>
        query.eq("target_type", "comment").in("status", [
          MODERATION_REPORT_STATUS.PENDING,
          MODERATION_REPORT_STATUS.UNDER_REVIEW,
        ]),
      ),
      this.countRows("community_reports", (query) =>
        query.eq("status", MODERATION_REPORT_STATUS.APPROVED),
      ),
      this.countRows("community_reports", (query) =>
        query.eq("status", MODERATION_REPORT_STATUS.REJECTED),
      ),
      this.countRows("posts", (query) => query.eq("is_hidden", true)),
      this.countRows("posts", (query) => query.eq("is_removed", true)),
      this.countRows("comments", (query) => query.eq("is_hidden", true)),
      this.countRows("comments", (query) => query.eq("is_removed", true)),
    ]);

    const resolvedTotal = approvedReports + rejectedReports;
    const hiddenTotal = hiddenPosts + hiddenComments;
    const removedTotal = removedPosts + removedComments;

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
    const status = normalizeStatus(filters.status);
    let request = this.db()
      .from("admin_pending_post_reports")
      .select("*", { count: "exact" })
      .order("priority", { ascending: false })
      .order("latest_report_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status) request = request.eq("status", status);
    request = applyPostPriorityFilter(request, filters.priority);

    const { data, error, count } = await request;
    if (error) throw error;

    const rows = (data ?? []) as unknown as PendingPostReportRow[];
    const nextOffset = offset + rows.length;

    return {
      items: rows.map(mapPendingPost),
      nextPage: count && nextOffset < count ? nextOffset : undefined,
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
    const status = normalizeStatus(filters.status);
    let request = this.db()
      .from("admin_pending_comment_reports")
      .select("*", { count: "exact" })
      .order("priority", { ascending: false })
      .order("latest_report_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status) request = request.eq("status", status);
    request = applyCommentPriorityFilter(request, filters.priority);

    const { data, error, count } = await request;
    if (error) throw error;

    const rows = (data ?? []) as unknown as PendingCommentReportRow[];
    const nextOffset = offset + rows.length;

    return {
      items: rows.map(mapPendingComment),
      nextPage: count && nextOffset < count ? nextOffset : undefined,
    };
  }
}

export const moderationQueueService = new ModerationQueueServiceClass();

import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import type { PendingComment, ModerationFilters } from "@/core/moderation/types";

interface UsePendingCommentsOptions {
  filters?: ModerationFilters;
  pageSize?: number;
}

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

function normalizeStatus(status: unknown): string | undefined {
  if (Array.isArray(status)) return typeof status[0] === "string" ? status[0] : undefined;
  return typeof status === "string" ? status : undefined;
}

function normalizeReports(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
  return [];
}

function applyPriorityFilter(query: any, priority?: "high" | "medium" | "low") {
  if (priority === "high") return query.gte("priority", 3);
  if (priority === "medium") return query.eq("priority", 2);
  if (priority === "low") return query.lte("priority", 1);
  return query;
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

export function usePendingComments({
  filters = {},
  pageSize = 10,
}: UsePendingCommentsOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: ["pending-comments", filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = Number(pageParam) || 0;
      const status = normalizeStatus(filters.status);

      let request = (supabase as any)
        .from("admin_pending_comment_reports")
        .select("*", { count: "exact" })
        .order("priority", { ascending: false })
        .order("latest_report_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (status) {
        request = request.eq("status", status);
      }

      request = applyPriorityFilter(request, filters.priority);

      const { data, error, count } = await request;
      if (error) throw error;

      const rows = (data ?? []) as PendingCommentReportRow[];
      const nextOffset = offset + rows.length;

      return {
        comments: rows.map(mapPendingComment),
        nextPage: count && nextOffset < count ? nextOffset : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const comments = query.data?.pages.flatMap((page) => page.comments) || [];

  return {
    comments,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}

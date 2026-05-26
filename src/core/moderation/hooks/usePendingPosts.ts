import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import type { PendingPost, ModerationFilters } from "@/core/moderation/types";

interface UsePendingPostsOptions {
  filters?: ModerationFilters;
  pageSize?: number;
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

function applyPriorityFilter(query: any, priority?: "high" | "medium" | "low") {
  if (priority === "high") return query.gte("priority", 50);
  if (priority === "medium") return query.gte("priority", 20).lt("priority", 50);
  if (priority === "low") return query.lt("priority", 20);
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

export function usePendingPosts({
  filters = {},
  pageSize = 10,
}: UsePendingPostsOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: ["pending-posts", filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = Number(pageParam) || 0;
      const status = normalizeStatus(filters.status);

      let request = (supabase as any)
        .from("admin_pending_post_reports")
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

      const rows = (data ?? []) as PendingPostReportRow[];
      const nextOffset = offset + rows.length;

      return {
        posts: rows.map(mapPendingPost),
        nextPage: count && nextOffset < count ? nextOffset : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const posts = query.data?.pages.flatMap((page) => page.posts) || [];

  return {
    posts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}

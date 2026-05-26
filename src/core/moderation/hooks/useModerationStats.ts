import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import type { ModerationStats } from "@/core/moderation/types";

async function countRows(table: string, build?: (query: any) => any): Promise<number> {
  let query = (supabase as any).from(table).select("id", { count: "exact", head: true });
  if (build) query = build(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export function useModerationStats() {
  return useQuery({
    queryKey: ["moderation-stats"],
    queryFn: async (): Promise<ModerationStats> => {
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
        countRows("community_reports", (query) =>
          query.eq("target_type", "post").in("status", ["pending", "under_review"]),
        ),
        countRows("community_reports", (query) =>
          query.eq("target_type", "comment").in("status", ["pending", "under_review"]),
        ),
        countRows("community_reports", (query) => query.eq("status", "approved")),
        countRows("community_reports", (query) => query.eq("status", "rejected")),
        countRows("posts", (query) => query.eq("is_hidden", true)),
        countRows("posts", (query) => query.eq("is_removed", true)),
        countRows("comments", (query) => query.eq("is_hidden", true)),
        countRows("comments", (query) => query.eq("is_removed", true)),
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
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

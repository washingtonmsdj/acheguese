import { useInfiniteQuery } from "@tanstack/react-query";
import { PendingPost, ModerationFilters } from "@/core/moderation/types";
import { RIDE_STATUS } from "@/shared/types/constants";
interface UsePendingPostsOptions {
  filters?: ModerationFilters;
  pageSize?: number;
}

export function usePendingPosts({
  filters = {},
  pageSize = 10,
}: UsePendingPostsOptions = {}) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["pending-posts", filters],
    queryFn: async () => {
      // TEMPORÁRIO: Desabilitado até estrutura de comunidade estar completa
      // Retornar array vazio para evitar erros 400/404
      return {
        posts: [],
        nextPage: undefined,
      };

      const posts: any[] = [];
      const postsError = null;

      // Filtrar apenas posts que têm denúncias
      const postsWithReports =
        posts?.filter((post: any) => post.reports && post.reports.length > 0) ||
        [];

      // Transformar dados para formato PendingPost
      const pendingPosts: PendingPost[] = postsWithReports.map((post: any) => {
        // Buscar denúncias anteriores do autor
        const authorPreviousReports = 0; // TODO: implementar query separada

        // Calcular prioridade
        const reportsCount = post.reports.length;
        const authorReputation = post.author?.points || 0;

        let priority = reportsCount * 5;
        if (authorReputation < 100) priority += 20;
        if (authorReputation < 50) priority += 30;

        // Adicionar prioridade por tipo de denúncia
        const hasHarassment = post.reports.some(
          (r: any) => r.type === "harassment",
        );
        const hasFalseInfo = post.reports.some(
          (r: any) => r.type === "false_information",
        );
        if (hasHarassment) priority += 50;
        if (hasFalseInfo) priority += 30;

        return {
          id: post.id,
          content: post.content,
          type: post.type,
          images: post.images,
          author_profile_id: post.author?.id || "",
          author_name: post.author?.name || "Desconhecido",
          author_avatar: post.author?.avatar_url || "",
          author_reputation: authorReputation,
          author_previous_reports: authorPreviousReports,
          reports: post.reports.map((r: any) => ({
            id: r.id,
            target_type: "post" as const,
            target_id: post.id,
            reporter_id: r.reporter.id,
            reporter_name: r.reporter.name,
            reporter_avatar: r.reporter.avatar_url,
            type: r.type,
            reason: r.reason,
            description: r.description,
            evidence_urls: r.evidence_urls,
            priority: r.priority,
            status: r.status,
            created_at: r.created_at,
          })),
          reports_count: reportsCount,
          priority,
          created_at: post.created_at,
          status: post.reports[0]?.status || RIDE_STATUS.PENDING,
        };
      });

      // Ordenar por prioridade
      pendingPosts.sort((a, b) => b.priority - a.priority);

      // Aplicar filtro de prioridade se especificado
      let filteredPosts = pendingPosts;
      if (filters.priority) {
        filteredPosts = pendingPosts.filter((post) => {
          if (filters.priority === "high") return post.priority >= 50;
          if (filters.priority === "medium")
            return post.priority >= 20 && post.priority < 50;
          if (filters.priority === "low") return post.priority < 20;
          return true;
        });
      }

      return {
        posts: filteredPosts,
        nextPage: filteredPosts.length === pageSize ? 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  return {
    posts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
  };
}

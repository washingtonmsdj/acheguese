import { QueryClient } from "@tanstack/react-query";

// Configuração profissional do React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: 5 * 60 * 1000,
      // Manter cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry em caso de erro
      retry: (failureCount, error: any) => {
        // Não retry em erros 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry até 3 vezes para outros erros
        return failureCount < 3;
      },
      // Refetch quando a janela ganha foco
      refetchOnWindowFocus: false,
      // Refetch quando reconecta
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations uma vez
      retry: 1,
    },
  },
});

// Query keys centralizadas para consistência
export const queryKeys = {
  // Business queries
  businesses: ["businesses"] as const,
  business: (id: string) => ["businesses", id] as const,
  businessBySlug: (slug: string) => ["businesses", "slug", slug] as const,
  businessFavorites: (userId: string) =>
    ["businesses", "favorites", userId] as const,
  businessSimilar: (id: string) => ["businesses", "similar", id] as const,

  // Profile queries
  profiles: ["profiles"] as const,
  profile: (id: string) => ["profiles", id] as const,
  profileByHandle: (handle: string) => ["profiles", "handle", handle] as const,

  // Groups queries
  groups: ["groups"] as const,
  group: (id: string) => ["groups", id] as const,
  groupMessages: (groupId: string) => ["groups", groupId, "messages"] as const,
  groupMembers: (groupId: string) => ["groups", groupId, "members"] as const,

  // Feed queries
  feed: ["feed"] as const,
  posts: ["posts"] as const,
  post: (id: string) => ["posts", id] as const,
} as const;

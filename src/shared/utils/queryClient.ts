/**
 * SSOT - React Query Client Configuration
 * 
 * Configuração otimizada do React Query seguindo SSOT.
 * Importa configurações de cache do config centralizado.
 * 
 * @see src/config/reactQuery.config.ts - Configuração completa
 * @version 2.0.0
 */

import { createQueryClient, QUERY_KEYS } from "@/config/reactQuery.config";

/**
 * Query Client Instance
 * 
 * Instância configurada com estratégias de cache otimizadas:
 * - Static data: 24h cache
 * - User data: 5min cache
 * - Realtime data: 0s cache
 * - List data: 2min cache
 */
export const queryClient = createQueryClient();

/**
 * Query Keys (Legacy Support)
 * 
 * Mantido para compatibilidade com código existente.
 * Novos códigos devem usar QUERY_KEYS de reactQuery.config.ts
 * 
 * @deprecated Use QUERY_KEYS from @/config/reactQuery.config.ts
 */
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

/**
 * Re-export QUERY_KEYS from SSOT config
 * 
 * Use estas keys para novos códigos.
 */
export { QUERY_KEYS };

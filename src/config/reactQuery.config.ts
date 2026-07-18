/**
 * REACT QUERY CONFIGURATION - OPTIMIZED
 *
 * Configuração otimizada de cache e stale time baseada no tipo de dado:
 * - Static data: 24h cache (categories, locations)
 * - User data: 5min cache (profile, subscriptions)
 * - Real-time data: 0s cache (notifications, messages)
 *
 * @version 1.0.0
 * @author Kiro AI
 */
import { logger } from "@/shared/utils/logger";
import {
  QueryClient,
  DefaultOptions,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import {
  captureSentryMessage,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config";

type AppErrorLike = {
  status?: number;
  code?: string;
  message?: string;
  stack?: string;
};

function toAppErrorLike(error: unknown): AppErrorLike {
  if (typeof error === "object" && error !== null) {
    return error as AppErrorLike;
  }
  return { message: String(error) };
}

function serializeDiagnosticValue(value: unknown, fallback: string): string {
  try {
    return JSON.stringify(value) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Cache strategies por tipo de dado
 */
export const CACHE_STRATEGIES = {
  // Dados estáticos (raramente mudam)
  STATIC: {
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  },

  // Dados de usuário (mudam ocasionalmente)
  USER: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  },

  // Dados em tempo real (sempre frescos)
  REALTIME: {
    staleTime: 0, // Always fresh
    gcTime: 1000 * 60 * 5, // 5 minutes
  },

  // Dados de listagem (com paginação)
  LIST: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  },
} as const;

/**
 * Query keys organizadas por domínio
 */
export const QUERY_KEYS = {
  // Auth & User
  auth: {
    user: ["auth", "user"] as const,
    session: ["auth", "session"] as const,
    profile: (userId: string) => ["auth", "profile", userId] as const,
  },

  // Locations (static)
  locations: {
    all: ["locations"] as const,
    tree: ["locations", "tree"] as const,
    byId: (id: string) => ["locations", id] as const,
    byType: (type: string) => ["locations", "type", type] as const,
  },

  // Categories (static)
  categories: {
    all: ["categories"] as const,
    byType: (type: string) => ["categories", "type", type] as const,
  },

  // Businesses
  businesses: {
    all: ["businesses"] as const,
    list: (filters: Record<string, unknown>) =>
      ["businesses", "list", filters] as const,
    byId: (id: string) => ["businesses", id] as const,
    bySlug: (slug: string) => ["businesses", "slug", slug] as const,
    stats: (id: string) => ["businesses", id, "stats"] as const,
  },

  // Gastronomy
  gastronomy: {
    subscriptions: (userId: string) =>
      ["gastronomy", "subscriptions", userId] as const,
    menus: (businessId: string) => ["gastronomy", "menus", businessId] as const,
  },

  // Community
  community: {
    groups: ["groups"] as const,
    group: (groupId: string) => ["groups", groupId] as const,
    groupMessages: (groupId: string) =>
      ["groups", groupId, "messages"] as const,
    groupMembers: (groupId: string) => ["groups", groupId, "members"] as const,
    lostFound: (filters: Record<string, unknown>) =>
      ["community", "lost-found", filters] as const,
    questions: (filters: Record<string, unknown>) =>
      ["community", "questions", filters] as const,
  },

  // Mobility
  mobility: {
    rideRequests: (userId: string) =>
      ["mobility", "ride-requests", userId] as const,
    rideOffers: (filters: Record<string, unknown>) =>
      ["mobility", "ride-offers", filters] as const,
  },

  // Notifications (realtime)
  notifications: {
    list: (userId: string) => ["notifications", userId] as const,
    unreadCount: (userId: string) =>
      ["notifications", userId, "unread-count"] as const,
    preferences: (userId: string) =>
      ["notifications", userId, "preferences"] as const,
  },

  // Billing
  billing: {
    subscription: (userId: string) =>
      ["billing", "subscription", userId] as const,
    plans: ["billing", "plans"] as const,
    invoices: (userId: string) => ["billing", "invoices", userId] as const,
  },
} as const;

/**
 * Default options para o QueryClient
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Configuração padrão (USER strategy)
    staleTime: CACHE_STRATEGIES.USER.staleTime,
    gcTime: CACHE_STRATEGIES.USER.gcTime,

    // Retry logic
    retry: (failureCount, error: unknown) => {
      const appError = toAppErrorLike(error);
      // Não retry em erros 4xx (client errors)
      if ((appError.status ?? 0) >= 400 && (appError.status ?? 0) < 500) {
        return false;
      }
      // Não retry em erros de contrato/schema do PostgREST/PostgreSQL
      const errorCode = typeof appError.code === "string" ? appError.code : "";
      if (errorCode.startsWith("PGRST") || /^[0-9A-Z]{5}$/.test(errorCode)) {
        return false;
      }
      // Retry até 3 vezes em erros 5xx
      return failureCount < 3;
    },

    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch behavior
    refetchOnWindowFocus: false, // Evita refetch desnecessário
    refetchOnReconnect: true, // Refetch quando reconectar
    refetchOnMount: true, // Refetch ao montar componente

    // Network mode
    networkMode: "online", // Só faz queries quando online
  },

  mutations: {
    // Retry logic para mutations
    retry: false, // Não retry mutations por padrão

    // Network mode
    networkMode: "online",
  },
};

/**
 * QueryCache global com handlers de erro/sucesso (TanStack Query v5)
 */
const queryCache = new QueryCache({
  onError: (error: unknown) => {
    const appError = toAppErrorLike(error);
    if (import.meta.env.PROD) {
      captureSentryMessage(
        `Query error: ${appError.message || "Unknown error"}`,
        "error",
        {
          error: appError.message,
          status: appError.status,
          stack: appError.stack,
        },
      );
    } else {
      logger.error("Query error:", error);
    }
  },
  onSuccess: (data: unknown, query) => {
    const queryKey = query.queryKey;
    const serializedData = serializeDiagnosticValue(data, "undefined");
    const serializedQueryKey = serializeDiagnosticValue(
      queryKey,
      "unknown-query",
    );
    const dataUpdatedAt = query.state?.dataUpdatedAt || Date.now();
    const duration = Date.now() - dataUpdatedAt;

    if (duration > 3000) {
      const message = `Slow query detected: ${serializedQueryKey.substring(0, 100)}`;

      if (import.meta.env.PROD) {
        captureSentryMessage(message, "warning", {
          queryKey: serializedQueryKey,
          duration,
          dataSize: serializedData.length,
        });
      } else if (import.meta.env.VITE_DEBUG_PERFORMANCE === "true") {
        logger.warn(message, { queryKey, duration });
      }
    }

    if (import.meta.env.PROD && duration > 1000) {
      addSentryBreadcrumb(
        `Query completed: ${serializedQueryKey.substring(0, 50)}`,
        "query",
        "info",
        { duration, dataSize: serializedData.length },
      );
    }
  },
});

/**
 * MutationCache global com handlers de erro/sucesso (TanStack Query v5)
 */
const mutationCache = new MutationCache({
  onError: (error: unknown) => {
    const appError = toAppErrorLike(error);
    if (import.meta.env.PROD) {
      captureSentryMessage(
        `Mutation error: ${appError.message || "Unknown error"}`,
        "error",
        {
          error: appError.message,
          status: appError.status,
          stack: appError.stack,
        },
      );
    } else {
      logger.error("Mutation error:", error);
    }
  },
  onSuccess: (
    _data: unknown,
    _variables: unknown,
    _context: unknown,
    mutation,
  ) => {
    const mutationKey = mutation.options?.mutationKey;
    const serializedMutationKey = serializeDiagnosticValue(
      mutationKey,
      "anonymous-mutation",
    );
    const duration = Date.now() - (mutation.state?.submittedAt || Date.now());

    if (duration > 5000) {
      const message = `Slow mutation detected: ${serializedMutationKey.substring(0, 100)}`;

      if (import.meta.env.PROD) {
        captureSentryMessage(message, "warning", {
          mutationKey: serializedMutationKey,
          duration,
        });
      } else if (import.meta.env.VITE_DEBUG_PERFORMANCE === "true") {
        logger.warn(message, { mutationKey, duration });
      }
    }

    if (import.meta.env.PROD && duration > 2000) {
      addSentryBreadcrumb(
        `Mutation completed: ${serializedMutationKey.substring(0, 50)}`,
        "mutation",
        "info",
        { duration },
      );
    }
  },
});

/**
 * Cria uma instância configurada do QueryClient
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions,
    queryCache,
    mutationCache,
  });
}

/**
 * Helper para criar query options com cache strategy específica
 */
export function createQueryOptions<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  strategy: keyof typeof CACHE_STRATEGIES = "USER",
  options?: {
    enabled?: boolean;
    keepPreviousData?: boolean;
    refetchInterval?: number;
  },
) {
  const cacheStrategy = (() => {
    switch (strategy) {
      case "STATIC":
        return CACHE_STRATEGIES.STATIC;
      case "USER":
        return CACHE_STRATEGIES.USER;
      case "REALTIME":
        return CACHE_STRATEGIES.REALTIME;
      case "LIST":
        return CACHE_STRATEGIES.LIST;
      default:
        return CACHE_STRATEGIES.USER;
    }
  })();

  return {
    queryKey,
    queryFn,
    ...cacheStrategy,
    ...options,
  };
}

/**
 * Helper para invalidar queries por domínio
 */
export function getInvalidationKeys(domain: keyof typeof QUERY_KEYS) {
  return [domain];
}

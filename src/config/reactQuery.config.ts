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
import { logger } from '@/shared/utils/logger';
import { QueryClient, DefaultOptions, QueryCache, MutationCache } from '@tanstack/react-query';
import { captureSentryMessage, addSentryBreadcrumb } from '@/shared/config/sentry.config';

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
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },
  
  // Locations (static)
  locations: {
    all: ['locations'] as const,
    tree: ['locations', 'tree'] as const,
    byId: (id: string) => ['locations', id] as const,
    byType: (type: string) => ['locations', 'type', type] as const,
  },
  
  // Categories (static)
  categories: {
    all: ['categories'] as const,
    byType: (type: string) => ['categories', 'type', type] as const,
  },
  
  // Businesses
  businesses: {
    all: ['businesses'] as const,
    list: (filters: Record<string, any>) => ['businesses', 'list', filters] as const,
    byId: (id: string) => ['businesses', id] as const,
    bySlug: (slug: string) => ['businesses', 'slug', slug] as const,
    stats: (id: string) => ['businesses', id, 'stats'] as const,
  },
  
  // Gastronomy
  gastronomy: {
    subscriptions: (userId: string) => ['gastronomy', 'subscriptions', userId] as const,
    menus: (businessId: string) => ['gastronomy', 'menus', businessId] as const,
  },
  
  // Mobility
  mobility: {
    rideRequests: (userId: string) => ['mobility', 'ride-requests', userId] as const,
    rideOffers: (filters: Record<string, any>) => ['mobility', 'ride-offers', filters] as const,
  },
  
  // Notifications (realtime)
  notifications: {
    list: (userId: string) => ['notifications', userId] as const,
    unreadCount: (userId: string) => ['notifications', userId, 'unread-count'] as const,
    preferences: (userId: string) => ['notifications', userId, 'preferences'] as const,
  },
  
  // Billing
  billing: {
    subscription: (userId: string) => ['billing', 'subscription', userId] as const,
    plans: ['billing', 'plans'] as const,
    invoices: (userId: string) => ['billing', 'invoices', userId] as const,
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
    retry: (failureCount, error: any) => {
      // Não retry em erros 4xx (client errors)
      if (error?.status >= 400 && error?.status < 500) {
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
    networkMode: 'online', // Só faz queries quando online
  },
  
  mutations: {
    // Retry logic para mutations
    retry: false, // Não retry mutations por padrão
    
    // Network mode
    networkMode: 'online',
  },
};

/**
 * QueryCache global com handlers de erro/sucesso (TanStack Query v5)
 */
const queryCache = new QueryCache({
  onError: (error: any) => {
    if (import.meta.env.PROD) {
      captureSentryMessage(
        `Query error: ${error?.message || 'Unknown error'}`,
        'error',
        {
          error: error?.message,
          status: error?.status,
          stack: error?.stack,
        }
      );
    } else {
      logger.error('Query error:', error);
    }
  },
  onSuccess: (data: any, query: any) => {
    const queryKey = query.queryKey;
    const dataUpdatedAt = query.state?.dataUpdatedAt || Date.now();
    const duration = Date.now() - dataUpdatedAt;
    
    if (duration > 3000) {
      const message = `Slow query detected: ${JSON.stringify(queryKey).substring(0, 100)}`;
      
      if (import.meta.env.PROD) {
        captureSentryMessage(message, 'warning', {
          queryKey: JSON.stringify(queryKey),
          duration,
          dataSize: JSON.stringify(data).length,
        });
      } else if (import.meta.env.VITE_DEBUG_PERFORMANCE === 'true') {
        logger.warn(message, { queryKey, duration });
      }
    }
    
    if (import.meta.env.PROD && duration > 1000) {
      addSentryBreadcrumb(
        `Query completed: ${JSON.stringify(queryKey).substring(0, 50)}`,
        'query',
        'info',
        { duration, dataSize: JSON.stringify(data).length }
      );
    }
  },
});
  
  mutations: {
    // Retry logic para mutations
    retry: false, // Não retry mutations por padrão
    
    // Network mode
    networkMode: 'online',
    
    // Performance monitoring
    onError: (error: any) => {
      // Log mutation error para Sentry
      if (import.meta.env.PROD) {
        captureSentryMessage(
          `Mutation error: ${error?.message || 'Unknown error'}`,
          'error',
          {
            error: error?.message,
            status: error?.status,
            stack: error?.stack,
          }
        );
      } else {
        logger.error('Mutation error:', error);
      }
    },
    
    onSuccess: (data: any, variables: any, context: any, mutation: any) => {
      // Monitor mutation performance
      const mutationKey = mutation.options?.mutationKey;
      const duration = Date.now() - (mutation.state?.submittedAt || Date.now());
      
      // Alert on slow mutations (> 5s)
      if (duration > 5000) {
        const message = `Slow mutation detected: ${JSON.stringify(mutationKey).substring(0, 100)}`;
        
        if (import.meta.env.PROD) {
          captureSentryMessage(message, 'warning', {
            mutationKey: JSON.stringify(mutationKey),
            duration,
          });
        } else if (import.meta.env.VITE_DEBUG_PERFORMANCE === 'true') {
          logger.warn(message, { mutationKey, duration });
        }
      }
      
      // Add breadcrumb for tracking
      if (import.meta.env.PROD && duration > 2000) {
        addSentryBreadcrumb(
          `Mutation completed: ${JSON.stringify(mutationKey).substring(0, 50)}`,
          'mutation',
          'info',
          { duration }
        );
      }
    },
  },
};

/**
 * Cria uma instância configurada do QueryClient
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions,
  });
}

/**
 * Helper para criar query options com cache strategy específica
 */
export function createQueryOptions<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  strategy: keyof typeof CACHE_STRATEGIES = 'USER',
  options?: {
    enabled?: boolean;
    keepPreviousData?: boolean;
    refetchInterval?: number;
  }
) {
  return {
    queryKey,
    queryFn,
    ...CACHE_STRATEGIES[strategy],
    ...options,
  };
}

/**
 * Helper para invalidar queries por domínio
 */
export function getInvalidationKeys(domain: keyof typeof QUERY_KEYS) {
  return [domain];
}

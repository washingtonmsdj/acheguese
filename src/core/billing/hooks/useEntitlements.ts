/**
 * useEntitlements — Hook para consumir entitlements resolvidos
 *
 * REGRAS ARQUITETURAIS:
 *   - Apenas orquestração e cache (React Query)
 *   - Toda lógica de negócio está em EntitlementResolver
 *   - Nunca calcular entitlement localmente
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F1_1_SANEAMENTO_MODELAGEM.md
 *
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { 
  EntitlementResolver, 
  type EntitlementContext, 
  type ResolvedEntitlements 
} from '../services/EntitlementResolver';
import type { PlanEntitlements } from '../services/BillingPlanService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface UseEntitlementsOptions {
  business_id?: string;
  subscription_scope?: 'user' | 'business' | 'profile' | 'worker';
  enabled?: boolean;
}

export interface UseEntitlementsResult {
  entitlements: ResolvedEntitlements | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Helpers
  can: (entitlement: keyof PlanEntitlements) => boolean;
  hasShortLink: boolean;
  hasShortPremiumLink: boolean;
  isPremium: boolean;
  isActive: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEntitlements(
  options: UseEntitlementsOptions = {}
): UseEntitlementsResult {
  const { user } = useAuth();
  const { business_id, subscription_scope = 'user', enabled = true } = options;
  
  // Query key
  const queryKey = ['entitlements', user?.id, business_id, subscription_scope];
  
  // Query
  const {
    data: entitlements,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const context: EntitlementContext = {
        user_id: user.id,
        business_id,
        subscription_scope,
      };
      
      return EntitlementResolver.resolve(context);
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
  });
  
  // Helper: verificar entitlement específico
  const can = (entitlement: keyof PlanEntitlements): boolean => {
    if (!entitlements) return false;
    const value = entitlements[entitlement];
    
    // Booleano
    if (typeof value === 'boolean') {
      return value;
    }
    
    // Número (limite)
    if (typeof value === 'number') {
      return value > 0;
    }
    
    // null = ilimitado
    if (value === null) {
      return true;
    }
    
    return false;
  };
  
  return {
    entitlements: entitlements || null,
    isLoading,
    isError,
    error: error as Error | null,
    
    // Helpers
    can,
    hasShortLink: can('canUseShortLink'),
    hasShortPremiumLink: can('canUseShortPremiumLink'),
    isPremium: entitlements?.planTier !== 'free',
    isActive: entitlements?.isActive ?? false,
  };
}

/**
 * Hook específico para verificar link curto premium.
 * Uso comum em componentes de compartilhamento.
 */
export function useHasShortPremiumLink(business_id?: string): boolean {
  const { hasShortPremiumLink } = useEntitlements({
    business_id,
    subscription_scope: business_id ? 'business' : 'user',
  });
  
  return hasShortPremiumLink;
}

/**
 * Hook para verificar se é premium (qualquer plano pago).
 */
export function useIsPremium(business_id?: string): boolean {
  const { isPremium } = useEntitlements({
    business_id,
    subscription_scope: business_id ? 'business' : 'user',
  });
  
  return isPremium;
}

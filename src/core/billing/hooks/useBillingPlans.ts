/**
 * HOOKS: Billing Plans
 * 
 * Busca planos de assinatura do banco com cache via React Query
 * 
 * Padrão SSOT:
 * - Dados sempre vêm do banco via BillingPlanService
 * - Cache de 5 minutos via React Query
 * - Invalidação automática em mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillingPlanService } from '../services/BillingPlanService';
import type { BillingPlan, PlanEntitlements } from '../services/BillingPlanService';

// ══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ══════════════════════════════════════════════════════════════════════════

const QUERY_KEYS = {
  all: ['billing-plans'] as const,
  byCode: (code: string) => ['billing-plans', code] as const,
  entitlements: (code: string) => ['billing-plans', code, 'entitlements'] as const,
  featured: ['billing-plans', 'featured'] as const,
};

function getEntitlementEntry(
  entitlements: PlanEntitlements,
  key: keyof PlanEntitlements,
): PlanEntitlements[keyof PlanEntitlements] | undefined {
  return Object.entries(entitlements).find(([entryKey]) => entryKey === key)?.[1] as
    | PlanEntitlements[keyof PlanEntitlements]
    | undefined;
}

function getEntitlementValue(
  entitlements: PlanEntitlements | undefined,
  entitlement: keyof PlanEntitlements,
): boolean {
  if (!entitlements) {
    return false;
  }

  const value = getEntitlementEntry(entitlements, entitlement);

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value > 0;
  }

  return value === null;
}

function getLimitValue(
  entitlements: PlanEntitlements | undefined,
  limitKey: keyof Pick<
    PlanEntitlements,
    "maxMenuItems" | "maxPromotions" | "maxImages" | "maxCategories" | "maxCombos" | "maxOrdersPerDay"
  >,
): number | null {
  if (!entitlements) {
    return null;
  }

  const value = getEntitlementEntry(entitlements, limitKey);
  if (typeof value === "number") return value;
  return null;
}

// ══════════════════════════════════════════════════════════════════════════
// HOOKS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Buscar todos os planos ativos
 * 
 * @example
 * ```tsx
 * function PricingPage() {
 *   const { data: plans, isLoading } = useBillingPlans();
 *   
 *   if (isLoading) return <Loading />;
 *   
 *   return (
 *     <div>
 *       {plans?.map(plan => (
 *         <PlanCard key={plan.id} plan={plan} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBillingPlans() {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: () => BillingPlanService.getActivePlans(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
  });
}

/**
 * Buscar plano específico por código
 * 
 * @example
 * ```tsx
 * function PlanDetails({ planCode }: { planCode: string }) {
 *   const { data: plan, isLoading } = useBillingPlan(planCode);
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (!plan) return <NotFound />;
 *   
 *   return (
 *     <div>
 *       <h1>{plan.name}</h1>
 *       <p>{plan.priceDisplay}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBillingPlan(code: string) {
  return useQuery({
    queryKey: QUERY_KEYS.byCode(code),
    queryFn: () => BillingPlanService.getPlanByCode(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Buscar entitlements de um plano
 * 
 * @example
 * ```tsx
 * function FeatureGate({ planCode, children }: Props) {
 *   const { data: entitlements } = usePlanEntitlements(planCode);
 *   
 *   if (!entitlements?.canUseAdvancedMenu) {
 *     return <UpgradePrompt />;
 *   }
 *   
 *   return <>{children}</>;
 * }
 * ```
 */
export function usePlanEntitlements(code: string) {
  return useQuery({
    queryKey: QUERY_KEYS.entitlements(code),
    queryFn: () => BillingPlanService.getEntitlements(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Buscar plano em destaque (featured)
 * 
 * @example
 * ```tsx
 * function FeaturedPlan() {
 *   const { data: plan } = useFeaturedPlan();
 *   
 *   if (!plan) return null;
 *   
 *   return (
 *     <div className="featured">
 *       <Badge>Mais Popular</Badge>
 *       <PlanCard plan={plan} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeaturedPlan() {
  return useQuery({
    queryKey: QUERY_KEYS.featured,
    queryFn: () => BillingPlanService.getFeaturedPlan(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Verificar se plano requer pagamento
 * 
 * @example
 * ```tsx
 * function CheckoutButton({ planCode }: Props) {
 *   const { data: requiresPayment } = useRequiresPayment(planCode);
 *   
 *   if (!requiresPayment) {
 *     return <Button>Ativar Grátis</Button>;
 *   }
 *   
 *   return <Button>Assinar Agora</Button>;
 * }
 * ```
 */
export function useRequiresPayment(code: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.byCode(code), 'requires-payment'],
    queryFn: () => BillingPlanService.requiresPayment(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Limpar cache de planos (útil após admin atualizar planos)
 * 
 * @example
 * ```tsx
 * function AdminPlanEditor() {
 *   const clearCache = useClearPlansCache();
 *   
 *   const handleSave = async () => {
 *     await savePlan();
 *     clearCache(); // Força reload dos planos
 *   };
 * }
 * ```
 */
export function useClearPlansCache() {
  const queryClient = useQueryClient();

  return () => {
    BillingPlanService.clearCache();
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
  };
}

// ══════════════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Verificar se usuário tem uma capacidade específica
 * 
 * @example
 * ```tsx
 * function AdvancedMenuButton() {
 *   const canUse = useHasEntitlement('pro', 'canUseAdvancedMenu');
 *   
 *   if (!canUse) return null;
 *   
 *   return <Button>Menu Avançado</Button>;
 * }
 * ```
 */
export function useHasEntitlement(
  planCode: string,
  entitlement: keyof PlanEntitlements
) {
  const { data: entitlements } = usePlanEntitlements(planCode);
  return getEntitlementValue(entitlements, entitlement);
}

/**
 * Verificar limite de um plano
 * 
 * @example
 * ```tsx
 * function MenuItemsList({ planCode, items }: Props) {
 *   const maxItems = usePlanLimit(planCode, 'maxMenuItems');
 *   const isAtLimit = maxItems !== null && items.length >= maxItems;
 *   
 *   return (
 *     <div>
 *       {isAtLimit && <Alert>Limite atingido. Faça upgrade!</Alert>}
 *       {items.map(item => <MenuItem key={item.id} {...item} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlanLimit(
  planCode: string,
  limitKey: keyof Pick<
    PlanEntitlements,
    'maxMenuItems' | 'maxPromotions' | 'maxImages' | 'maxCategories' | 'maxCombos' | 'maxOrdersPerDay'
  >
) {
  const { data: entitlements } = usePlanEntitlements(planCode);
  return getLimitValue(entitlements, limitKey);
}

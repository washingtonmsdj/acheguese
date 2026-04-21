/**
 * useCatalog — Hook para consumir catálogo comercial
 *
 * REGRAS ARQUITETURAIS:
 *   - Apenas orquestração e cache (React Query)
 *   - Toda lógica de negócio está em CatalogService
 *   - Nunca calcular elegibilidade localmente
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F3_SERVICES_RESTANTES.md
 *
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { 
  CatalogService, 
  type EligibilityContext, 
  type EligibleCatalog,
  type CatalogItem 
} from '../services/CatalogService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface UseCatalogOptions {
  entity_family: 'company' | 'professional' | 'worker';
  vertical: string;
  user_id: string;
  enabled?: boolean;
}

export interface UseCatalogResult {
  catalog: EligibleCatalog | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Helpers
  basePlans: CatalogItem[];
  verticalPackages: CatalogItem[];
  addons: CatalogItem[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

const QUERY_KEYS = {
  catalog: (context: EligibilityContext) => 
    ['catalog', context.entity_family, context.vertical] as const,
  planByCode: (code: string) => ['catalog', 'plan', code] as const,
  addonsByVertical: (vertical: string) => ['catalog', 'addons', vertical] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Busca catálogo elegível por contexto.
 * 
 * @example
 * ```tsx
 * function PlansPage() {
 *   const { catalog, basePlans, isLoading } = useCatalog({
 *     entity_family: 'company',
 *     vertical: 'gastronomy',
 *     user_id: user.id,
 *   });
 *   
 *   if (isLoading) return <Loading />;
 *   
 *   return (
 *     <div>
 *       {basePlans.map(plan => (
 *         <PlanCard key={plan.id} plan={plan} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCatalog(options: UseCatalogOptions): UseCatalogResult {
  const { entity_family, vertical, user_id, enabled = true } = options;
  
  const context: EligibilityContext = {
    user_id,
    entity_family,
    vertical,
  };
  
  const {
    data: catalog,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog(context),
    queryFn: () => CatalogService.getEligibleCatalog(context),
    enabled: enabled && !!user_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
  });
  
  return {
    catalog: catalog || null,
    isLoading,
    isError,
    error: error as Error | null,
    
    // Helpers
    basePlans: catalog?.base_plans || [],
    verticalPackages: catalog?.vertical_packages || [],
    addons: catalog?.addons || [],
  };
}

/**
 * Busca plano específico por código.
 * 
 * @example
 * ```tsx
 * function PlanDetails({ planCode }: Props) {
 *   const { data: plan, isLoading } = usePlanByCode(planCode);
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (!plan) return <NotFound />;
 *   
 *   return <PlanCard plan={plan} />;
 * }
 * ```
 */
export function usePlanByCode(planCode: string) {
  return useQuery({
    queryKey: QUERY_KEYS.planByCode(planCode),
    queryFn: () => CatalogService.getPlanByCode(planCode),
    enabled: !!planCode,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Lista addons disponíveis por vertical.
 * 
 * @example
 * ```tsx
 * function AddonsPage({ vertical }: Props) {
 *   const { data: addons, isLoading } = useAddonsByVertical(vertical);
 *   
 *   if (isLoading) return <Loading />;
 *   
 *   return (
 *     <div>
 *       {addons?.map(addon => (
 *         <AddonCard key={addon.id} addon={addon} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAddonsByVertical(vertical: string) {
  return useQuery({
    queryKey: QUERY_KEYS.addonsByVertical(vertical),
    queryFn: () => CatalogService.getAddonsByVertical(vertical),
    enabled: !!vertical,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Valida elegibilidade de item para usuário.
 * 
 * @example
 * ```tsx
 * function CheckoutButton({ itemId }: Props) {
 *   const { data: eligibility } = useValidateEligibility(context, itemId);
 *   
 *   if (!eligibility?.eligible) {
 *     return <Alert>{eligibility?.reason}</Alert>;
 *   }
 *   
 *   return <Button>Contratar</Button>;
 * }
 * ```
 */
export function useValidateEligibility(
  context: EligibilityContext,
  itemId: string
) {
  return useQuery({
    queryKey: ['catalog', 'eligibility', context.user_id, itemId],
    queryFn: () => CatalogService.validateEligibility(context, itemId),
    enabled: !!context.user_id && !!itemId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

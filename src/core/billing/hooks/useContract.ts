/**
 * useContract — Hook para gestão de contratos
 *
 * REGRAS ARQUITETURAIS:
 *   - Apenas orquestração e cache (React Query)
 *   - Toda lógica de negócio está em SubscriptionContractService
 *   - Nunca manipular contratos localmente
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F3_SERVICES_RESTANTES.md
 *
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  SubscriptionContractService,
  type CreateContractParams,
  type UpdateContractParams,
  type CancelContractParams,
  type SubscriptionContract,
} from '../services/SubscriptionContractService';
import { toast } from 'sonner';

// ─── Query Keys ───────────────────────────────────────────────────────────────

const QUERY_KEYS = {
  activeContract: (userId: string, scope: string, businessId?: string) =>
    ['contract', 'active', userId, scope, businessId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Busca contrato ativo.
 * 
 * @example
 * ```tsx
 * function SubscriptionStatus() {
 *   const { data: contract, isLoading } = useActiveContract({
 *     user_id: user.id,
 *     scope: 'business',
 *     business_id: businessId,
 *   });
 *   
 *   if (isLoading) return <Loading />;
 *   if (!contract) return <NoSubscription />;
 *   
 *   return <ContractDetails contract={contract} />;
 * }
 * ```
 */
export function useActiveContract(params: {
  user_id: string;
  scope: 'user' | 'business' | 'profile' | 'worker';
  business_id?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.activeContract(params.user_id, params.scope, params.business_id),
    queryFn: () => SubscriptionContractService.getActiveContract(
      params.user_id,
      params.scope,
      params.business_id
    ),
    enabled: params.enabled !== false && !!params.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Cria novo contrato.
 * 
 * @example
 * ```tsx
 * function CheckoutButton({ planCode }: Props) {
 *   const createContract = useCreateContract();
 *   
 *   const handleCheckout = async () => {
 *     const result = await createContract.mutateAsync({
 *       user_id: user.id,
 *       plan_code: planCode,
 *       subscription_scope: 'business',
 *       business_id: businessId,
 *       entity_family: 'company',
 *       vertical: 'gastronomy',
 *     });
 *     
 *     if (result.success) {
 *       toast.success('Contrato criado com sucesso!');
 *     }
 *   };
 *   
 *   return <Button onClick={handleCheckout}>Contratar</Button>;
 * }
 * ```
 */
export function useCreateContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: CreateContractParams) =>
      SubscriptionContractService.createContract(params),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidar cache de contratos ativos
        queryClient.invalidateQueries({
          queryKey: ['contract', 'active', variables.user_id],
        });
        
        // Invalidar cache de entitlements
        queryClient.invalidateQueries({
          queryKey: ['entitlements', variables.user_id],
        });
      }
    },
  });
}

/**
 * Atualiza contrato existente.
 * 
 * @example
 * ```tsx
 * function UpgradeButton({ subscriptionId, newPlanCode }: Props) {
 *   const updateContract = useUpdateContract();
 *   
 *   const handleUpgrade = async () => {
 *     const result = await updateContract.mutateAsync({
 *       subscription_id: subscriptionId,
 *       changes: {
 *         plan_code: newPlanCode,
 *       },
 *       reason: 'Upgrade para plano superior',
 *     });
 *     
 *     if (result.success) {
 *       toast.success('Plano atualizado com sucesso!');
 *     }
 *   };
 *   
 *   return <Button onClick={handleUpgrade}>Fazer Upgrade</Button>;
 * }
 * ```
 */
export function useUpdateContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: UpdateContractParams) =>
      SubscriptionContractService.updateContract(params),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidar todos os caches relacionados
        queryClient.invalidateQueries({ queryKey: ['contract'] });
        queryClient.invalidateQueries({ queryKey: ['entitlements'] });
      }
    },
  });
}

/**
 * Cancela contrato.
 * 
 * @example
 * ```tsx
 * function CancelButton({ subscriptionId }: Props) {
 *   const cancelContract = useCancelContract();
 *   
 *   const handleCancel = async () => {
 *     const confirmed = await confirm('Tem certeza que deseja cancelar?');
 *     if (!confirmed) return;
 *     
 *     const result = await cancelContract.mutateAsync({
 *       subscription_id: subscriptionId,
 *       reason: 'Cancelamento solicitado pelo usuário',
 *       cancel_at_period_end: true,
 *     });
 *     
 *     if (result.success) {
 *       toast.success('Assinatura cancelada. Acesso até o fim do período.');
 *     }
 *   };
 *   
 *   return <Button onClick={handleCancel} variant="destructive">Cancelar</Button>;
 * }
 * ```
 */
export function useCancelContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: CancelContractParams) =>
      SubscriptionContractService.cancelContract(params),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['contract'] });
        queryClient.invalidateQueries({ queryKey: ['entitlements'] });
      }
    },
  });
}

/**
 * Renova contrato.
 * 
 * @example
 * ```tsx
 * function RenewButton({ subscriptionId }: Props) {
 *   const renewContract = useRenewContract();
 *   
 *   const handleRenew = async () => {
 *     const result = await renewContract.mutateAsync(subscriptionId);
 *     
 *     if (result.success) {
 *       toast.success('Assinatura renovada com sucesso!');
 *     }
 *   };
 *   
 *   return <Button onClick={handleRenew}>Renovar</Button>;
 * }
 * ```
 */
export function useRenewContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      SubscriptionContractService.renewContract(subscriptionId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['contract'] });
        queryClient.invalidateQueries({ queryKey: ['entitlements'] });
      }
    },
  });
}

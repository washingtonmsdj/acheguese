/**
 * useQrCode — Hook para gerenciar QR Code de entidade
 *
 * SSOT: Hook central que todos os módulos devem usar.
 * 
 * Uso:
 * ```typescript
 * const { qrCode, qrUrl, analytics, isLoading, regenerate } = useQrCode({
 *   entityType: 'business',
 *   entityId: businessId,
 * });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QrCodeService } from '../QrCodeService';
import type { QrEntityType, QrStyleVariant, QrDestinationVariant } from '../types';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface UseQrCodeParams {
  entityType: QrEntityType;
  entityId: string;
  ownerProfileId?: string;
  canonicalUrl?: string;
  shortUrl?: string;
  styleVariant?: QrStyleVariant;
  destinationVariant?: QrDestinationVariant;
}

// ══════════════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════════════

export function useQrCode(params: UseQrCodeParams) {
  const queryClient = useQueryClient();
  
  const {
    entityType,
    entityId,
    ownerProfileId,
    canonicalUrl,
    shortUrl,
    styleVariant,
    destinationVariant,
  } = params;
  
  // ────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Busca QR Code da entidade
   */
  const {
    data: qrCodeResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['qr-code', entityType, entityId],
    queryFn: async () => {
      return QrCodeService.getByEntity(entityType, entityId);
    },
    enabled: !!entityType && !!entityId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  const qrCode = qrCodeResult?.data;
  
  /**
   * Busca analytics do QR Code
   */
  const {
    data: analyticsResult,
    isLoading: isLoadingAnalytics,
  } = useQuery({
    queryKey: ['qr-analytics', qrCode?.id],
    queryFn: async () => {
      if (!qrCode?.id) return null;
      return QrCodeService.getAnalytics(qrCode.id);
    },
    enabled: !!qrCode?.id,
    staleTime: 1000 * 60, // 1 minuto
  });
  
  const analytics = analyticsResult?.data;
  
  // ────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Cria QR Code
   */
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!ownerProfileId || !canonicalUrl) {
        throw new Error('ownerProfileId e canonicalUrl são obrigatórios');
      }
      
      return QrCodeService.createForEntity({
        entity_type: entityType,
        entity_id: entityId,
        canonical_url: canonicalUrl,
        short_url: shortUrl,
        owner_profile_id: ownerProfileId,
        style_variant: styleVariant,
        destination_variant: destinationVariant,
      });
    },
    onSuccess: () => {
      toast.success('QR Code criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['qr-code', entityType, entityId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar QR Code: ${error.message}`);
    },
  });
  
  /**
   * Regenera token
   */
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!qrCode?.id) throw new Error('QR Code não encontrado');
      return QrCodeService.regenerateToken(qrCode.id);
    },
    onSuccess: () => {
      toast.success('Token regenerado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['qr-code', entityType, entityId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao regenerar token: ${error.message}`);
    },
  });
  
  /**
   * Ativa/Desativa QR Code
   */
  const toggleActiveMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      if (!qrCode?.id) throw new Error('QR Code não encontrado');
      return activate
        ? QrCodeService.activate(qrCode.id)
        : QrCodeService.deactivate(qrCode.id);
    },
    onSuccess: (_, activate) => {
      toast.success(activate ? 'QR Code ativado!' : 'QR Code desativado!');
      queryClient.invalidateQueries({ queryKey: ['qr-code', entityType, entityId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  // ────────────────────────────────────────────────────────────────────────
  // COMPUTED
  // ────────────────────────────────────────────────────────────────────────
  
  const qrUrl = qrCode ? `${window.location.origin}/q/${qrCode.token}` : null;
  const hasQrCode = !!qrCode;
  const isActive = qrCode?.is_active ?? false;
  const totalScans = analytics?.total_scans ?? 0;
  
  // ────────────────────────────────────────────────────────────────────────
  // RETURN
  // ────────────────────────────────────────────────────────────────────────
  
  return {
    // Data
    qrCode,
    qrUrl,
    analytics,
    
    // Loading
    isLoading,
    isLoadingAnalytics,
    isCreating: createMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    
    // Status
    hasQrCode,
    isActive,
    totalScans,
    
    // Actions
    create: createMutation.mutateAsync,
    regenerate: regenerateMutation.mutateAsync,
    activate: () => toggleActiveMutation.mutateAsync(true),
    deactivate: () => toggleActiveMutation.mutateAsync(false),
    refetch,
    
    // Error
    error: qrCodeResult?.error || (error instanceof Error ? error.message : null),
  };
}


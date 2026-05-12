/**
 * EntitlementResolver — SSOT para resolução de capacidades/limites
 *
 * REGRAS ARQUITETURAIS:
 *   - Única fonte de verdade para decisões de entitlement
 *   - Nunca calcular entitlement em componente React
 *   - Precedência: contract_override > addon > vertical_package > base_plan > fallback
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F1_1_SANEAMENTO_MODELAGEM.md
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/supabase';
import { BillingPlanService } from '@/core/billing/services/BillingPlanService';
import { logger } from '@/shared/utils/logger';
import type { GenericBillingEntitlementAliases } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EntitlementContext {
  user_id: string;
  business_id?: string;
  subscription_scope?: 'user' | 'business' | 'profile' | 'worker';
}

export interface ResolvedEntitlements extends GenericBillingEntitlementAliases {
  // Página Pública
  canUsePremiumPublicPage: boolean;
  canUseShortPremiumLink: boolean;  // ⭐ Link curto /p/:slug
  canUseCustomQRCode: boolean;
  
  // Cardápio / Catálogo
  canUseAdvancedMenu: boolean;
  canUseMenuCategories: boolean;
  canUseMenuImages: boolean;
  canUseMenuVariations: boolean;
  canUseMenuAddons: boolean;
  canUseMenuCombos: boolean;
  canManageAvailability: boolean;
  canScheduleItems: boolean;
  
  // Pedidos
  canReceiveInternalOrders: boolean;
  canUseOrdersPanel: boolean;
  canManageOrderStatus: boolean;
  canCancelOrders: boolean;
  canViewOrderHistory: boolean;
  
  // Delivery / Operação
  canUseMotoboyNetwork: boolean;
  canRequestDelivery: boolean;
  canTrackDelivery: boolean;
  canConfigureDeliveryArea: boolean;
  canSetDeliveryFees: boolean;
  canManageBusinessHours: boolean;
  canSetMinimumOrder: boolean;
  canUseOwnDelivery: boolean;
  
  // Marketing
  canUsePromotions: boolean;
  canUseFeaturedPlacement: boolean;
  canUseBanners: boolean;
  canUseCoupons: boolean;
  canSchedulePromotions: boolean;
  
  // Analytics
  canUseBasicAnalytics: boolean;
  canUseAdvancedAnalytics: boolean;
  canExportReports: boolean;
  canViewRealtimeMetrics: boolean;
  canViewCustomerInsights: boolean;
  
  // Limites
  maxMenuItems: number | null;
  maxPromotions: number | null;
  maxImages: number | null;
  maxCategories: number | null;
  maxCombos: number | null;
  maxOrdersPerDay: number | null;
  
  // Metadata
  planTier: string;
  planName: string;
  isActive: boolean;
}

interface SubscriptionData {
  id: string;
  plan_code: string;
  status_v2: string;
  subscription_scope: string;
  contract_snapshot: Record<string, unknown>;
}

// ─── Fallback Padrão (Free) ───────────────────────────────────────────────────

const DEFAULT_FREE_ENTITLEMENTS: ResolvedEntitlements = {
  // Página Pública
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,  // ⭐ Sem link curto no free
  canUseCustomQRCode: false,
  canUsePremiumSite: false,
  canUseShortLink: false,
  
  // Cardápio
  canUseAdvancedMenu: false,
  canUseAdvancedCatalog: false,
  canUseMenuCategories: true,
  canUseMenuImages: true,
  canUseMenuVariations: false,
  canUseMenuAddons: false,
  canUseMenuCombos: false,
  canManageAvailability: true,
  canScheduleItems: false,
  
  // Pedidos
  canReceiveInternalOrders: false,
  canUseInternalOrders: false,
  canUseOrdersPanel: false,
  canManageOrderStatus: false,
  canCancelOrders: false,
  canViewOrderHistory: false,
  
  // Delivery
  canUseMotoboyNetwork: false,
  canUseDeliveryNetwork: false,
  canRequestDelivery: false,
  canUseDeliveryRequests: false,
  canTrackDelivery: false,
  canUseDeliveryTracking: false,
  canConfigureDeliveryArea: false,
  canSetDeliveryFees: false,
  canManageBusinessHours: true,
  canSetMinimumOrder: false,
  canUseOwnDelivery: false,
  
  // Marketing
  canUsePromotions: false,
  canUseFeaturedPlacement: false,
  canUseBanners: false,
  canUseCoupons: false,
  canSchedulePromotions: false,
  
  // Analytics
  canUseBasicAnalytics: false,
  canUseAdvancedAnalytics: false,
  canExportReports: false,
  canViewRealtimeMetrics: false,
  canViewCustomerInsights: false,
  
  // Limites
  maxMenuItems: 20,
  maxPromotions: 0,
  maxImages: 5,
  maxCategories: 3,
  maxCombos: 0,
  maxOrdersPerDay: null,
  
  // Metadata
  planTier: 'free',
  planName: 'Free',
  isActive: false,
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class EntitlementResolver {
  /**
   * Resolve entitlements para um contexto específico.
   * 
   * Precedência (do mais específico para o mais genérico):
   * 1. contract_override (ajuste manual no contrato)
   * 2. addon (complemento contratado)
   * 3. vertical_package (pacote vertical ativo)
   * 4. base_plan (plano base contratado)
   * 5. fallback_default (free)
   */
  static async resolve(context: EntitlementContext): Promise<ResolvedEntitlements> {
    try {
      // Buscar assinatura ativa
      const subscription = await this.getActiveSubscription(context);
      
      if (!subscription) {
        logger.info('[EntitlementResolver] Sem assinatura ativa, usando fallback free');
        return DEFAULT_FREE_ENTITLEMENTS;
      }
      
      // Verificar se assinatura está ativa
      if (subscription.status_v2 !== 'active' && subscription.status_v2 !== 'trialing') {
        logger.warn(`[EntitlementResolver] Assinatura ${subscription.id} não está ativa (${subscription.status_v2})`);
        return { ...DEFAULT_FREE_ENTITLEMENTS, isActive: false };
      }
      
      // Resolver entitlements
      return await this.resolveFromSubscription(subscription);
      
    } catch (error) {
      logger.error('[EntitlementResolver] Erro ao resolver entitlements:', error);
      return DEFAULT_FREE_ENTITLEMENTS;
    }
  }
  
  /**
   * Busca assinatura ativa para o contexto.
   */
  private static async getActiveSubscription(
    context: EntitlementContext
  ): Promise<SubscriptionData | null> {
    try {
      let query = supabase
        .from('user_subscriptions')
        .select(`
          id,
          plan_code,
          status_v2,
          subscription_scope,
          contract_snapshot
        `)
        .in('status_v2', ['active', 'trialing']);
      
      // Filtrar por escopo
      if (context.subscription_scope === 'business' && context.business_id) {
        query = query
          .eq('subscription_scope', 'business')
          .eq('business_id', context.business_id);
      } else {
        query = query
          .eq('subscription_scope', 'user')
          .eq('user_id', context.user_id);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        logger.error('[EntitlementResolver] Erro ao buscar assinatura:', error);
        return null;
      }
      
      return data as SubscriptionData | null;
      
    } catch (error) {
      logger.error('[EntitlementResolver] Erro ao buscar assinatura:', error);
      return null;
    }
  }
  
  /**
   * Resolve entitlements a partir da assinatura.
   * Aplica precedência: contract_override > addon > vertical_package > base_plan
   */
  private static async resolveFromSubscription(
    subscription: SubscriptionData
  ): Promise<ResolvedEntitlements> {
    // Começar com fallback
    const resolved = { ...DEFAULT_FREE_ENTITLEMENTS };

    const plan = await BillingPlanService.getPlanByCode(subscription.plan_code);
    const snapshotEntitlements = subscription.contract_snapshot?.catalog_item?.entitlements;

    // Aplicar entitlements do plano atual, se existir
    const policy = plan?.entitlements || snapshotEntitlements;
    if (policy) {
      
      // Página Pública
      resolved.canUsePremiumPublicPage = Boolean(policy.canUsePremiumPublicPage ?? policy.can_use_premium_public_page);
      resolved.canUseShortPremiumLink = Boolean(policy.canUseShortPremiumLink ?? policy.can_use_short_premium_link);  // ⭐
      resolved.canUseCustomQRCode = Boolean(policy.canUseCustomQRCode ?? policy.can_use_custom_qr_code);
      
      // Cardápio
      resolved.canUseAdvancedMenu = Boolean(policy.canUseAdvancedMenu ?? policy.can_use_advanced_menu);
      resolved.canUseMenuCategories = Boolean(policy.canUseMenuCategories ?? policy.can_use_advanced_menu);
      resolved.canUseMenuImages = Boolean(policy.canUseMenuImages ?? policy.can_use_advanced_menu);
      resolved.canUseMenuVariations = Boolean(policy.canUseMenuVariations ?? policy.can_use_advanced_menu);
      resolved.canUseMenuAddons = Boolean(policy.canUseMenuAddons ?? policy.can_use_advanced_menu);
      resolved.canUseMenuCombos = Boolean(policy.canUseMenuCombos ?? policy.can_use_advanced_menu);
      resolved.canScheduleItems = Boolean(policy.canScheduleItems ?? policy.can_use_advanced_menu);
      
      // Pedidos
      resolved.canReceiveInternalOrders = Boolean(policy.canReceiveInternalOrders ?? policy.can_receive_internal_orders);
      resolved.canUseOrdersPanel = Boolean(policy.canUseOrdersPanel ?? policy.can_receive_internal_orders);
      resolved.canManageOrderStatus = Boolean(policy.canManageOrderStatus ?? policy.can_receive_internal_orders);
      resolved.canCancelOrders = Boolean(policy.canCancelOrders ?? policy.can_receive_internal_orders);
      resolved.canViewOrderHistory = Boolean(policy.canViewOrderHistory ?? policy.can_receive_internal_orders);
      
      // Delivery
      resolved.canUseMotoboyNetwork = Boolean(policy.canUseMotoboyNetwork ?? policy.can_use_motoboy_network);
      resolved.canRequestDelivery = Boolean(policy.canRequestDelivery ?? policy.can_use_motoboy_network);
      resolved.canTrackDelivery = Boolean(policy.canTrackDelivery ?? policy.can_use_motoboy_network);
      resolved.canConfigureDeliveryArea = Boolean(policy.canConfigureDeliveryArea ?? policy.can_use_motoboy_network);
      resolved.canSetDeliveryFees = Boolean(policy.canSetDeliveryFees ?? policy.can_use_motoboy_network);
      resolved.canSetMinimumOrder = Boolean(policy.canSetMinimumOrder ?? policy.can_use_motoboy_network);
      resolved.canUseOwnDelivery = Boolean(policy.canUseOwnDelivery ?? policy.can_use_motoboy_network);
      
      // Marketing
      resolved.canUsePromotions = Boolean(policy.canUsePromotions ?? policy.can_use_promotions);
      resolved.canUseFeaturedPlacement = Boolean(policy.canUseFeaturedPlacement ?? policy.can_use_promotions);
      resolved.canUseCoupons = Boolean(policy.canUseCoupons ?? policy.can_use_promotions);
      resolved.canSchedulePromotions = Boolean(policy.canSchedulePromotions ?? policy.can_use_promotions);
      
      // Analytics
      resolved.canUseBasicAnalytics = Boolean(policy.canUseBasicAnalytics ?? policy.can_use_basic_analytics);
      resolved.canUseAdvancedAnalytics = Boolean(policy.canUseAdvancedAnalytics ?? policy.can_use_advanced_analytics);
      resolved.canExportReports = Boolean(policy.canExportReports ?? policy.can_use_advanced_analytics);
      resolved.canViewRealtimeMetrics = Boolean(policy.canViewRealtimeMetrics ?? policy.can_use_basic_analytics);
      resolved.canViewCustomerInsights = Boolean(policy.canViewCustomerInsights ?? policy.can_use_advanced_analytics);
      
      // Limites
      resolved.maxMenuItems = policy.maxMenuItems ?? policy.max_menu_items ?? null;
      resolved.maxPromotions = policy.maxPromotions ?? policy.max_promotions ?? null;
      resolved.maxImages = policy.maxImages ?? policy.max_images ?? null;
      resolved.maxCategories = policy.maxCategories ?? policy.max_categories ?? null;
    }
    
    // Aplicar overrides do contract_snapshot (se houver)
    if (subscription.contract_snapshot?.overrides) {
      Object.assign(resolved, subscription.contract_snapshot.overrides);
    }
    
    // Metadata
    resolved.planTier = plan?.code || subscription.plan_code || 'free';
    resolved.planName = plan?.name || 'Free';
    resolved.isActive = subscription.status_v2 === 'active' || subscription.status_v2 === 'trialing';
    this.syncGenericAliases(resolved);
    
    return resolved;
  }
  
  /**
   * Verifica se um entitlement específico está ativo.
   * Uso: gates de UI e validações backend.
   */
  static async check(
    context: EntitlementContext,
    entitlement: keyof ResolvedEntitlements
  ): Promise<boolean> {
    const resolved = await this.resolve(context);
    const value = new Map<keyof ResolvedEntitlements, ResolvedEntitlements[keyof ResolvedEntitlements]>(
      Object.entries(resolved) as [keyof ResolvedEntitlements, ResolvedEntitlements[keyof ResolvedEntitlements]][],
    ).get(entitlement);
    
    // Se for booleano, retornar direto
    if (typeof value === 'boolean') {
      return value;
    }
    
    // Se for número (limite), considerar ativo se > 0 ou null (ilimitado)
    if (typeof value === 'number') {
      return value > 0;
    }
    
    if (value === null) {
      return true; // null = ilimitado
    }
    
    return false;
  }
  
  /**
   * Verifica se tem link curto premium ativo.
   * Atalho específico para o caso de uso mais comum.
   */
  static async hasShortPremiumLink(context: EntitlementContext): Promise<boolean> {
    return this.check(context, 'canUseShortPremiumLink');
  }

  private static syncGenericAliases(resolved: ResolvedEntitlements): void {
    resolved.canUsePremiumSite = resolved.canUsePremiumPublicPage;
    resolved.canUseShortLink = resolved.canUseShortPremiumLink;
    resolved.canUseAdvancedCatalog = resolved.canUseAdvancedMenu;
    resolved.canUseInternalOrders = resolved.canReceiveInternalOrders;
    resolved.canUseDeliveryRequests = resolved.canRequestDelivery;
    resolved.canUseDeliveryTracking = resolved.canTrackDelivery;
    resolved.canUseDeliveryNetwork = resolved.canUseMotoboyNetwork;
  }
}

export const entitlementResolver = EntitlementResolver;

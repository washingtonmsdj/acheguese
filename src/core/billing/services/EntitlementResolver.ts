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
import { logger } from '@/shared/utils/logger';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EntitlementContext {
  user_id: string;
  business_id?: string;
  subscription_scope?: 'user' | 'business' | 'profile' | 'worker';
}

export interface ResolvedEntitlements {
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
  contract_snapshot: any;
  catalog_item?: {
    item_name: string;
    plan_tier: string;
    catalog_entitlement_policy: Array<{
      can_use_premium_public_page: boolean;
      can_use_short_premium_link: boolean;
      can_use_custom_qr_code: boolean;
      can_use_advanced_menu: boolean;
      can_receive_internal_orders: boolean;
      can_use_motoboy_network: boolean;
      can_use_promotions: boolean;
      can_use_basic_analytics: boolean;
      can_use_advanced_analytics: boolean;
      max_menu_items: number | null;
      max_promotions: number | null;
      max_images: number | null;
      max_categories: number | null;
    }>;
  };
}

// ─── Fallback Padrão (Free) ───────────────────────────────────────────────────

const DEFAULT_FREE_ENTITLEMENTS: ResolvedEntitlements = {
  // Página Pública
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,  // ⭐ Sem link curto no free
  canUseCustomQRCode: false,
  
  // Cardápio
  canUseAdvancedMenu: false,
  canUseMenuCategories: true,
  canUseMenuImages: true,
  canUseMenuVariations: false,
  canUseMenuAddons: false,
  canUseMenuCombos: false,
  canManageAvailability: true,
  canScheduleItems: false,
  
  // Pedidos
  canReceiveInternalOrders: false,
  canUseOrdersPanel: false,
  canManageOrderStatus: false,
  canCancelOrders: false,
  canViewOrderHistory: false,
  
  // Delivery
  canUseMotoboyNetwork: false,
  canRequestDelivery: false,
  canTrackDelivery: false,
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
  isActive: true,
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
      return this.resolveFromSubscription(subscription);
      
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
          contract_snapshot,
          catalog_item:catalog_item!user_subscriptions_catalog_item_id_fkey(
            item_name,
            plan_tier,
            catalog_entitlement_policy(
              can_use_premium_public_page,
              can_use_short_premium_link,
              can_use_custom_qr_code,
              can_use_advanced_menu,
              can_receive_internal_orders,
              can_use_motoboy_network,
              can_use_promotions,
              can_use_basic_analytics,
              can_use_advanced_analytics,
              max_menu_items,
              max_promotions,
              max_images,
              max_categories
            )
          )
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
  private static resolveFromSubscription(
    subscription: SubscriptionData
  ): ResolvedEntitlements {
    // Começar com fallback
    const resolved = { ...DEFAULT_FREE_ENTITLEMENTS };
    
    // Aplicar entitlements do catálogo (base_plan)
    if (subscription.catalog_item?.catalog_entitlement_policy?.[0]) {
      const policy = subscription.catalog_item.catalog_entitlement_policy[0];
      
      // Página Pública
      resolved.canUsePremiumPublicPage = policy.can_use_premium_public_page;
      resolved.canUseShortPremiumLink = policy.can_use_short_premium_link;  // ⭐
      resolved.canUseCustomQRCode = policy.can_use_custom_qr_code;
      
      // Cardápio
      resolved.canUseAdvancedMenu = policy.can_use_advanced_menu;
      resolved.canUseMenuCategories = policy.can_use_advanced_menu;
      resolved.canUseMenuImages = policy.can_use_advanced_menu;
      resolved.canUseMenuVariations = policy.can_use_advanced_menu;
      resolved.canUseMenuAddons = policy.can_use_advanced_menu;
      resolved.canUseMenuCombos = policy.can_use_advanced_menu;
      resolved.canScheduleItems = policy.can_use_advanced_menu;
      
      // Pedidos
      resolved.canReceiveInternalOrders = policy.can_receive_internal_orders;
      resolved.canUseOrdersPanel = policy.can_receive_internal_orders;
      resolved.canManageOrderStatus = policy.can_receive_internal_orders;
      resolved.canCancelOrders = policy.can_receive_internal_orders;
      resolved.canViewOrderHistory = policy.can_receive_internal_orders;
      
      // Delivery
      resolved.canUseMotoboyNetwork = policy.can_use_motoboy_network;
      resolved.canRequestDelivery = policy.can_use_motoboy_network;
      resolved.canTrackDelivery = policy.can_use_motoboy_network;
      resolved.canConfigureDeliveryArea = policy.can_use_motoboy_network;
      resolved.canSetDeliveryFees = policy.can_use_motoboy_network;
      resolved.canSetMinimumOrder = policy.can_use_motoboy_network;
      resolved.canUseOwnDelivery = policy.can_use_motoboy_network;
      
      // Marketing
      resolved.canUsePromotions = policy.can_use_promotions;
      resolved.canUseFeaturedPlacement = policy.can_use_promotions;
      resolved.canUseCoupons = policy.can_use_promotions;
      resolved.canSchedulePromotions = policy.can_use_promotions;
      
      // Analytics
      resolved.canUseBasicAnalytics = policy.can_use_basic_analytics;
      resolved.canUseAdvancedAnalytics = policy.can_use_advanced_analytics;
      resolved.canExportReports = policy.can_use_advanced_analytics;
      resolved.canViewRealtimeMetrics = policy.can_use_basic_analytics;
      resolved.canViewCustomerInsights = policy.can_use_advanced_analytics;
      
      // Limites
      resolved.maxMenuItems = policy.max_menu_items;
      resolved.maxPromotions = policy.max_promotions;
      resolved.maxImages = policy.max_images;
      resolved.maxCategories = policy.max_categories;
    }
    
    // Aplicar overrides do contract_snapshot (se houver)
    if (subscription.contract_snapshot?.overrides) {
      Object.assign(resolved, subscription.contract_snapshot.overrides);
    }
    
    // Metadata
    resolved.planTier = subscription.catalog_item?.plan_tier || 'free';
    resolved.planName = subscription.catalog_item?.item_name || 'Free';
    resolved.isActive = subscription.status_v2 === 'active' || subscription.status_v2 === 'trialing';
    
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
    const value = resolved[entitlement];
    
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
}

export const entitlementResolver = EntitlementResolver;

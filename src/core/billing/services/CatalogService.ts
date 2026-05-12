/**
 * CatalogService — SSOT para busca de catálogo comercial
 *
 * REGRAS ARQUITETURAIS:
 *   - Única fonte de verdade para catálogo de planos/addons
 *   - Sempre filtrar por entity_family + vertical
 *   - Retornar apenas itens published
 *   - Incluir políticas de entitlement e pricing
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F3_SERVICES_RESTANTES.md
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/supabase';
import { logger } from '@/shared/utils/logger';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EligibilityContext {
  user_id: string;
  entity_family: 'company' | 'professional' | 'worker';
  vertical: string;
  actor_type?: string;
}

export interface CatalogItem {
  id: string;
  item_code: string;
  item_name: string;
  item_type: 'base_plan' | 'vertical_package' | 'addon';
  plan_tier: string;
  entity_family: string;
  vertical: string;
  pricing_model: 'free' | 'subscription' | 'transactional' | 'hybrid';
  status: string;
  
  // Políticas
  entitlement_policy?: {
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
  };
  
  pricing_policy?: {
    price_cents: number;
    currency: string;
    billing_period: string;
    stripe_price_id: string;
  };
}

type CatalogRow = {
  id: string;
  item_code: string;
  item_name: string;
  item_type: 'base_plan' | 'vertical_package' | 'addon';
  plan_tier: string;
  entity_family: string;
  vertical: string;
  pricing_model: 'free' | 'subscription' | 'transactional' | 'hybrid';
  status: string;
  catalog_entitlement_policy?: CatalogItem['entitlement_policy'][];
  catalog_pricing_policy?: CatalogItem['pricing_policy'][];
};

export interface EligibleCatalog {
  base_plans: CatalogItem[];
  vertical_packages: CatalogItem[];
  addons: CatalogItem[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CatalogService {
  /**
   * Busca catálogo elegível por contexto comercial.
   * 
   * Filtra por:
   * - entity_family (company, professional, worker)
   * - vertical (gastronomy, health, etc)
   * - status = 'published'
   */
  static async getEligibleCatalog(
    context: EligibilityContext
  ): Promise<EligibleCatalog> {
    try {
      const { data: items, error } = await supabase
        .from('catalog_item')
        .select(`
          id,
          item_code,
          item_name,
          item_type,
          plan_tier,
          entity_family,
          vertical,
          pricing_model,
          status,
          catalog_entitlement_policy (
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
          ),
          catalog_pricing_policy (
            price_cents,
            currency,
            billing_period,
            stripe_price_id
          )
        `)
        .eq('entity_family', context.entity_family)
        .eq('vertical', context.vertical)
        .eq('status', 'published')
        .order('plan_tier', { ascending: true });
      
      if (error) {
        logger.error('[CatalogService] Erro ao buscar catálogo:', error);
        return { base_plans: [], vertical_packages: [], addons: [] };
      }
      
      // Separar por tipo
      const base_plans = items?.filter(i => i.item_type === 'base_plan') || [];
      const vertical_packages = items?.filter(i => i.item_type === 'vertical_package') || [];
      const addons = items?.filter(i => i.item_type === 'addon') || [];
      
      return {
        base_plans: base_plans.map(this.mapCatalogItem),
        vertical_packages: vertical_packages.map(this.mapCatalogItem),
        addons: addons.map(this.mapCatalogItem),
      };
      
    } catch (error) {
      logger.error('[CatalogService] Erro ao buscar catálogo:', error);
      return { base_plans: [], vertical_packages: [], addons: [] };
    }
  }
  
  /**
   * Busca plano específico por código.
   */
  static async getPlanByCode(planCode: string): Promise<CatalogItem | null> {
    try {
      const { data, error } = await supabase
        .from('catalog_item')
        .select(`
          id,
          item_code,
          item_name,
          item_type,
          plan_tier,
          entity_family,
          vertical,
          pricing_model,
          status,
          catalog_entitlement_policy (
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
          ),
          catalog_pricing_policy (
            price_cents,
            currency,
            billing_period,
            stripe_price_id
          )
        `)
        .eq('item_code', planCode)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) {
        logger.error('[CatalogService] Erro ao buscar plano:', error);
        return null;
      }
      
      return data ? this.mapCatalogItem(data) : null;
      
    } catch (error) {
      logger.error('[CatalogService] Erro ao buscar plano:', error);
      return null;
    }
  }
  
  /**
   * Lista addons disponíveis por vertical.
   */
  static async getAddonsByVertical(vertical: string): Promise<CatalogItem[]> {
    try {
      const { data, error } = await supabase
        .from('catalog_item')
        .select(`
          id,
          item_code,
          item_name,
          item_type,
          plan_tier,
          entity_family,
          vertical,
          pricing_model,
          status,
          catalog_entitlement_policy (
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
          ),
          catalog_pricing_policy (
            price_cents,
            currency,
            billing_period,
            stripe_price_id
          )
        `)
        .eq('item_type', 'addon')
        .eq('vertical', vertical)
        .eq('status', 'published');
      
      if (error) {
        logger.error('[CatalogService] Erro ao buscar addons:', error);
        return [];
      }
      
      return data?.map(this.mapCatalogItem) || [];
      
    } catch (error) {
      logger.error('[CatalogService] Erro ao buscar addons:', error);
      return [];
    }
  }
  
  /**
   * Valida se usuário pode contratar item específico.
   */
  static async validateEligibility(
    context: EligibilityContext,
    itemId: string
  ): Promise<{ eligible: boolean; reason?: string }> {
    try {
      const { data: item, error } = await supabase
        .from('catalog_item')
        .select('entity_family, vertical, status')
        .eq('id', itemId)
        .maybeSingle();
      
      if (error || !item) {
        return { eligible: false, reason: 'Item não encontrado' };
      }
      
      if (item.status !== 'published') {
        return { eligible: false, reason: 'Item não está disponível' };
      }
      
      if (item.entity_family !== context.entity_family) {
        return { eligible: false, reason: 'Item não disponível para seu tipo de conta' };
      }
      
      if (item.vertical !== context.vertical) {
        return { eligible: false, reason: 'Item não disponível para sua vertical' };
      }
      
      return { eligible: true };
      
    } catch (error) {
      logger.error('[CatalogService] Erro ao validar elegibilidade:', error);
      return { eligible: false, reason: 'Erro ao validar elegibilidade' };
    }
  }
  
  /**
   * Mapeia item do banco para DTO.
   */
  private static mapCatalogItem(item: CatalogRow): CatalogItem {
    return {
      id: item.id,
      item_code: item.item_code,
      item_name: item.item_name,
      item_type: item.item_type,
      plan_tier: item.plan_tier,
      entity_family: item.entity_family,
      vertical: item.vertical,
      pricing_model: item.pricing_model,
      status: item.status,
      entitlement_policy: item.catalog_entitlement_policy?.[0] || undefined,
      pricing_policy: item.catalog_pricing_policy?.[0] || undefined,
    };
  }
}

export const catalogService = CatalogService;

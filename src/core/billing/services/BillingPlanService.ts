/**
 * BILLING PLAN SERVICE — SSOT
 *
 * Responsabilidade: Gerenciar planos de assinatura do banco de dados
 *
 * Padrão SSOT:
 * - Única fonte de verdade para planos de billing
 * - Cache inteligente com TTL de 5 minutos
 * - Tratamento de erros consistente
 * - Logging estruturado
 *
 * Os planos ativos sao sempre carregados de billing_plans.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
import type { GenericBillingEntitlementAliases } from '../types';
const billingDb = supabase as any;

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

interface BillingPlanRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  price_display: string;
  currency: string;
  billing_period: string;
  features: string[];
  entitlements: unknown;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceCents: number;
  priceDisplay: string;
  currency: string;
  billingPeriod: string;
  features: string[];
  entitlements: PlanEntitlements;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanEntitlements extends GenericBillingEntitlementAliases {
  // Página Pública
  canUsePremiumPublicPage: boolean;
  canUseShortPremiumLink: boolean;
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
}

export const DEFAULT_PLAN_ENTITLEMENTS: PlanEntitlements = {
  // Página Pública
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseCustomQRCode: false,

  // Cardápio / Catálogo
  canUseAdvancedMenu: false,
  canUseMenuCategories: false,
  canUseMenuImages: false,
  canUseMenuVariations: false,
  canUseMenuAddons: false,
  canUseMenuCombos: false,
  canManageAvailability: false,
  canScheduleItems: false,

  // Pedidos
  canReceiveInternalOrders: false,
  canUseOrdersPanel: false,
  canManageOrderStatus: false,
  canCancelOrders: false,
  canViewOrderHistory: false,

  // Delivery / Operação
  canUseMotoboyNetwork: false,
  canRequestDelivery: false,
  canTrackDelivery: false,
  canConfigureDeliveryArea: false,
  canSetDeliveryFees: false,
  canManageBusinessHours: false,
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
  maxMenuItems: null,
  maxPromotions: null,
  maxImages: null,
  maxCategories: null,
  maxCombos: null,
  maxOrdersPerDay: null,
};

// ══════════════════════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class BillingPlanService {
  private static cache: Map<string, BillingPlan> = new Map();
  private static allPlansCache: BillingPlan[] | null = null;
  private static cacheTimestamp: number = 0;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Buscar todos os planos ativos
   */
  static async getActivePlans(): Promise<BillingPlan[]> {
    // Verificar cache
    if (this.isCacheValid() && this.allPlansCache) {
      return this.allPlansCache;
    }

    try {
      const { data, error } = await billingDb
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Erro ao buscar planos de billing:', error);
        throw new Error(`Falha ao buscar planos: ${error.message}`);
      }

      const plans = (data as BillingPlanRow[]).map((row) => this.mapRowToPlan(row));

      // Atualizar cache
      this.allPlansCache = plans;
      plans.forEach(plan => this.cache.set(plan.code, plan));
      this.cacheTimestamp = Date.now();

      return plans;
    } catch (error) {
      logger.error('Erro inesperado ao buscar planos:', error);
      throw error;
    }
  }

  /**
   * Buscar plano por código (com cache)
   */
  static async getPlanByCode(code: string): Promise<BillingPlan | null> {
    // Verificar cache
    if (this.isCacheValid() && this.cache.has(code)) {
      return this.cache.get(code)!;
    }

    try {
      const { data, error } = await billingDb
        .from('billing_plans')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        logger.error(`Erro ao buscar plano ${code}:`, error);
        return null;
      }

      if (!data) {
        return null;
      }

      const plan = this.mapRowToPlan(data as BillingPlanRow);

      // Atualizar cache
      this.cache.set(code, plan);
      this.cacheTimestamp = Date.now();

      return plan;
    } catch (error) {
      logger.error(`Erro inesperado ao buscar plano ${code}:`, error);
      throw error;
    }
  }

  /**
   * Buscar entitlements de um plano
   */
  static async getEntitlements(code: string): Promise<PlanEntitlements | null> {
    const plan = await this.getPlanByCode(code);
    return plan?.entitlements ? this.withGenericAliases(plan.entitlements) : null;
  }

  /**
   * Verificar se plano requer pagamento
   */
  static async requiresPayment(code: string): Promise<boolean> {
    const plan = await this.getPlanByCode(code);
    return plan ? plan.priceCents > 0 : false;
  }

  /**
   * Buscar plano em destaque (featured)
   */
  static async getFeaturedPlan(): Promise<BillingPlan | null> {
    try {
      const { data, error } = await billingDb
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Erro ao buscar plano em destaque:', error);
        return null;
      }

      return data ? this.mapRowToPlan(data as BillingPlanRow) : null;
    } catch (error) {
      logger.error('Erro inesperado ao buscar plano em destaque:', error);
      return null;
    }
  }

  /**
   * Limpar cache (útil para testes e admin)
   */
  static clearCache(): void {
    this.cache.clear();
    this.allPlansCache = null;
    this.cacheTimestamp = 0;
  }

  // ════════════════════════════════════════════════════════════════════════
  // MÉTODOS ADMIN (CRUD)
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Buscar TODOS os planos (incluindo inativos) - ADMIN ONLY
   */
  static async getAllPlans(): Promise<BillingPlan[]> {
    try {
      const { data, error } = await billingDb
        .from('billing_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Erro ao buscar todos os planos:', error);
        throw new Error(`Falha ao buscar planos: ${error.message}`);
      }

      return (data as BillingPlanRow[]).map((row) => this.mapRowToPlan(row));
    } catch (error) {
      logger.error('Erro inesperado ao buscar todos os planos:', error);
      throw error;
    }
  }

  /**
   * Criar novo plano - ADMIN ONLY
   */
  static async createPlan(plan: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<BillingPlan> {
    try {
      const row: Omit<BillingPlanRow, 'id' | 'created_at' | 'updated_at'> = {
        code: plan.code,
        name: plan.name,
        description: plan.description || null,
        price_cents: plan.priceCents,
        price_display: plan.priceDisplay,
        currency: plan.currency,
        billing_period: plan.billingPeriod,
        features: plan.features,
        entitlements: plan.entitlements,
        is_active: plan.isActive,
        is_featured: plan.isFeatured,
        display_order: plan.displayOrder,
      };

      const { data, error } = await billingDb
        .from('billing_plans')
        .insert([row as any])
        .select()
        .single();

      if (error) {
        logger.error('Erro ao criar plano:', error);
        throw new Error(`Falha ao criar plano: ${error.message}`);
      }

      this.clearCache();
      return this.mapRowToPlan(data as BillingPlanRow);
    } catch (error) {
      logger.error('Erro inesperado ao criar plano:', error);
      throw error;
    }
  }

  /**
   * Atualizar plano existente - ADMIN ONLY
   */
  static async updatePlan(id: string, updates: Partial<Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BillingPlan> {
    try {
      const row: Partial<BillingPlanRow> = {};

      if (updates.code !== undefined) row.code = updates.code;
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.description !== undefined) row.description = updates.description || null;
      if (updates.priceCents !== undefined) row.price_cents = updates.priceCents;
      if (updates.priceDisplay !== undefined) row.price_display = updates.priceDisplay;
      if (updates.currency !== undefined) row.currency = updates.currency;
      if (updates.billingPeriod !== undefined) row.billing_period = updates.billingPeriod;
      if (updates.features !== undefined) row.features = updates.features;
      if (updates.entitlements !== undefined) row.entitlements = updates.entitlements as any;
      if (updates.isActive !== undefined) row.is_active = updates.isActive;
      if (updates.isFeatured !== undefined) row.is_featured = updates.isFeatured;
      if (updates.displayOrder !== undefined) row.display_order = updates.displayOrder;

      const { data, error } = await billingDb
        .from('billing_plans')
        .update(row as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Erro ao atualizar plano ${id}:`, error);
        throw new Error(`Falha ao atualizar plano: ${error.message}`);
      }

      this.clearCache();
      return this.mapRowToPlan(data as BillingPlanRow);
    } catch (error) {
      logger.error(`Erro inesperado ao atualizar plano ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletar plano - ADMIN ONLY
   * CUIDADO: Isso remove permanentemente o plano do banco
   */
  static async deletePlan(id: string): Promise<void> {
    try {
      const { error } = await billingDb
        .from('billing_plans')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Erro ao deletar plano ${id}:`, error);
        throw new Error(`Falha ao deletar plano: ${error.message}`);
      }

      this.clearCache();
    } catch (error) {
      logger.error(`Erro inesperado ao deletar plano ${id}:`, error);
      throw error;
    }
  }

  /**
   * Ativar/desativar plano - ADMIN ONLY
   */
  static async toggleActive(id: string, isActive: boolean): Promise<BillingPlan> {
    return this.updatePlan(id, { isActive });
  }

  /**
   * Marcar/desmarcar como featured - ADMIN ONLY
   */
  static async toggleFeatured(id: string, isFeatured: boolean): Promise<BillingPlan> {
    return this.updatePlan(id, { isFeatured });
  }

  /**
   * Reordenar planos - ADMIN ONLY
   */
  static async reorderPlans(planIds: string[]): Promise<void> {
    try {
      const updates = planIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        await billingDb
          .from('billing_plans')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      this.clearCache();
    } catch (error) {
      logger.error('Erro ao reordenar planos:', error);
      throw error;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ════════════════════════════════════════════════════════════════════════

  private static isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  private static mapRowToPlan(row: BillingPlanRow): BillingPlan {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description || undefined,
      priceCents: row.price_cents,
      priceDisplay: row.price_display,
      currency: row.currency,
      billingPeriod: row.billing_period,
      features: row.features,
      entitlements: this.normalizeEntitlements(row.entitlements),
      isActive: row.is_active,
      isFeatured: row.is_featured,
      displayOrder: row.display_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private static normalizeEntitlements(value: unknown): PlanEntitlements {
    if (!value || typeof value !== 'object') {
      return this.withGenericAliases({ ...DEFAULT_PLAN_ENTITLEMENTS });
    }

    return this.withGenericAliases({
      ...DEFAULT_PLAN_ENTITLEMENTS,
      ...(value as Partial<PlanEntitlements>),
    });
  }

  private static withGenericAliases(entitlements: PlanEntitlements): PlanEntitlements {
    return {
      ...entitlements,
      canUsePremiumSite: entitlements.canUsePremiumSite ?? entitlements.canUsePremiumPublicPage,
      canUseShortLink: entitlements.canUseShortLink ?? entitlements.canUseShortPremiumLink,
      canUseAdvancedCatalog: entitlements.canUseAdvancedCatalog ?? entitlements.canUseAdvancedMenu,
      canUseInternalOrders: entitlements.canUseInternalOrders ?? entitlements.canReceiveInternalOrders,
      canUseDeliveryRequests: entitlements.canUseDeliveryRequests ?? entitlements.canRequestDelivery,
      canUseDeliveryTracking: entitlements.canUseDeliveryTracking ?? entitlements.canTrackDelivery,
      canUseDeliveryNetwork: entitlements.canUseDeliveryNetwork ?? entitlements.canUseMotoboyNetwork,
    };
  }
}

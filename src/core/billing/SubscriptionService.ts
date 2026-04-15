/**
 * CORE BILLING SUBSCRIPTION SERVICE — Serviço de assinaturas
 *
 * SSOT: Única fonte de verdade para operações de assinatura.
 */

import { supabase } from '@/integrations/supabase';
import { PlanTier, type BusinessSubscription } from './types';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class SubscriptionService {
  
  /**
   * Busca assinatura de uma empresa
   */
  static async getByBusinessId(
    businessId: string
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const { data, error } = await supabase
        .from('business_subscriptions')
        .select('*')
        .eq('business_id', businessId)
        .limit(1);

      if (error) throw error;

      const row = (data as BusinessSubscription[] | null)?.[0] ?? null;
      if (!row) {
        return {
          data: this.createDefaultFreeSubscription(businessId),
          error: null,
        };
      }

      return { data: row, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar assinatura';
      console.error('[SubscriptionService] Erro ao buscar assinatura:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Cria assinatura Free padrão (em memória)
   */
  private static createDefaultFreeSubscription(businessId: string): BusinessSubscription {
    const now = new Date().toISOString();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 100);
    
    return {
      id: 'temp-free-' + businessId,
      business_id: businessId,
      plan_tier: PlanTier.FREE,
      status: 'active',
      current_period_start: now,
      current_period_end: futureDate.toISOString(),
      cancel_at_period_end: false,
      trial_end: null,
      stripe_subscription_id: null,
      stripe_customer_id: null,
      created_at: now,
      updated_at: now,
    };
  }
  
  /**
   * Cria ou atualiza assinatura
   */
  static async upsert(
    subscription: Partial<BusinessSubscription> & { business_id: string }
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const { data, error } = await supabase
        .from('business_subscriptions')
        .upsert(subscription, {
          onConflict: 'business_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as BusinessSubscription, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar assinatura';
      console.error('[SubscriptionService] Erro ao salvar assinatura:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Atualiza plano da assinatura
   */
  static async updatePlan(
    businessId: string,
    newPlanTier: PlanTier
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const { data, error } = await supabase
        .from('business_subscriptions')
        .update({
          plan_tier: newPlanTier,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as BusinessSubscription, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar plano';
      console.error('[SubscriptionService] Erro ao atualizar plano:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Cancela assinatura
   */
  static async cancel(
    businessId: string,
    immediately: boolean = false
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const updates: Partial<BusinessSubscription> = {
        updated_at: new Date().toISOString(),
      };
      
      if (immediately) {
        updates.status = 'canceled';
        updates.plan_tier = PlanTier.FREE;
        updates.cancel_at_period_end = false;
      } else {
        updates.cancel_at_period_end = true;
      }
      
      const { data, error } = await supabase
        .from('business_subscriptions')
        .update(updates)
        .eq('business_id', businessId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as BusinessSubscription, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar assinatura';
      console.error('[SubscriptionService] Erro ao cancelar assinatura:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Reativa assinatura
   */
  static async reactivate(
    businessId: string
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const { data, error } = await supabase
        .from('business_subscriptions')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: data as BusinessSubscription, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao reativar assinatura';
      console.error('[SubscriptionService] Erro ao reativar assinatura:', error);
      return { data: null, error: message };
    }
  }
}


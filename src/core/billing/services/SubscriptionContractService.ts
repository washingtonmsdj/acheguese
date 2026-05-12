/**
 * SubscriptionContractService — SSOT para gestão de contratos
 *
 * REGRAS ARQUITETURAIS:
 *   - Única fonte de verdade para ciclo de vida de contratos
 *   - Sempre criar snapshot do catálogo no momento da contratação
 *   - Validar elegibilidade antes de criar contrato
 *   - Registrar timeline de mudanças de status
 *   - Nunca alterar termos retroativamente
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F3_SERVICES_RESTANTES.md
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/supabase';
import { logger } from '@/shared/utils/logger';
import { CatalogService } from './CatalogService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateContractParams {
  user_id: string;
  plan_code: string;
  subscription_scope: 'user' | 'business' | 'profile' | 'worker';
  business_id?: string;
  entity_family: 'company' | 'professional' | 'worker';
  vertical: string;
}

export interface UpdateContractParams {
  subscription_id: string;
  changes: {
    status_v2?: string;
    plan_code?: string;
    contract_snapshot?: Record<string, unknown>;
  };
  reason?: string;
}

export interface CancelContractParams {
  subscription_id: string;
  reason: string;
  cancel_at_period_end?: boolean;
}

export interface SubscriptionContract {
  id: string;
  user_id: string;
  business_id?: string;
  plan_code: string;
  subscription_scope: string;
  entity_family: string;
  vertical: string;
  status_v2: string;
  contract_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
  trial_end?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SubscriptionContractService {
  /**
   * Cria novo contrato de assinatura.
   * 
   * Fluxo:
   * 1. Validar elegibilidade
   * 2. Buscar item do catálogo
   * 3. Criar snapshot do catálogo
   * 4. Criar contrato
   * 5. Registrar timeline
   */
  static async createContract(
    params: CreateContractParams
  ): Promise<{ success: boolean; subscription_id?: string; error?: string }> {
    try {
      // 1. Validar elegibilidade
      const eligibility = await CatalogService.validateEligibility(
        {
          user_id: params.user_id,
          entity_family: params.entity_family,
          vertical: params.vertical,
        },
        params.plan_code
      );
      
      if (!eligibility.eligible) {
        return { success: false, error: eligibility.reason };
      }
      
      // 2. Buscar item do catálogo
      const catalogItem = await CatalogService.getPlanByCode(params.plan_code);
      
      if (!catalogItem) {
        return { success: false, error: 'Plano não encontrado no catálogo' };
      }
      
      // 3. Criar snapshot do catálogo
      const contract_snapshot = {
        catalog_item: catalogItem,
        contracted_at: new Date().toISOString(),
        terms_version: '1.0.0',
      };
      
      // 4. Criar contrato
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: params.user_id,
          business_id: params.business_id,
          plan_code: params.plan_code,
          subscription_scope: params.subscription_scope,
          entity_family: params.entity_family,
          vertical: params.vertical,
          status_v2: catalogItem.pricing_model === 'free' ? 'active' : 'incomplete',
          contract_snapshot,
          catalog_item_id: catalogItem.id,
        })
        .select('id')
        .single();
      
      if (error) {
        logger.error('[SubscriptionContractService] Erro ao criar contrato:', error);
        return { success: false, error: 'Erro ao criar contrato' };
      }
      
      // 5. Registrar timeline (opcional - se tabela existir)
      // await this.recordStatusChange(subscription.id, 'incomplete', 'Contrato criado');
      
      logger.info('[SubscriptionContractService] Contrato criado:', subscription.id);
      
      return { success: true, subscription_id: subscription.id };
      
    } catch (error) {
      logger.error('[SubscriptionContractService] Erro ao criar contrato:', error);
      return { success: false, error: 'Erro inesperado ao criar contrato' };
    }
  }
  
  /**
   * Atualiza contrato existente.
   * 
   * IMPORTANTE: Nunca alterar termos retroativamente.
   * Mudanças de plano devem criar novo snapshot.
   */
  static async updateContract(
    params: UpdateContractParams
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      // Se mudou plano, criar novo snapshot
      if (params.changes.plan_code) {
        const catalogItem = await CatalogService.getPlanByCode(params.changes.plan_code);
        
        if (!catalogItem) {
          return { success: false, error: 'Plano não encontrado' };
        }
        
        updates.plan_code = params.changes.plan_code;
        updates.catalog_item_id = catalogItem.id;
        updates.contract_snapshot = {
          catalog_item: catalogItem,
          updated_at: new Date().toISOString(),
          reason: params.reason || 'Mudança de plano',
        };
      }
      
      // Atualizar status
      if (params.changes.status_v2) {
        updates.status_v2 = params.changes.status_v2;
      }
      
      const { error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', params.subscription_id);
      
      if (error) {
        logger.error('[SubscriptionContractService] Erro ao atualizar contrato:', error);
        return { success: false, error: 'Erro ao atualizar contrato' };
      }
      
      logger.info('[SubscriptionContractService] Contrato atualizado:', params.subscription_id);
      
      return { success: true };
      
    } catch (error) {
      logger.error('[SubscriptionContractService] Erro ao atualizar contrato:', error);
      return { success: false, error: 'Erro inesperado ao atualizar contrato' };
    }
  }
  
  /**
   * Cancela contrato.
   */
  static async cancelContract(
    params: CancelContractParams
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: Record<string, unknown> = {
        status_v2: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Se cancelar no fim do período, manter ativo até lá
      if (params.cancel_at_period_end) {
        updates.cancel_at_period_end = true;
        updates.status_v2 = 'active'; // Mantém ativo até o fim
      }
      
      const { error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', params.subscription_id);
      
      if (error) {
        logger.error('[SubscriptionContractService] Erro ao cancelar contrato:', error);
        return { success: false, error: 'Erro ao cancelar contrato' };
      }
      
      logger.info('[SubscriptionContractService] Contrato cancelado:', params.subscription_id);
      
      return { success: true };
      
    } catch (error) {
      logger.error('[SubscriptionContractService] Erro ao cancelar contrato:', error);
      return { success: false, error: 'Erro inesperado ao cancelar contrato' };
    }
  }
  
  /**
   * Renova contrato.
   */
  static async renewContract(
    subscription_id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date();
      const nextPeriodEnd = new Date(now);
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
      
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status_v2: 'active',
          current_period_start: now.toISOString(),
          current_period_end: nextPeriodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', subscription_id);
      
      if (error) {
        logger.error('[SubscriptionContractService] Erro ao renovar contrato:', error);
        return { success: false, error: 'Erro ao renovar contrato' };
      }
      
      logger.info('[SubscriptionContractService] Contrato renovado:', subscription_id);
      
      return { success: true };
      
    } catch (error) {
      logger.error('[SubscriptionContractService] Erro ao renovar contrato:', error);
      return { success: false, error: 'Erro inesperado ao renovar contrato' };
    }
  }
  
  /**
   * Busca contrato ativo por usuário e escopo.
   */
  static async getActiveContract(
    user_id: string,
    scope: 'user' | 'business' | 'profile' | 'worker',
    business_id?: string
  ): Promise<SubscriptionContract | null> {
    try {
      let query = supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('subscription_scope', scope)
        .in('status_v2', ['active', 'trialing']);
      
      if (scope === 'business' && business_id) {
        query = query.eq('business_id', business_id);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        logger.error('[SubscriptionContractService] Erro ao buscar contrato:', error);
        return null;
      }
      
      return data as SubscriptionContract | null;
      
    } catch (error) {
      logger.error('[SubscriptionContractService] Erro ao buscar contrato:', error);
      return null;
    }
  }
}

export const subscriptionContractService = SubscriptionContractService;

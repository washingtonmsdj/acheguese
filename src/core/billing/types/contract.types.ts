/**
 * Contract Types — DTOs canônicos para contratos de assinatura
 *
 * REGRAS ARQUITETURAIS:
 *   - Tipos compartilhados entre backend e frontend
 *   - Imutáveis após criação do contrato
 *   - Snapshot preserva termos históricos
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F3_SERVICES_RESTANTES.md
 *
 * @version 1.0.0
 */

import type { EntityFamily, Vertical, CatalogItemDTO } from './catalog.types';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type SubscriptionScope = 'user' | 'business' | 'profile' | 'worker';

export type SubscriptionStatus = 
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'canceled';

export type TransactionalScope = 
  | 'order'
  | 'ride'
  | 'delivery'
  | 'lead'
  | 'highlight'
  | 'booking';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/**
 * Contrato de assinatura.
 */
export interface SubscriptionContractDTO {
  id: string;
  user_id: string;
  business_id?: string;
  plan_code: string;
  subscription_scope: SubscriptionScope;
  entity_family: EntityFamily;
  vertical: Vertical;
  status_v2: SubscriptionStatus;
  
  // Snapshot imutável do catálogo no momento da contratação
  contract_snapshot: ContractSnapshotDTO;
  
  // Referência ao catálogo atual (pode mudar)
  catalog_item_id: string;
  catalog_version_id?: string;
  
  // Stripe
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  stripe_price_id?: string;
  
  // Datas
  created_at: string;
  updated_at: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  canceled_at?: string;
  ended_at?: string;
  
  // Flags
  cancel_at_period_end?: boolean;
  
  // Valores
  price_cents?: number;
  currency?: string;
}

/**
 * Snapshot imutável do contrato.
 * Preserva termos no momento da contratação.
 */
export interface ContractSnapshotDTO {
  catalog_item: CatalogItemDTO;
  contracted_at: string;
  terms_version: string;
  
  // Overrides específicos do contrato (se houver)
  overrides?: {
    entitlements?: Partial<any>;
    pricing?: Partial<any>;
  };
  
  // Histórico de mudanças
  changes?: ContractChangeDTO[];
}

/**
 * Mudança no contrato.
 */
export interface ContractChangeDTO {
  changed_at: string;
  changed_by: string;
  change_type: 'upgrade' | 'downgrade' | 'addon_added' | 'addon_removed' | 'status_change' | 'cancellation';
  reason?: string;
  previous_value?: any;
  new_value?: any;
}

/**
 * Parâmetros para criar contrato.
 */
export interface CreateContractParamsDTO {
  user_id: string;
  plan_code: string;
  subscription_scope: SubscriptionScope;
  business_id?: string;
  entity_family: EntityFamily;
  vertical: Vertical;
  
  // Opcional
  trial_period_days?: number;
  coupon_code?: string;
  metadata?: Record<string, any>;
}

/**
 * Parâmetros para atualizar contrato.
 */
export interface UpdateContractParamsDTO {
  subscription_id: string;
  changes: {
    status_v2?: SubscriptionStatus;
    plan_code?: string;
    contract_snapshot?: ContractSnapshotDTO;
    cancel_at_period_end?: boolean;
  };
  reason?: string;
  changed_by?: string;
}

/**
 * Parâmetros para cancelar contrato.
 */
export interface CancelContractParamsDTO {
  subscription_id: string;
  reason: string;
  cancel_at_period_end?: boolean;
  canceled_by?: string;
}

/**
 * Timeline de status do contrato.
 */
export interface SubscriptionStatusTimelineDTO {
  id: string;
  subscription_id: string;
  status: SubscriptionStatus;
  reason?: string;
  changed_at: string;
  changed_by?: string;
  metadata?: Record<string, any>;
}

/**
 * Evento de uso (para cobrança transacional).
 */
export interface UsageEventDTO {
  id: string;
  subscription_id: string;
  event_type: string;
  event_scope: TransactionalScope;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  currency: string;
  occurred_at: string;
  metadata?: Record<string, any>;
}

/**
 * Regra de cobrança transacional.
 */
export interface TransactionChargeRuleDTO {
  id: string;
  catalog_item_id: string;
  event_type: string;
  event_scope: TransactionalScope;
  unit_price_cents: number;
  currency: string;
  calculation_method: 'fixed' | 'percentage' | 'tiered';
  metadata?: Record<string, any>;
}

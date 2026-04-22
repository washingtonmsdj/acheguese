/**
 * modules/ads - Tipos canônicos
 *
 * Anúncios locais segmentados por location_id.
 * Não usa strings de bairro/cidade — apenas location_id da fundação geográfica.
 */

// ============================================================
// ENUMS
// ============================================================

/** Quem pode ser dono de uma campanha */
export type AdOwnerEntityType =
  | 'business'
  | 'service_provider'
  | 'classified'
  | 'platform'; // anúncios internos da plataforma

/** Status de uma campanha */
export type AdCampaignStatus = 'active' | 'paused' | 'ended';

/**
 * Escopo de targeting de um target.
 * district = segmentado para um bairro específico
 * city     = segmentado para uma cidade inteira
 */
export type AdTargetScope = 'district' | 'city';

/**
 * Slots de exibição disponíveis.
 * Cada módulo consumidor decide quais slots renderiza.
 */
export type AdPlacementKey =
  | 'feed_sponsored'    // card patrocinado no feed
  | 'sidebar_widget'    // widget lateral
  | 'banner_top'        // banner no topo da página
  | 'banner_bottom';    // banner no rodapé da página

// ============================================================
// ENTIDADES
// ============================================================

/** Campanha de anúncio */
export interface AdCampaign {
  id: string;
  owner_entity_type: AdOwnerEntityType;
  owner_entity_id: string;
  title: string;
  /** Texto/descrição do anúncio */
  content: string;
  image_url?: string;
  cta_text?: string;
  cta_url?: string;
  status: AdCampaignStatus;
  placement_key: AdPlacementKey;
  created_at: string;
  updated_at: string;
}

/**
 * Target de uma campanha.
 * Uma campanha pode ter múltiplos targets (vários bairros, ou uma cidade).
 * Sempre via location_id — nunca string de bairro/cidade.
 */
export interface AdTarget {
  campaign_id: string;
  /** ID canônico da localização (fundação geográfica) */
  location_id: string;
  /** Escopo: district ou city */
  target_scope: AdTargetScope;
}

/**
 * Campanha com seus targets — entidade completa para resolução de elegibilidade.
 */
export interface AdCampaignWithTargets extends AdCampaign {
  targets: AdTarget[];
}

// ============================================================
// RESOLUÇÃO DE ELEGIBILIDADE
// ============================================================

/**
 * Contexto geográfico passado para o resolver de elegibilidade.
 * Vem da fundação geográfica — nunca de strings livres.
 */
export interface AdEligibilityContext {
  /** ID da localização ativa (district ou city) */
  active_location_id: string | null;
  /** Tipo da localização ativa */
  active_location_type: 'district' | 'city' | null;
  /** ID da city pai, se active for district */
  parent_city_id: string | null;
  /**
   * Fallback: primary_location_id do perfil.
   * Usado quando não há localização ativa no contexto.
   */
  fallback_location_id: string | null;
}

/**
 * Resultado da resolução de elegibilidade para um slot.
 */
export interface AdResolutionResult {
  campaign: AdCampaignWithTargets | null;
  /** Como o anúncio foi selecionado */
  resolution_source: 'district' | 'city' | 'fallback' | 'generic' | 'none';
}

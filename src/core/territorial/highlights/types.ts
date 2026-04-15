/**
 * Tipos para o sistema de destaques editoriais territoriais.
 *
 * Separação clara:
 *   - Blocos automáticos: ordenação por is_premium/rating/created_at (LandingFeaturedService)
 *   - Blocos editoriais:  escolha manual via territorial_highlights (este módulo)
 */

export type HighlightTerritoryType = 'location' | 'group';

export type HighlightType =
  | 'business'
  | 'service'
  | 'classified'
  | 'event'
  | 'creator'
  | 'notice';

export type HighlightStatus = 'active' | 'inactive';

/**
 * Destaque editorial de um território.
 * entity_id é opcional — destaques manuais (event, notice, creator sem cadastro)
 * não precisam de entidade vinculada.
 */
export interface TerritorialHighlight {
  id: string;
  territory_type: HighlightTerritoryType;
  territory_ref_id: string;
  highlight_type: HighlightType;
  entity_id?: string | null;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  position: number;
  status: HighlightStatus;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHighlightInput {
  territory_type: HighlightTerritoryType;
  territory_ref_id: string;
  highlight_type: HighlightType;
  entity_id?: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  cta_label?: string;
  cta_url?: string;
  position?: number;
  status?: HighlightStatus;
  starts_at?: string;
  ends_at?: string;
}

/** Filtro para busca de destaques */
export interface HighlightQuery {
  territory_type: HighlightTerritoryType;
  territory_ref_id: string;
  /** Se true, filtra apenas ativos e dentro da validade. Padrão: true */
  only_valid?: boolean;
}

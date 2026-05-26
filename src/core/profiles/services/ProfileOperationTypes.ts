/**
 * ProfileOperationTypes — Tipos de operação e estatísticas do perfil
 *
 * Tipos que descrevem contagens, estatísticas e inputs de operação
 * do ProfileService. Não são entidades de domínio.
 *
 * @version 1.0.0
 */

// ── Estatísticas ─────────────────────────────────────────────────────────

/**
 * ProfileActivityStats — Contagens de atividade do perfil
 *
 * Retornado por ProfileService para exibição no hub de perfil.
 */
export interface ProfileActivityStats {
  posts: number;
  likes: number;
  favorites: number;
  businesses: number;
}

// ── Inputs de operação ───────────────────────────────────────────────────

export interface ProfilePrivacySettingsInput {
  is_public?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  show_location?: boolean;
  allow_messages?: boolean;
  show_activity?: boolean;
  show_businesses?: boolean;
  share_activity_default?: boolean;
}

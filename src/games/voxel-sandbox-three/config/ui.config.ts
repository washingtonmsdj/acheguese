/**
 * 🔧 UI CONFIG - FLOOD TEST GAME
 * 
 * Configurações centralizadas de UI - SINGLE SOURCE OF TRUTH
 * 
 * @version 1.0.0
 * @build 2026-04-10
 */

// ============================================================================
// LABEL DEFAULTS
// ============================================================================

export const UI_LABEL_DEFAULTS = {
  /** Dimensões padrão de labels */
  DIMENSIONS: {
    width: 512,
    height: 256,
    fontSize: 96,
  },
  /** Dimensões de labels pequenos */
  SMALL: {
    width: 256,
    height: 128,
    fontSize: 48,
  },
  /** Cores padrão */
  COLORS: {
    background: 'rgba(0, 0, 0, 0.8)',
    text: 'white',
    border: 'white',
  },
  /** Bordas */
  BORDER: {
    width: 8,
    smallWidth: 4,
  },
} as const;

// ============================================================================
// HUD DEFAULTS
// ============================================================================

export const UI_HUD_DEFAULTS = {
  /** Opacidade do HUD */
  OPACITY: {
    card: 0.8,
    backdrop: 0.9,
  },
  /** Padding */
  PADDING: {
    card: 12, // px
    section: 8, // px
  },
} as const;

// ============================================================================
// DEBUG COLORS
// ============================================================================

export const UI_DEBUG_COLORS = {
  /** Cores para debug de física */
  PHYSICS: {
    buoyancy: 'rgba(34, 197, 94, 0.2)',  // Verde
    weight: 'rgba(239, 68, 68, 0.2)',    // Vermelho
    balanced: 'rgba(156, 163, 175, 0.2)', // Cinza
  },
  /** Cores para status */
  STATUS: {
    floating: '#22c55e',  // Verde
    sinking: '#ef4444',   // Vermelho
    balanced: '#9ca3af',  // Cinza
  },
} as const;
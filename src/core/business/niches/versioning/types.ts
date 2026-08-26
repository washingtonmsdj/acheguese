/**
 * 🔄 NICHE VERSIONING TYPES
 *
 * Tipos para sistema de versionamento e evolução de nichos.
 * Permite adicionar novas funcionalidades sem quebrar registros antigos.
 *
 * @version 1.0.0
 */

import type { NicheCapability, NicheStatus } from '../types';

// ============================================================================
// VERSIONING
// ============================================================================

/**
 * Versão de configuração de nicho (semver)
 */
export type NicheVersion = string; // Ex: "1.0.0", "1.1.0", "2.0.0"

/**
 * Modo operacional de um perfil gastronômico
 */
export type OperationalMode =
  | 'basic_menu'              // Cardápio básico apenas
  | 'menu_variants'           // Com variações
  | 'menu_addons'             // Com adicionais
  | 'menu_combos'             // Com combos
  | 'pizzaria_full'           // Pizzaria completa
  | 'sushi_full'              // Sushi completo
  | 'acai_full'               // Açaí completo
  | 'pastel_full'             // Pastel completo
  | 'churrascaria_full'       // Churrascaria completa
  | 'bar_full';               // Bar completo

/**
 * Tipo de upgrade
 */
export type UpgradeType = 'automatic' | 'manual' | 'admin';

// ============================================================================
// PROFILE NICHE CONFIG
// ============================================================================

/**
 * Configuração de nicho em um perfil gastronômico
 */
export interface ProfileNicheConfig {
  /** Chave do nicho primário */
  primary_niche_key: string;
  /** Versão da configuração */
  niche_config_version: NicheVersion;
  /** Nível de suporte */
  support_level: NicheStatus;
  /** Modo operacional */
  operational_mode: OperationalMode;
  /** Capabilities habilitadas */
  enabled_capabilities: NicheCapability[];
  /** Capabilities disponíveis mas não configuradas */
  missing_capabilities: NicheCapability[];
  /** Se precisa de upgrade */
  needs_niche_upgrade: boolean;
  /** Data do último upgrade */
  last_niche_upgrade_at?: string | null;
}

/**
 * Perfil gastronômico com informações de nicho
 */
export interface GastronomyProfileWithNiche {
  id: string;
  business_id: string;
  primary_niche_key: string;
  niche_config_version: NicheVersion;
  support_level: NicheStatus;
  operational_mode: OperationalMode;
  enabled_capabilities: NicheCapability[];
  missing_capabilities: NicheCapability[];
  needs_niche_upgrade: boolean;
  last_niche_upgrade_at?: string | null;
  enabled_capabilities_count: number;
  missing_capabilities_count: number;
  niche_status: 'upgrade_available' | 'incomplete' | 'complete';
}

// ============================================================================
// UPGRADE HISTORY
// ============================================================================

/**
 * Registro de upgrade de nicho
 */
export interface NicheUpgradeHistory {
  id: string;
  business_id: string;
  from_version: NicheVersion;
  to_version: NicheVersion;
  added_capabilities: NicheCapability[];
  from_operational_mode: OperationalMode;
  to_operational_mode: OperationalMode;
  upgrade_type: UpgradeType;
  notes?: string | null;
  upgraded_at: string;
  upgraded_by?: string | null;
}

// ============================================================================
// UPGRADE OPERATIONS
// ============================================================================

/**
 * Parâmetros para adicionar capability
 */
export interface AddCapabilityParams {
  business_id: string;
  capability: NicheCapability;
  upgraded_by?: string | null;
}

/**
 * Resultado de adição de capability
 */
export interface AddCapabilityResult {
  success: boolean;
  already_exists?: boolean;
  error?: string;
}

/**
 * Parâmetros para marcar necessidade de upgrade
 */
export interface MarkNeedsUpgradeParams {
  niche_key: string;
  missing_capabilities: NicheCapability[];
}

/**
 * Resultado de marcação de upgrade
 */
export interface MarkNeedsUpgradeResult {
  updated_count: number;
}

/**
 * Parâmetros para upgrade completo de nicho
 */
export interface UpgradeNicheParams {
  business_id: string;
  to_version: NicheVersion;
  to_operational_mode: OperationalMode;
  add_capabilities: NicheCapability[];
  upgrade_type: UpgradeType;
  upgraded_by?: string | null;
  notes?: string;
}

/**
 * Resultado de upgrade de nicho
 */
export interface UpgradeNicheResult {
  success: boolean;
  from_version: NicheVersion;
  to_version: NicheVersion;
  added_capabilities: NicheCapability[];
  error?: string;
}

// ============================================================================
// CAPABILITY CHECKS
// ============================================================================

/**
 * Resultado de verificação de capability
 */
export interface CapabilityCheckResult {
  has_capability: boolean;
  capability: NicheCapability;
  business_id: string;
}

/**
 * Verificação de múltiplas capabilities
 */
export interface MultiCapabilityCheckResult {
  business_id: string;
  capabilities: Record<NicheCapability, boolean>;
  all_enabled: boolean;
  any_enabled: boolean;
  enabled_count: number;
  total_count: number;
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Mapeamento de nicho antigo para novo
 */
export interface NicheMigrationMapping {
  old_niche_key?: string;
  old_cuisine_type?: string;
  new_niche_key: string;
  default_version: NicheVersion;
  default_mode: OperationalMode;
  default_capabilities: NicheCapability[];
}

/**
 * Resultado de migração de nicho
 */
export interface NicheMigrationResult {
  migrated_count: number;
  errors: Array<{
    business_id: string;
    error: string;
  }>;
}

// ============================================================================
// ADMIN SECTION VISIBILITY
// ============================================================================

/**
 * Configuração de visibilidade de seção de admin
 */
export interface AdminSectionVisibility {
  section_key: string;
  is_visible: boolean;
  required_capabilities: NicheCapability[];
  missing_capabilities: NicheCapability[];
  can_configure: boolean;
}

/**
 * Mapa de visibilidade de seções
 */
export type AdminSectionsVisibilityMap = Record<string, AdminSectionVisibility>;

// ============================================================================
// UPGRADE NOTIFICATIONS
// ============================================================================

/**
 * Notificação de upgrade disponível
 */
export interface UpgradeNotification {
  business_id: string;
  niche_key: string;
  current_version: NicheVersion;
  available_version: NicheVersion;
  new_capabilities: NicheCapability[];
  upgrade_description: string;
  is_breaking_change: boolean;
  requires_manual_action: boolean;
}

/**
 * Status de upgrade de um perfil
 */
export interface ProfileUpgradeStatus {
  business_id: string;
  needs_upgrade: boolean;
  current_version: NicheVersion;
  latest_version: NicheVersion;
  missing_capabilities: NicheCapability[];
  available_upgrades: UpgradeNotification[];
}

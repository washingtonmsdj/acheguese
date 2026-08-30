/**
 * 🍽️ GASTRONOMY NICHE REGISTRY
 *
 * Registro canônico de todos os nichos gastronômicos.
 * SSOT para acesso a configurações de nichos.
 *
 * @version 1.0.0
 */

import type {
  GastronomyNicheConfig,
  NicheFilters,
  NicheStatus,
  NicheRegistry,
} from '@/core/business/niches/types';
import { NICHE_STATUS_PRIORITY } from '@/core/business/niches/types';
import { getRecordValue } from '@/shared/utils/recordLookup';

// ── Presets ──────────────────────────────────────────────────────────────────

import { lanchesNicheConfig } from './presets/lanches';
import { hamburguerNicheConfig } from './presets/hamburguer';
import { brasileiraNicheConfig } from './presets/brasileira';
import { arabeNicheConfig } from './presets/arabe';
import { saudavelNicheConfig } from './presets/saudavel';
import { salgadosNicheConfig } from './presets/salgados';
import { padariaNicheConfig } from './presets/padaria';
import { docesNicheConfig } from './presets/doces';
import { cafesNicheConfig } from './presets/cafes';
import { pizzaNicheConfig } from './presets/pizza';
import { sushiNicheConfig } from './presets/sushi';
import { acaiNicheConfig } from './presets/acai';
import { pastelNicheConfig } from './presets/pastel';
import { churrascariaNicheConfig } from './presets/churrascaria';
import { baresNicheConfig } from './presets/bares';

// ── Registro Central ─────────────────────────────────────────────────────────

/**
 * Mapa canônico de todos os nichos gastronômicos.
 *
 * Regra: TODOS os nichos devem estar registrados aqui.
 * Nunca adicionar hardcodes espalhados em componentes.
 */
export const GASTRONOMY_NICHE_REGISTRY: NicheRegistry = {
  // Nichos básicos (basic_enabled) - Liberados para uso público
  [lanchesNicheConfig.nicheKey]: lanchesNicheConfig,
  [hamburguerNicheConfig.nicheKey]: hamburguerNicheConfig,
  [brasileiraNicheConfig.nicheKey]: brasileiraNicheConfig,
  [arabeNicheConfig.nicheKey]: arabeNicheConfig,
  [saudavelNicheConfig.nicheKey]: saudavelNicheConfig,
  [salgadosNicheConfig.nicheKey]: salgadosNicheConfig,
  [padariaNicheConfig.nicheKey]: padariaNicheConfig,
  [docesNicheConfig.nicheKey]: docesNicheConfig,
  [cafesNicheConfig.nicheKey]: cafesNicheConfig,

  // Nichos complexos (beta_enabled) - Preparados para implementação futura
  [pizzaNicheConfig.nicheKey]: pizzaNicheConfig,
  [sushiNicheConfig.nicheKey]: sushiNicheConfig,
  [acaiNicheConfig.nicheKey]: acaiNicheConfig,
  [pastelNicheConfig.nicheKey]: pastelNicheConfig,
  [churrascariaNicheConfig.nicheKey]: churrascariaNicheConfig,
  [baresNicheConfig.nicheKey]: baresNicheConfig,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Obtém um nicho pelo key.
 * Retorna null se não encontrado.
 */
export function getNicheByKey(key: string): GastronomyNicheConfig | null {
  return getRecordValue(GASTRONOMY_NICHE_REGISTRY, key) ?? null;
}

/**
 * Lista todos os nichos registrados.
 */
export function getAllNiches(): GastronomyNicheConfig[] {
  return Object.values(GASTRONOMY_NICHE_REGISTRY).sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
}

/**
 * Lista nichos com filtros opcionais.
 */
export function listNiches(filters?: NicheFilters): GastronomyNicheConfig[] {
  let niches = getAllNiches();

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    niches = niches.filter((n) => statuses.includes(n.supportLevel));
  }

  if (filters?.isSelectable !== undefined) {
    niches = niches.filter((n) => n.isSelectable === filters!.isSelectable);
  }

  if (filters?.isPublic !== undefined) {
    niches = niches.filter((n) => n.isPublic === filters!.isPublic);
  }

  if (filters?.operationalType) {
    const types = Array.isArray(filters.operationalType)
      ? filters.operationalType
      : [filters.operationalType];
    niches = niches.filter((n) => types.includes(n.operationalType));
  }

  if (filters?.tags) {
    niches = niches.filter((n) =>
      filters!.tags!.some((tag) => n.tags.includes(tag)),
    );
  }

  return niches;
}

/**
 * Nichos disponíveis para seleção pública.
 * Ordenados por status (full → basic → coming_soon) e displayOrder.
 */
export function getSelectableNiches(): GastronomyNicheConfig[] {
  const niches = listNiches({ isSelectable: true });

  return niches.sort((a, b) => {
    const statusDiff =
      NICHE_STATUS_PRIORITY[a.supportLevel] - NICHE_STATUS_PRIORITY[b.supportLevel];
    if (statusDiff !== 0) return statusDiff;
    return a.displayOrder - b.displayOrder;
  });
}

export function getPublicNiches(): GastronomyNicheConfig[] {
  return listNiches({ isPublic: true });
}

export function getAdminNiches(): GastronomyNicheConfig[] {
  return listNiches({
    status: ['full_enabled', 'basic_enabled', 'beta_enabled'],
  });
}

export function getBetaNiches(): GastronomyNicheConfig[] {
  return listNiches({ status: 'beta_enabled' });
}

export function getFullEnabledNiches(): GastronomyNicheConfig[] {
  return listNiches({ status: 'full_enabled' });
}

export function getBasicEnabledNiches(): GastronomyNicheConfig[] {
  return listNiches({ status: 'basic_enabled' });
}

export function nicheExists(key: string): boolean {
  return key in GASTRONOMY_NICHE_REGISTRY;
}

export function hasCapability(nicheKey: string, capability: string): boolean {
  const niche = getNicheByKey(nicheKey);
  if (!niche) return false;
  return niche.enabledCapabilities.includes(capability as never);
}

export function isComplexNiche(nicheKey: string): boolean {
  const niche = getNicheByKey(nicheKey);
  if (!niche) return false;
  return niche.operationalType === 'complex';
}

export function shouldShowAdminSection(nicheKey: string, section: string): boolean {
  const niche = getNicheByKey(nicheKey);
  if (!niche) return false;

  if (niche.operationalType !== 'complex') {
    const basicSections = [
      'basic_menu',
      'variants',
      'addons',
      'combos',
      'promotions',
      'delivery_areas',
      'operational_hours',
      'order_management',
      'analytics',
    ];
    if (basicSections.includes(section)) return true;
    return false;
  }

  return niche.adminSections.includes(section as never);
}

export const DEFAULT_NICHE_KEY = 'lanches';

export function getNicheOrDefault(key?: string | null): GastronomyNicheConfig {
  const defaultNiche =
    getRecordValue(GASTRONOMY_NICHE_REGISTRY, DEFAULT_NICHE_KEY) ?? lanchesNicheConfig;
  if (key && nicheExists(key)) {
    return getRecordValue(GASTRONOMY_NICHE_REGISTRY, key) ?? defaultNiche;
  }
  return defaultNiche;
}

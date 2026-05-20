/**
 * 🍽️ GASTRONOMY NICHE REGISTRY
 *
 * Registro canônico de todos os nichos gastronômicos.
 * SSOT para acesso a configurações de nichos.
 *
 * @version 1.0.0
 */

import type { GastronomyNicheConfig, NicheFilters, NicheStatus, NicheRegistry } from './types';
import { NICHE_STATUS_PRIORITY } from './types';

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
  return GASTRONOMY_NICHE_REGISTRY[key] ?? null;
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
    // Primeiro por status priority
    const statusDiff =
      NICHE_STATUS_PRIORITY[a.supportLevel] - NICHE_STATUS_PRIORITY[b.supportLevel];
    if (statusDiff !== 0) return statusDiff;

    // Depois por displayOrder
    return a.displayOrder - b.displayOrder;
  });
}

/**
 * Nichos visíveis publicamente (aparecem no site/app).
 */
export function getPublicNiches(): GastronomyNicheConfig[] {
  return listNiches({ isPublic: true });
}

/**
 * Nichos disponíveis para admin (incluindo beta).
 */
export function getAdminNiches(): GastronomyNicheConfig[] {
  return listNiches({
    status: ['full_enabled', 'basic_enabled', 'beta_enabled'],
  });
}

/**
 * Nichos em beta (para desenvolvimento/teste).
 */
export function getBetaNiches(): GastronomyNicheConfig[] {
  return listNiches({ status: 'beta_enabled' });
}

/**
 * Nichos completos (full_enabled).
 */
export function getFullEnabledNiches(): GastronomyNicheConfig[] {
  return listNiches({ status: 'full_enabled' });
}

/**
 * Nichos básicos (basic_enabled).
 */
export function getBasicEnabledNiches(): GastronomyNicheConfig[] {
  return listNiches({ status: 'basic_enabled' });
}

/**
 * Verifica se um nicho existe.
 */
export function nicheExists(key: string): boolean {
  return key in GASTRONOMY_NICHE_REGISTRY;
}

/**
 * Verifica se um nicho tem uma capacidade específica.
 */
export function hasCapability(nicheKey: string, capability: string): boolean {
  const niche = getNicheByKey(nicheKey);
  if (!niche) return false;
  return niche.enabledCapabilities.includes(capability as never);
}

/**
 * Verifica se um nicho é complexo (requer funcionalidades específicas).
 */
export function isComplexNiche(nicheKey: string): boolean {
  const niche = getNicheByKey(nicheKey);
  if (!niche) return false;
  return niche.operationalType === 'complex';
}

/**
 * Verifica se uma seção de admin deve ser exibida para um nicho.
 */
export function shouldShowAdminSection(nicheKey: string, section: string): boolean {
  const niche = getNicheByKey(nicheKey);
  if (!niche) return false;

  // Se for nicho básico, apenas seções padrão
  if (niche.operationalType !== 'complex') {
    const basicSections = ['basic_menu', 'variants', 'addons', 'combos', 'promotions', 'delivery_areas', 'operational_hours', 'order_management', 'analytics'];
    if (basicSections.includes(section)) return true;
    return false;
  }

  // Nichos complexos: verificar se a seção está habilitada
  return niche.adminSections.includes(section as never);
}

/**
 * Nicho padrão/fallback quando nenhum está selecionado.
 */
export const DEFAULT_NICHE_KEY = 'lanches';

/**
 * Obtém config do nicho ou fallback para padrão.
 */
export function getNicheOrDefault(key?: string | null): GastronomyNicheConfig {
  if (key && nicheExists(key)) {
    return GASTRONOMY_NICHE_REGISTRY[key];
  }
  return GASTRONOMY_NICHE_REGISTRY[DEFAULT_NICHE_KEY];
}

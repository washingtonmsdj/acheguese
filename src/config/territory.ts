/**
 * Configuração de Território
 * 
 * Centraliza configurações de território de lançamento e fallbacks.
 * 
 * NOTA: Estes valores representam decisões de produto fixas.
 * Se precisar tornar dinâmico, considerar:
 * - Variáveis de ambiente (VITE_LAUNCH_STATE, VITE_LAUNCH_CITY)
 * - Tabela app_config no banco
 * - Feature flags
 */

export const TERRITORY_CONFIG = {
  /**
   * Território de lançamento (usado em fallbacks e landing page)
   */
  launch: {
    country: 'br',
    state: 'ba',
    city: 'salvador',
    name: 'Salvador',
  },

  /**
   * País padrão (decisão de produto: Brasil only)
   */
  defaultCountry: 'br',
} as const;

/**
 * Territórios habilitados no seletor principal de lançamento.
 * 
 * Restringe APENAS a experiência do seletor principal.
 * Não bloqueia cadastro, filtros internos ou navegação por bairros.
 * 
 * Para expandir: adicione entradas aqui. O restante do sistema se adapta.
 */
export type LaunchTerritoryKind = 'city' | 'group';

export interface LaunchTerritory {
  /** Tipo: 'city' para cidade, 'group' para grupo territorial */
  kind: LaunchTerritoryKind;
  /** Slug usado na URL pública (ex: 'salvador', 'complexo-do-nordeste-de-amaralina') */
  slug: string;
  /** Nome de exibição */
  name: string;
  /** Caminho público para navegação (sem módulo) */
  path: string;
  /** Descrição curta para o seletor */
  description?: string;
}

export const LAUNCH_TERRITORIES: LaunchTerritory[] = [
  {
    kind: 'city',
    slug: 'salvador',
    name: 'Salvador',
    path: `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
    description: 'Cidade de lançamento',
  },
  {
    kind: 'group',
    slug: 'complexo-do-nordeste-de-amaralina',
    name: 'Complexo do Nordeste de Amaralina',
    path: `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}/area/complexo-do-nordeste-de-amaralina`,
    description: 'Território destacado de lançamento',
  },
  {
    kind: 'city',
    slug: 'conceicao-do-jacuipe',
    name: 'Conceição do Jacuípe',
    path: `/${TERRITORY_CONFIG.launch.state}/conceicao-do-jacuipe`,
    description: 'Região Metropolitana de Feira de Santana',
  },
] as const;

/**
 * Helpers para construir URLs do território de lançamento
 */
export const LAUNCH_URLS = {
  community: `/comunidade/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  business: `/empresas/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  services: `/servicos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  classifieds: `/classificados/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  gastronomy: `/gastronomia/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  education: `/educacao/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  events: `/eventos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  jobs: `/vagas/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
} as const;

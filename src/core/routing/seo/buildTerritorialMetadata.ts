/**
 * territorialSeo — Builder central de metadados SEO territorial
 *
 * SSOT para geração de title, description, canonical e Open Graph
 * em rotas territoriais. Nunca montar strings de SEO fora daqui.
 *
 * Regras:
 *   - Bairro e grupo geram metadata distintos
 *   - Cada módulo gera metadata distinto
 *   - Canonical sempre aponta para a URL territorial canônica
 *   - Redirects legados não competem (não têm canonical próprio)
 */

import type { Location, TerritorialGroupWithMembers } from '@/core/location/types';
import type { ModuleSlug } from '../utils/territoryUrls';

// ── Textos para a landing hub (sem módulo) ───────────────────────────────────

const HUB_COPY = {
  label: 'Vitrine',
  focus: 'Hub territorial',
  descriptionSuffix: 'Comunidade, empresas, serviços e mobilidade hiperlocal.',
};

// ── Configuração da marca ────────────────────────────────────────────────────

const BRAND = 'Achegue-se';
const SITE_URL = 'https://achegue.se'; // ajustar quando domínio final for definido
const DEFAULT_OG_IMAGE = '/og-image.png';

// ── Textos por módulo ────────────────────────────────────────────────────────

interface ModuleCopy {
  label: string;
  focus: string;
  descriptionSuffix: string;
}

const MODULE_COPY: Record<ModuleSlug, ModuleCopy> = {
  comunidade: {
    label: 'Comunidade',
    focus: 'Comunidade local',
    descriptionSuffix: 'Notícias, posts, alertas e discussões da comunidade local.',
  },
  empresas: {
    label: 'Empresas',
    focus: 'Empresas e negócios locais',
    descriptionSuffix: 'Descubra empresas, lojas e negócios locais.',
  },
  servicos: {
    label: 'Serviços',
    focus: 'Profissionais e serviços locais',
    descriptionSuffix: 'Encontre profissionais e serviços disponíveis na região.',
  },
  classificados: {
    label: 'Classificados',
    focus: 'Classificados locais',
    descriptionSuffix: 'Compra, venda e anúncios de produtos e serviços locais.',
  },
  mobilidade: {
    label: 'Mobilidade',
    focus: 'Mobilidade urbana local',
    descriptionSuffix: 'Transporte, rotas e mobilidade urbana na região.',
  },
  gastronomia: {
    label: 'Gastronomia',
    focus: 'Gastronomia local',
    descriptionSuffix: 'Restaurantes, bares e opções gastronômicas da região.',
  },
  eventos: {
    label: 'Eventos',
    focus: 'Eventos locais',
    descriptionSuffix: 'Eventos, festas e atividades culturais da região.',
  },
  vagas: {
    label: 'Vagas',
    focus: 'Vagas de emprego locais',
    descriptionSuffix: 'Oportunidades de emprego e vagas disponíveis na região.',
  },
  alertas: {
    label: 'Alertas',
    focus: 'Alertas e avisos locais',
    descriptionSuffix: 'Alertas de segurança, trânsito e avisos importantes da região.',
  },
  mapa: {
    label: 'Mapa',
    focus: 'Mapa local',
    descriptionSuffix: 'Explore o mapa interativo da região.',
  },
  guia: {
    label: 'Guia',
    focus: 'Guia local',
    descriptionSuffix: 'Pontos turísticos, atrações e informações úteis da região.',
  },
};

// ── Tipos de saída ───────────────────────────────────────────────────────────

export interface TerritorialMetadata {
  title: string;
  description: string;
  canonical: string;
  og: {
    title: string;
    description: string;
    url: string;
    type: 'website';
    image: string;
    siteName: string;
    locale: string;
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
}

// ── Input types ──────────────────────────────────────────────────────────────

export interface LocationSeoInput {
  kind: 'location';
  location: Location;
  /** null = landing hub (sem módulo) */
  module: ModuleSlug | null;
  canonicalPath: string; // ex: /br/ba/salvador/nordeste-de-amaralina/community
}

export interface GroupSeoInput {
  kind: 'group';
  group: TerritorialGroupWithMembers;
  /** null = landing hub (sem módulo) */
  module: ModuleSlug | null;
  canonicalPath: string; // ex: /ba/salvador/complexo-do-nordeste-de-amaralina/community
}

export type TerritorialSeoInput = LocationSeoInput | GroupSeoInput;

// ── Builder principal ────────────────────────────────────────────────────────

export function buildTerritorialMetadata(input: TerritorialSeoInput): TerritorialMetadata {
  const copy = input.module ? MODULE_COPY[input.module] : HUB_COPY;
  const canonical = `${SITE_URL}${input.canonicalPath}`;

  if (input.kind === 'location') {
    return buildLocationMetadata(input, copy, canonical);
  }
  return buildGroupMetadata(input, copy, canonical);
}

// ── Builder para bairro (Location) ──────────────────────────────────────────

function buildLocationMetadata(
  input: LocationSeoInput,
  copy: ModuleCopy,
  canonical: string,
): TerritorialMetadata {
  const { location, module } = input;

  // Extrai cidade do geographic_path: /br/ba/salvador/nordeste-de-amaralina → Salvador
  const cityName = extractCityName(location.geographic_path);

  const title = `${BRAND} ${location.name} | ${copy.label} em ${cityName}`;
  const description = `${copy.descriptionSuffix} ${location.name}, ${cityName}.`;

  return buildMetadata(title, description, canonical);
}

// ── Builder para grupo territorial ──────────────────────────────────────────

function buildGroupMetadata(
  input: GroupSeoInput,
  copy: ModuleCopy,
  canonical: string,
): TerritorialMetadata {
  const { group } = input;

  // Lista de bairros membros para enriquecer a description
  const memberNames = group.members.map((m) => m.name);
  const membersText = memberNames.length > 0
    ? ` Reúne ${formatList(memberNames)}.`
    : '';

  // Extrai cidade do canonical path: /ba/salvador/... → Salvador
  const cityName = extractCityNameFromGroupPath(input.canonicalPath);

  const title = `${BRAND} ${group.name} | ${copy.label} em ${cityName}`;
  const description = `${copy.descriptionSuffix} ${group.name}, ${cityName}.${membersText}`;

  return buildMetadata(title, description, canonical);
}

// ── Montagem final ───────────────────────────────────────────────────────────

function buildMetadata(
  title: string,
  description: string,
  canonical: string,
): TerritorialMetadata {
  return {
    title,
    description,
    canonical,
    og: {
      title,
      description,
      url: canonical,
      type: 'website',
      image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
      siteName: BRAND,
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrai o nome da cidade a partir do geographic_path de um district.
 * /br/ba/salvador/nordeste-de-amaralina → "Salvador"
 */
function extractCityName(geographicPath: string): string {
  const parts = geographicPath.split('/').filter(Boolean);
  // parts: ['br', 'ba', 'salvador', 'nordeste-de-amaralina']
  const citySlug = parts[2] ?? '';
  return slugToTitle(citySlug);
}

/**
 * Extrai o nome da cidade a partir do canonical path de um grupo.
 * /ba/salvador/complexo-... → "Salvador"
 */
function extractCityNameFromGroupPath(canonicalPath: string): string {
  const parts = canonicalPath.split('/').filter(Boolean);
  // parts: ['ba', 'salvador', 'complexo-...', 'module']
  const citySlug = parts[1] ?? '';
  return slugToTitle(citySlug);
}

/**
 * Converte slug para título legível.
 * "nordeste-de-amaralina" → "Nordeste de Amaralina"
 */
function slugToTitle(slug: string): string {
  const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
  return slug
    .split('-')
    .map((word, i) =>
      i === 0 || !LOWERCASE_WORDS.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word,
    )
    .join(' ');
}

/**
 * Formata lista de nomes com vírgulas e "e" no final.
 * ["A", "B", "C"] → "A, B e C"
 */
function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  const last = items[items.length - 1];
  const rest = items.slice(0, -1);
  return `${rest.join(', ')} e ${last}`;
}

/**
 * territorialSeo - Builder central de metadados SEO territorial
 *
 * SSOT para geração de title, description, canonical e Open Graph
 * em rotas territoriais. Nunca montar strings de SEO fora daqui.
 */

import type { Location } from '@/core/location/types';
import type { TerritorialGroupWithMembers } from '@/core/territorial/contracts';
import type { ModuleSlug } from '../utils/territoryUrls';
import { MODULE_SLUGS } from '../utils/territoryUrls';
import { buildPublicAbsoluteUrl, getPublicAppOrigin } from '@/shared/config/publicAppOrigin';

const HUB_COPY = {
  label: 'Vitrine',
  focus: 'Hub territorial',
  descriptionSuffix: 'Comunidade, empresas, serviços, classificados, mapa e guia local.',
};

const BRAND = 'Achegue-se';
const DEFAULT_OG_IMAGE = '/og-image.png';

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
  educacao: {
    label: 'Educação',
    focus: 'Educação local',
    descriptionSuffix: 'Escolas, cursos e instituições de educação na região.',
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
  busca: {
    label: 'Busca',
    focus: 'Busca territorial',
    descriptionSuffix: 'Encontre comunidades, empresas, serviços, classificados e conteúdos locais.',
  },
  ranking: {
    label: 'Ranking',
    focus: 'Ranking local',
    descriptionSuffix: 'Veja os destaques, avaliações e posições da região.',
  },
  guia: {
    label: 'Guia',
    focus: 'Guia local',
    descriptionSuffix: 'Pontos turísticos, atrações e informações úteis da região.',
  },
};

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

export interface LocationSeoInput {
  kind: 'location';
  location: Location;
  module: ModuleSlug | null;
  canonicalPath: string;
}

export interface GroupSeoInput {
  kind: 'group';
  group: TerritorialGroupWithMembers;
  module: ModuleSlug | null;
  canonicalPath: string;
}

export type TerritorialSeoInput = LocationSeoInput | GroupSeoInput;

export function buildTerritorialMetadata(input: TerritorialSeoInput): TerritorialMetadata {
  const copy = input.module ? MODULE_COPY[input.module] : HUB_COPY;
  const canonical = buildPublicAbsoluteUrl(input.canonicalPath);

  if (input.kind === 'location') {
    return buildLocationMetadata(input, copy, canonical);
  }
  return buildGroupMetadata(input, copy, canonical);
}

function buildLocationMetadata(
  input: LocationSeoInput,
  copy: ModuleCopy,
  canonical: string,
): TerritorialMetadata {
  const { location, module } = input;
  const cityName = extractCityName(location.geographic_path);

  const title = module
    ? `${BRAND} ${location.name} | ${copy.label} em ${cityName}`
    : `${location.name} | ${BRAND}`;
  const description = module
    ? `${copy.descriptionSuffix} ${location.name}, ${cityName}.`
    : `Conheça ${location.name}, ${cityName}. ${copy.descriptionSuffix}`;

  return buildMetadata(title, description, canonical);
}

function buildGroupMetadata(
  input: GroupSeoInput,
  copy: ModuleCopy,
  canonical: string,
): TerritorialMetadata {
  const { group, module } = input;
  const memberNames = group.members.map((m) => m.name);
  const membersText = memberNames.length > 0
    ? ` Reúne ${formatList(memberNames)}.`
    : '';
  const cityName = extractCityNameFromGroupPath(input.canonicalPath);

  const title = module
    ? `${BRAND} ${group.name} | ${copy.label} em ${cityName}`
    : `${group.name} | ${BRAND}`;
  const description = module
    ? `${copy.descriptionSuffix} ${group.name}, ${cityName}.${membersText}`
    : `Conheça ${group.name}, ${cityName}. ${copy.descriptionSuffix}${membersText}`;

  return buildMetadata(title, description, canonical);
}

function buildMetadata(
  title: string,
  description: string,
  canonical: string,
): TerritorialMetadata {
  const publicOrigin = getPublicAppOrigin();
  const absoluteOgImage = publicOrigin ? `${publicOrigin}${DEFAULT_OG_IMAGE}` : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    canonical,
    og: {
      title,
      description,
      url: canonical,
      type: 'website',
      image: absoluteOgImage,
      siteName: BRAND,
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: absoluteOgImage,
    },
  };
}

function extractCityName(geographicPath: string): string {
  const parts = geographicPath.split('/').filter(Boolean);
  const citySlug = parts[2] ?? '';
  return slugToTitle(citySlug);
}

function extractCityNameFromGroupPath(canonicalPath: string): string {
  const parts = canonicalPath.split('/').filter(Boolean);
  const moduleSlugs = new Set<string>(Object.values(MODULE_SLUGS));
  const offset = moduleSlugs.has(parts[0] ?? '') ? 1 : 0;
  const citySlug = parts[offset + 1] ?? '';
  return slugToTitle(citySlug);
}

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

function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  const last = items[items.length - 1];
  const rest = items.slice(0, -1);
  return `${rest.join(', ')} e ${last}`;
}

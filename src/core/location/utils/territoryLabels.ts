/**
 * Territory Labels — SSOT para textos contextuais por nível territorial.
 *
 * Centraliza toda linguagem que varia conforme o contexto territorial ativo:
 * bairro, cidade, estado, grupo territorial.
 *
 * Nenhum componente deve hardcodar "bairro", "cidade", etc.
 * Todos devem usar esta utility via useTerritoryLabels() ou getTerritoryLabels().
 */

import { LocationType } from '../types';
import type { Location, TerritorialGroupWithMembers } from '../types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

// ── Territory Level ──────────────────────────────────────────────────

export type TerritoryLevel = 'district' | 'city' | 'state' | 'group' | 'unknown';

// ── Labels Interface ─────────────────────────────────────────────────

export interface TerritoryLabels {
  /** Nível territorial ativo */
  level: TerritoryLevel;
  /** Nome do território (ex: "Barra", "Salvador", "Complexo do Nordeste") */
  name: string;
  /** Preposição + nome (ex: "no bairro Barra", "em Salvador", "no Complexo do Nordeste") */
  inTerritory: string;
  /** "do/da" + nome (ex: "do bairro Barra", "de Salvador") */
  ofTerritory: string;
  /** Label do mapa (ex: "Mapa do bairro", "Mapa da cidade", "Mapa do grupo") */
  mapLabel: string;
  /** Label de empresas (ex: "Empresas no bairro", "Empresas em Salvador") */
  businessLabel: string;
  /** CTA de exploração (ex: "Explore o bairro", "Explore a cidade") */
  exploreCta: string;
  /** Placeholder de busca contextual */
  searchPlaceholder: string;
  /** "perto de você" ou equivalente contextual */
  nearbyLabel: string;
  /** Descrição para empty state (ex: "neste bairro", "nesta cidade") */
  emptyContext: string;
  /** Label para "todos os resultados" */
  allResultsLabel: string;
  /** Descrição genérica para categoria (substitui "do seu bairro") */
  categoryContext: string;
}

// ── Resolver ─────────────────────────────────────────────────────────

function resolveTerritoryLevel(resolved: ResolvedTerritory | null | undefined): TerritoryLevel {
  if (!resolved) return 'unknown';
  if (resolved.kind === 'group') return 'group';
  if (resolved.kind === 'location') {
    switch (resolved.location.type) {
      case LocationType.DISTRICT: return 'district';
      case LocationType.CITY: return 'city';
      case LocationType.STATE: return 'state';
      default: return 'unknown';
    }
  }
  return 'unknown';
}

function resolveTerritoryName(resolved: ResolvedTerritory | null | undefined): string {
  if (!resolved) return '';
  if (resolved.kind === 'group') return resolved.group.name;
  if (resolved.kind === 'location') return resolved.location.name;
  return '';
}

// ── Labels Factory ───────────────────────────────────────────────────

export function getTerritoryLabels(resolved: ResolvedTerritory | null | undefined): TerritoryLabels {
  const level = resolveTerritoryLevel(resolved);
  const name = resolveTerritoryName(resolved);

  switch (level) {
    case 'district':
      return {
        level,
        name,
        inTerritory: `no bairro ${name}`,
        ofTerritory: `do bairro ${name}`,
        mapLabel: 'Mapa do bairro',
        businessLabel: `Empresas no bairro ${name}`,
        exploreCta: 'Explore o bairro',
        searchPlaceholder: 'Buscar empresas, categorias...',
        nearbyLabel: 'Perto de mim',
        emptyContext: 'neste bairro',
        allResultsLabel: 'Você viu todas as empresas do bairro',
        categoryContext: 'da sua região',
      };

    case 'city':
      return {
        level,
        name,
        inTerritory: `em ${name}`,
        ofTerritory: `de ${name}`,
        mapLabel: 'Mapa da cidade',
        businessLabel: `Empresas em ${name}`,
        exploreCta: 'Explore a cidade',
        searchPlaceholder: `Buscar empresas em ${name}...`,
        nearbyLabel: 'Perto de mim',
        emptyContext: 'nesta cidade',
        allResultsLabel: `Você viu todas as empresas de ${name}`,
        categoryContext: `em ${name}`,
      };

    case 'state':
      return {
        level,
        name,
        inTerritory: `em ${name}`,
        ofTerritory: `de ${name}`,
        mapLabel: 'Mapa do estado',
        businessLabel: `Empresas em ${name}`,
        exploreCta: 'Explore o estado',
        searchPlaceholder: `Buscar empresas em ${name}...`,
        nearbyLabel: 'Perto de mim',
        emptyContext: 'neste estado',
        allResultsLabel: `Você viu todas as empresas de ${name}`,
        categoryContext: `em ${name}`,
      };

    case 'group':
      return {
        level,
        name,
        inTerritory: `no ${name}`,
        ofTerritory: `do ${name}`,
        mapLabel: 'Mapa da região',
        businessLabel: `Empresas no ${name}`,
        exploreCta: 'Explore a região',
        searchPlaceholder: `Buscar empresas no ${name}...`,
        nearbyLabel: 'Perto de mim',
        emptyContext: 'nesta região',
        allResultsLabel: `Você viu todas as empresas do ${name}`,
        categoryContext: `no ${name}`,
      };

    default:
      return {
        level,
        name: name || 'sua região',
        inTerritory: 'na sua região',
        ofTerritory: 'da sua região',
        mapLabel: 'Mapa',
        businessLabel: 'Empresas',
        exploreCta: 'Explore',
        searchPlaceholder: 'Buscar empresas...',
        nearbyLabel: 'Perto de mim',
        emptyContext: 'na sua região',
        allResultsLabel: 'Você viu todas as empresas disponíveis',
        categoryContext: 'da sua região',
      };
  }
}

/**
 * Gera descrição contextual para uma categoria, substituindo "do seu bairro".
 * Ex: "Descubra os melhores restaurantes em Salvador."
 */
export function getCategoryDescription(
  baseDescription: string,
  resolved: ResolvedTerritory | null | undefined,
): string {
  const labels = getTerritoryLabels(resolved);
  // Substitui variações de "do seu bairro", "da sua região", "perto de você"
  return baseDescription
    .replace(/do seu bairro/gi, labels.categoryContext)
    .replace(/da sua região/gi, labels.categoryContext)
    .replace(/perto de você/gi, labels.inTerritory)
    .replace(/perto de casa/gi, labels.inTerritory);
}

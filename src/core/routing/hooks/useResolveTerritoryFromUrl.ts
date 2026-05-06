/* eslint-disable react-hooks/exhaustive-deps */
/**
 * useResolveTerritoryFromUrl
 *
 * Resolve o território ativo a partir dos params da URL.
 *
 * Padrões suportados:
 *   FORMATO LEGADO:
 *   /:country/:state/:city/:district        → Location (district)
 *   /:country/:state/:city/:groupSlug       → TerritorialGroup
 *   
 *   FORMATO AMIGÁVEL (URLs reais, não redirects):
 *   /empresas/:state/:city/:district?       → Location (infere country='br')
 *   /servicos/:state/:city/:district?       → Location (infere country='br')
 *   /classificados/:state/:city/:district?  → Location (infere country='br')
 *   /comunidade/:state/:city/:district?     → Location (infere country='br')
 *
 * Comportamento:
 *   - Sem fallback hardcoded
 *   - Inexistente → status 'not_found'
 *   - Inativo     → status 'inactive'
 *   - Location resolvida → grava no locationContextStore
 *   - Group resolvido    → retorna como dado, NÃO grava no ActiveTerritory (Etapa 3)
 */

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { createTerritorialGroupRepository } from '@/core/location/repositories/createTerritorialGroupRepository';
import { locationContextStore } from '@/core/location/stores/LocationContextStore';
import { TERRITORY_CONFIG } from '@/config/territory';
import type { Location, TerritorialGroupWithMembers } from '@/core/location/types';
import { isTerritoryPubliclyNavigable } from '../utils/territoryVisibility';

export const TERRITORY_RESOLVE_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  RESOLVED_LOCATION: 'resolved_location',
  RESOLVED_GROUP: 'resolved_group',
  NOT_FOUND: 'not_found',
  INACTIVE: 'inactive',
  RESTRICTED: 'restricted',
  ERROR: 'error',
} as const;

export type TerritoryResolveStatus =
  (typeof TERRITORY_RESOLVE_STATUS)[keyof typeof TERRITORY_RESOLVE_STATUS];

export type ResolvedTerritory =
  | { kind: 'location'; location: Location }
  | { kind: 'group'; group: TerritorialGroupWithMembers }
  | null;

export interface TerritoryResolveResult {
  status: TerritoryResolveStatus;
  resolved: ResolvedTerritory;
  error: string | null;
}

export function useResolveTerritoryFromUrl(): TerritoryResolveResult {
  const location = useLocation();
  const params = useParams<{
    country?: string;
    state?: string;
    city?: string;
    groupSlugOrDistrict?: string;
    district?: string; // ✅ Suporte para rotas de módulo que usam :district
  }>();

  const pathname = location.pathname;
  const state = params.state;
  const city = params.city;
  // slug único: pode ser bairro ou grupo — resolvido pelo banco
  // Prioridade: district (rotas de módulo) > groupSlugOrDistrict (rotas territoriais)
  // "_" é tratado como placeholder para "sem distrito" (resolve apenas cidade)
  let slug = params.district || params.groupSlugOrDistrict;
  if (slug === '_') slug = undefined; // Placeholder para "sem distrito"
  
  // HACK: Para rotas do módulo guide com 3 segmentos, se o slug não for encontrado
  // como distrito/grupo, devemos resolver apenas a cidade (não retornar not_found)
  const isGuideRoute = pathname.startsWith('/pontos-turisticos/') || pathname.startsWith('/guia/pontos-turisticos/');

  const country = params.country ?? TERRITORY_CONFIG.defaultCountry;

  const [result, setResult] = useState<TerritoryResolveResult>({
    status: TERRITORY_RESOLVE_STATUS.IDLE,
    resolved: null,
    error: null,
  });

  useEffect(() => {
    if (!country || !state || !city) return;

    let cancelled = false;
    setResult({ status: TERRITORY_RESOLVE_STATUS.LOADING, resolved: null, error: null });

    async function resolve() {
      try {
        const locationRepo = createLocationRepository();

        const cityPath = `/${country}/${state}/${city}`;
        const cityLocation = await locationRepo.findByPath(cityPath);

        if (!cityLocation) {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Cidade não encontrada: ${cityPath}` });
          return;
        }

        // --- Sem slug: resolve cidade ---
        if (!slug) {
          if (cityLocation.status !== 'active') {
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Cidade inativa: ${cityLocation.name}` });
            return;
          }
          if (!isTerritoryPubliclyNavigable(cityLocation.metadata)) {
            if (!cancelled) {
              setResult({
                status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
                resolved: null,
                error: `${cityLocation.name} não está disponível para navegação pública no momento.`,
              });
            }
            return;
          }
          // ✅ NÃO define território ativo automaticamente - deixa TerritoryModeInitializer gerenciar
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION, resolved: { kind: 'location', location: cityLocation }, error: null });
          return;
        }

        // --- Com slug: tenta grupo primeiro, depois bairro ---
        const groupRepo = createTerritorialGroupRepository();
        const group = await groupRepo.findBySlugAndCity(slug, cityLocation.id);

        if (group) {
          // É um grupo territorial
          if (group.status !== 'active') {
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Grupo inativo: ${group.name}` });
            return;
          }
          
          // URL pública respeita apenas flag de navegação, não visibilidade do seletor.
          const isPubliclyNavigable = isTerritoryPubliclyNavigable(group.metadata);

          if (!isPubliclyNavigable) {
            if (!cancelled) setResult({ 
              status: TERRITORY_RESOLVE_STATUS.RESTRICTED, 
              resolved: null, 
              error: `${group.name} não está disponível para navegação pública no momento.` 
            });
            return;
          }
          
          const withMembers = await groupRepo.findWithMembers(group.id);
          if (!withMembers) {
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Grupo sem membros: ${slug}` });
            return;
          }
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP, resolved: { kind: 'group', group: withMembers }, error: null });
          return;
        }

        if (!isTerritoryPubliclyNavigable(cityLocation.metadata)) {
          if (!cancelled) {
            setResult({
              status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
              resolved: null,
              error: `${cityLocation.name} não está disponível para navegação pública no momento.`,
            });
          }
          return;
        }

        // É um bairro (district)
        const districtPath = `${cityPath}/${slug}`;
        const districtLocation = await locationRepo.findByPath(districtPath);

        if (!districtLocation) {
          // Para rotas do módulo guide, se não encontrar distrito/grupo,
          // resolve apenas a cidade (assume que o slug é de um ponto turístico)
          if (isGuideRoute) {
            if (cityLocation.status !== 'active') {
              if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Cidade inativa: ${cityLocation.name}` });
              return;
            }
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION, resolved: { kind: 'location', location: cityLocation }, error: null });
            return;
          }
          
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Local não encontrado: ${districtPath}` });
          return;
        }
        
        if (districtLocation.status !== 'active') {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Bairro inativo: ${districtLocation.name}` });
          return;
        }
        
        if (districtLocation.parent_id !== cityLocation.id) {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Bairro ${slug} não pertence a ${city}` });
          return;
        }

        // URL pública respeita flag de navegação; seletor não deve bloquear deep-link.
        const isPubliclyNavigable = isTerritoryPubliclyNavigable(
          districtLocation.metadata,
        );

        if (!isPubliclyNavigable) {
          if (!cancelled) setResult({ 
            status: TERRITORY_RESOLVE_STATUS.RESTRICTED, 
            resolved: null, 
            error: `${districtLocation.name} não está disponível para navegação pública no momento.` 
          });
          return;
        }

        // ✅ NÃO define território ativo automaticamente - deixa TerritoryModeInitializer gerenciar
        if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION, resolved: { kind: 'location', location: districtLocation }, error: null });

      } catch (err) {
        if (!cancelled) {
          setResult({ status: TERRITORY_RESOLVE_STATUS.ERROR, resolved: null, error: err instanceof Error ? err.message : 'Erro desconhecido' });
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [country, state, city, slug]);

  return result;
}


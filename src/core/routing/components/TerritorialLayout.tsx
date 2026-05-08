/* eslint-disable react-refresh/only-export-components */
/**
 * TerritorialLayout
 *
 * Layout base para rotas territoriais.
 * Resolve o território a partir da URL, gerencia estados e
 * expõe identidade territorial + navegação de módulos.
 *
 * Etapa 8: expõe groupAvailability no contexto do Outlet e exibe
 * banner de cobertura parcial quando availability === 'partial'.
 */

import { Loader2, AlertTriangle } from 'lucide-react';
import { Outlet, useOutletContext, useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useResolveTerritoryFromUrl } from '../hooks/useResolveTerritoryFromUrl';
import { TerritorialNotFound } from './TerritorialNotFound';
import { TerritorialSEO } from '../seo/TerritorialSEO';
import { MODULE_SLUGS, buildGroupBaseUrl, isEntityDetailRoute } from '../utils/territoryUrls';
import { useGroupAvailability } from '@/core/territorial/hooks/useGroupAvailability';
import { ModuleKey } from '@/core/rollout/types';
import { lastTerritoryStore } from '../stores/LastTerritoryStore';
import { TERRITORY_CONFIG } from '@/config/territory';
import { ErrorBoundary } from '@/shared/components/errors/ErrorBoundary';
import type { ResolvedTerritory } from '../hooks/useResolveTerritoryFromUrl';
import type { GroupModuleAvailability } from '@/core/territorial/types';

// ── Contexto do Outlet ───────────────────────────────────────────────────────

export type TerritorialLayoutContext = {
  resolved: ResolvedTerritory;
  /**
   * URL base do território atual, calculada deterministicamente via useParams.
   * Ex: /ba/salvador/nordeste-de-amaralina
   *     /ba/salvador/area/complexo-do-nordeste-de-amaralina
   *
   * NUNCA depende da ordem dos membros do grupo.
   * Usar este valor em vez de recalcular baseUrl dentro dos filhos.
   */
  baseUrl: string;
  /**
   * Disponibilidade do módulo atual no grupo.
   * Apenas relevante quando resolved.kind === 'group'.
   * Para location, sempre 'full' (rollout é por bairro individual).
   */
  groupAvailability: GroupModuleAvailability;
  /**
   * IDs dos membros do grupo com rollout ativo para o módulo atual.
   * Usar em useTerritoryFilter(resolved, activeMemberIds) para filtrar queries.
   */
  activeMemberIds: string[];
};

export function useTerritorialContext() {
  return useOutletContext<TerritorialLayoutContext>();
}

export function useTerritorialContextOptional() {
  return useOutletContext<TerritorialLayoutContext | null>() ?? null;
}

// ── Mapeamento de slug de módulo para ModuleKey ──────────────────────────────

const SLUG_TO_MODULE_KEY: Record<string, ModuleKey> = {
  [MODULE_SLUGS.community]:   ModuleKey.COMMUNITY,
  [MODULE_SLUGS.business]:    ModuleKey.BUSINESS,
  [MODULE_SLUGS.services]:    ModuleKey.SERVICES,
  [MODULE_SLUGS.classifieds]: ModuleKey.CLASSIFIEDS,
  [MODULE_SLUGS.mobility]:    ModuleKey.MOBILITY,
  [MODULE_SLUGS.gastronomy]:  ModuleKey.GASTRONOMY,
  [MODULE_SLUGS.events]:      ModuleKey.EVENTS,
  [MODULE_SLUGS.jobs]:        ModuleKey.JOBS,
};

function resolveModuleKeyFromSlug(slug: string): ModuleKey | null {
  switch (slug) {
    case MODULE_SLUGS.community:
      return SLUG_TO_MODULE_KEY[MODULE_SLUGS.community];
    case MODULE_SLUGS.business:
      return SLUG_TO_MODULE_KEY[MODULE_SLUGS.business];
    case MODULE_SLUGS.services:
      return SLUG_TO_MODULE_KEY[MODULE_SLUGS.services];
    case MODULE_SLUGS.classifieds:
      return SLUG_TO_MODULE_KEY[MODULE_SLUGS.classifieds];
    case MODULE_SLUGS.mobility:
      return SLUG_TO_MODULE_KEY[MODULE_SLUGS.mobility];
    case MODULE_SLUGS.gastronomy:
      return SLUG_TO_MODULE_KEY[MODULE_SLUGS.gastronomy];
    case MODULE_SLUGS.events:
      return SLUG_TO_MODULE_KEY[MODULE_SLUGS.events];
    case MODULE_SLUGS.jobs:
      return SLUG_TO_MODULE_KEY[MODULE_SLUGS.jobs];
    default:
      return null;
  }
}

// ── Banner de cobertura parcial ──────────────────────────────────────────────

function PartialCoverageBanner({
  activeCount,
  totalCount,
}: {
  activeCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        Cobertura parcial — {activeCount} de {totalCount} bairros disponíveis neste módulo.
      </span>
    </div>
  );
}

// ── Banner de módulo indisponível ────────────────────────────────────────────

function UnavailableModuleBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-muted/60 border-b border-border text-xs text-muted-foreground">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>Este módulo ainda não está disponível neste território.</span>
    </div>
  );
}

// ── Layout principal ─────────────────────────────────────────────────────────

export function TerritorialLayout() {
  const { status, resolved, error } = useResolveTerritoryFromUrl();
  const { pathname } = useLocation();
  const params = useParams<{
    country?: string; state?: string; city?: string;
    district?: string;
    groupSlug?: string;
    groupSlugOrDistrict?: string;
  }>();

  const state = params.state;
  const city = params.city;
  const slug = params.groupSlug ?? params.district ?? params.groupSlugOrDistrict;

  const isFriendlyModule = pathname.startsWith('/empresas/') || 
      pathname.startsWith('/servicos/') || 
      pathname.startsWith('/classificados/') ||
      pathname.startsWith('/comunidade/');

  const country = params.country ?? TERRITORY_CONFIG.defaultCountry;

  // Resolve o módulo atual a partir do pathname
  const currentModuleSlug = pathname.split('/').filter(Boolean)[0] ?? '';
  const currentModuleKey = resolveModuleKeyFromSlug(currentModuleSlug);

  // Resolve availability do grupo (só relevante quando resolved.kind === 'group')
  const groupId = resolved?.kind === 'group' ? resolved.group.id : null;
  const { availability, active_member_ids, result: availabilityResult, isLoading: availabilityLoading } = useGroupAvailability(
    groupId,
    currentModuleKey,
  );

  // baseUrl = landing do território (sem módulo)
  // SSOT: usa geographic_path da location resolvida, não os params da URL
  const baseUrl = resolved
    ? resolved.kind === 'group'
      ? (() => {
          // Para grupo: pega a cidade âncora do primeiro membro
          const firstMember = resolved.group.members[0];
          if (!firstMember?.geographic_path) return `/${state}/${city}/area/${resolved.group.slug}`;
          const parts = firstMember.geographic_path.split('/').filter(Boolean);
          return buildGroupBaseUrl(resolved.group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
        })()
      : (() => {
          // Para location: usa geographic_path removendo /br
          const parts = resolved.location.geographic_path.split('/').filter(Boolean);
          return '/' + parts.slice(1).join('/');
        })()
    : slug
      ? `/${state}/${city}/${slug}`
      : `/${state}/${city}`;

  const territoryName = resolved
    ? resolved.kind === 'group'
      ? resolved.group.name
      : resolved.location.name
    : '';

  // Persiste o território resolvido para uso fora das rotas territoriais (header, sidebar)
  // useEffect deve ficar ANTES de qualquer early return — Rules of Hooks
  // 
  useEffect(() => {
    if (status === 'resolved_location' || status === 'resolved_group') {
      if (territoryName && baseUrl && !isEntityDetailRoute(pathname)) {
        lastTerritoryStore.set({ name: territoryName, baseUrl });
      }
    }
  }, [status, territoryName, baseUrl, pathname]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'not_found') {
    return <TerritorialNotFound message={error ?? undefined} />;
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-lg font-medium">Território inativo</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error ?? 'Este território não está disponível no momento.'}
        </p>
      </div>
    );
  }

  if (status === 'restricted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-full p-4">
          <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <p className="text-xl font-semibold text-foreground">Território indisponível</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error ?? 'Este território não está disponível para navegação pública no momento.'}
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Você pode voltar ou navegar para a visão mais ampla da cidade.
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => window.location.href = `/${state}/${city}`}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Ver Cidade Completa
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    // Render outlet anyway so pages with mock data can still render
    const fallbackContext: TerritorialLayoutContext = {
      resolved: resolved as any,
      baseUrl,
      groupAvailability: 'full',
      activeMemberIds: [],
    };
    return (
      <ErrorBoundary>
        <Outlet context={fallbackContext} />
      </ErrorBoundary>
    );
  }

  // Para location, availability é sempre 'full' (rollout é por bairro individual)
  const effectiveAvailability: GroupModuleAvailability =
    resolved?.kind === 'group' ? availability : 'full';

  const outletContext: TerritorialLayoutContext = {
    resolved,
    baseUrl,
    groupAvailability: effectiveAvailability,
    activeMemberIds: resolved?.kind === 'group' ? active_member_ids : [],
  };

  return (
    <>
      <TerritorialSEO resolved={resolved} baseUrl={baseUrl} />

      {/* Banners de disponibilidade — apenas em contexto de grupo */}
      {resolved?.kind === 'group' && currentModuleKey && (
        <>
          {effectiveAvailability === 'partial' && availabilityResult && (
            <PartialCoverageBanner
              activeCount={availabilityResult.active_module_members}
              totalCount={availabilityResult.total_active_members}
            />
          )}
          {effectiveAvailability === 'none' && !availabilityLoading && <UnavailableModuleBanner />}
        </>
      )}

      <ErrorBoundary>
        <Outlet context={outletContext} />
      </ErrorBoundary>
    </>
  );
}

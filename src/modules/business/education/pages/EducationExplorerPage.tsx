/**
 * EducationExplorerPage
 *
 * Vitrine premium de descoberta educacional.
 * Design editorial/boutique com busca, filtros multifaceta
 * e cards de alta densidade informacional.
 *
 * Foco: descoberta e conversão.
 *
 * Rota: /educacao/:state/:city
 *       /educacao/:state/:city/:district
 *
 * Consome SSOT existente:
 *  - useEducationList (hook)
 *  - getPublicNiches / getNicheByKey (registry)
 *
 * @module education
 * @version 3.0.0
 */
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  GraduationCap,
  Search,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Shield,
  Building2,
  X,
  ScanSearch,
  Loader2,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { cn } from '@/shared/utils/cn';
import { useResolveTerritoryFromUrl } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { LocationType } from '@/core/location/types';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';
import { APP_MODULE_SLUGS } from '@/shared/config/moduleSlugs';
import { buildModuleTerritoryUrlFromSegments } from '@/core/routing/utils/territoryUrls';

import {
  useEducationDistricts,
  useEducationList,
} from '../hooks/useEducationList';
import { EducationUrlService } from '../services/EducationUrlService';
import { getPublicNiches, getNicheByKey } from '../niches/registry';
import {
  INITIAL_FILTERS,
  sanitizePublicEducationText,
  type FilterState,
  type ViewMode,
  type EnrichedEducationProfile,
} from './explorerFilters';
import { FilterBar, FilterPanel } from './explorerFilterControls';
import { EditorialCard, SkeletonCard } from './explorerCards';
import {
  NICHE_ACCENT,
  NICHE_ICONS,
  SCHOOL_NETWORK_LABELS,
  slugToLabel,
} from './explorerPresentation.constants';
import { NicheChip } from './explorerNicheChip';
import {
  ActiveEducationFilterChips,
  EducationDataDisclaimer,
  EducationInstitutionCta,
  EducationNicheShowcase,
  FeaturedEducationSection,
} from './explorerMarketingSections';
import type { EducationPublicProfile } from '@/core/education';

export function EducationExplorerPage() {
  const { state, city, district, groupSlugOrDistrict } = useParams();
  const prefersReducedMotion = useReducedMotion();
  const { active } = usePublicBrowsingCity();
  const effectiveState = state ?? active.state;
  const effectiveCity = city ?? active.city;
  const niches = useMemo(() => getPublicNiches(), []);
  const { resolved } = useResolveTerritoryFromUrl();

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [view, setView] = useState<ViewMode>('grid');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const groupLocationIds = useMemo(() => {
    if (resolved?.kind !== 'group') return [];

    return resolved.group.members
      .filter((member) => String(member.status) === 'active')
      .map((member) => member.id);
  }, [resolved]);

  const routeDistrict = useMemo(() => {
    if (resolved?.kind === 'group') return null;
    if (
      resolved?.kind === 'location' &&
      (resolved.location.type === LocationType.NEIGHBORHOOD ||
        resolved.location.type === LocationType.DISTRICT)
    ) {
      return resolved.location.slug ?? district ?? groupSlugOrDistrict ?? null;
    }
    return null;
  }, [district, groupSlugOrDistrict, resolved]);

  const hasRouteTerritorySegment = Boolean(district || groupSlugOrDistrict);
  const hasUsableGroupScope =
    resolved?.kind !== 'group' || groupLocationIds.length > 0;
  const educationScopeReady =
    (!hasRouteTerritorySegment || resolved !== null) && hasUsableGroupScope;
  const districtLocked = Boolean(routeDistrict);

  const scopeIdentity =
    resolved?.kind === 'group'
      ? `group:${resolved.group.id}`
      : resolved?.kind === 'location'
        ? `location:${resolved.location.id}`
        : `city:${effectiveState}:${effectiveCity}`;

  useEffect(() => {
    setFilters((previous) =>
      previous.district === null
        ? previous
        : { ...previous, district: null },
    );
  }, [scopeIdentity]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEducationList({
    state: effectiveState,
    city: effectiveCity,
    district: routeDistrict ?? filters.district ?? undefined,
    locationIds: groupLocationIds,
    enabled: educationScopeReady,
    query: filters.query,
    niches: filters.niches,
    schoolNetworks: filters.schoolNetworks,
    institutionTypes: filters.institutionTypes,
    infrastructure: filters.infrastructure,
    onlyAvailable: filters.onlyAvailable,
    sort: filters.sort,
  });
  const { data: districtFacets = [] } = useEducationDistricts(
    effectiveState,
    effectiveCity,
    groupLocationIds,
    educationScopeReady,
  );

  const sourceProfiles: EducationPublicProfile[] = useMemo(
    () => data?.pages.flatMap((page) => page.profiles ?? []) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const hasRealData = sourceProfiles.length > 0;

  const districts = useMemo(
    () =>
      routeDistrict
        ? [routeDistrict]
        : districtFacets.map((facet) => facet.district),
    [districtFacets, routeDistrict],
  );

  const filtered: EnrichedEducationProfile[] = useMemo(
    () => sourceProfiles.map((profile) => ({ profile })),
    [sourceProfiles],
  );

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const featured = useMemo(
    () => sourceProfiles.filter((profile) => profile.public_route).slice(0, 6),
    [sourceProfiles],
  );

  const territoryLabel = useMemo(() => {
    if (resolved?.kind === 'group') return resolved.group.name;
    if (
      resolved?.kind === 'location' &&
      (resolved.location.type === LocationType.NEIGHBORHOOD ||
        resolved.location.type === LocationType.DISTRICT)
    ) {
      return resolved.location.name;
    }
    if (groupSlugOrDistrict) return slugToLabel(groupSlugOrDistrict);
    return slugToLabel(effectiveCity);
  }, [effectiveCity, groupSlugOrDistrict, resolved]);

  const canonicalPath = EducationUrlService.buildListingUrl({
    state: effectiveState,
    city: effectiveCity,
    district,
  });
  const businessExplorerHref = buildModuleTerritoryUrlFromSegments(
    APP_MODULE_SLUGS.business,
    effectiveState,
    effectiveCity,
    district ? [district] : [],
  );

  return (
    <div className="min-h-screen bg-territory-surface text-territory-ink">
      <Helmet>
        <title>Educação em {territoryLabel} | Acheguese</title>
        <meta
          name="description"
          content={`Explore escolas, cursos, professores e instituições educacionais em ${territoryLabel} com filtros avançados e contato direto.`}
        />
        <link rel="canonical" href={buildPublicAbsoluteUrl(canonicalPath)} />
      </Helmet>

      <section className="relative overflow-hidden border-b border-territory-border bg-gradient-to-br from-territory-surface via-territory-raised/50 to-territory-surface">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-territory-brand/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-territory-info/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge
                variant="outline"
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border-territory-brand/30 bg-territory-brand/5 px-3 py-1 text-xs uppercase tracking-wide text-territory-brand"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Vitrine educacional
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-territory-ink md:text-5xl lg:text-6xl">
                Encontre a escola, curso ou professor ideal em{' '}
                <span className="capitalize text-territory-brand">
                  {territoryLabel}
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-balance text-base text-territory-muted md:text-lg">
                Compare informações publicadas e filtre por rede, tipo, bairro,
                infraestrutura e disponibilidade.
              </p>

              <div className="relative mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-territory-border bg-territory-surface p-2 shadow-sm">
                <Search
                  className="ml-2 h-5 w-5 shrink-0 text-territory-muted"
                  aria-hidden="true"
                />
                <Input
                  value={filters.query}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      query: event.target.value,
                    }))
                  }
                  placeholder="Buscar por curso, escola, professor ou serviço..."
                  aria-label="Buscar instituições de Educação"
                  className="border-0 bg-transparent text-territory-ink shadow-none focus-visible:ring-0"
                />
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      size="sm"
                      className="h-11 w-11 rounded-xl bg-territory-brand p-0 text-territory-on-image hover:bg-territory-brand/90 lg:hidden"
                      type="button"
                      aria-label="Abrir filtros"
                    >
                      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-full max-w-md overflow-y-auto border-territory-border bg-territory-surface text-territory-ink sm:max-w-md"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-territory-ink">
                        Filtrar resultados
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel
                        filters={filters}
                        setFilters={setFilters}
                        niches={niches}
                        districts={districts}
                        districtLocked={districtLocked}
                        nicheIcons={NICHE_ICONS}
                        resultsCount={totalCount}
                        onClear={clearFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {niches.slice(0, 6).map((niche) => {
                  const Icon = NICHE_ICONS[niche.nicheKey] ?? GraduationCap;
                  const isActive = filters.niches.includes(niche.nicheKey);
                  return (
                    <NicheChip
                      key={niche.nicheKey}
                      label={niche.displayName}
                      icon={Icon}
                      active={isActive}
                      onClick={() =>
                        setFilters((previous) => ({
                          ...previous,
                          niches: isActive
                            ? previous.niches.filter(
                                (value) => value !== niche.nicheKey,
                              )
                            : [...previous.niches, niche.nicheKey],
                        }))
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div className="relative hidden h-[420px] lg:block">
              <div className="absolute inset-0 grid grid-cols-2 gap-3">
                {featured.map((profile, index) => {
                  const Icon = NICHE_ICONS[profile.niche_key] ?? GraduationCap;
                  const gradient =
                    NICHE_ACCENT[profile.niche_key] ??
                    'from-territory-brand/90 to-territory-brand/70';
                  return (
                    <motion.div
                      key={profile.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1 }
                      }
                      className={cn(
                        'relative overflow-hidden rounded-3xl border border-territory-border/60 bg-gradient-to-br p-5 text-territory-on-image shadow-lg',
                        gradient,
                        index === 0 && 'col-span-2 row-span-1',
                        index === 1 && 'row-span-2',
                        index === 2 && 'row-span-1',
                      )}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <Icon className="h-8 w-8 opacity-90" aria-hidden="true" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider opacity-80">
                            {getNicheByKey(profile.niche_key)?.displayName}
                          </div>
                          <div className="mt-1 line-clamp-2 text-base font-bold">
                            {profile.business_name ??
                              getNicheByKey(profile.niche_key)?.displayName ??
                              'Instituição educacional'}
                          </div>
                          {profile.public_route?.district && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[11px] opacity-80">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {profile.public_route.district.replace(/-/g, ' ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        niches={niches}
        districts={districts}
        districtLocked={districtLocked}
        nicheIcons={NICHE_ICONS}
        view={view}
        setView={setView}
        resultsCount={totalCount}
        onClear={clearFilters}
      />

      <section className="container mx-auto px-4 py-10">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-2 rounded-full border border-territory-border bg-territory-surface px-4 py-1.5 text-sm shadow-sm"
            >
              <Building2 className="h-4 w-4 text-territory-muted" aria-hidden="true" />
              <strong className="text-territory-ink">{totalCount}</strong>
              <span className="text-territory-muted">
                {totalCount === 1 ? 'instituição' : 'instituições'}
              </span>
            </div>
          </div>

          <ActiveEducationFilterChips
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
          />

          {isError ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-territory-error/35 bg-territory-error/5 p-12 text-center"
            >
              <Shield className="h-10 w-10 text-territory-error" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-territory-ink">
                Não conseguimos carregar a vitrine
              </h3>
              <p className="mt-2 max-w-sm text-sm text-territory-muted">
                Houve um erro ao consultar as instituições. Tente novamente em
                alguns segundos.
              </p>
              <Button
                onClick={() => refetch()}
                className="mt-4 rounded-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
              >
                Tentar novamente
              </Button>
            </div>
          ) : isLoading && !hasRealData ? (
            <div
              role="status"
              aria-label="Carregando instituições de Educação"
              className={cn(
                view === 'grid'
                  ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6'
                  : 'flex flex-col gap-4',
              )}
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-territory-border bg-territory-raised/60 p-12 text-center"
            >
              <ScanSearch className="h-10 w-10 text-territory-muted" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-territory-ink">
                Nenhum resultado encontrado
              </h3>
              <p className="mt-2 max-w-sm text-sm text-territory-muted">
                Tente remover alguns filtros ou buscar com outro termo para consultar
                outras instituições disponíveis neste território.
              </p>
              <Button
                onClick={clearFilters}
                className="mt-4 rounded-full border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
                variant="outline"
              >
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                view === 'grid'
                  ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6'
                  : 'flex flex-col gap-4',
              )}
            >
              {filtered.map(({ profile }, index) => (
                <EditorialCard
                  key={profile.id}
                  profile={profile}
                  index={index}
                  view={view}
                  nicheIcons={NICHE_ICONS}
                  nicheAccent={NICHE_ACCENT}
                  schoolNetworkLabels={SCHOOL_NETWORK_LABELS}
                  sanitizeSummary={sanitizePublicEducationText}
                />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="min-w-48 rounded-full border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                    Carregando...
                  </>
                ) : (
                  `Carregar mais (${sourceProfiles.length} de ${totalCount})`
                )}
              </Button>
            </div>
          )}

          <EducationNicheShowcase
            niches={niches}
            sourceProfiles={sourceProfiles}
            selectedNiches={filters.niches}
            setFilters={setFilters}
            nicheIcons={NICHE_ICONS}
            nicheAccent={NICHE_ACCENT}
          />
        </div>
      </section>

      <FeaturedEducationSection
        featured={featured}
        territoryLabel={territoryLabel}
        clearFilters={clearFilters}
        nicheIcons={NICHE_ICONS}
        nicheAccent={NICHE_ACCENT}
        sanitizeSummary={sanitizePublicEducationText}
      />

      <EducationDataDisclaimer />

      <EducationInstitutionCta businessExplorerHref={businessExplorerHref} />
    </div>
  );
}

export default EducationExplorerPage;

/**
 * EducationExplorerPage
 *
 * Vitrine premium de descoberta educacional.
 * Design editorial/boutique com command-search, filtros multi-faceta,
 * comparador flutuante e cards de alta densidade informacional.
 *
 * Foco: descoberta, comparação e conversão.
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
import { motion } from 'framer-motion';
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
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';
import { cn } from '@/shared/utils/cn';
import { useResolveTerritoryFromUrl } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { LocationType } from '@/core/location/types';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';
import { APP_MODULE_SLUGS } from '@/shared/config/moduleSlugs';
import { buildModuleTerritoryUrlFromSegments } from '@/core/routing/utils/territoryUrls';

import { useEducationList } from '../hooks/useEducationList';
import { EducationUrlService } from '../services/EducationUrlService';
import { getPublicNiches, getNicheByKey } from '../niches/registry';
import {
  filterEnrichedProfiles,
  INITIAL_FILTERS,
  sanitizePublicEducationText,
  type FilterState,
  type ViewMode,
  type EnrichedEducationProfile,
} from './explorerFilters';
import {
  FilterBar,
  FilterPanel,
} from './explorerFilterControls';
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
  EducationCompareBar,
  EducationDataDisclaimer,
  EducationInstitutionCta,
  EducationNicheShowcase,
  FeaturedEducationSection,
} from './explorerMarketingSections';
import type { EducationPublicProfile } from '@/core/education';

// ============================================================================
// PAGINA PRINCIPAL
// ============================================================================

export function EducationExplorerPage() {
  const {
    state,
    city,
    district,
    groupSlugOrDistrict,
  } = useParams();
  const { active } = usePublicBrowsingCity();
  const effectiveState = state ?? active.state;
  const effectiveCity = city ?? active.city;
  const niches = useMemo(() => getPublicNiches(), []);
  const { resolved } = useResolveTerritoryFromUrl();

  const { data, isLoading, isError, refetch } = useEducationList({
    state: effectiveState,
    city: effectiveCity,
    district,
  });
  const sourceProfiles: EducationPublicProfile[] = useMemo(
    () => data?.pages.flatMap((p) => p.profiles ?? []) ?? [],
    [data]
  );
  const hasRealData = sourceProfiles.length > 0;

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [view, setView] = useState<ViewMode>('grid');
  const [comparing, setComparing] = useState<string[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Pre-selecionar bairro pela URL se vier definido
  useEffect(() => {
    if (district) {
      setFilters((prev) => ({ ...prev, district }));
      return;
    }

    if (
      resolved?.kind === 'location' &&
      (resolved.location.type === LocationType.NEIGHBORHOOD || resolved.location.type === LocationType.DISTRICT)
    ) {
      const districtSlug = resolved.location.slug ?? groupSlugOrDistrict;
      if (districtSlug) {
        setFilters((prev) => ({ ...prev, district: districtSlug }));
      }
      return;
    }

    // URL de grupo territorial: não aplicar filtro de bairro fixo
    setFilters((prev) => ({ ...prev, district: null }));
  }, [district, groupSlugOrDistrict, resolved]);

  const districts = useMemo(() => {
    return Array.from(
      new Set(
        sourceProfiles
          .map((profile) => profile.public_route?.district)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort();
  }, [sourceProfiles]);

  const enriched: EnrichedEducationProfile[] = useMemo(() => {
    return sourceProfiles.map((profile) => ({ profile }));
  }, [sourceProfiles]);

  const filtered = useMemo(() => {
    return filterEnrichedProfiles(enriched, filters);
  }, [enriched, filters]);

  const toggleCompare = (id: string) => {
    setComparing((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const featured = useMemo(() => {
    return sourceProfiles.filter((profile) => profile.public_route).slice(0, 6);
  }, [sourceProfiles]);

  const territoryLabel = useMemo(() => {
    if (resolved?.kind === 'group') return resolved.group.name;
    if (
      resolved?.kind === 'location' &&
      (resolved.location.type === LocationType.NEIGHBORHOOD || resolved.location.type === LocationType.DISTRICT)
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
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Educação em {territoryLabel} - Vitrine V3 | Acheguese</title>
        <meta
          name="description"
          content={`Explore escolas, cursos, professores e instituições educacionais em ${territoryLabel} com filtros avançados, comparador e contato direto.`}
        />
        <link rel="canonical" href={buildPublicAbsoluteUrl(canonicalPath)} />
      </Helmet>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-muted/30 to-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 20%, hsl(var(--primary)) 0%, transparent 40%), radial-gradient(circle at 80% 70%, hsl(var(--primary)) 0%, transparent 40%)',
          }}
        />
        <div className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge
                variant="outline"
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs uppercase tracking-wide text-primary"
              >
                <Sparkles className="h-3 w-3" />
                Vitrine educacional V3
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Encontre a escola, curso ou professor ideal em{' '}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent capitalize">
                  {territoryLabel}
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
                Compare instituições, filtre por modalidade, bairro e preço e fale
                diretamente por WhatsApp ou agende uma visita.
              </p>

              {/* Search command bar */}
              <div className="relative mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
                <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
                <Input
                  value={filters.query}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, query: e.target.value }))
                  }
                  placeholder="Buscar por curso, escola, professor ou serviço..."
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-xl lg:hidden"
                      type="button"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full max-w-md overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Filtrar resultados</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel
                        filters={filters}
                        setFilters={setFilters}
                        niches={niches}
                        districts={districts}
                        nicheIcons={NICHE_ICONS}
                        resultsCount={filtered.length}
                        onClear={clearFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Quick niche chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {niches.slice(0, 6).map((n) => {
                  const Icon = NICHE_ICONS[n.nicheKey] ?? GraduationCap;
                  const active = filters.niches.includes(n.nicheKey);
                  return (
                    <NicheChip
                      key={n.nicheKey}
                      label={n.displayName}
                      icon={Icon}
                      active={active}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          niches: active
                            ? prev.niches.filter((v) => v !== n.nicheKey)
                            : [...prev.niches, n.nicheKey],
                        }))
                      }
                    />
                  );
                })}
              </div>
            </div>

            {/* Right: editorial collage */}
            <div className="relative hidden h-[420px] lg:block">
              <div className="absolute inset-0 grid grid-cols-2 gap-3">
                {featured.map((profile, i) => {
                  const Icon = NICHE_ICONS[profile.niche_key] ?? GraduationCap;
                  const gradient =
                    NICHE_ACCENT[profile.niche_key] ?? 'from-primary to-primary/70';
                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        'relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br p-5 text-white shadow-lg',
                        gradient,
                        i === 0 && 'col-span-2 row-span-1',
                        i === 1 && 'row-span-2',
                        i === 2 && 'row-span-1'
                      )}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <Icon className="h-8 w-8 opacity-90" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider opacity-80">
                            {getNicheByKey(profile.niche_key)?.displayName}
                          </div>
                          <div className="mt-1 line-clamp-2 text-base font-bold">
                            {profile.business_name ?? profile.institution_type}
                          </div>
                          {profile.public_route?.district && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[11px] opacity-80">
                              <MapPin className="h-3 w-3" /> {profile.public_route.district.replace(/-/g, ' ')}
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

      {/* ==========================================================================
          FILTER BAR - sticky, refinada
          Linha 1: pesquisa + filtros pop-over (booking style) + sort + view
          Linha 2: rail de nichos (chips com icones)
          ========================================================================== */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        niches={niches}
        districts={districts}
        nicheIcons={NICHE_ICONS}
        view={view}
        setView={setView}
        resultsCount={filtered.length}
        onClear={clearFilters}
      />

      {/* MAIN LAYOUT */}
      <section className="container mx-auto px-4 py-10">
        <div>
            {/* Toolbar */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <strong className="text-foreground">{filtered.length}</strong>
                <span className="text-muted-foreground">
                  {filtered.length === 1 ? 'instituição' : 'instituições'}
                </span>
              </div>
            </div>

            <ActiveEducationFilterChips
              filters={filters}
              setFilters={setFilters}
              clearFilters={clearFilters}
            />

            {/* States */}
            {isError ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
                <Shield className="h-10 w-10 text-rose-500" />
                <h3 className="mt-4 text-lg font-semibold">
                  não conseguimos carregar a vitrine
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Houve um erro ao consultar as instituições. Tente novamente em alguns
                  segundos.
                </p>
                <Button onClick={() => refetch()} className="mt-4 rounded-full">
                  Tentar novamente
                </Button>
              </div>
            ) : isLoading && !hasRealData ? (
              <div
                className={cn(
                  view === 'grid'
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6'
                    : 'flex flex-col gap-4'
                )}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
                <ScanSearch className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum resultado encontrado</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Tente remover alguns filtros ou buscar com outro termo. Estamos ampliando
                  a base de instituições constantemente.
                </p>
                <Button onClick={clearFilters} className="mt-4 rounded-full" variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  view === 'grid'
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6'
                    : 'flex flex-col gap-4'
                )}
              >
                {filtered.map(({ profile }, i) => (
                  <EditorialCard
                    key={profile.id}
                    profile={profile}
                    index={i}
                    onCompareToggle={toggleCompare}
                    comparing={comparing.includes(profile.id)}
                    view={view}
                    nicheIcons={NICHE_ICONS}
                    nicheAccent={NICHE_ACCENT}
                    schoolNetworkLabels={SCHOOL_NETWORK_LABELS}
                    sanitizeSummary={sanitizePublicEducationText}
                  />
                ))}
              </div>
            )}

            <EducationNicheShowcase
              niches={niches}
              sourceProfiles={sourceProfiles}
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

      <EducationCompareBar
        comparing={comparing}
        sourceProfiles={sourceProfiles}
        toggleCompare={toggleCompare}
        clearCompare={() => setComparing([])}
      />
    </div>
  );
}
export default EducationExplorerPage;

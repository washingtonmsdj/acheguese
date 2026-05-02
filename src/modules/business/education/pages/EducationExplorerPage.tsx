/**
 * EducationExplorerPage
 *
 * Vitrine premium de descoberta educacional.
 * Design editorial/boutique com command-search, filtros multi-faceta,
 * comparador flutuante e cards de alta densidade informacional.
 *
 * Foco: descoberta, comparacao e conversao.
 *
 * Rota: /educacao/:state/:city
 *       /educacao/:state/:city/:district
 *
 * Consome SSOT existente:
 *  - useEducationList (hook)
 *  - getPublicNiches / getNicheByKey (registry)
 *  - preview runtime centralizado em /mocks/educationPreviewRuntime
 *
 * @module education
 * @version 3.0.0
 */

import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Search,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Star,
  Heart,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Users,
  Shield,
  Building2,
  School,
  Baby,
  Languages,
  Calculator,
  Wrench,
  BookOpen,
  Music,
  Dumbbell,
  Phone,
  MessageCircle,
  X,
  Award,
  Lightbulb,
  Info,
  ListFilter,
  ScanSearch,
  Check,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';
import { cn } from '@/shared/utils/cn';
import { useResolveTerritoryFromUrl } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

import { useEducationList } from '../hooks/useEducationList';
import { getPublicNiches, getNicheByKey } from '../niches/registry';
import {
  buildSourceProfiles,
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
  INFRASTRUCTURE_FILTERS,
  INSTITUTION_TYPE_FILTERS,
  labelFromOptions,
  SCHOOL_NETWORK_FILTERS,
} from './explorerFilterControls';
import { EditorialCard, SkeletonCard } from './explorerCards';
import {
  getEducationPreviewDistricts,
  getEducationPreviewProfiles,
  getEducationPreviewRoute,
  isEducationPreviewEnabled,
} from '../mocks/educationPreviewRuntime';
import { educationDetailPreviewMap } from '../mocks/publicEducationPage.mock';
import type { EducationProfile } from '../types';

// ============================================================================
// MAPAS DE PRESENTACAO (UI-only, derivados do registry)
// ============================================================================

const NICHE_ICONS: Record<string, React.ElementType> = {
  regular_school: School,
  daycare: Baby,
  language_school: Languages,
  prep_course: Calculator,
  technical_school: Wrench,
  tutoring_center: BookOpen,
  music_school: Music,
  sports_school: Dumbbell,
};

const NICHE_ACCENT: Record<string, string> = {
  regular_school: 'from-blue-500/90 to-indigo-600/90',
  daycare: 'from-pink-400/90 to-rose-500/90',
  language_school: 'from-emerald-400/90 to-teal-600/90',
  prep_course: 'from-orange-400/90 to-amber-600/90',
  technical_school: 'from-violet-500/90 to-purple-600/90',
  tutoring_center: 'from-cyan-400/90 to-blue-500/90',
  music_school: 'from-fuchsia-400/90 to-pink-600/90',
  sports_school: 'from-lime-400/90 to-green-600/90',
};

const SCHOOL_NETWORK_LABELS: Record<string, string> = {
  municipal: 'Municipal',
  state: 'Estadual',
  federal: 'Federal',
  private: 'Privada',
};

const CARD_HIDDEN_STAT_LABELS = new Set(['ensino', 'fonte']);



function slugToLabel(slug: string): string {
  const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
  return slug
    .split('-')
    .map((word, i) =>
      i === 0 || !LOWERCASE_WORDS.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(' ');
}

// ============================================================================
// COMPONENTES INTERNOS
// ============================================================================

function NicheChip({
  active,
  label,
  icon: Icon,
  onClick,
  count,
}: {
  active?: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'border-border/70 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// PAGINA PRINCIPAL
// ============================================================================

export function EducationExplorerPage() {
  const {
    state = 'ba',
    city = 'salvador',
    district,
    groupSlugOrDistrict,
  } = useParams();
  const niches = useMemo(() => getPublicNiches(), []);
  const { resolved } = useResolveTerritoryFromUrl();

  const { data, isLoading, isError, refetch } = useEducationList({});
  const realProfiles: EducationProfile[] = useMemo(
    () => data?.pages.flatMap((p) => p.profiles ?? []) ?? [],
    [data]
  );
  const hasRealData = realProfiles.length > 0;
  const allowPreviewFallback = isEducationPreviewEnabled();
  
  const sourceProfiles: EducationProfile[] = useMemo(
    () => buildSourceProfiles(realProfiles, getEducationPreviewProfiles(), allowPreviewFallback),
    [realProfiles, allowPreviewFallback],
  );

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [view, setView] = useState<ViewMode>('grid');
  const [comparing, setComparing] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Pre-selecionar bairro pela URL se vier definido
  useEffect(() => {
    if (district) {
      setFilters((prev) => ({ ...prev, district }));
      return;
    }

    if (resolved?.kind === 'location' && resolved.location.type === 'district') {
      const districtSlug = resolved.location.slug ?? groupSlugOrDistrict;
      if (districtSlug) {
        setFilters((prev) => ({ ...prev, district: districtSlug }));
      }
      return;
    }

    // URL de grupo territorial: nao aplicar filtro de bairro fixo
    setFilters((prev) => ({ ...prev, district: null }));
  }, [district, groupSlugOrDistrict, resolved]);

  const districts = useMemo(() => {
    if (!allowPreviewFallback) return [];

    return getEducationPreviewDistricts();
  }, [allowPreviewFallback]);

  const enriched: EnrichedEducationProfile[] = useMemo(() => {
    return sourceProfiles.map((profile) => {
      const route = getEducationPreviewRoute(profile.id);
      const preview = route ? educationDetailPreviewMap[route.slug] : undefined;
      return { profile, preview, route };
    });
  }, [sourceProfiles]);

  const filtered = useMemo(() => {
    return filterEnrichedProfiles(enriched, filters);
  }, [enriched, filters]);

  const toggleCompare = (id: string) => {
    setComparing((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 4 ? [...prev, id] : prev
    );
    if (comparing.length === 0) setDrawerOpen(true);
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const featured = useMemo(() => {
    if (!allowPreviewFallback) return [];

    return Object.values(educationDetailPreviewMap).slice(0, 6);
  }, [allowPreviewFallback]);

  const cityLabel = city.replace(/-/g, ' ');
  const territoryLabel = useMemo(() => {
    if (resolved?.kind === 'group') return resolved.group.name;
    if (resolved?.kind === 'location' && resolved.location.type === 'district') {
      return resolved.location.name;
    }
    if (groupSlugOrDistrict) return slugToLabel(groupSlugOrDistrict);
    return slugToLabel(city);
  }, [city, groupSlugOrDistrict, resolved]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Educacao em {territoryLabel} â€” Vitrine V3 | Acheguese</title>
        <meta
          name="description"
          content={`Explore escolas, cursos, professores e instituicoes educacionais em ${territoryLabel} com filtros avancados, comparador e contato direto.`}
        />
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
                Vitrine Educacional V3
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Encontre a escola, curso ou professor ideal em{' '}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent capitalize">
                  {territoryLabel}
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
                Compare instituicoes, filtre por modalidade, bairro e preco e fale
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
                  placeholder="Buscar por curso, escola, professor ou servico..."
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
                {featured.map((p, i) => {
                  const Icon = NICHE_ICONS[p.profile.niche_key] ?? GraduationCap;
                  const gradient =
                    NICHE_ACCENT[p.profile.niche_key] ?? 'from-primary to-primary/70';
                  return (
                    <motion.div
                      key={p.slug}
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
                            {getNicheByKey(p.profile.niche_key)?.displayName}
                          </div>
                          <div className="mt-1 line-clamp-2 text-base font-bold">
                            {p.institutionName}
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1 text-[11px] opacity-80">
                            <MapPin className="h-3 w-3" /> {p.district}
                          </div>
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
          FILTER BAR â€” sticky, refinada
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
            {/* Toolbar (apenas contador + indicador de fonte inicial) */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <strong className="text-foreground">{filtered.length}</strong>
                <span className="text-muted-foreground">
                  {filtered.length === 1 ? 'instituicao' : 'instituicoes'}
                </span>
              </div>
              {!hasRealData && (
                <Badge variant="outline" className="text-[10px]">
                  <Info className="mr-1 h-3 w-3" />
              Base publica inicial
                </Badge>
              )}
            </div>

            {/* Active filter chips */}
            {(filters.niches.length > 0 ||
              filters.schoolNetworks.length > 0 ||
              filters.institutionTypes.length > 0 ||
              filters.infrastructure.length > 0 ||
              filters.modalities.length > 0 ||
              filters.audiences.length > 0 ||
              filters.district ||
              filters.onlyAvailable) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {filters.niches.map((n) => (
                  <Badge key={n} variant="secondary" className="gap-1">
                    {getNicheByKey(n)?.displayName ?? n}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          niches: prev.niches.filter((v) => v !== n),
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.schoolNetworks.map((network) => (
                  <Badge key={network} variant="secondary" className="gap-1">
                    {labelFromOptions(SCHOOL_NETWORK_FILTERS, network)}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          schoolNetworks: prev.schoolNetworks.filter((v) => v !== network),
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.institutionTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    {labelFromOptions(INSTITUTION_TYPE_FILTERS, type)}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          institutionTypes: prev.institutionTypes.filter((v) => v !== type),
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.infrastructure.map((infra) => (
                  <Badge key={infra} variant="secondary" className="gap-1">
                    {labelFromOptions(INFRASTRUCTURE_FILTERS, infra)}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          infrastructure: prev.infrastructure.filter((v) => v !== infra),
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.modalities.map((m) => (
                  <Badge key={m} variant="secondary" className="gap-1 capitalize">
                    {m}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          modalities: prev.modalities.filter((v) => v !== m),
                        }))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.district && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    {filters.district.replace(/-/g, ' ')}
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, district: null }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.onlyAvailable && (
                  <Badge variant="secondary" className="gap-1">
                    Com vagas
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, onlyAvailable: false }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <button
                  onClick={clearFilters}
                  className="ml-1 text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Limpar tudo
                </button>
              </div>
            )}

            {/* States */}
            {isError ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
                <Shield className="h-10 w-10 text-rose-500" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nao conseguimos carregar a vitrine
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Houve um erro ao consultar as instituicoes. Tente novamente em alguns
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
                  a base de instituicoes constantemente.
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
                {filtered.map(({ profile, preview, route }, i) => (
                  <EditorialCard
                    key={profile.id}
                    profile={profile}
                    preview={preview}
                    route={route}
                    index={i}
                    isPreviewSource={Boolean(preview)}
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

            {/* Niche showcase strip */}
            <div className="mt-12 rounded-3xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Categorias educacionais</h2>
                  <p className="text-sm text-muted-foreground">
                    Navegue por tipo de instituicao e descubra opcoes especializadas.
                  </p>
                </div>
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {niches.map((n) => {
                  const Icon = NICHE_ICONS[n.nicheKey] ?? GraduationCap;
                  const gradient = NICHE_ACCENT[n.nicheKey] ?? 'from-primary to-primary/70';
                  const count = sourceProfiles.filter(
                    (p) => p.niche_key === n.nicheKey
                  ).length;
                  return (
                    <button
                      key={n.nicheKey}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          niches: prev.niches.includes(n.nicheKey)
                            ? prev.niches.filter((v) => v !== n.nicheKey)
                            : [...prev.niches, n.nicheKey],
                        }))
                      }
                      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      <div
                        className={cn(
                          'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                          gradient
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-3 text-sm font-semibold">{n.displayName}</div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {count} {count === 1 ? 'opcao' : 'opcoes'}
                        </span>
                        {n.isBeta && (
                          <Badge variant="outline" className="text-[10px]">
                            Beta
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
      </section>

      {/* ==========================================================================
          FEATURED SECTION â€” Instituicoes em Destaque
          ========================================================================== */}
      <section className="border-t border-border bg-gradient-to-b from-muted/30 via-background to-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="mb-3" variant="secondary">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Instituicoes em Destaque
              </Badge>
              <h2 className="text-3xl font-bold capitalize text-foreground">
                Instituicoes em destaque em {territoryLabel}
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Curadoria com base em dados territoriais e informacoes institucionais publicas.
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden rounded-full sm:flex"
              onClick={clearFilters}
            >
              Ver todas
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
            {featured.map((preview, index) => {
              const FeaturedIcon =
                NICHE_ICONS[preview.profile.niche_key] ?? GraduationCap;
              const featuredGradient =
                NICHE_ACCENT[preview.profile.niche_key] ?? 'from-primary to-primary/70';
              const nicheLabel =
                getNicheByKey(preview.profile.niche_key)?.displayName ??
                preview.profile.niche_key;
              const detailHref = `/educacao/${preview.state}/${preview.city}/${preview.district}/${preview.slug}`;

              return (
                <motion.article
                  key={preview.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                >
                  <div
                    className={cn(
                      'relative h-28 bg-gradient-to-br p-5',
                      featuredGradient
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                        <FeaturedIcon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Destaque
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <Badge variant="secondary" className="text-[11px]">
                      {nicheLabel}
                    </Badge>
                    <h3 className="mt-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                      {preview.institutionName}
                    </h3>
                    {sanitizePublicEducationText(preview.profile.summary) && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {sanitizePublicEducationText(preview.profile.summary)}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {preview.stats
                        .filter((stat) => !CARD_HIDDEN_STAT_LABELS.has(stat.label.toLowerCase()))
                        .slice(0, 4)
                        .map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl bg-muted/60 px-3 py-2 transition-colors group-hover:bg-muted"
                        >
                          <div className="text-base font-bold text-foreground">
                            {stat.value}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-1.5">
                      {preview.highlights.slice(0, 3).map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="line-clamp-1">{h}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <Link to={detailHref}>
                        <Button
                          size="sm"
                          className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          Explorar
                          <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                      <span className="inline-flex items-center gap-1 text-xs capitalize text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {preview.district.replace(/-/g, ' ')}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground md:flex-row md:items-start md:gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Os dados iniciais das escolas publicas sao organizados a partir de bases
              publicas e consultas institucionais. Podem existir divergencias,
              desatualizacoes ou inconsistencias em horarios, contatos, etapas ofertadas e
              demais informacoes. Recomendamos confirmar os dados diretamente com a
              instituicao antes de tomar qualquer decisao.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          CTA SECTION â€” Cadastro de instituicao
          ========================================================================== */}
      <section className="relative overflow-hidden border-t border-border py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl"
          >
            <div className="overflow-hidden rounded-3xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm md:p-12">
              <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <Badge
                    variant="outline"
                    className="mb-4 inline-flex items-center gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs uppercase tracking-wide text-primary"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Para instituicoes
                  </Badge>
                  <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
                    Tem uma instituicao de ensino?
                  </h2>
                  <p className="mt-3 max-w-xl text-balance text-muted-foreground md:text-lg">
                    Cadastre-se no Achegue-se e alcance familias em busca de educacao de
                    qualidade. Capture leads, gerencie visitas e aumente suas matriculas.
                  </p>

                  <ul className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Vitrine territorial com SEO
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Captacao e pipeline de leads
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Eventos e visitas agendadas
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Analytics de conversao
                    </li>
                  </ul>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link to="/empresas/criar-empresa">
                      <Button size="lg" className="w-full rounded-full sm:w-auto">
                        Cadastrar instituicao
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/empresas">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full rounded-full sm:w-auto"
                      >
                        Ver empresas
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="relative hidden h-48 w-48 md:block">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-primary/60 shadow-2xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap className="h-20 w-20 text-white drop-shadow" />
                  </div>
                  <div className="absolute -right-3 -top-3 inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-md">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Premium
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating compare drawer */}
      <AnimatePresence>
        {comparing.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md md:inset-x-auto md:right-6 md:bottom-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2">
                <ScanSearch className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Comparando {comparing.length}/4
                </span>
              </div>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {comparing.map((id) => {
                  const profile = sourceProfiles.find((p) => p.id === id);
                  return profile ? (
                    <Badge key={id} variant="outline" className="gap-1">
                      {profile.institution_type}
                      <button onClick={() => toggleCompare(id)} aria-label="Remover">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setComparing([])}
                  className="rounded-full"
                >
                  Limpar
                </Button>
                <Button size="sm" disabled={comparing.length < 2} className="rounded-full">
                  <Award className="mr-1 h-4 w-4" />
                  Comparar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EducationExplorerPage;

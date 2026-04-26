/**
 * TouristPointsPage — Experiência item-first de pontos turísticos
 *
 * Modo padrão: PONTOS / EXPERIÊNCIAS (foco no lugar)
 * Modo secundário: AO REDOR (estabelecimentos próximos)
 *
 * Seções:
 * 1. Hero imersivo com busca
 * 2. Toggle Pontos / Ao redor
 * 3. Categorias (atalhos visuais)
 * 4. Seções temáticas (Destaques, Gratuitos, Mais Avaliados)
 * 5. Lista principal + filtros + ordenação
 * 6. CTA
 */

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import touristHeroBg from '@/assets/tourist-points-hero-bg.jpg';
import { CanonicalHero } from '@/shared/components/hero/CanonicalHero';
import { useTerritorialContext } from '@/core/routing/components/TerritorialLayout';
import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';
import { useTouristPoints } from '../hooks/useTouristPoints';
import { useGuideUrls, buildTouristPointDetailUrl } from '../hooks/useGuideUrls';
import { TouristPointCardEnhanced } from '../components/TouristPointCardEnhanced';
import { TouristPointCategoryCards } from '../components/TouristPointCategoryCards';
import { TouristPointSectionCarousel } from '../components/TouristPointSectionCarousel';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  Loader2, Search, Star, Camera, ChevronRight,
  LayoutGrid, List, Compass, Store,
  Accessibility, Baby, DollarSign,
  TrendingUp, Heart,
} from 'lucide-react';
import { SORT_OPTIONS, CATEGORY_LABELS, type TouristPointCategory, type TouristPointSortKey } from '../types/categories';
import { toTouristPointDisplay, type TouristPointDisplay } from '../types/presentation';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'pontos' | 'ao-redor';
type DisplayLayout = 'grid' | 'list';

// ============================================================================
// QUICK FILTERS
// ============================================================================

const QUICK_FILTERS = [
  { label: 'Gratuito', key: 'is_free' as const, icon: DollarSign },
  { label: 'Acessível', key: 'is_accessible' as const, icon: Accessibility },
  { label: 'Família', key: 'is_family_friendly' as const, icon: Baby },
] as const;

type QuickFilterKey = (typeof QUICK_FILTERS)[number]['key'];
type QuickFiltersState = Record<QuickFilterKey, boolean>;

const DEFAULT_QUICK_FILTERS: QuickFiltersState = {
  is_free: false,
  is_accessible: false,
  is_family_friendly: false,
};

function toggleQuickFilterState(prev: QuickFiltersState, key: QuickFilterKey): QuickFiltersState {
  switch (key) {
    case 'is_free':
      return { ...prev, is_free: !prev.is_free };
    case 'is_accessible':
      return { ...prev, is_accessible: !prev.is_accessible };
    case 'is_family_friendly':
      return { ...prev, is_family_friendly: !prev.is_family_friendly };
    default:
      return prev;
  }
}

function isQuickFilterEnabled(filters: QuickFiltersState, key: QuickFilterKey): boolean {
  switch (key) {
    case 'is_free':
      return filters.is_free;
    case 'is_accessible':
      return filters.is_accessible;
    case 'is_family_friendly':
      return filters.is_family_friendly;
    default:
      return false;
  }
}

// ============================================================================
// ANIMATIONS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function TouristPointsPage() {
  const { resolved, baseUrl, activeMemberIds } = useTerritorialContext();
  const filter = useTerritoryFilter(resolved, activeMemberIds);
  const { data: realPoints = [], isLoading: realLoading } = useTouristPoints(filter);
  const guideUrls = useGuideUrls(resolved);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('pontos');
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [quickFilters, setQuickFilters] = useState<QuickFiltersState>(DEFAULT_QUICK_FILTERS);
  const [sortBy, setSortBy] = useState<TouristPointSortKey>('relevance');
  const [visibleCount, setVisibleCount] = useState(12);

  const territoryName =
    resolved.kind === 'location'
      ? resolved.location.full_name
      : resolved.group.name;

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredPoints = useMemo(() => {
    let items: TouristPointDisplay[] = realPoints.map(toTouristPointDisplay);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        (p.neighborhood && p.neighborhood.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter) {
      items = items.filter(p => p.category === categoryFilter);
    }

    // Quick filters
    if (quickFilters.is_free) items = items.filter(p => p.is_free);
    if (quickFilters.is_accessible) items = items.filter(p => p.is_accessible);
    if (quickFilters.is_family_friendly) items = items.filter(p => p.is_family_friendly);

    // Sort
    switch (sortBy) {
      case 'rating':
        items.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'name_asc':
        items.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
        break;
      default:
        // relevance: featured first, then rating
        items.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return b.rating - a.rating;
        });
    }

    return items;
  }, [realPoints, searchQuery, categoryFilter, quickFilters, sortBy]);

  // Themed sections
  const featuredPoints = useMemo(() => filteredPoints.filter((point) => point.is_featured), [filteredPoints]);
  const freePoints = useMemo(() => filteredPoints.filter((point) => point.is_free), [filteredPoints]);
  const topRated = useMemo(
    () => [...filteredPoints].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [filteredPoints],
  );

  const displayedPoints = filteredPoints.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredPoints.length;
  const hasActiveFilters = !!searchQuery || !!categoryFilter || Object.values(quickFilters).some(Boolean);

  // Handlers
  const handleCategoryFilter = useCallback((cat: string) => {
    setCategoryFilter(cat || undefined);
    setVisibleCount(12);
  }, []);

  const handleQuickFilter = useCallback((key: QuickFilterKey) => {
    setQuickFilters((prev) => toggleQuickFilterState(prev, key));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setCategoryFilter(undefined);
    setQuickFilters(DEFAULT_QUICK_FILTERS);
    setSortBy('relevance');
    setVisibleCount(12);
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + 12);
  }, []);

  const switchViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setVisibleCount(12);
  }, []);

  const getDetailUrl = useCallback((point: { slug: string; location?: { geographic_path: string } | null }) => 
    buildTouristPointDetailUrl(point.location, point.slug)
  , []);

  // Loading
  if (realLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Carregando pontos turísticos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pontos Turísticos — {territoryName} — O que visitar?</title>
        <meta
          name="description"
          content={`Descubra os melhores pontos turísticos de ${territoryName}. Praias, museus, mirantes, parques e experiências culturais.`}
        />
        <link rel="canonical" href={guideUrls.touristPoints} />
      </Helmet>

      <div className="min-h-screen bg-background">

        {/* ================================================================
            HERO — CanonicalHero
        ================================================================ */}
        <CanonicalHero
          moduleName="Pontos Turísticos"
          moduleIcon={Camera}
          territoryName={territoryName}
          territoryFallback="Sua Região"
          title="O que você quer"
          titleHighlight="visitar hoje?"
          subtitle={`Descubra praias, museus, mirantes e experiências incríveis em ${territoryName}.`}
          backgroundImage={touristHeroBg}
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Praia, museu, mirante, parque...",
          }}
          primaryCTA={{ label: "Buscar", icon: Search, onClick: () => {} }}
          quickFilters={QUICK_FILTERS.map(({ label, key, icon: Icon }) => ({
            label,
            icon: Icon,
            isActive: isQuickFilterEnabled(quickFilters, key),
            onClick: () => handleQuickFilter(key),
          }))}
          stats={[
            { value: `${realPoints.length}`, label: "pontos" },
            { value: `${featuredPoints.length}`, label: "destaques" },
          ]}
        />

        {/* ================================================================
            VIEW MODE TOGGLE — Pontos / Ao redor
        ================================================================ */}
        <section className="container mx-auto px-4 pt-6 pb-2">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-1 w-fit">
            <button
              onClick={() => switchViewMode('pontos')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'pontos'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Compass className="h-4 w-4" />
              Pontos / Experiências
            </button>
            <button
              onClick={() => switchViewMode('ao-redor')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'ao-redor'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Store className="h-4 w-4" />
              Ao redor
            </button>
          </div>
        </section>

        {/* ================================================================
            CATEGORIES
        ================================================================ */}
        {viewMode === 'pontos' && (
          <section className="container mx-auto px-4 py-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Compass className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-display font-bold text-foreground">O que você procura?</h2>
                  <p className="text-xs text-muted-foreground">Filtre por tipo de experiência</p>
                </div>
              </div>
              <TouristPointCategoryCards
                onCategorySelect={handleCategoryFilter}
                activeCategory={categoryFilter}
              />
            </motion.div>
          </section>
        )}

        {/* ================================================================
            THEMED SECTIONS (only in Pontos mode, no active filters)
        ================================================================ */}
        {viewMode === 'pontos' && !hasActiveFilters && (
          <div className="container mx-auto px-4 space-y-10 py-4">
            {featuredPoints.length > 0 && (
              <TouristPointSectionCarousel
                title="⭐ Destaques da Região"
                subtitle={`Os pontos mais visitados de ${territoryName}`}
                icon={Star}
                items={featuredPoints}
                accentColor="bg-warning/10"
                getDetailUrl={getDetailUrl}
              />
            )}

            {freePoints.length > 0 && (
              <TouristPointSectionCarousel
                title="🆓 Gratuitos"
                subtitle="Experiências incríveis sem custo"
                icon={Heart}
                items={freePoints}
                accentColor="bg-emerald-500/10"
                getDetailUrl={getDetailUrl}
              />
            )}

            {topRated.length > 0 && (
              <TouristPointSectionCarousel
                title="🏆 Mais Avaliados"
                subtitle="Os favoritos dos visitantes"
                icon={TrendingUp}
                items={topRated}
                accentColor="bg-primary/10"
                getDetailUrl={getDetailUrl}
              />
            )}
          </div>
        )}

        {/* ================================================================
            MODE: AO REDOR (placeholder)
        ================================================================ */}
        {viewMode === 'ao-redor' && (
          <section className="container mx-auto px-4 py-8">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="text-center py-12 bg-card/50 rounded-2xl border border-border/30">
                <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-semibold">Camada "Ao redor" em ajuste para dados reais</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta seção foi desativada para remover dados mock em produção.
                </p>
                <Button variant="outline" className="mt-4 rounded-full gap-2" onClick={() => switchViewMode('pontos')}>
                  <Compass className="h-4 w-4" />
                  Ver Pontos / Experiências
                </Button>
              </motion.div>
            </motion.div>
          </section>
        )}

        {/* ================================================================
            MAIN LISTING (Pontos mode)
        ================================================================ */}
        {viewMode === 'pontos' && (
          <section className="container mx-auto px-4 py-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={containerVariants}>

              {/* Sort / layout / filter bar */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Camera className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-display font-bold text-foreground">
                      {hasActiveFilters ? 'Resultados' : 'Todos os Pontos'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {filteredPoints.length} {filteredPoints.length === 1 ? 'ponto' : 'pontos'} turístico{filteredPoints.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as TouristPointSortKey)}>
                    <SelectTrigger className="w-[170px] h-9 rounded-lg text-sm">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setDisplayLayout('grid')}
                      className={`p-2 transition-colors ${displayLayout === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDisplayLayout('list')}
                      className={`p-2 transition-colors ${displayLayout === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-9">
                      Limpar
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Active filter badges */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      Busca: "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {categoryFilter && (
                    <Badge variant="secondary" className="gap-1 pr-1 capitalize">
                      {CATEGORY_LABELS[categoryFilter as TouristPointCategory] ?? categoryFilter}
                      <button onClick={() => setCategoryFilter(undefined)} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {Object.entries(quickFilters).filter(([, v]) => v).map(([key]) => (
                    <Badge key={key} variant="secondary" className="gap-1 pr-1">
                      {key === 'is_free' ? 'Gratuito' : key === 'is_accessible' ? 'Acessível' : 'Família'}
                      <button onClick={() => handleQuickFilter(key)} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Cards */}
              {displayedPoints.length === 0 ? (
                <motion.div variants={fadeIn} className="text-center py-16 bg-card/50 rounded-2xl border border-border/30">
                  <div className="p-4 rounded-full bg-muted/50 inline-block mb-4">
                    <Camera className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">
                    Nenhum ponto encontrado
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Tente ajustar os filtros ou buscar por outro termo.
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline" className="rounded-full">
                      Limpar todos os filtros
                    </Button>
                  )}
                </motion.div>
              ) : (
                <>
                  <motion.div
                    variants={containerVariants}
                    className={
                      displayLayout === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                        : 'flex flex-col gap-3'
                    }
                  >
                    {displayedPoints.map(point => (
                      <motion.div key={point.id} variants={itemVariants}>
                        <TouristPointCardEnhanced
                          point={point}
                          detailUrl={getDetailUrl(point)}
                          variant={displayLayout === 'list' ? 'compact' : 'card'}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {canLoadMore && (
                    <div className="flex justify-center mt-8">
                      <Button onClick={handleLoadMore} variant="outline" size="lg" className="rounded-full px-8 gap-2">
                        Carregar mais <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}

            </motion.div>
          </section>
        )}

        {/* ================================================================
            CTA
        ================================================================ */}
        <section className="border-t border-border/50">
          <div className="container mx-auto px-4 py-12">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
              className="bg-gradient-to-br from-primary/10 via-card to-accent/5 rounded-2xl border border-primary/20 p-8 md:p-12 text-center"
            >
              <div className="p-3 rounded-full bg-primary/10 inline-block mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                Conhece um ponto turístico incrível?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Ajude outros visitantes a descobrir os melhores lugares de {territoryName}. Sugira um ponto turístico!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="rounded-full px-8 font-semibold">
                  Sugerir Ponto Turístico
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                  <Link to={baseUrl}>Explorar {territoryName}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

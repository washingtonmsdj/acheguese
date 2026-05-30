import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Sparkles,
  Filter,
  X,
  ChevronDown,
  Plus,
  Home,
  ArrowUpDown,
  Heart,
  Map,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/utils/cn';
import { useFavorites } from '../hooks/useFavorites';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { buildCommunityTerritoryUrl, geoPathToPublicUrl } from '@/core/routing/utils/territoryUrls';
import { useCommunityUrls } from '@/core/routing/hooks/useCommunityUrls';
import { communityEventsRuntimeService } from '@/core/community/services/CommunityEventsRuntimeService';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';
import { useEventTerritoryFilter } from '../hooks/useEventTerritoryFilter';
import {
  EVENT_DATE_FILTER_OPTIONS,
  EVENT_LIST_CATEGORY_OPTIONS,
  EVENT_PRICE_FILTER_OPTIONS,
  EVENT_SORT_OPTIONS,
  EVENT_TYPE_FILTER_OPTIONS,
  EVENTS_ITEMS_PER_PAGE,
} from '../constants';
import { EventsListResults } from './EventsListResults';
import {
  filterAndSortEvents,
  getActiveFiltersCount,
  getEventsListPageDescription,
  getEventsListPageTitle,
  getEventsListStats,
  paginateEvents,
  type SortOption,
  type ViewMode,
} from './EventsListPage.model';


export interface EventsListPageProps {
  /**
   * Contexto territorial opcional para filtrar eventos por localização
   * Quando fornecido, filtra eventos pela cidade/bairro/grupo territorial
   */
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}


export default function EventsListPage({ resolved, activeMemberIds }: EventsListPageProps = {}) {
  const navigate = useNavigate();
  const { count: favoritesCount } = useFavorites();
  const eventUrls = useCommunityUrls(resolved);
  const territoryFilter = useEventTerritoryFilter(resolved, activeMemberIds);
  const { data: eventsData = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['events-list-ssot', territoryFilter],
    queryFn: async () => {
      const rows = await communityEventsRuntimeService.getEvents({
        upcoming: true,
        territoryFilter,
      });
      return rows.map(mapCommunityEventToEvent);
    },
  });


  const [category, setCategory] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [priceFilter, setPriceFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<SortOption>('data-asc');
  const [search, setSearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);


  const filteredAndSortedEvents = useMemo(
    () => filterAndSortEvents(eventsData, { category, dateFilter, typeFilter, priceFilter, search, sortBy }),
    [category, dateFilter, typeFilter, priceFilter, search, sortBy, eventsData],
  );

  const totalPages = Math.ceil(filteredAndSortedEvents.length / EVENTS_ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(
    () => paginateEvents(filteredAndSortedEvents, currentPage, EVENTS_ITEMS_PER_PAGE),
    [filteredAndSortedEvents, currentPage],
  );

  const stats = useMemo(() => getEventsListStats(filteredAndSortedEvents), [filteredAndSortedEvents]);

  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount({ category, dateFilter, typeFilter, priceFilter, search }),
    [category, dateFilter, typeFilter, priceFilter, search],
  );


  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setCurrentPage(1); // Reset to first page
  };

  const handleSearchSubmit = () => {
    setSearch(localSearch);
    setCurrentPage(1); // Reset to first page
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(eventUrls.eventDetail(eventId));
  };

  const handleClearFilters = () => {
    setCategory('todos');
    setDateFilter('todos');
    setTypeFilter('todos');
    setPriceFilter('todos');
    setSearch('');
    setLocalSearch('');
    setSortBy('data-asc');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageTitle = useMemo(() => getEventsListPageTitle(resolved), [resolved]);
  const pageDescription = useMemo(() => getEventsListPageDescription(resolved), [resolved]);

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      {/* Page Container */}
      <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
        {/* ================================================================== */}
        {/* BREADCRUMBS */}
        {/* ================================================================== */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Início</span>
              </Link>
              <span>/</span>
              {resolved ? (
                <>
                  {resolved.kind === 'location' && (
                    <>
                      <Link
                        to={geoPathToPublicUrl(resolved.location.geographic_path)}
                        className="transition-colors hover:text-foreground"
                      >
                        {resolved.location.name}
                      </Link>
                      <span>/</span>
                    </>
                  )}
                  {resolved.kind === 'group' && (
                    <>
                      <Link
                        to={buildCommunityTerritoryUrl(
                          `${geoPathToPublicUrl(resolved.group.members[0].geographic_path)}/${resolved.group.slug}`,
                        )}
                        className="transition-colors hover:text-foreground"
                      >
                        {resolved.group.name}
                      </Link>
                      <span>/</span>
                    </>
                  )}
                </>
              ) : null}
              <span className="font-medium text-foreground">Eventos</span>
              {category !== 'todos' && (
                <>
                  <span>/</span>
                  <span className="font-medium text-primary">
                    {EVENT_LIST_CATEGORY_OPTIONS.find(c => c.id === category)?.name}
                  </span>
                </>
              )}
            </nav>
            
            {/* Favorites Button */}
            {favoritesCount > 0 && (
              <Link
                to={eventUrls.eventFavorites}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Heart className="h-4 w-4 fill-primary text-primary" />
                  <span className="hidden sm:inline">Favoritos</span>
                  <Badge className="ml-0 h-5 min-w-[20px] rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {favoritesCount}
                  </Badge>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* HERO SECTION */}
        {/* ================================================================== */}
        <section className="relative overflow-hidden border-b border-border/50">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80"
              alt="Eventos"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Animated Overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"
              animate={{
                scale: [1.3, 1, 1.3],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </div>

          <div className="relative px-4 pb-8 pt-12 sm:px-6 lg:pb-12 lg:pt-16">
            <div className="mx-auto max-w-7xl">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 text-center sm:mb-8"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md sm:mb-4 sm:px-4 sm:py-2"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                  <span className="text-xs font-semibold text-white sm:text-sm">
                    Eventos da Comunidade
                  </span>
                </motion.div>

                {/* Title */}
                <h1 className="mb-3 text-3xl font-bold leading-tight text-white sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
                  Descubra Eventos
                  <br />
                  <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Incríveis
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto mb-6 max-w-2xl px-4 text-base text-white/80 sm:mb-8 sm:text-lg md:text-xl">
                  {resolved 
                    ? (resolved.kind === 'location' 
                        ? `Cultura, esporte, educação e muito mais acontecendo em ${resolved.location.name}`
                        : `Cultura, esporte, educação e muito mais acontecendo no ${resolved.group.name}`)
                    : 'Cultura, esporte, educação e muito mais acontecendo na sua região'
                  }
                </p>

                {/* Stats */}
                <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:mb-8 sm:gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md sm:rounded-xl sm:px-4 sm:py-2"
                  >
                    <TrendingUp className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                    <div className="text-left">
                      <p className="text-[10px] text-white/60 sm:text-xs">Total</p>
                      <p className="text-base font-bold text-white sm:text-lg">{stats.total}</p>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md sm:rounded-xl sm:px-4 sm:py-2"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-400 sm:h-5 sm:w-5" />
                    <div className="text-left">
                      <p className="text-[10px] text-white/60 sm:text-xs">Próximos</p>
                      <p className="text-base font-bold text-white sm:text-lg">{stats.upcoming}</p>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md sm:rounded-xl sm:px-4 sm:py-2"
                  >
                    <Users className="h-4 w-4 text-blue-400 sm:h-5 sm:w-5" />
                    <div className="text-left">
                      <p className="text-[10px] text-white/60 sm:text-xs">Participantes</p>
                      <p className="text-base font-bold text-white sm:text-lg">{stats.participants}</p>
                    </div>
                  </motion.div>
                </div>

                {/* Search Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="relative mx-auto max-w-2xl"
                >
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder="Buscar eventos..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="h-12 rounded-xl border-2 border-white/20 bg-white/95 pl-10 pr-24 text-sm shadow-2xl backdrop-blur-md transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white dark:bg-black/50 dark:focus:bg-black/70 sm:h-14 sm:rounded-2xl sm:pl-12 sm:pr-32 sm:text-base"
                  />
                  <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-1 sm:right-2 sm:gap-2">
                    {localSearch && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setLocalSearch('');
                          setSearch('');
                        }}
                        className="h-9 w-9 rounded-lg p-0 hover:bg-muted sm:h-10 sm:w-10 sm:rounded-xl"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSearchSubmit}
                      className="h-9 rounded-lg bg-gradient-to-r from-primary to-purple-600 px-4 text-xs font-semibold text-white shadow-lg hover:from-primary/90 hover:to-purple-600/90 sm:h-10 sm:rounded-xl sm:px-6 sm:text-sm"
                    >
                      Buscar
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator - Hidden on mobile */}
          <motion.div
            className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 sm:block"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/30 p-1.5">
              <div className="h-2.5 w-1.5 rounded-full bg-white/60" />
            </div>
          </motion.div>
        </section>

        {/* ================================================================== */}
        {/* FILTERS & VIEW CONTROLS */}
        {/* ================================================================== */}
        <section className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="px-4 py-2.5 sm:px-6 sm:py-3">
            {/* Controls Row */}
            <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "gap-1.5 text-xs transition-all sm:gap-2 sm:text-sm",
                    showFilters && "border-primary bg-primary/5 text-primary",
                  )}
                >
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-0.5 h-4 min-w-[16px] rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground sm:ml-1 sm:h-5 sm:min-w-[20px] sm:px-1.5 sm:text-[10px]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="h-8 w-[140px] gap-1 text-xs sm:h-9 sm:w-[180px] sm:text-sm">
                    <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id} className="text-xs sm:text-sm">
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5 sm:gap-1 sm:p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "rounded-md p-1 transition-all sm:p-1.5",
                    viewMode === 'grid'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="Visualização em grade"
                >
                  <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "rounded-md p-1 transition-all sm:p-1.5",
                    viewMode === 'list'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="Visualização em lista"
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => navigate(eventUrls.eventCalendar)}
                  className="rounded-md p-1 text-muted-foreground transition-all hover:text-foreground sm:p-1.5"
                  aria-label="Visualização em calendário"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => navigate(eventUrls.eventMap)}
                  className="rounded-md p-1 text-muted-foreground transition-all hover:text-foreground sm:p-1.5"
                  aria-label="Visualização em mapa"
                >
                  <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pb-2 sm:space-y-4">
                    {/* Categories */}
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground sm:mb-2 sm:text-xs">
                        Categorias
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {EVENT_LIST_CATEGORY_OPTIONS.map((cat) => {
                          const isActive = category === cat.id;
                          return (
                            <motion.button
                              key={cat.id}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCategoryChange(cat.id)}
                              className={cn(
                                "group relative overflow-hidden rounded-full border px-2.5 py-1 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm",
                                isActive
                                  ? "border-primary bg-gradient-to-r text-primary-foreground shadow-lg"
                                  : "border-border/50 bg-card/50 text-foreground hover:border-primary/30 hover:bg-card",
                                isActive && cat.color,
                              )}
                            >
                              <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                                <span className="text-xs sm:text-sm">{cat.icon}</span>
                                <span>{cat.name}</span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Advanced Filters Row */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                      {/* Date Filter */}
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground sm:text-xs">
                          Data
                        </p>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                          <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EVENT_DATE_FILTER_OPTIONS.map((filter) => (
                              <SelectItem key={filter.id} value={filter.id} className="text-xs sm:text-sm">
                                {filter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Type Filter */}
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground sm:text-xs">
                          Tipo
                        </p>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPE_FILTER_OPTIONS.map((filter) => (
                              <SelectItem key={filter.id} value={filter.id} className="text-xs sm:text-sm">
                                {filter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Filter */}
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground sm:text-xs">
                          Preço
                        </p>
                        <Select value={priceFilter} onValueChange={setPriceFilter}>
                          <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EVENT_PRICE_FILTER_OPTIONS.map((filter) => (
                              <SelectItem key={filter.id} value={filter.id} className="text-xs sm:text-sm">
                                {filter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="gap-1.5 text-[10px] text-muted-foreground hover:text-foreground sm:gap-2 sm:text-xs"
                      >
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Limpar todos os filtros
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <EventsListResults
          activeFiltersCount={activeFiltersCount}
          currentPage={currentPage}
          events={paginatedEvents}
          filteredCount={filteredAndSortedEvents.length}
          isLoading={isEventsLoading}
          onClearFilters={handleClearFilters}
          onEventClick={handleEventClick}
          onPageChange={handlePageChange}
          totalPages={totalPages}
          viewMode={viewMode}
        />

        {/* ================================================================== */}
        {/* FLOATING ACTION BUTTON */}
        {/* ================================================================== */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-4 right-4 z-20 sm:bottom-6 sm:right-6"
        >
          <Button
            size="lg"
            className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-2xl shadow-primary/25 transition-all hover:scale-110 hover:shadow-primary/40 sm:h-14 sm:w-14"
            onClick={() => navigate('/central/eventos/novo')}
            aria-label="Criar novo evento"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </motion.div>
      </div>
    </>
  );
}

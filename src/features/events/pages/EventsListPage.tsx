/**
 * EVENTS LIST PAGE
 */

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
  ChevronLeft,
  ChevronRight,
  Home,
  ArrowUpDown,
  Heart,
  Map,
} from 'lucide-react';
import { EventCard } from '../components/EventCard';
import { EventSkeleton } from '../components/EventSkeleton';
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
import type { EventCategory, EventType } from '../types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';
import { communityEventsRuntimeService } from '@/core/community/services/CommunityEventsRuntimeService';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';
import {
  EVENT_DATE_FILTER_OPTIONS,
  EVENT_LIST_CATEGORY_OPTIONS,
  EVENT_PRICE_FILTER_OPTIONS,
  EVENT_SORT_OPTIONS,
  EVENT_TYPE_FILTER_OPTIONS,
  EVENTS_ITEMS_PER_PAGE,
} from '../constants';

type ViewMode = 'grid' | 'list';
type SortOption = 'data-asc' | 'data-desc' | 'popularidade' | 'preco-asc' | 'preco-desc' | 'alfabetica';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface EventsListPageProps {
  /**
   * Contexto territorial opcional para filtrar eventos por localização
   * Quando fornecido, filtra eventos pela cidade/bairro/grupo territorial
   */
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EventsListPage({ resolved, activeMemberIds }: EventsListPageProps = {}) {
  const navigate = useNavigate();
  const { count: favoritesCount } = useFavorites();
  const ssotTerritoryFilter = useTerritoryFilter(resolved, activeMemberIds);
  const territoryFilter = useMemo(() => {
    if (resolved?.kind === 'location') {
      return { scope: 'location' as const, location_id: resolved.location.id };
    }

    if (resolved?.kind === 'group') {
      const ids = activeMemberIds ?? resolved.group.members.map((member) => member.id);
      if (ids.length > 0) {
        return { scope: 'group' as const, location_ids: ids };
      }
    }

    return ssotTerritoryFilter;
  }, [resolved, activeMemberIds, ssotTerritoryFilter]);
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

  // ========================================================================
  // STATE
  // ========================================================================

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

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...eventsData];

    // Filter by category
    if (category !== 'todos') {
      filtered = filtered.filter(event => event.category === category);
    }

    // Filter by date
    if (dateFilter !== 'todos') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_date);
        
        switch (dateFilter) {
          case 'hoje': {
            return eventDate.toDateString() === today.toDateString();
          }
          case 'semana': {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= today && eventDate <= weekEnd;
          }
          case 'mes':
            return eventDate.getMonth() === today.getMonth() && 
                   eventDate.getFullYear() === today.getFullYear();
          case 'proximo-mes': {
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return eventDate.getMonth() === nextMonth.getMonth() && 
                   eventDate.getFullYear() === nextMonth.getFullYear();
          }
          default:
            return true;
        }
      });
    }

    // Filter by type
    if (typeFilter !== 'todos') {
      filtered = filtered.filter(event => event.location.type === typeFilter);
    }

    // Filter by price
    if (priceFilter !== 'todos') {
      if (priceFilter === 'gratuito') {
        filtered = filtered.filter(event => event.is_free);
      } else if (priceFilter === 'pago') {
        filtered = filtered.filter(event => !event.is_free);
      }
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.neighborhood?.toLowerCase().includes(searchLower) ||
        event.location.city?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'data-asc':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case 'data-desc':
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case 'popularidade':
          return b.participants_count - a.participants_count;
        case 'preco-asc': {
          const priceA = a.is_free ? 0 : Math.min(...a.tickets.map(t => t.price));
          const priceB = b.is_free ? 0 : Math.min(...b.tickets.map(t => t.price));
          return priceA - priceB;
        }
        case 'preco-desc': {
          const priceA = a.is_free ? 0 : Math.max(...a.tickets.map(t => t.price));
          const priceB = b.is_free ? 0 : Math.max(...b.tickets.map(t => t.price));
          return priceB - priceA;
        }
        case 'alfabetica':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [category, dateFilter, typeFilter, priceFilter, search, sortBy, eventsData]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEvents.length / EVENTS_ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_ITEMS_PER_PAGE;
    const endIndex = startIndex + EVENTS_ITEMS_PER_PAGE;
    return filteredAndSortedEvents.slice(startIndex, endIndex);
  }, [filteredAndSortedEvents, currentPage]);

  const stats = useMemo(() => {
    return {
      total: filteredAndSortedEvents.length,
      upcoming: filteredAndSortedEvents.filter(e => e.status === 'publicado').length,
      participants: filteredAndSortedEvents.reduce((acc, e) => acc + e.participants_count, 0),
    };
  }, [filteredAndSortedEvents]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (category !== 'todos') count++;
    if (dateFilter !== 'todos') count++;
    if (typeFilter !== 'todos') count++;
    if (priceFilter !== 'todos') count++;
    if (search) count++;
    return count;
  }, [category, dateFilter, typeFilter, priceFilter, search]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

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
    navigate(`/eventos/${eventId}`);
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

  // ========================================================================
  // RENDER
  // ========================================================================

  // Determine page title based on context
  const pageTitle = useMemo(() => {
    if (!resolved) return 'Eventos Locais | Achegue-se';
    
    if (resolved.kind === 'location') {
      const locationName = resolved.location.name;
      return `Eventos em ${locationName} | Achegue-se`;
    } else {
      const groupName = resolved.group.name;
      return `Eventos - ${groupName} | Achegue-se`;
    }
  }, [resolved]);

  const pageDescription = useMemo(() => {
    if (!resolved) return 'Descubra eventos incríveis na sua comunidade. Cultura, esporte, educação e muito mais!';
    
    if (resolved.kind === 'location') {
      const locationName = resolved.location.name;
      return `Descubra eventos incríveis em ${locationName}. Cultura, esporte, educação e muito mais acontecendo na sua região!`;
    } else {
      const groupName = resolved.group.name;
      return `Eventos do ${groupName}. Cultura, esporte, educação e muito mais acontecendo na comunidade!`;
    }
  }, [resolved]);

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
                        to={`/${resolved.location.geographic_path.split('/').filter(Boolean).join('/')}`}
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
                        to={`/comunidade/${resolved.group.members[0]?.geographic_path.split('/').filter(Boolean).join('/')}/${resolved.group.slug}`}
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
                to="/eventos/favoritos"
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
                  onClick={() => navigate('/eventos/calendario')}
                  className="rounded-md p-1 text-muted-foreground transition-all hover:text-foreground sm:p-1.5"
                  aria-label="Visualização em calendário"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => navigate('/eventos/mapa')}
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

        {/* ================================================================== */}
        {/* EVENTS GRID/LIST */}
        {/* ================================================================== */}
        <section className="flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <main>
            {/* Results Count */}
            {!isEventsLoading && filteredAndSortedEvents.length > 0 && (
              <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                <p>
                  Mostrando <span className="font-semibold text-foreground">{((currentPage - 1) * EVENTS_ITEMS_PER_PAGE) + 1}</span> a{' '}
                  <span className="font-semibold text-foreground">
                    {Math.min(currentPage * EVENTS_ITEMS_PER_PAGE, filteredAndSortedEvents.length)}
                  </span>{' '}
                  de <span className="font-semibold text-foreground">{filteredAndSortedEvents.length}</span> eventos
                </p>
              </div>
            )}

            {isEventsLoading ? (
              <div className={cn(
                "grid gap-3 sm:gap-4 lg:gap-6",
                viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-1"
              )}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <EventSkeleton key={i} variant={viewMode === 'grid' ? 'card' : 'compact'} />
                ))}
              </div>
            ) : paginatedEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center sm:py-16"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted sm:h-20 sm:w-20">
                  <Calendar className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
                  Nenhum evento encontrado
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Tente ajustar os filtros ou buscar por outros termos
                </p>
                {activeFiltersCount > 0 && (
                  <Button onClick={handleClearFilters} variant="outline" size="sm">
                    Limpar filtros
                  </Button>
                )}
              </motion.div>
            ) : (
              <>
                <div className={cn(
                  "grid gap-3 sm:gap-4 lg:gap-6",
                  viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-1"
                )}>
                  {paginatedEvents.map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={viewMode === 'grid' ? 'default' : 'compact'}
                      onClick={handleEventClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1);

                        if (!showPage) {
                          // Show ellipsis
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-muted-foreground">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="h-9 w-9 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="gap-1"
                    >
                      <span className="hidden sm:inline">Próxima</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
            </main>
          </div>
        </section>

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

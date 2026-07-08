/**
 * GastronomyLandingPage
 *
 * Territory-aware gastronomy listing.
 * The active territorial selector and territorial route are the SSOT.
 * Runtime usa somente dados reais (Supabase/SSOT).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Building2, LayoutList, MapPin, Plus, Search, Store, Tag, UtensilsCrossed, Wrench } from 'lucide-react';
import { useModuleTerritoryFilter } from '@/core/location';
import { useAppUrls } from '@/core/routing/hooks';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import { useSessionContext } from '@/core/session';
import { CanonicalHero } from '@/shared/components/hero/CanonicalHero';
import { Button } from '@/shared/components/ui/button';
import { PLATFORM_BRAND } from '@/shared/config/brand';
import { AdSense } from '@/shared/components/advertising';
import { GASTRONOMY_CUISINE_FILTERS } from '../constants';
import {
  GastronomyDeliveryDestinationPanel,
  GastronomyActivityFeed,
  GastronomyHeader,
} from '../components';
import {
  useDeliveryDestination,
  useGastronomyBusinessSort,
  useGastronomyFoodCatalog,
  useGastronomyList,
  type BusinessSortKey,
} from '../hooks';
import {
  useGastronomyFilters,
  usePagination,
  useBusinessSectionItems,
  useFoodSectionItems,
} from './landing/hooks';
import {
  AdvancedFiltersPanel,
  BusinessListSection,
  BusinessSections,
  DeliveryDestinationGate,
  FilterControls,
  FoodCatalogSections,
  ProximityAlert,
} from './landing/components';
import type { DisplayLayout } from './landing/types';
import { INSECURE_CONTEXT_DESTINATION_MESSAGE } from './landing/constants';
const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const COMMUNITY_MODULE_TABS = [
  { key: 'feed', label: 'Feed', icon: LayoutList },
  { key: 'business', label: 'Empresas', icon: Building2 },
  { key: 'services', label: 'Servicos', icon: Wrench },
  { key: 'classifieds', label: 'Classificados', icon: Tag },
  { key: 'gastronomy', label: 'Gastronomia', icon: UtensilsCrossed },
  { key: 'map', label: 'Mapa', icon: MapPin },
] as const;

function CuisineRail({
  activeCuisine,
  onCuisineChange,
}: {
  activeCuisine?: string;
  onCuisineChange: (value: string) => void;
}) {
  return (
    <section className="w-full border-b border-border bg-card/50 py-4">
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="mx-auto flex min-w-max justify-center gap-3 px-4 pb-1">
          {GASTRONOMY_CUISINE_FILTERS.map((cat, i) => {
            const Icon = cat.icon;
            const isActive = activeCuisine === cat.cuisineFilter;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCuisineChange(isActive ? '' : cat.cuisineFilter)}
                className={`group flex min-w-[60px] shrink-0 flex-col items-center gap-1.5 rounded-xl border bg-card/80 p-2.5 backdrop-blur-sm transition-colors duration-200 ${cat.bg} ${isActive ? 'ring-2 ring-primary/40' : ''}`}
              >
                <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>
                  <span className={cat.iconColor}>
                    <Icon />
                  </span>
                </motion.div>
                <span className="whitespace-nowrap text-center text-[10px] font-semibold leading-tight text-foreground">
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NeighborhoodGastronomyHero({
  territoryName,
  restaurantsCount,
  catalogCount,
  moduleUrls,
  onRegister,
}: {
  territoryName: string;
  restaurantsCount: number;
  catalogCount: number;
  moduleUrls: ReturnType<typeof useFriendlyModuleUrls>;
  onRegister: () => void;
}) {
  const moduleLinks = [
    { ...COMMUNITY_MODULE_TABS[4], href: moduleUrls.gastronomy, isActive: true },
    { ...COMMUNITY_MODULE_TABS[0], href: moduleUrls.community, isActive: false },
    { ...COMMUNITY_MODULE_TABS[1], href: moduleUrls.business, isActive: false },
    { ...COMMUNITY_MODULE_TABS[2], href: moduleUrls.services, isActive: false },
    { ...COMMUNITY_MODULE_TABS[3], href: moduleUrls.classifieds, isActive: false },
    { ...COMMUNITY_MODULE_TABS[5], href: moduleUrls.map, isActive: false },
  ] as const;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 md:py-5">
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,20,12,0.98),rgba(7,17,24,0.98))] text-white shadow-xl shadow-black/10">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {moduleLinks.map((item) => {
              const Icon = item.icon;
              return item.isActive ? (
                <span
                  key={item.key}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300/12 px-4 text-xs font-semibold text-amber-100"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.key}
                  to={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-200">
              {territoryName}
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-[2rem]">
              Gastronomia do bairro
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
              Restaurantes, cardápios e sabores perto de você, organizados pelo território da comunidade.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 text-xs font-semibold text-amber-100">
                Descoberta publica
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-teal-300/25 bg-teal-300/10 px-3 text-xs font-semibold text-teal-100">
                Cardapios locais
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:max-w-xl sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-400 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar restaurante
              </button>
              <Link
                to={moduleUrls.map}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/14 bg-white/[0.03] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Ver mapa do bairro
              </Link>
            </div>
          </div>

          <div className="hidden gap-3 rounded-[20px] border border-white/10 bg-black/20 p-4 sm:grid">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Mesa local
              </p>
              <p className="mt-1 text-sm leading-5 text-white/65">
                {restaurantsCount} restaurantes e {catalogCount} itens de cardápio no território.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <p className="text-lg font-semibold text-white">{restaurantsCount}</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Locais</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <p className="text-lg font-semibold text-white">{catalogCount}</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Itens</p>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-3 py-3 text-sm text-white/68">
              A listagem segue o SSOT territorial; destino de entrega passa a ser apoio, nao bloqueio da descoberta publica.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GastronomyLandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const territorialContext = useTerritorialContextOptional();
  const resolved = territorialContext?.resolved ?? null;
  const activeMemberIds = territorialContext?.activeMemberIds;
  const appUrls = useAppUrls(resolved);
  const moduleUrls = useFriendlyModuleUrls();
  const isCommunityScopedSurface = location.pathname.includes('/comunidade/');
  const { user } = useSessionContext();
  const moduleTerritory = useModuleTerritoryFilter({ routeResolved: resolved, activeMemberIds });
  const territoryFilter = moduleTerritory.territoryFilter;
  // Estado local
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>('grid');
  const [sortBy, setSortBy] = useState<BusinessSortKey>('relevance');
  // Delivery destination management
  const deliveryDestinationManager = useDeliveryDestination({
    userId: user?.id,
    resolved,
    autoRequestLocation: true,
  });
  const {
    deliveryDestination,
    showDestinationEditor,
    destinationAddressQuery,
    destinationErrorMessage,
    isResolvingDestinationAddress,
    isLocatingUser,
    locationPermissionState,
    canUseGeolocation,
    distanceReferenceCoords,
    destinationSourceLabel,
    savedResidenceLabel,
    hasSavedResidence,
    setShowDestinationEditor,
    setDestinationAddressQuery,
    handleActivateLocation,
    handleSubmitAddressDestination,
    handleUseSavedResidence,
  } = deliveryDestinationManager;
  // Filters management
  const filtersManager = useGastronomyFilters();
  const {
    filters,
    searchQuery,
    showAdvancedFilters,
    hasActiveFilters,
    hasCuisineFilter,
    activeCuisineLabel,
    setShowAdvancedFilters,
    setSearchQuery,
    handleCuisineFilter,
    handlePriceFilter,
    handleOpenNowFilter,
    clearFilters,
  } = filtersManager;
  // Territory info
  const territoryName =
    resolved?.kind === 'location'
      ? resolved.location.name
      : resolved?.kind === 'group'
        ? resolved.group.name
        : moduleTerritory.displayLabel;
  const hasDeliveryContext = Boolean(deliveryDestination);
  const shouldShowDestinationGate = !isCommunityScopedSurface && !hasDeliveryContext;
  const canShowCatalog = territoryFilter.scope !== 'none';
  const shouldLoadCatalog = canShowCatalog;
  // Active filters for queries
  const activeFilters = useMemo(
    () => ({
      ...filters,
      search: searchQuery || undefined,
      territoryFilter,
    }),
    [filters, searchQuery, territoryFilter],
  );
  // Data fetching
  const {
    data: businessesData,
    isLoading: businessesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGastronomyList(activeFilters, {
    enabled: shouldLoadCatalog,
  });
  const { data: foodCatalog = [] } = useGastronomyFoodCatalog(
    {
      territoryFilter,
      searchQuery: searchQuery || undefined,
      cuisineType: filters.cuisine_type,
      deliveryEnabled: filters.delivery_enabled,
      isOpenNow: filters.is_open_now,
    },
    {
      enabled: shouldLoadCatalog,
    },
  );
  const loadedBusinesses = useMemo(
    () => businessesData?.pages.flatMap((page) => page.businesses) || [],
    [businessesData],
  );
  const effectiveBusinesses = loadedBusinesses;
  const effectiveFoodCatalog = foodCatalog;
  // Sorting and proximity calculation (unified hook)
  const {
    sortedBusinesses,
    businessDistanceMap,
    nearestDistance,
    hasDistanceData,
  } = useGastronomyBusinessSort({
    businesses: effectiveBusinesses,
    sortBy,
    distanceReferenceCoords,
  });
  const nearestDistanceLabel = nearestDistance
    ? `${(nearestDistance / 1000).toFixed(1)} km`
    : null;
  // Pagination
  const paginationManager = usePagination({
    totalItems: sortedBusinesses.length,
    hasNextPage: Boolean(hasNextPage),
    fetchNextPage,
    resetTriggers: [searchQuery],
  });
  const { visibleCount, canLoadMore, handleLoadMore } = paginationManager;
  const displayedBusinesses = sortedBusinesses.slice(0, visibleCount);
  // Section items
  const foodSectionItems = useFoodSectionItems({ foodCatalog: effectiveFoodCatalog });
  const businessSectionItems = useBusinessSectionItems({
    businesses: effectiveBusinesses,
    distanceMap: businessDistanceMap,
  });
  // Cuisine counts
  const cuisineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    effectiveFoodCatalog.forEach((item) => {
      counts[item.business_cuisine] = (counts[item.business_cuisine] || 0) + 1;
    });
    return counts;
  }, [effectiveFoodCatalog]);
  // Computed values
  const sectionScopeLabel = hasCuisineFilter
    ? `na categoria ${activeCuisineLabel}`
    : `em ${territoryName}`;
  const shouldShowFoodSections =
    effectiveFoodCatalog.length > 0 && (!hasActiveFilters || hasCuisineFilter);
  const shouldShowBusinessSections =
    effectiveBusinesses.length > 0 && (!hasActiveFilters || hasCuisineFilter);
  const allStoresSubtitle = hasCuisineFilter
    ? `Exibindo restaurantes da categoria ${activeCuisineLabel}`
    : hasActiveFilters
      ? 'Exibindo restaurantes com filtros ativos'
      : `Catálogo completo de restaurantes em ${territoryName}`;
  const destinationGateMessage = !canUseGeolocation
    ? INSECURE_CONTEXT_DESTINATION_MESSAGE
    : isLocatingUser
      ? 'Validando sua localização para calcular distâncias e tempo de entrega com precisão.'
      : locationPermissionState === 'denied'
        ? 'Localização bloqueada no navegador. Informe um endereço válido para calcular entrega, distância e tempo com mais precisão.'
        : 'Informe um endereço completo ou use sua localização atual para calcular entrega, distância e tempo com mais precisão.';
  const proximityFallbackMessage = distanceReferenceCoords
    ? `Ainda estamos mapeando os restaurantes desta seleção. Em breve você verá os mais próximos do seu endereço.`
    : !canUseGeolocation
      ? INSECURE_CONTEXT_DESTINATION_MESSAGE
      : locationPermissionState === 'denied'
        ? 'Localização bloqueada no navegador. Informe um endereço para calcular proximidade real.'
        : 'Defina um destino de entrega para ordenar por distância real.';
  const isProximitySortActive = sortBy === 'nearest';
  const isLoading = businessesLoading && sortedBusinesses.length === 0;
  // Handlers
  const handleGoToLogin = useCallback(() => {
    navigate(appUrls.auth.login, {
      state: {
        redirectTo: window.location.pathname + window.location.search,
      },
    });
  }, [appUrls.auth.login, navigate]);
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as BusinessSortKey);
  }, []);
  // Auto-switch to nearest when searching
  useEffect(() => {
    if (!searchQuery) {
      return;
    }
    setSortBy((current) => (current === 'relevance' ? 'nearest' : current));
  }, [searchQuery]);
  return (
    <>
      <Helmet>
        <title>Gastronomia em {territoryName} | {PLATFORM_BRAND.name}</title>
        <meta
          name="description"
          content={`Descubra restaurantes e cardápios de gastronomia em ${territoryName}.`}
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        {!isCommunityScopedSurface ? (
          <GastronomyHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : null}
        {isCommunityScopedSurface ? (
          <>
            <NeighborhoodGastronomyHero
              territoryName={territoryName}
              restaurantsCount={sortedBusinesses.length}
              catalogCount={effectiveFoodCatalog.length}
              moduleUrls={moduleUrls}
              onRegister={() => navigate('/empresas/cadastrar')}
            />
            <CuisineRail
              activeCuisine={filters.cuisine_type}
              onCuisineChange={handleCuisineFilter}
            />
          </>
        ) : (
          <>
        <section className="w-full bg-card/50 border-b border-border py-4">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex justify-center gap-3 pb-1 px-4 min-w-max mx-auto">
              {GASTRONOMY_CUISINE_FILTERS.map((cat, i) => {
                const Icon = cat.icon;
                const isActive = filters.cuisine_type === cat.cuisineFilter;
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCuisineFilter(isActive ? '' : cat.cuisineFilter)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 group shrink-0 min-w-[60px] ${cat.bg} ${isActive ? 'ring-2 ring-primary/40' : ''}`}
                  >
                    <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>
                      <span className={cat.iconColor}>
                        <Icon />
                      </span>
                    </motion.div>
                    <span className="text-[10px] font-semibold text-foreground leading-tight text-center whitespace-nowrap">
                      {cat.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        <CanonicalHero
          moduleName="Gastronomia"
          moduleIcon={UtensilsCrossed}
          territoryName={territoryName}
          title="Descubra Sabores"
          titleHighlight="Perto de Você"
          subtitle={`Restaurantes e cardápios em ${territoryName}. Defina um destino para calcular entrega e distância com mais precisão.`}
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: `Buscar em ${territoryName}: pizza, açaí, hambúrguer...`,
          }}
          primaryCTA={{
            label: 'Buscar',
            icon: Search,
            onClick: () => undefined,
          }}
          secondaryCTA={{
            label: 'Definir destino',
            icon: MapPin,
            onClick: () => setShowDestinationEditor(true),
            variant: 'outline',
          }}
          backgroundImage={undefined}
          density="banner"
        />

        <section className="container mx-auto px-4 pt-4">
          <div className="mb-6 w-full rounded-xl">
            <div className="overflow-hidden rounded-xl max-h-[90px] min-h-[50px]">
              <AdSense
                slot="7618818955"
                format="horizontal"
                responsive={true}
              />
            </div>
          </div>
        </section>
          </>
        )}
        {shouldShowDestinationGate && (
          <DeliveryDestinationGate
            message={destinationGateMessage}
            canUseGeolocation={canUseGeolocation}
            isLocatingUser={isLocatingUser}
            locationPermissionState={locationPermissionState}
            onActivateLocation={handleActivateLocation}
          />
        )}
        {canShowCatalog && (
          <>
            {hasDeliveryContext ? (
              <section className="container mx-auto px-4 pt-4">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="mb-4"
                >
                  <GastronomyDeliveryDestinationPanel
                    destinationLabel={deliveryDestination?.label ?? null}
                    destinationSourceLabel={destinationSourceLabel}
                    isEditing={showDestinationEditor}
                    addressQuery={destinationAddressQuery}
                    isResolvingAddress={isResolvingDestinationAddress}
                    isLocatingUser={isLocatingUser}
                    hasSavedAddressOption={hasSavedResidence}
                    savedAddressLabel={savedResidenceLabel}
                    isAuthenticated={Boolean(user)}
                    errorMessage={destinationErrorMessage}
                    onAddressQueryChange={setDestinationAddressQuery}
                    onSubmitAddress={handleSubmitAddressDestination}
                    onUseCurrentLocation={handleActivateLocation}
                    onUseSavedAddress={handleUseSavedResidence}
                    onOpenEditor={() => setShowDestinationEditor(true)}
                    onCloseEditor={() => setShowDestinationEditor(false)}
                    onGoToLogin={handleGoToLogin}
                  />
                </motion.div>
              </section>
            ) : null}
            <GastronomyActivityFeed
              territoryFilter={territoryFilter}
              limit={5}
            />
            {shouldShowBusinessSections && (
              <BusinessSections
                sectionItems={businessSectionItems}
                distanceMap={businessDistanceMap}
                sectionScopeLabel={sectionScopeLabel}
                hasDistanceReference={Boolean(distanceReferenceCoords)}
                canUseGeolocation={canUseGeolocation}
                locationPermissionState={locationPermissionState}
                isLocatingUser={isLocatingUser}
                onActivateLocation={handleActivateLocation}
              />
            )}
            {shouldShowFoodSections && (
              <FoodCatalogSections
                sectionItems={foodSectionItems}
                sectionScopeLabel={sectionScopeLabel}
              />
            )}
            <section className="container mx-auto px-4 py-6">
              <FilterControls
                sortBy={sortBy}
                displayLayout={displayLayout}
                hasActiveFilters={hasActiveFilters}
                isOpenNow={Boolean(filters.is_open_now)}
                onSortChange={handleSortChange}
                onLayoutChange={setDisplayLayout}
                onToggleOpenNow={handleOpenNowFilter}
                onToggleFilters={() => setShowAdvancedFilters((current) => !current)}
                onClearFilters={clearFilters}
              />
              {isProximitySortActive && (
                <div className="mt-3">
                  <ProximityAlert
                    hasDistanceData={hasDistanceData}
                    nearestDistanceLabel={nearestDistanceLabel}
                    fallbackMessage={proximityFallbackMessage}
                    canUseGeolocation={canUseGeolocation}
                    locationPermissionState={locationPermissionState}
                    isLocatingUser={isLocatingUser}
                    hasDistanceReference={Boolean(distanceReferenceCoords)}
                    onActivateLocation={handleActivateLocation}
                  />
                </div>
              )}
              {showAdvancedFilters && (
                <AdvancedFiltersPanel
                  priceRange={filters.price_range}
                  onPriceChange={handlePriceFilter}
                />
              )}
              <BusinessListSection
                businesses={displayedBusinesses}
                displayLayout={displayLayout}
                distanceMap={businessDistanceMap}
                totalCount={sortedBusinesses.length}
                subtitle={allStoresSubtitle}
                isLoading={isLoading}
                canLoadMore={canLoadMore}
                isFetchingMore={isFetchingNextPage}
                hasActiveFilters={hasActiveFilters}
                searchQuery={searchQuery}
                cuisineType={filters.cuisine_type}
                onLoadMore={handleLoadMore}
                onClearFilters={clearFilters}
                onRemoveSearchQuery={() => setSearchQuery('')}
                onRemoveCuisineFilter={() =>
                  filtersManager.setFilters((current) => ({
                    ...current,
                    cuisine_type: undefined,
                  }))
                }
              />
            </section>
            {!isCommunityScopedSurface ? (
            <section className="border-t border-border/50">
              <div className="container mx-auto px-4 py-12">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8 text-center md:p-12"
                >
                  <div className="mb-4 inline-block rounded-full bg-primary/10 p-3">
                    <UtensilsCrossed className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
                    Tem um restaurante?
                  </h2>
                  <p className="mx-auto mb-6 max-w-lg text-muted-foreground">
                    Publique seu cardápio operacional e integre pedido, preparo e entrega ao SSOT
                    do produto.
                  </p>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild size="lg" className="rounded-full px-8 font-semibold">
                      <Link to="/empresas/cadastrar">Cadastrar Restaurante</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                      <Link to="/sobre">Saiba Mais</Link>
                    </Button>
                  </div>
                </motion.div>
              </div>
            </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

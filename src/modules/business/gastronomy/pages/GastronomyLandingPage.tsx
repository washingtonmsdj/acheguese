/**

 * GastronomyLandingPage - REFATORADA

 *

 * Territory-aware gastronomy listing.

 * The active territorial selector and territorial route are the SSOT.

 * Runtime usa somente dados reais (Supabase/SSOT).

 */



import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { Helmet } from 'react-helmet-async';

import { motion } from 'framer-motion';

import { Loader2 } from 'lucide-react';



import gastronomyHeroBg from '@/assets/gastronomy-hero-bg.jpg';

import { useModuleTerritoryFilter } from '@/core/location/hooks/useModuleTerritoryFilter';
import { useAppUrls } from '@/core/routing/hooks';

import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';

import { useSessionContext } from '@/core/session';

import { CanonicalHero } from '@/shared/components/hero/CanonicalHero';

import { HeroBannerCarousel, type HeroBanner } from '@/shared/components/hero/HeroBannerCarousel';

import { Button } from '@/shared/components/ui/button';

import { AdSense } from '@/shared/components/advertising';

import {

  GastronomyCategoryCards,

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



// â”€â”€ Categorias de gastronomia (estilo empresa) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Componente para emoji como ícone

const EmojiIcon = ({ emoji, className }: { emoji: string; className?: string }) => (

  <span className={className} style={{ fontSize: '1.5rem', lineHeight: 1 }}>{emoji}</span>

);



const GASTRO_CATEGORIES = [

  { id: 'lanches',    icon: () => <EmojiIcon emoji="🥪" />, label: 'Lanches',       cuisineFilter: 'lanchonete',   iconColor: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/20' },

  { id: 'pizza',      icon: () => <EmojiIcon emoji="🍕" />, label: 'Pizza',         cuisineFilter: 'pizzaria',     iconColor: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/20' },

  { id: 'brasileira', icon: () => <EmojiIcon emoji="🍛" />, label: 'Brasileira',    cuisineFilter: 'brasileira',   iconColor: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/20' },

  { id: 'arabe',      icon: () => <EmojiIcon emoji="🥙" />, label: 'Árabe',         cuisineFilter: 'arabe',        iconColor: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/20' },

  { id: 'sorveteria', icon: () => <EmojiIcon emoji="🍨" />, label: 'Açaí / Sorvete',cuisineFilter: 'sorveteria',   iconColor: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-500/20' },

  { id: 'saudavel',   icon: () => <EmojiIcon emoji="🥗" />, label: 'Saudável',      cuisineFilter: 'vegetariana',  iconColor: 'text-green-400',   bg: 'bg-green-500/15 border-green-500/20' },

  { id: 'japonesa',   icon: () => <EmojiIcon emoji="🍱" />, label: 'Japonesa',      cuisineFilter: 'japonesa',     iconColor: 'text-pink-400',    bg: 'bg-pink-500/15 border-pink-500/20' },

  { id: 'salgados',   icon: () => <EmojiIcon emoji="🥟" />, label: 'Salgados',      cuisineFilter: 'outros',       iconColor: 'text-lime-400',    bg: 'bg-lime-500/15 border-lime-500/20' },

  { id: 'pastel',     icon: () => <EmojiIcon emoji="🥐" />, label: 'Pastel',        cuisineFilter: 'pastel',       iconColor: 'text-orange-500',  bg: 'bg-orange-600/15 border-orange-600/20' },

  { id: 'padaria',    icon: () => <EmojiIcon emoji="🥖" />, label: 'Padarias',      cuisineFilter: 'padaria',      iconColor: 'text-yellow-600',  bg: 'bg-yellow-600/15 border-yellow-600/20' },

  { id: 'doceria',    icon: () => <EmojiIcon emoji="🍰" />, label: 'Doces & Bolos', cuisineFilter: 'doceria',      iconColor: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15 border-fuchsia-500/20' },

  { id: 'carnes',     icon: () => <EmojiIcon emoji="🥩" />, label: 'Carnes',        cuisineFilter: 'churrascaria', iconColor: 'text-red-500',     bg: 'bg-red-600/15 border-red-600/20' },

  { id: 'marmita',    icon: () => <EmojiIcon emoji="🍲" />, label: 'Marmita',       cuisineFilter: 'regional',     iconColor: 'text-teal-400',    bg: 'bg-teal-500/15 border-teal-500/20' },

  { id: 'bar',        icon: () => <EmojiIcon emoji="🍺" />, label: 'Bares',         cuisineFilter: 'bar',          iconColor: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },

  { id: 'cafeteria',  icon: () => <EmojiIcon emoji="☕" />, label: 'Cafés',         cuisineFilter: 'cafeteria',    iconColor: 'text-yellow-500',  bg: 'bg-yellow-500/15 border-yellow-500/20' },

  { id: 'hamburger',  icon: () => <EmojiIcon emoji="🍔" />, label: 'Hambúrguer',    cuisineFilter: 'hamburguer',   iconColor: 'text-amber-500',   bg: 'bg-amber-600/15 border-amber-600/20' },

];



export default function GastronomyLandingPage() {

  const navigate = useNavigate();

  const territorialContext = useTerritorialContextOptional();

  const resolved = territorialContext?.resolved ?? null;

  const appUrls = useAppUrls(resolved);

  const { user } = useSessionContext();

  const moduleTerritory = useModuleTerritoryFilter({ routeResolved: resolved });

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

  const isDestinationRequired = !hasDeliveryContext;

  const shouldLoadCatalog = hasDeliveryContext && territoryFilter.scope !== 'none';



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

      : `Catalogo completo de restaurantes em ${territoryName}`;



  const destinationGateMessage = !canUseGeolocation

    ? INSECURE_CONTEXT_DESTINATION_MESSAGE

    : isLocatingUser

      ? 'Validando sua localizacao para calcular distancias e tempo de entrega com precisao.'

      : locationPermissionState === 'denied'

        ? 'Localizacao bloqueada no navegador. Informe um endereco valido para liberar a listagem.'

        : 'Informe um endereco completo ou use sua localizacao atual para liberar restaurantes e cardapios.';



  const proximityFallbackMessage = distanceReferenceCoords

    ? `Ainda estamos mapeando os restaurantes desta seleção. Em breve você verá os mais próximos do seu endereço.`

    : !canUseGeolocation

      ? INSECURE_CONTEXT_DESTINATION_MESSAGE

      : locationPermissionState === 'denied'

        ? 'Localizacao bloqueada no navegador. Informe um endereco para calcular proximidade real.'

        : 'Defina um destino de entrega para ordenar por distancia real.';



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



  if (isLoading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-background">

        <div className="space-y-4 text-center">

          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />

          <p className="font-medium text-muted-foreground">Carregando gastronomia...</p>

        </div>

      </div>

    );

  }



  return (

    <>

      <Helmet>

        <title>Gastronomia em {territoryName} | OrdaX</title>

        <meta

          name="description"

          content={`Descubra restaurantes e cardapios de gastronomia em ${territoryName}.`}

        />

      </Helmet>



      <div className="min-h-screen bg-background">

        {/* â”€â”€ Header exclusivo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

        <GastronomyHeader

          searchQuery={searchQuery}

          onSearchChange={setSearchQuery}

        />



        {/* â”€â”€ Cards de Categorias (TOPO) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

        <section className="w-full bg-card/50 border-b border-border py-4">

          <div className="w-full overflow-x-auto scrollbar-hide">

            <div className="flex justify-center gap-3 pb-1 px-4 min-w-max mx-auto">

              {GASTRO_CATEGORIES.map((cat, i) => {

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

                      <Icon className={`h-5 w-5 ${cat.iconColor}`} />

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



        {/* â”€â”€ Hero Carrossel de Banners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

        <HeroBannerCarousel

          banners={[

            {

              id: '1',

              image: gastronomyHeroBg,

              title: 'Promoção Especial!',

              subtitle: 'Desconto de 20% em todos os pedidos acima de R$ 50',

              textPosition: 'center',

              cta: {

                label: 'Ver Ofertas',

                onClick: () => console.log('Ver ofertas'),

              },

            },

            {

              id: '2',

              image: gastronomyHeroBg,

              title: 'Delivery Grátis',

              subtitle: 'Frete grátis para pedidos acima de R$ 30',

              textPosition: 'center',

              cta: {

                label: 'Pedir Agora',

                onClick: () => console.log('Pedir agora'),

              },

            },

            {

              id: '3',

              image: gastronomyHeroBg,

              title: 'Novos Restaurantes',

              subtitle: 'Conheça as novidades da sua região',

              textPosition: 'center',

              cta: {

                label: 'Explorar',

                onClick: () => console.log('Explorar'),

              },

            },

          ]}

          autoPlayInterval={5000}

          showArrows={true}

          showDots={false}

          height="280px"

          heightMd="320px"

          heightLg="380px"

        />



        <section className="container mx-auto px-4 pt-4">

          {/* â”€â”€ Google AdSense â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

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



        {isDestinationRequired && (

          <DeliveryDestinationGate

            message={destinationGateMessage}

            canUseGeolocation={canUseGeolocation}

            isLocatingUser={isLocatingUser}

            locationPermissionState={locationPermissionState}

            onActivateLocation={handleActivateLocation}

          />

        )}



        {hasDeliveryContext && (

          <>

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

            {/* â”€â”€ ATIVIDADE DOS VIZINHOS (SSOT) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

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

                    <EmojiIcon emoji="🍽️" className="h-8 w-8 text-primary" />

                  </div>

                  <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">

                    Tem um restaurante?

                  </h2>

                  <p className="mx-auto mb-6 max-w-lg text-muted-foreground">

                    Publique seu cardapio operacional e integre pedido, preparo e entrega ao SSOT

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

          </>

        )}



      </div>

    </>

  );

}




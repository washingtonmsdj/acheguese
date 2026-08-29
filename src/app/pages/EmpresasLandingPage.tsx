import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { CircleUserRound, MapPin, Search, SlidersHorizontal, UserRoundPlus } from "lucide-react";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useBusinessList } from "@/modules/business/hooks/useBusinessList";
import { useCanonicalBusinessFavorites } from "@/modules/business/hooks/useCanonicalBusinessFavorite";
import { useBusinessUrls } from "@/modules/business/hooks/useBusinessUrls";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { ModuleLocationDialog } from "@/core/location/components/ModuleLocationDialog";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { useSpatialSearchHybrid } from "@/core/geospatial/hooks/useSpatialSearch";
import { useRobustGeolocation } from "@/shared/hooks";
import { Input } from "@/shared/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { normalizeBusinessCategoryId } from "@/shared/taxonomy/businessCategories";
import { EmpresasLandingLayout } from "@/app/features/business-landing/pages/EmpresasLandingLayout";
import {
  CATEGORIES,
  QUICK_FILTERS,
  applyBusinessFilterSet,
  buildBusinessHighlights,
  getBusinessUrl,
  getTerritoryName,
  normalizeRealBusinessEntry,
  sortBusinesses,
} from "@/app/features/business-landing/utils";
import {
  EmpresasCategoriasSection,
  EmpresasFiltrosSection,
  EmpresasHeroSection,
  EmpresasListaSection,
  EmpresasRecomendacoesSection,
} from "@/app/features/business-landing/sections";
import type { Business, BusinessSortOption, HeroStat } from "@/app/features/business-landing/sections/types";
import { CategoryCard } from "@/app/features/business-landing/components/cards";
import { QuickFilterChip } from "@/app/features/business-landing/components/filters/QuickFilterChip";
import { withQueryParams } from "@/app/pages/CidadeLanding.utils";

interface EmpresasLandingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
  presentation?: "standalone" | "embedded";
}

function parseInitialSlugs(resolved: ResolvedTerritory | null | undefined) {
  const geoPath =
    resolved?.kind === "location"
      ? resolved.location.geographic_path
      : resolved?.kind === "group"
        ? resolved.group.members.at(0)?.geographic_path
        : null;

  if (!geoPath) return {};

  const [, stateSlug = null, citySlug = null, districtSlug = null] = geoPath.split("/").filter(Boolean);
  return { stateSlug, citySlug, districtSlug };
}

function LandingTopBar({
  locationLabel,
  searchQuery,
  onSearchChange,
  onOpenLocationDialog,
  onOpenFilters,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  locationLabel: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenLocationDialog: () => void;
  onOpenFilters: () => void;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-4 pt-3 sm:px-6">
      <div className="flex flex-col gap-3 lg:rounded-[26px] lg:border lg:border-white/10 lg:bg-[linear-gradient(180deg,rgba(9,18,24,0.98),rgba(7,14,20,0.98))] lg:px-5 lg:py-4">
        <div className="hidden lg:flex lg:items-center lg:gap-5">
          <Link to="/" className="flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/14 text-teal-300">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[1.55rem] font-semibold leading-none">Achegue-se</span>
              <span className="block pt-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-teal-200/78">
                Seu bairro, mais perto.
              </span>
            </span>
          </Link>

          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onOpenLocationDialog}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/82 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            >
              <MapPin className="h-4 w-4 text-teal-300" />
              {locationLabel}
            </button>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/38" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar empresa, servico ou produto no bairro"
                aria-label="Buscar empresas no bairro"
                className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-11 pr-16 text-white placeholder:text-white/36 focus-visible:ring-teal-400/30 focus-visible:ring-offset-0"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[0.68rem] font-medium text-white/42 sm:inline-flex">
                Ctrl + K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={secondaryHref}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            >
              {secondaryLabel}
            </Link>
            <Link
              to={primaryHref}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>

        <div className="space-y-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-2 text-white">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/14 text-teal-300">
                <MapPin className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[1.3rem] font-semibold leading-none">Achegue-se</span>
                <span className="block pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-teal-200/72">
                  Seu bairro, mais perto.
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to={secondaryHref}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/74 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                aria-label={secondaryLabel}
              >
                <CircleUserRound className="h-4.5 w-4.5" />
              </Link>
              <Link
                to={primaryHref}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-slate-950 transition-colors hover:bg-teal-400"
                aria-label={primaryLabel}
              >
                <UserRoundPlus className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenLocationDialog}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/82 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
          >
            <MapPin className="h-4 w-4 text-teal-300" />
            {locationLabel}
          </button>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/38" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar empresa no bairro"
                aria-label="Buscar empresas no bairro"
                className="h-11 rounded-2xl border-white/10 bg-white/[0.03] pl-11 pr-4 text-white placeholder:text-white/36 focus-visible:ring-teal-400/30 focus-visible:ring-offset-0"
              />
            </div>
            <button
              type="button"
              onClick={onOpenFilters}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              aria-label="Abrir filtros e ordenacao"
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EmpresasLandingPage({
  resolved: resolvedProp,
  activeMemberIds: activeMemberIdsProp,
  presentation = "standalone",
}: EmpresasLandingPageProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const territorialContext = useTerritorialContextOptional();

  const resolved = territorialContext?.resolved ?? resolvedProp;
  const activeMemberIds = territorialContext?.activeMemberIds ?? activeMemberIdsProp;
  const appUrls = useAppUrls(resolved);
  const moduleUrls = useFriendlyModuleUrls();
  const businessUrls = useBusinessUrls(resolved);
  const moduleTerritory = useModuleTerritoryFilter({
    routeResolved: resolved,
    activeMemberIds,
  });
  const territoryName = useMemo(
    () => (resolved ? getTerritoryName(resolved) : moduleTerritory.displayLabel),
    [moduleTerritory.displayLabel, resolved],
  );
  const initialSlugs = useMemo(() => parseInitialSlugs(resolved), [resolved]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<BusinessSortOption>("relevance");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { coords: userLocation } = useRobustGeolocation({ useCache: true });
  const { polygons: territoryPolygons, isLoading: isLoadingBounds } = useTerritoryPolygon(resolved ?? null);

  // A proximidade usa o mesmo filtro territorial da lista. O RPC espacial
  // devolve apenas identidade, coordenadas e distância; os cards continuam
  // vindo do BusinessService para não fabricarmos categoria, horário ou nome.
  const { data: nearbyBusinesses } = useSpatialSearchHybrid({
    center: userLocation ?? { latitude: 0, longitude: 0 },
    entityType: "business",
    radiusKm: 5,
    locationIds: moduleTerritory.resolvedLocationIds,
    limit: 50,
    enabled: userLocation !== null && moduleTerritory.resolvedLocationIds.length > 0,
  });

  const {
    businesses: realBusinesses,
    isLoading: isBusinessesLoading,
    isError: isBusinessesError,
  } = useBusinessList({
    searchQuery: searchQuery.trim() || undefined,
    category: activeCategory === "all" ? undefined : normalizeBusinessCategoryId(activeCategory),
    enabled: true,
    routeResolved: resolved,
    activeMemberIds,
    territoryFilter: moduleTerritory.territoryFilter,
  });

  const businessesToShow = useMemo(() => {
    const normalizedBusinesses = realBusinesses.map(normalizeRealBusinessEntry);

    if (sortBy === "distance" && nearbyBusinesses?.length) {
      const distanceByBusinessId = new Map(
        nearbyBusinesses.map((result) => [result.id, result.distance_meters]),
      );

      return normalizedBusinesses.map((business) => ({
        ...business,
        distanceMeters:
          distanceByBusinessId.get(business.id) ??
          (business.business_data_id
            ? distanceByBusinessId.get(business.business_data_id)
            : undefined),
      }));
    }

    return normalizedBusinesses;
  }, [nearbyBusinesses, realBusinesses, sortBy]);

  const favoriteCandidateIds = useMemo(
    () =>
      businessesToShow
        .map((business) => business.business_data_id)
        .filter((id): id is string => Boolean(id))
        .slice(0, 100),
    [businessesToShow],
  );
  const { favorites, toggleFavorite } =
    useCanonicalBusinessFavorites(favoriteCandidateIds);
  const savedBusinesses = useMemo(() => new Set(favorites), [favorites]);

  const categoryCards = useMemo(() => {
    const counts = new Map<string, number>();
    businessesToShow.forEach((business) => {
      const category = normalizeBusinessCategoryId(business.category);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    return CATEGORIES.map((category) => ({
      ...category,
      count: String(counts.get(normalizeBusinessCategoryId(category.slug)) ?? 0),
    }));
  }, [businessesToShow]);

  const filteredBusinesses = useMemo(() => {
    let result = businessesToShow;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((business) =>
        [business.name, business.category, business.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      );
    }

    if (activeCategory !== "all") {
      result = result.filter(
        (business) => normalizeBusinessCategoryId(business.category) === normalizeBusinessCategoryId(activeCategory),
      );
    }

    result = applyBusinessFilterSet(result, activeFilters);
    return sortBusinesses(result, sortBy);
  }, [activeCategory, activeFilters, businessesToShow, searchQuery, sortBy]);

  const highlights = useMemo(
    () => buildBusinessHighlights(filteredBusinesses),
    [filteredBusinesses],
  );

  const heroStats = useMemo<HeroStat[]>(() => {
    const verifiedCount = businessesToShow.filter((business) => business.is_verified).length;
    const recommendedCount = businessesToShow.reduce((sum, business) => sum + business.neighborRecs, 0);
    return [
      { label: "negocios", value: String(businessesToShow.length) },
      { label: "verificados", value: String(verifiedCount) },
      { label: "recomendacoes", value: String(recommendedCount) },
    ];
  }, [businessesToShow]);

  const buildBusinessUrl = useCallback(
    (business: Business) =>
      getBusinessUrl(business, businessUrls.list, businessUrls.canonical),
    [businessUrls],
  );

  const openBusiness = useCallback(
    (business: Business) => {
      navigate(buildBusinessUrl(business));
    },
    [buildBusinessUrl, navigate],
  );

  const handleToggleFilter = useCallback((filterId: string) => {
    setActiveFilters((current) =>
      current.includes(filterId)
        ? current.filter((item) => item !== filterId)
        : [...current, filterId],
    );
  }, []);

  const handleToggleSave = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.stopPropagation();
      void toggleFavorite(id);
    },
    [toggleFavorite],
  );

  const createBusinessHref = useMemo(
    () => (user ? businessUrls.create : withQueryParams(appUrls.auth.login, { redirect: businessUrls.create })),
    [appUrls.auth.login, businessUrls.create, user],
  );
  const recommendationHref = "/recomendacoes/nova";
  const topPrimaryHref = user ? businessUrls.create : appUrls.auth.register;
  const topPrimaryLabel = user ? "Cadastrar empresa" : "Criar conta";
  const topSecondaryHref = user ? appUrls.profile.businesses : appUrls.auth.login;
  const topSecondaryLabel = user ? "Central" : "Entrar";
  const topLocationLabel = useMemo(() => {
    if (resolved) {
      return territoryName;
    }

    return `${territoryName}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;
  }, [resolved, territoryName]);

  return (
    <EmpresasLandingLayout embedded={presentation === "embedded"}>
      {!resolved ? (
        <Helmet>
          <title>Empresas locais | Achegue-se</title>
          <meta
            name="description"
            content="Descubra empresas, lojas e negocios locais no Achegue-se. Encontre comercios perto de voce, recomendacoes da comunidade e uma vitrine organizada por territorio."
          />
        </Helmet>
      ) : null}

      {presentation !== "embedded" ? (
      <LandingTopBar
        locationLabel={topLocationLabel}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenLocationDialog={() => setLocationDialogOpen(true)}
        onOpenFilters={() => setMobileFiltersOpen(true)}
        primaryHref={topPrimaryHref}
        primaryLabel={topPrimaryLabel}
        secondaryHref={topSecondaryHref}
        secondaryLabel={topSecondaryLabel}
      />
      ) : null}

      {presentation !== "embedded" ? (
      <EmpresasHeroSection
        territoryName={territoryName}
        businesses={filteredBusinesses.length > 0 ? filteredBusinesses : businessesToShow}
        territoryPolygons={territoryPolygons}
        resolved={resolved}
        isLoadingBounds={isLoadingBounds}
        stats={heroStats}
        primaryHref={createBusinessHref}
        primaryLabel="Cadastrar empresa"
        secondaryHref={recommendationHref}
        secondaryLabel="Indicar negocio"
        mapHref={moduleUrls.map}
        onOpenLocationDialog={() => setLocationDialogOpen(true)}
        onOpenBusiness={openBusiness}
      />
      ) : null}

      <EmpresasCategoriasSection
        categories={categoryCards}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <EmpresasFiltrosSection
        filters={QUICK_FILTERS}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        resultCount={filteredBusinesses.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <EmpresasRecomendacoesSection
        highlights={highlights}
        savedBusinesses={savedBusinesses}
        onToggleSave={handleToggleSave}
        onOpenBusiness={openBusiness}
      />

      <EmpresasListaSection
        businesses={filteredBusinesses}
        isLoading={isBusinessesLoading}
        isError={isBusinessesError}
        mapHref={moduleUrls.map}
        savedBusinesses={savedBusinesses}
        onToggleSave={handleToggleSave}
        onOpenBusiness={openBusiness}
      />

      <ModuleLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        moduleBasePath="/empresas"
        initialSlugs={initialSlugs}
        onApplyPath={(path) => navigate(path)}
      />

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[82vh] overflow-y-auto rounded-t-[28px] border-white/10 bg-[#081118] px-4 pb-8 pt-5 text-white"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-left text-xl text-white">Filtros do bairro</SheetTitle>
            <SheetDescription className="text-left text-white/52">
              Ajuste categorias, filtros rapidos e ordenacao da vitrine.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
              Categorias
            </p>
            <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-3">
                <CategoryCard
                  category={{
                    icon: CATEGORIES[0]?.icon ?? Search,
                    label: "Tudo",
                    count: String(businessesToShow.length),
                    iconColor: "text-white/70",
                    bg: "bg-black/20",
                    slug: "all",
                  }}
                  isActive={activeCategory === "all"}
                  onClick={() => setActiveCategory("all")}
                />
                {categoryCards.map((category) => (
                  <CategoryCard
                    key={`sheet-${category.slug}`}
                    category={category}
                    isActive={activeCategory === category.slug}
                    onClick={() => setActiveCategory(category.slug)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
              Filtros rapidos
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => (
                <QuickFilterChip
                  key={`sheet-${filter.id}`}
                  filter={filter}
                  isActive={activeFilters.includes(filter.id)}
                  onClick={() => handleToggleFilter(filter.id)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
              Ordenacao
            </p>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  ["relevance", "Mais uteis no bairro"],
                  ["recommendations", "Mais recomendadas"],
                  ["rating", "Melhor avaliadas"],
                  ["distance", "Mais proximas"],
                  ["recent", "Mais recentes"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSortBy(value)}
                  className={[
                    "flex min-h-12 items-center justify-between rounded-2xl border px-4 text-sm font-medium transition-colors",
                    sortBy === value
                      ? "border-teal-400/35 bg-teal-400/12 text-teal-100"
                      : "border-white/10 bg-white/[0.03] text-white/74 hover:border-white/20 hover:bg-white/[0.05]",
                  ].join(" ")}
                  aria-pressed={sortBy === value}
                >
                  <span>{label}</span>
                  <span className={sortBy === value ? "text-teal-200" : "text-white/28"}>•</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400"
          >
            Ver {filteredBusinesses.length} resultados
          </button>
        </SheetContent>
      </Sheet>
    </EmpresasLandingLayout>
  );
}

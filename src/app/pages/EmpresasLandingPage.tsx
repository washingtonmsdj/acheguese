import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
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
import { withQueryParams } from "@/core/landing/utils/landingPresentation";

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
    <header className="border-b border-territory-border bg-territory-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-territory-brand" aria-label="Achegue-se — início">
            achegue-se<span className="text-territory-sun">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to={secondaryHref} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-territory-ink hover:bg-territory-raised">{secondaryLabel}</Link>
            <Link to={primaryHref} className="inline-flex min-h-11 items-center rounded-xl border border-territory-border px-3 text-sm font-semibold text-territory-brand hover:bg-territory-raised">{primaryLabel}</Link>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-sm text-territory-muted">Início / Empresas</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-territory-ink sm:text-4xl">
            Explore as empresas locais
          </h1>
          <p className="mt-2 text-base text-territory-muted">
            Conheça quem faz parte do comércio local.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onOpenLocationDialog} className="inline-flex min-h-11 items-center gap-2 text-sm text-territory-muted">
            <MapPin className="h-4 w-4 shrink-0" />{locationLabel}
          </button>
          <div className="relative min-w-0 basis-full sm:ml-auto sm:flex-1 sm:basis-auto sm:max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-territory-muted" />
            <Input type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Busque por nome ou categoria" aria-label="Buscar empresas"
              className="h-12 rounded-xl border-territory-border bg-territory-surface pl-11 pr-14 text-base text-territory-ink placeholder:text-territory-muted focus-visible:ring-territory-focus" />
            <button type="button" onClick={onOpenFilters} aria-label="Abrir filtros e ordenação"
              className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-territory-brand hover:bg-territory-raised">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
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

  const { polygons: territoryPolygons, isLoading: isLoadingBounds } = useTerritoryPolygon(resolved ?? null);

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

  const businessesToShow = useMemo(
    () => realBusinesses.map(normalizeRealBusinessEntry),
    [realBusinesses],
  );

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
      { label: "negócios", value: String(businessesToShow.length) },
      { label: "verificados", value: String(verifiedCount) },
      { label: "recomendações", value: String(recommendedCount) },
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
  const nearbyHref = moduleUrls.nearby;
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
            content="Descubra empresas, lojas e negocios locais no Achegue-se. Encontre comercios por territorio, consulte informacoes uteis e explore Busca, Mapa e Perto de mim."
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
          businesses={filteredBusinesses}
          territoryPolygons={territoryPolygons}
          resolved={resolved}
          isLoadingBounds={isLoadingBounds}
          stats={heroStats}
          primaryHref={createBusinessHref}
          primaryLabel="Cadastrar empresa"
          secondaryHref={nearbyHref}
          secondaryLabel="Perto de mim"
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
          className="max-h-[82vh] overflow-y-auto rounded-t-[28px] border-territory-border bg-territory-surface px-4 pb-8 pt-5 text-territory-ink"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-left text-xl text-territory-ink">Filtros do bairro</SheetTitle>
            <SheetDescription className="text-left text-territory-muted">
              Ajuste categorias, filtros rápidos e ordenação da vitrine.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-territory-muted">
              Categorias
            </p>
            <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-3">
                <CategoryCard
                  category={{
                    icon: CATEGORIES[0]?.icon ?? Search,
                    label: "Tudo",
                    count: String(businessesToShow.length),
                    iconColor: "text-territory-muted",
                    bg: "bg-territory-raised",
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-territory-muted">
              Filtros rápidos
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-territory-muted">
              Ordenação
            </p>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  ["relevance", "Mais úteis no bairro"],
                  ["recommendations", "Mais recomendadas"],
                  ["rating", "Melhor avaliadas"],
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
                      ? "border-territory-brand/25 bg-territory-brand/10 text-territory-brand"
                      : "border-territory-border bg-territory-raised text-territory-muted hover:border-territory-border hover:bg-territory-raised",
                  ].join(" ")}
                  aria-pressed={sortBy === value}
                >
                  <span>{label}</span>
                  <span className={sortBy === value ? "text-territory-brand" : "text-territory-muted"}>•</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-territory-sun px-4 text-sm font-semibold text-territory-ink transition-colors hover:bg-territory-sun"
          >
            Ver {filteredBusinesses.length} resultados
          </button>
        </SheetContent>
      </Sheet>
    </EmpresasLandingLayout>
  );
}

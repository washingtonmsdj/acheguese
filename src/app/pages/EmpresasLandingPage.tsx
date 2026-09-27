import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Store,
  UserRound,
} from "lucide-react";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useBusinessList } from "@/modules/business/hooks/useBusinessList";
import { useCanonicalBusinessFavorites } from "@/modules/business/hooks/useCanonicalBusinessFavorite";
import { useBusinessUrls } from "@/modules/business/hooks/useBusinessUrls";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
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
  getBusinessUrl,
  getTerritoryName,
  normalizeRealBusinessEntry,
  sortBusinesses,
} from "@/app/features/business-landing/utils";
import { EmpresasListaSection } from "@/app/features/business-landing/sections";
import type { Business, BusinessSortOption } from "@/app/features/business-landing/sections/types";
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

const SORT_OPTIONS: ReadonlyArray<{ value: BusinessSortOption; label: string }> = [
  { value: "relevance", label: "Mais úteis" },
  { value: "recommendations", label: "Mais recomendadas" },
  { value: "rating", label: "Melhor avaliadas" },
  { value: "recent", label: "Mais recentes" },
];

function BusinessHeader({
  territoryName,
  locationLabel,
  searchQuery,
  onSearchChange,
  onOpenLocationDialog,
  mapHref,
  messagesHref,
  accountHref,
  accountLabel,
}: {
  territoryName: string;
  locationLabel: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenLocationDialog: () => void;
  mapHref: string;
  messagesHref: string;
  accountHref: string;
  accountLabel: string;
}) {
  return (
    <>
      <header className="border-b border-territory-border bg-territory-surface">
        <div className="mx-auto flex min-h-16 w-full max-w-[var(--public-content-max)] items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-territory-brand" aria-label="Achegue-se — início">
            achegue-se<span className="text-territory-sun">.</span>
          </Link>

          <button
            type="button"
            onClick={onOpenLocationDialog}
            className="hidden min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 text-left transition-colors hover:bg-territory-raised md:inline-flex"
          >
            <MapPin className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block max-w-72 truncate text-sm font-semibold text-territory-ink">{territoryName}</span>
              <span className="block text-xs text-territory-muted">{locationLabel}</span>
            </span>
          </button>

          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Ações da conta">
            <Link
              to={messagesHref}
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-territory-ink transition-colors hover:bg-territory-raised sm:inline-flex"
            >
              <MessageSquare className="h-5 w-5" aria-hidden="true" /> Mensagens
            </Link>
            <Link
              to={accountHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-territory-ink transition-colors hover:bg-territory-raised"
            >
              <UserRound className="hidden h-5 w-5 sm:block" aria-hidden="true" />
              <span>{accountLabel}</span>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-7">
        <button
          type="button"
          onClick={onOpenLocationDialog}
          className="mb-4 inline-flex min-h-10 w-full items-center gap-2 rounded-xl text-left md:hidden"
        >
          <MapPin className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-territory-ink">{territoryName}</span>
            <span className="block text-xs text-territory-muted">{locationLabel}</span>
          </span>
        </button>

        <p className="hidden text-xs text-territory-muted sm:block">Início / Empresas</p>
        <h1 className="font-heading text-3xl font-bold leading-tight tracking-[var(--public-title-tracking)] text-territory-ink sm:mt-1 sm:text-4xl">
          Explore as empresas do Complexo
        </h1>
        <p className="mt-1 text-sm text-territory-muted sm:text-base">
          Conheça quem faz parte do comércio local.
        </p>

        <form className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_10.5rem]" onSubmit={(event) => event.preventDefault()}>
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Busque por nome ou categoria"
              aria-label="Buscar empresas"
              className="h-12 rounded-xl border-territory-border bg-territory-surface pl-11 text-base text-territory-ink placeholder:text-territory-muted focus-visible:ring-territory-focus"
            />
          </div>
          <button type="submit" className="hidden min-h-12 items-center justify-center rounded-xl bg-territory-brand px-5 text-sm font-semibold text-territory-on-image hover:bg-territory-brand-strong sm:inline-flex">
            Buscar
          </button>
          <Link to={mapHref} className="hidden min-h-12 items-center justify-center gap-2 rounded-xl border border-territory-brand px-5 text-sm font-semibold text-territory-brand hover:bg-territory-raised sm:inline-flex">
            <MapIcon className="h-5 w-5" aria-hidden="true" /> Ver no mapa
          </Link>
        </form>
      </section>
    </>
  );
}

function DesktopFilterSidebar({
  territoryName,
  filters,
  activeFilters,
  onToggleFilter,
  sortBy,
  onSortChange,
  onOpenLocationDialog,
  createBusinessHref,
}: {
  territoryName: string;
  filters: typeof QUICK_FILTERS;
  activeFilters: string[];
  onToggleFilter: (id: string) => void;
  sortBy: BusinessSortOption;
  onSortChange: (value: BusinessSortOption) => void;
  onOpenLocationDialog: () => void;
  createBusinessHref: string;
}) {
  return (
    <aside className="hidden self-start rounded-xl bg-territory-raised p-4 lg:block" aria-label="Refinar busca">
      <h2 className="text-base font-bold text-territory-ink">Refinar busca</h2>

      <div className="mt-4 border-b border-territory-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-territory-muted">Território</p>
        <button type="button" onClick={onOpenLocationDialog} className="mt-2 flex min-h-10 w-full items-center gap-2 rounded-lg text-left text-sm font-medium text-territory-ink hover:text-territory-brand">
          <MapPin className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          <span className="line-clamp-2">{territoryName}</span>
        </button>
      </div>

      <div className="border-b border-territory-border py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-territory-muted">Filtros</p>
        <div className="mt-3 flex flex-col gap-1">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const active = activeFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onToggleFilter(filter.id)}
                className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-left text-sm text-territory-ink transition-colors hover:bg-territory-surface"
                aria-pressed={active}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded border ${active ? "border-territory-brand bg-territory-brand text-territory-on-image" : "border-territory-border bg-territory-surface text-transparent"}`}>
                  {active ? <span aria-hidden="true">✓</span> : null}
                </span>
                <Icon className="h-4 w-4 text-territory-brand" aria-hidden="true" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-territory-muted" htmlFor="business-sort">
        Ordenar
      </label>
      <select
        id="business-sort"
        value={sortBy}
        onChange={(event) => onSortChange(event.target.value as BusinessSortOption)}
        className="mt-2 h-11 w-full rounded-lg border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink outline-none focus-visible:ring-2 focus-visible:ring-territory-focus"
      >
        {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <Link to={createBusinessHref} className="mt-4 inline-flex text-sm font-semibold text-territory-brand hover:underline">
        Cadastrar uma empresa
      </Link>
    </aside>
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
  const moduleTerritory = useModuleTerritoryFilter({ routeResolved: resolved, activeMemberIds });
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

  const { businesses: realBusinesses, isLoading: isBusinessesLoading, isError: isBusinessesError } = useBusinessList({
    searchQuery: searchQuery.trim() || undefined,
    category: activeCategory === "all" ? undefined : normalizeBusinessCategoryId(activeCategory),
    enabled: true,
    routeResolved: resolved,
    activeMemberIds,
    territoryFilter: moduleTerritory.territoryFilter,
  });

  const businessesToShow = useMemo(() => realBusinesses.map(normalizeRealBusinessEntry), [realBusinesses]);
  const favoriteCandidateIds = useMemo(
    () => businessesToShow.map((business) => business.business_data_id).filter((id): id is string => Boolean(id)).slice(0, 100),
    [businessesToShow],
  );
  const { favorites, toggleFavorite } = useCanonicalBusinessFavorites(favoriteCandidateIds);
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
    return sortBusinesses(applyBusinessFilterSet(result, activeFilters), sortBy);
  }, [activeCategory, activeFilters, businessesToShow, searchQuery, sortBy]);

  const buildBusinessUrl = useCallback(
    (business: Business) => getBusinessUrl(business, businessUrls.list, businessUrls.canonical),
    [businessUrls],
  );
  const openBusiness = useCallback((business: Business) => navigate(buildBusinessUrl(business)), [buildBusinessUrl, navigate]);
  const handleToggleFilter = useCallback((filterId: string) => {
    setActiveFilters((current) => current.includes(filterId) ? current.filter((item) => item !== filterId) : [...current, filterId]);
  }, []);
  const handleToggleSave = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    void toggleFavorite(id);
  }, [toggleFavorite]);

  const createBusinessHref = user ? businessUrls.create : withQueryParams(appUrls.auth.login, { redirect: businessUrls.create });
  const messagesHref = user ? appUrls.messages : withQueryParams(appUrls.auth.login, { redirect: appUrls.messages });
  const accountHref = user ? appUrls.profile.home : appUrls.auth.login;
  const accountLabel = user ? "Conta" : "Entrar";
  const locationLabel = `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;

  return (
    <EmpresasLandingLayout embedded={presentation === "embedded"}>
      {!resolved ? (
        <Helmet>
          <title>Empresas locais | Achegue-se</title>
          <meta name="description" content="Encontre empresas e estabelecimentos do seu território no Achegue-se." />
        </Helmet>
      ) : null}

      {presentation !== "embedded" ? (
        <BusinessHeader
          territoryName={territoryName}
          locationLabel={locationLabel}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenLocationDialog={() => setLocationDialogOpen(true)}
          mapHref={moduleUrls.map}
          messagesHref={messagesHref}
          accountHref={accountHref}
          accountLabel={accountLabel}
        />
      ) : null}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6 sm:pb-10">
        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`inline-flex min-h-10 items-center rounded-full border px-5 text-sm font-semibold transition-colors ${activeCategory === "all" ? "border-territory-brand bg-territory-brand text-territory-on-image" : "border-territory-border bg-territory-raised text-territory-ink hover:border-territory-brand/30"}`}
              aria-pressed={activeCategory === "all"}
            >
              Todas
            </button>
            {categoryCards.map((category) => (
              <CategoryCard key={category.slug} category={category} isActive={activeCategory === category.slug} onClick={() => setActiveCategory(category.slug)} />
            ))}
          </div>
        </div>

        <div className="mt-2 flex gap-2 lg:hidden">
          <button type="button" onClick={() => setLocationDialogOpen(true)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-territory-border text-sm font-semibold text-territory-ink">
            <MapPin className="h-4 w-4" aria-hidden="true" /> Território
          </button>
          <button type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-territory-border text-sm font-semibold text-territory-ink">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtros{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
          </button>
          <Link to={moduleUrls.map} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-territory-border text-sm font-semibold text-territory-ink">
            <MapIcon className="h-4 w-4" aria-hidden="true" /> Mapa
          </Link>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <DesktopFilterSidebar
            territoryName={territoryName}
            filters={QUICK_FILTERS}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onOpenLocationDialog={() => setLocationDialogOpen(true)}
            createBusinessHref={createBusinessHref}
          />
          <EmpresasListaSection
            businesses={filteredBusinesses}
            isLoading={isBusinessesLoading}
            isError={isBusinessesError}
            savedBusinesses={savedBusinesses}
            onToggleSave={handleToggleSave}
            onOpenBusiness={openBusiness}
          />
        </div>
      </main>

      {presentation !== "embedded" ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-territory-border bg-territory-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navegação principal">
          <Link to="/" className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-territory-muted"><Home className="h-5 w-5" />Início</Link>
          <span className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-territory-brand"><Store className="h-5 w-5" />Empresas</span>
          <Link to={moduleUrls.map} className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-territory-muted"><MapIcon className="h-5 w-5" />Mapa</Link>
          <Link to={accountHref} className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-territory-muted"><UserRound className="h-5 w-5" />Conta</Link>
        </nav>
      ) : null}

      <ModuleLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        moduleBasePath="/empresas"
        initialSlugs={initialSlugs}
        onApplyPath={(path) => navigate(path)}
      />

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto rounded-t-2xl border-territory-border bg-territory-surface px-4 pb-8 pt-5 text-territory-ink">
          <SheetHeader className="text-left">
            <SheetTitle className="text-left text-xl text-territory-ink">Filtros das empresas</SheetTitle>
            <SheetDescription className="text-left text-territory-muted">Mostre os resultados mais úteis para você.</SheetDescription>
          </SheetHeader>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-territory-muted">Filtros rápidos</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => (
                <QuickFilterChip key={filter.id} filter={filter} isActive={activeFilters.includes(filter.id)} onClick={() => handleToggleFilter(filter.id)} />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-territory-muted" htmlFor="mobile-business-sort">Ordenar</label>
            <select
              id="mobile-business-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as BusinessSortOption)}
              className="h-12 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink outline-none focus-visible:ring-2 focus-visible:ring-territory-focus"
            >
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <button type="button" onClick={() => setMobileFiltersOpen(false)} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink">
            Ver {filteredBusinesses.length} resultados
          </button>
        </SheetContent>
      </Sheet>
    </EmpresasLandingLayout>
  );
}

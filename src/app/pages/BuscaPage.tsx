import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Home,
  Loader2,
  List as ListIcon,
  Map,
  MapPin,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Store,
  Tag,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  TerritorySectionHeading,
  TerritoryState,
  TerritorySurface,
  TerritoryTopbar,
} from "@/app/components/territory-vivo";
import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/app/config/launchScope";
import { useBusinessNavigation } from "@/modules/business/hooks/useBusinessNavigation";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import {
  TERRITORY_RESOLVE_STATUS,
  useResolveTerritoryFromUrl,
} from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import {
  buildModuleTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { useGlobalSearch } from "@/core/search/hooks/useGlobalSearch";
import type { SearchCategory, SearchDocument } from "@/core/search";
import { useSessionContext } from "@/core/session";
import type { TerritoryFilter } from "@/core/location/types";
import type { MapMarker } from "@/core/maps/types/core";
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";
import { BUSCA_CONCEPT_MOCK } from "@/app/mocks/buscaConceptMock";

const TerritoryMapPreview = lazy(
  () => import("@/app/components/territory-vivo/TerritoryMapPreview"),
);

interface FilterOption {
  id: SearchCategory;
  label: string;
  icon: LucideIcon;
  launchSurface?: LaunchSurfaceKey;
}

interface BusinessSearchItem {
  id: string;
  name: string;
  logo_url?: string | null;
  category?: string | null;
  neighborhood?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
}

interface ProfessionalSearchItem {
  id: string;
  name: string;
  target_url?: string | null;
  logo_url?: string | null;
  category?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  total_reviews?: number | null;
}

interface SearchResultsViewModel {
  documents: SearchDocument[];
  businesses: BusinessSearchItem[];
  professionals: ProfessionalSearchItem[];
  total: number;
}

const FILTERS: FilterOption[] = (
  [
    { id: "all", label: "Todos", icon: Search },
    { id: "communities", label: "Comunidades", icon: Users },
    { id: "businesses", label: "Negócios", icon: Store },
    { id: "professionals", label: "Serviços", icon: Wrench },
    {
      id: "events",
      label: "Eventos",
      icon: CalendarDays,
      launchSurface: "events",
    },
    { id: "classifieds", label: "Classificados", icon: Tag },
    {
      id: "opportunities",
      label: "Oportunidades",
      icon: BriefcaseBusiness,
      launchSurface: "jobs",
    },
    { id: "posts", label: "Posts", icon: MessageSquare },
  ] satisfies FilterOption[]
).filter(
  (filter) =>
    !filter.launchSurface || isLaunchSurfaceEnabled(filter.launchSurface),
);

const PRIMARY_FILTER_IDS: SearchCategory[] = [
  "all",
  "businesses",
  "professionals",
  "classifieds",
];

function titleCase(value: string): string {
  const minorWords = new Set(["a", "as", "da", "das", "de", "do", "dos", "e"]);
  return value
    .replace(/-/g, " ")
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((word, index) =>
      index > 0 && minorWords.has(word)
        ? word
        : word.replace(/^\p{L}/u, (letter) =>
            letter.toLocaleUpperCase("pt-BR"),
          ),
    )
    .join(" ");
}

export default function BuscaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, city, district } = useParams<{
    state?: string;
    city?: string;
    district?: string;
  }>();
  const { active } = usePublicBrowsingCity();
  const { user } = useSessionContext();
  const { unreadCount } = useUnifiedNotifications();
  const { navigateToBusiness } = useBusinessNavigation();
  const conceptMockEnabled =
    import.meta.env.DEV && searchParams.get("concept-mock") === "1";
  const [activeFilter, setActiveFilter] = useState<SearchCategory>(() =>
    conceptMockEnabled ? "professionals" : "all",
  );
  const [sortOrder, setSortOrder] = useState<"relevance" | "name">(
    "relevance",
  );
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const initialQuery =
    searchParams.get("q")?.trim() ?? (conceptMockEnabled ? "eletricista" : "");
  const territoryResolution = useResolveTerritoryFromUrl();
  const moduleTerritory = useModuleTerritoryFilter({
    nearbyEnabled: false,
    routeResolved: territoryResolution.resolved,
    includeDescendants: true,
  });
  const routeResolvePending =
    Boolean(state && city) &&
    (territoryResolution.status === TERRITORY_RESOLVE_STATUS.IDLE ||
      territoryResolution.status === TERRITORY_RESOLVE_STATUS.LOADING);
  const searchEnabled = !routeResolvePending && !moduleTerritory.isLoading;
  const territoryFilterKey = JSON.stringify(
    moduleTerritory.territoryFilter ?? null,
  );
  const searchTerritoryFilter = useMemo<TerritoryFilter | undefined>(() => {
    const parsed = JSON.parse(territoryFilterKey) as TerritoryFilter | null;
    return parsed ?? undefined;
  }, [territoryFilterKey]);

  const {
    query,
    setQuery,
    updateFilters,
    results,
    isLoading,
    suggestions,
    history,
  } = useGlobalSearch(
    initialQuery,
    { category: activeFilter, territoryFilter: searchTerritoryFilter },
    { enabled: searchEnabled && !conceptMockEnabled },
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  useEffect(() => {
    if (!searchEnabled || conceptMockEnabled) return;
    updateFilters({
      category: activeFilter,
      territoryFilter: searchTerritoryFilter,
    });
  }, [
    activeFilter,
    conceptMockEnabled,
    searchEnabled,
    searchTerritoryFilter,
    updateFilters,
  ]);

  const stateSlug = state ?? active.state;
  const citySlug = city ?? active.city;
  const territoryBase = `/${stateSlug}/${citySlug}${district ? `/${district}` : ""}`;
  const territoryName = district
    ? titleCase(district)
    : moduleTerritory.displayLabel || titleCase(citySlug);
  const contextLabel = district
    ? `${titleCase(citySlug)}, ${stateSlug.toLocaleUpperCase("pt-BR")}`
    : `${stateSlug.toLocaleUpperCase("pt-BR")} · visão ampla da cidade`;

  const moduleUrls = useMemo(
    () => ({
      home: territoryBase,
      business: buildModuleTerritoryUrl(MODULE_SLUGS.business, territoryBase),
      services: buildModuleTerritoryUrl(MODULE_SLUGS.services, territoryBase),
      gastronomy: buildModuleTerritoryUrl(
        MODULE_SLUGS.gastronomy,
        territoryBase,
      ),
      classifieds: buildModuleTerritoryUrl(
        MODULE_SLUGS.classifieds,
        territoryBase,
      ),
      events: buildModuleTerritoryUrl(MODULE_SLUGS.events, territoryBase),
      jobs: buildModuleTerritoryUrl(MODULE_SLUGS.jobs, territoryBase),
      map: buildModuleTerritoryUrl(MODULE_SLUGS.map, territoryBase),
      search: buildModuleTerritoryUrl(MODULE_SLUGS.search, territoryBase),
      education: buildModuleTerritoryUrl(MODULE_SLUGS.education, territoryBase),
    }),
    [territoryBase],
  );

  const displayResults = useMemo<SearchResultsViewModel>(() => {
    if (conceptMockEnabled) {
      return {
        documents: [],
        businesses: [],
        professionals: BUSCA_CONCEPT_MOCK.professionals,
        total: BUSCA_CONCEPT_MOCK.professionals.length,
      };
    }

    return {
      documents: results.documents,
      businesses: results.businesses.map((business) => ({
        id: business.id,
        name: business.name,
        logo_url: business.logo_url,
        category: business.category,
        neighborhood: business.location?.name ?? business.business_city,
        description: business.description,
        latitude: business.address?.latitude,
        longitude: business.address?.longitude,
        rating: business.rating,
      })),
      professionals: results.professionals.map((professional) => ({
        id: professional.id,
        name: professional.name,
        target_url: professional.target_url,
        logo_url: professional.logo_url,
        category: professional.category,
        neighborhood: professional.neighborhood,
        city: professional.city,
        description: professional.description,
        latitude: professional.latitude,
        longitude: professional.longitude,
        rating: professional.rating,
        total_reviews: professional.total_reviews,
      })),
      total: results.total,
    };
  }, [conceptMockEnabled, results]);

  const resultMarkers = useMemo<MapMarker[]>(() => {
    const businessMarkers = displayResults.businesses.flatMap((business) =>
      typeof business.latitude === "number" &&
      typeof business.longitude === "number"
        ? [{
            id: `business-${business.id}`,
            type: "business" as const,
            coordinates: {
              latitude: business.latitude,
              longitude: business.longitude,
            },
            title: business.name,
            subtitle: business.category ?? undefined,
            status: "active" as const,
            url: undefined,
          }]
        : [],
    );
    const professionalMarkers = displayResults.professionals.flatMap(
      (professional) =>
        typeof professional.latitude === "number" &&
        typeof professional.longitude === "number"
          ? [{
              id: `professional-${professional.id}`,
              type: "professional" as const,
              coordinates: {
                latitude: professional.latitude,
                longitude: professional.longitude,
              },
              title: professional.name,
              subtitle: professional.category ?? undefined,
              status: "active" as const,
              url: professional.target_url ?? undefined,
            }]
          : [],
    );
    return [...businessMarkers, ...professionalMarkers];
  }, [displayResults]);

  const collections = useMemo(() => {
    const items: Array<{
      label: string;
      description: string;
      href: string;
      icon: LucideIcon;
      tone: string;
      surface?: LaunchSurfaceKey;
    }> = [
      {
        label: "Empresas",
        description: "Comércio local cadastrado",
        href: moduleUrls.business,
        icon: Store,
        tone: "bg-[hsl(var(--category-business)/0.14)] text-category-business",
      },
      {
        label: "Serviços",
        description: "Profissionais e soluções",
        href: moduleUrls.services,
        icon: Wrench,
        tone: "bg-[hsl(var(--category-discussion)/0.14)] text-category-discussion",
      },
      {
        label: "Gastronomia",
        description: "Onde comer por perto",
        href: moduleUrls.gastronomy,
        icon: UtensilsCrossed,
        tone: "bg-[hsl(var(--category-gastronomy)/0.14)] text-category-gastronomy",
        surface: "gastronomy",
      },
      {
        label: "Classificados",
        description: "Comprar, vender e circular",
        href: moduleUrls.classifieds,
        icon: Tag,
        tone: "bg-[hsl(var(--category-classified)/0.15)] text-category-classified",
      },
      {
        label: "Eventos",
        description: "Agenda ainda válida",
        href: moduleUrls.events,
        icon: CalendarDays,
        tone: "bg-[hsl(var(--category-event)/0.14)] text-category-event",
        surface: "events",
      },
      {
        label: "Oportunidades",
        description: "Vagas disponíveis",
        href: moduleUrls.jobs,
        icon: BriefcaseBusiness,
        tone: "bg-[hsl(var(--category-poll)/0.14)] text-category-poll",
        surface: "jobs",
      },
    ];
    return items.filter(
      (item) => !item.surface || isLaunchSurfaceEnabled(item.surface),
    );
  }, [moduleUrls]);

  const handleFilterChange = (filter: SearchCategory) => {
    setActiveFilter(filter);
  };

  const handleClearFilters = () => {
    setActiveFilter("all");
  };

  const toggleFilterMenu = () => setIsFilterMenuOpen((isOpen) => !isOpen);

  return (
    <div className="min-h-[100dvh] text-territory-ink">
      <TerritoryTopbar
        territoryName={territoryName}
        contextLabel={contextLabel}
        isAuthenticated={Boolean(user)}
        unreadCount={unreadCount}
        searchHref={moduleUrls.search}
        searchLabel="O que você procura por aqui?"
      />

      <main className="mx-auto w-full max-w-[76rem] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-[2rem] font-bold leading-[1.08] tracking-[-0.04em] text-territory-ink sm:text-4xl">
              Explorar
            </h1>
            <p className="mt-2 text-[0.9375rem] leading-6 text-territory-muted sm:text-base">
              Encontre o que você precisa na comunidade.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFilterMenu}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-3 text-sm font-semibold text-territory-ink hover:border-territory-brand/45 md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
            {activeFilter !== "all" ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-territory-sun px-1 text-xs font-bold text-territory-ink">
                1
              </span>
            ) : null}
          </button>
        </header>

        <nav
          id="search-filter-tabs"
          className="mt-6 border-b border-territory-border"
          aria-label="Categorias da busca"
        >
          <div className="flex gap-6 overflow-x-auto scrollbar-hide sm:gap-8">
            {FILTERS.filter((filter) => PRIMARY_FILTER_IDS.includes(filter.id)).map(
              (filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => handleFilterChange(filter.id)}
                  className={cn(
                    "relative min-h-12 shrink-0 whitespace-nowrap px-0.5 text-sm font-medium text-territory-muted transition-colors after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-transparent hover:text-territory-ink",
                    activeFilter === filter.id &&
                      "font-bold text-territory-brand after:bg-territory-brand",
                  )}
                  aria-pressed={activeFilter === filter.id}
                >
                  {filter.label}
                </button>
              ),
            )}
            <Link
              to={moduleUrls.education}
              className="relative hidden min-h-12 shrink-0 items-center whitespace-nowrap px-0.5 text-sm font-medium text-territory-muted transition-colors hover:text-territory-ink md:inline-flex"
            >
              Educação
            </Link>
          </div>
        </nav>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleFilterMenu}
            className="hidden min-h-10 items-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-3 text-sm font-semibold text-territory-ink hover:border-territory-brand/45 md:inline-flex"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
          </button>
          {activeFilter !== "all" ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-territory-brand/10 px-3 text-sm font-semibold text-territory-brand hover:bg-territory-brand/15"
            >
              {FILTERS.find((filter) => filter.id === activeFilter)?.label}
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleClearFilters}
            className="min-h-10 px-2 text-sm font-semibold text-territory-brand underline decoration-territory-brand/45 underline-offset-4 hover:text-territory-brand-strong"
          >
            Limpar
          </button>
          <label className="relative ml-auto inline-flex min-h-10 items-center">
            <span className="sr-only">Ordenar resultados</span>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "relevance" | "name")
              }
              className="hidden h-10 appearance-none rounded-xl border border-territory-border bg-territory-surface py-0 pl-3 pr-9 text-sm font-medium text-territory-ink outline-none hover:border-territory-brand/45 focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20 md:block"
            >
              <option value="relevance">Relevância</option>
              <option value="name">Nome</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 hidden h-4 w-4 text-territory-muted md:block"
              aria-hidden="true"
            />
          </label>
          {isFilterMenuOpen ? (
            <div className="absolute left-0 top-12 z-20 w-full max-w-sm rounded-2xl border border-territory-border bg-territory-surface p-4 shadow-territory-highlight">
              <p className="text-sm font-bold text-territory-ink">Mais filtros</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FILTERS.filter(
                  (filter) => !PRIMARY_FILTER_IDS.includes(filter.id),
                ).map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      handleFilterChange(filter.id);
                      setIsFilterMenuOpen(false);
                    }}
                    className={cn(
                      "min-h-10 rounded-xl border px-3 text-sm font-semibold",
                      activeFilter === filter.id
                        ? "border-territory-brand bg-territory-brand text-[hsl(var(--territory-canvas))]"
                        : "border-territory-border bg-territory-raised text-territory-ink hover:border-territory-brand/45",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.82fr)] xl:items-start xl:gap-8">
          <section className="min-w-0">
            {!query ? (
              <ExploreStart
                collections={collections}
                suggestions={suggestions}
                history={history}
                onSuggestionClick={(suggestion) => {
                  setQuery(suggestion);
                  setSearchParams({ q: suggestion });
                }}
              />
            ) : isLoading || (!searchEnabled && !conceptMockEnabled) ? (
              <LoadingState />
            ) : displayResults.total === 0 ? (
              <TerritoryState
                icon={<Search className="h-5 w-5" aria-hidden="true" />}
                title={`Nenhum resultado para “${query}”.`}
                description="Tente outro termo, ajuste a categoria ou continue pelo mapa e pelas coleções territoriais."
                primaryAction={{ label: "Ver mapa", href: moduleUrls.map }}
                secondaryAction={{
                  label: "Voltar para Hoje",
                  href: moduleUrls.home,
                }}
              />
            ) : (
              <ResultsView
                results={displayResults}
                query={query}
                territoryName={territoryName}
                activeFilter={activeFilter}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                mapHref={moduleUrls.map}
                onBusinessClick={navigateToBusiness}
                onProfessionalClick={(professional) =>
                  navigate(
                    professional.target_url || professionalPublicRoutes.home(),
                  )
                }
                onDocumentClick={(document) => {
                  if (document.url) navigate(document.url);
                }}
              />
            )}
          </section>

          <aside
            className="hidden min-w-0 xl:sticky xl:top-24 xl:block"
            aria-label="Resultados no mapa"
          >
            <DeferredMapPreview territoryName={territoryName}>
              <TerritoryMapPreview
                resolved={territoryResolution.resolved ?? null}
                mapHref={moduleUrls.map}
                territoryName={territoryName}
                title="Resultados no mapa"
                markers={resultMarkers}
                showNavigationControls
                mapHeightClassName="h-[31rem]"
              />
            </DeferredMapPreview>
          </aside>
        </div>

        {query ? (
          <Link
            to={moduleUrls.map}
            className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-30 mx-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-territory-brand px-4 text-sm font-bold text-[hsl(var(--territory-canvas))] shadow-territory-highlight hover:bg-territory-brand-strong xl:hidden"
          >
            <Map className="h-4 w-4" aria-hidden="true" />
            Ver no mapa
          </Link>
        ) : null}
      </main>
    </div>
  );
}

function DeferredMapPreview({
  territoryName,
  children,
}: {
  territoryName: string;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "240px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {isNearViewport ? (
        <Suspense
          fallback={<MapPreviewSkeleton territoryName={territoryName} />}
        >
          {children}
        </Suspense>
      ) : (
        <MapPreviewSkeleton territoryName={territoryName} />
      )}
    </div>
  );
}

function ExploreStart({
  collections,
  suggestions,
  history,
  onSuggestionClick,
}: {
  collections: Array<{
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
    tone: string;
  }>;
  suggestions: string[];
  history: string[];
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <>
      <section aria-labelledby="explore-collections-title">
        <TerritorySectionHeading
          id="explore-collections-title"
          title="Explorar por intenção"
          description="Entre pelo que você precisa resolver, não por uma lista técnica de módulos."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const Icon = collection.icon;
            return (
              <Link
                key={collection.label}
                to={collection.href}
                className="group flex items-center gap-3 rounded-territory border border-territory-border bg-territory-surface p-4 transition-colors hover:border-territory-brand/35 hover:bg-territory-raised"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    collection.tone,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-territory-ink group-hover:text-territory-brand">
                    {collection.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-territory-muted">
                    {collection.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="explore-suggestions-title">
        <TerritorySectionHeading
          id="explore-suggestions-title"
          title="Começar com uma busca"
          description="Sugestões são termos de busca, não resultados inventados."
        />
        <TerritorySurface className="p-5 sm:p-6">
          {history.length > 0 ? (
            <SuggestionGroup
              title="Buscas recentes"
              items={history}
              onSelect={onSuggestionClick}
            />
          ) : null}
          <SuggestionGroup
            title={history.length > 0 ? "Sugestões" : "Sugestões para começar"}
            items={suggestions}
            onSelect={onSuggestionClick}
            className={
              history.length > 0
                ? "mt-5 border-t border-territory-border pt-5"
                : undefined
            }
          />
        </TerritorySurface>
      </section>
    </>
  );
}

function SuggestionGroup({
  title,
  items,
  onSelect,
  className,
}: {
  title: string;
  items: string[];
  onSelect: (item: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-territory-ink">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className="min-h-11 rounded-xl border border-territory-border bg-territory-raised px-3 text-sm text-territory-ink hover:border-territory-brand/35 hover:text-territory-brand"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <TerritorySurface
      className="flex min-h-56 flex-col items-center justify-center p-8"
      role="status"
    >
      <Loader2
        className="h-7 w-7 animate-spin text-territory-brand"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm text-territory-muted">
        Buscando neste território…
      </p>
    </TerritorySurface>
  );
}

function MapPreviewSkeleton({ territoryName }: { territoryName: string }) {
  return (
    <div
      className="overflow-hidden rounded-territory-highlight border border-territory-border bg-territory-surface"
      aria-label={`Carregando mapa de ${territoryName}`}
    >
      <div className="h-56 animate-pulse bg-territory-raised" />
      <div className="h-20 border-t border-territory-border p-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-territory-raised" />
      </div>
    </div>
  );
}

function ResultsView({
  results,
  query,
  territoryName,
  activeFilter,
  sortOrder,
  onSortOrderChange,
  mapHref,
  onBusinessClick,
  onProfessionalClick,
  onDocumentClick,
}: {
  results: SearchResultsViewModel;
  query: string;
  territoryName: string;
  activeFilter: SearchCategory;
  sortOrder: "relevance" | "name";
  onSortOrderChange: (value: "relevance" | "name") => void;
  mapHref: string;
  onBusinessClick: (business: BusinessSearchItem) => void;
  onProfessionalClick: (professional: ProfessionalSearchItem) => void;
  onDocumentClick: (document: SearchDocument) => void;
}) {
  const documentSections = DOCUMENT_SECTION_ORDER.map((type) => ({
    ...DOCUMENT_SECTION_CONFIG[type],
    type,
    documents: results.documents.filter((document) => document.type === type),
  })).filter((section) => section.documents.length > 0);
  const professionals = [...results.professionals].sort((left, right) =>
    sortOrder === "name"
      ? left.name.localeCompare(right.name, "pt-BR")
      : (right.rating ?? 0) - (left.rating ?? 0),
  );
  const resultHeading =
    activeFilter === "professionals"
      ? `${pluralizeSearchTerm(query)} na comunidade`
      : `Resultados para “${query}”`;

  return (
    <div aria-live="polite">
      <header>
        <h2 className="font-heading text-[1.35rem] font-bold leading-tight tracking-[-0.03em] text-territory-ink sm:text-2xl">
          {resultHeading}
        </h2>
        <p className="mt-1 text-sm leading-6 text-territory-muted">
          No {territoryName}
        </p>
      </header>

      <div className="mt-4 flex items-center gap-2 md:hidden">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Ordenar resultados</span>
          <select
            value={sortOrder}
            onChange={(event) =>
              onSortOrderChange(event.target.value as "relevance" | "name")
            }
            className="h-10 w-full appearance-none rounded-xl border border-territory-border bg-territory-surface py-0 pl-3 pr-8 text-xs font-semibold text-territory-ink outline-none focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20"
          >
            <option value="relevance">Ordenar: relevância</option>
            <option value="name">Ordenar: nome</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted"
            aria-hidden="true"
          />
        </label>
        <button
          type="button"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-territory-brand px-3 text-sm font-semibold text-[hsl(var(--territory-canvas))]"
          aria-pressed="true"
        >
          <ListIcon className="h-4 w-4" aria-hidden="true" />
          Lista
        </button>
        <Link
          to={mapHref}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-3 text-sm font-semibold text-territory-ink hover:border-territory-brand/45"
        >
          <Map className="h-4 w-4" aria-hidden="true" />
          Mapa
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {professionals.map((professional) => (
          <ProfessionalResultCard
            key={professional.id}
            professional={professional}
            onClick={() => onProfessionalClick(professional)}
          />
        ))}
        {results.businesses.map((business) => (
          <BusinessResultCard
            key={business.id}
            business={business}
            onClick={() => onBusinessClick(business)}
          />
        ))}
      </div>

      {professionals.length > 0 || results.businesses.length > 0 ? (
        <p className="mt-5 text-sm text-territory-muted">
          {results.total} resultado{results.total !== 1 ? "s" : ""} neste contexto
        </p>
      ) : null}

      {documentSections.length > 0 ? (
        <div className="mt-8 space-y-8">
          {documentSections.map((section) => (
            <ResultSection
              key={section.type}
              title={section.title}
              icon={section.icon}
            >
              {section.documents.map((document) => (
                <DocumentResultRow
                  key={`${document.type}-${document.id}`}
                  document={document}
                  onClick={() => onDocumentClick(document)}
                />
              ))}
            </ResultSection>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function pluralizeSearchTerm(query: string): string {
  const normalized = query.trim();
  if (!normalized) return "Resultados";
  const title = titleCase(normalized);
  if (normalized.toLocaleLowerCase("pt-BR").endsWith("s")) return title;
  return `${title}s`;
}

function ResultSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <TerritorySectionHeading title={title} className="mb-3" />
      <TerritorySurface className="p-5 sm:p-6">
        <div className="sr-only">{icon}</div>
        {children}
      </TerritorySurface>
    </section>
  );
}

function BusinessResultCard({
  business,
  onClick,
}: {
  business: BusinessSearchItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full items-start gap-3 rounded-xl border border-territory-border bg-territory-surface p-3 text-left shadow-[0_1px_0_hsl(var(--territory-border)/0.25)] transition-colors hover:border-territory-brand/55 hover:bg-territory-raised sm:gap-4 sm:p-4"
    >
      {business.logo_url ? (
        <img
          src={business.logo_url}
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-territory-raised text-territory-brand">
          <Store className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1 pr-7">
        <span className="block truncate text-base font-bold text-territory-ink group-hover:text-territory-brand">
          {business.name}
        </span>
        <span className="mt-1 flex items-center gap-1 text-sm text-territory-muted">
          <span className="truncate">{business.category}</span>
          {business.neighborhood ? (
            <>
              <span>·</span>
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{business.neighborhood}</span>
            </>
          ) : null}
        </span>
        <span className="mt-2 block line-clamp-2 text-sm leading-5 text-territory-ink/80">
          {business.description || "Informações e serviços disponíveis por perto."}
        </span>
        <span className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-territory-muted">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
            <Home className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Atende no território
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-territory-brand">
            Ver negócio
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
      </span>
      <span className="absolute right-3 top-3 text-territory-brand sm:right-4 sm:top-4">
        <Bookmark className="h-5 w-5" aria-hidden="true" />
      </span>
    </button>
  );
}

function ProfessionalResultCard({
  professional,
  onClick,
}: {
  professional: ProfessionalSearchItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full items-start gap-3 rounded-xl border border-territory-border bg-territory-surface p-3 text-left shadow-[0_1px_0_hsl(var(--territory-border)/0.25)] transition-colors hover:border-territory-brand/55 hover:bg-territory-raised sm:gap-4 sm:p-4"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        <BusinessLogo
          name={professional.name}
          logoUrl={professional.logo_url}
          alt={professional.name}
          initialsClassName="text-lg"
        />
      </div>
      <span className="min-w-0 flex-1 pr-7">
        <span className="block truncate text-base font-bold text-territory-ink group-hover:text-territory-brand">
          {professional.name}
        </span>
        <span className="mt-1 flex items-center gap-1 text-sm text-territory-muted">
          <span className="truncate">{professional.category}</span>
          {professional.neighborhood || professional.city ? (
            <>
              <span>·</span>
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">
                {professional.neighborhood ?? professional.city}
              </span>
            </>
          ) : null}
        </span>
        <span className="mt-2 block line-clamp-2 text-sm leading-5 text-territory-ink/80">
          {professional.description || "Soluções e atendimento para a vizinhança."}
        </span>
        <span className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-territory-muted">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
            <Home className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Atende no território
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-territory-brand">
            Ver profissional
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
      </span>
      <span className="absolute right-3 top-3 text-territory-brand sm:right-4 sm:top-4">
        <Bookmark className="h-5 w-5" aria-hidden="true" />
      </span>
    </button>
  );
}

const DOCUMENT_TYPE_ICONS: Record<SearchDocument["type"], ReactNode> = {
  community: <Users className="h-5 w-5" aria-hidden="true" />,
  business: <Store className="h-5 w-5" aria-hidden="true" />,
  professional: <Wrench className="h-5 w-5" aria-hidden="true" />,
  opportunity: <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />,
  classified: <Tag className="h-5 w-5" aria-hidden="true" />,
  event: <CalendarDays className="h-5 w-5" aria-hidden="true" />,
  post: <MessageSquare className="h-5 w-5" aria-hidden="true" />,
  coupon: <Tag className="h-5 w-5" aria-hidden="true" />,
};

type GenericSearchDocumentType = Exclude<
  SearchDocument["type"],
  "business" | "professional"
>;

const DOCUMENT_SECTION_ORDER: GenericSearchDocumentType[] = [
  "community",
  "classified",
  "post",
  "event",
  "opportunity",
  "coupon",
];

const DOCUMENT_SECTION_CONFIG: Record<
  GenericSearchDocumentType,
  { title: string; icon: ReactNode }
> = {
  community: {
    title: "Comunidades",
    icon: <Users className="h-5 w-5" aria-hidden="true" />,
  },
  classified: {
    title: "Classificados",
    icon: <Tag className="h-5 w-5" aria-hidden="true" />,
  },
  post: {
    title: "Atividade pública",
    icon: <MessageSquare className="h-5 w-5" aria-hidden="true" />,
  },
  event: {
    title: "Eventos",
    icon: <CalendarDays className="h-5 w-5" aria-hidden="true" />,
  },
  opportunity: {
    title: "Oportunidades",
    icon: <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />,
  },
  coupon: {
    title: "Cupons",
    icon: <Tag className="h-5 w-5" aria-hidden="true" />,
  },
};

function DocumentResultRow({
  document,
  onClick,
}: {
  document: SearchDocument;
  onClick: () => void;
}) {
  const disabled = !document.url;
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 border-b border-territory-border/75 py-4 text-left first:pt-0 last:border-b-0 last:pb-0",
        disabled && "cursor-default opacity-75",
      )}
    >
      {document.imageUrl ? (
        <img
          src={document.imageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-territory object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-territory bg-territory-brand/12 text-territory-brand">
          {DOCUMENT_TYPE_ICONS[document.type]}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-territory-ink group-hover:text-territory-brand">
          {document.title}
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs text-territory-muted">
          <span className="truncate">{document.subtitle}</span>
          {document.territoryLabel ? (
            <>
              <span>·</span>
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span className="truncate">{document.territoryLabel}</span>
            </>
          ) : null}
        </span>
        {document.description ? (
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-territory-muted">
            {document.description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

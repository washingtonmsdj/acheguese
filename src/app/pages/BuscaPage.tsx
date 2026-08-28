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
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Star,
  Store,
  Tag,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  TerritorySearch,
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
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";

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
  rating?: number | null;
}

interface ProfessionalSearchItem {
  id: string;
  name: string;
  target_url?: string | null;
  logo_url?: string | null;
  category?: string | null;
  city?: string | null;
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
    { id: "businesses", label: "Empresas", icon: Store },
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

function titleCase(value: string): string {
  return value
    .replace(/-/g, " ")
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
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
  const [activeFilter, setActiveFilter] = useState<SearchCategory>("all");
  const initialQuery = searchParams.get("q")?.trim() ?? "";
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
    { enabled: searchEnabled },
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  useEffect(() => {
    if (!searchEnabled) return;
    updateFilters({
      category: activeFilter,
      territoryFilter: searchTerritoryFilter,
    });
  }, [activeFilter, searchEnabled, searchTerritoryFilter, updateFilters]);

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
    }),
    [territoryBase],
  );

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

  const handleSearchSubmit = (nextQuery: string) => {
    setQuery(nextQuery);
    setSearchParams(nextQuery ? { q: nextQuery } : {});
  };

  return (
    <div className="min-h-[100dvh] text-territory-ink">
      <TerritoryTopbar
        territoryName={territoryName}
        contextLabel={contextLabel}
        isAuthenticated={Boolean(user)}
        unreadCount={unreadCount}
      />

      <main className="mx-auto w-full max-w-[76rem] px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <section className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.75fr)] lg:gap-10">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-territory-brand">
              Explorar território
            </p>
            <h1 className="mt-2 font-heading text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-territory-ink sm:text-4xl">
              Encontre o que existe em {territoryName}.
            </h1>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-6 text-territory-muted sm:text-base">
              Busque pessoas, lugares, serviços e conteúdo; use categorias ou
              abra o mapa quando a localização importar.
            </p>
          </div>
          <TerritorySearch
            id="territory-explore-search"
            label={`Buscar em ${territoryName}`}
            placeholder={`Buscar em ${territoryName}`}
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
          />
        </section>

        <div
          className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          aria-label="Filtros da busca"
        >
          {FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => handleFilterChange(filter.id)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors",
                  activeFilter === filter.id
                    ? "border-territory-brand bg-territory-brand text-[hsl(var(--territory-canvas))]"
                    : "border-territory-border bg-territory-surface text-territory-muted hover:border-territory-brand/35 hover:text-territory-ink",
                )}
                aria-pressed={activeFilter === filter.id}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-12">
          <div className="min-w-0 space-y-10">
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
            ) : isLoading || !searchEnabled ? (
              <LoadingState />
            ) : results.total === 0 ? (
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
                results={results}
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
          </div>

          <aside
            className="space-y-5 xl:sticky xl:top-24"
            aria-label="Mapa e contexto de exploração"
          >
            <DeferredMapPreview territoryName={territoryName}>
              <TerritoryMapPreview
                resolved={territoryResolution.resolved ?? null}
                mapHref={moduleUrls.map}
                territoryName={territoryName}
              />
            </DeferredMapPreview>

            <TerritorySurface tone="inset" className="p-5">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
                Mesmo contexto
              </p>
              <h2 className="mt-2 font-heading text-lg font-semibold text-territory-ink">
                {territoryName}
              </h2>
              <p className="mt-1 text-sm leading-6 text-territory-muted">
                Resultados, categorias e mapa usam o mesmo recorte territorial.
              </p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/?trocar=territorio")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-territory-border bg-territory-surface text-sm font-semibold text-territory-ink hover:border-territory-brand/35"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Trocar território
                </button>
              </div>
            </TerritorySurface>
          </aside>
        </div>
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
  onBusinessClick,
  onProfessionalClick,
  onDocumentClick,
}: {
  results: SearchResultsViewModel;
  onBusinessClick: (business: BusinessSearchItem) => void;
  onProfessionalClick: (professional: ProfessionalSearchItem) => void;
  onDocumentClick: (document: SearchDocument) => void;
}) {
  const documentSections = DOCUMENT_SECTION_ORDER.map((type) => ({
    ...DOCUMENT_SECTION_CONFIG[type],
    type,
    documents: results.documents.filter((document) => document.type === type),
  })).filter((section) => section.documents.length > 0);

  return (
    <div className="space-y-8" aria-live="polite">
      <p className="text-sm text-territory-muted">
        {results.total} resultado{results.total !== 1 ? "s" : ""} neste contexto
      </p>

      {results.businesses.length > 0 ? (
        <ResultSection
          title="Empresas"
          icon={<Store className="h-5 w-5" aria-hidden="true" />}
        >
          {results.businesses.map((business) => (
            <BusinessResultRow
              key={business.id}
              business={business}
              onClick={() => onBusinessClick(business)}
            />
          ))}
        </ResultSection>
      ) : null}

      {results.professionals.length > 0 ? (
        <ResultSection
          title="Serviços e profissionais"
          icon={<Wrench className="h-5 w-5" aria-hidden="true" />}
        >
          {results.professionals.map((professional) => (
            <ProfessionalResultRow
              key={professional.id}
              professional={professional}
              onClick={() => onProfessionalClick(professional)}
            />
          ))}
        </ResultSection>
      ) : null}

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
  );
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

function BusinessResultRow({
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
      className="group flex w-full items-center gap-3 border-b border-territory-border/75 py-4 text-left first:pt-0 last:border-b-0 last:pb-0"
    >
      {business.logo_url ? (
        <img
          src={business.logo_url}
          alt=""
          className="h-12 w-12 shrink-0 rounded-territory object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-territory bg-[hsl(var(--category-business)/0.14)] text-category-business">
          <Store className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-territory-ink group-hover:text-territory-brand">
          {business.name}
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs text-territory-muted">
          <span className="truncate">{business.category}</span>
          {business.neighborhood ? (
            <>
              <span>·</span>
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span className="truncate">{business.neighborhood}</span>
            </>
          ) : null}
        </span>
        {(business.rating ?? 0) > 0 ? (
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-territory-ink">
            <Star
              className="h-3 w-3 fill-territory-sun text-territory-sun"
              aria-hidden="true"
            />
            {(business.rating ?? 0).toFixed(1)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function ProfessionalResultRow({
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
      className="group flex w-full items-center gap-3 border-b border-territory-border/75 py-4 text-left first:pt-0 last:border-b-0 last:pb-0"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
        <BusinessLogo
          name={professional.name}
          logoUrl={professional.logo_url}
          alt={professional.name}
          initialsClassName="text-lg"
        />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-territory-ink group-hover:text-territory-brand">
          {professional.name}
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs text-territory-muted">
          <span className="truncate">{professional.category}</span>
          {professional.city ? (
            <>
              <span>·</span>
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span className="truncate">{professional.city}</span>
            </>
          ) : null}
        </span>
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

/**
 * BuscaPage - busca federada publica.
 *
 * Busca unificada de:
 * - Comunidades
 * - Negocios locais
 * - Profissionais
 * - Classificados
 * - Conteudos comunitarios
 *
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Search,
  Store,
  Wrench,
  ArrowLeft,
  X,
  Star,
  MapPin,
  Loader2,
  Users,
  Calendar,
  Tag,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessNavigation } from "@/modules/business/hooks/useBusinessNavigation";
import { useGlobalSearch } from "@/core/search/hooks/useGlobalSearch";
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";
import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/config/launchScope";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import {
  TERRITORY_RESOLVE_STATUS,
  useResolveTerritoryFromUrl,
} from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { SearchCategory, SearchDocument } from "@/core/search";
import type { TerritoryFilter } from "@/core/location/types";

// ============================================================================
// TYPES
// ============================================================================

interface FilterOption {
  id: SearchCategory;
  label: string;
  icon: React.ReactNode;
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

// ============================================================================
// CONSTANTS
// ============================================================================

const RAW_FILTERS: FilterOption[] = [
  { id: "all", label: "Todos", icon: <Search className="h-3.5 w-3.5" /> },
  {
    id: "communities",
    label: "Comunidades",
    icon: <Users className="h-3.5 w-3.5" />,
  },
  {
    id: "businesses",
    label: "Empresas",
    icon: <Store className="h-3.5 w-3.5" />,
  },
  {
    id: "professionals",
    label: "Profissões e Serviços",
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  {
    id: "events",
    label: "Eventos",
    icon: <Calendar className="h-3.5 w-3.5" />,
    launchSurface: "events",
  },
  {
    id: "classifieds",
    label: "Classificados",
    icon: <Tag className="h-3.5 w-3.5" />,
  },
  {
    id: "opportunities",
    label: "Oportunidades",
    icon: <Briefcase className="h-3.5 w-3.5" />,
    launchSurface: "jobs",
  },
  {
    id: "posts",
    label: "Posts",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
];

const FILTERS: FilterOption[] = RAW_FILTERS.filter(
  (filter) =>
    !filter.launchSurface || isLaunchSurfaceEnabled(filter.launchSurface),
);

// ============================================================================
// COMPONENT
// ============================================================================

export default function BuscaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, city } = useParams<{ state?: string; city?: string }>();
  const { navigateToBusiness } = useBusinessNavigation();
  const [activeFilter, setActiveFilter] = useState<SearchCategory>("all");
  const initialQuery = searchParams.get("q")?.trim() ?? "";
  const territoryResolution = useResolveTerritoryFromUrl();
  const moduleTerritory = useModuleTerritoryFilter({
    nearbyEnabled: true,
    routeResolved: territoryResolution.resolved,
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
    clearQuery,
    suggestions,
    history,
  } = useGlobalSearch(
    initialQuery,
    {
      category: activeFilter,
      territoryFilter: searchTerritoryFilter,
    },
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
  }, [activeFilter, searchTerritoryFilter, searchEnabled, updateFilters]);

  const handleFilterChange = (filter: SearchCategory) => {
    setActiveFilter(filter);
    updateFilters({
      category: filter,
      territoryFilter: searchTerritoryFilter,
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar comunidades, empresas, serviços, classificados..."
              className="pl-9 pr-9 h-10 rounded-full bg-secondary border-none"
              aria-label="Campo de busca"
            />
            {query && (
              <button
                onClick={clearQuery}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all",
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
              )}
              aria-pressed={activeFilter === filter.id}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {!query ? (
          <EmptyState
            suggestions={suggestions}
            history={history}
            onSuggestionClick={handleSuggestionClick}
          />
        ) : isLoading || !searchEnabled ? (
          <LoadingState />
        ) : results.total === 0 ? (
          <NoResultsState query={query} />
        ) : (
          <ResultsView
            results={results}
            activeFilter={activeFilter}
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
    </div>
  );
}
// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EmptyState({
  suggestions,
  history,
  onSuggestionClick,
}: {
  suggestions: string[];
  history: string[];
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">
          Digite para buscar comunidades, empresas, serviços e classificados
        </p>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Buscas recentes</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(item)}
                className="px-3 py-1.5 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-3">Sugestões</h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-3 py-1.5 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">Buscando...</p>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-semibold mb-1">Nenhum resultado</p>
      <p className="text-sm text-muted-foreground">
        Não encontramos resultados para "{query}"
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Tente buscar por outro termo
      </p>
    </div>
  );
}

function ResultsView({
  results,
  activeFilter,
  onBusinessClick,
  onProfessionalClick,
  onDocumentClick,
}: {
  results: SearchResultsViewModel;
  activeFilter: SearchCategory;
  onBusinessClick: (business: BusinessSearchItem) => void;
  onProfessionalClick: (professional: ProfessionalSearchItem) => void;
  onDocumentClick: (document: SearchDocument) => void;
}) {
  const documentSections = DOCUMENT_SECTION_ORDER.map((type) => {
    const config = DOCUMENT_SECTION_CONFIG[type];
    return {
      ...config,
      type,
      documents: results.documents.filter((document) => document.type === type),
    };
  }).filter((section) => section.documents.length > 0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeFilter}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        <p className="text-xs text-muted-foreground">
          {results.total} resultado{results.total !== 1 ? "s" : ""}
        </p>

        {/* Empresas */}
        {results.businesses.length > 0 && (
          <Section
            title="Empresas"
            icon={<Store className="h-4 w-4 text-primary" />}
          >
            {results.businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onClick={() => onBusinessClick(business)}
              />
            ))}
          </Section>
        )}

        {/* Profissionais */}
        {results.professionals.length > 0 && (
          <Section
            title="Profissões e Serviços"
            icon={<Wrench className="h-4 w-4 text-primary" />}
          >
            {results.professionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                onClick={() => onProfessionalClick(professional)}
              />
            ))}
          </Section>
        )}

        {documentSections.map((section) => (
          <Section key={section.type} title={section.title} icon={section.icon}>
            {section.documents.map((document) => (
              <SearchDocumentCard
                key={`${document.type}-${document.id}`}
                document={document}
                onClick={() => onDocumentClick(document)}
              />
            ))}
          </Section>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BusinessCard({
  business,
  onClick,
}: {
  business: BusinessSearchItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl bg-card border hover:bg-accent/50 transition-colors text-left"
    >
      {business.logo_url && (
        <img
          src={business.logo_url}
          alt={business.name}
          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{business.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <span className="truncate">{business.category}</span>
          {business.neighborhood && (
            <>
              <span>·</span>
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{business.neighborhood}</span>
            </>
          )}
        </div>
        {(business.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">
              {(business.rating ?? 0).toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function ProfessionalCard({
  professional,
  onClick,
}: {
  professional: ProfessionalSearchItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl bg-card border hover:bg-accent/50 transition-colors text-left"
    >
      <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
        <BusinessLogo
          name={professional.name}
          logoUrl={professional.logo_url}
          alt={professional.name}
          initialsClassName="text-lg"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{professional.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <span className="truncate">{professional.category}</span>
          {professional.city && (
            <>
              <span>·</span>
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{professional.city}</span>
            </>
          )}
        </div>
        {(professional.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">
              {(professional.rating ?? 0).toFixed(1)}
            </span>
            {(professional.total_reviews ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground">
                ({professional.total_reviews})
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

const DOCUMENT_TYPE_LABELS: Record<SearchDocument["type"], string> = {
  community: "Comunidade",
  business: "Empresa",
  professional: "Profissional",
  opportunity: "Oportunidade",
  classified: "Classificado",
  event: "Evento",
  post: "Post",
  coupon: "Cupom",
};

const DOCUMENT_TYPE_ICONS: Record<SearchDocument["type"], React.ReactNode> = {
  community: <Users className="h-5 w-5 text-muted-foreground" />,
  business: <Store className="h-5 w-5 text-muted-foreground" />,
  professional: <Wrench className="h-5 w-5 text-muted-foreground" />,
  opportunity: <Briefcase className="h-5 w-5 text-muted-foreground" />,
  classified: <Tag className="h-5 w-5 text-muted-foreground" />,
  event: <Calendar className="h-5 w-5 text-muted-foreground" />,
  post: <MessageSquare className="h-5 w-5 text-muted-foreground" />,
  coupon: <Tag className="h-5 w-5 text-muted-foreground" />,
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
  { title: string; icon: React.ReactNode }
> = {
  community: {
    title: "Comunidades",
    icon: <Users className="h-4 w-4 text-primary" />,
  },
  classified: {
    title: "Classificados",
    icon: <Tag className="h-4 w-4 text-primary" />,
  },
  post: {
    title: "Atividades nas comunidades",
    icon: <MessageSquare className="h-4 w-4 text-primary" />,
  },
  event: {
    title: "Eventos",
    icon: <Calendar className="h-4 w-4 text-primary" />,
  },
  opportunity: {
    title: "Oportunidades",
    icon: <Briefcase className="h-4 w-4 text-primary" />,
  },
  coupon: {
    title: "Cupons",
    icon: <Tag className="h-4 w-4 text-primary" />,
  },
};

function SearchDocumentCard({
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
        "flex items-center gap-3 w-full p-3 rounded-xl bg-card border text-left transition-colors",
        disabled ? "cursor-default opacity-80" : "hover:bg-accent/50",
      )}
    >
      {document.imageUrl ? (
        <img
          src={document.imageUrl}
          alt={document.title}
          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          {DOCUMENT_TYPE_ICONS[document.type]}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{document.title}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <span className="truncate">
            {document.subtitle || DOCUMENT_TYPE_LABELS[document.type]}
          </span>
          {document.territoryLabel && (
            <>
              <span>-</span>
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{document.territoryLabel}</span>
            </>
          )}
        </div>
        {document.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {document.description}
          </p>
        )}
      </div>
    </button>
  );
}

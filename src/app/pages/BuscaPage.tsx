/**
 * BuscaPage - Busca Global Profissional
 *
 * Busca unificada de:
 * - Negócios
 * - Profissionais
 * - Classificados (TODO)
 * - Eventos (TODO)
 * - Cupons (TODO)
 *
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Store,
  Wrench,
  BriefcaseBusiness,
  Tag,
  Calendar,
  Ticket,
  ArrowLeft,
  X,
  Star,
  MapPin,
  Loader2,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessNavigation } from "@/modules/business/hooks/useBusinessNavigation";
import { useGlobalSearch } from "@/core/search/hooks/useGlobalSearch";
import { useSessionContext } from "@/core/session";
import { workOpportunityTelemetryService } from "@/core/work-opportunities/services/WorkOpportunityTelemetryService";
import { analyticsService } from "@/core/analytics/services/AnalyticsService";
import type { SearchCategory } from "@/core/search";

// ============================================================================
// TYPES
// ============================================================================

interface FilterOption {
  id: SearchCategory;
  label: string;
  icon: React.ReactNode;
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
  logo_url?: string | null;
  category?: string | null;
  city?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
}

interface SearchResultsViewModel {
  businesses: BusinessSearchItem[];
  professionals: ProfessionalSearchItem[];
  opportunities: Array<{
    id: string;
    headline: string;
    professional_category: string;
    territory_name?: string | null;
    urgency: string;
    availability_notes?: string | null;
    source_kind?: "work_opportunity" | "vaga";
    target_url?: string;
    company_name?: string | null;
  }>;
  total: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FILTERS: FilterOption[] = [
  { id: "all", label: "Todos", icon: <Search className="h-3.5 w-3.5" /> },
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
    id: "opportunities",
    label: "Oportunidades",
    icon: <BriefcaseBusiness className="h-3.5 w-3.5" />,
  },
  {
    id: "classifieds",
    label: "Classificados",
    icon: <Tag className="h-3.5 w-3.5" />,
  },
  {
    id: "events",
    label: "Eventos",
    icon: <Calendar className="h-3.5 w-3.5" />,
  },
  { id: "coupons", label: "Cupons", icon: <Ticket className="h-3.5 w-3.5" /> },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function BuscaPage() {
  const navigate = useNavigate();
  const { navigateToBusiness } = useBusinessNavigation();
  const { activeProfile } = useSessionContext();
  const [activeFilter, setActiveFilter] = useState<SearchCategory>("all");

  const {
    query,
    setQuery,
    updateFilters,
    results,
    isLoading,
    clearQuery,
    suggestions,
    history,
  } = useGlobalSearch("", { category: activeFilter });

  const handleFilterChange = (filter: SearchCategory) => {
    setActiveFilter(filter);
    updateFilters({ category: filter });
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
              placeholder="Buscar empresas, profissionais..."
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
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all",
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
        ) : isLoading ? (
          <LoadingState />
        ) : results.total === 0 ? (
          <NoResultsState query={query} />
        ) : (
          <ResultsView
            results={results}
            activeFilter={activeFilter}
            onBusinessClick={navigateToBusiness}
            onProfessionalClick={(id) => navigate(`/servicos/${id}`)}
            onOpportunityClick={(opportunity) => {
              if (opportunity.source_kind !== "vaga") {
                void workOpportunityTelemetryService.trackOpportunityClick({
                  opportunityId: opportunity.id,
                  source: "search",
                  actorProfileId: activeProfile?.id,
                  actorUserId: activeProfile?.userId ?? null,
                  metadata: {
                    search_query: query,
                    search_category: activeFilter,
                    click_path: "global_search_results",
                  },
                });
                void workOpportunityTelemetryService.trackOpportunityOpen({
                  opportunityId: opportunity.id,
                  source: "search",
                  actorProfileId: activeProfile?.id,
                  actorUserId: activeProfile?.userId ?? null,
                  metadata: {
                    search_query: query,
                    search_category: activeFilter,
                    territory_name: opportunity.territory_name ?? null,
                  },
                });
              } else {
                void analyticsService.trackEvent({
                  event_type: "structured_vaga_click_search",
                  user_id: activeProfile?.userId ?? undefined,
                  metadata: {
                    vaga_id: opportunity.id,
                    search_query: query,
                    search_category: activeFilter,
                    click_path: "global_search_results",
                    territory_name: opportunity.territory_name ?? null,
                  },
                });
                void analyticsService.trackEvent({
                  event_type: "structured_vaga_open_search",
                  user_id: activeProfile?.userId ?? undefined,
                  metadata: {
                    vaga_id: opportunity.id,
                    search_query: query,
                    search_category: activeFilter,
                    territory_name: opportunity.territory_name ?? null,
                  },
                });
              }
              navigate(opportunity.target_url || `/oportunidades/${opportunity.id}?source=search`);
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
          Digite para buscar empresas, profissionais e muito mais
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
  onOpportunityClick,
}: {
  results: SearchResultsViewModel;
  activeFilter: SearchCategory;
  onBusinessClick: (business: BusinessSearchItem) => void;
  onProfessionalClick: (id: string) => void;
  onOpportunityClick: (opportunity: SearchResultsViewModel["opportunities"][number]) => void;
}) {
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
                onClick={() => onProfessionalClick(professional.id)}
              />
            ))}
          </Section>
        )}

        {results.opportunities.length > 0 && (
          <Section
            title="Oportunidades territoriais"
            icon={<BriefcaseBusiness className="h-4 w-4 text-primary" />}
          >
            {results.opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onClick={() => onOpportunityClick(opportunity)}
              />
            ))}
          </Section>
        )}
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

function OpportunityCard({
  opportunity,
  onClick,
}: {
  opportunity: SearchResultsViewModel["opportunities"][number];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent/50"
    >
      <p className="text-sm font-semibold">{opportunity.headline}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {opportunity.source_kind === "vaga" && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Vaga estruturada
          </Badge>
        )}
        <span>{opportunity.professional_category}</span>
        {opportunity.territory_name && (
          <>
            <span>·</span>
            <MapPin className="h-3 w-3" />
            <span>{opportunity.territory_name}</span>
          </>
        )}
        <span>·</span>
        <ClockDot urgency={opportunity.urgency} />
      </div>
      {opportunity.availability_notes && (
        <p className="mt-1 text-xs text-muted-foreground">
          Disponibilidade: {opportunity.availability_notes}
        </p>
      )}
      {opportunity.company_name && (
        <p className="mt-1 text-xs text-muted-foreground">
          Empresa: {opportunity.company_name}
        </p>
      )}
    </button>
  );
}

function ClockDot({ urgency }: { urgency: string }) {
  return <span>{urgency === "hoje" ? "Hoje" : urgency === "24h" ? "24h" : urgency === "semana" ? "Semana" : "Flexivel"}</span>;
}

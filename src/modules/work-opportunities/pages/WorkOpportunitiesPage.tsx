import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Filter,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  getOpportunityTypeLabel,
  getOpportunityUrgencyLabel,
  type WorkOpportunityCard,
  type WorkOpportunityType,
  type WorkOpportunityUrgency,
} from "@/core/work-opportunities";
import { workOpportunitiesService } from "@/core/work-opportunities/services/WorkOpportunitiesService";
import { workOpportunityTelemetryService } from "@/core/work-opportunities/services/WorkOpportunityTelemetryService";
import { useSessionContext } from "@/core/session";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

const OPPORTUNITY_TYPES: Array<{ value: WorkOpportunityType | "all"; label: string }> = [
  { value: "all", label: "Todos os tipos" },
  { value: "offering_work", label: getOpportunityTypeLabel("offering_work") },
  { value: "looking_for_work", label: getOpportunityTypeLabel("looking_for_work") },
  { value: "freelance", label: getOpportunityTypeLabel("freelance") },
  { value: "quick_job", label: getOpportunityTypeLabel("quick_job") },
  { value: "service_availability", label: getOpportunityTypeLabel("service_availability") },
];

const URGENCY_OPTIONS: Array<{ value: WorkOpportunityUrgency | "all"; label: string }> = [
  { value: "all", label: "Qualquer prazo" },
  { value: "hoje", label: getOpportunityUrgencyLabel("hoje") },
  { value: "24h", label: getOpportunityUrgencyLabel("24h") },
  { value: "semana", label: getOpportunityUrgencyLabel("semana") },
  { value: "flexivel", label: getOpportunityUrgencyLabel("flexivel") },
];

function getLifecycleLabel(card: WorkOpportunityCard): string {
  if (card.lifecycle_state === "expiring_soon") return "Expira em breve";
  if (card.is_recent) return "Recente";
  return "Ativa";
}

function formatPublishedDate(raw?: string | null): string {
  if (!raw) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(raw));
}

function OpportunityCard({
  item,
  onOpen,
}: {
  item: WorkOpportunityCard;
  onOpen: (item: WorkOpportunityCard) => void;
}) {
  return (
    <Card className="overflow-hidden border-border/80 bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <CardContent className="p-0">
        <button type="button" onClick={() => onOpen(item)} className="block w-full p-4 text-left sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{getOpportunityTypeLabel(item.opportunity_type)}</Badge>
                <Badge variant="outline">{getOpportunityUrgencyLabel(item.urgency)}</Badge>
                <Badge variant="secondary">{getLifecycleLabel(item)}</Badge>
              </div>
              <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground sm:text-lg">
                {item.headline}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              {item.professional_category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <MapPin className="h-3.5 w-3.5" />
              {item.territory_name ?? "Território local"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatPublishedDate(item.published_at ?? item.created_at)}
            </span>
          </div>

          {(item.professional_name || item.availability_notes) && (
            <div className="mt-4 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground sm:text-sm">
              {item.professional_name && (
                <p className="font-medium text-foreground">{item.professional_name}</p>
              )}
              {item.availability_notes && <p className="mt-1">{item.availability_notes}</p>}
            </div>
          )}
        </button>
      </CardContent>
    </Card>
  );
}

export default function WorkOpportunitiesPage() {
  const navigate = useNavigate();
  const { activeProfile } = useSessionContext();
  const communityHref = useHomeCommunityHref();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<WorkOpportunityType | "all">("all");
  const [urgency, setUrgency] = useState<WorkOpportunityUrgency | "all">("all");

  const normalizedSearch = search.trim();
  const filters = useMemo(
    () => ({
      search: normalizedSearch || undefined,
      opportunityType: type === "all" ? undefined : type,
      urgency: urgency === "all" ? undefined : urgency,
      limit: 60,
    }),
    [normalizedSearch, type, urgency],
  );

  const { data: opportunities = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["work-opportunities-public-list", filters],
    queryFn: () => workOpportunitiesService.listPublicOpportunityCards(filters),
  });

  const openOpportunity = (item: WorkOpportunityCard) => {
    void workOpportunityTelemetryService.trackOpportunityClick({
      opportunityId: item.id,
      professionalId: item.professional_id,
      territoryLocationId: item.territory_location_id,
      source: normalizedSearch ? "search" : "list",
      actorProfileId: activeProfile?.id,
      actorUserId: activeProfile?.userId ?? null,
      metadata: {
        entrypoint: "public_opportunities_page",
      },
    });

    navigate(`/oportunidades/${item.id}?source=${normalizedSearch ? "search" : "list"}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_32%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.62))]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="max-w-3xl">
            <Badge className="mb-4 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Circulação profissional local
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              Oportunidades perto de você
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Encontre trabalhos rápidos, freelas, serviços disponíveis e pedidos de contratação publicados na comunidade.
            </p>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por serviço, bairro, profissional..."
                className="h-11 pl-9"
              />
            </label>

            <label className="relative block">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={type}
                onChange={(event) => setType(event.target.value as WorkOpportunityType | "all")}
                className="h-11 w-full rounded-md border border-input bg-background px-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {OPPORTUNITY_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <select
              value={urgency}
              onChange={(event) => setUrgency(event.target.value as WorkOpportunityUrgency | "all")}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {URGENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Atualizar
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{opportunities.length} oportunidades ativas</p>
            <p className="text-xs text-muted-foreground">Dados vindos do módulo central de oportunidades.</p>
          </div>
          <Button type="button" onClick={() => navigate(communityHref)} className="w-full sm:w-auto">
            Publicar na comunidade
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : opportunities.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {opportunities.map((item) => (
              <OpportunityCard key={item.id} item={item} onOpen={openOpportunity} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="px-4 py-12 text-center">
              <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/70" />
              <h2 className="text-lg font-bold">Nenhuma oportunidade encontrada</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Ajuste os filtros ou publique uma demanda na comunidade para ativar a circulação local.
              </p>
              <Button type="button" className="mt-5" onClick={() => navigate(communityHref)}>
                Ver meu bairro
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

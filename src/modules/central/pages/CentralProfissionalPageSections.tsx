import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BriefcaseBusiness,
  CalendarCheck,
  Clock3,
  Eye,
  MessageSquare,
  Pencil,
  Plus,
  Star,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import type {
  Professional,
  ProfessionalLeadRecord,
  ProfessionalLeadStatus,
  ProfessionalServiceEngagementRecord,
  ProfessionalServiceEngagementStatus,
  ProfessionalStats,
} from "@/core/professional/types";
import {
  formatProfessionalCategory,
  formatProfessionalOperationalHours,
  getProfessionalStatsValue,
  resolveProfessionalPublicUrl,
} from "./CentralProfissionalPage.model";
import { centralRoutes } from "@/modules/central/routes/centralRoutes";

export function CentralProfessionalHeader({
  onCreateService,
}: {
  onCreateService: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Central Profissional</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil, disponibilidade, serviços publicados e sinais de demanda local.
        </p>
      </div>
      <Button onClick={onCreateService} className="w-full gap-2 sm:w-auto">
        <Plus className="h-4 w-4" />
        Novo serviço
      </Button>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof BriefcaseBusiness;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CentralProfessionalStatsGrid({
  activeServicesCount,
  averageRating,
  isLoading,
  servicesCount,
  stats,
}: {
  activeServicesCount: number;
  averageRating: number;
  isLoading: boolean;
  servicesCount: number;
  stats: ProfessionalStats | undefined;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        title="Serviços"
        value={servicesCount}
        description={`${activeServicesCount} recebendo clientes`}
        icon={BriefcaseBusiness}
      />
      <StatCard
        title="Avaliação média"
        value={averageRating.toFixed(1)}
        description="Média dos perfis publicados"
        icon={Star}
      />
      <StatCard
        title="Visualizações"
        value={getProfessionalStatsValue(stats, "total_views", "totalViews")}
        description="Servico principal"
        icon={Eye}
      />
      <StatCard
        title="Contatos"
        value={getProfessionalStatsValue(stats, "total_contacts", "totalContacts")}
        description="Sinais de demanda"
        icon={MessageSquare}
      />
    </div>
  );
}

function ServiceCard({ service }: { service: Professional }) {
  const publicUrl = resolveProfessionalPublicUrl(service);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <CardDescription>{formatProfessionalCategory(service.category)}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={service.is_accepting_clients ? "default" : "secondary"} className="gap-1">
              {service.is_accepting_clients ? (
                <ToggleRight className="h-3 w-3" />
              ) : (
                <ToggleLeft className="h-3 w-3" />
              )}
              {service.is_accepting_clients ? "Recebendo clientes" : "Pausado"}
            </Badge>
            {service.is_verified && (
              <Badge variant="outline" className="gap-1">
                <Award className="h-3 w-3" />
                Verificado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {service.description || "Sem descrição pública cadastrada."}
        </p>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Avaliação</p>
            <p className="font-semibold">{service.rating?.toFixed?.(1) ?? service.rating ?? 0}/5</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Reviews</p>
            <p className="font-semibold">{service.total_reviews ?? 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Trabalhos</p>
            <p className="font-semibold">{service.total_jobs ?? 0}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={centralRoutes.servicos.edit(service.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={publicUrl}>
              <Eye className="mr-2 h-4 w-4" />
              Ver público
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CentralProfessionalOperationPanel({
  error,
  isLoading,
  primaryService,
  services,
  onCreateService,
}: {
  error: unknown;
  isLoading: boolean;
  primaryService: Professional | null;
  services: Professional[];
  onCreateService: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operação profissional</CardTitle>
        <CardDescription>
          Estes dados vêm do SSOT `ProfessionalFacade`; não há contador fixo nem placeholder operacional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar seus serviços profissionais.
          </div>
        )}

        {!isLoading && !services.length && !error && (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum serviço publicado ainda</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Cadastre seu primeiro serviço para aparecer na busca local e receber contatos de moradores.
            </p>
            <Button onClick={onCreateService} className="mt-4 w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Cadastrar serviço
            </Button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {primaryService && <PrimaryServiceOperationalData service={primaryService} />}
      </CardContent>
    </Card>
  );
}

function PrimaryServiceOperationalData({ service }: { service: Professional }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">Dados operacionais do perfil</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Campos reais de `professional_data` usados na operação (sem placeholders).
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">Raio de atendimento</p>
          <p className="font-semibold">
            {typeof service.service_radius_km === "number"
              ? `${service.service_radius_km} km`
              : "Não informado"}
          </p>
        </div>
        <div className="rounded-lg border bg-background p-3 sm:col-span-2">
          <p className="text-xs text-muted-foreground">Areas de atendimento</p>
          <p className="font-semibold">
            {service.service_areas?.length
              ? service.service_areas.join(", ")
              : "Não informado"}
          </p>
        </div>
        <div className="rounded-lg border bg-background p-3 sm:col-span-3">
          <p className="text-xs text-muted-foreground">Disponibilidade</p>
          <p className="font-semibold">
            {formatProfessionalOperationalHours(service.available_hours)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LeadPipeline({
  leads,
  isLoading,
  error,
  isUpdating,
  isReplying,
  isQuoting,
  onStatusChange,
  onReply,
  onQuote,
}: {
  leads: ProfessionalLeadRecord[];
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  isReplying: boolean;
  isQuoting: boolean;
  onStatusChange: (leadId: string, status: ProfessionalLeadStatus) => void;
  onReply: (leadId: string, message: string) => void;
  onQuote: (input: {
    leadId: string;
    amountCents: number;
    description: string;
    estimatedStartDate?: string;
    estimatedDuration?: string;
  }) => void;
}) {
  const [replyByLeadId, setReplyByLeadId] = useState<Record<string, string>>({});
  const [quoteByLeadId, setQuoteByLeadId] = useState<
    Record<string, { amount: string; description: string; startDate: string; duration: string }>
  >({});
  const openLeads = leads.filter((lead) =>
    ["new", "contacted", "quoted", "scheduled"].includes(lead.status),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos de orçamento</CardTitle>
        <CardDescription>
          Leads capturados pelo perfil público e roteados pelo SSOT profissional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Não foi possível carregar os pedidos agora.
          </div>
        )}
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={`lead-kpi-${idx}`} className="h-20 rounded-lg" />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Abertos</p>
            <p className="text-2xl font-semibold">{openLeads.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{leads.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Último pedido</p>
            <p className="text-sm font-semibold">
              {leads[0] ? new Date(leads[0].created_at).toLocaleDateString("pt-BR") : "Nenhum"}
            </p>
          </div>
        </div>

        {!isLoading && leads.length ? (
          <div className="space-y-3">
            {leads.slice(0, 3).map((lead) => {
              const quote = quoteByLeadId[lead.id];

              return (
                <div key={lead.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{lead.service_needed}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.requester_name}
                        {lead.neighborhood ? ` - ${lead.neighborhood}` : ""}
                      </p>
                    </div>
                    <Badge variant={lead.status === "new" ? "default" : "secondary"}>
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {lead.description}
                  </p>
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={replyByLeadId[lead.id] ?? ""}
                      onChange={(event) =>
                        setReplyByLeadId((current) => ({
                          ...current,
                          [lead.id]: event.target.value,
                        }))
                      }
                      placeholder="Responder ao cliente pelo funil do orçamento"
                      rows={2}
                    />
                    <Button
                      className="w-full sm:w-auto"
                      size="sm"
                      disabled={isReplying || !(replyByLeadId[lead.id] ?? "").trim()}
                      onClick={() => {
                        const message = replyByLeadId[lead.id] ?? "";
                        onReply(lead.id, message);
                        setReplyByLeadId((current) => ({ ...current, [lead.id]: "" }));
                      }}
                    >
                      Enviar resposta
                    </Button>
                  </div>
                  <LeadQuoteForm
                    disabled={isQuoting}
                    leadId={lead.id}
                    quote={quote}
                    setQuoteByLeadId={setQuoteByLeadId}
                    onQuote={onQuote}
                  />
                  <LeadStatusActions
                    disabled={isUpdating}
                    lead={lead}
                    onStatusChange={onStatusChange}
                  />
                </div>
              );
            })}
          </div>
        ) : !isLoading ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <Clock3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum pedido recebido ainda</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Quando um morador solicitar orçamento pelo perfil público, o pedido aparece aqui.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LeadQuoteForm({
  disabled,
  leadId,
  quote,
  setQuoteByLeadId,
  onQuote,
}: {
  disabled: boolean;
  leadId: string;
  quote?: { amount: string; description: string; startDate: string; duration: string };
  setQuoteByLeadId: React.Dispatch<
    React.SetStateAction<
      Record<string, { amount: string; description: string; startDate: string; duration: string }>
    >
  >;
  onQuote: (input: {
    leadId: string;
    amountCents: number;
    description: string;
    estimatedStartDate?: string;
    estimatedDuration?: string;
  }) => void;
}) {
  const updateQuote = (
    field: "amount" | "description" | "startDate" | "duration",
    value: string,
  ) => {
    setQuoteByLeadId((current) => ({
      ...current,
      [leadId]: {
        amount: current[leadId]?.amount ?? "",
        description: current[leadId]?.description ?? "",
        startDate: current[leadId]?.startDate ?? "",
        duration: current[leadId]?.duration ?? "",
        [field]: value,
      },
    }));
  };

  return (
    <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium">Proposta estruturada</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Valor R$"
          value={quote?.amount ?? ""}
          onChange={(event) => updateQuote("amount", event.target.value)}
        />
        <Input
          type="date"
          value={quote?.startDate ?? ""}
          onChange={(event) => updateQuote("startDate", event.target.value)}
        />
        <Input
        placeholder="Prazo estimado"
          value={quote?.duration ?? ""}
          onChange={(event) => updateQuote("duration", event.target.value)}
        />
      </div>
      <Textarea
        value={quote?.description ?? ""}
        onChange={(event) => updateQuote("description", event.target.value)}
        placeholder="Descreva escopo, inclusões e condições da proposta"
        rows={2}
      />
      <Button
        className="w-full sm:w-auto"
        size="sm"
        variant="secondary"
        disabled={disabled || !quote?.description?.trim() || !quote?.amount}
        onClick={() => {
          if (!quote) return;
          onQuote({
            leadId,
            amountCents: Math.round(Number(quote.amount) * 100),
            description: quote.description,
            estimatedStartDate: quote.startDate || undefined,
            estimatedDuration: quote.duration || undefined,
          });
          setQuoteByLeadId((current) => ({
            ...current,
            [leadId]: { amount: "", description: "", startDate: "", duration: "" },
          }));
        }}
      >
        Enviar proposta
      </Button>
    </div>
  );
}

function LeadStatusActions({
  disabled,
  lead,
  onStatusChange,
}: {
  disabled: boolean;
  lead: ProfessionalLeadRecord;
  onStatusChange: (leadId: string, status: ProfessionalLeadStatus) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {lead.status === "new" && (
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onStatusChange(lead.id, "contacted")}
        >
          Marcar contatado
        </Button>
      )}
      {lead.status !== "quoted" && lead.status !== "completed" && (
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onStatusChange(lead.id, "quoted")}
        >
          Orcamento enviado
          Orçamento enviado
        </Button>
      )}
      {lead.status !== "completed" && (
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onStatusChange(lead.id, "completed")}
        >
          Concluir
        </Button>
      )}
      {lead.status !== "archived" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={() => onStatusChange(lead.id, "archived")}
        >
          Arquivar
        </Button>
      )}
    </div>
  );
}

export function EngagementsPanel({
  engagements,
  isLoading,
  error,
  isUpdating,
  onStatusChange,
}: {
  engagements: ProfessionalServiceEngagementRecord[];
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  onStatusChange: (
    engagementId: string,
    status: ProfessionalServiceEngagementStatus,
  ) => void;
}) {
  const activeEngagements = engagements.filter((engagement) =>
    ["scheduled", "in_progress"].includes(engagement.status),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5" />
          Atendimentos contratados
        </CardTitle>
        <CardDescription>
          Execuções criadas automaticamente a partir de propostas aceitas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Não foi possível carregar os atendimentos agora.
          </div>
        )}
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={`engagement-kpi-${idx}`} className="h-20 rounded-lg" />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-2xl font-semibold">{activeEngagements.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{engagements.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Último contrato</p>
            <p className="text-sm font-semibold">
              {engagements[0]
                ? new Date(engagements[0].created_at).toLocaleDateString("pt-BR")
                : "Nenhum"}
            </p>
          </div>
        </div>

        {!isLoading && engagements.length ? (
          <div className="space-y-3">
            {engagements.slice(0, 5).map((engagement) => (
              <EngagementCard
                key={engagement.id}
                engagement={engagement}
                isUpdating={isUpdating}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        ) : !isLoading ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum atendimento contratado</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Quando o cliente aceitar uma proposta, o atendimento contratado aparece aqui.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EngagementCard({
  engagement,
  isUpdating,
  onStatusChange,
}: {
  engagement: ProfessionalServiceEngagementRecord;
  isUpdating: boolean;
  onStatusChange: (
    engagementId: string,
    status: ProfessionalServiceEngagementStatus,
  ) => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">{engagement.service_description}</p>
          <p className="text-sm text-muted-foreground">
            {[engagement.scheduled_date, engagement.estimated_duration]
              .filter(Boolean)
              .join(" - ") || "Agenda a combinar"}
          </p>
        </div>
        <Badge>{engagement.status}</Badge>
      </div>
      <p className="mt-2 text-lg font-semibold">
        {(engagement.amount_cents / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: engagement.currency || "BRL",
        })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {engagement.status === "scheduled" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => onStatusChange(engagement.id, "in_progress")}
          >
            Iniciar atendimento
          </Button>
        )}
        {engagement.status !== "completed" && engagement.status !== "cancelled" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => onStatusChange(engagement.id, "completed")}
          >
            Concluir
          </Button>
        )}
        {engagement.status !== "completed" && engagement.status !== "cancelled" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isUpdating}
            onClick={() => onStatusChange(engagement.id, "cancelled")}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

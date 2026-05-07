import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useSessionContext } from "@/core/session";
import { ProfessionalFacade, ProfessionalLeadService } from "@/core/professional/services";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import type {
  Professional,
  ProfessionalLeadRecord,
  ProfessionalLeadStatus,
  ProfessionalServiceEngagementRecord,
  ProfessionalServiceEngagementStatus,
  ProfessionalStats,
} from "@/core/professional/types";

function formatCategory(value: string | undefined) {
  if (!value) return "Servico";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function resolvePublicUrl(service: Professional): string {
  if (service.slug && service.state && service.city) {
    return ProfessionalUrlService.getCanonicalUrl({
      id: service.profile_id,
      slug: service.slug,
      state: service.state,
      city: service.city,
    });
  }

  return `/services/${service.id}`;
}

function ServiceCard({ service }: { service: Professional }) {
  const publicUrl = resolvePublicUrl(service);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <CardDescription>{formatCategory(service.category)}</CardDescription>
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
          {service.description || "Sem descricao publica cadastrada."}
        </p>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Avaliacao</p>
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
            <Link to={`/services/${service.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={publicUrl}>
              <Eye className="mr-2 h-4 w-4" />
              Ver publico
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadPipeline({
  leads,
  isUpdating,
  isReplying,
  isQuoting,
  onStatusChange,
  onReply,
  onQuote,
}: {
  leads: ProfessionalLeadRecord[];
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
        <CardTitle>Pedidos de orcamento</CardTitle>
        <CardDescription>
          Leads capturados pelo perfil publico e roteados pelo SSOT profissional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <p className="text-xs text-muted-foreground">Ultimo pedido</p>
            <p className="text-sm font-semibold">
              {leads[0] ? new Date(leads[0].created_at).toLocaleDateString("pt-BR") : "Nenhum"}
            </p>
          </div>
        </div>

        {leads.length ? (
          <div className="space-y-3">
            {leads.slice(0, 3).map((lead) => (
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
                    placeholder="Responder ao cliente pelo funil do orcamento"
                    rows={2}
                  />
                  <Button
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
                <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium">Proposta estruturada</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Valor R$"
                      value={quoteByLeadId[lead.id]?.amount ?? ""}
                      onChange={(event) =>
                        setQuoteByLeadId((current) => ({
                          ...current,
                          [lead.id]: {
                            amount: event.target.value,
                            description: current[lead.id]?.description ?? "",
                            startDate: current[lead.id]?.startDate ?? "",
                            duration: current[lead.id]?.duration ?? "",
                          },
                        }))
                      }
                    />
                    <Input
                      type="date"
                      value={quoteByLeadId[lead.id]?.startDate ?? ""}
                      onChange={(event) =>
                        setQuoteByLeadId((current) => ({
                          ...current,
                          [lead.id]: {
                            amount: current[lead.id]?.amount ?? "",
                            description: current[lead.id]?.description ?? "",
                            startDate: event.target.value,
                            duration: current[lead.id]?.duration ?? "",
                          },
                        }))
                      }
                    />
                    <Input
                      placeholder="Prazo estimado"
                      value={quoteByLeadId[lead.id]?.duration ?? ""}
                      onChange={(event) =>
                        setQuoteByLeadId((current) => ({
                          ...current,
                          [lead.id]: {
                            amount: current[lead.id]?.amount ?? "",
                            description: current[lead.id]?.description ?? "",
                            startDate: current[lead.id]?.startDate ?? "",
                            duration: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    value={quoteByLeadId[lead.id]?.description ?? ""}
                    onChange={(event) =>
                      setQuoteByLeadId((current) => ({
                        ...current,
                        [lead.id]: {
                          amount: current[lead.id]?.amount ?? "",
                          description: event.target.value,
                          startDate: current[lead.id]?.startDate ?? "",
                          duration: current[lead.id]?.duration ?? "",
                        },
                      }))
                    }
                    placeholder="Descreva escopo, inclusoes e condicoes da proposta"
                    rows={2}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      isQuoting ||
                      !quoteByLeadId[lead.id]?.description?.trim() ||
                      !quoteByLeadId[lead.id]?.amount
                    }
                    onClick={() => {
                      const quote = quoteByLeadId[lead.id];
                      if (!quote) return;
                      onQuote({
                        leadId: lead.id,
                        amountCents: Math.round(Number(quote.amount) * 100),
                        description: quote.description,
                        estimatedStartDate: quote.startDate || undefined,
                        estimatedDuration: quote.duration || undefined,
                      });
                      setQuoteByLeadId((current) => ({
                        ...current,
                        [lead.id]: { amount: "", description: "", startDate: "", duration: "" },
                      }));
                    }}
                  >
                    Enviar proposta
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lead.status === "new" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => onStatusChange(lead.id, "contacted")}
                    >
                      Marcar contatado
                    </Button>
                  )}
                  {lead.status !== "quoted" && lead.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => onStatusChange(lead.id, "quoted")}
                    >
                      Orcamento enviado
                    </Button>
                  )}
                  {lead.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => onStatusChange(lead.id, "completed")}
                    >
                      Concluido
                    </Button>
                  )}
                  {lead.status !== "archived" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isUpdating}
                      onClick={() => onStatusChange(lead.id, "archived")}
                    >
                      Arquivar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <Clock3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum pedido recebido ainda</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Quando um morador solicitar orcamento pelo perfil publico, o pedido aparece aqui.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EngagementsPanel({
  engagements,
  isUpdating,
  onStatusChange,
}: {
  engagements: ProfessionalServiceEngagementRecord[];
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
          Execucoes criadas automaticamente a partir de propostas aceitas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <p className="text-xs text-muted-foreground">Ultimo contrato</p>
            <p className="text-sm font-semibold">
              {engagements[0]
                ? new Date(engagements[0].created_at).toLocaleDateString("pt-BR")
                : "Nenhum"}
            </p>
          </div>
        </div>

        {engagements.length ? (
          <div className="space-y-3">
            {engagements.slice(0, 5).map((engagement) => (
              <div key={engagement.id} className="rounded-lg border p-3">
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
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum atendimento contratado</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Quando o cliente aceitar uma proposta, o atendimento contratado aparece aqui.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CentralProfissionalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profiles } = useSessionContext();

  const professionalProfile = profiles?.find((profile) => profile.profileType === "professional");
  const professionalProfileId = professionalProfile?.id ?? "";

  const servicesQuery = useQuery({
    queryKey: ["central-professional", "services", professionalProfileId],
    queryFn: () => ProfessionalFacade.queries.getServicesByProfile(professionalProfileId),
    enabled: Boolean(professionalProfileId),
    staleTime: 60_000,
  });

  const primaryService = servicesQuery.data?.[0] ?? null;

  const statsQuery = useQuery<ProfessionalStats>({
    queryKey: ["central-professional", "stats", primaryService?.id],
    queryFn: () => ProfessionalFacade.queries.getStats(primaryService!.id),
    enabled: Boolean(primaryService?.id),
    staleTime: 60_000,
  });

  const leadsQuery = useQuery({
    queryKey: ["central-professional", "leads", primaryService?.id],
    queryFn: async () => {
      const result = await ProfessionalLeadService.listLeadsForProfessional(primaryService!.id);
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: Boolean(primaryService?.id),
    staleTime: 30_000,
  });

  const engagementsQuery = useQuery({
    queryKey: ["central-professional", "engagements", primaryService?.id],
    queryFn: async () => {
      const result = await ProfessionalLeadService.listEngagementsForProfessional(primaryService!.id);
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: Boolean(primaryService?.id),
    staleTime: 30_000,
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({
      leadId,
      status,
    }: {
      leadId: string;
      status: ProfessionalLeadStatus;
    }) => {
      const result = await ProfessionalLeadService.updateLeadStatus({ leadId, status });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "leads", primaryService?.id],
      });
      toast({ title: "Status do pedido atualizado" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel atualizar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const sendLeadMessageMutation = useMutation({
    mutationFn: async ({
      leadId,
      message,
    }: {
      leadId: string;
      message: string;
    }) => {
      const result = await ProfessionalLeadService.sendMessage({ leadId, message });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "leads", primaryService?.id],
      });
      toast({ title: "Resposta enviada" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel responder",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const createLeadQuoteMutation = useMutation({
    mutationFn: async (input: {
      leadId: string;
      amountCents: number;
      description: string;
      estimatedStartDate?: string;
      estimatedDuration?: string;
    }) => {
      const result = await ProfessionalLeadService.createQuote(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "leads", primaryService?.id],
      });
      toast({ title: "Proposta enviada" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel enviar a proposta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateEngagementStatusMutation = useMutation({
    mutationFn: async ({
      engagementId,
      status,
    }: {
      engagementId: string;
      status: ProfessionalServiceEngagementStatus;
    }) => {
      const result = await ProfessionalLeadService.updateEngagementStatus({
        engagementId,
        status,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "engagements", primaryService?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "leads", primaryService?.id],
      });
      toast({ title: "Atendimento atualizado" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel atualizar o atendimento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const activeServices = useMemo(
    () => services.filter((service) => service.is_accepting_clients),
    [services],
  );
  const averageRating = useMemo(() => {
    if (!services.length) return 0;
    const total = services.reduce((sum, service) => sum + (Number(service.rating) || 0), 0);
    return total / services.length;
  }, [services]);

  const isLoading = servicesQuery.isLoading;
  const stats = statsQuery.data;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Central Profissional</h1>
          <p className="text-muted-foreground">
            Gerencie seu perfil, disponibilidade, servicos publicados e sinais de demanda local.
          </p>
        </div>
        <Button onClick={() => navigate("/services/cadastrar")} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo servico
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Servicos"
            value={services.length}
            description={`${activeServices.length} recebendo clientes`}
            icon={BriefcaseBusiness}
          />
          <StatCard
            title="Avaliacao media"
            value={averageRating.toFixed(1)}
            description="Media dos perfis publicados"
            icon={Star}
          />
          <StatCard
            title="Visualizacoes"
            value={stats?.total_views ?? 0}
            description="Servico principal"
            icon={Eye}
          />
          <StatCard
            title="Contatos"
            value={stats?.total_contacts ?? 0}
            description="Sinais de demanda"
            icon={MessageSquare}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Operacao profissional</CardTitle>
          <CardDescription>
            Estes dados vêm do SSOT `ProfessionalFacade`; nao ha contador fixo nem placeholder operacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {servicesQuery.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Nao foi possivel carregar seus servicos profissionais.
            </div>
          )}

          {!isLoading && !services.length && !servicesQuery.error && (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="font-semibold">Nenhum servico publicado ainda</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Cadastre seu primeiro servico para aparecer na busca local e receber contatos de moradores.
              </p>
              <Button onClick={() => navigate("/services/cadastrar")} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar servico
              </Button>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </CardContent>
      </Card>

      {!isLoading && primaryService && (
        <>
          <LeadPipeline
            leads={leadsQuery.data ?? []}
            isUpdating={updateLeadStatusMutation.isPending}
            isReplying={sendLeadMessageMutation.isPending}
            isQuoting={createLeadQuoteMutation.isPending}
            onStatusChange={(leadId, status) =>
              updateLeadStatusMutation.mutate({ leadId, status })
            }
            onReply={(leadId, message) =>
              sendLeadMessageMutation.mutate({ leadId, message })
            }
            onQuote={(input) => createLeadQuoteMutation.mutate(input)}
          />
          <EngagementsPanel
            engagements={engagementsQuery.data ?? []}
            isUpdating={updateEngagementStatusMutation.isPending}
            onStatusChange={(engagementId, status) =>
              updateEngagementStatusMutation.mutate({ engagementId, status })
            }
          />
        </>
      )}
    </div>
  );
}

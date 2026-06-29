import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarCheck,
  Clock3,
  MessageSquare,
  Send,
  Star,
} from "lucide-react";
import { ProfessionalLeadService } from "@/core/professional/services";
import { useSessionContext } from "@/core/session";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  new: "Recebido",
  contacted: "Contato iniciado",
  quoted: "Orcamento enviado",
  scheduled: "Agendado",
  completed: "Concluido",
  cancelled: "Cancelado",
  archived: "Arquivado",
};

function currency(amountCents: number, currencyCode?: string | null) {
  return (amountCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: currencyCode || "BRL",
  });
}

export default function ProfessionalLeadTrackingPage() {
  const { leadId = "" } = useParams<{ leadId: string }>();
  const { user } = useSessionContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const leadQuery = useQuery({
    queryKey: ["professional-lead", leadId],
    queryFn: async () => {
      const result = await ProfessionalLeadService.getLeadDetails(leadId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(user?.id && leadId),
  });

  const messagesQuery = useQuery({
    queryKey: ["professional-lead", leadId, "messages"],
    queryFn: async () => {
      const result = await ProfessionalLeadService.listMessages(leadId);
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: Boolean(user?.id && leadId),
  });

  const quotesQuery = useQuery({
    queryKey: ["professional-lead", leadId, "quotes"],
    queryFn: async () => {
      const result = await ProfessionalLeadService.listQuotes(leadId);
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: Boolean(user?.id && leadId),
  });

  const engagementQuery = useQuery({
    queryKey: ["professional-lead", leadId, "engagement"],
    queryFn: async () => {
      const result = await ProfessionalLeadService.getEngagementByLead(leadId);
      if (!result.success) throw new Error(result.error);
      return result.data ?? null;
    },
    enabled: Boolean(user?.id && leadId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const result = await ProfessionalLeadService.sendMessage({ leadId, message });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["professional-lead", leadId, "messages"] });
      toast({ title: "Mensagem enviada" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel enviar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({
      quoteId,
      status,
    }: {
      quoteId: string;
      status: "accepted" | "declined";
    }) => {
      const result = await ProfessionalLeadService.updateQuoteStatus({ quoteId, status });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-lead", leadId, "quotes"] });
      queryClient.invalidateQueries({ queryKey: ["professional-lead", leadId, "engagement"] });
      queryClient.invalidateQueries({ queryKey: ["professional-lead", leadId] });
      toast({ title: "Proposta atualizada" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel atualizar a proposta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const currentEngagement = engagementQuery.data;
      if (!currentEngagement) throw new Error("Atendimento nao encontrado");
      const result = await ProfessionalLeadService.submitEngagementReview({
        engagementId: currentEngagement.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      setReviewComment("");
      toast({ title: "Avaliacao enviada" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel avaliar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate();
  };

  if (!user) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 focus:outline-none sm:px-6"
      >
        <Card className="rounded-[24px] border-border/70 bg-card/80 shadow-[0_26px_100px_-70px_rgba(0,0,0,0.9)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Acompanhar orcamento</CardTitle>
            <CardDescription>
              Entre na sua conta para ver status, respostas e proposta do profissional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="h-11">
              <Link to="/login">Entrar</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (leadQuery.isLoading) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-screen w-full max-w-5xl space-y-4 px-4 py-6 focus:outline-none sm:px-6"
      >
        <Skeleton className="h-32 rounded-[24px]" />
        <Skeleton className="h-64 rounded-[24px]" />
        <Skeleton className="h-64 rounded-[24px]" />
      </main>
    );
  }

  if (leadQuery.error || !leadQuery.data) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 focus:outline-none sm:px-6"
      >
        <Card className="rounded-[24px] border-border/70 bg-card/80 shadow-[0_26px_100px_-70px_rgba(0,0,0,0.9)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Orcamento nao encontrado</CardTitle>
            <CardDescription>
              O pedido pode nao existir ou nao estar vinculado ao seu usuario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="h-11">
              <Link to="/servicos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para servicos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const lead = leadQuery.data;
  const messages = messagesQuery.data ?? [];
  const quotes = quotesQuery.data ?? [];
  const engagement = engagementQuery.data;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-screen w-full max-w-5xl space-y-4 px-4 py-5 focus:outline-none sm:space-y-5 sm:px-6 sm:py-6"
    >
      <Button asChild variant="ghost" size="sm" className="w-fit px-2">
        <Link to="/servicos">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Servicos
        </Link>
      </Button>

      <Card className="rounded-[24px] border-border/70 bg-card/78 shadow-[0_26px_100px_-70px_rgba(0,0,0,0.9)] backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Pedido em andamento
              </p>
              <CardTitle className="text-xl sm:text-2xl">{lead.service_needed}</CardTitle>
              <CardDescription className="max-w-2xl leading-6">
                {lead.professional?.professional_name ?? "Profissional"} recebeu seu pedido em{" "}
                {new Date(lead.created_at).toLocaleDateString("pt-BR")}.
              </CardDescription>
            </div>
            <Badge className="w-fit">{STATUS_LABELS[lead.status] ?? lead.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/35 p-3">
              <p className="text-xs text-muted-foreground">Solicitante</p>
              <p className="font-medium">{lead.requester_name}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/35 p-3">
              <p className="text-xs text-muted-foreground">Bairro</p>
              <p className="font-medium">{lead.neighborhood || "Nao informado"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/35 p-3">
              <p className="text-xs text-muted-foreground">Preferencia</p>
              <p className="font-medium">
                {[lead.preferred_date, lead.preferred_time_window].filter(Boolean).join(" - ") ||
                  "A combinar"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/35 p-4">
            <p className="mb-1 text-sm font-medium">Descricao do pedido</p>
            <p className="text-sm leading-6 text-muted-foreground">{lead.description}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <Card className="rounded-[24px] border-border/70 bg-card/78 shadow-[0_26px_100px_-70px_rgba(0,0,0,0.9)] backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Propostas recebidas</CardTitle>
              <CardDescription>
                Aceite ou recuse propostas estruturadas enviadas pelo profissional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quotesQuery.isLoading ? (
                <Skeleton className="h-24 rounded-2xl" />
              ) : quotes.length ? (
                quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="rounded-2xl border border-border/70 bg-background/35 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold">
                          {currency(quote.amount_cents, quote.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[quote.estimated_start_date, quote.estimated_duration]
                            .filter(Boolean)
                            .join(" - ") || "Prazo a combinar"}
                        </p>
                      </div>
                      <Badge className="w-fit">{quote.status}</Badge>
                    </div>

                    <p className="mt-3 text-sm leading-6">{quote.description}</p>

                    {quote.status === "sent" ? (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          className="h-11 sm:flex-1"
                          disabled={updateQuoteMutation.isPending}
                          onClick={() =>
                            updateQuoteMutation.mutate({
                              quoteId: quote.id,
                              status: "accepted",
                            })
                          }
                        >
                          Aceitar proposta
                        </Button>
                        <Button
                          className="h-11 sm:flex-1"
                          size="sm"
                          variant="outline"
                          disabled={updateQuoteMutation.isPending}
                          onClick={() =>
                            updateQuoteMutation.mutate({
                              quoteId: quote.id,
                              status: "declined",
                            })
                          }
                        >
                          Recusar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center">
                  <p className="font-medium">Nenhuma proposta estruturada ainda</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    O profissional pode enviar proposta com valor, prazo e escopo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-border/70 bg-card/78 shadow-[0_26px_100px_-70px_rgba(0,0,0,0.9)] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversa do orcamento
              </CardTitle>
              <CardDescription>
                As mensagens ficam vinculadas ao pedido, sem depender de contato solto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {messagesQuery.isLoading ? (
                <Skeleton className="h-20 rounded-2xl" />
              ) : messages.length ? (
                <div className="space-y-3">
                  {messages.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/70 bg-background/35 p-3"
                    >
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Badge
                          variant={item.sender_role === "professional" ? "default" : "secondary"}
                          className="w-fit"
                        >
                          {item.sender_role === "professional" ? "Profissional" : "Voce"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm leading-6">{item.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center">
                  <Clock3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Ainda nao ha mensagens</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Quando o profissional responder, a conversa aparece aqui.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Enviar nova mensagem ao profissional"
                  rows={4}
                />
                <Button
                  type="submit"
                  className="h-11 w-full sm:w-auto"
                  disabled={sendMessageMutation.isPending || !message.trim()}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendMessageMutation.isPending ? "Enviando..." : "Enviar mensagem"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {engagement ? (
            <Card className="rounded-[24px] border-border/70 bg-card/78 shadow-[0_26px_100px_-70px_rgba(0,0,0,0.9)] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Atendimento contratado
                </CardTitle>
                <CardDescription>
                  Esta execucao foi criada automaticamente quando a proposta foi aceita.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-border/70 bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium">{engagement.status}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Data prevista</p>
                    <p className="font-medium">{engagement.scheduled_date || "A combinar"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Valor contratado</p>
                    <p className="font-medium">
                      {currency(engagement.amount_cents, engagement.currency)}
                    </p>
                  </div>
                </div>

                {engagement.status === "completed" ? (
                  <div className="rounded-2xl border border-border/70 bg-background/35 p-4">
                    <p className="mb-3 font-medium">Avaliar atendimento concluido</p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          size="sm"
                          variant={reviewRating >= rating ? "default" : "outline"}
                          onClick={() => setReviewRating(rating)}
                        >
                          <Star className="mr-1 h-4 w-4" />
                          {rating}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Conte como foi o atendimento"
                      rows={4}
                    />
                    <Button
                      className="mt-3 h-11 w-full sm:w-auto"
                      disabled={submitReviewMutation.isPending}
                      onClick={() => submitReviewMutation.mutate()}
                    >
                      Enviar avaliacao
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}

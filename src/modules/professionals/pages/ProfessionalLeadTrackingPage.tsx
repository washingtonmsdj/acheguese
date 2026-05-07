import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck, Clock3, MessageSquare, Send, Star } from "lucide-react";
import { ProfessionalLeadService } from "@/core/professional/services";
import { useSessionContext } from "@/core/session";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-3xl px-4 py-10 focus:outline-none">
        <Card>
          <CardHeader>
            <CardTitle>Acompanhar orcamento</CardTitle>
            <CardDescription>
              Entre na sua conta para ver o status e as respostas do profissional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/login">Entrar</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (leadQuery.isLoading) {
    return (
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-4xl space-y-4 px-4 py-10 focus:outline-none">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </main>
    );
  }

  if (leadQuery.error || !leadQuery.data) {
    return (
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-3xl px-4 py-10 focus:outline-none">
        <Card>
          <CardHeader>
            <CardTitle>Orcamento nao encontrado</CardTitle>
            <CardDescription>
              O pedido pode nao existir ou nao estar vinculado ao seu usuario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
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
    <main id="main-content" tabIndex={-1} className="container mx-auto max-w-4xl space-y-6 px-4 py-8 focus:outline-none">
      <Button asChild variant="ghost" size="sm">
        <Link to="/servicos">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Servicos
        </Link>
      </Button>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{lead.service_needed}</CardTitle>
              <CardDescription>
                {lead.professional?.professional_name ?? "Profissional"} recebeu seu pedido em{" "}
                {new Date(lead.created_at).toLocaleDateString("pt-BR")}.
              </CardDescription>
            </div>
            <Badge>{STATUS_LABELS[lead.status] ?? lead.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Solicitante</p>
              <p className="font-medium">{lead.requester_name}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Bairro</p>
              <p className="font-medium">{lead.neighborhood || "Nao informado"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Preferencia</p>
              <p className="font-medium">
                {[lead.preferred_date, lead.preferred_time_window].filter(Boolean).join(" - ") ||
                  "A combinar"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-1 text-sm font-medium">Descricao do pedido</p>
            <p className="text-sm text-muted-foreground">{lead.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Propostas recebidas</CardTitle>
          <CardDescription>
            Aceite ou recuse propostas estruturadas enviadas pelo profissional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {quotesQuery.isLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : quotes.length ? (
            quotes.map((quote) => (
              <div key={quote.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-2xl font-semibold">
                      {(quote.amount_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: quote.currency || "BRL",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[quote.estimated_start_date, quote.estimated_duration]
                        .filter(Boolean)
                        .join(" - ") || "Prazo a combinar"}
                    </p>
                  </div>
                  <Badge>{quote.status}</Badge>
                </div>
                <p className="mt-3 text-sm">{quote.description}</p>
                {quote.status === "sent" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
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
                )}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="font-medium">Nenhuma proposta estruturada ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                O profissional pode enviar uma proposta com valor, prazo e escopo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {engagement && (
        <Card>
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
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{engagement.status}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Data prevista</p>
                <p className="font-medium">{engagement.scheduled_date || "A combinar"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Valor contratado</p>
                <p className="font-medium">
                  {(engagement.amount_cents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: engagement.currency || "BRL",
                  })}
                </p>
              </div>
            </div>
            {engagement.status === "completed" && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-2 font-medium">Avaliar atendimento concluido</p>
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
                  rows={3}
                />
                <Button
                  className="mt-3"
                  disabled={submitReviewMutation.isPending}
                  onClick={() => submitReviewMutation.mutate()}
                >
                  Enviar avaliacao
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversa do orcamento
          </CardTitle>
          <CardDescription>
            Mensagens ficam vinculadas ao pedido, nao a um contato publico solto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {messagesQuery.isLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : messages.length ? (
            <div className="space-y-3">
              {messages.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge variant={item.sender_role === "professional" ? "default" : "secondary"}>
                      {item.sender_role === "professional" ? "Profissional" : "Voce"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm">{item.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <Clock3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Ainda nao ha mensagens</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Quando o profissional responder, a conversa aparece aqui.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Enviar nova mensagem ao profissional"
              rows={3}
            />
            <Button type="submit" disabled={sendMessageMutation.isPending || !message.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {sendMessageMutation.isPending ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

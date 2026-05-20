import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Clock3,
  Eye,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  CheckCircle2,
} from "lucide-react";
import {
  getOpportunityTypeLabel,
  getOpportunityUrgencyLabel,
  type OpportunityFeedbackAnswer,
  type OpportunityOpenSource,
  type WorkOpportunityRecentItem,
} from "@/core/work-opportunities";
import { workOpportunitiesService } from "@/core/work-opportunities/services/WorkOpportunitiesService";
import { workOpportunityTelemetryService } from "@/core/work-opportunities/services/WorkOpportunityTelemetryService";
import { workOpportunityTrustService } from "@/core/work-opportunities/services/WorkOpportunityTrustService";
import { useSessionContext } from "@/core/session";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

function visibilityLabel(value: string): string {
  if (value === "public_unlisted") return "Publico nao listado";
  if (value === "private") return "Privado";
  return "Publico listado";
}

function statusLabel(value: string): string {
  if (value === "filled") return "Preenchida";
  if (value === "paused") return "Pausada";
  if (value === "expired") return "Expirada";
  if (value === "cancelled") return "Cancelada";
  return "Ativa";
}

function tryOpenContact(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    window.open(trimmed, "_blank", "noopener,noreferrer");
    return true;
  }

  const phone = trimmed.replace(/\D/g, "");
  if (phone.length >= 10) {
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
    return true;
  }

  return false;
}

function extractPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const phone = raw.replace(/\D/g, "");
  return phone.length >= 10 ? phone : null;
}

function RecentOpportunityItem({ item, onClick }: { item: WorkOpportunityRecentItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/40"
    >
      <p className="text-sm font-semibold">{item.headline}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {getOpportunityTypeLabel(item.opportunity_type)} - {item.territory_name ?? "Territorio"} - {getOpportunityUrgencyLabel(item.urgency)}
      </p>
    </button>
  );
}

export default function WorkOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeProfile } = useSessionContext();
  const [feedbackSaving, setFeedbackSaving] = useState<OpportunityFeedbackAnswer | null>(null);
  const [feedbackDone, setFeedbackDone] = useState<OpportunityFeedbackAnswer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["work-opportunity-detail", id],
    queryFn: async () => (id ? workOpportunitiesService.getPublicOpportunityDetail(id) : null),
    enabled: Boolean(id),
  });

  const { data: reputationByProfessional } = useQuery({
    queryKey: ["work-opportunity-professional-reputation", data?.professional_id],
    queryFn: () =>
      data?.professional_id
        ? workOpportunityTrustService.getProfessionalReputation(data.professional_id)
        : Promise.resolve(null),
    enabled: Boolean(data?.professional_id),
  });

  const source = (searchParams.get("source") as OpportunityOpenSource | null) ?? "direct";
  const primaryPortfolio = useMemo(() => data?.professional?.portfolio_images?.slice(0, 6) ?? [], [data]);
  const directPhone = useMemo(() => extractPhone(data?.contact_notes), [data?.contact_notes]);

  useEffect(() => {
    if (!data?.id) return;
    void workOpportunityTelemetryService.trackOpportunityView({
      opportunityId: data.id,
      professionalId: data.professional_id,
      territoryLocationId: data.territory_location_id,
      source,
      actorProfileId: activeProfile?.id,
      actorUserId: activeProfile?.userId ?? null,
      metadata: {
        view_path: "opportunity_detail",
      },
    });
  }, [activeProfile?.id, activeProfile?.userId, data?.id, data?.professional_id, data?.territory_location_id, source]);

  const handleCopyContact = async () => {
    if (!data?.contact_notes) return;
    try {
      await navigator.clipboard.writeText(data.contact_notes);
      toast.success("Contato copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o contato.");
    }
  };

  const handleFeedback = async (answer: OpportunityFeedbackAnswer) => {
    if (!data?.id || !data.professional_id) {
      toast.info("Feedback registrado.");
      return;
    }

    setFeedbackSaving(answer);
    try {
      void workOpportunityTelemetryService.trackFeedbackLoopAnswer(
        {
          opportunityId: data.id,
          professionalId: data.professional_id,
          territoryLocationId: data.territory_location_id,
          source,
          actorProfileId: activeProfile?.id,
          actorUserId: activeProfile?.userId ?? null,
        },
        answer,
      );

      const trustResult = await workOpportunityTrustService.submitFeedback({
        answer,
        opportunityId: data.id,
        professionalId: data.professional_id,
        subjectProfileId: data.author_profile_id,
        actorProfileId: activeProfile?.id ?? null,
      });

      if (!trustResult.ok) {
        toast.error(trustResult.error ?? "Nao foi possivel salvar feedback.");
        return;
      }

      setFeedbackDone(answer);
      toast.success("Feedback enviado. Obrigado por fortalecer a confianca local.");
    } finally {
      setFeedbackSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:py-8">
        <Card className="mx-auto max-w-4xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Carregando oportunidade...</CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:py-8">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">Oportunidade nao encontrada ou nao esta mais publica.</p>
            <Button onClick={() => navigate("/comunidade?tab=oportunidades")}>Voltar para oportunidades</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-6">
        <Button variant="ghost" className="mb-3 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Card className="mb-4 border-primary/20 bg-primary/5 sm:mb-5">
          <CardHeader className="pb-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>{getOpportunityTypeLabel(data.opportunity_type)}</Badge>
              <Badge variant="outline">{statusLabel(data.status)}</Badge>
              <Badge variant="outline">{visibilityLabel(data.visibility)}</Badge>
              {data.is_recent && <Badge>Ativo recentemente</Badge>}
              {data.lifecycle_state === "expiring_soon" && <Badge variant="outline">Expira em breve</Badge>}
            </div>
            <CardTitle className="text-xl sm:text-2xl">{data.headline}</CardTitle>
            <p className="text-sm text-muted-foreground">{data.professional_category}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{data.description}</p>
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {data.territory_name ?? "Territorio local"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-4 w-4" />
                {getOpportunityUrgencyLabel(data.urgency)}
              </span>
              {data.availability_notes && <span>Disponibilidade: {data.availability_notes}</span>}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4 sm:space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Contato e interesse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{data.contact_notes ?? "Contato nao informado. Use mensagem direta no perfil do autor."}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="gap-2"
                    onClick={() => {
                      void workOpportunityTelemetryService.trackInterestConversion({
                        opportunityId: data.id,
                        professionalId: data.professional_id,
                        territoryLocationId: data.territory_location_id,
                        source,
                        actorProfileId: activeProfile?.id,
                        actorUserId: activeProfile?.userId ?? null,
                      });

                      const opened = tryOpenContact(data.contact_notes);
                      if (opened) {
                        void workOpportunityTelemetryService.trackContactStarted({
                          opportunityId: data.id,
                          professionalId: data.professional_id,
                          territoryLocationId: data.territory_location_id,
                          source,
                          actorProfileId: activeProfile?.id,
                          actorUserId: activeProfile?.userId ?? null,
                        });
                      } else {
                        toast.info("Nao foi possivel abrir automaticamente. Copie o contato.");
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Tenho interesse
                  </Button>
                  {directPhone && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        void workOpportunityTelemetryService.trackContactStarted({
                          opportunityId: data.id,
                          professionalId: data.professional_id,
                          territoryLocationId: data.territory_location_id,
                          source,
                          actorProfileId: activeProfile?.id,
                          actorUserId: activeProfile?.userId ?? null,
                          metadata: { channel: "phone" },
                        });
                        window.open(`tel:${directPhone}`, "_self");
                      }}
                    >
                      Ligar agora
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      void workOpportunityTelemetryService.trackInterestConversion({
                        opportunityId: data.id,
                        professionalId: data.professional_id,
                        territoryLocationId: data.territory_location_id,
                        source,
                        actorProfileId: activeProfile?.id,
                        actorUserId: activeProfile?.userId ?? null,
                        metadata: { conversion_type: "quick_interest" },
                      });
                      toast.success("Interesse rapido enviado. Continue o contato direto.");
                    }}
                  >
                    Interesse rapido
                  </Button>
                  <Button variant="outline" onClick={handleCopyContact}>
                    Copiar contato
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Retorno rapido da comunidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Essa oportunidade ajudou sua circulacao profissional?</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={feedbackSaving !== null} onClick={() => handleFeedback("helped")}>
                    Ajudou
                  </Button>
                  <Button variant="outline" disabled={feedbackSaving !== null} onClick={() => handleFeedback("found_someone")}>
                    Consegui encontrar alguem
                  </Button>
                  <Button variant="outline" disabled={feedbackSaving !== null} onClick={() => handleFeedback("service_done")}>
                    Servico realizado
                  </Button>
                  <Button variant="ghost" disabled={feedbackSaving !== null} onClick={() => handleFeedback("no_help")}>
                    Ainda nao ajudou
                  </Button>
                </div>
                {feedbackDone && (
                  <p className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Feedback salvo para melhorar relevancia e confianca territorial.
                  </p>
                )}
              </CardContent>
            </Card>

            {data.recent_opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Oportunidades recentes do perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.recent_opportunities.map((item) => (
                    <RecentOpportunityItem
                      key={item.id}
                      item={item}
                      onClick={() => {
                        void workOpportunityTelemetryService.trackOpportunityClick({
                          opportunityId: item.id,
                          professionalId: item.professional_id,
                          territoryLocationId: item.territory_location_id,
                          source: "direct",
                          actorProfileId: activeProfile?.id,
                          actorUserId: activeProfile?.userId ?? null,
                          metadata: {
                            click_path: "detail_recent_opportunities",
                          },
                        });
                        navigate(`/oportunidades/${item.id}?source=direct`);
                      }}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4 sm:space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BriefcaseBusiness className="h-5 w-5" />
                  Perfil profissional relacionado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {data.professional ? (
                  <>
                    <div>
                      <p className="font-semibold">{data.professional.professional_name ?? "Perfil profissional"}</p>
                      <p className="text-muted-foreground">{data.professional.service_category ?? data.professional_category}</p>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{data.professional.is_accepting_clients ? "Disponivel para servicos" : "Indisponivel no momento"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span>Reputacao pratica: {data.professional.rating ?? 0} ({data.professional.total_reviews} avaliacoes)</span>
                    </div>

                    {reputationByProfessional && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          Contexto desta profissao: {reputationByProfessional.avg_rating.toFixed(1)} media em{" "}
                          {reputationByProfessional.total_feedback} retornos recentes.
                        </p>
                        <p>
                          Taxa de retorno positivo: {reputationByProfessional.total_feedback > 0
                            ? Math.round((reputationByProfessional.positive_feedback / reputationByProfessional.total_feedback) * 100)
                            : 0}%
                        </p>
                      </div>
                    )}

                    {data.professional.availability_notes && (
                      <p className="text-muted-foreground">{data.professional.availability_notes}</p>
                    )}

                    {data.professional.description && (
                      <p className="text-muted-foreground">{data.professional.description}</p>
                    )}

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        void workOpportunityTelemetryService.trackProfessionalProfileClick({
                          opportunityId: data.id,
                          professionalId: data.professional?.id,
                          territoryLocationId: data.territory_location_id,
                          source,
                          actorProfileId: activeProfile?.id,
                          actorUserId: activeProfile?.userId ?? null,
                        });
                        navigate(`/services/${data.professional?.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      Ver perfil profissional
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">Esta oportunidade ainda nao esta vinculada a um perfil profissional estruturado.</p>
                )}
              </CardContent>
            </Card>

            {primaryPortfolio.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Fotos e portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {primaryPortfolio.map((imageUrl) => (
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt="Portfolio profissional"
                        className="h-24 w-full rounded-lg border object-cover"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


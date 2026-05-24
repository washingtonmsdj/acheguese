import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import {
  getOpportunityUrgencyLabel,
} from "@/core/work-opportunities";
import { workOpportunitiesService } from "@/core/work-opportunities/services/WorkOpportunitiesService";
import { workOpportunityTelemetryService } from "@/core/work-opportunities/services/WorkOpportunityTelemetryService";
import { useSessionContext } from "@/core/session";
import type { Professional } from "@/core/professional/types";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Wrench, Plus, Edit, Eye, Loader2, MapPin, Phone, Clock3 } from "lucide-react";

interface UserServicesSectionProps {
  profileId: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
}

export function UserServicesSection({
  profileId,
  onCreateNew,
  onEdit,
}: UserServicesSectionProps) {
  const navigate = useNavigate();
  const { activeProfile } = useSessionContext();

  const { data: services = [], isLoading } = useQuery<Professional[]>({
    queryKey: ["profile-services", profileId],
    queryFn: async () => {
      if (!profileId) {
        return [];
      }
      return ProfessionalService.getServicesByProfile(profileId);
    },
    enabled: Boolean(profileId),
  });

  const { data: recentOpportunities = [] } = useQuery({
    queryKey: ["profile-recent-work-opportunities", profileId],
    queryFn: () => workOpportunitiesService.listRecentOpportunitiesByAuthorProfile(profileId, 6),
    enabled: Boolean(profileId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Wrench className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Nenhum serviço cadastrado</h3>
          <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
            Receba oportunidades na sua região com um perfil profissional leve e territorial.
          </p>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Ativar primeiro serviço
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold font-display">
          <Wrench className="h-5 w-5" />
          Profissões e serviços
          <Badge variant="secondary">{services.length}</Badge>
        </h2>

        <Button onClick={onCreateNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo serviço
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-primary/80">Profissões vinculadas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em uma profissão para abrir o perfil estruturado e conectado ao módulo de serviços.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                key={`service-chip-${service.professional_data_id || service.id}`}
                type="button"
                className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary/50"
                onClick={() => {
                  void workOpportunityTelemetryService.trackProfessionalProfileClick({
                    opportunityId: "profile-professions",
                    professionalId: service.professional_data_id || service.id,
                    source: "profile_professions",
                    actorProfileId: activeProfile?.id,
                    actorUserId: activeProfile?.userId ?? activeProfile?.userId ?? null,
                    metadata: { entrypoint: "profile_professions_chip" },
                  });
                  navigate(`/servicos/${service.professional_data_id || service.id}`);
                }}
              >
                {service.category || "serviço"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-300/30 bg-emerald-500/5">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Ative sua circulacao local</p>
          <div className="mt-2 grid gap-1 text-sm">
            <p>Receba oportunidades na sua região.</p>
            <p>Mostre seus trabalhos para pessoas próximas.</p>
            <p>Apareça para quem procura profissionais no seu bairro.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.professional_data_id || service.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">{service.name || "Sem nome"}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {service.description || "Sem descrição"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={service.is_accepting_clients ? "default" : "secondary"}>
                        {service.is_accepting_clients ? "Disponível" : "Indisponível"}
                      </Badge>
                      {service.visibility && (
                        <Badge variant="outline">{service.visibility.replace("_", " ")}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Wrench className="h-3 w-3" />
                      {service.category || "Sem categoria"}
                    </Badge>

                    {service.city && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {service.city}
                      </Badge>
                    )}

                    {service.phone && (
                      <Badge variant="outline" className="gap-1">
                        <Phone className="h-3 w-3" />
                        {service.phone}
                      </Badge>
                    )}
                  </div>

                  {service.total_reviews > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{service.total_reviews} avaliações</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void workOpportunityTelemetryService.trackProfessionalProfileClick({
                        opportunityId: "profile-professions",
                        professionalId: service.professional_data_id || service.id,
                        source: "profile_professions",
                        actorProfileId: activeProfile?.id,
                        actorUserId: activeProfile?.userId ?? activeProfile?.userId ?? null,
                        metadata: { entrypoint: "profile_professions_card" },
                      });
                      navigate(`/servicos/${service.professional_data_id || service.id}`);
                    }}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver perfil
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(service.id)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Oportunidades recentes</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/oportunidades")}>Explorar</Button>
          </div>

          {recentOpportunities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma oportunidade recente vinculada ao seu perfil pessoal.
            </p>
          ) : (
            <div className="space-y-2">
              {recentOpportunities.map((opportunity) => (
                <button
                  key={opportunity.id}
                  type="button"
                  onClick={() => {
                    void workOpportunityTelemetryService.trackOpportunityOpen({
                      opportunityId: opportunity.id,
                      professionalId: opportunity.professional_id,
                      territoryLocationId: opportunity.territory_location_id,
                      source: "profile_professions",
                      actorProfileId: activeProfile?.id,
                      actorUserId: activeProfile?.userId ?? activeProfile?.userId ?? null,
                      metadata: {
                        open_path: "profile_recent_opportunities",
                      },
                    });
                    navigate(`/oportunidades/${opportunity.id}?source=profile_professions`);
                  }}
                  className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50"
                >
                  <p className="text-sm font-semibold">{opportunity.headline}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {opportunity.professional_category} - {opportunity.territory_name ?? "Territorio"}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {getOpportunityUrgencyLabel(opportunity.urgency)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import type { Professional } from "@/core/professional/types";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Wrench, Plus, Edit, Eye, Loader2, MapPin, Phone } from "lucide-react";

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
            Cadastre seus serviços profissionais e seja encontrado por clientes na sua região.
          </p>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Primeiro Serviço
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
          Meus Serviços
          <Badge variant="secondary">{services.length}</Badge>
        </h2>

        <Button onClick={onCreateNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">
                      {service.name || "Sem nome"}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {service.description || "Sem descrição"}
                    </p>
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
    </div>
  );
}

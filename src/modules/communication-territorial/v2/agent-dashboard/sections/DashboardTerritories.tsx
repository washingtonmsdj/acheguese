import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, Users, FileText, CheckCircle2 } from "lucide-react";
import type { DashboardChannelView, DashboardTerritoryView } from "../../types/agentDashboardViewModels";

interface DashboardTerritoriesProps {
  channel: DashboardChannelView;
  territories: DashboardTerritoryView[];
}

export function DashboardTerritories({ channel, territories }: DashboardTerritoriesProps) {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Territórios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Áreas de cobertura autorizadas
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <MapPin className="h-4 w-4 mr-2" />
          Solicitar Novo Território
        </Button>
      </div>

      {/* Territories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {territories.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum território autorizado</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Solicite autorização para cobrir territórios específicos
              </p>
              <Button>
                <MapPin className="h-4 w-4 mr-2" />
                Solicitar Território
              </Button>
            </CardContent>
          </Card>
        ) : (
          territories.map((territory) => (
            <Card key={territory.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{territory.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {territory.city}, {territory.state}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>0 seguidores</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>0 publicações</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}

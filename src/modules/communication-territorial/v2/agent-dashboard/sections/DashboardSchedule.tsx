import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Calendar, Clock, FileText } from "lucide-react";
import type { DashboardChannelView, DashboardPublicationView } from "../../types/agentDashboardViewModels";

interface DashboardScheduleProps {
  channel: DashboardChannelView;
  publications: DashboardPublicationView[];
}

export function DashboardSchedule({ channel, publications }: DashboardScheduleProps) {
  const publicationItems = publications as unknown as Array<Record<string, unknown>>;
  const scheduledPublications = publicationItems.filter((pub) => typeof pub.scheduled_at === "string" && pub.scheduled_at.length > 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Calendário Editorial</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Publicações agendadas e planejamento
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Calendar className="h-4 w-4 mr-2" />
          Agendar Publicação
        </Button>
      </div>

      {/* Calendar View Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Mensal</CardTitle>
          <CardDescription>Calendário de publicações agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center space-y-2">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Calendário interativo em desenvolvimento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Publications */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Publicações</CardTitle>
          <CardDescription>Publicações agendadas para os próximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledPublications.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma publicação agendada</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Agende publicações para automatizar sua estratégia editorial
              </p>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Primeira Publicação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledPublications.map((pub) => (
                <div key={String(pub.id)} className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground mb-1 truncate">{typeof pub.title === "string" ? pub.title : "Sem titulo"}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{typeof pub.scheduled_at === "string" ? new Date(pub.scheduled_at).toLocaleDateString("pt-BR") : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{typeof pub.scheduled_at === "string" ? new Date(pub.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="self-start">Agendado</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

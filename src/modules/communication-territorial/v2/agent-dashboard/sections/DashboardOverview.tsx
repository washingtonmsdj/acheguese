import { Card, CardContent } from "@/shared/components/ui/card";
import { Users, FileText, MapPin, TrendingUp } from "lucide-react";
import type {
  DashboardChannelView,
  DashboardPublicationView,
  DashboardTerritoryView,
} from "../../types/agentDashboardViewModels";

interface DashboardOverviewProps {
  channel: DashboardChannelView;
  publications: DashboardPublicationView[];
  territories: DashboardTerritoryView[];
  drafts: DashboardPublicationView[];
}

export function DashboardOverview({ channel, publications, territories, drafts }: DashboardOverviewProps) {
  const stats = [
    { label: "Publicações", value: publications.length, icon: FileText, trend: "+12%", color: "text-primary" },
    { label: "Territórios", value: territories.length, icon: MapPin, trend: "Ativo", color: "text-primary" },
    { label: "Rascunhos", value: drafts.length, icon: FileText, trend: "Pendente", color: "text-primary" },
    { label: "Alcance", value: "12.5k", icon: Users, trend: "+8%", color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
        <p className="mt-1 text-sm text-muted-foreground">Resumo da atividade do canal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend}
                  </span>
                </div>
                <p className="mb-1 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

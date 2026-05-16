import { Card, CardContent } from "@/shared/components/ui/card";
import { Users, FileText, MapPin, TrendingUp } from "lucide-react";
import type { CommunicationChannel, CommunicationPublication } from "@/core/communication-territorial";

interface DashboardOverviewProps {
  channel: CommunicationChannel;
  publications: CommunicationPublication[];
  territories: any[];
  drafts: CommunicationPublication[];
}

export function DashboardOverview({ channel, publications, territories, drafts }: DashboardOverviewProps) {
  const stats = [
    { label: "Publicações", value: publications.length, icon: FileText, trend: "+12%", color: "text-blue-600" },
    { label: "Territórios", value: territories.length, icon: MapPin, trend: "Ativo", color: "text-green-600" },
    { label: "Rascunhos", value: drafts.length, icon: FileText, trend: "Pendente", color: "text-yellow-600" },
    { label: "Alcance", value: "12.5k", icon: Users, trend: "+8%", color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
        <p className="text-sm text-muted-foreground mt-1">Resumo da atividade do canal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend}
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { TrendingUp, Eye, Heart, Share2 } from "lucide-react";
import type {
  DashboardChannelView,
  DashboardPublicationView,
  DashboardTerritoryView,
} from "../../types/agentDashboardViewModels";

interface DashboardSidebarStatsProps {
  channel: DashboardChannelView;
  publications: DashboardPublicationView[];
  territories: DashboardTerritoryView[];
}

export function DashboardSidebarStats({ channel, publications, territories }: DashboardSidebarStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Estatisticas Rapidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Visualizacoes</span>
            </div>
            <span className="text-sm font-bold">45.2k</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Engajamento</span>
            </div>
            <span className="text-sm font-bold">3.8k</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Compartilhamentos</span>
            </div>
            <span className="text-sm font-bold">1.2k</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Crescimento</span>
            </div>
            <span className="text-sm font-bold text-primary">+8.2%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FileText, Edit, Trash2, Send, Clock } from "lucide-react";
import type {
  DashboardActivityView,
  DashboardChannelView,
  DashboardPublicationView,
} from "../../types/agentDashboardViewModels";

interface DashboardSidebarActivityProps {
  channel: DashboardChannelView;
  publications: DashboardPublicationView[];
}

function formatActivityTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildRecentActivity(publications: DashboardPublicationView[]): DashboardActivityView[] {
  return publications
    .slice()
    .sort(
      (left, right) =>
        new Date(right.updated_at ?? right.created_at).getTime() -
        new Date(left.updated_at ?? left.created_at).getTime(),
    )
    .slice(0, 5)
    .map((publication) => ({
      type: publication.status === "draft" ? "draft" : "publish",
      title: publication.title || "Publicacao sem titulo",
      time: formatActivityTime(publication.updated_at ?? publication.created_at),
    }));
}

export function DashboardSidebarActivity({ channel, publications }: DashboardSidebarActivityProps) {
  const recentActivity = buildRecentActivity(publications);
  const channelName = channel.public_name || channel.name || "canal";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Atividade Recente</CardTitle>
        <CardDescription>Ultimas publicacoes em {channelName}</CardDescription>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <div className="py-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {activity.type === "publish" && <Send className="h-4 w-4 text-primary" />}
                  {activity.type === "edit" && <Edit className="h-4 w-4 text-primary" />}
                  {activity.type === "delete" && <Trash2 className="h-4 w-4 text-destructive" />}
                  {activity.type === "draft" && <FileText className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

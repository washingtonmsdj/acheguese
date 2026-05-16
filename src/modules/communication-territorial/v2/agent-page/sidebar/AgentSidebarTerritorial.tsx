import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin } from "lucide-react";
import type { AgentChannelView, AgentTerritoryView } from "../../types/agentPageViewModels";

export function AgentSidebarTerritorial({ territories }: { territories: AgentTerritoryView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Territórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {territories.slice(0, 5).map((territory) => (
            <div key={territory.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{territory.location?.name || "Território"}</span>
              <Badge variant="outline" className="text-xs">Ativo</Badge>
            </div>
          ))}
          {territories.length > 5 && (
            <p className="text-xs text-muted-foreground pt-2">
              +{territories.length - 5} territórios
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentSidebarActivity({ agent }: { agent: AgentChannelView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Últimas ações do portal</p>
      </CardContent>
    </Card>
  );
}

export function AgentSidebarSocial({ agent }: { agent: AgentChannelView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes Sociais</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Links para redes sociais</p>
      </CardContent>
    </Card>
  );
}

export function AgentSidebarNewsletter({ agent }: { agent: AgentChannelView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsletter</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Receba atualizações por email</p>
      </CardContent>
    </Card>
  );
}

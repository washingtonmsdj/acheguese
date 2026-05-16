import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, Radio } from "lucide-react";
import type { AgentChannelView, AgentTerritoryView } from "../../types/agentPageViewModels";

export function AgentActiveCoverage({
  territories,
  agent,
}: {
  territories: AgentTerritoryView[];
  agent: AgentChannelView;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Radio className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Cobertura Ativa</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {territories.slice(0, 8).map((territory) => (
          <Card key={territory.id} className="p-4 hover:shadow-lg transition-all hover:border-primary/50">
            <div className="space-y-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">{territory.location?.name || "Território"}</h3>
              <Badge variant={territory.can_publish ? "default" : "secondary"} className="text-xs">
                {territory.can_publish ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

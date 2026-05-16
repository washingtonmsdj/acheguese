import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Info, ShieldCheck, TrendingUp } from "lucide-react";
import type { AgentChannelView } from "../../types/agentPageViewModels";

export function AgentSidebarAbout({ agent }: { agent: AgentChannelView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Sobre o Portal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {agent.description || "Portal de comunicação territorial dedicado a informar e conectar a comunidade local."}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={agent.verification_status === "verified" ? "default" : "secondary"} className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              {agent.verification_status === "verified" ? "Verificado" : "Em análise"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confiabilidade</span>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {agent.reliability_score}/100
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

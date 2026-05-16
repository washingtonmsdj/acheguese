import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ExternalLink, Eye, Settings, HelpCircle, FileText } from "lucide-react";
import type { DashboardChannelView } from "../../types/agentDashboardViewModels";

interface DashboardSidebarQuickLinksProps {
  channel: DashboardChannelView;
}

export function DashboardSidebarQuickLinks({ channel }: DashboardSidebarQuickLinksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Links Rápidos</CardTitle>
        <CardDescription>Acesso rápido a recursos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          asChild
        >
          <a href={`/comunicacao/agente/${channel.slug}`} target="_blank" rel="noopener noreferrer">
            <Eye className="h-4 w-4 mr-2" />
            Ver Página Pública
            <ExternalLink className="h-3 w-3 ml-auto" />
          </a>
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
        >
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
        >
          <FileText className="h-4 w-4 mr-2" />
          Guia Editorial
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Central de Ajuda
        </Button>
      </CardContent>
    </Card>
  );
}

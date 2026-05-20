import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { MessageSquare, Phone, Mail, Globe, Send } from "lucide-react";
import type { AgentChannelView } from "../../types/agentPageViewModels";

export function AgentSidebarContact({ agent }: { agent: AgentChannelView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full gap-2" size="lg">
          <Send className="h-4 w-4" />
          Enviar Informação
        </Button>
        
        <Button variant="outline" className="w-full gap-2">
          <Phone className="h-4 w-4" />
          WhatsApp
        </Button>
        
        <div className="pt-3 border-t space-y-2">
          <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Mail className="h-4 w-4" />
            <span>contato@portal.com</span>
          </a>
          <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Globe className="h-4 w-4" />
            <span>www.portal.com.br</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

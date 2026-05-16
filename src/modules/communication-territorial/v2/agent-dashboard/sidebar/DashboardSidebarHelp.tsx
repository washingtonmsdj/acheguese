import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { HelpCircle, BookOpen, MessageCircle, Video } from "lucide-react";

export function DashboardSidebarHelp() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Precisa de Ajuda?
        </CardTitle>
        <CardDescription>Recursos para começar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start hover:bg-primary/10"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Documentação
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start hover:bg-primary/10"
        >
          <Video className="h-4 w-4 mr-2" />
          Tutoriais em Vídeo
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start hover:bg-primary/10"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Suporte
        </Button>

        <div className="pt-3 border-t border-primary/20">
          <p className="text-xs text-muted-foreground mb-2">
            Novo no sistema?
          </p>
          <Button size="sm" className="w-full">
            Tour Guiado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

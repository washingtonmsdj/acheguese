import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { FileText, Edit, Trash2, Send } from "lucide-react";
import type { CommunicationChannel, CommunicationPublication } from "@/core/communication-territorial";

interface DashboardDraftsProps {
  channel: CommunicationChannel;
  drafts: CommunicationPublication[];
  territories: any[];
}

export function DashboardDrafts({ channel, drafts, territories }: DashboardDraftsProps) {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rascunhos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Publicações em andamento
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <FileText className="h-4 w-4 mr-2" />
          Novo Rascunho
        </Button>
      </div>

      {/* Drafts List */}
      <div className="space-y-4">
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum rascunho</h3>
              <p className="text-sm text-muted-foreground">
                Seus rascunhos aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          drafts.map((draft) => (
            <Card key={draft.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                      {draft.title || "Sem título"}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {draft.content || "Sem conteúdo"}
                    </p>
                  </div>
                  <Badge variant="outline">Rascunho</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>Última edição: {new Date(draft.updated_at || draft.created_at).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="default" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Continuar Editando
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="h-3 w-3 mr-1" />
                    Publicar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive ml-auto">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}

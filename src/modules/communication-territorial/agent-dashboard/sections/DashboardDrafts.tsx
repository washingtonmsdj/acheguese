import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { FileText, Edit, Trash2, Send } from "lucide-react";
import type {
  DashboardChannelView,
  DashboardPublicationView,
  DashboardTerritoryView,
} from "../../types/agentDashboardViewModels";

interface DashboardDraftsProps {
  channel: DashboardChannelView;
  drafts: DashboardPublicationView[];
  territories: DashboardTerritoryView[];
}

export function DashboardDrafts({ channel, drafts, territories }: DashboardDraftsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rascunhos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Publicacoes em andamento</p>
        </div>
        <Button className="w-full sm:w-auto">
          <FileText className="mr-2 h-4 w-4" />
          Novo Rascunho
        </Button>
      </div>

      <div className="space-y-4">
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhum rascunho</h3>
              <p className="text-sm text-muted-foreground">Seus rascunhos aparecerao aqui</p>
            </CardContent>
          </Card>
        ) : (
          drafts.map((draft) => {
            const raw = draft as unknown as Record<string, unknown>;
            const content = typeof raw.content === "string" ? raw.content : "";
            return (
              <Card key={draft.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 truncate text-lg font-semibold text-foreground">{draft.title || "Sem titulo"}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{content || "Sem conteudo"}</p>
                    </div>
                    <Badge variant="outline">Rascunho</Badge>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Ultima edicao: {new Date(draft.updated_at || draft.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="default" size="sm" className="w-full sm:w-auto">
                      <Edit className="mr-1 h-3 w-3" />
                      Continuar Editando
                    </Button>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Send className="mr-1 h-3 w-3" />
                      Publicar
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive sm:ml-auto sm:w-auto">
                      <Trash2 className="mr-1 h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

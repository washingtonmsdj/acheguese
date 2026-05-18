import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { FileText, Eye, MessageSquare, Share2, Edit, Trash2, MoreVertical } from "lucide-react";
import type {
  DashboardChannelView,
  DashboardPublicationView,
  DashboardTerritoryView,
} from "../../types/agentDashboardViewModels";

interface DashboardPublicationsProps {
  channel: DashboardChannelView;
  publications: DashboardPublicationView[];
  territories: DashboardTerritoryView[];
}

export function DashboardPublications({ channel, publications, territories }: DashboardPublicationsProps) {
  const publicationItems = publications as unknown as Array<Record<string, unknown>>;
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Publicações</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as publicações do canal
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <FileText className="h-4 w-4 mr-2" />
          Nova Publicação
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Todas</Button>
            <Button variant="ghost" size="sm">Notícias</Button>
            <Button variant="ghost" size="sm">Eventos</Button>
            <Button variant="ghost" size="sm">Alertas</Button>
            <Button variant="ghost" size="sm">Multimídia</Button>
          </div>
        </CardContent>
      </Card>

      {/* Publications List */}
      <div className="space-y-4">
        {publications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma publicação</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Comece criando sua primeira publicação
              </p>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Criar Publicação
              </Button>
            </CardContent>
          </Card>
        ) : (
          publicationItems.map((pub) => (
            <Card key={String(pub.id)} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  
                  {/* Thumbnail */}
                  {typeof pub.media_url === "string" && pub.media_url.length > 0 && (
                    <div className="w-full sm:w-32 h-32 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img 
                        src={pub.media_url}
                        alt={typeof pub.title === "string" ? pub.title : "Publicacao"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                          {typeof pub.title === "string" ? pub.title : "Sem titulo"}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {typeof pub.content === "string" ? pub.content : ""}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>0 visualizações</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>0 comentários</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        <span>0 compartilhamentos</span>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {typeof pub.created_at === "string" ? new Date(pub.created_at).toLocaleDateString("pt-BR") : "N/A"}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Eye className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive sm:ml-auto sm:w-auto">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}

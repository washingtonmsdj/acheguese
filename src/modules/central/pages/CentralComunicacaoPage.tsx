import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Eye,
  BarChart3,
  Users,
  MapPin,
  FileText,
  Shield,
  ExternalLink,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { CommunicationTerritorialService } from "@/core/communication-territorial";
import type { CommunicationDashboardView } from "@/core/communication-territorial/types/communicationDashboard";
import { communicationRoutes } from "@/core/communication-territorial/routes/communicationRoutes";
import { centralRoutes } from "@/modules/central/routes/centralRoutes";

type ManagedChannel = {
  id: string;
  public_name: string;
  slug: string;
  verification_status?: string | null;
  reliability_score?: number | null;
  status?: string | null;
  followers?: number | null;
  publications?: number | null;
};

function formatChannelStatus(status?: string | null) {
  if (!status) return "Indefinido";
  if (status === "active") return "Ativo";
  if (status === "inactive") return "Inativo";
  if (status === "paused") return "Pausado";
  return status;
}

function getDashboardRoute(slug: string, view?: CommunicationDashboardView) {
  return centralRoutes.comunicacao.channelWithView(slug, view);
}

export default function CentralComunicacaoPage() {
  const navigate = useNavigate();

  const { data: channels, isLoading } = useQuery<ManagedChannel[]>({
    queryKey: ["central", "communication", "channels"],
    queryFn: async () => {
      const realChannels = await CommunicationTerritorialService.listManagedChannels();
      return (realChannels ?? []) as ManagedChannel[];
    },
  });

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
      <header className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Comunicação territorial</h1>
        <p className="text-sm text-muted-foreground sm:text-base lg:text-lg">
          Gerencie seus canais de comunicação territorial. Para publicar conteúdo, acesse a página pública do canal.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 sm:py-20">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent sm:h-9 sm:w-9" />
            <p className="text-sm text-muted-foreground">Carregando canais...</p>
          </div>
        </div>
      ) : null}

      {!isLoading && (!channels || channels.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center sm:py-20">
            <div className="mx-auto max-w-md space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">Nenhum canal encontrado</h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Você ainda não gerencia nenhum canal de comunicação territorial.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button className="w-full sm:w-auto" onClick={() => navigate(communicationRoutes.request)}>
                  Solicitar novo canal
                </Button>
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => navigate(communicationRoutes.home)}>
                  Explorar comunicação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && channels && channels.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-xl">{channel.public_name}</CardTitle>
                    <CardDescription className="mt-1">/{channel.slug}</CardDescription>
                  </div>
                  {channel.verification_status === "verified" ? (
                    <Badge className="flex-shrink-0" variant="default">
                      <Shield className="mr-1 h-3 w-3" />
                      Verificado
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 border-y py-3 sm:gap-4 sm:py-4">
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-foreground sm:text-2xl">{channel.publications ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Publicações</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-foreground sm:text-2xl">
                      {(channel.followers ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Seguidores</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Score {channel.reliability_score ?? 0}</Badge>
                  <Badge variant="outline">{formatChannelStatus(channel.status)}</Badge>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full gap-2 text-sm"
                    size="sm"
                    onClick={() => navigate(communicationRoutes.agent(channel.slug))}
                  >
                    <Eye className="h-4 w-4" />
                    Ver página pública
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-sm"
                    onClick={() => navigate(getDashboardRoute(channel.slug))}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Dashboard e analytics
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-1.5 text-xs sm:gap-2"
                    onClick={() => navigate(getDashboardRoute(channel.slug, "publications"))}
                  >
                    <FileText className="h-3 w-3" />
                    <span className="truncate">Publicações</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-1.5 text-xs sm:gap-2"
                    onClick={() => navigate(getDashboardRoute(channel.slug, "analytics"))}
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span className="truncate">Analytics</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-1.5 text-xs sm:gap-2"
                    onClick={() => navigate(getDashboardRoute(channel.slug, "territories"))}
                  >
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">Territórios</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-1.5 text-xs sm:gap-2"
                    onClick={() => navigate(getDashboardRoute(channel.slug, "team"))}
                  >
                    <Users className="h-3 w-3" />
                    <span className="truncate">Equipe</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!isLoading && channels && channels.length > 0 ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              Como publicar conteúdo?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Para criar e publicar conteúdo, acesse a <strong>página pública do canal</strong>. Lá você encontra um
              composer social-first, semelhante a Instagram e Facebook.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Postagens rápidas
              </Badge>
              <Badge variant="outline" className="text-xs">
                Notícias
              </Badge>
              <Badge variant="outline" className="text-xs">
                Eventos
              </Badge>
              <Badge variant="outline" className="text-xs">
                Alertas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Use este painel da Central para gestão, analytics, configurações e moderação.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

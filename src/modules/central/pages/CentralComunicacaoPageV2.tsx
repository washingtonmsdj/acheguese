import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Eye,
  BarChart3,
  Users,
  Settings,
  MapPin,
  FileText,
  Calendar,
  Shield,
  ExternalLink,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { CommunicationTerritorialService } from "@/core/communication-territorial";
import { nordesteAgents } from "@/core/communication-territorial/v2/mocks";

export default function CentralComunicacaoPageV2() {
  const navigate = useNavigate();

  const { data: channels, isLoading } = useQuery({
    queryKey: ["central", "communication", "channels-v2"],
    queryFn: async () => {
      // Tentar buscar canais reais primeiro
      const realChannels = await CommunicationTerritorialService.listManagedChannels();

      // Se nao houver canais reais, usar mocks para desenvolvimento
      if (!realChannels || realChannels.length === 0) {
        // Converter agentes mockados para formato de canal
        return nordesteAgents.map(agent => ({
          id: agent.id,
          public_name: agent.name,
          slug: agent.id,
          verification_status: agent.verified ? 'verified' : 'pending',
          reliability_score: agent.verified ? 95 : 70,
          status: 'active',
          followers: agent.followers,
          publications: 0,
        }));
      }

      return realChannels;
    },
  });

  return (
    <div className="container mx-auto max-w-7xl space-y-6 sm:space-y-8 px-4 sm:px-6 py-6 sm:py-8 lg:px-8">

      {/* Header */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Comunicacao territorial
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          Gerencie seus canais de comunicacao territorial. Para publicar conteudo, acesse a pagina publica do canal.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 sm:py-20">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-8 w-8 sm:h-9 sm:w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando canais...</p>
          </div>
        </div>
      )}

      {/* No Channels State */}
      {!isLoading && (!channels || channels.length === 0) && (
        <Card>
          <CardContent className="py-12 sm:py-20 text-center">
            <div className="mx-auto max-w-md space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Nenhum canal encontrado</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Voce ainda nao gerencia nenhum canal de comunicacao territorial.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/comunicacao/solicitar")}>
                  Solicitar Novo Canal
                </Button>
                <Button variant="outline" onClick={() => navigate("/comunicacao")}>
                  Explorar comunicacao
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channels Grid */}
      {!isLoading && channels && channels.length > 0 && (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate">{channel.public_name}</CardTitle>
                    <CardDescription className="mt-1">/{channel.slug}</CardDescription>
                  </div>
                  {channel.verification_status === "verified" && (
                    <Badge variant="default" className="flex-shrink-0">
                      <Shield className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 py-3 sm:py-4 border-y">
                  <div className="space-y-1">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{channel.publications || 0}</p>
                    <p className="text-xs text-muted-foreground">Publicacoes</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{channel.followers?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">Seguidores</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Score {channel.reliability_score}
                  </Badge>
                  <Badge variant="outline">
                    {channel.status}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full gap-2 text-sm"
                    size="sm"
                    onClick={() => navigate(`/comunicacao/agente/${channel.slug}`)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver pagina publica
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-sm"
                    onClick={() => navigate(`/central/comunicacao/${channel.slug}`)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Dashboard & Analytics
                  </Button>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 sm:gap-2 justify-start text-xs"
                    onClick={() => navigate(`/central/comunicacao/${channel.slug}`)}
                  >
                    <FileText className="h-3 w-3" />
                    <span className="truncate">Publicacoes</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 sm:gap-2 justify-start text-xs"
                    onClick={() => navigate(`/central/comunicacao/${channel.slug}`)}
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span className="truncate">Analytics</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 sm:gap-2 justify-start text-xs"
                    onClick={() => navigate(`/central/comunicacao/${channel.slug}`)}
                  >
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">Territorios</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 sm:gap-2 justify-start text-xs"
                    onClick={() => navigate(`/central/comunicacao/${channel.slug}`)}
                  >
                    <Users className="h-3 w-3" />
                    <span className="truncate">Equipe</span>
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      {!isLoading && channels && channels.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Como publicar conteudo?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Para criar e publicar conteudo, acesse a <strong>pagina publica do canal</strong>.
              La voce encontrara um composer social-first, similar ao Instagram ou Facebook.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">Postagens rapidas</Badge>
              <Badge variant="outline" className="text-xs">Noticias</Badge>
              <Badge variant="outline" className="text-xs">Eventos</Badge>
              <Badge variant="outline" className="text-xs">Alertas</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Use este painel (Central) apenas para gestao, analytics, configuracoes e moderacao.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

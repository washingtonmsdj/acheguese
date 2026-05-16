import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Calendar, 
  Globe, 
  Mail, 
  Phone,
  Share2,
  Bookmark,
  ShieldCheck,
  TrendingUp,
  Radio,
  Newspaper,
  Tv,
  Megaphone,
  Heart
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CommunicationPageShell, PublicationCard } from "../components/CommunicationBlocks";
import { useCommunicationChannelPublicPage } from "../hooks";
import { buildCommunicationChannelPath } from "../services";
import { CHANNEL_KIND_LABELS } from "../types";

/**
 * CommunicationCompanyDetailsPage
 * 
 * Página de detalhes completa de uma empresa/canal de comunicação territorial.
 * Exibe informações detalhadas, publicações, territórios cobertos, estatísticas e contato.
 */
export default function CommunicationCompanyDetailsPage() {
  const { state = "", city = "", territorySlug = "", channelSlug = "" } = useParams();
  
  const { data, isLoading } = useCommunicationChannelPublicPage(channelSlug);

  const channel = data?.channel;
  const publications = data?.publications ?? [];
  const territories = data?.territories ?? [];

  // Ícone baseado no tipo de canal
  const getChannelIcon = (kind: string) => {
    switch (kind) {
      case "radio": return <Radio className="h-5 w-5" />;
      case "newspaper": return <Newspaper className="h-5 w-5" />;
      case "tv": return <Tv className="h-5 w-5" />;
      default: return <Megaphone className="h-5 w-5" />;
    }
  };

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{channel?.public_name ?? "Detalhes da Empresa"} | Comunicação Territorial | Achegue-se</title>
        <meta 
          name="description" 
          content={channel?.description ?? "Detalhes completos do canal de comunicação territorial"} 
        />
        <link
          rel="canonical"
          href={buildCommunicationChannelPath({ state, city, territorySlug, channelSlug })}
        />
      </Helmet>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando informações...</p>
          </div>
        </div>
      )}

      {/* Not Found State */}
      {!isLoading && !channel && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Canal não encontrado</h2>
            <p className="text-muted-foreground">O canal que você procura não existe ou está inativo.</p>
          </div>
          <Button asChild>
            <Link to="/comunicacao">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Comunicação
            </Link>
          </Button>
        </div>
      )}

      {/* Main Content */}
      {channel && (
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/comunicacao">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-background shadow-lg">
            {/* Cover Image */}
            <div className="h-48 sm:h-64 bg-gradient-to-r from-primary/20 to-primary/10 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTM2IDM0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            </div>

            {/* Profile Info */}
            <div className="relative px-6 pb-6 -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${channel.id}`} />
                    <AvatarFallback className="text-2xl sm:text-3xl font-bold">
                      {channel.public_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {channel.verification_status === "verified" && (
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary shadow-lg">
                      <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                        {channel.public_name}
                      </h1>
                      {channel.verification_status === "verified" && (
                        <Badge className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1">
                        {getChannelIcon(channel.channel_kind)}
                        {CHANNEL_KIND_LABELS[channel.channel_kind]}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Confiabilidade {channel.reliability_score}/100
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {territories.length} territórios
                      </Badge>
                    </div>
                  </div>

                  {channel.description && (
                    <p className="text-muted-foreground max-w-3xl">
                      {channel.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="gap-2">
                      <Heart className="h-4 w-4" />
                      Seguir
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Bookmark className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="publications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="publications">Publicações</TabsTrigger>
              <TabsTrigger value="about">Sobre</TabsTrigger>
              <TabsTrigger value="territories">Territórios</TabsTrigger>
            </TabsList>

            {/* Publications Tab */}
            <TabsContent value="publications" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Publicações Recentes</h2>
                <Badge variant="secondary">{publications.length} publicações</Badge>
              </div>

              {publications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma publicação ainda</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Este canal ainda não possui publicações. Volte mais tarde para ver as novidades.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {publications.map((publication) => (
                    <PublicationCard
                      key={publication.id}
                      publication={publication}
                      channelHref={buildCommunicationChannelPath({ state, city, territorySlug, channelSlug })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Website</p>
                          <a href="#" className="text-primary hover:underline">
                            www.exemplo.com.br
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Email</p>
                          <a href="#" className="text-primary hover:underline">
                            contato@exemplo.com.br
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Telefone</p>
                          <p className="text-muted-foreground">(00) 0000-0000</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Estatísticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">{publications.length}</p>
                        <p className="text-xs text-muted-foreground">Publicações</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">{territories.length}</p>
                        <p className="text-xs text-muted-foreground">Territórios</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">{channel.reliability_score}</p>
                        <p className="text-xs text-muted-foreground">Confiabilidade</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">
                          {channel.verification_status === "verified" ? "Sim" : "Não"}
                        </p>
                        <p className="text-xs text-muted-foreground">Verificado</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Sobre o Canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {channel.description || "Nenhuma descrição disponível."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Territories Tab */}
            <TabsContent value="territories" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Territórios Autorizados</h2>
                <Badge variant="secondary">{territories.length} territórios</Badge>
              </div>

              {territories.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum território cadastrado</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Este canal ainda não possui territórios autorizados para publicação.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {territories.map((territory) => (
                    <Card key={territory.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">
                              {territory.location?.full_name ?? 
                               territory.location?.name ?? 
                               territory.location_id}
                            </h3>
                          </div>
                          <Badge 
                            variant={territory.can_publish ? "default" : "outline"}
                            className="text-xs"
                          >
                            {territory.can_publish ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Desde {new Date(territory.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>

                        {territory.can_publish && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Autorizado para publicar conteúdo neste território
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </CommunicationPageShell>
  );
}

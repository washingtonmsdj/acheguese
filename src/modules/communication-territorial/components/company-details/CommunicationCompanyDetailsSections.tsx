import {
  Calendar,
  Globe,
  Mail,
  MapPin,
  Megaphone,
  Newspaper,
  Phone,
  Radio,
  ShieldCheck,
  TrendingUp,
  Tv,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { buildMailtoUrl } from "@/shared/utils/contactLinks";
import { PublicationCard } from "../CommunicationBlocks";
import {
  CHANNEL_KIND_LABELS,
  type CommunicationChannel,
  type CommunicationPublication,
} from "../../types";

type ChannelTerritory = {
  id: string;
  location_id: string;
  can_publish: boolean;
  created_at: string;
  location?: {
    id: string;
    name: string;
    full_name?: string | null;
  } | null;
};

function normalizeExternalUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getChannelIcon(kind: string) {
  switch (kind) {
    case "radio":
      return <Radio className="h-5 w-5" />;
    case "newspaper":
      return <Newspaper className="h-5 w-5" />;
    case "tv_bairro":
      return <Tv className="h-5 w-5" />;
    default:
      return <Megaphone className="h-5 w-5" />;
  }
}

export function CompanyDetailsHero({
  channel,
  territories,
}: {
  channel: CommunicationChannel;
  territories: ChannelTerritory[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
      <div className="h-40 bg-gradient-to-r from-primary/20 to-primary/10 sm:h-52" />
      <div className="relative -mt-16 px-5 pb-5 sm:-mt-20 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl sm:h-32 sm:w-32">
              <AvatarFallback className="text-2xl font-bold sm:text-3xl">
                {channel.public_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {channel.verification_status === "verified" ? (
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary shadow-lg">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
            ) : null}
          </div>

          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {channel.public_name}
                </h1>
                {channel.verification_status === "verified" ? (
                  <Badge className="gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Verificado
                  </Badge>
                ) : null}
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
                  {territories.length} territorios
                </Badge>
              </div>
            </div>

            {channel.description ? (
              <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                {channel.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompanyDetailsPublicationsTab({
  publications,
  channelHref,
}: {
  publications: CommunicationPublication[];
  channelHref: string;
}) {
  return publications.length === 0 ? (
    <Card className="border-border">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Newspaper className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Nenhuma publicacao ainda</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Este canal ainda nao possui publicacoes. Volte mais tarde para ver as novidades.
        </p>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-4">
      {publications.map((publication) => (
        <PublicationCard key={publication.id} publication={publication} channelHref={channelHref} />
      ))}
    </div>
  );
}

export function CompanyDetailsAboutTab({
  channel,
  publicationsCount,
  territoriesCount,
}: {
  channel: CommunicationChannel;
  publicationsCount: number;
  territoriesCount: number;
}) {
  const websiteUrl = channel.website_url ? normalizeExternalUrl(channel.website_url) : null;
  const hasContact =
    Boolean(websiteUrl) || Boolean(channel.contact_email) || Boolean(channel.contact_phone);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Informacoes de contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasContact ? (
            <div className="space-y-3 text-sm">
              {websiteUrl ? (
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Website</p>
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {channel.website_url}
                    </a>
                  </div>
                </div>
              ) : null}

              {channel.contact_email ? (
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href={buildMailtoUrl(channel.contact_email) ?? undefined}
                      className="text-primary hover:underline"
                    >
                      {channel.contact_email}
                    </a>
                  </div>
                </div>
              ) : null}

              {channel.contact_phone ? (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-muted-foreground">{channel.contact_phone}</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este canal ainda nao publicou dados de contato.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estatisticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{publicationsCount}</p>
              <p className="text-xs text-muted-foreground">Publicacoes</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{territoriesCount}</p>
              <p className="text-xs text-muted-foreground">Territorios</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{channel.reliability_score}</p>
              <p className="text-xs text-muted-foreground">Confiabilidade</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {channel.verification_status === "verified" ? "Sim" : "Nao"}
              </p>
              <p className="text-xs text-muted-foreground">Verificado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border md:col-span-2">
        <CardHeader>
          <CardTitle>Sobre o canal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-muted-foreground">
            {channel.description || "Nenhuma descricao disponivel."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function CompanyDetailsTerritoriesTab({
  territories,
}: {
  territories: ChannelTerritory[];
}) {
  return territories.length === 0 ? (
    <Card className="border-border">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Nenhum territorio cadastrado</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Este canal ainda nao possui territorios autorizados para publicacao.
        </p>
      </CardContent>
    </Card>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {territories.map((territory) => (
        <Card key={territory.id} className="border-border transition-shadow hover:shadow-md">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">
                  {territory.location?.full_name ?? territory.location?.name ?? territory.location_id}
                </h3>
              </div>
              <Badge variant={territory.can_publish ? "default" : "outline"} className="text-xs">
                {territory.can_publish ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Desde {new Date(territory.created_at).toLocaleDateString("pt-BR")}</span>
            </div>

            {territory.can_publish ? (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">
                  Autorizado para publicar conteudo neste territorio.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Link } from "react-router-dom";
import { Bell, Radio, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { CommunicationChannel, CommunicationPublication } from "../types";

type TerritorialSidebarProps = {
  title?: string;
  channels?: CommunicationChannel[];
  publications?: CommunicationPublication[];
};

export function TerritorialSidebar({
  title = "Comunicação territorial",
  channels = [],
  publications = [],
}: TerritorialSidebarProps) {
  const latestPublications = publications.slice(0, 5);
  const activeChannels = channels.slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Radio className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Tem um canal de comunicação?</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre portal, rádio, coletivo, jornal ou canal institucional para operar por território.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/comunicacao/solicitar">Cadastrar canal</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/35 p-3">
            <p className="text-2xl font-black text-foreground">{channels.length}</p>
            <p className="text-xs text-muted-foreground">canais ativos</p>
          </div>
          <div className="rounded-xl border bg-muted/35 p-3">
            <p className="text-2xl font-black text-foreground">{publications.length}</p>
            <p className="text-xs text-muted-foreground">publicações</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Radio className="h-5 w-5 text-primary" />
            Canais ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeChannels.length ? (
            activeChannels.map((channel) => (
              <Link
                key={channel.id}
                to={`/comunicacao/agente/${channel.slug}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
              >
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback>{channel.public_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{channel.public_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Confiabilidade {channel.reliability_score}/100
                  </p>
                </div>
                {channel.verification_status === "verified" ? (
                  <Badge variant="secondary" className="text-xs">verificado</Badge>
                ) : null}
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Nenhum canal ativo encontrado neste escopo.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Publicações recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {latestPublications.length ? (
            latestPublications.map((publication) => (
              <div key={publication.id} className="rounded-lg border bg-card p-3">
                <p className="line-clamp-2 text-sm font-medium text-foreground">{publication.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {publication.channel?.public_name ?? "Canal"}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Nenhuma publicação real disponível.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

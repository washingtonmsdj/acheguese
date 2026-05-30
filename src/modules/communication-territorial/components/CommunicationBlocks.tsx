import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { SafeLink } from "@/shared/components/security";
import {
  CHANNEL_KIND_LABELS,
  COMMUNICATION_CONTENT_FORMAT_LABELS,
  PUBLICATION_TYPE_LABELS,
  type CommunicationChannel,
  type CommunicationPublication,
} from "../types";

export function ChannelCard({
  channel,
  href,
}: {
  channel: CommunicationChannel;
  href?: string;
}) {
  return (
    <Card className="h-full border-border bg-card text-card-foreground shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{channel.public_name}</CardTitle>
          <Badge variant={channel.verification_status === "verified" ? "default" : "outline"}>
            {channel.verification_status === "verified" ? "Verificado" : "Em verificacao"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{CHANNEL_KIND_LABELS[channel.channel_kind]}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">{channel.description}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">Confiabilidade {channel.reliability_score}/100</Badge>
          <Badge variant="outline">Alertas em preparacao</Badge>
        </div>
        {href ? (
          <Button asChild size="sm" className="mt-2">
            <Link to={href}>Abrir canal</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PublicationCard({
  publication,
  channelHref,
}: {
  publication: CommunicationPublication;
  channelHref?: string;
}) {
  const date = publication.published_at ?? publication.created_at;
  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{PUBLICATION_TYPE_LABELS[publication.publication_type]}</Badge>
          <Badge variant="secondary">{COMMUNICATION_CONTENT_FORMAT_LABELS[publication.content_format]}</Badge>
          {publication.channel ? <span>{publication.channel.public_name}</span> : null}
          {publication.location ? <span>{publication.location.name}</span> : null}
          <span>{new Date(date).toLocaleDateString("pt-BR")}</span>
        </div>
        <CardTitle className="text-xl">{publication.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-4 text-sm text-muted-foreground">{publication.summary || publication.body}</p>
        {channelHref && publication.content_format === "article" ? (
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link to={channelHref}>Ler no canal</Link>
          </Button>
        ) : null}
        {publication.source_url ? (
          <SafeLink
            className="mt-3 inline-block text-sm font-medium text-primary"
            href={publication.source_url}
            target="_blank"
          >
            Fonte original
          </SafeLink>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CommunicationPageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>;
}

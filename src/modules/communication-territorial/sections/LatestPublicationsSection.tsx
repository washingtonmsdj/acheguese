import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PUBLICATION_TYPE_LABELS, type CommunicationPublication } from "../types";

type LatestPublicationsSectionProps = {
  publications?: CommunicationPublication[];
};

function formatTimeAgo(value?: string | null): string {
  if (!value) return "agora";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "data indisponível";

  const ms = Date.now() - time;
  const minutes = Math.max(1, Math.floor(ms / 60000));
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

export function LatestPublicationsSection({ publications = [] }: LatestPublicationsSectionProps) {
  const latestPublications = publications.slice(0, 6).map((publication) => ({
    id: publication.id,
    channelName: publication.channel?.public_name ?? "Canal",
    channelSlug: publication.channel?.slug,
    title: publication.title,
    summary: publication.summary ?? publication.body,
    category: PUBLICATION_TYPE_LABELS[publication.publication_type],
    time: formatTimeAgo(publication.published_at ?? publication.created_at),
  }));

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
            <Clock className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Últimas publicações</h2>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Conteúdo publicado por canais reais no escopo territorial selecionado.
          </p>
        </div>
      </div>

      {latestPublications.length ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {latestPublications.map((publication) => {
            const content = (
              <Card className="group h-full transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                <CardContent className="space-y-2 p-3 sm:space-y-2.5 sm:p-4 md:space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10">
                      <AvatarFallback>{publication.channelName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground sm:text-sm">{publication.channelName}</p>
                      <p className="text-xs text-muted-foreground">{publication.time}</p>
                    </div>
                  </div>
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:min-h-[3rem] sm:text-base">
                    {publication.title}
                  </h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{publication.summary}</p>
                  <Badge variant="secondary" className="text-xs">
                    {publication.category}
                  </Badge>
                </CardContent>
              </Card>
            );

            if (!publication.channelSlug) {
              return <article key={publication.id}>{content}</article>;
            }

            return (
              <Link key={publication.id} to={`/comunicacao/agente/${publication.channelSlug}`}>
                {content}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
          <p className="text-sm font-medium text-foreground">Nenhuma publicação encontrada.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Publicações aprovadas aparecerão aqui sem dados de exemplo.
          </p>
        </div>
      )}
    </section>
  );
}

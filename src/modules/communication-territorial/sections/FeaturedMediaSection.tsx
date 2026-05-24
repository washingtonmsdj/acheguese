import { Link } from "react-router-dom";
import { Eye, Radio, Users } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { CHANNEL_KIND_LABELS, type CommunicationChannel } from "../types";

type FeaturedMediaSectionProps = {
  channels?: CommunicationChannel[];
};

export function FeaturedMediaSection({ channels = [] }: FeaturedMediaSectionProps) {
  const featuredMedia = channels.slice(0, 4);

  return (
    <section className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Mídias em destaque</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Canais ativos cadastrados no SSOT de comunicação territorial.
          </p>
        </div>
        <Link to="/comunicacao/solicitar" className="text-sm font-medium text-primary hover:opacity-80">
          Cadastrar canal
        </Link>
      </div>

      {featuredMedia.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:gap-6">
          {featuredMedia.map((media) => (
            <Link key={media.id} to={`/comunicacao/agente/${media.slug}`}>
              <Card className="group h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary/40 hover:shadow-xl">
                <div className="relative flex h-36 items-end overflow-hidden bg-gradient-to-br from-primary/18 via-background to-secondary/12 p-4 sm:h-40 md:h-44 lg:h-48">
                  <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:24px_24px]" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-lg font-black text-foreground shadow-lg sm:h-16 sm:w-16">
                    {media.public_name.charAt(0)}
                  </div>
                  <div className="absolute right-3 top-3 flex gap-2">
                    {media.status === "active" ? (
                      <Badge className="border-0 bg-primary text-xs text-primary-foreground shadow-lg">
                        Ativo
                      </Badge>
                    ) : null}
                    {media.verification_status === "verified" ? (
                      <Badge className="border-0 bg-secondary text-xs text-secondary-foreground shadow-lg">
                        Verificado
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <CardContent className="p-3 sm:p-4 md:p-5">
                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-primary sm:text-base md:text-lg">
                        {media.public_name}
                      </h3>
                      <Badge variant="secondary" className="mt-1.5 text-xs">
                        <Radio className="mr-1 h-3 w-3" />
                        {CHANNEL_KIND_LABELS[media.channel_kind]}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{media.description}</p>
                    <div className="flex flex-wrap items-center gap-2 border-t pt-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm md:gap-4">
                      <span className="flex items-center gap-1 sm:gap-1.5">
                        <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                        Confiabilidade {media.reliability_score}/100
                      </span>
                      <span className="flex items-center gap-1 sm:gap-1.5">
                        <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                        {media.verification_status === "verified" ? "Verificado" : "Em validação"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
          <p className="text-sm font-medium text-foreground">Nenhum canal ativo encontrado.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quando canais forem aprovados, eles aparecerão aqui automaticamente.
          </p>
        </div>
      )}
    </section>
  );
}

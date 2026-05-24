import { Link } from "react-router-dom";
import { MapPin, Radio, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";
import type { CommunicationChannel } from "../types";

type HeroSectionProps = {
  title?: string;
  channels?: CommunicationChannel[];
  publicationsCount?: number;
};

export function HeroSection({ title, channels = [], publicationsCount = 0 }: HeroSectionProps) {
  const featuredChannels = channels.slice(0, 4);
  const communityHref = useHomeCommunityHref();

  return (
    <section className="relative overflow-hidden rounded-xl border bg-card p-4 text-card-foreground sm:rounded-2xl sm:p-6 md:rounded-3xl md:p-8 lg:p-12">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-4 sm:gap-2 md:mb-6 md:gap-3">
          <Badge variant="secondary" className="text-xs sm:text-sm">
            <Radio className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
            Comunicação territorial
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            <TrendingUp className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
            {channels.length} canais ativos
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            <Sparkles className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
            {publicationsCount} publicações
          </Badge>
        </div>

        <h1 className="mb-3 text-2xl font-bold leading-tight tracking-tight sm:mb-4 sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl xl:text-6xl">
          {title ?? "Descubra a voz do seu território"}
        </h1>

        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:mb-6 sm:text-base md:mb-8 md:text-lg lg:text-xl">
          Portais locais, rádios comunitárias, coletivos, jornais e canais institucionais organizados por cidade, bairro e território.
        </p>

        <div className="flex flex-col flex-wrap gap-2 sm:flex-row sm:gap-3 md:gap-4">
          <Button asChild size="lg" className="w-full text-sm sm:w-auto sm:text-base">
            <Link to="/comunicacao/solicitar">
              <Radio className="mr-2 h-4 w-4" />
              Cadastrar canal
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full text-sm sm:w-auto sm:text-base">
            <Link to={communityHref}>
              <MapPin className="mr-2 h-4 w-4" />
              Explorar comunidades
            </Link>
          </Button>
        </div>

        <div className="mt-6 border-t pt-4 sm:mt-8 sm:pt-6 md:mt-10 md:pt-8 lg:mt-12">
          <p className="mb-2 text-xs text-muted-foreground sm:mb-3 md:mb-4">
            Canais em destaque:
          </p>
          {featuredChannels.length ? (
            <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3">
              {featuredChannels.map((channel) => (
                <Link
                  key={channel.id}
                  to={`/comunicacao/agente/${channel.slug}`}
                  className="group flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 transition-colors hover:bg-accent sm:px-4"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-8 sm:w-8">
                    {channel.public_name.charAt(0)}
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="block truncate text-xs font-medium sm:text-sm">{channel.public_name}</span>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      Confiabilidade {channel.reliability_score}/100
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed bg-background/60 p-4 text-sm text-muted-foreground">
              Nenhum canal ativo encontrado para o escopo atual.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

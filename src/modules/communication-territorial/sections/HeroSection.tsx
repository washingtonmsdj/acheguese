import { Link } from "react-router-dom";
import { Radio, TrendingUp, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { portalNordesteMock, verifiedChannels } from "../mocks";

/**
 * HeroSection - Destaque editorial forte
 * 
 * Apresenta:
 * - Canais em alta
 * - Conteúdo trending
 * - CTA para comunicar sua comunidade
 * 
 * Integrado com: portal-nordeste.mock.ts
 */
export function HeroSection() {
  const stats = portalNordesteMock.stats;
  const featuredChannels = verifiedChannels.slice(0, 4);
  return (
    <section className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border bg-card p-4 sm:p-6 md:p-8 lg:p-12 text-card-foreground">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-6">
          <Badge variant="secondary" className="text-xs sm:text-sm">
            <Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
            Comunicação Territorial
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
            {stats.totalAgents} canais ativos
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
            {stats.totalPublications} publicações
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 leading-tight">
          Descubra a voz do seu território
        </h1>

        <p className="mb-4 sm:mb-6 md:mb-8 max-w-3xl text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-muted-foreground">
          Conecte-se com portais locais, rádios comunitárias, coletivos culturais e agentes de mídia que fazem a comunicação do seu bairro, cidade e região acontecer.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4">
          <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
            <MapPin className="h-4 w-4 mr-2" />
            Explorar meu território
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
            <Radio className="h-4 w-4 mr-2" />
            Cadastrar canal
          </Button>
        </div>

        {/* Featured Channels Preview */}
        <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12 border-t pt-4 sm:pt-6 md:pt-8">
          <p className="mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm text-muted-foreground">Canais em destaque agora:</p>
          <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3">
            {featuredChannels.map((channel) => (
              <Link
                key={channel.id}
                to={`/comunicacao/canal/${channel.id}`}
                className="group flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 transition-colors hover:bg-accent sm:px-4"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-8 sm:w-8">
                  {channel.name.charAt(0)}
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-medium truncate">{channel.name}</span>
                    {channel.verified && (
                      <svg className="h-3 w-3 flex-shrink-0 text-primary sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">{channel.type}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}




import { Link } from "react-router-dom";
import { Radio, TrendingUp, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

/**
 * HeroSection - Destaque editorial forte
 * 
 * Apresenta:
 * - Canais em alta
 * - Conteúdo trending
 * - CTA para comunicar sua comunidade
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground sm:rounded-3xl sm:p-8 lg:p-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Badge variant="secondary" className="text-xs sm:text-sm">
            <Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
            Comunicação Territorial
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
            127 canais ativos
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
            342 publicações hoje
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
          Descubra a voz do seu território
        </h1>

        <p className="mb-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:mb-8 sm:text-lg lg:text-xl">
          Conecte-se com portais locais, rádios comunitárias, coletivos culturais e agentes de mídia que fazem a comunicação do seu bairro, cidade e região acontecer.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <Button size="lg" className="w-full sm:w-auto">
            <MapPin className="h-4 w-4 mr-2" />
            Explorar meu território
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            <Radio className="h-4 w-4 mr-2" />
            Cadastrar canal
          </Button>
        </div>

        {/* Featured Channels Preview */}
        <div className="mt-8 border-t pt-6 sm:mt-12 sm:pt-8">
          <p className="mb-3 text-xs text-muted-foreground sm:mb-4 sm:text-sm">Canais em destaque agora:</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              { name: "Portal Nordeste", type: "Portal Local", verified: true },
              { name: "Rádio Comunitária Amaralina", type: "Rádio", verified: true },
              { name: "Coletivo Cultural Barra", type: "Coletivo", verified: false },
              { name: "Jornal do Bairro", type: "Jornal Regional", verified: true },
            ].map((channel, idx) => (
              <Link
                key={idx}
                to={`/comunicacao/canal/${channel.name.toLowerCase().replace(/\s+/g, '-')}`}
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

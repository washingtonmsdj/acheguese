 
import React from "react";
/**
 * Hero Section da página standalone
 * Imagem de capa full-width com informações principais
 */

import { Star, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import type { Business } from "@/shared/types/business";

interface StandaloneHeroProps {
  business: Business;
}

export default function StandaloneHero({ business }: StandaloneHeroProps) {
  return (
    <section id="hero" className="relative w-full">
      {/* Imagem de Capa */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        <img
          src={business.banner_url || business.logo_url || "/placeholder.svg"}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Informações sobre a image */}
      <div className="relative -mt-32 container mx-auto px-4">
        <div className="bg-card rounded-2xl shadow-xl p-6 md:p-8 border">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-background shadow-lg overflow-hidden">
                <BusinessLogo
                  name={business.name}
                  logoUrl={business.logo_url}
                  alt={business.name}
                  initialsClassName="text-4xl md:text-5xl"
                />
              </div>
            </div>

            {/* Informações */}
            <div className="flex-1 space-y-4">
              {/* Nome e Badges */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {business.name}
                  </h1>
                  {business.is_verified && (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{business.category}</Badge>
                  {business.is_premium && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                      Premium
                    </Badge>
                  )}
                </div>
              </div>

              {/* Descrição */}
              {business.description && (
                <p className="text-muted-foreground text-lg">
                  {business.description}
                </p>
              )}

              {/* Informações Rápidas */}
              <div className="flex flex-wrap gap-4 text-sm">
                {/* Avaliação */}
                {business.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{business.rating}</span>
                    {business.total_reviews > 0 && (
                      <span className="text-muted-foreground">
                        ({business.total_reviews})
                      </span>
                    )}
                  </div>
                )}

                {/* Localização */}
                {business.neighborhood && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{business.neighborhood}</span>
                  </div>
                )}

                {/* Status */}
                {business.is_open_now !== undefined && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span
                      className={
                        business.is_open_now ? "text-green-600" : "text-red-600"
                      }
                    >
                      {business.is_open_now ? "Aberto agora" : "Fechado"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

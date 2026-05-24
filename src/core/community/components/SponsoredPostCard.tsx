import React from "react";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { MapPin, ExternalLink } from "lucide-react";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import {
  getCardClasses,
  getCardBackground,
  SPACING,
  INLINE_STYLES,
} from "./styles/communityDesignSystem";

/**
 * Card de post patrocinado (anúncio)
 *
 * Requirements:
 * - Requirement 21: Posts Patrocinados
 * - Requirement 22: Segmentação de Anúncios
 *
 * Design System:
 * - Usa configurações globais do communityDesignSystem.ts
 * - Border radius: 20px
 * - Padding: 16px (p-4)
 * - Borda destacada para diferenciar de posts orgânicos
 */

export interface SponsoredAd {
  id: string;
  business_id: string;
  business_name: string;
  business_logo?: string;
  titulo: string;
  description: string;
  image_url?: string;
  cta_text?: string;
  cta_url?: string;
  city: string;
  neighborhood?: string;
}

interface SponsoredPostCardProps {
  ad: SponsoredAd;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
}

export function SponsoredPostCard({
  ad,
  onImpression,
  onClick,
}: SponsoredPostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  // Tracking de impressões usando IntersectionObserver
  useEffect(() => {
    if (!cardRef.current || hasTrackedImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Disparar impressão quando 50% do card estiver visível
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            onImpression?.(ad.id);
            setHasTrackedImpression(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.5,
      },
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [ad.id, hasTrackedImpression, onImpression]);

  // Tracking de cliques
  const handleClick = () => {
    onClick?.(ad.id);
    if (ad.cta_url) {
      openSafeExternalUrl(ad.cta_url, { context: "sponsored-post-cta" });
    }
  };

  // Gerar iniciais para fallback do logo
  const initials = ad.business_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      ref={cardRef}
      className={`${getCardClasses("bordered")} hover:-translate-y-0.5 border-primary/30`}
      style={getCardBackground("card")}
    >
      <CardHeader className={`${SPACING.cardPadding} pb-3`}>
        {/* Badge "Patrocinado" */}
        <Badge
          variant="default"
          className="w-fit bg-primary hover:bg-primary/90 font-semibold"
        >
          Patrocinado
        </Badge>

        {/* Logo e name da business */}
        <div className="flex items-start gap-3 mt-2">
          <Avatar className="h-10 w-10 ring-2 ring-white/10">
            <AvatarImage src={ad.business_logo} alt={ad.business_name} />
            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-pink-400 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div
              className="font-semibold text-sm truncate"
              style={INLINE_STYLES.textPrimary}
            >
              {ad.business_name}
            </div>

            {/* Localização */}
            <div
              className="flex items-center gap-1 text-xs mt-0.5"
              style={INLINE_STYLES.textSecondary}
            >
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {ad.neighborhood ? `${ad.neighborhood} · ${ad.city}` : ad.city}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${SPACING.cardPadding} pt-0 space-y-3`}>
        {/* Título do anúncio */}
        <h3
          className="font-bold text-lg leading-tight"
          style={INLINE_STYLES.textPrimary}
        >
          {ad.titulo}
        </h3>

        {/* Descrição */}
        <p
          className="text-sm leading-relaxed"
          style={INLINE_STYLES.textSecondary}
        >
          {ad.description}
        </p>

        {/* Imagem do anúncio */}
        {ad.image_url && (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <img
              src={ad.image_url}
              alt={ad.titulo}
              loading="lazy"
              className="h-full w-full object-cover"
              srcSet={`${ad.image_url}?w=400 400w, ${ad.image_url}?w=800 800w`}
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className={`${SPACING.cardPadding} pt-0`}>
        {/* Botão de CTA */}
        <Button
          onClick={handleClick}
          className="w-full gap-2 h-11 font-semibold"
          variant="default"
        >
          {ad.cta_text || "Saiba mais"}
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

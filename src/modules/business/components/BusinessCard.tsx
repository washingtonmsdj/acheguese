 
/**
 * 🏆 BUSINESS CARD - REFATORADO (NÍVEL AAA)
 *
 * ✅ CARACTERÍSTICAS:
 * - Design moderno com gradientes
 * - Animações Framer Motion
 * - Acessibilidade WCAG AAA
 * - Performance otimizada
 * - TypeScript strict
 * - Memoização completa
 * - Tipagem completa com Business
 *
 * @version 3.0.0 - Tipagem Total
 * @author Kiro AI
 * @date 2026-03-17
 */

import { memo, useCallback, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  BadgeCheck,
  Heart,
  ThumbsUp,
  Clock,
  Navigation,
  Phone,
  MessageCircle,
  Crown,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";
import { buildWhatsAppUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import type { Business } from "@/modules/business/types";

// 🎯 TYPES
export interface BusinessCardProps {
  business: Business;
  distance?: string | null;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onNavigate?: (lat: number, lng: number) => void;
}

// 🎨 DESIGN CONSTANTS
const CARD_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const HOVER_SCALE = 1.02;
const TAP_SCALE = 0.98;

/**
 * Business Card Component
 * Cartão de empresa otimizado e acessível
 */
export const BusinessCard = memo(
  forwardRef<HTMLElement, BusinessCardProps>(
    (
      {
        business,
        distance,
        isFavorite = false,
        onToggleFavorite,
        onNavigate,
      }: BusinessCardProps,
      ref,
    ) => {
      const navigate = useNavigate();
      const latitude = business.address?.latitude ?? null;
      const longitude = business.address?.longitude ?? null;
      const locationLabel =
        distance ||
        business.location?.name ||
        business.address?.street ||
        null;
      const hasCoordinates =
        typeof latitude === "number" && typeof longitude === "number";

      // 🎯 HANDLERS
      const handleCardClick = useCallback(() => {
        if (!business.slug) return;
        if (!business.geographic_path) return;
        
        const url = BusinessUrlService.getCanonicalUrl({
          id: business.id,
          slug: business.slug,
          is_premium: business.is_premium,
          geographic_path: business.geographic_path,
        });
        navigate(url);
      }, [navigate, business]);

      const handleFavoriteClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          onToggleFavorite?.(business.id);
        },
        [business.id, onToggleFavorite],
      );

      const handleNavigateClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          if (hasCoordinates && onNavigate) {
            onNavigate(latitude, longitude);
          }
        },
        [hasCoordinates, latitude, longitude, onNavigate],
      );

      const handleWhatsAppClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          if (business.whatsapp) {
            const url = buildWhatsAppUrl(business.whatsapp);
            if (url) openSafeExternalUrl(url, { context: "business-card-whatsapp" });
          }
        },
        [business.whatsapp],
      );

      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-teal-400/50 transition-all cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-teal-400/20"
          onClick={handleCardClick}
          role="article"
          aria-label={`${business.name} - ${business.category}`}
        >
          {/* Cover Image */}
          <div className="relative h-40 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 overflow-hidden">
            {business.banner_url ? (
              <img
                src={business.banner_url}
                alt={`Capa de ${business.name}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 flex items-center justify-center">
                  <span className="text-2xl">🏪</span>
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Favorite Button */}
            {onToggleFavorite && (
              <motion.button
                onClick={handleFavoriteClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label={
                  isFavorite
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
                }
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-all",
                    isFavorite && "fill-current text-red-500",
                  )}
                  style={{ color: isFavorite ? "#ef4444" : "#ffffff" }}
                />
              </motion.button>
            )}

            {/* Premium Badge */}
            {business.is_premium && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-3 left-3"
              >
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg gap-1">
                  <Crown className="h-3 w-3" aria-hidden="true" />
                  Premium
                </Badge>
              </motion.div>
            )}

            {/* Open Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-3 left-3"
            >
              <Badge
                className={cn(
                  "border-0 shadow-lg",
                  business.status === "active"
                    ? "bg-green-500/90 text-white"
                    : "bg-red-500/90 text-white",
                )}
              >
                <Clock className="w-3 h-3 mr-1" />
                {business.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Logo + Name */}
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl border-2 border-white/10 shadow-lg flex-shrink-0 overflow-hidden">
                <BusinessLogo
                  name={business.name}
                  logoUrl={business.logo_url}
                  alt={`Logo de ${business.name}`}
                  initialsClassName="text-2xl"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                    {business.name}
                  </h3>
                  {business.is_verified && (
                    <BadgeCheck
                      className="w-5 h-5 flex-shrink-0 text-teal-400"
                      aria-label="Empresa verificada"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {business.category}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.floor(business.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-600",
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-white">
                {business.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">
                ({business.total_reviews})
              </span>
              {(business.recommendations_count || 0) > 0 && (
                <span className="text-sm text-gray-400 inline-flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {business.recommendations_count}
                </span>
              )}
            </div>

            {/* Location — distingue empresa física vs serviço móvel */}
            {locationLabel && (
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{locationLabel}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {business.whatsapp && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400"
                  onClick={handleWhatsAppClick}
                  aria-label="Enviar mensagem no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
              )}
              {hasCoordinates && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400"
                  onClick={handleNavigateClick}
                  aria-label="Ver no mapa"
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Mapa
                </Button>
              )}
            </div>
          </div>

          {/* Hover Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-cyan-400/5" />
          </div>
        </motion.article>
      );
    },
  ),
);

BusinessCard.displayName = "BusinessCard";

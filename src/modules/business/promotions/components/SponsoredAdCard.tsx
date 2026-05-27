/**
 * SPONSORED AD CARD - NÍVEL AAA
 *
 * CARACTERÍSTICAS:
 * - Design otimizado para conversão de cliques
 * - Hierarquia visual clara (título e CTA em destaque)
 * - Badge "Patrocinado" discreto mas visível
 * - Tracking de cliques integrado
 * - Múltiplas variantes (banner, card, compact)
 * - Estados visuais ricos
 * - Animações Framer Motion
 * - Acessibilidade WCAG AAA
 * - TypeScript strict
 * - Memoização completa
 * - Responsividade completa
 * - SSOT compliant (usa tipo AdCampaignWithTargets)
 *
 * @author Kiro AI
 * @date 2026-04-15
 */

import { memo, forwardRef, useCallback, useMemo } from 'react';
import { ExternalLink, Megaphone, Package, Sparkles, Star, Store, TrendingUp, Wrench, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { openSafeExternalUrl } from '@/shared/utils/safeRedirect';
import type { AdCampaignWithTargets } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
};

const HOVER_SCALE = 1.02;
const TAP_SCALE = 0.98;

// ============================================================================
// TYPES
// ============================================================================

interface SponsoredAdCardProps {
  campaign: AdCampaignWithTargets;
  variant?: 'banner' | 'card' | 'compact';
  index?: number;
  onAdClick?: (campaignId: string, ctaUrl: string | undefined) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se o anúncio tem imagem
 */
function hasImage(campaign: AdCampaignWithTargets): boolean {
  return !!campaign.image_url;
}

/**
 * Verifica se o anúncio tem CTA
 */
function hasCTA(campaign: AdCampaignWithTargets): boolean {
  return !!campaign.cta_text && !!campaign.cta_url;
}

/**
 * Obtém ícone baseado no tipo de owner
 */
function getOwnerIcon(ownerType: string): LucideIcon {
  switch (ownerType) {
    case 'business':
      return Store;
    case 'service_provider':
      return Wrench;
    case 'classified':
      return Package;
    case 'platform':
      return Star;
    default:
      return Megaphone;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SponsoredAdCard = memo(
  forwardRef<HTMLDivElement, SponsoredAdCardProps>(function SponsoredAdCard(
    {
      campaign,
      variant = 'card',
      index = 0,
      onAdClick,
      className,
    },
    ref,
  ) {
    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const hasImg = useMemo(() => hasImage(campaign), [campaign]);
    const hasCta = useMemo(() => hasCTA(campaign), [campaign]);
    const OwnerIcon = useMemo(() => getOwnerIcon(campaign.owner_entity_type), [campaign.owner_entity_type]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleClick = useCallback(() => {
      // Track click
      onAdClick?.(campaign.id, campaign.cta_url);

      // Open URL
      if (campaign.cta_url) {
        openSafeExternalUrl(campaign.cta_url, { context: 'sponsored-ad-cta' });
      }
    }, [campaign.id, campaign.cta_url, onAdClick]);

    // ========================================================================
    // RENDER VARIANTS
    // ========================================================================

    if (variant === 'compact') {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 5) * 0.05 }}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          onClick={handleClick}
          className={cn(
            'group relative flex items-center gap-2 overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-2 transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer',
            className,
          )}
          role="article"
          aria-label={`Anúncio patrocinado: ${campaign.title}`}
        >
          {/* Ícone */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
            <OwnerIcon className="h-5 w-5 text-primary" />
          </div>

          {/* Conteúdo */}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-xs font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {campaign.title}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Megaphone className="h-2.5 w-2.5" />
              Patrocinado
            </div>
          </div>

          {/* Arrow */}
          {hasCta && (
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
          )}
        </motion.article>
      );
    }

    if (variant === 'banner') {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 3) * 0.1 }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          onClick={handleClick}
          className={cn(
            'group relative flex items-center gap-4 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg cursor-pointer',
            className,
          )}
          role="article"
          aria-label={`Anúncio patrocinado: ${campaign.title}`}
        >
          {/* Badge Patrocinado */}
          <div className="absolute right-3 top-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
              <Megaphone className="mr-0.5 h-2.5 w-2.5" />
              Patrocinado
            </Badge>
          </div>

          {/* Imagem (opcional) */}
          {hasImg && (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <img
                src={campaign.image_url!}
                alt={campaign.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Conteúdo */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="line-clamp-1 text-base font-bold text-foreground transition-colors group-hover:text-primary">
              {campaign.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {campaign.content}
            </p>
          </div>

          {/* CTA */}
          {hasCta && (
            <Button
              size="sm"
              className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {campaign.cta_text}
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}

          {/* Hover Glow Effect */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
          </div>
        </motion.article>
      );
    }

    // ========================================================================
    // CARD VARIANT (DEFAULT)
    // ========================================================================

    return (
      <motion.article
        ref={ref}
        {...CARD_ANIMATION}
        transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
        whileHover={{ scale: HOVER_SCALE }}
        whileTap={{ scale: TAP_SCALE }}
        onClick={handleClick}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl border border-primary/20 bg-primary/5 transition-all duration-300 hover:border-primary/40 hover:shadow-xl cursor-pointer',
          className,
        )}
        role="article"
        aria-label={`Anúncio patrocinado: ${campaign.title}`}
      >
        {/* Badge Patrocinado */}
        <div className="absolute right-2 top-2 z-10">
          <Badge className="bg-background/80 text-muted-foreground border-border/50 backdrop-blur-sm text-[10px] font-medium">
            <Megaphone className="mr-0.5 h-2.5 w-2.5" />
            Patrocinado
          </Badge>
        </div>

        {/* Imagem */}
        {hasImg && (
          <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10">
            <img
              src={campaign.image_url!}
              alt={campaign.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex flex-col gap-2 p-3">
          {/* Título */}
          <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {campaign.title}
          </h3>

          {/* Descrição */}
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {campaign.content}
          </p>

          {/* CTA */}
          {hasCta && (
            <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary transition-colors group-hover:text-primary/80">
              <span>{campaign.cta_text}</span>
              <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
        </div>
      </motion.article>
    );
  }),
);

SponsoredAdCard.displayName = 'SponsoredAdCard';

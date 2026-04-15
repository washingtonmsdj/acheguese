/**
 * SponsoredAdCard
 *
 * Card de anúncio patrocinado reutilizável por todos os módulos consumidores.
 * Recebe AdCampaignWithTargets diretamente — sem lógica de targeting aqui.
 * Renderização condicional: retorna null quando campaign é null.
 */

import { memo } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import type { AdCampaignWithTargets } from '../types';

interface SponsoredAdCardProps {
  campaign: AdCampaignWithTargets;
  /** Classe CSS adicional para ajuste de layout no contexto do consumidor */
  className?: string;
}

export const SponsoredAdCard = memo(function SponsoredAdCard({
  campaign,
  className = '',
}: SponsoredAdCardProps) {
  const handleClick = () => {
    if (campaign.cta_url) {
      window.open(campaign.cta_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`relative rounded-xl border border-primary/20 bg-primary/5 overflow-hidden cursor-pointer hover:border-primary/40 transition-colors ${className}`}
      onClick={handleClick}
      role="article"
      aria-label={`Anúncio patrocinado: ${campaign.title}`}
    >
      {/* Badge patrocinado */}
      <div className="absolute top-2 right-2 z-10">
        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-border/50">
          <Megaphone className="h-2.5 w-2.5" aria-hidden="true" />
          Patrocinado
        </span>
      </div>

      {/* Imagem */}
      {campaign.image_url && (
        <img
          src={campaign.image_url}
          alt={campaign.title}
          className="w-full h-32 object-cover"
          loading="lazy"
        />
      )}

      {/* Conteúdo */}
      <div className="p-3">
        <p className="text-sm font-semibold leading-tight line-clamp-1">
          {campaign.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {campaign.content}
        </p>

        {/* CTA */}
        {campaign.cta_text && (
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary">
            <span>{campaign.cta_text}</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
});

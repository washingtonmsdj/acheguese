import {
  Bookmark,
  Share2,
  MessageCircle,
  Navigation,
  Phone,
  ThumbsUp,
} from 'lucide-react';
import { buildTelUrl, buildWhatsAppUrl } from '@/shared/utils/contactLinks';
import { ActionButton, RouteOptions } from '../components/ctas';
import type { EmpresaCTAsSectionProps } from './types';

export function EmpresaCTAsSection({
  business,
  embedded = false,
  isFavorite,
  hasRecommended,
  recommendLoading = false,
  showRouteOptions,
  onToggleFavorite,
  onToggleRecommended,
  onToggleRouteOptions,
  onRoute,
  onShare,
}: EmpresaCTAsSectionProps) {
  const hasPrimaryContactActions = Boolean(business.whatsapp || business.phone);

  return (
    <section
      className={
        embedded
          ? 'w-full'
          : 'mx-auto mt-4 w-full max-w-[1400px] px-4 sm:px-6 xl:px-8 2xl:max-w-[1480px] 2xl:px-10'
      }
    >
      <div className="space-y-1.5 sm:space-y-3">
        <div className="hidden xl:grid xl:grid-cols-5 xl:gap-3 [@media(max-height:1080px)]:gap-2.5">
          {business.whatsapp ? (
            <ActionButton
              icon={MessageCircle}
              label="WhatsApp"
              href={buildWhatsAppUrl(business.whatsapp) ?? undefined}
              color="emerald-400"
              appearance="solid"
              layout="inline"
            />
          ) : (
            <div />
          )}
          {business.phone ? (
            <ActionButton
              icon={Phone}
              label="Ligar"
              href={buildTelUrl(business.phone) ?? undefined}
              color="primary"
              appearance="solid"
              layout="inline"
            />
          ) : (
            <div />
          )}
          <ActionButton
            icon={Navigation}
            label="Rota"
            onClick={onToggleRouteOptions}
            color="sky-400"
            appearance="solid"
            layout="inline"
          />
          <ActionButton
            icon={Bookmark}
            label={isFavorite ? 'Salvo' : 'Salvar'}
            onClick={onToggleFavorite}
            color="primary"
            isActive={isFavorite}
            ariaPressed={isFavorite}
            layout="inline"
          />
          <ActionButton
            icon={ThumbsUp}
            label={hasRecommended ? 'Recomendado' : 'Recomendar'}
            onClick={onToggleRecommended}
            color="primary"
            isActive={hasRecommended}
            ariaPressed={hasRecommended}
            disabled={recommendLoading}
            layout="inline"
          />
        </div>

        {hasPrimaryContactActions ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 xl:hidden">
            {business.whatsapp ? (
              <ActionButton
                icon={MessageCircle}
                label="WhatsApp"
                href={buildWhatsAppUrl(business.whatsapp) ?? undefined}
                color="emerald-400"
                appearance="solid"
              />
            ) : <div />}
            {business.phone ? (
              <ActionButton
                icon={Phone}
                label="Ligar"
                href={buildTelUrl(business.phone) ?? undefined}
                color="primary"
                appearance="solid"
              />
            ) : <div />}
            <ActionButton
              icon={Navigation}
              label="Rota"
              onClick={onToggleRouteOptions}
              color="sky-400"
              appearance="solid"
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <ActionButton
              icon={Navigation}
              label="Rota"
              onClick={onToggleRouteOptions}
              color="sky-400"
              appearance="solid"
            />
            <div />
            <div />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-3 xl:hidden">
          <ActionButton
            icon={Bookmark}
            label={isFavorite ? 'Salvo' : 'Salvar'}
            onClick={onToggleFavorite}
            color="primary"
            isActive={isFavorite}
            ariaPressed={isFavorite}
          />
          <ActionButton
            icon={ThumbsUp}
            label={hasRecommended ? 'Recomendado' : 'Recomendar'}
            onClick={onToggleRecommended}
            color="primary"
            isActive={hasRecommended}
            ariaPressed={hasRecommended}
            disabled={recommendLoading}
          />
          <ActionButton
            icon={Share2}
            label="Compartilhar"
            onClick={onShare}
            color="primary"
          />
        </div>

        <RouteOptions show={showRouteOptions} onRoute={onRoute} />
      </div>

    </section>
  );
}

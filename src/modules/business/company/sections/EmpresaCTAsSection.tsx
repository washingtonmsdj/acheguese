import {
  Bookmark,
  Share2,
  MessageCircle,
  MessagesSquare,
  Navigation,
  Phone,
  ThumbsUp,
} from 'lucide-react';
import { buildTelUrl, buildWhatsAppUrl } from '@/shared/utils/contactLinks';
import { getPhysicalBusinessCoordinates } from '@/core/business/utils/physicalBusinessCoordinates';
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
  onMessage,
  messageLoading = false,
  onShare,
}: EmpresaCTAsSectionProps) {
  const hasRouteTarget = Boolean(
    getPhysicalBusinessCoordinates(business) ||
      business.business_address?.trim() ||
      business.address?.street?.trim() ||
      business.location?.full_name?.trim() ||
      business.location?.name?.trim(),
  );

  return (
    <section
      className={
        embedded
          ? 'w-full'
          : 'mx-auto mt-4 w-full max-w-[1400px] px-4 sm:px-6 xl:px-8 2xl:max-w-[1480px] 2xl:px-10'
      }
    >
      <div className="space-y-1.5 sm:space-y-3">
        <div
          className={
            onMessage
              ? "hidden xl:grid xl:grid-cols-6 xl:gap-3 [@media(max-height:1080px)]:gap-2.5"
              : "hidden xl:grid xl:grid-cols-5 xl:gap-3 [@media(max-height:1080px)]:gap-2.5"
          }
        >
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
          {onMessage ? (
            <ActionButton
              icon={MessagesSquare}
              label="Mensagem"
              onClick={onMessage}
              color="primary"
              appearance="solid"
              layout="inline"
              disabled={messageLoading}
            />
          ) : null}
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
          {hasRouteTarget ? (
            <ActionButton
              icon={Navigation}
              label="Rota"
              onClick={onToggleRouteOptions}
              color="sky-400"
              appearance="solid"
              layout="inline"
            />
          ) : (
            <div />
          )}
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 xl:hidden">
          {onMessage ? (
            <ActionButton
              icon={MessagesSquare}
              label="Mensagem"
              onClick={onMessage}
              color="primary"
              appearance="solid"
              disabled={messageLoading}
            />
          ) : null}
          {business.whatsapp ? (
            <ActionButton
              icon={MessageCircle}
              label="WhatsApp"
              href={buildWhatsAppUrl(business.whatsapp) ?? undefined}
              color="emerald-400"
              appearance="solid"
            />
          ) : null}
          {business.phone ? (
            <ActionButton
              icon={Phone}
              label="Ligar"
              href={buildTelUrl(business.phone) ?? undefined}
              color="primary"
              appearance="solid"
            />
          ) : null}
          {hasRouteTarget ? (
            <ActionButton
              icon={Navigation}
              label="Rota"
              onClick={onToggleRouteOptions}
              color="sky-400"
              appearance="solid"
            />
          ) : null}
        </div>

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

        <RouteOptions show={hasRouteTarget && showRouteOptions} onRoute={onRoute} />
      </div>

    </section>
  );
}

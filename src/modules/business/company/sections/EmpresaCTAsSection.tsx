import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Building2,
  ClipboardList,
  Share2,
  MessageCircle,
  Navigation,
  Phone,
  ShoppingBag,
  ThumbsUp,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { VERTICAL_CONFIGS, type VerticalKey } from '@/core/verticals';
import { buildTelUrl, buildWhatsAppUrl } from '@/shared/utils/contactLinks';
import { getRecordValue } from '@/shared/utils/recordLookup';
import { ActionButton, RouteOptions } from '../components/ctas';
import type { EmpresaCTAsSectionProps } from './types';

export function EmpresaCTAsSection({
  business,
  gastronomyUrl,
  verticalPublicUrls,
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
  const availableVerticals = Object.entries(verticalPublicUrls ?? {}) as Array<[VerticalKey, string]>;
  const hasPrimaryContactActions = Boolean(business.whatsapp || business.phone);

  const getVerticalIcon = (vertical: VerticalKey) => {
    switch (vertical) {
      case 'gastronomy':
        return UtensilsCrossed;
      default:
        return Building2;
    }
  };

  return (
    <section
      className={
        embedded
          ? 'w-full'
          : 'mx-auto mt-4 w-full max-w-[1400px] px-4 sm:px-6 xl:px-8 2xl:max-w-[1480px] 2xl:px-10'
      }
    >
      <div className="space-y-1.5 sm:space-y-3">
        {gastronomyUrl ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              asChild
              className="h-12 w-full gap-2 rounded-2xl bg-teal-500 text-base font-bold text-slate-950 shadow-lg hover:bg-teal-400"
            >
              <Link to={gastronomyUrl}>
                <ShoppingBag className="h-5 w-5" /> Ver cardapio e pedir
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full gap-2 rounded-2xl border-white/10 bg-white/[0.03] text-base font-semibold text-white hover:bg-white/[0.06]"
            >
              <Link to={gastronomyUrl}>
                <ClipboardList className="h-5 w-5" /> Abrir cardapio
              </Link>
            </Button>
          </div>
        ) : null}

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

      {availableVerticals.length > 0 && business ? (
        <div className="mt-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/44">
              Experiencias especializadas
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {availableVerticals.map(([vertical, url]) => {
                const config = getRecordValue(VERTICAL_CONFIGS, vertical);
                if (!config) return null;
                const Icon = getVerticalIcon(vertical);

                return (
                  <Card key={vertical} className="border-white/10 bg-white/[0.03]">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 rounded-2xl bg-teal-400/10 p-2.5">
                          <Icon className="h-4 w-4 text-teal-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white">{config.label}</h3>
                          <p className="mt-1 line-clamp-2 text-xs text-white/54">
                            {config.description}
                          </p>
                          <Button asChild size="sm" className="mt-3 gap-1.5">
                            <Link to={url}>
                              Acessar {config.label}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

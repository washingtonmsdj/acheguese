import {
  BadgeCheck,
  Calendar,
  Clock,
  CreditCard,
  Heart,
  MapPin,
  MoveRight,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { BusinessCoverageBadge } from '@/modules/business/components/coverage';
import { getPaymentMethodLabel } from '@/core/business/constants';
import { cn } from '@/shared/utils/cn';
import type { EmpresaHeroSectionProps } from './types';

export function EmpresaHeroSection({
  business,
  openStatus,
  yearsActive,
  onRoute,
  onClaim,
}: EmpresaHeroSectionProps) {
  const shellGutterClass = 'w-full px-4 sm:px-6 xl:px-[clamp(32px,2.4vw,52px)] 2xl:px-[clamp(40px,2.8vw,72px)]';
  const openStatusLabel =
    openStatus.open === true
      ? 'Aberto agora'
      : openStatus.open === false
        ? 'Fechado'
        : 'Horário não informado';
  const openStatusCardClass =
    openStatus.open === true
      ? 'border-territory-success/20 bg-territory-success/10 text-territory-success'
      : openStatus.open === false
        ? 'border-territory-error/20 bg-territory-error/10 text-territory-error'
        : 'border-territory-on-image/10 bg-territory-on-image/[0.04] text-territory-on-image/66';
  const openStatusDotClass =
    openStatus.open === true
      ? 'bg-territory-success animate-pulse'
      : openStatus.open === false
        ? 'bg-territory-error'
        : 'bg-territory-on-image/36';

  const locationText = business.location?.full_name || business.location?.name || null;
  const hasRouteTarget = Boolean(
    business.business_address?.trim() || business.address?.street?.trim(),
  );
  const categoryText = business.subcategoria || business.category;

  const paymentHighlights = (() => {
    const values: string[] = [];
    if (business.aceita_pix) values.push('PIX');
    if (business.aceita_cartao) values.push('Cartão');

    (business.formas_pagamento ?? []).forEach((item) => {
      const normalized = getPaymentMethodLabel(item.trim());
      if (!normalized) return;
      if (values.some((value) => value.toLowerCase() === normalized.toLowerCase())) return;
      values.push(normalized);
    });

    return values.slice(0, 3);
  })();

  const socialCount = business.recommendations_count || business.total_reviews || 0;
  const foundedYear = Number.isFinite(new Date(business.created_at).getTime())
    ? new Date(business.created_at).getFullYear()
    : null;
  const ageChipLabel = foundedYear ? `Desde ${foundedYear}` : yearsActive;
  const reviewCount = business.total_reviews || 0;
  const ratingLabel = reviewCount > 0
    ? `${business.rating?.toFixed(1) || '0.0'} (${reviewCount} ${reviewCount === 1 ? 'avaliação' : 'avaliações'})`
    : business.rating?.toFixed(1) || '0.0';

  return (
    <section className="relative w-full">
      <div className={`relative ${shellGutterClass}`}>
        <div className="mt-3 overflow-hidden rounded-[30px] border border-territory-on-image/10 bg-[linear-gradient(180deg,hsl(var(--territory-brand-strong)/0.38),hsl(var(--territory-image-overlay)/0.98))] sm:mt-6 [@media(max-height:1080px)]:mt-2 [@media(max-height:860px)]:mt-1">
          <div className="relative p-3.5 sm:p-6 lg:min-h-[10.9rem] lg:p-0 [@media(max-height:1100px)]:lg:min-h-[9.1rem] [@media(max-height:860px)]:lg:min-h-[8.65rem]">
            <div className="pointer-events-none absolute inset-0 hidden lg:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,hsl(var(--territory-action-on-image)/0.12),transparent_22%),radial-gradient(circle_at_48%_14%,hsl(var(--territory-on-image)/0.06),transparent_18%),radial-gradient(circle_at_64%_38%,hsl(var(--territory-warm)/0.14),transparent_24%),linear-gradient(135deg,hsl(var(--territory-image-overlay)/0.98),hsl(var(--territory-brand-strong)/0.42)_44%,hsl(var(--territory-image-overlay)/0.98)_100%)]" />
              <div className="absolute inset-0 opacity-30">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={`hero-grid-h-${index}`}
                    className="absolute left-0 right-0 border-b border-territory-on-image/8"
                    style={{ top: `${(index + 1) * 13}%` }}
                  />
                ))}
                {Array.from({ length: 11 }).map((_, index) => (
                  <div
                    key={`hero-grid-v-${index}`}
                    className="absolute bottom-0 top-0 border-r border-territory-on-image/8"
                    style={{ left: `${(index + 1) * 8}%` }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--territory-image-overlay)/0.16)_0%,hsl(var(--territory-image-overlay)/0.04)_48%,hsl(var(--territory-image-overlay)/0.22)_100%)]" />
            </div>

            <div className="relative z-10 lg:flex lg:min-h-[10.9rem] lg:items-center lg:p-3.5 xl:p-[1.125rem] [@media(max-height:1100px)]:lg:min-h-[9.1rem] [@media(max-height:1100px)]:lg:p-2.5 [@media(max-height:860px)]:lg:min-h-[8.65rem] [@media(max-height:860px)]:lg:p-2">
              <div className="hidden lg:block lg:w-full">
                <div className="relative overflow-hidden rounded-[28px] border border-territory-on-image/10 bg-[linear-gradient(180deg,hsl(var(--territory-image-overlay)/0.22),hsl(var(--territory-image-overlay)/0.36))] px-4 py-4 backdrop-blur-[3px] xl:px-[1.125rem] xl:py-4 [@media(max-height:1100px)]:px-3 [@media(max-height:1100px)]:py-3 [@media(max-height:860px)]:px-3 [@media(max-height:860px)]:py-3">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--territory-on-image)/0.03),transparent_18%,transparent_82%,hsl(var(--territory-on-image)/0.03))]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,hsl(var(--territory-image-overlay)/0.24))]" />
                  {business.is_premium ? (
                    <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-territory-sun px-3 py-1.5 text-xs font-semibold text-territory-image-overlay shadow-territory-highlight">
                      <Sparkles className="h-3.5 w-3.5" /> Premium
                    </span>
                  ) : null}

                  {onClaim ? (
                    <div className="absolute bottom-3.5 right-3.5 top-3.5 w-[248px] [@media(max-height:1100px)]:bottom-3 [@media(max-height:1100px)]:right-3 [@media(max-height:1100px)]:top-3 [@media(max-height:1100px)]:w-[216px]">
                      <button
                        type="button"
                        onClick={onClaim}
                        className="flex h-full w-full flex-col justify-between rounded-[22px] border border-territory-action-on-image/18 bg-[linear-gradient(180deg,hsl(var(--territory-brand-strong)/0.94),hsl(var(--territory-image-overlay)/0.96))] px-3.5 py-3 text-left transition-colors hover:border-territory-action-on-image/28 hover:bg-[linear-gradient(180deg,hsl(var(--territory-brand-strong)/0.98),hsl(var(--territory-image-overlay)/0.98))] [@media(max-height:1100px)]:rounded-[18px] [@media(max-height:1100px)]:px-3 [@media(max-height:1100px)]:py-2"
                      >
                        <div>
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-territory-action-on-image/12 text-territory-action-on-image [@media(max-height:1100px)]:h-8 [@media(max-height:1100px)]:w-8 [@media(max-height:1100px)]:rounded-[12px]">
                            <ShieldCheck className="h-5 w-5 [@media(max-height:1100px)]:h-[18px] [@media(max-height:1100px)]:w-[18px]" />
                          </span>
                          <p className="mt-2 text-[0.98rem] font-semibold leading-5 text-territory-on-image [@media(max-height:1100px)]:mt-1.5 [@media(max-height:1100px)]:text-[0.88rem]">
                            Esta é a sua empresa?
                          </p>
                          <p className="mt-1 text-[11px] leading-4 text-territory-on-image/62 [@media(max-height:1100px)]:text-[10px]">
                            Reivindique, atualize informações e veja estatísticas.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-territory-action-on-image [@media(max-height:1100px)]:text-[11px]">
                          Reivindicar agora <MoveRight className="h-4 w-4 [@media(max-height:1100px)]:h-3.5 [@media(max-height:1100px)]:w-3.5" />
                        </span>
                      </button>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 pr-20 [@media(max-height:1100px)]:gap-2.5 [@media(max-height:1100px)]:pr-[15.4rem]">
                    <div className="flex h-[6.5rem] w-[6.5rem] shrink-0 items-center justify-center overflow-hidden rounded-[26px] border-2 border-territory-on-image/90 bg-territory-brand-strong shadow-territory-highlight xl:h-28 xl:w-28 [@media(max-height:1100px)]:h-[5rem] [@media(max-height:1100px)]:w-[5rem] [@media(max-height:860px)]:h-[5rem] [@media(max-height:860px)]:w-[5rem]">
                      <BusinessLogo
                        name={business.name}
                        logoUrl={business.logo_url}
                        alt={business.name}
                        className="object-contain p-2"
                        initialsClassName="text-[2.65rem] text-territory-action-on-image"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-3 [@media(max-height:1100px)]:mb-0.5 [@media(max-height:860px)]:mb-0.5">
                        <h1 className="text-[2.1rem] font-semibold leading-[0.98] text-territory-on-image xl:text-[2.28rem] [@media(max-height:1100px)]:text-[1.78rem] xl:[@media(max-height:1100px)]:text-[1.9rem] [@media(max-height:860px)]:text-[1.8rem] xl:[@media(max-height:860px)]:text-[1.88rem]">
                          {business.name}
                        </h1>
                        {business.is_verified ? (
                          <BadgeCheck className="h-6 w-6 shrink-0 text-territory-action-on-image" />
                        ) : null}
                      </div>

                      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.94rem] text-territory-on-image/84 [@media(max-height:1100px)]:mb-1 [@media(max-height:1100px)]:text-[0.8rem] [@media(max-height:860px)]:mb-1 [@media(max-height:860px)]:text-[0.8rem]">
                        {business.slug ? (
                          <p className="font-medium text-territory-action-on-image">@{business.slug}</p>
                        ) : null}
                        <p className="capitalize text-territory-on-image/82">
                          {categoryText}
                        </p>
                      </div>

                      {locationText ? (
                        <div className="mb-2 flex flex-wrap items-center gap-3 text-[0.88rem] leading-6 text-territory-on-image/80 [@media(max-height:1100px)]:mb-1 [@media(max-height:1100px)]:gap-2.5 [@media(max-height:1100px)]:text-[0.76rem] [@media(max-height:860px)]:mb-1 [@media(max-height:860px)]:text-[0.78rem]">
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0" />
                            {locationText}
                          </span>
                          {onRoute && hasRouteTarget ? (
                            <button
                              type="button"
                              onClick={onRoute}
                              className="inline-flex items-center rounded-full border border-territory-action-on-image/24 bg-territory-action-on-image/10 px-3 py-1.5 text-sm font-semibold text-territory-action-on-image transition-colors hover:bg-territory-action-on-image/14 [@media(max-height:1100px)]:px-2.5 [@media(max-height:1100px)]:py-1 [@media(max-height:1100px)]:text-[12px] [@media(max-height:860px)]:px-2.5 [@media(max-height:860px)]:py-1 [@media(max-height:860px)]:text-[12px]"
                            >
                              Ver no mapa
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 [@media(max-height:1100px)]:gap-1 [@media(max-height:860px)]:gap-1">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-territory-on-image/10 bg-territory-image-overlay/20 px-3 py-1.5 text-sm font-medium text-territory-on-image/84 [@media(max-height:860px)]:px-2.5 [@media(max-height:860px)]:py-1 [@media(max-height:860px)]:text-[12px]">
                          <Star className="h-4 w-4 fill-territory-sun text-territory-sun" />
                          {ratingLabel}
                        </span>
                        {yearsActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-territory-on-image/10 bg-territory-image-overlay/20 px-3 py-1.5 text-sm font-medium text-territory-on-image/84 [@media(max-height:860px)]:px-2.5 [@media(max-height:860px)]:py-1 [@media(max-height:860px)]:text-[12px]">
                            <Calendar className="h-4 w-4 text-territory-on-image/66" />
                            {ageChipLabel}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold [@media(max-height:860px)]:px-2.5 [@media(max-height:860px)]:py-1 [@media(max-height:860px)]:text-[12px]',
                            openStatusCardClass,
                          )}
                        >
                          <span className={cn('h-2 w-2 rounded-full', openStatusDotClass)} />
                          {openStatusLabel}
                        </span>
                        {socialCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-territory-on-image/10 bg-territory-image-overlay/20 px-3 py-1.5 text-sm font-medium text-territory-on-image/84 [@media(max-height:860px)]:px-2.5 [@media(max-height:860px)]:py-1 [@media(max-height:860px)]:text-[12px]">
                            <Heart className="h-4 w-4 text-territory-on-image/66" />
                            {socialCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:hidden">
                <div className="mb-4 hidden items-start gap-2.5 sm:flex lg:mb-5">
                  <div className="flex min-w-0 flex-wrap gap-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold',
                        openStatusCardClass,
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', openStatusDotClass)} />
                      {openStatusLabel}
                    </span>
                    {openStatus.todayHours ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-territory-on-image/10 bg-territory-image-overlay/20 px-2.5 py-1 text-xs font-medium text-territory-on-image/72">
                        <Clock className="h-3 w-3" /> {openStatus.todayHours}
                      </span>
                    ) : null}
                    {paymentHighlights.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-territory-on-image/10 bg-territory-image-overlay/20 px-2.5 py-1 text-xs font-medium text-territory-on-image/72">
                        <CreditCard className="h-3 w-3" />
                        {paymentHighlights.join(' | ')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-start gap-3.5 sm:gap-5 sm:pt-0">
                  <div className="relative flex h-[5.35rem] w-[5.35rem] shrink-0 items-center justify-center overflow-visible rounded-[24px] sm:h-32 sm:w-32 sm:rounded-[28px]">
                    {socialCount > 0 ? (
                      <span className="absolute -right-1 -top-1 z-10 inline-flex items-center gap-1 rounded-full border border-territory-on-image/10 bg-territory-image-overlay px-1.5 py-0.5 text-[10px] font-semibold text-territory-on-image/88 shadow-territory-highlight sm:hidden">
                        <Heart className="h-2.5 w-2.5" />
                        {socialCount}
                      </span>
                    ) : null}
                    {business.is_premium ? (
                      <span className="absolute -bottom-1 -right-1 z-10 inline-flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full border border-territory-image-overlay bg-territory-sun text-territory-image-overlay shadow-territory-highlight sm:hidden">
                        <Sparkles className="h-3 w-3" />
                        <span className="sr-only">Premium</span>
                      </span>
                    ) : null}

                    <div className="flex h-[5.35rem] w-[5.35rem] items-center justify-center overflow-hidden rounded-[24px] border-2 border-territory-on-image/90 bg-territory-brand-strong shadow-territory-highlight sm:h-32 sm:w-32 sm:rounded-[28px]">
                      <BusinessLogo
                        name={business.name}
                        logoUrl={business.logo_url}
                        alt={business.name}
                        className="object-contain p-2.5"
                        initialsClassName="text-[1.45rem] text-territory-action-on-image sm:text-5xl"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5 sm:pt-1.5">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h1 className="text-[1.38rem] font-semibold leading-tight text-territory-on-image sm:text-[2.5rem]">
                        {business.name}
                      </h1>
                      {business.is_verified ? (
                        <BadgeCheck className="h-5 w-5 shrink-0 text-territory-action-on-image sm:h-6 sm:w-6" />
                      ) : null}
                    </div>

                    {business.slug ? (
                      <p className="mb-1 text-sm font-medium text-territory-action-on-image sm:text-base">@{business.slug}</p>
                    ) : null}

                    <p className="mb-1 text-[0.92rem] capitalize leading-[1.8] text-territory-on-image/74 sm:text-[1rem]">
                      {categoryText}
                    </p>
                  </div>
                </div>

                {locationText ? (
                  <div className="mt-2.5 flex items-start gap-2 text-[0.92rem] leading-[1.65] text-territory-on-image/74 sm:mt-4 sm:text-[0.98rem]">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0">{locationText}</span>
                  </div>
                ) : null}

                <div className="mt-3">
                  <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 scrollbar-hide scroll-smooth-x sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-territory-on-image/10 bg-territory-image-overlay/20 px-2 py-1 text-[11px] font-medium text-territory-on-image/82 sm:px-2.5 sm:text-xs">
                      <Star className="h-3.5 w-3.5 fill-territory-sun text-territory-sun" />
                      {ratingLabel}
                    </span>
                    {yearsActive ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-territory-on-image/10 bg-territory-image-overlay/20 px-2 py-1 text-[11px] font-medium text-territory-on-image/82 sm:px-2.5 sm:text-xs">
                        <Calendar className="h-3.5 w-3.5 text-territory-on-image/66" />
                        {ageChipLabel}
                      </span>
                    ) : null}
                    {business.business_data_id ? (
                      <BusinessCoverageBadge
                        businessDataId={business.business_data_id}
                        className="hidden w-full sm:ml-auto sm:block sm:w-auto"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:hidden">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      openStatusCardClass,
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', openStatusDotClass)} />
                    {openStatusLabel}
                  </span>
                  {openStatus.todayHours ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-territory-on-image/10 bg-territory-image-overlay/20 px-2.5 py-1 text-xs font-medium text-territory-on-image/72">
                      <Clock className="h-3 w-3" /> {openStatus.todayHours}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

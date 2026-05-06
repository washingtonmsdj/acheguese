/**
 * EmpresaHeroSection
 * 
 * Seção hero com banner, logo, informações principais, badges e rating.
 * Exibe status (aberto/fechado), verificação, premium e modos de atendimento.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion } from 'framer-motion';
import {
  Store,
  BadgeCheck,
  Sparkles,
  Clock,
  MapPin,
  Star,
  ThumbsUp,
  Calendar,
  CreditCard,
  ParkingSquare,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/badge';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { CoverageBadge } from '@/core/geospatial/components/CoverageBadge';
import {
  getServiceModeIcon,
  getServiceModeLabel,
  getServiceModeColor,
  getFacilityIcon,
  getFacilityLabel,
  getPaymentMethodLabel,
} from '@/core/business/constants';
import type { EmpresaHeroSectionProps } from './types';

export function EmpresaHeroSection({
  business,
  openStatus,
  yearsActive,
}: EmpresaHeroSectionProps) {
  const openStatusLabel =
    openStatus.open === true
      ? "Aberto agora"
      : openStatus.open === false
        ? "Fechado"
        : "Horario nao informado";
  const openStatusBadgeClass =
    openStatus.open === true
      ? "bg-emerald-500/90 text-white"
      : openStatus.open === false
        ? "bg-destructive/90 text-destructive-foreground"
        : "bg-slate-500/90 text-white";
  const openStatusCardClass =
    openStatus.open === true
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : openStatus.open === false
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-slate-500/10 text-slate-300 border-slate-500/20";
  const openStatusDotClass =
    openStatus.open === true
      ? "bg-emerald-500 animate-pulse"
      : openStatus.open === false
        ? "bg-destructive"
        : "bg-slate-400";

  const serviceModes =
    business.modos_atendimento && business.modos_atendimento.length > 0
      ? business.modos_atendimento
      : ["presencial"];
  const locationText = business.location?.full_name || business.location?.name || null;
  const prioritizedFacilityIds = [
    'estacionamento',
    'acessibilidade',
    'wifi',
    'pet_friendly',
  ];

  const facilityHighlights = (business.facilidades ?? [])
    .slice()
    .sort((a, b) => {
      const ai = prioritizedFacilityIds.indexOf(a);
      const bi = prioritizedFacilityIds.indexOf(b);
      const left = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const right = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      return left - right;
    })
    .slice(0, 3);

  const paymentHighlights = (() => {
    const values: string[] = [];
    if (business.aceita_pix) values.push('PIX');
    if (business.aceita_cartao) values.push('Cartao');

    (business.formas_pagamento ?? []).forEach((item) => {
      const normalized = getPaymentMethodLabel(item.trim());
      if (!normalized) return;
      if (values.some((v) => v.toLowerCase() === normalized.toLowerCase())) return;
      values.push(normalized);
    });

    return values.slice(0, 3);
  })();
  const paymentHighlightsMobile = paymentHighlights.slice(0, 2);
  const facilityHighlightsMobile = facilityHighlights.slice(0, 2);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full"
    >
      {/* Banner */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative mt-4 sm:mt-6 rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[3/1]">
          {business.banner_url ? (
            <img
              src={business.banner_url}
              alt={`Banner de ${business.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-secondary flex items-center justify-center">
              <Store className="h-20 w-20 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

          {/* Status badges on banner */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={cn("border-0 shadow-lg px-3 py-1.5 text-xs", openStatusBadgeClass)}>
              {openStatus.open === true && (
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse mr-1.5" />
              )}
              {openStatusLabel}
            </Badge>
            {openStatus.todayHours && (
              <Badge className="hidden sm:inline-flex bg-background/80 backdrop-blur-sm text-foreground border border-border shadow-lg px-3 py-1.5 text-xs">
                <Clock className="h-3 w-3 mr-1" /> {openStatus.todayHours}
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            {business.is_premium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-3 py-1.5 text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Premium
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Company card overlapping banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-14 sm:-mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xl"
      >
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            {/* Logo */}
            <div className="h-20 w-20 sm:h-32 sm:w-32 rounded-xl border-2 border-border shadow-md shrink-0 overflow-hidden">
              <BusinessLogo
                name={business.name}
                logoUrl={business.logo_url}
                alt={business.name}
                initialsClassName="text-3xl sm:text-5xl"
              />
            </div>

            <div className="flex-1 min-w-0 w-full">
              {/* Name + verification */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {business.name}
                </h1>
                {business.is_verified && (
                  <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                )}
              </div>

              {/* Public identity / slug */}
              {business.slug && (
                <p className="text-sm text-primary font-medium mb-1">
                  @{business.slug}
                </p>
              )}

              {/* Category + territory */}
              <p className="text-sm text-muted-foreground capitalize mb-2">
                {business.category}
                {business.subcategoria && <> · {business.subcategoria}</>}
                {locationText && (
                  <>
                    {" "}
                    · <MapPin className="h-3 w-3 inline-block -mt-0.5" />{" "}
                    {locationText}
                  </>
                )}
              </p>

              {/* Rating + reviews */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg shrink-0">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-sm font-bold text-primary">
                    {business.rating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  ({business.total_reviews || 0} avaliações)
                </span>
                {(business.recommendations_count || 0) > 0 && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {business.recommendations_count} recomendações
                  </span>
                )}
                {yearsActive && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Há {yearsActive} no bairro
                  </span>
                )}
                {/* Coverage Badge */}
                <CoverageBadge
                  entityType="business"
                  entityId={business.id}
                  className="w-full sm:w-auto sm:ml-auto"
                />
              </div>

              {/* Operational highlights at top */}
              <div className="rounded-xl border border-border bg-secondary/40 p-3 mb-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                      openStatusCardClass,
                    )}
                  >
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        openStatusDotClass,
                      )}
                    />
                    {openStatusLabel}
                  </span>
                  {openStatus.todayHours && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-background/70 text-foreground">
                      <Clock className="h-3 w-3" /> Hoje: {openStatus.todayHours}
                    </span>
                  )}
                  {paymentHighlights.length > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-background/70 text-foreground">
                      <CreditCard className="h-3 w-3" />
                      {paymentHighlights.join(" | ")}
                    </span>
                  )}
                  {paymentHighlightsMobile.length > 0 && (
                    <span className="inline-flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-background/70 text-foreground">
                      <CreditCard className="h-3 w-3" />
                      {paymentHighlightsMobile.join(" | ")}
                    </span>
                  )}
                </div>

                {facilityHighlights.length > 0 && (
                  <div className="hidden sm:flex flex-wrap gap-2">
                    {facilityHighlights.map((facilityId) => {
                      const Icon = getFacilityIcon(facilityId) ?? ParkingSquare;
                      const label = getFacilityLabel(facilityId);
                      return (
                        <span
                          key={facilityId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-primary/20 bg-primary/5 text-primary"
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
                {facilityHighlightsMobile.length > 0 && (
                  <div className="flex sm:hidden flex-wrap gap-2">
                    {facilityHighlightsMobile.map((facilityId) => {
                      const Icon = getFacilityIcon(facilityId) ?? ParkingSquare;
                      const label = getFacilityLabel(facilityId);
                      return (
                        <span
                          key={facilityId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-primary/20 bg-primary/5 text-primary"
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Service modes */}
              <div className="flex flex-wrap gap-2">
                {serviceModes.map((modo) => {
                  const ModoIcon = getServiceModeIcon(modo);
                  const label = getServiceModeLabel(modo);
                  const color = getServiceModeColor(modo);
                  if (!ModoIcon) return null;
                  return (
                    <span
                      key={modo}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border",
                        color
                      )}
                    >
                      <ModoIcon className="h-3 w-3" /> {label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

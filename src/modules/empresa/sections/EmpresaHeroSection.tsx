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
  Calendar,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/badge';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { CoverageBadge } from '@/core/geospatial/components/CoverageBadge';
import {
  getServiceModeIcon,
  getServiceModeLabel,
  getServiceModeColor,
} from '@/core/business/constants';
import type { EmpresaHeroSectionProps } from './types';

export function EmpresaHeroSection({
  business,
  openStatus,
  yearsActive,
}: EmpresaHeroSectionProps) {
  const locationText = business.location?.full_name || business.location?.name || null;

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
            {openStatus.open ? (
              <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg px-3 py-1.5 text-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse mr-1.5" />{" "}
                Aberto agora
              </Badge>
            ) : (
              <Badge className="bg-destructive/90 text-destructive-foreground border-0 shadow-lg px-3 py-1.5 text-xs">
                Fechado
              </Badge>
            )}
            {openStatus.todayHours && (
              <Badge className="bg-background/80 backdrop-blur-sm text-foreground border border-border shadow-lg px-3 py-1.5 text-xs">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xl"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Logo */}
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl border-2 border-border shadow-md shrink-0 overflow-hidden">
              <BusinessLogo
                name={business.name}
                logoUrl={business.logo_url}
                alt={business.name}
                initialsClassName="text-3xl sm:text-4xl"
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + verification */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground leading-tight">
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
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-sm font-bold text-primary">
                    {business.rating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({business.total_reviews || 0} avaliações)
                </span>
                {yearsActive && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Há {yearsActive} no
                      bairro
                    </span>
                  </>
                )}
                {/* Coverage Badge */}
                <CoverageBadge
                  entityType="business"
                  entityId={business.id}
                  className="ml-auto"
                />
              </div>

              {/* Service modes */}
              {business.modos_atendimento &&
                business.modos_atendimento.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {business.modos_atendimento.map((modo) => {
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
                )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

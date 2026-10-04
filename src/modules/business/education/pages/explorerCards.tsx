import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  GraduationCap,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';
import { SafeLink } from '@/shared/components/security';
import { buildWhatsAppUrl } from '@/shared/utils/contactLinks';
import { getNicheByKey } from '../niches/registry';
import { EducationUrlService } from '../services/EducationUrlService';
import type { EducationPublicProfile } from '@/core/education';
import type { ViewMode } from './explorerFilters';

function buildWhatsAppHref(phone?: string | null): string | null {
  return buildWhatsAppUrl(phone);
}

interface EditorialCardProps {
  profile: EducationPublicProfile;
  index: number;
  view: ViewMode;
  nicheIcons: Record<string, React.ElementType>;
  nicheAccent: Record<string, string>;
  schoolNetworkLabels: Record<string, string>;
  sanitizeSummary: (value?: string | null) => string;
}

const secondaryBadgeClassName =
  'border-territory-border bg-territory-raised text-territory-ink';
const outlineBadgeClassName =
  'border-territory-border text-territory-muted';
const outlineActionClassName =
  'border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/40 hover:bg-territory-raised';

export function EditorialCard({
  profile,
  index,
  view,
  nicheIcons,
  nicheAccent,
  schoolNetworkLabels,
  sanitizeSummary,
}: EditorialCardProps) {
  const nicheConfig = getNicheByKey(profile.niche_key);
  const Icon = nicheIcons[profile.niche_key] ?? GraduationCap;
  const gradient =
    nicheAccent[profile.niche_key] ??
    'from-territory-brand/90 to-territory-brand/70';
  const route = profile.public_route;
  const detailHref = route ? EducationUrlService.buildDetailUrl(route) : null;
  const whatsappHref = buildWhatsAppHref(profile.whatsapp_number);
  const institutionName = profile.business_name ?? profile.institution_type;
  const educationLevels = profile.education_levels ?? [];

  if (view === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.3) }}
        className="group relative grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-territory-border bg-territory-surface text-territory-ink transition-all hover:border-territory-brand/30 hover:shadow-lg md:grid-cols-[220px_1fr_220px]"
      >
        <div
          className={cn(
            'relative flex h-32 items-center justify-center bg-gradient-to-br md:h-full',
            gradient,
          )}
        >
          <Icon
            className="h-12 w-12 text-territory-on-image drop-shadow"
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-col justify-between p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={`${secondaryBadgeClassName} text-[11px]`}
              >
                {nicheConfig?.displayName ?? profile.niche_key}
              </Badge>
              {nicheConfig?.isBeta && (
                <Badge
                  variant="outline"
                  className={`${outlineBadgeClassName} text-[11px]`}
                >
                  Beta
                </Badge>
              )}
            </div>
            <h3 className="mt-2 text-lg font-bold text-territory-ink transition-colors group-hover:text-territory-brand">
              {institutionName}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-territory-muted">
              {sanitizeSummary(profile.summary) ||
                'Instituição educacional cadastrada na vitrine.'}
            </p>
            {educationLevels.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {educationLevels.slice(0, 3).map((level) => (
                  <Badge
                    key={level}
                    variant="outline"
                    className={`${outlineBadgeClassName} text-[10px]`}
                  >
                    {level.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-territory-muted">
            {route?.district && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {route.district.replace(/-/g, ' ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-end gap-2 border-l border-territory-border/60 p-5">
          {detailHref ? (
            <Button
              size="sm"
              asChild
              className="w-full justify-between rounded-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
            >
              <Link to={detailHref}>
                Ver detalhes
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full justify-between rounded-full"
              disabled
            >
              Sem rota pública
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {whatsappHref && (
            <Button
              size="sm"
              variant="outline"
              className={`w-full justify-between rounded-full ${outlineActionClassName}`}
              asChild
            >
              <SafeLink href={whatsappHref} target="_blank">
                WhatsApp
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </SafeLink>
            </Button>
          )}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-territory-border bg-territory-surface text-territory-ink transition-all hover:-translate-y-0.5 hover:border-territory-brand/30 hover:shadow-lg"
    >
      <div className={cn('h-1 bg-gradient-to-r', gradient)} />
      <div className="flex flex-1 flex-col p-3">
        <div className="min-w-0 space-y-2">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-territory-border bg-territory-raised text-territory-brand shadow-sm"
            aria-label="Espaço para logo da escola"
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              className={`${secondaryBadgeClassName} px-2 py-0 text-[10px]`}
            >
              {profile.school_network
                ? schoolNetworkLabels[profile.school_network] ?? 'Escola'
                : nicheConfig?.displayName ?? profile.niche_key}
            </Badge>
          </div>
        </div>

        {detailHref ? (
          <Link to={detailHref} className="mt-3 block">
            <h3 className="line-clamp-2 break-words text-[15px] font-bold leading-5 text-territory-ink transition-colors group-hover:text-territory-brand">
              {institutionName}
            </h3>
          </Link>
        ) : (
          <h3 className="mt-3 line-clamp-2 break-words text-[15px] font-bold leading-5 text-territory-ink">
            {institutionName}
          </h3>
        )}

        {educationLevels.length > 0 && (
          <div className="mt-3 space-y-1">
            {educationLevels.slice(0, 2).map((level) => (
              <div
                key={level}
                className="flex items-start gap-1.5 text-xs leading-5 text-territory-muted"
              >
                <Check
                  className="mt-0.5 h-3 w-3 shrink-0 text-territory-success"
                  aria-hidden="true"
                />
                <span className="line-clamp-1 capitalize">
                  {level.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-territory-muted">
          {route?.district ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate capitalize">
                {route.district.replace(/-/g, ' ')}
              </span>
            </span>
          ) : (
            <span />
          )}
        </div>

        <div className="mt-3 flex gap-1.5 border-t border-territory-border/60 pt-3">
          {detailHref ? (
            <Button
              size="sm"
              asChild
              className="h-8 flex-1 rounded-full bg-territory-brand px-3 text-xs text-territory-on-image hover:bg-territory-brand/90"
            >
              <Link to={detailHref}>
                Detalhes
                <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 flex-1 rounded-full px-3 text-xs"
              disabled
            >
              Sem rota
            </Button>
          )}
          {whatsappHref && (
            <Button
              size="sm"
              variant="outline"
              className={`h-8 rounded-full px-2.5 ${outlineActionClassName}`}
              asChild
            >
              <SafeLink
                href={whatsappHref}
                target="_blank"
                aria-label={`Abrir WhatsApp de ${institutionName}`}
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              </SafeLink>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-territory-border bg-territory-surface">
      <Skeleton className="h-20 w-full" />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
    </div>
  );
}

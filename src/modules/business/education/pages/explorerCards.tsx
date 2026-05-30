import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, ChevronRight, GraduationCap, Heart, MapPin, MessageCircle, ScanSearch } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';
import { SafeLink } from '@/shared/components/security';
import { buildWhatsAppUrl } from '@/shared/utils/contactLinks';
import { getNicheByKey } from '../niches/registry';
import { EducationUrlService } from '../services/EducationUrlService';
import type { EducationPublicProfile } from '../types';
import type { ViewMode } from './explorerFilters';

function buildWhatsAppHref(phone?: string | null): string | null {
  return buildWhatsAppUrl(phone);
}

interface EditorialCardProps {
  profile: EducationPublicProfile;
  index: number;
  onCompareToggle: (id: string) => void;
  comparing: boolean;
  view: ViewMode;
  nicheIcons: Record<string, React.ElementType>;
  nicheAccent: Record<string, string>;
  schoolNetworkLabels: Record<string, string>;
  sanitizeSummary: (value?: string | null) => string;
}

export function EditorialCard({
  profile,
  index,
  onCompareToggle,
  comparing,
  view,
  nicheIcons,
  nicheAccent,
  schoolNetworkLabels,
  sanitizeSummary,
}: EditorialCardProps) {
  const nicheConfig = getNicheByKey(profile.niche_key);
  const Icon = nicheIcons[profile.niche_key] ?? GraduationCap;
  const gradient = nicheAccent[profile.niche_key] ?? 'from-primary to-primary/70';
  const route = profile.public_route;
  const detailHref = route
    ? EducationUrlService.buildDetailUrl(route)
    : null;
  const whatsappHref = buildWhatsAppHref(profile.whatsapp_number);
  const institutionName = profile.business_name ?? profile.institution_type;
  const educationLevels = profile.education_levels ?? [];

  if (view === 'list') {
    return (
      <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }} className="group relative grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg md:grid-cols-[220px_1fr_220px]">
        <div className={cn('relative flex h-32 items-center justify-center bg-gradient-to-br md:h-full', gradient)}>
          <Icon className="h-12 w-12 text-white drop-shadow" />
        </div>
        <div className="flex flex-col justify-between p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[11px]">{nicheConfig?.displayName ?? profile.niche_key}</Badge>
              {nicheConfig?.isBeta && <Badge variant="outline" className="text-[11px]">Beta</Badge>}
            </div>
            <h3 className="mt-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">{institutionName}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{sanitizeSummary(profile.summary) || 'Instituicao educacional cadastrada na vitrine.'}</p>
            {educationLevels.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{educationLevels.slice(0, 3).map((level) => <Badge key={level} variant="outline" className="text-[10px]">{level.replace(/_/g, ' ')}</Badge>)}</div>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">{route?.district && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {route.district.replace(/-/g, ' ')}</span>}</div>
        </div>
        <div className="flex flex-col justify-between gap-2 border-l border-border/60 p-5">
          <button onClick={() => onCompareToggle(profile.id)} className={cn('inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', comparing ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
            <ScanSearch className="h-3.5 w-3.5" />
            {comparing ? 'Adicionado' : 'Comparar'}
          </button>
          {detailHref ? <Link to={detailHref}><Button size="sm" className="w-full justify-between rounded-full">Ver detalhes <ArrowUpRight className="h-4 w-4" /></Button></Link> : <Button size="sm" className="w-full justify-between rounded-full" disabled>Sem rota publica <ArrowUpRight className="h-4 w-4" /></Button>}
          {whatsappHref && (
            <Button size="sm" variant="outline" className="w-full justify-between rounded-full" asChild>
              <SafeLink href={whatsappHref} target="_blank">WhatsApp <MessageCircle className="h-4 w-4" /></SafeLink>
            </Button>
          )}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.3) }} className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <div className={cn('h-1 bg-gradient-to-r', gradient)} />
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-primary shadow-sm" aria-label="Espaco para logo da escola"><Icon className="h-5 w-5" /></div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="px-2 py-0 text-[10px]">{profile.school_network ? schoolNetworkLabels[profile.school_network] ?? 'Escola' : nicheConfig?.displayName ?? profile.niche_key}</Badge>
            </div>
          </div>
          <button type="button" onClick={() => onCompareToggle(profile.id)} className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition', comparing ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary')} aria-label={comparing ? 'Remover do comparador' : 'Adicionar ao comparador'}>{comparing ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}</button>
        </div>
        {detailHref ? <Link to={detailHref} className="mt-3 block"><h3 className="line-clamp-2 break-words text-[15px] font-bold leading-5 text-foreground transition-colors group-hover:text-primary">{institutionName}</h3></Link> : <h3 className="mt-3 line-clamp-2 break-words text-[15px] font-bold leading-5 text-foreground">{institutionName}</h3>}
        {educationLevels.length > 0 && <div className="mt-3 space-y-1">{educationLevels.slice(0, 2).map((level) => <div key={level} className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /><span className="line-clamp-1 capitalize">{level.replace(/_/g, ' ')}</span></div>)}</div>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-muted-foreground">{route?.district ? <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate capitalize">{route.district.replace(/-/g, ' ')}</span></span> : <span />}</div>
        <div className="mt-3 flex gap-1.5 border-t border-border/60 pt-3">
          {detailHref ? <Link to={detailHref} className="flex-1"><Button size="sm" className="h-8 w-full rounded-full px-3 text-xs">Detalhes<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></Link> : <Button size="sm" className="h-8 flex-1 rounded-full px-3 text-xs" disabled>Sem rota</Button>}
          {whatsappHref && (
            <Button size="sm" variant="outline" className="h-8 rounded-full px-2.5" asChild>
              <SafeLink href={whatsappHref} target="_blank"><MessageCircle className="h-3.5 w-3.5" /></SafeLink>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
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

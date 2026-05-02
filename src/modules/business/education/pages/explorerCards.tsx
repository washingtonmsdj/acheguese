import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, ChevronRight, GraduationCap, Heart, MapPin, MessageCircle, ScanSearch } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';
import { getNicheByKey } from '../niches/registry';
import type { EducationProfile } from '../types';
import type { EducationDetailPreview } from '../mocks/publicEducationPage.mock';
import type { ViewMode } from './explorerFilters';

const CARD_HIDDEN_STAT_LABELS = new Set(['ensino', 'fonte']);

function buildWhatsAppHref(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('55') ? digits : `55${digits.replace(/^0+/, '')}`;
  return `https://wa.me/${normalized}`;
}

interface EditorialCardProps {
  profile: EducationProfile;
  preview?: EducationDetailPreview;
  index: number;
  isPreviewSource: boolean;
  onCompareToggle: (id: string) => void;
  comparing: boolean;
  view: ViewMode;
  route?: { state?: string; city?: string; district?: string; slug?: string };
  nicheIcons: Record<string, React.ElementType>;
  nicheAccent: Record<string, string>;
  schoolNetworkLabels: Record<string, string>;
  sanitizeSummary: (value?: string | null) => string;
}

export function EditorialCard({
  profile,
  preview,
  index,
  isPreviewSource,
  onCompareToggle,
  comparing,
  view,
  route,
  nicheIcons,
  nicheAccent,
  schoolNetworkLabels,
  sanitizeSummary,
}: EditorialCardProps) {
  const nicheConfig = getNicheByKey(profile.niche_key);
  const Icon = nicheIcons[profile.niche_key] ?? GraduationCap;
  const gradient = nicheAccent[profile.niche_key] ?? 'from-primary to-primary/70';
  const detailHref = route?.state && route?.city && route?.district && route?.slug
    ? `/educacao/${route.state}/${route.city}/${route.district}/${route.slug}`
    : '#';
  const whatsappHref = buildWhatsAppHref(profile.whatsapp_number);
  const programs = preview?.programs ?? [];
  const stats = preview?.stats ?? [];
  const visibleStats = stats.filter(
    (stat) =>
      !CARD_HIDDEN_STAT_LABELS.has(stat.label.toLowerCase()) &&
      !(profile.school_network && stat.label.toLowerCase() === 'rede'),
  );

  if (view === 'list') {
    return (
      <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }} className="group relative grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg md:grid-cols-[220px_1fr_220px]">
        <div className={cn('relative flex h-32 items-center justify-center bg-gradient-to-br md:h-full', gradient)}>
          <Icon className="h-12 w-12 text-white drop-shadow" />
          {isPreviewSource && <Badge className="absolute left-3 top-3 border-white/30 bg-white/20 text-[10px] uppercase tracking-wide text-white backdrop-blur-sm">Censo Escolar</Badge>}
        </div>
        <div className="flex flex-col justify-between p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[11px]">{nicheConfig?.displayName ?? profile.niche_key}</Badge>
              {nicheConfig?.isBeta && <Badge variant="outline" className="text-[11px]">Beta</Badge>}
            </div>
            <h3 className="mt-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">{profile.institution_type}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{sanitizeSummary(profile.summary) || 'Instituicao educacional cadastrada na vitrine.'}</p>
            {programs.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{programs.slice(0, 3).map((p) => <Badge key={p.id} variant="outline" className="text-[10px]">{p.name}</Badge>)}{programs.length > 3 && <Badge variant="outline" className="text-[10px]">+{programs.length - 3}</Badge>}</div>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">{route?.district && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {route.district}</span>}</div>
        </div>
        <div className="flex flex-col justify-between gap-2 border-l border-border/60 p-5">
          <button onClick={() => onCompareToggle(profile.id)} className={cn('inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', comparing ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
            <ScanSearch className="h-3.5 w-3.5" />
            {comparing ? 'Adicionado' : 'Comparar'}
          </button>
          <Link to={detailHref}><Button size="sm" className="w-full justify-between rounded-full">Ver detalhes <ArrowUpRight className="h-4 w-4" /></Button></Link>
          {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="w-full justify-between rounded-full">WhatsApp <MessageCircle className="h-4 w-4" /></Button></a>}
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
              {isPreviewSource && <Badge variant="outline" className="px-1.5 py-0 text-[9px] uppercase tracking-wide">Publica</Badge>}
            </div>
          </div>
          <button type="button" onClick={() => onCompareToggle(profile.id)} className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition', comparing ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary')} aria-label={comparing ? 'Remover do comparador' : 'Adicionar ao comparador'}>{comparing ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}</button>
        </div>
        <Link to={detailHref} className="mt-3 block"><h3 className="line-clamp-2 break-words text-[15px] font-bold leading-5 text-foreground transition-colors group-hover:text-primary">{profile.institution_type}</h3></Link>
        {visibleStats.length > 0 && <div className="mt-3 grid grid-cols-2 gap-1.5">{visibleStats.slice(0, 2).map((s) => <div key={s.label} className="min-w-0 rounded-lg border border-border/60 bg-muted/40 px-2 py-1.5 transition-colors group-hover:bg-muted/70"><div className="truncate text-xs font-bold capitalize text-foreground">{s.value}</div><div className="truncate text-[10px] text-muted-foreground">{s.label}</div></div>)}</div>}
        {programs.length > 0 && <div className="mt-3 space-y-1">{programs.slice(0, 1).map((p) => <div key={p.id} className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /><span className="line-clamp-1">{p.name}</span></div>)}</div>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-muted-foreground">{route?.district ? <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate capitalize">{route.district.replace(/-/g, ' ')}</span></span> : <span />}</div>
        <div className="mt-3 flex gap-1.5 border-t border-border/60 pt-3">
          <Link to={detailHref} className="flex-1"><Button size="sm" className="h-8 w-full rounded-full px-3 text-xs">Detalhes<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></Link>
          {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="h-8 rounded-full px-2.5"><MessageCircle className="h-3.5 w-3.5" /></Button></a>}
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


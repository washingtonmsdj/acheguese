/**
 * EducationExplorerPage
 *
 * Vitrine premium de descoberta educacional.
 * Design editorial/boutique com command-search, filtros multi-faceta,
 * comparador flutuante e cards de alta densidade informacional.
 *
 * Foco: descoberta, comparacao e conversao.
 *
 * Rota: /educacao/:state/:city
 *       /educacao/:state/:city/:district
 *
 * Consome SSOT existente:
 *  - useEducationList (hook)
 *  - getPublicNiches / getNicheByKey (registry)
 *  - educationLandingPreviewProfiles (base publica inicial, isolada em /mocks)
 *
 * @module education
 * @version 3.0.0
 */

import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Search,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Star,
  Heart,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Users,
  Shield,
  Building2,
  School,
  Baby,
  Languages,
  Calculator,
  Wrench,
  BookOpen,
  Music,
  Dumbbell,
  Phone,
  MessageCircle,
  X,
  Check,
  Filter as FilterIcon,
  Award,
  Lightbulb,
  Info,
  Globe,
  Target,
  ChevronDown,
  ListFilter,
  Grid3x3,
  Rows,
  ScanSearch,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Separator } from '@/shared/components/ui/separator';
import { Slider } from '@/shared/components/ui/slider';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { cn } from '@/shared/utils/cn';
import { useResolveTerritoryFromUrl } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

import { useEducationList } from '../hooks/useEducationList';
import { getPublicNiches, getNicheByKey } from '../niches/registry';
import {
  educationLandingPreviewProfiles,
  educationPreviewRouteByProfileId,
  educationDetailPreviewMap,
  type EducationDetailPreview,
} from '../mocks/publicEducationPage.mock';
import type { EducationProfile } from '../types';

// ============================================================================
// MAPAS DE PRESENTACAO (UI-only, derivados do registry)
// ============================================================================

const NICHE_ICONS: Record<string, React.ElementType> = {
  regular_school: School,
  daycare: Baby,
  language_school: Languages,
  prep_course: Calculator,
  technical_school: Wrench,
  tutoring_center: BookOpen,
  music_school: Music,
  sports_school: Dumbbell,
};

const NICHE_ACCENT: Record<string, string> = {
  regular_school: 'from-blue-500/90 to-indigo-600/90',
  daycare: 'from-pink-400/90 to-rose-500/90',
  language_school: 'from-emerald-400/90 to-teal-600/90',
  prep_course: 'from-orange-400/90 to-amber-600/90',
  technical_school: 'from-violet-500/90 to-purple-600/90',
  tutoring_center: 'from-cyan-400/90 to-blue-500/90',
  music_school: 'from-fuchsia-400/90 to-pink-600/90',
  sports_school: 'from-lime-400/90 to-green-600/90',
};

const MODALITIES = [
  { key: 'presencial', label: 'Presencial' },
  { key: 'online', label: 'Online' },
  { key: 'hibrido', label: 'Hibrido' },
] as const;

const AUDIENCES = [
  { key: 'kids', label: 'Criancas' },
  { key: 'teens', label: 'Adolescentes' },
  { key: 'adults', label: 'Adultos' },
  { key: 'all', label: 'Todas as idades' },
] as const;

const SCHOOL_NETWORK_FILTERS = [
  { key: 'municipal', label: 'Municipal' },
  { key: 'state', label: 'Estadual' },
  { key: 'federal', label: 'Federal' },
  { key: 'private', label: 'Privada' },
] as const;

const INSTITUTION_TYPE_FILTERS = [
  { key: 'cmei', label: 'CMEI' },
  { key: 'creche', label: 'Creche' },
  { key: 'escola', label: 'Escola' },
  { key: 'colegio', label: 'Colegio' },
  { key: 'curso', label: 'Curso' },
] as const;

const INFRASTRUCTURE_FILTERS = [
  { key: 'library', label: 'Biblioteca' },
  { key: 'laboratory', label: 'Laboratorio' },
  { key: 'sports_court', label: 'Quadra' },
  { key: 'pool', label: 'Piscina' },
  { key: 'accessibility', label: 'Acessibilidade' },
  { key: 'internet', label: 'Internet' },
] as const;

const SORTERS = [
  { key: 'relevance', label: 'Relevancia' },
  { key: 'name_asc', label: 'A-Z' },
  { key: 'newest', label: 'Mais recentes' },
] as const;

type SortKey = (typeof SORTERS)[number]['key'];
type ViewMode = 'grid' | 'list';

interface FilterState {
  query: string;
  niches: string[];
  schoolNetworks: string[];
  institutionTypes: string[];
  infrastructure: string[];
  modalities: string[];
  audiences: string[];
  district: string | null;
  priceRange: [number, number];
  onlyAvailable: boolean;
  sort: SortKey;
}

const INITIAL_FILTERS: FilterState = {
  query: '',
  niches: [],
  schoolNetworks: [],
  institutionTypes: [],
  infrastructure: [],
  modalities: [],
  audiences: [],
  district: null,
  priceRange: [0, 3000],
  onlyAvailable: false,
  sort: 'relevance',
};

const SCHOOL_NETWORK_LABELS: Record<string, string> = {
  municipal: 'Municipal',
  state: 'Estadual',
  federal: 'Federal',
  private: 'Privada',
};

const CARD_HIDDEN_STAT_LABELS = new Set(['ensino', 'fonte']);

function sanitizePublicEducationText(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/dados iniciais baseados[^.]*\./gi, '')
    .replace(/lista de espera/gi, '')
    .replace(/consultar valor/gi, '')
    .replace(/saber mais/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getInstitutionTypeKey(profile: EducationProfile): string {
  const name = profile.institution_type.toLowerCase();
  const niche = profile.niche_key;

  if (name.includes('centro municipal de educacao infantil') || name.includes('cmei')) {
    return 'cmei';
  }

  if (niche === 'daycare' || name.includes('creche')) {
    return 'creche';
  }

  if (name.includes('colegio') || name.includes('colégio')) {
    return 'colegio';
  }

  if (name.includes('curso') || niche === 'prep_course' || niche === 'language_school') {
    return 'curso';
  }

  return 'escola';
}

function labelFromOptions(options: readonly { key: string; label: string }[], key: string) {
  return options.find((option) => option.key === key)?.label ?? key;
}

function profileHasInfrastructure(profile: EducationProfile, key: string): boolean {
  const facilities = profile.school_facility_features ?? [];
  const access = profile.school_accessibility_features ?? [];
  const equipment = profile.school_equipment_features ?? [];
  if (key === 'library') return facilities.includes('library') || facilities.includes('reading_room');
  if (key === 'laboratory') return facilities.includes('science_lab') || facilities.includes('computer_lab');
  if (key === 'sports_court') return facilities.includes('sports_court') || facilities.includes('covered_sports_court') || facilities.includes('open_sports_court');
  if (key === 'pool') return facilities.includes('pool');
  if (key === 'accessibility') return access.length > 0;
  if (key === 'internet') return equipment.includes('internet');
  return false;
}

function buildWhatsAppHref(phone?: string | null): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  const normalized = digits.startsWith('55') ? digits : `55${digits.replace(/^0+/, '')}`;
  return `https://wa.me/${normalized}`;
}

function slugToLabel(slug: string): string {
  const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
  return slug
    .split('-')
    .map((word, i) =>
      i === 0 || !LOWERCASE_WORDS.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(' ');
}

function normalizeSlug(value?: string | null): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '-');
}

// ============================================================================
// COMPONENTES INTERNOS
// ============================================================================

function NicheChip({
  active,
  label,
  icon: Icon,
  onClick,
  count,
}: {
  active?: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'border-border/70 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EditorialCard({
  profile,
  preview,
  index,
  isPreviewSource,
  onCompareToggle,
  comparing,
  view,
}: {
  profile: EducationProfile;
  preview?: EducationDetailPreview;
  index: number;
  isPreviewSource: boolean;
  onCompareToggle: (id: string) => void;
  comparing: boolean;
  view: ViewMode;
}) {
  const nicheConfig = getNicheByKey(profile.niche_key);
  const Icon = NICHE_ICONS[profile.niche_key] ?? GraduationCap;
  const gradient = NICHE_ACCENT[profile.niche_key] ?? 'from-primary to-primary/70';
  const route = educationPreviewRouteByProfileId[profile.id];

  const detailHref = route
    ? `/educacao/${route.state}/${route.city}/${route.district}/${route.slug}`
    : '#';

  const whatsappHref = buildWhatsAppHref(profile.whatsapp_number);

  const programs = preview?.programs ?? [];
  const stats = preview?.stats ?? [];
  const visibleStats = stats.filter(
    (stat) =>
      !CARD_HIDDEN_STAT_LABELS.has(stat.label.toLowerCase()) &&
      !(profile.school_network && stat.label.toLowerCase() === 'rede')
  );

  if (view === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.3) }}
        className="group relative grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg md:grid-cols-[220px_1fr_220px]"
      >
        <div
          className={cn(
            'relative flex h-32 items-center justify-center bg-gradient-to-br md:h-full',
            gradient
          )}
        >
          <Icon className="h-12 w-12 text-white drop-shadow" />
          {isPreviewSource && (
            <Badge className="absolute left-3 top-3 border-white/30 bg-white/20 text-[10px] uppercase tracking-wide text-white backdrop-blur-sm">
              Censo Escolar
            </Badge>
          )}
        </div>

        <div className="flex flex-col justify-between p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[11px]">
                {nicheConfig?.displayName ?? profile.niche_key}
              </Badge>
              {nicheConfig?.isBeta && (
                <Badge variant="outline" className="text-[11px]">
                  Beta
                </Badge>
              )}
            </div>
            <h3 className="mt-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
              {profile.institution_type}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {sanitizePublicEducationText(profile.summary) || 'Instituicao educacional cadastrada na vitrine.'}
            </p>
            {programs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {programs.slice(0, 3).map((p) => (
                  <Badge key={p.id} variant="outline" className="text-[10px]">
                    {p.name}
                  </Badge>
                ))}
                {programs.length > 3 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{programs.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {route?.district && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {route.district}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-l border-border/60 p-5">
          <button
            onClick={() => onCompareToggle(profile.id)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              comparing
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <ScanSearch className="h-3.5 w-3.5" />
            {comparing ? 'Adicionado' : 'Comparar'}
          </button>
          <Link to={detailHref}>
            <Button size="sm" className="w-full justify-between rounded-full">
              Ver detalhes <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="w-full justify-between rounded-full">
                WhatsApp <MessageCircle className="h-4 w-4" />
              </Button>
            </a>
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
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
    >
      <div className={cn('h-1 bg-gradient-to-r', gradient)} />

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-primary shadow-sm"
              aria-label="Espaco para logo da escola"
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                {profile.school_network
                  ? SCHOOL_NETWORK_LABELS[profile.school_network] ?? 'Escola'
                  : nicheConfig?.displayName ?? profile.niche_key}
              </Badge>
              {isPreviewSource && (
                <Badge variant="outline" className="px-1.5 py-0 text-[9px] uppercase tracking-wide">
                  Publica
                </Badge>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onCompareToggle(profile.id)}
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition',
              comparing
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
            )}
            aria-label={comparing ? 'Remover do comparador' : 'Adicionar ao comparador'}
          >
            {comparing ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
          </button>
        </div>

        <Link to={detailHref} className="mt-3 block">
          <h3 className="line-clamp-2 break-words text-[15px] font-bold leading-5 text-foreground transition-colors group-hover:text-primary">
            {profile.institution_type}
          </h3>
        </Link>

        {visibleStats.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {visibleStats.slice(0, 2).map((s) => (
              <div
                key={s.label}
                className="min-w-0 rounded-lg border border-border/60 bg-muted/40 px-2 py-1.5 transition-colors group-hover:bg-muted/70"
              >
                <div className="truncate text-xs font-bold capitalize text-foreground">{s.value}</div>
                <div className="truncate text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {programs.length > 0 && (
          <div className="mt-3 space-y-1">
            {programs.slice(0, 1).map((p) => (
              <div key={p.id} className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                <span className="line-clamp-1">{p.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-muted-foreground">
          {route?.district ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate capitalize">{route.district.replace(/-/g, ' ')}</span>
            </span>
          ) : (
            <span />
          )}
        </div>

        <div className="mt-3 flex gap-1.5 border-t border-border/60 pt-3">
          <Link to={detailHref} className="flex-1">
            <Button size="sm" className="h-8 w-full rounded-full px-3 text-xs">
              Detalhes
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="h-8 rounded-full px-2.5">
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function SkeletonCard() {
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

function FilterPanel({
  filters,
  setFilters,
  niches,
  districts,
  resultsCount,
  onClear,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  niches: ReturnType<typeof getPublicNiches>;
  districts: string[];
  resultsCount: number;
  onClear: () => void;
}) {
  const toggle = <K extends 'niches' | 'schoolNetworks' | 'institutionTypes' | 'infrastructure' | 'modalities' | 'audiences'>(
    key: K,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Categorias</h3>
          <span className="text-xs text-muted-foreground">{niches.length}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {niches.map((n) => {
            const Icon = NICHE_ICONS[n.nicheKey] ?? GraduationCap;
            const active = filters.niches.includes(n.nicheKey);
            return (
              <button
                key={n.nicheKey}
                type="button"
                onClick={() => toggle('niches', n.nicheKey)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition',
                  active
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border/70 hover:border-primary/30'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{n.displayName}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-foreground">Rede</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SCHOOL_NETWORK_FILTERS.map((network) => {
            const active = filters.schoolNetworks.includes(network.key);
            return (
              <button
                key={network.key}
                type="button"
                onClick={() => toggle('schoolNetworks', network.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/70 hover:border-primary/30'
                )}
              >
                {network.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-foreground">Tipo de unidade</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {INSTITUTION_TYPE_FILTERS.map((type) => {
            const active = filters.institutionTypes.includes(type.key);
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => toggle('institutionTypes', type.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/70 hover:border-primary/30'
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-foreground">Infraestrutura</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {INFRASTRUCTURE_FILTERS.map((infra) => {
            const active = filters.infrastructure.includes(infra.key);
            return (
              <button
                key={infra.key}
                type="button"
                onClick={() => toggle('infrastructure', infra.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/70 hover:border-primary/30'
                )}
              >
                {infra.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-foreground">Modalidade</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {MODALITIES.map((m) => {
            const active = filters.modalities.includes(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => toggle('modalities', m.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/70 hover:border-primary/30'
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-foreground">Publico-alvo</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {AUDIENCES.map((a) => {
            const active = filters.audiences.includes(a.key);
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => toggle('audiences', a.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/70 hover:border-primary/30'
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {districts.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Bairro</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {districts.map((d) => {
                const active = filters.district === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        district: prev.district === d ? null : d,
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs capitalize transition',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 hover:border-primary/30'
                    )}
                  >
                    {d.replace(/-/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Faixa de preco (R$)</h3>
          <span className="text-xs text-muted-foreground">
            {filters.priceRange[0]} - {filters.priceRange[1]}
          </span>
        </div>
        <Slider
          className="mt-4"
          min={0}
          max={3000}
          step={50}
          value={filters.priceRange}
          onValueChange={(v) =>
            setFilters((prev) => ({ ...prev, priceRange: [v[0], v[1]] as [number, number] }))
          }
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          <Label htmlFor="only-available" className="cursor-pointer text-sm">
            Apenas com vagas
          </Label>
        </div>
        <Switch
          id="only-available"
          checked={filters.onlyAvailable}
          onCheckedChange={(v) => setFilters((prev) => ({ ...prev, onlyAvailable: v }))}
        />
      </div>

      <div className="mt-auto space-y-2">
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-3 text-xs text-muted-foreground">
          <strong className="text-foreground">{resultsCount}</strong> resultados com filtros atuais
        </div>
        <Button variant="ghost" className="w-full" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// FILTER BAR â€” Booking-style premium
// ============================================================================

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  niches: ReturnType<typeof getPublicNiches>;
  districts: string[];
  view: ViewMode;
  setView: (v: ViewMode) => void;
  resultsCount: number;
  onClear: () => void;
}

function FilterPill({
  active,
  onClear,
  icon: Icon,
  label,
  count,
  children,
}: {
  active?: boolean;
  onClear?: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'group inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-medium transition-all',
            active
              ? 'border-primary/60 bg-primary/10 text-primary shadow-sm shadow-primary/10'
              : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40'
          )}
        >
          <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
          <span>{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
          {active && onClear ? (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClear();
              }}
              className="ml-0.5 rounded-full p-0.5 text-primary/70 hover:bg-primary/10 hover:text-primary"
              aria-label="Limpar filtro"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : (
            <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function CheckOption({
  active,
  label,
  onClick,
  description,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
        active ? 'bg-primary/5 text-foreground' : 'hover:bg-muted'
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition',
          active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
        )}
      >
        {active && <Check className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
    </button>
  );
}

function FilterBar({
  filters,
  setFilters,
  niches,
  districts,
  view,
  setView,
  resultsCount,
  onClear,
}: FilterBarProps) {
  const toggle = <K extends 'niches' | 'schoolNetworks' | 'institutionTypes' | 'infrastructure' | 'modalities' | 'audiences'>(
    key: K,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const priceActive =
    filters.priceRange[0] > 0 || filters.priceRange[1] < 3000;
  const availableActive = filters.onlyAvailable;
  const advancedCount =
    (priceActive ? 1 : 0) + (availableActive ? 1 : 0);

  const totalActive =
    filters.niches.length +
    filters.schoolNetworks.length +
    filters.institutionTypes.length +
    filters.infrastructure.length +
    filters.modalities.length +
    filters.audiences.length +
    (filters.district ? 1 : 0) +
    advancedCount +
    (filters.query ? 1 : 0);

  return (
    <section className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4">
        {/* Linha principal */}
        <div className="flex flex-wrap items-center gap-2 py-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, query: e.target.value }))
              }
              placeholder="Buscar curso, escola, professor..."
              className="h-10 rounded-xl pl-9 pr-9"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, query: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Bairro */}
          <FilterPill
            icon={MapPin}
            label="Bairro"
            active={Boolean(filters.district)}
            count={filters.district ? 1 : 0}
            onClear={() => setFilters((prev) => ({ ...prev, district: null }))}
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bairros disponiveis
              </div>
              <CheckOption
                active={!filters.district}
                label="Todos os bairros"
                onClick={() => setFilters((prev) => ({ ...prev, district: null }))}
              />
              <div className="max-h-64 overflow-y-auto">
                {districts.map((d) => (
                  <CheckOption
                    key={d}
                    active={filters.district === d}
                    label={d.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        district: prev.district === d ? null : d,
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          </FilterPill>

          {/* Rede */}
          <FilterPill
            icon={Building2}
            label="Rede"
            active={filters.schoolNetworks.length > 0}
            count={filters.schoolNetworks.length}
            onClear={() => setFilters((prev) => ({ ...prev, schoolNetworks: [] }))}
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rede administrativa
              </div>
              {SCHOOL_NETWORK_FILTERS.map((network) => (
                <CheckOption
                  key={network.key}
                  active={filters.schoolNetworks.includes(network.key)}
                  label={network.label}
                  description={
                    network.key === 'municipal'
                      ? 'Unidades da prefeitura'
                      : network.key === 'state'
                      ? 'Unidades do estado'
                      : network.key === 'federal'
                      ? 'Unidades federais'
                      : 'Instituicoes privadas'
                  }
                  onClick={() => toggle('schoolNetworks', network.key)}
                />
              ))}
            </div>
          </FilterPill>

          {/* Tipo */}
          <FilterPill
            icon={School}
            label="Tipo"
            active={filters.institutionTypes.length > 0}
            count={filters.institutionTypes.length}
            onClear={() => setFilters((prev) => ({ ...prev, institutionTypes: [] }))}
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tipo de unidade
              </div>
              {INSTITUTION_TYPE_FILTERS.map((type) => (
                <CheckOption
                  key={type.key}
                  active={filters.institutionTypes.includes(type.key)}
                  label={type.label}
                  description={
                    type.key === 'cmei'
                      ? 'Centro municipal de educacao infantil'
                      : type.key === 'creche'
                      ? 'Atendimento de primeira infancia'
                      : type.key === 'colegio'
                      ? 'Unidade com series mais amplas'
                      : type.key === 'curso'
                      ? 'Cursos e formacoes livres'
                      : 'Escolas regulares'
                  }
                  onClick={() => toggle('institutionTypes', type.key)}
                />
              ))}
            </div>
          </FilterPill>

          {/* Infraestrutura */}
          <FilterPill
            icon={Building2}
            label="Infra"
            active={filters.infrastructure.length > 0}
            count={filters.infrastructure.length}
            onClear={() => setFilters((prev) => ({ ...prev, infrastructure: [] }))}
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estrutura da unidade
              </div>
              {INFRASTRUCTURE_FILTERS.map((infra) => (
                <CheckOption
                  key={infra.key}
                  active={filters.infrastructure.includes(infra.key)}
                  label={infra.label}
                  onClick={() => toggle('infrastructure', infra.key)}
                />
              ))}
            </div>
          </FilterPill>

          {/* Modalidade */}
          <FilterPill
            icon={Globe}
            label="Modalidade"
            active={filters.modalities.length > 0}
            count={filters.modalities.length}
            onClear={() => setFilters((prev) => ({ ...prev, modalities: [] }))}
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Como prefere estudar
              </div>
              {MODALITIES.map((m) => (
                <CheckOption
                  key={m.key}
                  active={filters.modalities.includes(m.key)}
                  label={m.label}
                  description={
                    m.key === 'presencial'
                      ? 'Aulas na unidade'
                      : m.key === 'online'
                      ? 'Acesso remoto'
                      : 'Combinacao dos dois'
                  }
                  onClick={() => toggle('modalities', m.key)}
                />
              ))}
            </div>
          </FilterPill>

          {/* Publico */}
          <FilterPill
            icon={Users}
            label="Publico"
            active={filters.audiences.length > 0}
            count={filters.audiences.length}
            onClear={() => setFilters((prev) => ({ ...prev, audiences: [] }))}
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Para quem
              </div>
              {AUDIENCES.map((a) => (
                <CheckOption
                  key={a.key}
                  active={filters.audiences.includes(a.key)}
                  label={a.label}
                  onClick={() => toggle('audiences', a.key)}
                />
              ))}
            </div>
          </FilterPill>

          {/* Preco */}
          <FilterPill
            icon={Target}
            label="Preco"
            active={priceActive}
            count={priceActive ? 1 : 0}
            onClear={() =>
              setFilters((prev) => ({ ...prev, priceRange: [0, 3000] }))
            }
          >
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Faixa mensal (R$)
                </div>
                <div className="mt-1 text-sm font-bold text-foreground">
                  R$ {filters.priceRange[0]} â€” R$ {filters.priceRange[1]}
                  {filters.priceRange[1] >= 3000 && '+'}
                </div>
              </div>
              <Slider
                min={0}
                max={3000}
                step={50}
                value={filters.priceRange}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [v[0], v[1]] as [number, number],
                  }))
                }
              />
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  [0, 500],
                  [500, 1000],
                  [1000, 3000],
                ].map(([min, max]) => {
                  const isActive =
                    filters.priceRange[0] === min && filters.priceRange[1] === max;
                  return (
                    <button
                      key={`${min}-${max}`}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: [min, max] as [number, number],
                        }))
                      }
                      className={cn(
                        'rounded-lg border px-2 py-1.5 text-xs transition',
                        isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      ate R${max}
                    </button>
                  );
                })}
              </div>
            </div>
          </FilterPill>

          {/* Disponibilidade (toggle direto) */}
          <button
            type="button"
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlyAvailable: !prev.onlyAvailable }))
            }
            className={cn(
              'inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-medium transition-all',
              availableActive
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 shadow-sm'
                : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40'
            )}
            aria-pressed={availableActive}
          >
            <Shield
              className={cn(
                'h-4 w-4',
                availableActive ? 'text-emerald-500' : 'text-muted-foreground'
              )}
            />
            <span>Com vagas</span>
          </button>

          {/* Spacer */}
          <div className="ml-auto flex items-center gap-2">
            {/* Sort */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted/40"
                >
                  <FilterIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden sm:inline">
                    {SORTERS.find((s) => s.key === filters.sort)?.label}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1">
                {SORTERS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, sort: s.key }))
                    }
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition',
                      filters.sort === s.key
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted'
                    )}
                  >
                    {s.label}
                    {filters.sort === s.key && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* View toggle */}
            <div className="flex items-center rounded-xl border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={cn(
                  'rounded-lg p-1.5 transition',
                  view === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                )}
                aria-label="Grade"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={cn(
                  'rounded-lg p-1.5 transition',
                  view === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                )}
                aria-label="Lista"
              >
                <Rows className="h-4 w-4" />
              </button>
            </div>

            {totalActive > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="hidden h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground md:inline-flex"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Rail de nichos */}
        <div className="relative -mx-4 border-t border-border/60 px-4 py-3">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-12 bg-gradient-to-l from-background to-transparent md:block" />
          <ScrollArea className="w-full">
            <div className="flex items-center gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, niches: [] }))}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  filters.niches.length === 0
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                Todas
                <span
                  className={cn(
                    'ml-1 rounded-full px-1.5 py-0.5 text-[10px]',
                    filters.niches.length === 0
                      ? 'bg-background/20 text-background'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {resultsCount}
                </span>
              </button>
              {niches.map((n) => {
                const NicheIco = NICHE_ICONS[n.nicheKey] ?? GraduationCap;
                const active = filters.niches.includes(n.nicheKey);
                return (
                  <button
                    key={n.nicheKey}
                    type="button"
                    onClick={() => toggle('niches', n.nicheKey)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    <NicheIco className="h-3.5 w-3.5" />
                    {n.displayName}
                    {n.isBeta && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                          active
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        Beta
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PAGINA PRINCIPAL
// ============================================================================

export function EducationExplorerPage() {
  const {
    state = 'ba',
    city = 'salvador',
    district,
    groupSlugOrDistrict,
  } = useParams();
  const niches = useMemo(() => getPublicNiches(), []);
  const { resolved } = useResolveTerritoryFromUrl();

  const { data, isLoading, isError, refetch } = useEducationList({});
  const realProfiles: EducationProfile[] = useMemo(
    () => data?.pages.flatMap((p) => p.profiles ?? []) ?? [],
    [data]
  );
  const hasRealData = realProfiles.length > 0;
  const allowPreviewFallback = true;
  
  const sourceProfiles: EducationProfile[] = useMemo(() => {
    if (!allowPreviewFallback) return realProfiles;

    const realKeys = new Set(
      realProfiles.map((profile) => profile.school_inep_code ?? profile.id)
    );
    const publicProfilesNotPersisted = educationLandingPreviewProfiles.filter(
      (profile) => !realKeys.has(profile.school_inep_code ?? profile.id)
    );

    return [...realProfiles, ...publicProfilesNotPersisted];
  }, [hasRealData, realProfiles, allowPreviewFallback]);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [view, setView] = useState<ViewMode>('grid');
  const [comparing, setComparing] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Pre-selecionar bairro pela URL se vier definido
  useEffect(() => {
    if (district) {
      setFilters((prev) => ({ ...prev, district }));
      return;
    }

    if (resolved?.kind === 'location' && resolved.location.type === 'district') {
      const districtSlug = resolved.location.slug ?? groupSlugOrDistrict;
      if (districtSlug) {
        setFilters((prev) => ({ ...prev, district: districtSlug }));
      }
      return;
    }

    // URL de grupo territorial: nao aplicar filtro de bairro fixo
    setFilters((prev) => ({ ...prev, district: null }));
  }, [district, groupSlugOrDistrict, resolved]);

  const districts = useMemo(() => {
    if (!allowPreviewFallback) return [];

    const set = new Set<string>();
    Object.values(educationDetailPreviewMap).forEach((p) => set.add(p.district));
    return Array.from(set).sort();
  }, [allowPreviewFallback]);

  const enriched = useMemo(() => {
    return sourceProfiles.map((profile) => {
      const route = educationPreviewRouteByProfileId[profile.id];
      const preview = route ? educationDetailPreviewMap[route.slug] : undefined;
      return { profile, preview, route };
    });
  }, [sourceProfiles]);

  const filtered = useMemo(() => {
    let list = enriched;

    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        ({ profile, preview }) =>
          profile.institution_type.toLowerCase().includes(q) ||
          sanitizePublicEducationText(profile.summary).toLowerCase().includes(q) ||
          (preview?.programs ?? []).some((p) => p.name.toLowerCase().includes(q))
      );
    }

    if (filters.niches.length > 0) {
      list = list.filter(({ profile }) => filters.niches.includes(profile.niche_key));
    }

    if (filters.schoolNetworks.length > 0) {
      list = list.filter(
        ({ profile }) =>
          Boolean(profile.school_network) &&
          filters.schoolNetworks.includes(profile.school_network as string)
      );
    }

    if (filters.institutionTypes.length > 0) {
      list = list.filter(({ profile }) =>
        filters.institutionTypes.includes(getInstitutionTypeKey(profile))
      );
    }

    if (filters.infrastructure.length > 0) {
      list = list.filter(({ profile }) =>
        filters.infrastructure.every((infra) => profileHasInfrastructure(profile, infra))
      );
    }

    if (filters.modalities.length > 0) {
      list = list.filter(({ preview }) =>
        (preview?.programs ?? []).some((p) =>
          filters.modalities.some((m) =>
            (p.modality ?? '').toLowerCase().includes(m.toLowerCase())
          )
        )
      );
    }

    if (filters.district) {
      const filterDistrict = normalizeSlug(filters.district);
      list = list.filter(({ route, preview }) => {
        const routeDistrict = normalizeSlug(route?.district);
        const previewDistrict = normalizeSlug(preview?.district);

        if (routeDistrict || previewDistrict) {
          return routeDistrict === filterDistrict || previewDistrict === filterDistrict;
        }

        // Perfis reais sem metadado territorial no read model nao devem sumir da vitrine
        return true;
      });
    }

    if (filters.onlyAvailable) {
      list = list.filter(({ preview }) =>
        (preview?.programs ?? []).some(
          (p) => (p.available_slots ?? 0) > 0 && p.is_active
        )
      );
    }

    if (filters.priceRange[1] < 3000 || filters.priceRange[0] > 0) {
      list = list.filter(({ preview }) =>
        (preview?.programs ?? []).some(
          (p) =>
            (p.price_from ?? 0) >= filters.priceRange[0] &&
            (p.price_from ?? 0) <= filters.priceRange[1]
        )
      );
    }

    if (filters.sort === 'name_asc') {
      list = [...list].sort((a, b) =>
        a.profile.institution_type.localeCompare(b.profile.institution_type)
      );
    } else if (filters.sort === 'newest') {
      list = [...list].sort(
        (a, b) =>
          new Date(b.profile.created_at).getTime() -
          new Date(a.profile.created_at).getTime()
      );
    }

    return list;
  }, [enriched, filters]);

  const toggleCompare = (id: string) => {
    setComparing((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 4 ? [...prev, id] : prev
    );
    if (comparing.length === 0) setDrawerOpen(true);
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const featured = useMemo(() => {
    if (!allowPreviewFallback) return [];

    return Object.values(educationDetailPreviewMap).slice(0, 6);
  }, [allowPreviewFallback]);

  const cityLabel = city.replace(/-/g, ' ');
  const territoryLabel = useMemo(() => {
    if (resolved?.kind === 'group') return resolved.group.name;
    if (resolved?.kind === 'location' && resolved.location.type === 'district') {
      return resolved.location.name;
    }
    if (groupSlugOrDistrict) return slugToLabel(groupSlugOrDistrict);
    return slugToLabel(city);
  }, [city, groupSlugOrDistrict, resolved]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Educacao em {territoryLabel} â€” Vitrine V3 | Acheguese</title>
        <meta
          name="description"
          content={`Explore escolas, cursos, professores e instituicoes educacionais em ${territoryLabel} com filtros avancados, comparador e contato direto.`}
        />
      </Helmet>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-muted/30 to-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 20%, hsl(var(--primary)) 0%, transparent 40%), radial-gradient(circle at 80% 70%, hsl(var(--primary)) 0%, transparent 40%)',
          }}
        />
        <div className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge
                variant="outline"
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs uppercase tracking-wide text-primary"
              >
                <Sparkles className="h-3 w-3" />
                Vitrine Educacional V3
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Encontre a escola, curso ou professor ideal em{' '}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent capitalize">
                  {territoryLabel}
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
                Compare instituicoes, filtre por modalidade, bairro e preco e fale
                diretamente por WhatsApp ou agende uma visita.
              </p>

              {/* Search command bar */}
              <div className="relative mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
                <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
                <Input
                  value={filters.query}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, query: e.target.value }))
                  }
                  placeholder="Buscar por curso, escola, professor ou servico..."
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-xl lg:hidden"
                      type="button"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full max-w-md overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Filtrar resultados</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel
                        filters={filters}
                        setFilters={setFilters}
                        niches={niches}
                        districts={districts}
                        resultsCount={filtered.length}
                        onClear={clearFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Quick niche chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {niches.slice(0, 6).map((n) => {
                  const Icon = NICHE_ICONS[n.nicheKey] ?? GraduationCap;
                  const active = filters.niches.includes(n.nicheKey);
                  return (
                    <NicheChip
                      key={n.nicheKey}
                      label={n.displayName}
                      icon={Icon}
                      active={active}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          niches: active
                            ? prev.niches.filter((v) => v !== n.nicheKey)
                            : [...prev.niches, n.nicheKey],
                        }))
                      }
                    />
                  );
                })}
              </div>
            </div>

            {/* Right: editorial collage */}
            <div className="relative hidden h-[420px] lg:block">
              <div className="absolute inset-0 grid grid-cols-2 gap-3">
                {featured.map((p, i) => {
                  const Icon = NICHE_ICONS[p.profile.niche_key] ?? GraduationCap;
                  const gradient =
                    NICHE_ACCENT[p.profile.niche_key] ?? 'from-primary to-primary/70';
                  return (
                    <motion.div
                      key={p.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        'relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br p-5 text-white shadow-lg',
                        gradient,
                        i === 0 && 'col-span-2 row-span-1',
                        i === 1 && 'row-span-2',
                        i === 2 && 'row-span-1'
                      )}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <Icon className="h-8 w-8 opacity-90" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider opacity-80">
                            {getNicheByKey(p.profile.niche_key)?.displayName}
                          </div>
                          <div className="mt-1 line-clamp-2 text-base font-bold">
                            {p.institutionName}
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1 text-[11px] opacity-80">
                            <MapPin className="h-3 w-3" /> {p.district}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          FILTER BAR â€” sticky, refinada
          Linha 1: pesquisa + filtros pop-over (booking style) + sort + view
          Linha 2: rail de nichos (chips com icones)
          ========================================================================== */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        niches={niches}
        districts={districts}
        view={view}
        setView={setView}
        resultsCount={filtered.length}
        onClear={clearFilters}
      />

      {/* MAIN LAYOUT */}
      <section className="container mx-auto px-4 py-10">
        <div>
            {/* Toolbar (apenas contador + indicador de fonte inicial) */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <strong className="text-foreground">{filtered.length}</strong>
                <span className="text-muted-foreground">
                  {filtered.length === 1 ? 'instituicao' : 'instituicoes'}
                </span>
              </div>
              {!hasRealData && (
                <Badge variant="outline" className="text-[10px]">
                  <Info className="mr-1 h-3 w-3" />
              Base publica inicial
                </Badge>
              )}
            </div>

            {/* Active filter chips */}
            {(filters.niches.length > 0 ||
              filters.schoolNetworks.length > 0 ||
              filters.institutionTypes.length > 0 ||
              filters.infrastructure.length > 0 ||
              filters.modalities.length > 0 ||
              filters.audiences.length > 0 ||
              filters.district ||
              filters.onlyAvailable) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {filters.niches.map((n) => (
                  <Badge key={n} variant="secondary" className="gap-1">
                    {getNicheByKey(n)?.displayName ?? n}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          niches: prev.niches.filter((v) => v !== n),
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.schoolNetworks.map((network) => (
                  <Badge key={network} variant="secondary" className="gap-1">
                    {labelFromOptions(SCHOOL_NETWORK_FILTERS, network)}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          schoolNetworks: prev.schoolNetworks.filter((v) => v !== network),
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.institutionTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    {labelFromOptions(INSTITUTION_TYPE_FILTERS, type)}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          institutionTypes: prev.institutionTypes.filter((v) => v !== type),
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.infrastructure.map((infra) => (
                  <Badge key={infra} variant="secondary" className="gap-1">
                    {labelFromOptions(INFRASTRUCTURE_FILTERS, infra)}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          infrastructure: prev.infrastructure.filter((v) => v !== infra),
                        }))
                      }
                      aria-label="Remover filtro"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.modalities.map((m) => (
                  <Badge key={m} variant="secondary" className="gap-1 capitalize">
                    {m}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          modalities: prev.modalities.filter((v) => v !== m),
                        }))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.district && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    {filters.district.replace(/-/g, ' ')}
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, district: null }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.onlyAvailable && (
                  <Badge variant="secondary" className="gap-1">
                    Com vagas
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, onlyAvailable: false }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <button
                  onClick={clearFilters}
                  className="ml-1 text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Limpar tudo
                </button>
              </div>
            )}

            {/* States */}
            {isError ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
                <Shield className="h-10 w-10 text-rose-500" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nao conseguimos carregar a vitrine
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Houve um erro ao consultar as instituicoes. Tente novamente em alguns
                  segundos.
                </p>
                <Button onClick={() => refetch()} className="mt-4 rounded-full">
                  Tentar novamente
                </Button>
              </div>
            ) : isLoading && !hasRealData ? (
              <div
                className={cn(
                  view === 'grid'
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6'
                    : 'flex flex-col gap-4'
                )}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
                <ScanSearch className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum resultado encontrado</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Tente remover alguns filtros ou buscar com outro termo. Estamos ampliando
                  a base de instituicoes constantemente.
                </p>
                <Button onClick={clearFilters} className="mt-4 rounded-full" variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  view === 'grid'
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6'
                    : 'flex flex-col gap-4'
                )}
              >
                {filtered.map(({ profile, preview }, i) => (
                  <EditorialCard
                    key={profile.id}
                    profile={profile}
                    preview={preview}
                    index={i}
                    isPreviewSource={Boolean(preview)}
                    onCompareToggle={toggleCompare}
                    comparing={comparing.includes(profile.id)}
                    view={view}
                  />
                ))}
              </div>
            )}

            {/* Niche showcase strip */}
            <div className="mt-12 rounded-3xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Categorias educacionais</h2>
                  <p className="text-sm text-muted-foreground">
                    Navegue por tipo de instituicao e descubra opcoes especializadas.
                  </p>
                </div>
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {niches.map((n) => {
                  const Icon = NICHE_ICONS[n.nicheKey] ?? GraduationCap;
                  const gradient = NICHE_ACCENT[n.nicheKey] ?? 'from-primary to-primary/70';
                  const count = sourceProfiles.filter(
                    (p) => p.niche_key === n.nicheKey
                  ).length;
                  return (
                    <button
                      key={n.nicheKey}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          niches: prev.niches.includes(n.nicheKey)
                            ? prev.niches.filter((v) => v !== n.nicheKey)
                            : [...prev.niches, n.nicheKey],
                        }))
                      }
                      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      <div
                        className={cn(
                          'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                          gradient
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-3 text-sm font-semibold">{n.displayName}</div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {count} {count === 1 ? 'opcao' : 'opcoes'}
                        </span>
                        {n.isBeta && (
                          <Badge variant="outline" className="text-[10px]">
                            Beta
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
      </section>

      {/* ==========================================================================
          FEATURED SECTION â€” Instituicoes em Destaque
          ========================================================================== */}
      <section className="border-t border-border bg-gradient-to-b from-muted/30 via-background to-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="mb-3" variant="secondary">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Instituicoes em Destaque
              </Badge>
              <h2 className="text-3xl font-bold capitalize text-foreground">
                Instituicoes em destaque em {territoryLabel}
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Curadoria com base em dados territoriais e informacoes institucionais publicas.
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden rounded-full sm:flex"
              onClick={clearFilters}
            >
              Ver todas
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
            {featured.map((preview, index) => {
              const FeaturedIcon =
                NICHE_ICONS[preview.profile.niche_key] ?? GraduationCap;
              const featuredGradient =
                NICHE_ACCENT[preview.profile.niche_key] ?? 'from-primary to-primary/70';
              const nicheLabel =
                getNicheByKey(preview.profile.niche_key)?.displayName ??
                preview.profile.niche_key;
              const detailHref = `/educacao/${preview.state}/${preview.city}/${preview.district}/${preview.slug}`;

              return (
                <motion.article
                  key={preview.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                >
                  <div
                    className={cn(
                      'relative h-28 bg-gradient-to-br p-5',
                      featuredGradient
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                        <FeaturedIcon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Destaque
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <Badge variant="secondary" className="text-[11px]">
                      {nicheLabel}
                    </Badge>
                    <h3 className="mt-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                      {preview.institutionName}
                    </h3>
                    {sanitizePublicEducationText(preview.profile.summary) && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {sanitizePublicEducationText(preview.profile.summary)}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {preview.stats
                        .filter((stat) => !CARD_HIDDEN_STAT_LABELS.has(stat.label.toLowerCase()))
                        .slice(0, 4)
                        .map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl bg-muted/60 px-3 py-2 transition-colors group-hover:bg-muted"
                        >
                          <div className="text-base font-bold text-foreground">
                            {stat.value}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-1.5">
                      {preview.highlights.slice(0, 3).map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="line-clamp-1">{h}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <Link to={detailHref}>
                        <Button
                          size="sm"
                          className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          Explorar
                          <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                      <span className="inline-flex items-center gap-1 text-xs capitalize text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {preview.district.replace(/-/g, ' ')}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground md:flex-row md:items-start md:gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Os dados iniciais das escolas publicas sao organizados a partir de bases
              publicas e consultas institucionais. Podem existir divergencias,
              desatualizacoes ou inconsistencias em horarios, contatos, etapas ofertadas e
              demais informacoes. Recomendamos confirmar os dados diretamente com a
              instituicao antes de tomar qualquer decisao.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          CTA SECTION â€” Cadastro de instituicao
          ========================================================================== */}
      <section className="relative overflow-hidden border-t border-border py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl"
          >
            <div className="overflow-hidden rounded-3xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm md:p-12">
              <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <Badge
                    variant="outline"
                    className="mb-4 inline-flex items-center gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs uppercase tracking-wide text-primary"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Para instituicoes
                  </Badge>
                  <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
                    Tem uma instituicao de ensino?
                  </h2>
                  <p className="mt-3 max-w-xl text-balance text-muted-foreground md:text-lg">
                    Cadastre-se no Achegue-se e alcance familias em busca de educacao de
                    qualidade. Capture leads, gerencie visitas e aumente suas matriculas.
                  </p>

                  <ul className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Vitrine territorial com SEO
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Captacao e pipeline de leads
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Eventos e visitas agendadas
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Analytics de conversao
                    </li>
                  </ul>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link to="/empresas/criar-empresa">
                      <Button size="lg" className="w-full rounded-full sm:w-auto">
                        Cadastrar instituicao
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/empresas">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full rounded-full sm:w-auto"
                      >
                        Ver empresas
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="relative hidden h-48 w-48 md:block">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-primary/60 shadow-2xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap className="h-20 w-20 text-white drop-shadow" />
                  </div>
                  <div className="absolute -right-3 -top-3 inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-md">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Premium
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating compare drawer */}
      <AnimatePresence>
        {comparing.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md md:inset-x-auto md:right-6 md:bottom-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2">
                <ScanSearch className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Comparando {comparing.length}/4
                </span>
              </div>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {comparing.map((id) => {
                  const profile = sourceProfiles.find((p) => p.id === id);
                  return profile ? (
                    <Badge key={id} variant="outline" className="gap-1">
                      {profile.institution_type}
                      <button onClick={() => toggleCompare(id)} aria-label="Remover">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setComparing([])}
                  className="rounded-full"
                >
                  Limpar
                </Button>
                <Button size="sm" disabled={comparing.length < 2} className="rounded-full">
                  <Award className="mr-1 h-4 w-4" />
                  Comparar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EducationExplorerPage;

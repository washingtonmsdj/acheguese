/**
 * TerritorialLandingPage â€” Vitrine pÃºblica do territÃ³rio
 *
 * Hub/landing para bairro individual ou agrupamento territorial.
 * PÃºblica â€” nÃ£o exige login.
 *
 * Hierarquia editorial (ordem de blocos):
 *   A. Hero do territÃ³rio
 *   B. EstatÃ­sticas do territÃ³rio (habitantes, negÃ³cios, escolas)
 *   C. Sobre o bairro (descriÃ§Ã£o, histÃ³ria)
 *   D. Destaques editoriais (curados â€” mÃ¡x. 3)
 *   E. Gastronomia (top 3 restaurantes/bares mais avaliados)
 *   F. NegÃ³cios locais (mÃ¡x. 4)
 *   G. ServiÃ§os disponÃ­veis (mÃ¡x. 4)
 *   H. Lazer e atividades
 *   I. Classificados recentes (mÃ¡x. 4)
 *   J. CTA Comunidade
 *
 * Regra editorial:
 *   - Destaques: mÃ¡x. 3 ativos, ordenados por position
 *   - NegÃ³cios: premium primeiro, depois rating
 *   - ServiÃ§os: verificados primeiro, depois rating
 *   - Classificados: mais recentes primeiro
 *   - Nenhum bloco exibe mais de 4 itens na landing
 *   - NavegaÃ§Ã£o principal via sidebar (nÃ£o duplicada na landing)
 */

import { useNavigate } from 'react-router-dom';
import {
  Users, Store, Wrench, Tag, Bus,
  ArrowRight, MapPin, ChevronRight,
  Star, BadgeCheck, Loader2,
  Megaphone, Calendar, Sparkles,
  Building2, GraduationCap, TrendingUp,
  UtensilsCrossed, Music,
} from 'lucide-react';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { useTerritorialContext } from './TerritorialLayout';
import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';
import { useLandingFeatured } from '@/core/landing/hooks/useLandingFeatured';
import { useTerritorialHighlights } from '@/core/territorial/highlights/useTerritorialHighlights';
import { useTerritoryStats } from '@/core/territorial/hooks/useTerritoryStats';
import { getCityStateFromResolved, formatCityState } from '@/core/location/utils/territoryHelpers';
import { MODULE_SLUGS } from '../utils/territoryUrls';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { classifiedUrlService } from '@/shared/services/classifieds';
import type { FeaturedBusiness, FeaturedService, FeaturedClassified } from '@/core/landing/types';
import type { TerritorialHighlight, HighlightType } from '@/core/territorial/highlights/types';
import { TerritoryAIContentSection } from '@/core/territorial/components/TerritoryAIContentSection';
import { TERRITORIAL_LANDING_LIMITS } from '@/core/routing/config/territorialLanding.limits';

// â”€â”€ Regra editorial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getTerritoryName(resolved: ReturnType<typeof useTerritorialContext>['resolved']): string {
  if (!resolved) return '';
  return resolved.kind === 'group' ? resolved.group.name : resolved.location.name;
}

function getTerritorySubtitle(resolved: ReturnType<typeof useTerritorialContext>['resolved']): string {
  if (!resolved) return '';
  
  const cityState = getCityStateFromResolved(resolved);
  const cityStateStr = formatCityState(cityState);
  
  if (resolved.kind === 'group') {
    const names = resolved.group.members.map((m) => m.name);
    if (names.length === 0) return `Agrupamento territorial${cityStateStr ? ` Â· ${cityStateStr}` : ''}`;
    if (names.length <= 3) return `${names.join(', ')}${cityStateStr ? ` Â· ${cityStateStr}` : ''}`;
    return `${names.slice(0, 3).join(', ')} e mais ${names.length - 3} bairros${cityStateStr ? ` Â· ${cityStateStr}` : ''}`;
  }
  
  return `Bairro${cityStateStr ? ` Â· ${cityStateStr}` : ''}`;
}

function getMemberList(resolved: ReturnType<typeof useTerritorialContext>['resolved']): string[] {
  if (!resolved || resolved.kind !== 'group') return [];
  return resolved.group.members.map((m) => m.name);
}

function formatPrice(price: number): string {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ');
}

// â”€â”€ Sub-componentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionHeader({
  title,
  subtitle,
  linkLabel,
  linkTo,
  onNavigate,
}: {
  title: string;
  subtitle?: string;
  linkLabel: string;
  linkTo: string;
  onNavigate: (to: string) => void;
}) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <button
        onClick={() => onNavigate(linkTo)}
        className="flex items-center gap-1 text-xs text-teal-500 hover:text-teal-400 transition-colors flex-shrink-0 mt-0.5"
      >
        {linkLabel}
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function EmptyBlock({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground/60 mt-1">{hint}</p>}
    </div>
  );
}

function BlockLoader() {
  return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );
}

// â”€â”€ Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BusinessCard({ b, onNavigate }: { b: FeaturedBusiness; onNavigate: (to: string) => void }) {
  return (
    <button
      onClick={() => {
        if (!b.slug) return;
        const url = BusinessUrlService.getCanonicalUrl({ id: b.id, slug: b.slug, is_premium: b.is_premium, geographic_path: b.geographic_path });
        onNavigate(url);
      }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-blue-500/40 hover:bg-accent transition-all text-left w-full"
    >
      <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
        <BusinessLogo
          name={b.name}
          logoUrl={b.logo_url}
          alt={b.name}
          initialsClassName="text-sm"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground truncate">{b.name}</p>
          {b.is_verified && <BadgeCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />}
          {b.is_premium && (
            <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
              PRO
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{formatCategory(b.category)}</p>
        {b.rating > 0 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
            <span className="text-[10px] text-muted-foreground">{b.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function ServiceCard({ s, onNavigate, moduleUrl }: { s: FeaturedService; onNavigate: (to: string) => void; moduleUrl: string }) {
  return (
    <button
      onClick={() => onNavigate(moduleUrl)}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-violet-500/40 hover:bg-accent transition-all text-left w-full"
    >
      <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
        <BusinessLogo
          name={s.name}
          logoUrl={s.logo_url}
          alt={s.name}
          initialsClassName="text-sm"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
          {s.is_verified && <BadgeCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />}
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{formatCategory(s.category)}</p>
        {s.price_range && (
          <p className="text-[10px] text-violet-500 mt-0.5 font-medium">{s.price_range}</p>
        )}
      </div>
    </button>
  );
}

function ClassifiedCard({ c, onNavigate, shortUrl }: { 
  c: FeaturedClassified; 
  onNavigate: (to: string) => void;
  shortUrl: (publicId: string) => string;
}) {
  const thumb = c.photos?.[0];
  
  // âœ… ConstrÃ³i URL canÃ´nica se dados disponÃ­veis, senÃ£o usa link curto
  const getUrl = () => {
    if (c.geographic_path && c.category_slug && c.subcategory_slug && c.slug && c.public_id) {
      try {
        const urls = classifiedUrlService.buildUrls({
          id: c.id,
          public_id: c.public_id,
          slug: c.slug,
          geographic_path: c.geographic_path,
          category_slug: c.category_slug,
          subcategory_slug: c.subcategory_slug,
        });
        return urls.canonical;
      } catch {
        return shortUrl(c.public_id);
      }
    }
    return shortUrl(c.public_id);
  };
  
  return (
    <button
      onClick={() => onNavigate(getUrl())}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-orange-500/40 hover:bg-accent transition-all text-left w-full"
    >
      <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
        {thumb
          ? <img src={thumb} alt={c.titulo} className="h-full w-full object-cover" />
          : <Tag className="h-4 w-4 text-muted-foreground" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{c.titulo}</p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{formatCategory(c.category)}</p>
        <p className="text-[10px] font-semibold text-orange-500 mt-0.5">{formatPrice(c.price)}</p>
      </div>
    </button>
  );
}

// â”€â”€ Highlight card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HIGHLIGHT_ICON: Record<HighlightType, React.ElementType> = {
  business:   Store,
  service:    Wrench,
  classified: Tag,
  event:      Calendar,
  creator:    Sparkles,
  notice:     Megaphone,
};

const HIGHLIGHT_COLOR: Record<HighlightType, string> = {
  business:   'bg-blue-500/8 text-blue-700 dark:text-blue-300 border-blue-500/20',
  service:    'bg-violet-500/8 text-violet-700 dark:text-violet-300 border-violet-500/20',
  classified: 'bg-orange-500/8 text-orange-700 dark:text-orange-300 border-orange-500/20',
  event:      'bg-teal-500/8 text-teal-700 dark:text-teal-300 border-teal-500/20',
  creator:    'bg-pink-500/8 text-pink-700 dark:text-pink-300 border-pink-500/20',
  notice:     'bg-amber-500/8 text-amber-800 dark:text-amber-300 border-amber-500/20',
};

function HighlightCard({ h, onNavigate }: { h: TerritorialHighlight; onNavigate: (to: string) => void }) {
  const Icon = HIGHLIGHT_ICON[h.highlight_type] ?? Megaphone;
  const colorClass = HIGHLIGHT_COLOR[h.highlight_type] ?? HIGHLIGHT_COLOR.notice;
  const hasCta = h.cta_label && h.cta_url;

  return (
    <div className={`rounded-xl border p-3.5 ${colorClass}`}>
      <div className="flex items-start gap-3">
        {h.image_url ? (
          <img src={h.image_url} alt={h.title} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-current/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 opacity-60" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug">{h.title}</p>
          {h.subtitle && (
            <p className="text-[10px] opacity-70 mt-0.5 leading-relaxed line-clamp-2">{h.subtitle}</p>
          )}
          {hasCta && (
            <button
              onClick={() => onNavigate(h.cta_url!)}
              className="mt-2 flex items-center gap-1 text-[10px] font-semibold opacity-80 hover:opacity-100 transition-opacity"
            >
              {h.cta_label}
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ MÃ³dulos de navegaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MODULE_ITEMS = [
  { slug: MODULE_SLUGS.community,   icon: Users,  label: 'Comunidade',    color: 'text-teal-500' },
  { slug: MODULE_SLUGS.business,    icon: Store,  label: 'Empresas',      color: 'text-blue-500' },
  { slug: MODULE_SLUGS.services,    icon: Wrench, label: 'ServiÃ§os',      color: 'text-violet-500' },
  { slug: MODULE_SLUGS.classifieds, icon: Tag,    label: 'Classificados', color: 'text-orange-500' },
  { slug: MODULE_SLUGS.mobility,    icon: Bus,    label: 'Mobilidade',    color: 'text-rose-500' },
] as const;

// â”€â”€ PÃ¡gina principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function TerritorialLandingPage() {
  const { resolved, baseUrl } = useTerritorialContext();
  const navigate = useNavigate();

  const filter = useTerritoryFilter(resolved);
  const { businesses, services, classifieds, stats, isLoading } = useLandingFeatured(filter);
  const { data: allHighlights = [], isLoading: highlightsLoading } = useTerritorialHighlights(resolved);
  const { data: territoryStats, isLoading: statsLoading } = useTerritoryStats(resolved);
  const shortClassifiedUrl = (publicId: string) => classifiedUrlService.buildShortUrl(publicId);

  // Aplica limite editorial de highlights
  const highlights = allHighlights.slice(0, TERRITORIAL_LANDING_LIMITS.HIGHLIGHTS);

  const name = getTerritoryName(resolved);
  const subtitle = getTerritorySubtitle(resolved);
  const memberList = getMemberList(resolved);
  const isGroup = resolved?.kind === 'group';

  // URLs dos mÃ³dulos (formato correto: /modulo/state/city)
  const moduleUrls = {
    business: `/${MODULE_SLUGS.business}${baseUrl}`,
    services: `/${MODULE_SLUGS.services}${baseUrl}`,
    classifieds: `/${MODULE_SLUGS.classifieds}${baseUrl}`,
    community: `/${MODULE_SLUGS.community}${baseUrl}`,
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">

      {/* â”€â”€ NAVBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <button
            onClick={() => navigate(baseUrl)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-teal-500" />
            </div>
            <span className="text-lg font-bold text-foreground font-heading">
              {name}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(moduleUrls.community)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block"
            >
              Comunidade
            </button>
            <button
              onClick={() => navigate(moduleUrls.business)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block"
            >
              Empresas
            </button>
          </div>
        </div>
      </nav>

      {/* â”€â”€ BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-full bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-teal-500/20 border-b border-teal-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-teal-500" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Portal do {isGroup ? 'Complexo' : 'Bairro'}!</span>{" "}
            Tudo sobre {name} em um sÃ³ lugar.
          </span>
        </div>
      </div>

      {/* â”€â”€ A. HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative w-full min-h-[45vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/15 via-blue-500/10 to-violet-500/15">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 w-full">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-2 mb-6">
              <MapPin className="h-4 w-4 text-teal-500" />
              <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                {subtitle}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
              {name}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {isGroup 
                ? `Agrupamento de ${memberList.length} bairros com tudo que vocÃª precisa: empresas, serviÃ§os, eventos e comunidade.`
                : 'Seu bairro conectado: empresas locais, serviÃ§os, eventos e tudo que acontece na comunidade.'
              }
            </p>

            {/* Bairros do grupo */}
            {isGroup && memberList.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {memberList.slice(0, 6).map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-card/80 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full border border-border font-medium hover:border-teal-500/50 transition-colors"
                  >
                    {m}
                  </span>
                ))}
                {memberList.length > 6 && (
                  <span className="text-xs bg-card/80 backdrop-blur-sm text-muted-foreground px-3 py-1.5 rounded-full border border-border font-medium">
                    +{memberList.length - 6} bairros
                  </span>
                )}
              </div>
            )}

            {/* Quick access chips */}
            <div className="flex flex-wrap justify-center gap-2.5">
              {[
                { icon: Users, label: 'Comunidade', url: moduleUrls.community, color: 'hover:border-teal-500/50 hover:text-teal-500' },
                { icon: Store, label: 'Empresas', url: moduleUrls.business, color: 'hover:border-blue-500/50 hover:text-blue-500' },
                { icon: Wrench, label: 'ServiÃ§os', url: moduleUrls.services, color: 'hover:border-violet-500/50 hover:text-violet-500' },
                { icon: Tag, label: 'Classificados', url: moduleUrls.classifieds, color: 'hover:border-orange-500/50 hover:text-orange-500' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => navigate(chip.url)}
                  className={`flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all ${chip.color}`}
                >
                  <chip.icon className="h-4 w-4" />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ B. ESTATÃSTICAS DO TERRITÃ“RIO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
            {name} em NÃºmeros
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dados do {isGroup ? 'complexo' : 'bairro'}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Habitantes */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-teal-500/40 hover:bg-accent transition-all">
            <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
              ðŸ‘¥
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {statsLoading ? 'â€”' : territoryStats?.population ? `~${(territoryStats.population / 1000).toFixed(0)}mil` : 'â€”'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Habitantes</p>
            </div>
          </div>

          {/* Empresas */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-blue-500/40 hover:bg-accent transition-all">
            <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
              ðŸª
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{isLoading ? 'â€”' : stats.businesses}</p>
              <p className="text-[10px] text-muted-foreground truncate">Empresas</p>
            </div>
          </div>

          {/* Profissionais */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-violet-500/40 hover:bg-accent transition-all">
            <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
              ðŸ”§
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{isLoading ? 'â€”' : stats.services}</p>
              <p className="text-[10px] text-muted-foreground truncate">Profissionais</p>
            </div>
          </div>

          {/* AnÃºncios */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-orange-500/40 hover:bg-accent transition-all">
            <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
              ðŸ·ï¸
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{isLoading ? 'â€”' : stats.classifieds}</p>
              <p className="text-[10px] text-muted-foreground truncate">AnÃºncios</p>
            </div>
          </div>

          {/* Escolas */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-green-500/40 hover:bg-accent transition-all">
            <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
              ðŸŽ“
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {statsLoading ? 'â€”' : territoryStats?.schools ?? 'â€”'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Escolas</p>
            </div>
          </div>

          {/* Linhas de Ã´nibus */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-rose-500/40 hover:bg-accent transition-all">
            <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
              ðŸšŒ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {statsLoading ? 'â€”' : territoryStats?.bus_lines ?? 'â€”'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Linhas</p>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ C. SOBRE O BAIRRO (IA) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <TerritoryAIContentSection
          territorySlug={resolved?.kind === 'group'
            ? resolved.group.slug || resolved.group.id
            : resolved?.location?.slug || resolved?.location?.id || ''
          }
          territoryName={name}
          members={memberList.length > 0 ? memberList : undefined}
          isGroup={isGroup}
        />
      </div>

      {/* â”€â”€ D. DESTAQUES EDITORIAIS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(highlightsLoading || highlights.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
              No {isGroup ? 'Complexo' : 'bairro'} agora
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Destaques e novidades</p>
          </div>
          {highlightsLoading ? (
            <BlockLoader />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {highlights.map((h) => (
                <HighlightCard key={h.id} h={h} onNavigate={navigate} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* â”€â”€ E. GASTRONOMIA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Gastronomia</h2>
            <p className="text-sm text-muted-foreground mt-1">Melhores opÃ§Ãµes para comer e beber</p>
          </div>
          <button
            onClick={() => navigate(moduleUrls.business)}
            className="text-sm font-medium text-teal-500 hover:text-teal-400 transition-colors hidden sm:flex items-center gap-1"
          >
            Ver mais
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {isLoading ? (
          <BlockLoader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses
              .filter(b => ['restaurante', 'bar', 'lanchonete', 'padaria'].some(cat => b.category.toLowerCase().includes(cat)))
              .slice(0, 3)
              .map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    if (!b.slug) return;
                    const url = BusinessUrlService.getCanonicalUrl({ id: b.id, slug: b.slug, is_premium: b.is_premium, geographic_path: b.geographic_path });
                    navigate(url);
                  }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-orange-500/40 hover:bg-accent transition-all text-left w-full group"
                >
                  <div className="h-14 w-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                    <BusinessLogo
                      name={b.name}
                      logoUrl={b.logo_url}
                      alt={b.name}
                      initialsClassName="text-xl"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-orange-500 transition-colors">{b.name}</p>
                      {b.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">{formatCategory(b.category)}</p>
                    {b.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium text-foreground">{b.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">â€¢ Recomendado</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
          </div>
        )}
      </section>

      {/* â”€â”€ F. NEGÃ“CIOS LOCAIS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">NegÃ³cios Locais</h2>
            <p className="text-sm text-muted-foreground mt-1">Empresas e comÃ©rcios do territÃ³rio</p>
          </div>
          <button
            onClick={() => navigate(moduleUrls.business)}
            className="text-sm font-medium text-teal-500 hover:text-teal-400 transition-colors hidden sm:flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {isLoading ? (
          <BlockLoader />
        ) : businesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {businesses.slice(0, TERRITORIAL_LANDING_LIMITS.BUSINESSES).map((b) => (
              <BusinessCard key={b.id} b={b} onNavigate={navigate} />
            ))}
          </div>
        ) : (
          <EmptyBlock
            label="Nenhum negÃ³cio cadastrado aqui ainda."
            hint="Em breve, este espaÃ§o vai mostrar empresas e comÃ©rcios do territÃ³rio."
          />
        )}
      </section>

      {/* â”€â”€ G. SERVIÃ‡OS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Profissionais e ServiÃ§os</h2>
            <p className="text-sm text-muted-foreground mt-1">Quem atende neste territÃ³rio</p>
          </div>
          <button
            onClick={() => navigate(moduleUrls.services)}
            className="text-sm font-medium text-teal-500 hover:text-teal-400 transition-colors hidden sm:flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {isLoading ? (
          <BlockLoader />
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.slice(0, TERRITORIAL_LANDING_LIMITS.SERVICES).map((s) => (
              <ServiceCard key={s.id} s={s} onNavigate={navigate} moduleUrl={moduleUrls.services} />
            ))}
          </div>
        ) : (
          <EmptyBlock
            label="Nenhum profissional cadastrado aqui ainda."
            hint="Em breve, este espaÃ§o vai mostrar quem presta serviÃ§os no territÃ³rio."
          />
        )}
      </section>

      {/* â”€â”€ H. LAZER E ATIVIDADES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Lazer e Atividades</h2>
          <p className="text-sm text-muted-foreground mt-1">O que fazer no {isGroup ? 'complexo' : 'bairro'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-500/12 to-teal-500/6 border border-teal-500/25 rounded-2xl p-6 hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
              <Music className="h-6 w-6 text-teal-500" />
            </div>
            <p className="text-base font-semibold text-foreground mb-2">Eventos culturais</p>
            <p className="text-sm text-muted-foreground">Shows e apresentaÃ§Ãµes</p>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-teal-500/10 rounded-full blur-2xl" />
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/12 to-blue-500/6 border border-blue-500/25 rounded-2xl p-6 hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-base font-semibold text-foreground mb-2">Esportes</p>
            <p className="text-sm text-muted-foreground">Quadras e campos</p>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-blue-500/10 rounded-full blur-2xl" />
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/12 to-violet-500/6 border border-violet-500/25 rounded-2xl p-6 hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-violet-500" />
            </div>
            <p className="text-base font-semibold text-foreground mb-2">Eventos</p>
            <p className="text-sm text-muted-foreground">Agenda local</p>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-violet-500/10 rounded-full blur-2xl" />
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/12 to-orange-500/6 border border-orange-500/25 rounded-2xl p-6 hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
              <UtensilsCrossed className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-base font-semibold text-foreground mb-2">Gastronomia</p>
            <p className="text-sm text-muted-foreground">Bares e restaurantes</p>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-orange-500/10 rounded-full blur-2xl" />
          </div>
        </div>
      </section>

      {/* â”€â”€ I. CLASSIFICADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Classificados Recentes</h2>
            <p className="text-sm text-muted-foreground mt-1">O que estÃ¡ Ã  venda no {isGroup ? 'complexo' : 'bairro'}</p>
          </div>
          <button
            onClick={() => navigate(moduleUrls.classifieds)}
            className="text-sm font-medium text-teal-500 hover:text-teal-400 transition-colors hidden sm:flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {isLoading ? (
          <BlockLoader />
        ) : classifieds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {classifieds.slice(0, TERRITORIAL_LANDING_LIMITS.CLASSIFIEDS).map((c) => (
                  <ClassifiedCard key={c.id} c={c} onNavigate={navigate} shortUrl={shortClassifiedUrl} />
                ))}
          </div>
        ) : (
          <EmptyBlock
            label="Nenhum classificado ativo no momento."
            hint="Quando alguÃ©m anunciar algo aqui, vai aparecer neste espaÃ§o."
          />
        )}
      </section>

      {/* â”€â”€ J. CTA COMUNIDADE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-teal-500/12 to-teal-500/6 border border-teal-500/20 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-4 rounded-2xl bg-teal-500/15 flex-shrink-0">
              <Users className="h-8 w-8 text-teal-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-heading">
                Comunidade {name}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                NotÃ­cias, alertas, discussÃµes e eventos do {isGroup ? 'complexo' : 'bairro'} â€” tudo em um sÃ³ lugar. 
                Conecte-se com seus vizinhos e fique por dentro de tudo que acontece.
              </p>
              <button
                onClick={() => navigate(moduleUrls.community)}
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Entrar na comunidade
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}




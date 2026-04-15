/**
 * TerritorialLandingPage — Vitrine pública do território
 *
 * Hub/landing para bairro individual ou agrupamento territorial.
 * Pública — não exige login.
 *
 * Hierarquia editorial (ordem de blocos):
 *   A. Hero do território
 *   B. Estatísticas do território (habitantes, negócios, escolas)
 *   C. Sobre o bairro (descrição, história)
 *   D. Destaques editoriais (curados — máx. 3)
 *   E. Gastronomia (top 3 restaurantes/bares mais avaliados)
 *   F. Negócios locais (máx. 4)
 *   G. Serviços disponíveis (máx. 4)
 *   H. Lazer e atividades
 *   I. Classificados recentes (máx. 4)
 *   J. CTA Comunidade
 *
 * Regra editorial:
 *   - Destaques: máx. 3 ativos, ordenados por position
 *   - Negócios: premium primeiro, depois rating
 *   - Serviços: verificados primeiro, depois rating
 *   - Classificados: mais recentes primeiro
 *   - Nenhum bloco exibe mais de 4 itens na landing
 *   - Navegação principal via sidebar (não duplicada na landing)
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
import { useLandingFeatured } from '@/core/landing/useLandingFeatured';
import { useTerritorialHighlights } from '@/core/territorial/highlights/useTerritorialHighlights';
import { useTerritoryStats } from '@/core/territorial/hooks/useTerritoryStats';
import { getCityStateFromResolved, formatCityState } from '@/core/location/utils/territoryHelpers';
import { MODULE_SLUGS } from '../utils/territoryUrls';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { classifiedUrlService } from '@/modules/classifieds/services/ClassifiedUrlService';
import { useClassifiedUrls } from '@/modules/classifieds/hooks/useClassifiedUrls';
import type { FeaturedBusiness, FeaturedService, FeaturedClassified } from '@/core/landing/services/LandingFeaturedService';
import type { TerritorialHighlight, HighlightType } from '@/core/territorial/highlights/types';
import { TerritoryAIContentSection } from '@/core/territorial/components/TerritoryAIContentSection';

// ── Regra editorial ───────────────────────────────────────────────────────────
const MAX_HIGHLIGHTS  = 3;
const MAX_BUSINESSES  = 4;
const MAX_SERVICES    = 4;
const MAX_CLASSIFIEDS = 4;

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    if (names.length === 0) return `Agrupamento territorial${cityStateStr ? ` · ${cityStateStr}` : ''}`;
    if (names.length <= 3) return `${names.join(', ')}${cityStateStr ? ` · ${cityStateStr}` : ''}`;
    return `${names.slice(0, 3).join(', ')} e mais ${names.length - 3} bairros${cityStateStr ? ` · ${cityStateStr}` : ''}`;
  }
  
  return `Bairro${cityStateStr ? ` · ${cityStateStr}` : ''}`;
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

// ── Sub-componentes ──────────────────────────────────────────────────────────

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

// ── Cards ────────────────────────────────────────────────────────────────────

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

function ClassifiedCard({ c, onNavigate, classifiedUrls }: { 
  c: FeaturedClassified; 
  onNavigate: (to: string) => void;
  classifiedUrls: ReturnType<typeof useClassifiedUrls>;
}) {
  const thumb = c.photos?.[0];
  
  // ✅ Constrói URL canônica se dados disponíveis, senão usa link curto
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
        return classifiedUrls.short(c.public_id);
      }
    }
    return classifiedUrls.short(c.public_id);
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

// ── Highlight card ───────────────────────────────────────────────────────────

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

// ── Módulos de navegação ─────────────────────────────────────────────────────

const MODULE_ITEMS = [
  { slug: MODULE_SLUGS.community,   icon: Users,  label: 'Comunidade',    color: 'text-teal-500' },
  { slug: MODULE_SLUGS.business,    icon: Store,  label: 'Empresas',      color: 'text-blue-500' },
  { slug: MODULE_SLUGS.services,    icon: Wrench, label: 'Serviços',      color: 'text-violet-500' },
  { slug: MODULE_SLUGS.classifieds, icon: Tag,    label: 'Classificados', color: 'text-orange-500' },
  { slug: MODULE_SLUGS.mobility,    icon: Bus,    label: 'Mobilidade',    color: 'text-rose-500' },
] as const;

// ── Página principal ─────────────────────────────────────────────────────────

export function TerritorialLandingPage() {
  const { resolved, baseUrl } = useTerritorialContext();
  const navigate = useNavigate();

  const filter = useTerritoryFilter(resolved);
  const { businesses, services, classifieds, stats, isLoading } = useLandingFeatured(filter);
  const { data: allHighlights = [], isLoading: highlightsLoading } = useTerritorialHighlights(resolved);
  const { data: territoryStats, isLoading: statsLoading } = useTerritoryStats(resolved);
  const classifiedUrls = useClassifiedUrls(resolved);

  // Aplica limite editorial de highlights
  const highlights = allHighlights.slice(0, MAX_HIGHLIGHTS);

  const name = getTerritoryName(resolved);
  const subtitle = getTerritorySubtitle(resolved);
  const memberList = getMemberList(resolved);
  const isGroup = resolved?.kind === 'group';

  // URLs dos módulos (formato correto: /modulo/state/city)
  const moduleUrls = {
    business: `/${MODULE_SLUGS.business}${baseUrl}`,
    services: `/${MODULE_SLUGS.services}${baseUrl}`,
    classifieds: `/${MODULE_SLUGS.classifieds}${baseUrl}`,
    community: `/${MODULE_SLUGS.community}${baseUrl}`,
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">

      {/* ── NAVBAR ────────────────────────────────────────────────── */}
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

      {/* ── BANNER ────────────────────────────────────────────────── */}
      <div className="w-full bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-teal-500/20 border-b border-teal-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-teal-500" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Portal do {isGroup ? 'Complexo' : 'Bairro'}!</span>{" "}
            Tudo sobre {name} em um só lugar.
          </span>
        </div>
      </div>

      {/* ── A. HERO ──────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/12 via-teal-500/6 to-transparent">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          <div className="max-w-2xl">
            <p className="text-teal-500 font-semibold text-sm tracking-wide uppercase mb-2">
              {subtitle}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4 font-heading">
              {name}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-6">
              {isGroup 
                ? `Agrupamento de ${memberList.length} bairros com tudo que você precisa: empresas, serviços, eventos e comunidade.`
                : 'Seu bairro conectado: empresas locais, serviços, eventos e tudo que acontece na comunidade.'
              }
            </p>

            {/* Bairros do grupo */}
            {isGroup && memberList.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {memberList.slice(0, 6).map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-teal-500/12 text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-full border border-teal-500/25 font-medium"
                  >
                    {m}
                  </span>
                ))}
                {memberList.length > 6 && (
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border font-medium">
                    +{memberList.length - 6} bairros
                  </span>
                )}
              </div>
            )}

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Users, label: 'Comunidade', url: moduleUrls.community },
                { icon: Store, label: 'Empresas', url: moduleUrls.business },
                { icon: Wrench, label: 'Serviços', url: moduleUrls.services },
                { icon: Tag, label: 'Classificados', url: moduleUrls.classifieds },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => navigate(chip.url)}
                  className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-teal-500/50 hover:text-teal-500 transition-colors"
                >
                  <chip.icon className="h-3.5 w-3.5" />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location badge */}
          <div className="absolute bottom-4 right-4 sm:right-6 hidden sm:flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-teal-500" />
            {name}
          </div>
        </div>
      </section>

      {/* ── B. ESTATÍSTICAS DO TERRITÓRIO ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
            {name} em Números
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dados do {isGroup ? 'complexo' : 'bairro'}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-gradient-to-br from-teal-500/8 to-teal-500/4 border border-teal-500/20 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
                <Users className="h-5 w-5 text-teal-500" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {statsLoading ? '—' : territoryStats?.population ? `~${(territoryStats.population / 1000).toFixed(0)}mil` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Habitantes</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/8 to-blue-500/4 border border-blue-500/20 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Store className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{isLoading ? '—' : stats.businesses}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Empresas ativas</p>
          </div>
          <div className="bg-gradient-to-br from-violet-500/8 to-violet-500/4 border border-violet-500/20 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-violet-500" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{isLoading ? '—' : stats.services}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Profissionais</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/8 to-orange-500/4 border border-orange-500/20 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Tag className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{isLoading ? '—' : stats.classifieds}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Anúncios ativos</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/8 to-green-500/4 border border-green-500/20 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {statsLoading ? '—' : territoryStats?.schools ?? '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Escolas</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500/8 to-rose-500/4 border border-rose-500/20 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <Bus className="h-5 w-5 text-rose-500" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {statsLoading ? '—' : territoryStats?.bus_lines ?? '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Linhas de ônibus</p>
          </div>
        </div>
      </section>

      {/* ── C. SOBRE O BAIRRO (IA) ─────────────────────────────────────── */}
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

      {/* ── D. DESTAQUES EDITORIAIS ───────────────────────────────────────── */}
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

      {/* ── E. GASTRONOMIA ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Gastronomia</h2>
            <p className="text-sm text-muted-foreground mt-1">Melhores opções para comer e beber</p>
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
                        <span className="text-xs text-muted-foreground">• Recomendado</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
          </div>
        )}
      </section>

      {/* ── F. NEGÓCIOS LOCAIS ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Negócios Locais</h2>
            <p className="text-sm text-muted-foreground mt-1">Empresas e comércios do território</p>
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
            {businesses.slice(0, MAX_BUSINESSES).map((b) => (
              <BusinessCard key={b.id} b={b} onNavigate={navigate} />
            ))}
          </div>
        ) : (
          <EmptyBlock
            label="Nenhum negócio cadastrado aqui ainda."
            hint="Em breve, este espaço vai mostrar empresas e comércios do território."
          />
        )}
      </section>

      {/* ── G. SERVIÇOS ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Profissionais e Serviços</h2>
            <p className="text-sm text-muted-foreground mt-1">Quem atende neste território</p>
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
            {services.slice(0, MAX_SERVICES).map((s) => (
              <ServiceCard key={s.id} s={s} onNavigate={navigate} moduleUrl={moduleUrls.services} />
            ))}
          </div>
        ) : (
          <EmptyBlock
            label="Nenhum profissional cadastrado aqui ainda."
            hint="Em breve, este espaço vai mostrar quem presta serviços no território."
          />
        )}
      </section>

      {/* ── H. LAZER E ATIVIDADES ─────────────────────────────────────────── */}
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
            <p className="text-sm text-muted-foreground">Shows e apresentações</p>
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

      {/* ── I. CLASSIFICADOS ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Classificados Recentes</h2>
            <p className="text-sm text-muted-foreground mt-1">O que está à venda no {isGroup ? 'complexo' : 'bairro'}</p>
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
            {classifieds.slice(0, MAX_CLASSIFIEDS).map((c) => (
              <ClassifiedCard key={c.id} c={c} onNavigate={navigate} classifiedUrls={classifiedUrls} />
            ))}
          </div>
        ) : (
          <EmptyBlock
            label="Nenhum classificado ativo no momento."
            hint="Quando alguém anunciar algo aqui, vai aparecer neste espaço."
          />
        )}
      </section>

      {/* ── J. CTA COMUNIDADE ─────────────────────────────────────────────── */}
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
                Notícias, alertas, discussões e eventos do {isGroup ? 'complexo' : 'bairro'} — tudo em um só lugar. 
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

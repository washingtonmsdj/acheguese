/**
 * ClassificadosLandingPage — Vitrine item-first de classificados
 * 
 * ✅ Experiência item-first: foco no produto, não no vendedor
 * ✅ Toggle Anúncios / Vendedores
 * ✅ Filtros avançados: condição, preço, foto, ordenação
 * ✅ Busca por item, categoria, bairro, anunciante
 * ✅ Categorias visuais, destaques, CTA
 * ✅ Seções informativas compactas
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, MapPin, ChevronRight, ArrowRight, Sparkles, BadgeCheck, MessageCircle, Shield, Zap, Tag } from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { ModuleLocationDialog, useTerritoryLabels } from "@/core/location";
import { useClassificados } from "@/modules/classifieds/hooks/useClassificados";
import { CLASSIFIED_CATEGORIES, getCategoryEmoji } from "@/modules/classifieds/constants/categories";
import { classifiedUrlService } from "@/modules/classifieds/services/ClassifiedUrlService";
import { ClassifiedsViewToggle, VendedorCard, ClassificadosHeader, AdvancedFilters } from "@/modules/classifieds/components";
import { cn } from "@/shared/utils/cn";
import {
  AdsGrid,
  FeaturedSection,
  SearchBar,
  SellersEmptyState,
} from "./ClassificadosLandingPageSections";
import type { ClassificadoWithVendedor } from "@/modules/classifieds/hooks/useClassificados";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

import heroImg from "@/assets/servicos-hero.jpg";

// ── Constants ─────────────────────────────────────────────────


const HOW_IT_WORKS = [
  { step: "01", icon: Search, title: "Encontre", desc: "Busque por item, categoria ou bairro" },
  { step: "02", icon: MessageCircle, title: "Negocie", desc: "Fale direto com o vendedor" },
  { step: "03", icon: Star, title: "Avalie", desc: "Ajude a comunidade com sua avaliação" },
];

const BENEFITS = [
  { icon: BadgeCheck, title: "Vendedores Verificados", desc: "Identidade verificada para sua segurança" },
  { icon: MapPin, title: "Compre Perto", desc: "Produtos da sua região, sem frete" },
  { icon: Shield, title: "Avaliações Reais", desc: "Feedback de compradores verificados" },
  { icon: Zap, title: "Grátis", desc: "Anuncie ilimitado, sem taxas" },
];

// ── Types ─────────────────────────────────────────────────────

type ViewMode = "anuncios" | "vendedores";

interface Filters {
  category: string;
  search: string;
  sort: string;
  priceMin: string;
  priceMax: string;
  condition: string;
  hasPhoto: boolean;
  stateSlug: string;
  citySlug: string;
  locationSlug: string;
}

const DEFAULT_FILTERS: Filters = {
  category: "todos",
  search: "",
  sort: "recente",
  priceMin: "",
  priceMax: "",
  condition: "todos",
  hasPhoto: false,
  stateSlug: "",
  citySlug: "",
  locationSlug: "",
};

// ── Props ─────────────────────────────────────────────────────

interface ClassificadosLandingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// ── Page ──────────────────────────────────────────────────────

export default function ClassificadosLandingPage({ resolved, activeMemberIds }: ClassificadosLandingPageProps) {
  const navigate = useNavigate();
  const { user } = useSessionContext();
  const appUrls = useAppUrls(resolved);
  const territoryLabels = useTerritoryLabels(resolved);
  const [viewMode, setViewMode] = useState<ViewMode>("anuncios");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // ✅ SSOT: Nome do território
  const territoryName = useMemo(() => {
    return territoryLabels.name || "sua região";
  }, [territoryLabels]);
  const initialSlugs = useMemo(() => {
    const geoPath =
      resolved?.kind === "location"
        ? resolved.location.geographic_path
        : resolved?.kind === "group"
          ? resolved.group.members[0]?.geographic_path
          : null;
    if (!geoPath) return {};
    const parts = geoPath.split("/").filter(Boolean);
    return {
      stateSlug: parts[1] ?? null,
      citySlug: parts[2] ?? null,
      districtSlug: parts[3] ?? null,
    };
  }, [resolved]);

  const { classificados, isLoading } = useClassificados({
    filters: {
      category: filters.category !== "todos" ? filters.category : undefined,
      search: filters.search || undefined,
      sortBy: filters.sort,
      priceMin: filters.priceMin ? parseFloat(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? parseFloat(filters.priceMax) : undefined,
    },
    routeResolved: resolved,
    activeMemberIds,
  });

  // Local filters (condition, photo)
  const filteredAds = useMemo(() => {
    return classificados.filter((c) => {
      if (filters.hasPhoto && (!c.fotos || c.fotos.length === 0)) return false;
      if (filters.condition !== "todos" && c.condition && c.condition !== filters.condition) return false;
      return true;
    });
  }, [classificados, filters.hasPhoto, filters.condition]);

  const activeAds = filteredAds.filter((c) => c.status === "active");

  // Featured: top 6 by price
  const featuredAds = useMemo(() => {
    return [...activeAds]
      .sort((a, b) => (b.preco || 0) - (a.preco || 0))
      .slice(0, 6);
  }, [activeAds]);

  // Handlers
  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const handleAdClick = useCallback((ad: ClassificadoWithVendedor) => {
    // ✅ SSOT: Usar classifiedUrlService para construir URL canônica
    if (ad.geographic_path && ad.category_slug && ad.subcategory_slug && ad.slug && ad.public_id) {
      const urls = classifiedUrlService.buildUrls({
        id: ad.id,
        public_id: ad.public_id,
        geographic_path: ad.geographic_path,
        category_slug: ad.category_slug,
        subcategory_slug: ad.subcategory_slug,
        slug: ad.slug,
      });
      navigate(urls.canonical);
      return;
    }
    // Fallback para URL curta canônica via SSOT
    navigate(classifiedUrlService.buildShortUrl(ad.public_id || ad.id));
  }, [navigate]);

  const handleNewAd = useCallback(() => {
    navigate(user ? appUrls.classifieds.new : appUrls.auth.login);
  }, [navigate, user, appUrls]);

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── HEADER COM BUSCA ──────────────────────────────────────── */}
      <ClassificadosHeader
        searchQuery={filters.search}
        onSearchChange={(value) => updateFilter("search", value)}
      />

      {/* ── Promo Banner ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-b border-primary/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-xs sm:text-sm">
            <span className="font-bold text-foreground">Anuncie grátis!</span>{" "}
            Venda seus produtos para milhares de pessoas na sua região.
          </span>
          <button
            onClick={handleNewAd}
            className="text-primary font-bold text-xs hover:underline ml-1 flex items-center gap-0.5 shrink-0"
          >
            Começar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* ── Hero (CanonicalHero) ────────────────────── */}
      <CanonicalHero
        moduleName="Classificados"
        moduleIcon={Tag}
        territoryName={territoryName}
        territoryFallback="Sua Região"
        title="Compre e Venda"
        titleHighlight={`em ${territoryName}`}
        subtitle="Móveis, eletrônicos, veículos e muito mais. Anúncios gratuitos de pessoas da sua comunidade."
        backgroundImage={heroImg}
        primaryCTA={{
          label: "Criar Anúncio Grátis",
          icon: Star,
          onClick: handleNewAd,
        }}
        stats={[{ value: `${activeAds.length}`, label: "anúncios ativos" }]}
      />

      {/* ── Filtros Avançados + Localização ──────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Filtros avançados */}
          <AdvancedFilters
            filters={filters}
            onSortChange={(s) => updateFilter("sort", s)}
            onPriceMinChange={(v) => updateFilter("priceMin", v)}
            onPriceMaxChange={(v) => updateFilter("priceMax", v)}
            onConditionChange={(v) => updateFilter("condition", v)}
            onHasPhotoChange={(v) => updateFilter("hasPhoto", v)}
            onClearFilters={clearFilters}
          />

          {/* Localização ativa */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">em</span>
            <span className="font-semibold text-foreground">{territoryName}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLocationDialogOpen(true)}
              className="h-7 text-xs"
            >
              Alterar
            </Button>
          </div>
        </div>
      </section>

      {/* ── Category Chips ────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-4" aria-label="Categorias">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CLASSIFIED_CATEGORIES.map((cat) => {
            const isActive = filters.category === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => updateFilter("category", cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition-all shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                    : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-primary/5"
                )}
                aria-pressed={isActive}
              >
                <span className="text-xs">{cat.emoji}</span>
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </section>

      <ModuleLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        moduleBasePath="/classificados"
        initialSlugs={initialSlugs}
        onApplyPath={(path) => navigate(path)}
      />

      {/* ── Featured Ads ──────────────────────────────── */}
      {featuredAds.length > 0 && !isLoading && viewMode === "anuncios" && (
        <FeaturedSection ads={featuredAds} onAdClick={handleAdClick} />
      )}

      {/* ── View Toggle ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-4 mb-3">
        <ClassifiedsViewToggle
          mode={viewMode}
          onChange={setViewMode}
          adsCount={activeAds.length}
          sellersCount={0}
        />
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <section
        className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-6 flex-1"
        aria-label={viewMode === "anuncios" ? "Anúncios" : "Vendedores"}
      >
        <AnimatePresence mode="wait">
          {viewMode === "anuncios" ? (
            <motion.div
              key="anuncios"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <AdsGrid
                classificados={activeAds}
                isLoading={isLoading}
                onClassificadoClick={handleAdClick}
              />
            </motion.div>
          ) : (
            <motion.div
              key="vendedores"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SellersEmptyState />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-primary/5 via-card to-accent/5 border-y border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg sm:text-xl font-bold text-foreground text-center mb-6 font-heading">
            Como Funciona
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-foreground mb-0.5">{item.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <h2 className="text-lg sm:text-xl font-bold text-foreground text-center mb-5 font-heading">
          Por Que Usar Nossa Plataforma?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <b.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-bold text-foreground mb-0.5">{b.title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-4 sm:mx-6 mb-8 max-w-7xl lg:mx-auto lg:w-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl border border-primary/20 p-6 text-center"
      >
        <h3 className="text-sm font-bold text-foreground mb-1">
          Tem algo pra vender? 🚀
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Anuncie grátis e alcance milhares de pessoas na sua região
        </p>
        <Button
          size="sm"
          className="rounded-full shadow-md shadow-primary/20"
          onClick={handleNewAd}
        >
          Criar anúncio grátis
        </Button>
      </motion.div>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="w-full bg-card border-t border-border px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Classificados Locais</span>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(appUrls.business.list)} className="hover:text-primary transition-colors">Empresas</button>
          <button onClick={() => navigate(appUrls.services.list)} className="hover:text-primary transition-colors">Serviços</button>
          <button onClick={() => navigate(appUrls.community.feed)} className="hover:text-primary transition-colors">Comunidade</button>
        </div>
      </footer>
    </div>
  );
}

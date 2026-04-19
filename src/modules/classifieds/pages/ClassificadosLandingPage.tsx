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

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Star, MapPin, ChevronRight, ArrowRight,
  Sparkles, BadgeCheck, MessageCircle, Shield,
  SlidersHorizontal, ArrowUpDown, Camera, Package,
  Zap, Plus, PackageOpen, Loader2, Flame,
  ShoppingBag, UserCheck, Truck,
  Tag,
} from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/shared/components/ui/sheet";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useTerritoryLabels } from "@/core/location";
import { useClassificados } from "@/modules/classifieds/hooks/useClassificados";
import { CLASSIFIED_CATEGORIES, getCategoryEmoji } from "@/modules/classifieds/constants/categories";
import { classifiedUrlService } from "@/modules/classifieds/services/ClassifiedUrlService";
import { ClassifiedsViewToggle } from "@/modules/classifieds/components/ClassifiedsViewToggle";
import { VendedorCard } from "@/modules/classifieds/components/VendedorCard";
import { cn } from "@/shared/utils/cn";
import type { ClassificadoWithVendedor } from "@/modules/classifieds/hooks/useClassificados";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

import heroImg from "@/assets/servicos-hero.jpg";

// ── Constants ─────────────────────────────────────────────────

const SORT_OPTIONS = [
  { id: "recente", label: "Mais recentes" },
  { id: "menor_price", label: "Mais baratos" },
  { id: "maior_price", label: "Mais caros" },
  { id: "relevante", label: "Mais relevantes" },
] as const;

const CONDITION_OPTIONS = [
  { id: "todos", label: "Todos" },
  { id: "novo", label: "Novo" },
  { id: "seminovo", label: "Seminovo" },
  { id: "usado", label: "Usado" },
] as const;

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
}

const DEFAULT_FILTERS: Filters = {
  category: "todos",
  search: "",
  sort: "recente",
  priceMin: "",
  priceMax: "",
  condition: "todos",
  hasPhoto: false,
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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // ✅ SSOT: Nome do território
  const territoryName = useMemo(() => {
    return territoryLabels.name || "sua região";
  }, [territoryLabels]);

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
    // Fallback para URL curta
    navigate(`/c/${ad.public_id || ad.id}`);
  }, [navigate]);

  const handleNewAd = useCallback(() => {
    navigate(user ? appUrls.classifieds.new : appUrls.auth.login);
  }, [navigate, user, appUrls]);

  return (
    <div className="flex flex-col min-h-screen bg-background">

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

      {/* ── Search + Filters ──────────────────────────── */}
      <SearchBar
        filters={filters}
        onSearchChange={(s) => updateFilter("search", s)}
        onSortChange={(s) => updateFilter("sort", s)}
        onPriceMinChange={(v) => updateFilter("priceMin", v)}
        onPriceMaxChange={(v) => updateFilter("priceMax", v)}
        onConditionChange={(v) => updateFilter("condition", v)}
        onHasPhotoChange={(v) => updateFilter("hasPhoto", v)}
        onClearFilters={clearFilters}
      />

      {/* ── Category Chips ────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-1" aria-label="Categorias">
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

// ── Search Bar ───────────────────────────────────────────────

function SearchBar({
  filters,
  onSearchChange,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
  onConditionChange,
  onHasPhotoChange,
  onClearFilters,
}: {
  filters: Filters;
  onSearchChange: (s: string) => void;
  onSortChange: (s: string) => void;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  onConditionChange: (v: string) => void;
  onHasPhotoChange: (v: boolean) => void;
  onClearFilters: () => void;
}) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [focused, setFocused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounced search
  useState(() => {
    const timer = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(timer);
  });

  // Sync debounce properly
  const handleSearchInput = useCallback((val: string) => {
    setLocalSearch(val);
    const timer = setTimeout(() => onSearchChange(val), 300);
    return () => clearTimeout(timer);
  }, [onSearchChange]);

  const activeCount = [
    filters.sort !== "recente" ? 1 : 0,
    filters.priceMin ? 1 : 0,
    filters.priceMax ? 1 : 0,
    filters.condition !== "todos" ? 1 : 0,
    filters.hasPhoto ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-4 mb-2">
      <div className="flex gap-2">
        <div className={cn("relative flex-1 transition-all duration-200", focused && "scale-[1.01]")}>
          <Search className={cn(
            "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
            focused ? "text-primary" : "text-muted-foreground"
          )} />
          <Input
            placeholder="Buscar sofá, celular, bicicleta..."
            value={localSearch}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              "pl-10 h-11 text-sm rounded-xl border-2 bg-card shadow-sm transition-all",
              focused ? "border-primary/40 shadow-primary/10 shadow-md" : "border-border"
            )}
            aria-label="Buscar anúncios"
          />
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-2 relative shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-heading">Filtros Avançados</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 py-4">
              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Ordenar por
                </label>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onSortChange(opt.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        filters.sort === opt.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Package className="h-3.5 w-3.5" /> Condição
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onConditionChange(opt.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        filters.condition === opt.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick filters */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Filtros rápidos</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onHasPhotoChange(!filters.hasPhoto)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                      filters.hasPhoto
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border"
                    )}
                  >
                    <Camera className="h-3 w-3" /> Com foto
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Faixa de preço (R$)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    value={filters.priceMin}
                    onChange={(e) => onPriceMinChange(e.target.value)}
                    className="h-10 text-sm rounded-xl"
                    min={0}
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input
                    type="number"
                    placeholder="Máximo"
                    value={filters.priceMax}
                    onChange={(e) => onPriceMaxChange(e.target.value)}
                    className="h-10 text-sm rounded-xl"
                    min={0}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => { onClearFilters(); setFiltersOpen(false); }}
                >
                  Limpar filtros
                </Button>
                <Button className="flex-1 rounded-xl" onClick={() => setFiltersOpen(false)}>
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

// ── Featured Section ─────────────────────────────────────────

function FeaturedSection({ ads, onAdClick }: { ads: ClassificadoWithVendedor[]; onAdClick: (ad: ClassificadoWithVendedor) => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-4 mb-1"
      aria-label="Destaques"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Star className="h-4 w-4 text-accent fill-accent" />
        <span className="text-xs font-bold text-foreground">Destaques da Semana</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {ads.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.04 }}
            onClick={() => onAdClick(ad)}
            className="shrink-0 w-[150px] bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <div className="relative">
              <img
                src={ad.fotos?.[0] || "/placeholder.svg"}
                alt={ad.titulo}
                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/90 text-[8px] font-bold text-accent-foreground">
                <Zap className="h-2 w-2" />
                Destaque
              </div>
              <span className="absolute bottom-1.5 left-1.5 text-xs font-bold text-white drop-shadow-lg">
                R$ {ad.preco?.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="p-2">
              <p className="text-[10px] font-semibold line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                {ad.titulo}
              </p>
              {ad.vendedor?.nome && (
                <p className="text-[8px] text-muted-foreground mt-0.5 truncate">
                  por {ad.vendedor.nome}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ── Ads Grid ─────────────────────────────────────────────────

function AdsGrid({
  classificados,
  isLoading,
  onClassificadoClick,
}: {
  classificados: ClassificadoWithVendedor[];
  isLoading: boolean;
  onClassificadoClick: (c: ClassificadoWithVendedor) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (classificados.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-16 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <PackageOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">Nenhum anúncio encontrado</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tente buscar com outros termos ou ajustar os filtros
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <AnimatePresence mode="popLayout">
        {classificados.map((ad, i) => (
          <ItemCard key={ad.id} ad={ad} index={i} onClick={() => onClassificadoClick(ad)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Sellers Empty State ──────────────────────────────────────

function SellersEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-16 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <ShoppingBag className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">Nenhum vendedor encontrado</p>
      <p className="text-xs text-muted-foreground mt-1">
        Nenhum vendedor ativo nesta região
      </p>
    </motion.div>
  );
}

// ── Item Card ────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: "Disponível", color: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  reserved: { label: "Reservado", color: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  sold: { label: "Vendido", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

const ItemCard = React.forwardRef<
  HTMLDivElement,
  {
    ad: ClassificadoWithVendedor;
    index: number;
    onClick: () => void;
  }
>(({ ad, index, onClick }, ref) => {
  const status = STATUS_CONFIG[ad.status] || STATUS_CONFIG.active;
  const timeAgo = getRelativeTime(ad.created_at);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="group bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
      role="article"
      aria-label={`Anúncio: ${ad.titulo}`}
    >
      <div className="relative overflow-hidden">
        <img
          src={ad.fotos?.[0] || "/placeholder.svg"}
          alt={ad.titulo}
          className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className={cn(
          "absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-sm",
          status.color
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </div>

        {ad.fotos && ad.fotos.length > 1 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[9px] font-bold text-white">
            <Camera className="h-2.5 w-2.5" />
            {ad.fotos.length}
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <span className="text-sm font-bold text-white drop-shadow-lg">
            R$ {ad.preco?.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      <div className="p-2.5">
        <h3 className="text-[11px] font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {ad.titulo}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {ad.condition && (
            <span className={cn(
              "text-[8px] font-bold px-1.5 py-0.5 rounded-full border",
              ad.condition === "novo"
                ? "bg-success/10 text-success border-success/20"
                : ad.condition === "seminovo"
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted text-muted-foreground border-border"
            )}>
              {ad.condition === "novo" ? "Novo" : ad.condition === "seminovo" ? "Seminovo" : "Usado"}
            </span>
          )}
          {ad.bairro && (
            <span className="flex items-center gap-0.5 text-muted-foreground text-[9px]">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[60px]">{ad.bairro}</span>
            </span>
          )}
          {timeAgo && <span className="text-[9px] text-muted-foreground">{timeAgo}</span>}
        </div>

        {ad.vendedor?.nome && (
          <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border/50">
            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[7px] font-bold text-primary shrink-0">
              {ad.vendedor.nome[0]?.toUpperCase()}
            </div>
            <span className="text-[9px] text-muted-foreground truncate">
              {ad.vendedor.nome}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
});

ItemCard.displayName = 'ItemCard';

// ── Utils ────────────────────────────────────────────────────

function getRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}m`;
  } catch {
    return "";
  }
}

/**
 * 💰 CLASSIFICADOS PAGE — Marketplace Completo
 *
 * ✅ Hero com banner patrocinado
 * ✅ Categorias de destaque (imóveis, autos, eletrônicos, serviços, vagas)
 * ✅ Seções: Em Alta, Mais Procurados, Destaques
 * ✅ Anúncios patrocinados
 * ✅ Mini banner comercial
 * ✅ Dois modos: Anúncios | Vendedores
 * ✅ Grid responsivo de alta densidade
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClassificadosPage } from "@/modules/classifieds/hooks/useClassificadosPage";
import { useClassifiedUrls } from "@/modules/classifieds/hooks/useClassifiedUrls";
import { CLASSIFIED_CATEGORIES } from "@/modules/classifieds/constants/categories";
import { ClassifiedsViewToggle } from "@/modules/classifieds/components/ClassifiedsViewToggle";
import { VendedorCard } from "@/modules/classifieds/components/VendedorCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ShoppingBag, Star, Search, SlidersHorizontal,
  ArrowUpDown, MapPin, Loader2, PackageOpen, Flame,
  Zap, Camera, Truck, Package, UserCheck, Sparkles,
  TrendingUp, Eye, Megaphone, Building2, Car, Smartphone,
  Wrench, Briefcase, Crown, ArrowRight, Heart, ChevronRight, Clock,
} from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/utils/cn";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { ClassificadoWithVendedor } from "@/modules/classifieds/hooks/useClassificados";

import heroImg from "@/assets/servicos-hero.jpg";

// ─── Constants ────────────────────────────────────────────────

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

const HIGHLIGHT_CATEGORIES = [
  { id: "imóveis", label: "Imóveis", emoji: "🏠", icon: Building2, bg: "bg-blue-500/15 border-blue-500/20", iconColor: "text-blue-400" },
  { id: "veículos", label: "Autos", emoji: "🚗", icon: Car, bg: "bg-red-500/15 border-red-500/20", iconColor: "text-red-400" },
  { id: "eletrônicos", label: "Eletrônicos", emoji: "📱", icon: Smartphone, bg: "bg-purple-500/15 border-purple-500/20", iconColor: "text-purple-400" },
  { id: "serviços", label: "Serviços", emoji: "🔧", icon: Wrench, bg: "bg-amber-500/15 border-amber-500/20", iconColor: "text-amber-400" },
  { id: "vagas", label: "Vagas", emoji: "💼", icon: Briefcase, bg: "bg-emerald-500/15 border-emerald-500/20", iconColor: "text-emerald-400" },
  { id: "games", label: "Games", emoji: "🎮", icon: Sparkles, bg: "bg-pink-500/15 border-pink-500/20", iconColor: "text-pink-400" },
] as const;

// ─── Props ────────────────────────────────────────────────────

interface ClassificadosPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// ─── Page ─────────────────────────────────────────────────────

export default function ClassificadosPage({
  resolved,
  activeMemberIds,
}: ClassificadosPageProps) {
  const navigate = useNavigate();
  const {
    viewMode,
    setViewMode,
    classificados,
    vendedores,
    activeCount,
    filters,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    handleCategoryChange,
    handleSearchChange,
    handleSortChange,
    handlePriceMinChange,
    handlePriceMaxChange,
    handleConditionChange,
    handleHasPhotoChange,
    handleClearFilters,
    handleClassificadoClick,
    handleNewClassificado,
    handleLoadMore,
  } = useClassificadosPage({ routeResolved: resolved, activeMemberIds });

  // ✅ Extrair nome do território resolvido
  const territoryName = useMemo(() => {
    if (!resolved) return "Sua Região";
    const name = resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
    return name;
  }, [resolved]);

  // Em alta: recém-criados
  const trendingAds = useMemo(() => {
    return [...classificados]
      .filter((c) => c.status === "active")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [classificados]);

  // Mais procurados: diversidade de categorias
  const mostWantedAds = useMemo(() => {
    const seen = new Set<string>();
    return classificados
      .filter((c) => c.status === "active")
      .filter((c) => {
        if (seen.has(c.categoria)) return false;
        seen.add(c.categoria);
        return true;
      })
      .slice(0, 6);
  }, [classificados]);

  // Destaques premium: mais caros
  const featuredAds = useMemo(() => {
    return [...classificados]
      .filter((c) => c.status === "active")
      .sort((a, b) => (b.preco || 0) - (a.preco || 0))
      .slice(0, 6);
  }, [classificados]);

  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* ─── Categorias de Destaque (TOPO) ────────────────── */}
      <section className="w-full bg-card/50 border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {HIGHLIGHT_CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-2.5 p-4 rounded-2xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 group",
                    cat.bg,
                    filters.category === cat.id && "ring-2 ring-primary shadow-lg"
                  )}
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className={cn("h-7 w-7", cat.iconColor)} />
                  </motion.div>
                  <span className="text-xs font-semibold text-foreground leading-tight text-center">
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Hero Compacto ────────────── */}
      <section className="relative w-full h-[280px] sm:h-[320px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
        </div>

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            {/* Territory Badge */}
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Classificados</span>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1.5 text-sm text-primary">
                <MapPin className="h-4 w-4" />
                <span className="font-semibold">{territoryName}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Compre e Venda{" "}
              <span className="text-primary">em {territoryName}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              {activeCount > 0
                ? `${activeCount} anúncios disponíveis em ${territoryName}`
                : `Móveis, eletrônicos, veículos e muito mais. Anúncios gratuitos de pessoas da sua comunidade.`}
            </p>

            {/* CTA */}
            <Button 
              onClick={handleNewClassificado}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Anunciar Grátis
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto w-full">

        {/* ─── Search Bar ──────────────────────────────── */}
        <SearchBar
          filters={filters}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onPriceMinChange={handlePriceMinChange}
          onPriceMaxChange={handlePriceMaxChange}
          onConditionChange={handleConditionChange}
          onHasPhotoChange={handleHasPhotoChange}
          onClearFilters={handleClearFilters}
        />

        {/* ─── Quick Category Chips ────────────────────── */}
        <section className="px-4 mt-4" aria-label="Categorias">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CLASSIFIED_CATEGORIES.map((cat) => {
              const isActive = filters.category === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition-all duration-200 shrink-0",
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

        {/* ─── Em Alta (Trending) ──────────────────────── */}
        {trendingAds.length > 0 && !isLoading && viewMode === "anuncios" && (
          <HorizontalSection
            title="Em Alta"
            subtitle="Anúncios mais recentes"
            icon={<Flame className="h-4 w-4 text-orange-400" />}
            ads={trendingAds}
            onAdClick={handleClassificadoClick}
            badgeText="Novo"
            badgeColor="bg-orange-500/90"
          />
        )}

        {/* ─── Mais Procurados ─────────────────────────── */}
        {mostWantedAds.length > 0 && !isLoading && viewMode === "anuncios" && (
          <HorizontalSection
            title="Mais Procurados"
            subtitle="Populares na região"
            icon={<Eye className="h-4 w-4 text-accent" />}
            ads={mostWantedAds}
            onAdClick={handleClassificadoClick}
            badgeText="Popular"
            badgeColor="bg-accent/90"
          />
        )}

        {/* ─── Destaques Premium ──────────────────────── */}
        {featuredAds.length > 0 && !isLoading && viewMode === "anuncios" && (
          <HorizontalSection
            title="Destaques"
            subtitle="Seleção premium"
            icon={<Star className="h-4 w-4 text-warning fill-warning" />}
            ads={featuredAds}
            onAdClick={handleClassificadoClick}
            badgeText="Destaque"
            badgeColor="bg-warning/90 text-warning-foreground"
          />
        )}

        {/* ─── Mini Banner Patrocínio ──────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-primary/10 via-card to-primary/10 border border-primary/15 p-3 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-foreground">Anuncie sua marca aqui</p>
            <p className="text-[9px] text-muted-foreground">Alcance milhares de pessoas na região</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
        </motion.div>

        {/* ─── Patrocinados Section ─────────────────────── */}
        {!isLoading && viewMode === "anuncios" && (
          <section className="px-4 mt-5" aria-label="Anúncios patrocinados">
            <div className="flex items-center gap-1.5 mb-3">
              <Megaphone className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold font-display text-foreground">Patrocinados</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(featuredAds.length > 0 ? featuredAds.slice(0, 4) : []).map((ad, i) => (
                <motion.div
                  key={`sponsored-${ad.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  onClick={() => handleClassificadoClick(ad)}
                  className="relative bg-card rounded-xl border border-primary/20 overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={ad.fotos?.[0] || "/placeholder.svg"}
                      alt={ad.titulo}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[8px] font-bold bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded-full">
                      <Megaphone className="h-2 w-2" />
                      Patrocinado
                    </span>
                    <span className="absolute bottom-2 left-2 text-sm font-bold text-white drop-shadow-lg">
                      R$ {ad.preco?.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-[11px] font-semibold line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                      {ad.titulo}
                    </h3>
                    {ad.bairro && (
                      <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground mt-1">
                        <MapPin className="h-2.5 w-2.5" /> {ad.bairro}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ─── View Toggle ─────────────────────────────── */}
        <div className="px-4 mt-5 mb-3">
          <ClassifiedsViewToggle
            mode={viewMode}
            onChange={setViewMode}
            adsCount={activeCount}
            sellersCount={vendedores.length}
          />
        </div>

        {/* ─── Main Content ────────────────────────────── */}
        <section className="px-4 pb-4 flex-1" aria-label={viewMode === "anuncios" ? "Todos os anúncios" : "Vendedores"}>
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
                  classificados={classificados}
                  isLoading={isLoading}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage}
                  onLoadMore={handleLoadMore}
                  onClassificadoClick={handleClassificadoClick}
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
                <SellersGrid
                  vendedores={vendedores}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ─── CTA Banner Final ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-4 mb-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl border border-primary/20 p-5 text-center"
        >
          <h3 className="text-sm font-bold font-display text-foreground mb-1">
            Tem algo pra vender? 🚀
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Anuncie grátis e alcance milhares de pessoas na sua região
          </p>
          <Button
            size="sm"
            className="rounded-full shadow-md shadow-primary/20"
            onClick={handleNewClassificado}
          >
            Criar anúncio grátis
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Horizontal Section (Em Alta / Mais Procurados / Destaques) ──

function HorizontalSection({
  title,
  subtitle,
  icon,
  ads,
  onAdClick,
  badgeText,
  badgeColor,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  ads: ClassificadoWithVendedor[];
  onAdClick: (ad: ClassificadoWithVendedor) => void;
  badgeText: string;
  badgeColor: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="px-4 mt-5"
      aria-label={title}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <div>
            <span className="text-xs font-bold font-display text-foreground">{title}</span>
            <span className="text-[9px] text-muted-foreground ml-2 hidden sm:inline">{subtitle}</span>
          </div>
        </div>
        <button className="flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline">
          Ver todos <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {ads.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => onAdClick(ad)}
            className="shrink-0 w-[160px] sm:w-[180px] bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="relative overflow-hidden">
              <img
                src={ad.fotos?.[0] || "/placeholder.svg"}
                alt={ad.titulo}
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className={cn(
                "absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white",
                badgeColor
              )}>
                <Zap className="h-2 w-2" />
                {badgeText}
              </span>
              <span className="absolute bottom-1.5 left-1.5 text-xs font-bold text-white drop-shadow-lg">
                R$ {ad.preco?.toLocaleString("pt-BR")}
              </span>
              {ad.fotos && ad.fotos.length > 1 && (
                <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm text-[8px] font-bold text-white px-1 py-0.5 rounded-full">
                  <Camera className="h-2 w-2" /> {ad.fotos.length}
                </span>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[11px] font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
                {ad.titulo}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                {ad.bairro && (
                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate max-w-[80px]">{ad.bairro}</span>
                  </span>
                )}
              </div>
              {ad.vendedor?.nome && (
                <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border/50">
                  <div className="h-3.5 w-3.5 rounded-full bg-primary/10 flex items-center justify-center text-[7px] font-bold text-primary shrink-0">
                    {ad.vendedor.nome[0]?.toUpperCase()}
                  </div>
                  <span className="text-[8px] text-muted-foreground truncate">{ad.vendedor.nome}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── Search & Filters ────────────────────────────────────────

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
  filters: any;
  onSearchChange: (s: string) => void;
  onSortChange: (s: string) => void;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  onConditionChange: (v: string) => void;
  onHasPhotoChange: (v: boolean) => void;
  onClearFilters: () => void;
}) {
  const [localSearch, setLocalSearch] = React.useState(filters.search || "");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const activeFiltersCount = [
    filters.sort !== "recente" && filters.sort !== "recent" ? 1 : 0,
    filters.priceMin ? 1 : 0,
    filters.priceMax ? 1 : 0,
    filters.condition !== "todos" ? 1 : 0,
    filters.hasPhoto ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="px-4 mt-3 mb-2">
      <div className="flex gap-2">
        <div
          className={cn(
            "relative flex-1 transition-all duration-200",
            searchFocused && "scale-[1.01]"
          )}
        >
          <Search
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
              searchFocused ? "text-primary" : "text-muted-foreground"
            )}
          />
          <Input
            placeholder="Buscar sofá, celular, bicicleta, imóvel..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "pl-10 h-11 text-sm rounded-xl border-2 bg-card shadow-sm transition-all",
              searchFocused
                ? "border-primary/40 shadow-primary/10 shadow-md"
                : "border-border"
            )}
            aria-label="Buscar anúncios"
          />
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl border-2 relative shrink-0"
              aria-label="Filtros avançados"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-display">Filtros Avançados</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 py-4">
              {/* Ordenar */}
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

              {/* Condição */}
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

              {/* Preço */}
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
                <Button
                  className="flex-1 rounded-xl"
                  onClick={() => setFiltersOpen(false)}
                >
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

// ─── Ads Grid ────────────────────────────────────────────────

function AdsGrid({
  classificados,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onClassificadoClick,
}: {
  classificados: ClassificadoWithVendedor[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onClassificadoClick: (c: ClassificadoWithVendedor) => void;
}) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1, rootMargin: "100px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
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
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
          Tente buscar com outros termos ou ajustar os filtros
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold font-display text-foreground flex items-center gap-1.5">
          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
          Todos os anúncios
        </span>
        <span className="text-[10px] text-muted-foreground">{classificados.length} resultados</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
        <AnimatePresence mode="popLayout">
          {classificados.map((ad, i) => (
            <ItemCard
              key={ad.id}
              ad={ad}
              index={i}
              onClick={() => onClassificadoClick(ad)}
            />
          ))}
        </AnimatePresence>

        {isFetchingNextPage && (
          <div className="col-span-full flex justify-center py-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Carregando mais...</span>
            </div>
          </div>
        )}

        <div ref={sentinelRef} className="col-span-full h-1" aria-hidden="true" />
      </div>
    </>
  );
}

// ─── Sellers Grid ────────────────────────────────────────────

function SellersGrid({
  vendedores,
  isLoading,
}: {
  vendedores: any[];
  isLoading: boolean;
}) {
  const navigate = useNavigate();
  const classifiedUrls = useClassifiedUrls();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (vendedores.length === 0) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {vendedores.map((v, i) => (
        <VendedorCard
          key={v.id}
          vendedor={v}
          index={i}
          onClick={() => navigate(classifiedUrls.seller(v.id))}
        />
      ))}
    </div>
  );
}

// ─── Item Card ───────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: {
    label: "Disponível",
    color: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  reserved: {
    label: "Reservado",
    color: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  sold: {
    label: "Vendido",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
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
  const firstImage = ad.fotos?.[0] || "/placeholder.svg";
  const timeAgo = getRelativeTime(ad.created_at);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        delay: Math.min(index, 8) * 0.04, 
        duration: 0.3
      }}
      onClick={onClick}
      className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col h-full"
      role="article"
      aria-label={`Anúncio: ${ad.titulo}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={firstImage}
          alt={ad.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Status & badges overlays */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <div
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm",
              status.color
            )}
          >
            {status.label}
          </div>
          {ad.condition && (
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm",
              ad.condition === "novo" 
                ? "bg-success/90 text-white"
                : ad.condition === "seminovo"
                ? "bg-primary/90 text-primary-foreground"
                : "bg-muted/90 text-muted-foreground"
            )}>
              {ad.condition === "novo" ? "Novo" : ad.condition === "seminovo" ? "Seminovo" : "Usado"}
            </div>
          )}
        </div>

        {/* Photo count */}
        {ad.fotos && ad.fotos.length > 1 && (
          <div className="absolute top-2.5 right-2.5">
            <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm flex items-center gap-0.5">
              <Camera className="h-2.5 w-2.5" />
              {ad.fotos.length}
            </div>
          </div>
        )}

        {/* Time ago strip */}
        {timeAgo && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-5">
            <div className="flex items-center gap-3 text-white text-[10px]">
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
              {ad.bairro && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {ad.bairro}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {ad.titulo}
          </h3>
          <div className="text-right shrink-0">
            <span className="text-base font-bold text-primary whitespace-nowrap">
              R$ {ad.preco?.toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        {/* Description */}
        {ad.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ad.descricao}</p>
        )}

        {/* Category */}
        {ad.categoria && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{ad.categoria}</span>
            {ad.subcategoria && ` · ${ad.subcategoria}`}
          </p>
        )}

        {/* Seller info with rating */}
        {ad.vendedor?.nome && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                {ad.vendedor.nome[0]?.toUpperCase()}
              </div>
              <span className="font-medium text-foreground/80 truncate">{ad.vendedor.nome}</span>
            </div>
            {ad.vendedor.rating && (
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{ad.vendedor.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {/* Service modes / Features */}
        <div className="flex items-center gap-1.5 flex-wrap mt-auto">
          {ad.condition && (
            <span className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
              ad.condition === "novo" 
                ? "bg-success/10 text-success"
                : ad.condition === "seminovo"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {ad.condition === "novo" ? "Novo" : ad.condition === "seminovo" ? "Seminovo" : "Usado"}
            </span>
          )}
          {ad.aceita_troca && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              Aceita troca
            </span>
          )}
          {ad.entrega_disponivel && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground flex items-center gap-0.5">
              <Truck className="h-2.5 w-2.5" /> Entrega
            </span>
          )}
        </div>

        {/* CTA */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full rounded-lg gap-1 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Ver detalhes <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
});

ItemCard.displayName = 'ItemCard';

// ─── Utils ───────────────────────────────────────────────────

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

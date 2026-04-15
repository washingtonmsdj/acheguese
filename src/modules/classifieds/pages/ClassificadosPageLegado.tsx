/**
 * 💰 CLASSIFICADOS PAGE - VERSÃO COMPLETA
 *
 * Página de classificados mais completa que OLX
 * - Hero com busca
 * - Filtros avançados com categorias visuais
 * - Grid com anúncios
 * - Seção "Também podem te interessar"
 * - Destaques da semana
 * - Estatísticas do marketplace
 */

import React, { useState, useMemo } from "react";
import { useClassificadosPage } from "@/modules/classifieds/hooks/useClassificadosPage";
import { ClassificadosHeader } from "@/modules/classifieds/components/ClassificadosHeader";
import { ClassificadosContent } from "@/modules/classifieds/components/ClassificadosContent";
import { SuggestedAds } from "@/modules/classifieds/components/SuggestedAds";
import { TerritoryIndicator } from "@/core/location";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Award,
  Flame,
  Star,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface ClassificadosPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// Categorias populares para destaques
const FEATURED_CATEGORIES = [
  { emoji: "📱", label: "Eletrônicos", color: "from-blue-500/20 to-cyan-500/20", count: 48 },
  { emoji: "🚗", label: "Veículos", color: "from-amber-500/20 to-orange-500/20", count: 23 },
  { emoji: "🪑", label: "Móveis", color: "from-green-500/20 to-emerald-500/20", count: 67 },
  { emoji: "👕", label: "Roupas", color: "from-pink-500/20 to-rose-500/20", count: 112 },
  { emoji: "🎮", label: "Games", color: "from-purple-500/20 to-violet-500/20", count: 34 },
  { emoji: "🏠", label: "Imóveis", color: "from-teal-500/20 to-cyan-500/20", count: 19 },
];

const MARKETPLACE_STATS = [
  { icon: ShoppingBag, label: "Anúncios ativos", value: "2.4K" },
  { icon: Users, label: "Vendedores", value: "580" },
  { icon: TrendingUp, label: "Vendas/mês", value: "340" },
  { icon: Award, label: "Satisfação", value: "96%" },
];

export default function ClassificadosPage({ resolved, activeMemberIds }: ClassificadosPageProps) {
  const {
    classificados,
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
    handleClearFilters,
    handleClassificadoClick,
    handleNewClassificado,
    handleLoadMore,
  } = useClassificadosPage({ routeResolved: resolved, activeMemberIds });

  // Suggested ads: shuffle existing to simulate recommendations
  const suggestedAds = useMemo(() => {
    if (classificados.length < 3) return [];
    return [...classificados].sort(() => Math.random() - 0.5).slice(0, 8);
  }, [classificados]);

  // Recentes destaques (top priced items)
  const featuredAds = useMemo(() => {
    return [...classificados]
      .sort((a, b) => (b.preco || 0) - (a.preco || 0))
      .slice(0, 4);
  }, [classificados]);

  return (
    <div className="flex flex-col min-h-full">

      <ClassificadosHeader
        activeCount={activeCount}
        onNewClassificado={handleNewClassificado}
      />

      {/* Marketplace Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 mb-3"
      >
        <div className="grid grid-cols-4 gap-2">
          {MARKETPLACE_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl border p-2.5 text-center"
            >
              <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-sm font-bold font-display">{stat.value}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Featured Categories Scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-xs font-bold font-display">Em alta</span>
          </div>
          <button className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
            Ver todas <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FEATURED_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryChange(cat.label.toLowerCase())}
              className="shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br border border-border/50 hover:border-primary/30 transition-all min-w-[72px]"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${cat.color.replace("from-", "").replace(" to-", ", ").replace("/20", " / 0.2").replace("/20", " / 0.2")})`,
              }}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-[10px] font-semibold whitespace-nowrap">
                {cat.label}
              </span>
              <span className="text-[8px] text-muted-foreground">
                {cat.count} anúncios
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Featured / Promoted Ads */}
      {featuredAds.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="px-4 mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="text-xs font-bold font-display">
                Destaques da semana
              </span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {featuredAds.map((ad, i) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => handleClassificadoClick(ad)}
                className="shrink-0 w-[200px] bg-card rounded-xl border overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="relative">
                  <img
                    src={ad.fotos?.[0] || "/placeholder.svg"}
                    alt={ad.titulo}
                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/90 text-[9px] font-bold text-accent-foreground">
                    <Zap className="h-2.5 w-2.5" />
                    Destaque
                  </div>
                  <span className="absolute bottom-2 left-2 text-sm font-bold text-white drop-shadow-lg">
                    R$ {ad.preco?.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {ad.titulo}
                  </p>
                  {ad.bairro && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      📍 {ad.bairro}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content: Filters + Grid */}
      <ClassificadosContent
        classificados={classificados}
        filters={filters}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onCategoryChange={handleCategoryChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onPriceMinChange={handlePriceMinChange}
        onPriceMaxChange={handlePriceMaxChange}
        onClearFilters={handleClearFilters}
        onClassificadoClick={handleClassificadoClick}
        onLoadMore={handleLoadMore}
      />

      {/* "Também podem te interessar" Section */}
      {suggestedAds.length > 0 && !isLoading && (
        <div className="px-4 pb-6">
          <SuggestedAds
            ads={suggestedAds}
            onAdClick={handleClassificadoClick}
          />
        </div>
      )}

      {/* CTA Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mx-4 mb-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl border border-primary/20 p-4 text-center"
      >
        <h3 className="text-sm font-bold font-display mb-1">
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
  );
}

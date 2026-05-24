/**
 * AdsGrid - Grid de anúncios com infinite scroll
 * 
 * SSOT: Componente reutilizável de grid
 * Sem gambiarras: Props tipadas e código limpo
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, PackageOpen, Loader2 } from "lucide-react";
import { ClassifiedCard, ClassifiedCardSkeleton } from "../cards";
import type { Classificado } from "../../sections/types";

// ============================================
// Props
// ============================================

export interface AdsGridProps {
  readonly classificados: readonly Classificado[];
  readonly isLoading: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly onLoadMore: () => void;
  readonly onClassificadoClick: (ad: Classificado) => void;
}

// ============================================
// Component
// ============================================

export function AdsGrid({
  classificados,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onClassificadoClick,
}: AdsGridProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <ClassifiedCardSkeleton key={i} />
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
        <p className="text-sm font-semibold text-foreground">
          Nenhum anúncio encontrado
        </p>
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
        <span className="text-[10px] text-muted-foreground">
          {classificados.length} resultados
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
        <AnimatePresence mode="popLayout">
          {classificados.map((ad, i) => (
            <ClassifiedCard
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

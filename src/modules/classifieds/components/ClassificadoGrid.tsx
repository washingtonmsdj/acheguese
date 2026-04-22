/**
 * 📋 CLASSIFICADO GRID COMPONENT (NÍVEL AAA)
 *
 * Grid 2 colunas com infinite scroll
 *
 * Features:
 * - Grid responsivo 2 colunas
 * - Infinite scroll otimizado
 * - Loading skeletons
 * - Empty states
 * - Error states
 * - Intersection Observer
 * - AnimatePresence
 *
 * @version 1.0.0
 */

import { memo, useRef, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ClassificadoCard } from "./ClassificadoCard";
import { AnimatePresence, motion } from "framer-motion";
import { useClassifiedsAd } from "@/modules/classifieds/hooks/useClassifiedsAd";
import { SponsoredAdCard } from "@/shared/services/promotions";
import type { ClassificadoWithVendedor } from "@/modules/classifieds/hooks/useClassificados";

interface ClassificadoGridProps {
  classificados: ClassificadoWithVendedor[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onClassificadoClick: (classificado: ClassificadoWithVendedor) => void;
}

export const ClassificadoGrid = memo(function ClassificadoGrid({
  classificados,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onClassificadoClick,
}: ClassificadoGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { ad } = useClassifiedsAd();

  // Slot de anúncio após o 2º item (índice 1)
  const AD_SLOT_INDEX = 1;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Initial loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (classificados.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 flex flex-col items-center py-16 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Search className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold">Nenhum classificado encontrado</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tente buscar com outros termos ou ajustar os filtros
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <AnimatePresence mode="popLayout">
        {classificados.map((classificado, index) => [
          <ClassificadoCard
            key={classificado.id}
            classificado={classificado}
            index={index}
            onClick={() => onClassificadoClick(classificado)}
          />,
          /* Slot de anúncio patrocinado após o 2º item — ocupa linha inteira */
          index === AD_SLOT_INDEX && ad && (
            <SponsoredAdCard
              key="classifieds-ad-slot"
              campaign={ad}
              className="col-span-full"
            />
          )
        ])}
      </AnimatePresence>

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="col-span-full flex justify-center py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Carregando mais...</span>
          </div>
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="col-span-full h-1" aria-hidden="true" />
    </div>
  );
});


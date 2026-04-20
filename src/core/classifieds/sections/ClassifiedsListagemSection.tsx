/**
 * ClassifiedsListagemSection - Listagem principal de anÃºncios/vendedores
 * 
 * SSOT: Section modular e reutilizÃ¡vel
 * Sem gambiarras: Props tipadas e cÃ³digo limpo
 */

import { AnimatePresence, motion } from "framer-motion";
import { ClassifiedsViewToggle } from "@/core/classifieds/components/ClassifiedsViewToggle";
import { AdsGrid, SellersGrid } from "../components/grids";
import type { ClassifiedsListagemSectionProps } from "./types";

export function ClassifiedsListagemSection({
  viewMode,
  onViewModeChange,
  classificados,
  vendedores,
  adsCount,
  sellersCount,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onClassificadoClick,
}: ClassifiedsListagemSectionProps) {
  return (
    <>
      {/* View Toggle */}
      <div className="px-4 mt-5 mb-3">
        <ClassifiedsViewToggle
          mode={viewMode}
          onChange={onViewModeChange}
          adsCount={adsCount}
          sellersCount={sellersCount}
        />
      </div>

      {/* Main Content */}
      <section
        className="px-4 pb-4 flex-1"
        aria-label={
          viewMode === "anuncios" ? "Todos os anÃºncios" : "Vendedores"
        }
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
                classificados={classificados}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                onLoadMore={onLoadMore}
                onClassificadoClick={onClassificadoClick}
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
              <SellersGrid vendedores={vendedores} isLoading={isLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}


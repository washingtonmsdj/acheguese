/**
 * Grid de empresas com estados de loading, erro e paginação incremental.
 */

import { memo, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, Store } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { BusinessCard } from "./BusinessCard";
import { useBusinessAd } from "@/modules/business/hooks/useBusinessAd";
import { SponsoredAdCard } from "@/core/business/promotions";

interface BusinessGridItem {
  business: import("@/core/business/types").Business;
  distance?: string | null;
  isFavorite?: boolean;
}

interface BusinessGridProps {
  businesses: BusinessGridItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  onToggleFavorite: (id: string) => void;
  onNavigate?: (lat: number, lng: number) => void;
  onRetry?: () => void;
  allResultsLabel?: string;
}

const BusinessSkeleton = memo(() => (
  <div className="overflow-hidden rounded-xl bg-white/5 border border-white/10 animate-pulse">
    <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-800" />
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-xl bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="h-4 bg-gray-700 rounded w-1/3" />
      <div className="h-4 bg-gray-700 rounded w-2/3" />
      <div className="flex gap-2">
        <div className="h-9 bg-gray-700 rounded flex-1" />
        <div className="h-9 bg-gray-700 rounded flex-1" />
      </div>
    </div>
  </div>
));
BusinessSkeleton.displayName = "BusinessSkeleton";

const LoadingState = memo(() => (
  <div
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    role="status"
    aria-label="Carregando empresas"
  >
    {[...Array(6)].map((_, i) => (
      <BusinessSkeleton key={i} />
    ))}
  </div>
));
LoadingState.displayName = "LoadingState";

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
    role="status"
  >
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 flex items-center justify-center">
      <Store className="w-10 h-10 text-teal-400" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">
      Nenhuma empresa encontrada
    </h3>
    <p className="text-gray-400 max-w-md mx-auto">
      Não encontramos empresas com os filtros selecionados. Tente ajustar sua
      busca.
    </p>
  </motion.div>
));
EmptyState.displayName = "EmptyState";

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

const ErrorState = memo(({ error, onRetry }: ErrorStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
    role="alert"
  >
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
      <AlertCircle className="w-10 h-10 text-red-400" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">
      Erro ao carregar empresas
    </h3>
    <p className="text-gray-400 max-w-md mx-auto mb-6">
      {error.message || "Ocorreu um erro inesperado. Tente novamente."}
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline">
        Tentar novamente
      </Button>
    )}
  </motion.div>
));
ErrorState.displayName = "ErrorState";

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  isFetching: boolean;
}

const LoadMoreTrigger = memo(
  ({ onLoadMore, isFetching }: LoadMoreTriggerProps) => {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isFetching) {
            onLoadMore();
          }
        },
        { threshold: 0.1 },
      );

      const currentTrigger = triggerRef.current;
      if (currentTrigger) {
        observer.observe(currentTrigger);
      }

      return () => {
        if (currentTrigger) {
          observer.unobserve(currentTrigger);
        }
      };
    }, [onLoadMore, isFetching]);

    return (
      <div ref={triggerRef} className="py-8 flex justify-center">
        {isFetching && (
          <div className="flex items-center gap-2 text-teal-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando mais empresas...</span>
          </div>
        )}
      </div>
    );
  },
);
LoadMoreTrigger.displayName = "LoadMoreTrigger";

export const BusinessGrid = memo(
  ({
    businesses,
    isLoading,
    isError,
    error,
    hasMore,
    isFetchingMore,
    onLoadMore,
    onToggleFavorite,
    onNavigate,
    onRetry,
    allResultsLabel,
  }: BusinessGridProps) => {
    const { ad } = useBusinessAd();

    if (isLoading) {
      return <LoadingState />;
    }

    if (isError && error) {
      return <ErrorState error={error} onRetry={onRetry} />;
    }

    if (businesses.length === 0) {
      return <EmptyState />;
    }

    // Slot de anúncio após o 3º item (índice 2).
    const AD_SLOT_INDEX = 2;

    return (
      <div className="space-y-6">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          <AnimatePresence mode="popLayout">
            {businesses.map((item, index) => (
              <Fragment key={item.business.id}>
                <BusinessCard
                  business={item.business}
                  distance={item.distance}
                  isFavorite={item.isFavorite}
                  onToggleFavorite={onToggleFavorite}
                  onNavigate={onNavigate}
                />
                {index === AD_SLOT_INDEX && ad && (
                  <SponsoredAdCard key="business-ad-slot" campaign={ad} />
                )}
              </Fragment>
            ))}
          </AnimatePresence>
        </motion.div>

        {hasMore && (
          <LoadMoreTrigger onLoadMore={onLoadMore} isFetching={isFetchingMore} />
        )}

        {!hasMore && businesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-400 text-sm"
          >
            {allResultsLabel || "Você viu todas as empresas disponíveis"}
          </motion.div>
        )}
      </div>
    );
  },
);

BusinessGrid.displayName = "BusinessGrid";

/**
 * Componente da seção de listagem de businesses
 */

import { motion } from 'framer-motion';
import { ChevronRight, Loader2, Store } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { GastronomyCard } from '@/modules/business/gastronomy/components';
import type { GastronomyBusiness } from '@/modules/business/gastronomy/types';
import { getCuisineLabel } from '@/modules/business/gastronomy/constants';
import type { DisplayLayout } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

interface BusinessListSectionProps {
  businesses: GastronomyBusiness[];
  displayLayout: DisplayLayout;
  distanceMap: Map<string, number>;
  totalCount: number;
  subtitle: string;
  canLoadMore: boolean;
  isFetchingMore: boolean;
  hasActiveFilters: boolean;
  searchQuery: string;
  cuisineType?: string;
  onLoadMore: () => void;
  onClearFilters: () => void;
  onRemoveSearchQuery: () => void;
  onRemoveCuisineFilter: () => void;
}

export function BusinessListSection(props: BusinessListSectionProps) {
  const {
    businesses,
    displayLayout,
    distanceMap,
    totalCount,
    subtitle,
    canLoadMore,
    isFetchingMore,
    hasActiveFilters,
    searchQuery,
    cuisineType,
    onLoadMore,
    onClearFilters,
    onRemoveSearchQuery,
    onRemoveCuisineFilter,
  } = props;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="mb-5 space-y-3">
        {/* Título e contador */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <Store className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground md:text-xl">Todos os restaurantes</h2>
            <p className="text-xs text-muted-foreground">
              {`${totalCount} ${totalCount === 1 ? 'restaurante' : 'restaurantes'}`}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </motion.div>

      {hasActiveFilters && (
        <div className="mb-5 flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Busca: &quot;{searchQuery}&quot;
              <button
                type="button"
                onClick={onRemoveSearchQuery}
                className="ml-1 hover:text-destructive"
                aria-label="Limpar busca"
              >
                ×
              </button>
            </Badge>
          )}
          {cuisineType && (
            <Badge variant="secondary" className="gap-1 pr-1 capitalize">
              {getCuisineLabel(cuisineType)}
              <button
                type="button"
                onClick={onRemoveCuisineFilter}
                className="ml-1 hover:text-destructive"
                aria-label="Remover filtro de culinaria"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {businesses.length === 0 ? (
        <motion.div
          variants={fadeIn}
          className="rounded-2xl border border-border/30 bg-card/50 py-16 text-center"
        >
          <div className="mb-4 inline-block rounded-full bg-muted/50 p-4">
            <Store className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-foreground">Nenhum restaurante encontrado</h3>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">
            Tente ajustar os filtros ou navegar para outra area ativa.
          </p>
          {hasActiveFilters && (
            <Button onClick={onClearFilters} variant="outline" className="rounded-full">
              Limpar todos os filtros
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            className={
              displayLayout === 'grid'
                ? 'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'flex flex-col gap-3'
            }
          >
            {businesses.map((business) => (
              <motion.div key={business.business_data_id} variants={itemVariants} className="h-full">
                <GastronomyCard
                  business={business}
                  variant={displayLayout === 'list' ? 'list' : 'grid'}
                  distanceMeters={distanceMap.get(business.business_data_id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {canLoadMore && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={onLoadMore}
                disabled={isFetchingMore}
                variant="outline"
                size="lg"
                className="gap-2 rounded-full px-8"
              >
                {isFetchingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </>
                ) : (
                  <>
                    Carregar mais <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

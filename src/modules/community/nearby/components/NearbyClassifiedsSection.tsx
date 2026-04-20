/**
 * NearbyClassifiedsSection — Seção de classificados próximos
 * 
 * Integra com o módulo de classificados via SSOT (useClassificados)
 * Exibe anúncios próximos ao usuário com filtros territoriais
 * 
 * @module features/nearby/components
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, MapPin, Camera, Eye, Map as MapIcon } from 'lucide-react';
import { NearbySection } from './NearbySection';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useClassificados } from '@/core/classifieds/hooks/useClassificados';
import { classifiedUrlService } from '@/core/classifieds/services/ClassifiedUrlService';
import { useTerritoryLabels } from '@/core/location';
import type { ClassificadoWithVendedor } from '@/core/classifieds/hooks/useClassificados';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { cn } from '@/shared/utils/cn';

interface NearbyClassifiedsSectionProps {
  /** Localização do usuário para filtro territorial */
  userLocation?: { latitude: number; longitude: number } | null;
  /** Raio em km */
  radiusKm?: number;
  /** Limite de anúncios exibidos */
  limit?: number;
  /** Território resolvido (opcional) */
  resolved?: ResolvedTerritory | null;
  /** Callback para mostrar item no mapa */
  onShowInMap?: (ad: ClassificadoWithVendedor) => void;
}

/**
 * Seção de classificados próximos integrada via SSOT
 */
export function NearbyClassifiedsSection({
  userLocation,
  radiusKm = 5,
  limit = 6,
  resolved = null,
  onShowInMap,
}: NearbyClassifiedsSectionProps) {
  const navigate = useNavigate();
  
  // ✅ SSOT: Labels territoriais
  const territoryLabels = useTerritoryLabels(resolved);

  // ✅ SSOT: Hook de classificados com filtro territorial
  const { classificados, isLoading } = useClassificados({
    filters: {
      sortBy: 'recente',
    },
    routeResolved: resolved,
  });

  // Filtrar por proximidade (client-side por enquanto)
  const nearbyClassifieds = useMemo(() => {
    if (!userLocation) return classificados.slice(0, limit);

    // TODO: Implementar filtro de distância quando coordenadas estiverem disponíveis
    // Por enquanto, retorna os mais recentes
    return classificados
      .filter((c) => c.status === 'active')
      .slice(0, limit);
  }, [classificados, userLocation, limit]);

  const handleAdClick = (ad: ClassificadoWithVendedor) => {
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
  };

  const handleShowInMap = (ad: ClassificadoWithVendedor, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowInMap) {
      onShowInMap(ad);
    }
  };

  const handleSeeAll = () => {
    navigate('/classificados');
  };

  return (
    <NearbySection
      title={`Classificados ${territoryLabels.inTerritory}`}
      subtitle="Produtos e serviços à venda na sua região"
      icon={ShoppingBag}
      iconColorClass="bg-amber-500/10 text-amber-500"
      count={nearbyClassifieds.length}
      isEmpty={nearbyClassifieds.length === 0}
      isLoading={isLoading}
      onSeeAll={nearbyClassifieds.length > 0 ? handleSeeAll : undefined}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {nearbyClassifieds.map((ad, index) => (
          <ClassifiedCard
            key={ad.id}
            ad={ad}
            index={index}
            onViewProduct={() => handleAdClick(ad)}
            onShowInMap={onShowInMap ? (e) => handleShowInMap(ad, e) : undefined}
          />
        ))}
      </div>
    </NearbySection>
  );
}

// ============================================================================
// CLASSIFIED CARD
// ============================================================================

interface ClassifiedCardProps {
  ad: ClassificadoWithVendedor;
  index: number;
  onViewProduct: () => void;
  onShowInMap?: (e: React.MouseEvent) => void;
}

function ClassifiedCard({ ad, index, onViewProduct, onShowInMap }: ClassifiedCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index, 6) * 0.05, duration: 0.3 }}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
      role="article"
      aria-label={`Anúncio: ${ad.titulo}`}
    >
      {/* Imagem */}
      <div className="relative overflow-hidden aspect-square cursor-pointer" onClick={onViewProduct}>
        <img
          src={ad.fotos?.[0] || '/placeholder.svg'}
          alt={ad.titulo}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Badge de status */}
        <div className={cn(
          "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm",
          ad.status === 'active'
            ? "bg-success/90 text-white"
            : "bg-muted/90 text-muted-foreground"
        )}>
          {ad.status === 'active' ? 'Disponível' : 'Vendido'}
        </div>

        {/* Contador de fotos */}
        {ad.fotos && ad.fotos.length > 1 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[9px] font-bold text-white">
            <Camera className="h-2.5 w-2.5" />
            {ad.fotos.length}
          </div>
        )}

        {/* Preço */}
        <div className="absolute bottom-2 left-2">
          <span className="text-sm font-bold text-white drop-shadow-lg">
            R$ {ad.preco?.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-2">
        <h3 
          className="text-[11px] font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-1 cursor-pointer"
          onClick={onViewProduct}
        >
          {ad.titulo}
        </h3>

        {/* Localização e Ações */}
        <div className="flex items-center justify-between gap-1">
          {ad.bairro && (
            <div className="flex items-center gap-0.5 text-muted-foreground text-[9px] flex-1 min-w-0">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{ad.bairro}</span>
            </div>
          )}
          
          {/* Menu de ações */}
          {onShowInMap && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapIcon className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onViewProduct} className="cursor-pointer">
                  <Eye className="h-3.5 w-3.5 mr-2" />
                  Ver produto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShowInMap} className="cursor-pointer">
                  <MapIcon className="h-3.5 w-3.5 mr-2" />
                  Ver no mapa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
}

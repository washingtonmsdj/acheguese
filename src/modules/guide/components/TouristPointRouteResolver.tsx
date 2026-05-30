/**
 * TouristPointRouteResolver
 *
 * Resolve a rota de 3 segmentos do modulo de pontos turisticos:
 * - /pontos-turisticos/:state/:city/:district (listagem)
 * - /pontos-turisticos/:state/:city/:slug (detalhe sem distrito)
 *
 * Detalhes com distrito usam /pontos-turisticos/:state/:city/:district/:slug.
 */

import { useState, useEffect } from 'react';
import { useTerritorialContext } from '@/core/routing/components/TerritorialLayout';
import { useParams } from 'react-router-dom';
import { TouristPointQueryService } from '../services/TouristPointQueryService';
import TouristPointsPage from '../pages/TouristPointsPage';
import TouristPointDetailPage from '../pages/TouristPointDetailPage';

export function TouristPointRouteResolver() {
  const { resolved } = useTerritorialContext();
  const params = useParams<{ groupSlugOrDistrict?: string }>();
  const slug = params.groupSlugOrDistrict;
  
  const [checkingSlug, setCheckingSlug] = useState<string | null>(null);
  const [isTouristPoint, setIsTouristPoint] = useState<boolean | null>(null);

  // Se o território resolvido é um grupo, sempre renderiza listagem
  if (resolved.kind === 'group') {
    return <TouristPointsPage />;
  }

  // Se não há slug, renderiza listagem
  if (!slug) {
    return <TouristPointsPage />;
  }

  // Verificar se o slug corresponde exatamente à location resolvida
  const locationSlug = resolved.location.geographic_path.split('/').filter(Boolean).pop();
  
  // Se o slug da URL é diferente do slug da location, pode ser:
  // 1. Um ponto turístico
  // 2. Um distrito filho (não resolvido)
  
  if (locationSlug !== slug) {
    // Verificar se existe ponto turístico com este slug
    // Usar useEffect para fazer a verificação assíncrona
    if (checkingSlug !== slug) {
      // Precisa verificar - renderizar estado de loading
      return <SlugChecker 
        locationId={resolved.location.id} 
        slug={slug} 
        onResult={(isPoint) => {
          setCheckingSlug(slug);
          setIsTouristPoint(isPoint);
        }} 
      />;
    }
    
    // Já verificou
    if (isTouristPoint === true) {
      return <TouristPointDetailPage />;
    }
    
    // Não é ponto turístico - pode ser um distrito não encontrado
    // Renderizar listagem (comportamento atual)
    return <TouristPointsPage />;
  }

  // O slug da URL é o mesmo da location resolvida: é um distrito
  return <TouristPointsPage />;
}

/**
 * Componente auxiliar para verificar se um slug é de ponto turístico
 */
function SlugChecker({ 
  locationId, 
  slug, 
  onResult 
}: { 
  locationId: string; 
  slug: string; 
  onResult: (isPoint: boolean) => void;
}) {
  useEffect(() => {
    let mounted = true;
    
    TouristPointQueryService.getPublishedBySlug(locationId, slug)
      .then((point) => {
        if (mounted) {
          onResult(point !== null);
        }
      })
      .catch(() => {
        if (mounted) {
          onResult(false);
        }
      });
    
    return () => { mounted = false; };
  }, [locationId, slug, onResult]);
  
  // Loading state
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-pulse text-muted-foreground">Carregando...</div>
    </div>
  );
}

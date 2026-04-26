/**
 * useCommunityPhotos - Fotos da comunidade para um ponto turístico
 *
 * Busca posts com imagens cujo location_id corresponde ao bairro do ponto.
 * Fallback para filtro por city+neighborhood quando location_id não disponível.
 * Retorna array vazio quando não há posts reais.
 * 
 * ✅ SSOT: Database → TouristPointService → Hook → Component
 */

import { useQuery } from '@tanstack/react-query';
import { TouristPointService } from '../services/TouristPointService';

export interface CommunityPhoto {
  id: string;
  image_url: string;
  content: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
}

export function useCommunityPhotos(
  locationId: string | null,
  city: string,
  neighborhood: string | null,
  state?: string,
) {
  return useQuery({
    queryKey: ['community-photos', locationId, city, neighborhood, state],
    queryFn: () => TouristPointService.getCommunityPhotos(locationId, city, neighborhood, state),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

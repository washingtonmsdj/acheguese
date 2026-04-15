/**
 * HomePageV2 — Redirecionamento inteligente para território do usuário
 * 
 * Prioridade de redirecionamento:
 * 1. Território configurado do usuário logado (cidade, não bairro)
 * 2. Último território visitado (se for cidade)
 * 3. Geolocalização (cidade mais próxima)
 * 4. Território de lançamento (fallback: Salvador)
 * 
 * IMPORTANTE: Sempre redireciona para CIDADE, nunca bairro.
 * Bairros podem ter erro de geolocalização e são muito específicos.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSyncExternalStore } from 'react';
import { useUserTerritory } from '@/core/location/hooks/useUserTerritory';
import { useLocations } from '@/core/location/hooks/useLocations';
import { lastTerritoryStore } from '@/core/routing/stores/LastTerritoryStore';
import { TERRITORY_CONFIG } from '@/config/territory';
import { FullScreenLoader } from '@/shared/components/loading/PageLoader';
import { GeolocationService } from '@/core/maps/services/GeolocationService';
import { calculateDistance } from '@/shared/utils/geolocation';

/**
 * Encontra a cidade mais próxima baseada em coordenadas.
 * Usa calculateDistance do SSOT (shared/utils/geolocation) — retorna metros.
 */
function findNearestCity(
  userLat: number,
  userLon: number,
  cities: Array<{ id: string; name: string; geographic_path: string; latitude?: number; longitude?: number }>
): string | null {
  let nearestCity: string | null = null;
  let minDistance = Infinity;

  for (const city of cities) {
    if (city.latitude && city.longitude) {
      const distance = calculateDistance(userLat, userLon, city.latitude, city.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city.geographic_path.replace(/^\/br/, '');
      }
    }
  }

  return nearestCity;
}

export default function HomePageV2() {
  const navigate = useNavigate();
  const { homeCity } = useUserTerritory(); // Apenas cidade, não bairro
  const { data: allLocations = [] } = useLocations();
  const [isGeolocating, setIsGeolocating] = useState(false);
  
  const lastTerritory = useSyncExternalStore(
    lastTerritoryStore.subscribe.bind(lastTerritoryStore),
    lastTerritoryStore.get.bind(lastTerritoryStore),
  ) as import('@/core/routing/stores/LastTerritoryStore').LastTerritory | null;

  useEffect(() => {
    const redirect = async () => {
      // Prioridade 1: Cidade configurada do usuário logado
      if (homeCity?.path) {
        navigate(homeCity.path, { replace: true });
        return;
      }
      
      // Prioridade 2: Último território visitado (apenas se for cidade)
      if (lastTerritory?.baseUrl) {
        // Verifica se é uma cidade (2 segmentos: /estado/cidade)
        const segments = lastTerritory.baseUrl.split('/').filter(Boolean);
        if (segments.length === 2) {
          navigate(lastTerritory.baseUrl, { replace: true });
          return;
        }
      }
      
      // Prioridade 3: Geolocalização (cidade mais próxima) via SSOT
      if (!isGeolocating) {
        setIsGeolocating(true);
        try {
          const geoResult = await GeolocationService.getCurrentLocation({
            useCache: true,
            maxRetries: 1,
          });
          const { latitude, longitude } = geoResult.coords;

          const cities = allLocations.filter(
            loc => loc.type === 'city' && loc.status === 'active'
          );

          const nearestCityPath = findNearestCity(latitude, longitude, cities);

          if (nearestCityPath) {
            navigate(nearestCityPath, { replace: true });
            return;
          }
        } catch {
          // geolocalização falhou ou negada — usar fallback
        } finally {
          setIsGeolocating(false);
        }
      }
      
      // Prioridade 4: Território de lançamento (fallback)
      const fallbackUrl = `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
      navigate(fallbackUrl, { replace: true });
    };

    redirect();
  }, [navigate, homeCity, lastTerritory, allLocations, isGeolocating]);

  return <FullScreenLoader />;
}

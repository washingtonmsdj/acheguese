/**
 * UserLocationResolver - SSOT para resolução de posição do usuário
 * 
 * Responsável por resolver a posição do usuário com fallback inteligente:
 * 1. GPS do dispositivo (se permitido)
 * 2. Cache de GPS recente
 * 3. Território ativo no seletor
 * 4. Cidade padrão do sistema
 * 
 * NUNCA depender exclusivamente de GPS para a aplicação funcionar.
 * 
 * @module core/location/services
 */
import { logger } from '@/shared/utils/logger';
import { GeolocationService } from '@/core/maps/services/GeolocationService';
import { locationContextStore } from '../stores/LocationContextStore';
import type { ResolvedEntityLocation } from '../types/entityLocation';

export interface UserLocationResolverOptions {
  /** Tentar GPS? (default: true) */
  tryGps?: boolean;
  /** Timeout para GPS em ms (default: 10000) */
  gpsTimeout?: number;
  /** Usar cache? (default: true) */
  useCache?: boolean;
}

// Coordenadas centrais de territórios conhecidos (fallback)
const TERRITORY_CENTERS: Record<string, { lat: number; lng: number }> = {
  // Salvador
  'salvador': { lat: -12.9714, lng: -38.5124 },
  // Conceição do Jacuípe
  'conceicao-do-jacuipe': { lat: -12.3269, lng: -38.7661 },
};

class UserLocationResolverClass {
  /**
   * Resolve a posição do usuário com fallback progressivo.
   * 
   * Ordem:
   * 1. GPS (se permitido e disponível)
   * 2. Cache de GPS
   * 3. Centro do território ativo
   * 4. Fallback final (cidade padrão)
   */
  async resolve(options: UserLocationResolverOptions = {}): Promise<ResolvedEntityLocation> {
    const { tryGps = true, gpsTimeout = 10000, useCache = true } = options;

    // 1. Tentar GPS
    if (tryGps) {
      try {
        const result = await GeolocationService.getCurrentLocation({
          useCache,
          timeout: gpsTimeout,
          maxRetries: 2,
        });

        return {
          entityType: 'user_gps',
          source: result.source === 'ip' ? 'ip_geolocation' : 'gps',
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
          locationId: null, // GPS não resolve location_id diretamente
          locationName: null,
          confidence: result.isHighAccuracy ? 'high' : result.source === 'ip' ? 'low' : 'medium',
        };
      } catch (error: any) {
        const isDenied = error?.code === 1 || error?.message?.includes('negada') || error?.message?.includes('denied');
        
        if (isDenied) {
          logger.info('[UserLocationResolver] GPS negado, usando fallback territorial');
        } else {
          logger.warn('[UserLocationResolver] GPS falhou, usando fallback territorial', error?.message);
        }
      }
    }

    // 2. Fallback: território ativo no seletor
    return this.resolveFromTerritory();
  }

  /**
   * Resolve posição a partir do território ativo no seletor.
   * Usado como fallback quando GPS não está disponível.
   */
  resolveFromTerritory(): ResolvedEntityLocation {
    const territory = locationContextStore.getActiveTerritory();
    
    if (territory?.location) {
      const loc = territory.location;
      
      // Tentar obter coordenadas do centro do território
      const slug = loc.slug;
      const center = TERRITORY_CENTERS[slug];
      const systemFallback = TERRITORY_CENTERS['salvador'];
      
      // Também checar metadata do location
      const metaLat = loc.metadata?.center_latitude as number | undefined;
      const metaLng = loc.metadata?.center_longitude as number | undefined;
      
      const lat = metaLat ?? center?.lat ?? systemFallback.lat;
      const lng = metaLng ?? center?.lng ?? systemFallback.lng;

      return {
        entityType: 'user_gps',
        source: 'territory_center',
        latitude: lat,
        longitude: lng,
        accuracy: center || metaLat || metaLng ? 5000 : 10000,
        locationId: loc.id,
        locationName: loc.name,
        confidence: 'low',
      };
    }

    // 3. Fallback final: Salvador (cidade padrão do sistema)
    const fallback = TERRITORY_CENTERS['salvador'];
    return {
      entityType: 'user_gps',
      source: 'territory_center',
      latitude: fallback.lat,
      longitude: fallback.lng,
      accuracy: 10000,
      locationId: null,
      locationName: 'Salvador',
      confidence: 'low',
    };
  }

  /**
   * Verifica se GPS está disponível sem solicitar permissão.
   */
  async isGpsAvailable(): Promise<boolean> {
    if (!('geolocation' in navigator)) return false;
    const permission = await GeolocationService.checkPermission();
    return permission === 'granted';
  }

  /**
   * Verifica se a posição tem qualidade suficiente para "perto de mim"
   */
  isGoodForProximity(location: ResolvedEntityLocation): boolean {
    if (!location.latitude || !location.longitude) return false;
    return location.source === 'gps' && (location.accuracy ?? Infinity) < 1000;
  }
}

export const userLocationResolver = new UserLocationResolverClass();

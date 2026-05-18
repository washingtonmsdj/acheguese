/**
 * ClusteringService - Serviço de clustering de marcadores
 * 
 * Usa Supercluster para agrupar marcadores próximos no mapa.
 * 
 * Responsabilidades:
 * - Criar clusters de marcadores por zoom
 * - Expandir clusters ao aproximar
 * - Calcular bounds de clusters
 * 
 * @module core/maps/services
 */
import { logger } from '@/shared/utils/logger';
import Supercluster from 'supercluster';
import type { MapMarker, BoundingBox } from '../types/core';
// ============================================
// TYPES
// ============================================

export interface ClusterPoint {
  type: 'Feature';
  id: number;
  properties: {
    cluster: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
    // Dados do marcador original
    marker?: MapMarker;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface ClusterOptions {
  radius?: number;
  maxZoom?: number;
  minZoom?: number;
  minPoints?: number;
}

// ============================================
// SERVICE
// ============================================

export class ClusteringService {
  private supercluster: Supercluster | null = null;
  private markers: MapMarker[] = [];

  /**
   * Inicializa o clustering com marcadores
   */
  load(markers: MapMarker[], options: ClusterOptions = {}): void {
    this.markers = markers;

    // Configuração padrão
    const config = {
      radius: options.radius ?? 60,
      maxZoom: options.maxZoom ?? 16,
      minZoom: options.minZoom ?? 0,
      minPoints: options.minPoints ?? 2,
    };

    // Criar instância Supercluster
    this.supercluster = new Supercluster(config);

    // Converter marcadores para formato GeoJSON
    const points: ClusterPoint[] = markers
      .filter((m) => m.coordinates.latitude != null && m.coordinates.longitude != null)
      .map((marker, index) => ({
        type: 'Feature',
        id: index,
        properties: {
          cluster: false,
          marker,
        },
        geometry: {
          type: 'Point',
          coordinates: [marker.coordinates.longitude, marker.coordinates.latitude],
        },
      }));

    // Carregar pontos no Supercluster
    this.supercluster.load(points);
  }

  /**
   * Obtém clusters e marcadores para um viewport específico
   */
  getClusters(bounds: BoundingBox, zoom: number): ClusterPoint[] {
    if (!this.supercluster) {
      logger.warn('[ClusteringService] Supercluster not initialized');
      return [];
    }

    // Supercluster espera [west, south, east, north]
    return this.supercluster.getClusters(bounds, Math.floor(zoom)) as unknown as ClusterPoint[];
  }

  /**
   * Expande um cluster para obter seus filhos
   */
  getClusterExpansionZoom(clusterId: number): number {
    if (!this.supercluster) {
      return 16;
    }

    try {
      return this.supercluster.getClusterExpansionZoom(clusterId);
    } catch (error) {
      logger.error('[ClusteringService] Error getting expansion zoom:', error);
      return 16;
    }
  }

  /**
   * Obtém os marcadores dentro de um cluster
   */
  getClusterLeaves(clusterId: number, limit = 100): ClusterPoint[] {
    if (!this.supercluster) {
      return [];
    }

    try {
      return this.supercluster.getLeaves(clusterId, limit) as unknown as ClusterPoint[];
    } catch (error) {
      logger.error('[ClusteringService] Error getting cluster leaves:', error);
      return [];
    }
  }

  /**
   * Verifica se há marcadores carregados
   */
  hasMarkers(): boolean {
    return this.markers.length > 0;
  }

  /**
   * Limpa o clustering
   */
  clear(): void {
    this.supercluster = null;
    this.markers = [];
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const clusteringService = new ClusteringService();

/**
 * NeighborhoodBoundaryService
 * 
 * Serviço para gerenciar polígonos customizados de bairros.
 * Usado como fallback quando o OpenStreetMap não tem os dados.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
interface NeighborhoodBoundary {
  id: string;
  location_id: string;
  geometry: any;
  source: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class NeighborhoodBoundaryService {
  /**
   * Busca polígono customizado de um bairro pelo location_id
   */
  static async getByLocationId(
    locationId: string
  ): Promise<NeighborhoodBoundary | null> {
    try {
      const { data, error } = await supabase
        .from('neighborhood_boundaries')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();

      if (error) {
        // Erro 406 ou tabela não existe - silenciosamente retorna null
        if (error.code === 'PGRST116' || error.code === '406' || error.message?.includes('406')) {
          return null;
        }
        // Outros erros também retornam null sem logar (tabela pode não existir ainda)
        return null;
      }

      return data;
    } catch (error) {
      // Silenciosamente retorna null - tabela pode não existir ainda
      return null;
    }
  }

  /**
   * Busca múltiplos polígonos customizados por location_ids
   */
  static async getByLocationIds(
    locationIds: string[]
  ): Promise<Map<string, NeighborhoodBoundary>> {
    try {
      const { data, error } = await supabase
        .from('neighborhood_boundaries')
        .select('*')
        .in('location_id', locationIds);

      if (error) throw error;

      const map = new Map<string, NeighborhoodBoundary>();
      data?.forEach((boundary) => {
        map.set(boundary.location_id, boundary);
      });

      return map;
    } catch (error) {
      logger.error('[NeighborhoodBoundaryService] Error fetching boundaries:', error);
      return new Map();
    }
  }

  /**
   * Cria ou atualiza um polígono customizado
   * (Apenas para admins)
   */
  static async upsert(data: {
    location_id: string;
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: any;
    };
    source: string;
    notes?: string;
  }): Promise<NeighborhoodBoundary | null> {
    try {
      const { data: result, error } = await supabase
        .from('neighborhood_boundaries')
        .upsert(data, {
          onConflict: 'location_id',
        })
        .select()
        .single();

      if (error) throw error;

      return result;
    } catch (error) {
      logger.error('[NeighborhoodBoundaryService] Error upserting boundary:', error);
      return null;
    }
  }

  /**
   * Remove um polígono customizado
   * (Apenas para admins)
   */
  static async delete(locationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('neighborhood_boundaries')
        .delete()
        .eq('location_id', locationId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('[NeighborhoodBoundaryService] Error deleting boundary:', error);
      return false;
    }
  }

  /**
   * Lista todos os polígonos customizados
   * (Útil para admin dashboard)
   */
  static async listAll(): Promise<NeighborhoodBoundary[]> {
    try {
      const { data, error } = await supabase
        .from('neighborhood_boundaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('[NeighborhoodBoundaryService] Error listing boundaries:', error);
      return [];
    }
  }
}

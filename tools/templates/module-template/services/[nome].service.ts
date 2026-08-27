/**
 * ============================================
 * [NOME] SERVICE (SSOT)
 * ============================================
 * Serviço centralizado para gerenciar [domínio]
 * Única fonte de verdade para lógica de [domínio]
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  [Nome],
  [Nome]Filters,
  Create[Nome]Params,
  Update[Nome]Params,
} from '../types/[nome].types';

class [Nome]Service {
  private readonly TABLE = '[tabela]';

  /**
   * Buscar [itens] do usuário
   */
  async fetch[Itens](
    userId: string,
    filters: [Nome]Filters = {}
  ): Promise<[Nome][]> {
    try {
      let query = supabase
        .from(this.TABLE)
        .select('*')
        .eq('user_id', userId);

      // Aplicar filtros
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      // Ordenação
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data as [Nome][]) || [];
    } catch (error) {
      logger.error('Erro ao buscar [itens]:', error);
      throw error;
    }
  }

  /**
   * Buscar [item] por ID
   */
  async fetch[Item]ById(id: string): Promise<[Nome] | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as [Nome];
    } catch (error) {
      logger.error('Erro ao buscar [item]:', error);
      throw error;
    }
  }

  /**
   * Criar [item]
   */
  async create[Item](params: Create[Nome]Params): Promise<[Nome]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .insert(params)
        .select()
        .single();

      if (error) throw error;

      return data as [Nome];
    } catch (error) {
      logger.error('Erro ao criar [item]:', error);
      throw error;
    }
  }

  /**
   * Atualizar [item]
   */
  async update[Item](id: string, updates: Update[Nome]Params): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Erro ao atualizar [item]:', error);
      throw error;
    }
  }

  /**
   * Deletar [item]
   */
  async delete[Item](id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Erro ao deletar [item]:', error);
      throw error;
    }
  }
}

// Singleton
export const [nome]Service = new [Nome]Service();

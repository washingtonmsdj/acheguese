/**
 * ProfileFilters — Filtros de Query
 * 
 * Usado para filtrar perfis em queries.
 * 
 * @version 2.0.0
 */

import type { ProfileType } from '../domain/ProfileType';

/**
 * ProfileFilters — Filtros Básicos
 * 
 * Filtros para buscar perfis.
 */
export interface ProfileFilters {
  /** Filtrar por tipo de perfil */
  profile_type?: ProfileType;
  
  /** Filtrar por verificado */
  verified?: boolean;
  
  /** Filtrar por ativo */
  is_active?: boolean;
  
  /** Filtrar por suspenso */
  is_suspended?: boolean;
  
  /** Filtrar por localização */
  location_id?: string;
  
  /** Busca por texto (nome, username, bio) */
  search?: string;
  
  /** Limite de resultados */
  limit?: number;
  
  /** Offset para paginação */
  offset?: number;
}

/**
 * AdminProfileFilters — Filtros Admin
 * 
 * Filtros adicionais para painéis administrativos.
 */
export interface AdminProfileFilters extends ProfileFilters {
  /** Filtrar por bloqueado */
  is_blocked?: boolean;
  
  /** Filtrar por reputação mínima */
  min_reputation?: number;
  
  /** Filtrar por reputação máxima */
  max_reputation?: number;
  
  /** Filtrar por data de criação (início) */
  created_after?: string;
  
  /** Filtrar por data de criação (fim) */
  created_before?: string;
  
  /** Ordenar por campo */
  order_by?: 'created_at' | 'updated_at' | 'reputation' | 'display_name';
  
  /** Direção da ordenação */
  order_direction?: 'asc' | 'desc';
}

/**
 * ProfileSearchFilters — Filtros de Busca
 * 
 * Filtros específicos para busca de perfis.
 */
export interface ProfileSearchFilters {
  /** Termo de busca */
  query: string;
  
  /** Filtrar por tipo de perfil */
  profile_type?: ProfileType;
  
  /** Filtrar por verificado */
  verified?: boolean;
  
  /** Filtrar por localização */
  location_id?: string;
  
  /** Limite de resultados */
  limit?: number;
}

/**
 * Cria filtros padrão
 */
export function createDefaultFilters(): ProfileFilters {
  return {
    is_active: true,
    limit: 20,
    offset: 0,
  };
}

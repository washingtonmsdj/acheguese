/**
 * BusinessRepository - Repository para tabela business_data
 * 
 * SSOT: Única fonte de verdade para operações com businesses
 * Substitui queries diretas espalhadas em 50+ arquivos
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { supabase } from '@/integrations/supabase';
import { BaseRepository } from './BaseRepository';
import { DatabaseError, DatabaseErrorCode } from '../errors/DatabaseError';
import type { Filter } from '../interfaces/IRepository';

/**
 * Status possíveis de um business
 */
export type BusinessStatus = 'active' | 'inactive' | 'pending' | 'suspended';

/**
 * Categorias de business
 */
export type BusinessCategory = 'restaurante' | 'escola' | 'servico' | 'comercio' | string;

/**
 * Interface do Business (SSOT)
 * Define estrutura canônica de um business
 */
export interface Business {
  id: string;
  profile_id: string;
  business_name: string;
  slug: string | null;
  category: BusinessCategory | null;
  subcategory: string | null;
  description: string | null;
  status: BusinessStatus;
  
  // Localização
  location_id: string | null;
  address: string | null;
  address_id: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  latitude: number | null;
  longitude: number | null;
  point: unknown;
  
  // Contato
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  
  // Informações da empresa
  legal_name: string | null;
  cnpj: string | null;
  tax_id: string | null;
  company_type: string | null;
  industry: string | null;
  employee_count: string | null;
  founded_year: number | null;
  
  // Configurações
  business_role: string;
  business_hours: any | null;
  opening_hours: any | null;
  payment_methods: any | null;
  facilities: any | null;
  specialties: any | null;
  
  // Flags
  is_premium: boolean;
  is_verified: boolean;
  is_headquarters: boolean;
  can_post_vagas: boolean;
  
  // Estatísticas
  rating: number | null;
  total_reviews: number;
  favorites_count: number;
  recommendations_count: number;
  total_products: number;
  
  // Hierarquia
  parent_business_id: string | null;
  unit_name: string | null;
  
  // Metadata
  metadata: any;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Repository para operações com businesses
 * Herda todas as operações CRUD do BaseRepository
 * Adiciona métodos específicos do domínio de negócios
 */
export class BusinessRepository extends BaseRepository<Business> {
  protected readonly table = 'business_data';

  constructor() {
    super(supabase);
  }

  /**
   * Busca business por profile_id
   */
  async findByProfileId(profileId: string): Promise<Business | null> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findByProfileId', this.table);
      }

      return data as Business | null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find business by profile_id: ${profileId}`,
        originalError: error,
        table: this.table,
        operation: 'findByProfileId',
        context: { profileId },
      });
    }
  }

  /**
   * Busca business por slug
   */
  async findBySlug(slug: string): Promise<Business | null> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findBySlug', this.table);
      }

      return data as Business | null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find business by slug: ${slug}`,
        originalError: error,
        table: this.table,
        operation: 'findBySlug',
        context: { slug },
      });
    }
  }

  /**
   * Busca businesses por categoria
   */
  async findByCategory(category: BusinessCategory): Promise<Business[]> {
    const filters: Filter[] = [
      this.createFilter('category', 'eq', category),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca businesses por status
   */
  async findByStatus(status: BusinessStatus): Promise<Business[]> {
    const filters: Filter[] = [
      this.createFilter('status', 'eq', status),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca businesses ativos
   */
  async findActive(): Promise<Business[]> {
    return this.findByStatus('active');
  }

  /**
   * Busca businesses premium
   */
  async findPremium(): Promise<Business[]> {
    const filters: Filter[] = [
      this.createFilter('is_premium', 'eq', true),
      this.createFilter('status', 'eq', 'active'),
    ];

    const orderBy = [this.createOrderBy('rating', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca businesses verificados
   */
  async findVerified(): Promise<Business[]> {
    const filters: Filter[] = [
      this.createFilter('is_verified', 'eq', true),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca businesses por localização
   */
  async findByLocationId(locationId: string): Promise<Business[]> {
    const filters: Filter[] = [
      this.createFilter('location_id', 'eq', locationId),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca businesses em área geográfica
   */
  async findInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<Business[]> {
    try {
      // Cálculo aproximado de bounding box
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));

      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('latitude', centerLat - latDelta)
        .lte('latitude', centerLat + latDelta)
        .gte('longitude', centerLng - lngDelta)
        .lte('longitude', centerLng + lngDelta);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findInArea', this.table);
      }

      return (data as Business[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find businesses in area`,
        originalError: error,
        table: this.table,
        operation: 'findInArea',
        context: { centerLat, centerLng, radiusKm },
      });
    }
  }

  /**
   * Busca businesses por cidade
   */
  async findByCity(city: string): Promise<Business[]> {
    const filters: Filter[] = [
      this.createFilter('business_city', 'eq', city),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca top businesses por rating
   */
  async findTopByRating(limit: number = 10): Promise<Business[]> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('status', 'active')
        .not('rating', 'is', null)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findTopByRating', this.table);
      }

      return (data as Business[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find top businesses by rating`,
        originalError: error,
        table: this.table,
        operation: 'findTopByRating',
        context: { limit },
      });
    }
  }

  /**
   * Busca businesses mais favoritados
   */
  async findMostFavorited(limit: number = 10): Promise<Business[]> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('status', 'active')
        .order('favorites_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findMostFavorited', this.table);
      }

      return (data as Business[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find most favorited businesses`,
        originalError: error,
        table: this.table,
        operation: 'findMostFavorited',
        context: { limit },
      });
    }
  }

  /**
   * Busca businesses recentes
   */
  async findRecent(limit: number = 50): Promise<Business[]> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findRecent', this.table);
      }

      return (data as Business[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find recent businesses`,
        originalError: error,
        table: this.table,
        operation: 'findRecent',
        context: { limit },
      });
    }
  }

  /**
   * Busca businesses filhos (unidades)
   */
  async findChildBusinesses(parentId: string): Promise<Business[]> {
    const filters: Filter[] = [
      this.createFilter('parent_business_id', 'eq', parentId),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca businesses que podem postar vagas
   */
  async findCanPostVagas(): Promise<Business[]> {
    const filters: Filter[] = [
      this.createFilter('can_post_vagas', 'eq', true),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.findAll(filters);
  }

  /**
   * Atualiza status do business
   */
  async updateStatus(id: string, status: BusinessStatus): Promise<Business> {
    return this.update(id, {
      status,
      updated_at: new Date().toISOString(),
    } as Partial<Business>);
  }

  /**
   * Incrementa contador de favoritos
   */
  async incrementFavorites(id: string): Promise<Business> {
    try {
      const business = await this.findById(id);
      if (!business) {
        throw new DatabaseError({
          code: DatabaseErrorCode.NOT_FOUND,
          message: `Business not found: ${id}`,
          table: this.table,
          operation: 'incrementFavorites',
          context: { id },
        });
      }

      return this.update(id, {
        favorites_count: business.favorites_count + 1,
        updated_at: new Date().toISOString(),
      } as Partial<Business>);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to increment favorites for business: ${id}`,
        originalError: error,
        table: this.table,
        operation: 'incrementFavorites',
        context: { id },
      });
    }
  }

  /**
   * Decrementa contador de favoritos
   */
  async decrementFavorites(id: string): Promise<Business> {
    try {
      const business = await this.findById(id);
      if (!business) {
        throw new DatabaseError({
          code: DatabaseErrorCode.NOT_FOUND,
          message: `Business not found: ${id}`,
          table: this.table,
          operation: 'decrementFavorites',
          context: { id },
        });
      }

      return this.update(id, {
        favorites_count: Math.max(0, business.favorites_count - 1),
        updated_at: new Date().toISOString(),
      } as Partial<Business>);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to decrement favorites for business: ${id}`,
        originalError: error,
        table: this.table,
        operation: 'decrementFavorites',
        context: { id },
      });
    }
  }

  /**
   * Atualiza rating do business
   */
  async updateRating(id: string, newRating: number): Promise<Business> {
    return this.update(id, {
      rating: newRating,
      updated_at: new Date().toISOString(),
    } as Partial<Business>);
  }

  /**
   * Incrementa total de reviews
   */
  async incrementReviews(id: string): Promise<Business> {
    try {
      const business = await this.findById(id);
      if (!business) {
        throw new DatabaseError({
          code: DatabaseErrorCode.NOT_FOUND,
          message: `Business not found: ${id}`,
          table: this.table,
          operation: 'incrementReviews',
          context: { id },
        });
      }

      return this.update(id, {
        total_reviews: business.total_reviews + 1,
        updated_at: new Date().toISOString(),
      } as Partial<Business>);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to increment reviews for business: ${id}`,
        originalError: error,
        table: this.table,
        operation: 'incrementReviews',
        context: { id },
      });
    }
  }

  /**
   * Conta businesses por categoria
   */
  async countByCategory(category: BusinessCategory): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('category', 'eq', category),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.count(filters);
  }

  /**
   * Conta businesses por status
   */
  async countByStatus(status: BusinessStatus): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('status', 'eq', status),
    ];

    return this.count(filters);
  }

  /**
   * Conta businesses premium
   */
  async countPremium(): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('is_premium', 'eq', true),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.count(filters);
  }

  /**
   * Ativa business
   */
  async activate(id: string): Promise<Business> {
    return this.updateStatus(id, 'active');
  }

  /**
   * Desativa business
   */
  async deactivate(id: string): Promise<Business> {
    return this.updateStatus(id, 'inactive');
  }

  /**
   * Suspende business
   */
  async suspend(id: string): Promise<Business> {
    return this.updateStatus(id, 'suspended');
  }
}

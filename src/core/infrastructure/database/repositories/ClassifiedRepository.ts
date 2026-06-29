/**
 * ClassifiedRepository - Repository para tabela classifieds
 * 
 * SSOT: Única fonte de verdade para operações com classificados
 * Substitui queries diretas espalhadas em 30+ arquivos
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { supabase } from '@/integrations/supabase';
import type { Json } from '@/integrations/supabase';
import { BaseRepository } from './BaseRepository';
import { DatabaseError, DatabaseErrorCode } from '../errors/DatabaseError';
import type { Filter } from '../interfaces/IRepository';

/**
 * Status possíveis de um classificado
 */
export type ClassifiedStatus = 'active' | 'inactive' | 'sold' | 'pending' | 'rejected';

/**
 * Condição do item
 */
export type ClassifiedCondition = 'new' | 'used' | 'refurbished';

/**
 * Alcance do anúncio
 */
export type ClassifiedReach = 'local' | 'regional' | 'national';

/**
 * Interface do Classified (SSOT)
 * Define estrutura canônica de um classificado
 */
export interface Classified {
  id: string;
  seller_id: string;
  profile_id: string | null;
  title: string;
  titulo: string | null;
  description: string | null;
  price: number | null;
  condition: ClassifiedCondition | null;
  status: ClassifiedStatus;
  
  // Categorização
  category: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  
  // Localização
  location_id: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  point: unknown;
  reach: ClassifiedReach | null;
  
  // Mídia
  photos: Json | null;
  
  // SEO
  slug: string | null;
  public_id: string | null;
  
  // Flags
  is_active: boolean | null;
  is_featured: boolean | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Repository para operações com classificados
 * Herda todas as operações CRUD do BaseRepository
 * Adiciona métodos específicos do domínio de classificados
 */
export class ClassifiedRepository extends BaseRepository<Classified> {
  protected readonly table = 'classifieds';

  constructor() {
    super(supabase);
  }

  /**
   * Busca classificados por vendedor
   */
  async findBySellerId(sellerId: string): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('seller_id', 'eq', sellerId),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca classificados por profile_id
   */
  async findByProfileId(profileId: string): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('profile_id', 'eq', profileId),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca classificados por slug
   */
  async findBySlug(slug: string): Promise<Classified | null> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findBySlug', this.table);
      }

      return data as Classified | null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find classified by slug: ${slug}`,
        originalError: error,
        table: this.table,
        operation: 'findBySlug',
        context: { slug },
      });
    }
  }

  /**
   * Busca classificados por status
   */
  async findByStatus(status: ClassifiedStatus): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('status', 'eq', status),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca classificados ativos
   */
  async findActive(): Promise<Classified[]> {
    return this.findByStatus('active');
  }

  /**
   * Busca classificados vendidos
   */
  async findSold(): Promise<Classified[]> {
    return this.findByStatus('sold');
  }

  /**
   * Busca classificados pendentes
   */
  async findPending(): Promise<Classified[]> {
    return this.findByStatus('pending');
  }

  /**
   * Busca classificados por categoria
   */
  async findByCategoryId(categoryId: string): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('category_id', 'eq', categoryId),
      this.createFilter('status', 'eq', 'active'),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca classificados por subcategoria
   */
  async findBySubcategoryId(subcategoryId: string): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('subcategory_id', 'eq', subcategoryId),
      this.createFilter('status', 'eq', 'active'),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca classificados por localização
   */
  async findByLocationId(locationId: string): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('location_id', 'eq', locationId),
      this.createFilter('status', 'eq', 'active'),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca classificados em destaque
   */
  async findFeatured(limit: number = 10): Promise<Classified[]> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findFeatured', this.table);
      }

      return (data as Classified[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find featured classifieds`,
        originalError: error,
        table: this.table,
        operation: 'findFeatured',
        context: { limit },
      });
    }
  }

  /**
   * Busca classificados em área geográfica
   */
  async findInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<Classified[]> {
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

      return (data as Classified[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find classifieds in area`,
        originalError: error,
        table: this.table,
        operation: 'findInArea',
        context: { centerLat, centerLng, radiusKm },
      });
    }
  }

  /**
   * Busca classificados por faixa de preço
   */
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Classified[]> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('status', 'active')
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .order('price', { ascending: true });

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findByPriceRange', this.table);
      }

      return (data as Classified[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find classifieds by price range`,
        originalError: error,
        table: this.table,
        operation: 'findByPriceRange',
        context: { minPrice, maxPrice },
      });
    }
  }

  /**
   * Busca classificados por condição
   */
  async findByCondition(condition: ClassifiedCondition): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('condition', 'eq', condition),
      this.createFilter('status', 'eq', 'active'),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca classificados recentes
   */
  async findRecent(limit: number = 50): Promise<Classified[]> {
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

      return (data as Classified[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find recent classifieds`,
        originalError: error,
        table: this.table,
        operation: 'findRecent',
        context: { limit },
      });
    }
  }

  /**
   * Busca classificados por período
   */
  async findByPeriod(startDate: Date, endDate: Date): Promise<Classified[]> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findByPeriod', this.table);
      }

      return (data as Classified[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find classifieds by period`,
        originalError: error,
        table: this.table,
        operation: 'findByPeriod',
        context: { startDate, endDate },
      });
    }
  }

  /**
   * Atualiza status do classificado
   */
  async updateStatus(id: string, status: ClassifiedStatus): Promise<Classified> {
    return this.update(id, {
      status,
      updated_at: new Date().toISOString(),
    } as Partial<Classified>);
  }

  /**
   * Marca como vendido
   */
  async markAsSold(id: string): Promise<Classified> {
    return this.updateStatus(id, 'sold');
  }

  /**
   * Ativa classificado
   */
  async activate(id: string): Promise<Classified> {
    return this.updateStatus(id, 'active');
  }

  /**
   * Desativa classificado
   */
  async deactivate(id: string): Promise<Classified> {
    return this.updateStatus(id, 'inactive');
  }

  /**
   * Rejeita classificado
   */
  async reject(id: string): Promise<Classified> {
    return this.updateStatus(id, 'rejected');
  }

  /**
   * Define como destaque
   */
  async setFeatured(id: string, isFeatured: boolean): Promise<Classified> {
    return this.update(id, {
      is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    } as Partial<Classified>);
  }

  /**
   * Conta classificados por vendedor
   */
  async countBySellerId(sellerId: string): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('seller_id', 'eq', sellerId),
    ];

    return this.count(filters);
  }

  /**
   * Conta classificados por status
   */
  async countByStatus(status: ClassifiedStatus): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('status', 'eq', status),
    ];

    return this.count(filters);
  }

  /**
   * Conta classificados por categoria
   */
  async countByCategoryId(categoryId: string): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('category_id', 'eq', categoryId),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.count(filters);
  }

  /**
   * Conta classificados por localização
   */
  async countByLocationId(locationId: string): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('location_id', 'eq', locationId),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.count(filters);
  }

  /**
   * Conta classificados em destaque
   */
  async countFeatured(): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('is_featured', 'eq', true),
      this.createFilter('status', 'eq', 'active'),
    ];

    return this.count(filters);
  }

  /**
   * Busca classificados ativos de um vendedor
   */
  async findActiveBySellerId(sellerId: string): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('seller_id', 'eq', sellerId),
      this.createFilter('status', 'eq', 'active'),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca classificados vendidos de um vendedor
   */
  async findSoldBySellerId(sellerId: string): Promise<Classified[]> {
    const filters: Filter[] = [
      this.createFilter('seller_id', 'eq', sellerId),
      this.createFilter('status', 'eq', 'sold'),
    ];

    const orderBy = [this.createOrderBy('updated_at', 'desc')];

    return this.findAll(filters, orderBy);
  }
}

/**
 * LandingFeaturedService
 *
 * Serviço centralizado para os blocos de destaque da landing territorial.
 * Queries leves, limitadas, respeitando TerritoryFilter canônico.
 *
 * Regras de "featured" por módulo:
 *   Business    — is_premium DESC, rating DESC, created_at DESC
 *   Services    — is_accepting_clients=true, rating DESC, created_at DESC
 *   Classifieds — status='active', created_at DESC (mais recentes)
 *
 * Todas as queries:
 *   - Aceitam TerritoryFilter (scope: location | group | none)
 *   - Aplicam eq(location_id) ou in(location_id, ids) conforme o scope
 *   - Limitam resultados (padrão: 4)
 *   - Retornam shape mínimo para card (sem dados pesados)
 *   - Retornam [] em caso de erro (nunca lançam para a UI)
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { applyTerritoryFilter } from '@/core/location/utils';
import type { TerritoryFilter } from '@/core/location/types';
// ── Shapes de saída (mínimos para card) ──────────────────────────────────────

export interface FeaturedBusiness {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  rating: number;
  is_premium: boolean;
  is_verified: boolean;
  slug?: string;
  /** geographic_path da location associada — necessário para URL canônica territorial */
  geographic_path?: string | null;
}

export interface FeaturedService {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  rating: number;
  is_verified: boolean;
  price_range?: string;
}

export interface FeaturedClassified {
  id: string;
  titulo: string;
  category: string;
  price: number;
  photos: string[];
  created_at: string;
  // ✅ Dados para construir URL canônica
  public_id?: string;
  slug?: string;
  geographic_path?: string;
  category_slug?: string;
  subcategory_slug?: string;
}

export interface TerritoryStats {
  businesses: number;
  services: number;
  classifieds: number;
}

interface FeaturedBusinessRow {
  profile_id: string;
  business_name: string | null;
  category: string | null;
  metadata?: { logo_url?: string } | null;
  rating: number | null;
  is_premium: boolean | null;
  is_verified: boolean | null;
  slug: string | null;
  location?: { geographic_path?: string | null } | null;
}

interface FeaturedServiceRow {
  id: string;
  professional_name: string | null;
  service_category: string | null;
  metadata?: { logo_url?: string } | null;
  rating: number | null;
  is_verified: boolean | null;
  price_range: string | null;
  price_type: string | null;
  hourly_rate: number | null;
}

interface FeaturedClassifiedRow {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  photos: string[] | null;
  created_at: string | null;
  public_id: string | null;
  slug: string | null;
  locations?: { geographic_path?: string | null } | null;
  classified_categories?: { slug?: string | null } | null;
  classified_subcategories?: { slug?: string | null } | null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return getErrorMessage(err);
  return String(err);
}

// ✅ SSOT - Função applyTerritoryFilter movida para @/core/location/utils
// Agora importada de lá para evitar duplicação

// ── Serviço ──────────────────────────────────────────────────────────────────

export class LandingFeaturedService {
  /**
   * Negócios em destaque.
   * Regra: premium primeiro, depois por rating, depois mais recentes.
   * Retorna shape mínimo para card.
   */
  static async getFeaturedBusinesses(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedBusiness[]> {
    if (filter.scope === 'none') return [];
    try {
      let query = supabase
        .from('business_data')
        .select('profile_id, business_name, category, metadata, rating, is_premium, is_verified, slug, location:locations!location_id(geographic_path)')
        .eq('status', 'active')
        // Blindagem: nunca retornar registros sem location_id (não territorializados)
        .not('location_id', 'is', null)
        .order('is_premium', { ascending: false })
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      query = applyTerritoryFilter(query, filter);

      const { data, error } = await query;
      if (error) {
        logger.warn('⚠️ LandingFeaturedService.getFeaturedBusinesses:', error.message);
        return [];
      }

      return (data || []).map((d: FeaturedBusinessRow): FeaturedBusiness => ({
        id: d.profile_id,
        name: d.business_name ?? '',
        category: d.category ?? '',
        logo_url: d.metadata?.logo_url ?? undefined,
        rating: d.rating ?? 0,
        is_premium: d.is_premium ?? false,
        is_verified: d.is_verified ?? false,
        slug: d.slug ?? undefined,
        geographic_path: d.location?.geographic_path ?? null,
      }));
    } catch (err: unknown) {
      logger.warn('⚠️ LandingFeaturedService.getFeaturedBusinesses unexpected:', getErrorMessage(err));
      return [];
    }
  }

  /**
   * Serviços em destaque.
   * Regra: aceitando clientes, verificados primeiro, depois por rating.
   */
  static async getFeaturedServices(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedService[]> {
    if (filter.scope === 'none') return [];

    try {
      let query = supabase
        .from('professional_data')
        .select('id, professional_name, service_category, metadata, rating, is_verified, price_range, price_type, hourly_rate')
        .eq('is_accepting_clients', true)
        // Blindagem: nunca retornar registros sem location_id (não territorializados)
        .not('location_id', 'is', null)
        .order('is_verified', { ascending: false })
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      query = applyTerritoryFilter(query, filter);

      const { data, error } = await query;
      if (error) {
        logger.warn('⚠️ LandingFeaturedService.getFeaturedServices:', error.message);
        return [];
      }

      return (data || []).map((d: FeaturedServiceRow): FeaturedService => {
        // Formata o preço baseado no tipo
        let priceDisplay = 'A combinar';

        if (d.price_type === 'hourly' && d.hourly_rate) {
          priceDisplay = `R$ ${d.hourly_rate}/h`;
        } else if (d.price_type === 'fixed' && d.price_range) {
          priceDisplay = d.price_range;
        } else if (d.price_type === 'negotiable') {
          priceDisplay = 'A combinar';
        } else if (d.price_type === 'free') {
          priceDisplay = 'Gratuito';
        } else if (d.price_type === 'package') {
          priceDisplay = d.price_range || 'Pacotes disponíveis';
        } else if (d.price_type === 'consultation') {
          priceDisplay = 'Sob consulta';
        } else if (d.price_range) {
          priceDisplay = d.price_range;
        }

        return {
          id: d.id,
          name: d.professional_name ?? '',
          category: d.service_category ?? '',
          logo_url: d.metadata?.logo_url ?? undefined,
          rating: d.rating ?? 0,
          is_verified: d.is_verified ?? false,
          price_range: priceDisplay,
        };
      });
    } catch (err: unknown) {
      logger.warn('⚠️ LandingFeaturedService.getFeaturedServices unexpected:', getErrorMessage(err));
      return [];
    }
  }

  /**
   * Classificados em destaque.
   * Regra: ativos, mais recentes primeiro.
   * ✅ SSOT EXCEPTION: LandingFeaturedService é o serviço autorizado para queries de landing
   */
  static async getFeaturedClassifieds(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedClassified[]> {
    if (filter.scope === 'none') return [];

    try {
      // eslint-disable-next-line ssot/no-direct-classified-access
      let query = supabase
        .from('classifieds')
        .select(`
          id,
          title,
          description,
          category,
          price,
          photos,
          created_at,
          public_id,
          slug,
          locations(geographic_path),
          classified_categories(slug),
          classified_subcategories(slug)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      query = applyTerritoryFilter(query, filter);

      const { data, error } = await query;
      if (error) {
        logger.warn('⚠️ LandingFeaturedService.getFeaturedClassifieds:', error.message);
        return [];
      }

      return (data || []).map((d: FeaturedClassifiedRow): FeaturedClassified => ({
        id: d.id,
        titulo: d.title ?? d.description ?? 'Classificado',
        category: d.category ?? '',
        price: d.price ?? 0,
        photos: d.photos ?? [],
        created_at: d.created_at ?? '',
        // ✅ Dados para URL canônica
        public_id: d.public_id ?? undefined,
        slug: d.slug ?? undefined,
        geographic_path: d.locations?.geographic_path ?? undefined,
        category_slug: d.classified_categories?.slug ?? undefined,
        subcategory_slug: d.classified_subcategories?.slug ?? undefined,
      }));
    } catch (err: unknown) {
      logger.warn('⚠️ LandingFeaturedService.getFeaturedClassifieds unexpected:', getErrorMessage(err));
      return [];
    }
  }

  /**
   * Contagens básicas do território.
   * Usa COUNT(*) com head:true — sem carregar dados.
   * Retorna 0 em caso de erro (nunca bloqueia a landing).
   */
  static async getTerritoryStats(filter: TerritoryFilter): Promise<TerritoryStats> {
    if (filter.scope === 'none') return { businesses: 0, services: 0, classifieds: 0 };



    const [businessRes, serviceRes, classifiedRes] = await Promise.allSettled([
      (() => {
        let q = supabase.from('business_data')
          .select('profile_id', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('location_id', 'is', null);
        q = applyTerritoryFilter(q, filter);
        return q;
      })(),
      (() => {
        let q = supabase.from('professional_data')
          .select('id', { count: 'exact', head: true })
          .eq('is_accepting_clients', true)
          .not('location_id', 'is', null);
        q = applyTerritoryFilter(q, filter);
        return q;
      })(),
      (() => {
        // eslint-disable-next-line ssot/no-direct-classified-access
        let q = supabase.from('classifieds')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active');
        q = applyTerritoryFilter(q, filter);
        return q;
      })(),
    ]);

    return {
      businesses: businessRes.status === 'fulfilled' ? (businessRes.value.count ?? 0) : 0,
      services:   serviceRes.status === 'fulfilled'  ? (serviceRes.value.count ?? 0)  : 0,
      classifieds: classifiedRes.status === 'fulfilled' ? (classifiedRes.value.count ?? 0) : 0,
    };
  }
}

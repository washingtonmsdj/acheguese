/**
 * LandingFeaturedService
 *
 * ServiÃ§o centralizado para os blocos de destaque da landing territorial.
 * Queries leves, limitadas, respeitando TerritoryFilter canÃ´nico.
 *
 * Regras de "featured" por mÃ³dulo:
 *   Business    â€” is_premium DESC, rating DESC, created_at DESC
 *   Services    â€” is_accepting_clients=true + visibility=public_listed, rating DESC, created_at DESC
 *   Classifieds â€” status='active', created_at DESC (mais recentes)
 *
 * Todas as queries:
 *   - Aceitam TerritoryFilter (scope: location | group | none)
 *   - Aplicam eq(location_id) ou in(location_id, ids) conforme o scope
 *   - Limitam resultados (padrÃ£o: 4)
 *   - Retornam shape mÃ­nimo para card (sem dados pesados)
 *   - Retornam [] em caso de erro (nunca lanÃ§am para a UI)
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import { applyTerritoryFilter } from '@/core/location/utils';
import type { TerritoryFilter } from '@/core/location/types';
// â”€â”€ Shapes de saÃ­da (mÃ­nimos para card) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface FeaturedBusiness {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  rating: number;
  is_premium: boolean;
  is_verified: boolean;
  slug?: string;
  /** geographic_path da location associada â€” necessÃ¡rio para URL canÃ´nica territorial */
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
  // âœ… Dados para construir URL canÃ´nica
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
  if (err instanceof Error) return err.message;
  return String(err);
}

function getLogoUrl(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const candidate = (metadata as { logo_url?: unknown }).logo_url;
  return typeof candidate === 'string' ? candidate : undefined;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

// âœ… SSOT - FunÃ§Ã£o applyTerritoryFilter movida para @/core/location/utils
// Agora importada de lÃ¡ para evitar duplicaÃ§Ã£o

// â”€â”€ ServiÃ§o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class LandingFeaturedService {
  /**
   * NegÃ³cios em destaque.
   * Regra: premium primeiro, depois por rating, depois mais recentes.
   * Retorna shape mÃ­nimo para card.
   */
  static async getFeaturedBusinesses(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedBusiness[]> {
    if (filter.scope === 'none') return [];
    try {
      let query = (supabase as any)
        .from('business_data')
        .select('profile_id, business_name, category, metadata, rating, is_premium, is_verified, slug, location:locations!location_id(geographic_path)')
        .eq('status', 'active')
        // Blindagem: nunca retornar registros sem location_id (nÃ£o territorializados)
        .not('location_id', 'is', null)
        .order('is_premium', { ascending: false })
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      query = applyTerritoryFilter(query as any, filter) as any;

      const { data, error } = await query;
      if (error) {
        logger.warn('âš ï¸ LandingFeaturedService.getFeaturedBusinesses:', error.message);
        return [];
      }

      const rows = (data ?? []) as unknown as FeaturedBusinessRow[];
      return rows.map((d): FeaturedBusiness => ({
        id: d.profile_id,
        name: d.business_name ?? '',
        category: d.category ?? '',
        logo_url: getLogoUrl(d.metadata),
        rating: d.rating ?? 0,
        is_premium: d.is_premium ?? false,
        is_verified: d.is_verified ?? false,
        slug: d.slug ?? undefined,
        geographic_path: d.location?.geographic_path ?? null,
      }));
    } catch (err: unknown) {
      logger.warn('âš ï¸ LandingFeaturedService.getFeaturedBusinesses unexpected:', getErrorMessage(err));
      return [];
    }
  }

  /**
   * ServiÃ§os em destaque.
   * Regra: aceitando clientes, verificados primeiro, depois por rating.
   */
  static async getFeaturedServices(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedService[]> {
    if (filter.scope === 'none') return [];

    try {
      let query = (supabase as any)
        .from('professional_data')
        .select('id, professional_name, service_category, metadata, rating, is_verified, price_range, price_type, hourly_rate')
        .eq('is_accepting_clients', true)
        .eq('visibility', 'public_listed')
        // Blindagem: nunca retornar registros sem location_id (nÃ£o territorializados)
        .not('location_id', 'is', null)
        .order('is_verified', { ascending: false })
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      query = applyTerritoryFilter(query as any, filter) as any;

      const { data, error } = await query;
      if (error) {
        logger.warn('âš ï¸ LandingFeaturedService.getFeaturedServices:', error.message);
        return [];
      }

      const rows = (data ?? []) as unknown as FeaturedServiceRow[];
      return rows.map((d): FeaturedService => {
        // Formata o preÃ§o baseado no tipo
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
          priceDisplay = d.price_range || 'Pacotes disponÃ­veis';
        } else if (d.price_type === 'consultation') {
          priceDisplay = 'Sob consulta';
        } else if (d.price_range) {
          priceDisplay = d.price_range;
        }

        return {
          id: d.id,
          name: d.professional_name ?? '',
          category: d.service_category ?? '',
          logo_url: getLogoUrl(d.metadata),
          rating: d.rating ?? 0,
          is_verified: d.is_verified ?? false,
          price_range: priceDisplay,
        };
      });
    } catch (err: unknown) {
      logger.warn('âš ï¸ LandingFeaturedService.getFeaturedServices unexpected:', getErrorMessage(err));
      return [];
    }
  }

  /**
   * Classificados em destaque.
   * Regra: ativos, mais recentes primeiro.
   * âœ… SSOT EXCEPTION: LandingFeaturedService Ã© o serviÃ§o autorizado para queries de landing
   */
  static async getFeaturedClassifieds(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedClassified[]> {
    if (filter.scope === 'none') return [];

    try {
      // eslint-disable-next-line ssot/no-direct-classified-access
      let query = (supabase as any)
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

      query = applyTerritoryFilter(query as any, filter) as any;

      const { data, error } = await query;
      if (error) {
        logger.warn('âš ï¸ LandingFeaturedService.getFeaturedClassifieds:', error.message);
        return [];
      }

      const rows = (data ?? []) as unknown as FeaturedClassifiedRow[];
      return rows.map((d): FeaturedClassified => ({
        id: d.id,
        titulo: d.title ?? d.description ?? 'Classificado',
        category: d.category ?? '',
        price: d.price ?? 0,
        photos: getStringArray(d.photos),
        created_at: d.created_at ?? '',
        // âœ… Dados para URL canÃ´nica
        public_id: d.public_id ?? undefined,
        slug: d.slug ?? undefined,
        geographic_path: d.locations?.geographic_path ?? undefined,
        category_slug: d.classified_categories?.slug ?? undefined,
        subcategory_slug: d.classified_subcategories?.slug ?? undefined,
      }));
    } catch (err: unknown) {
      logger.warn('âš ï¸ LandingFeaturedService.getFeaturedClassifieds unexpected:', getErrorMessage(err));
      return [];
    }
  }

  /**
   * Contagens bÃ¡sicas do territÃ³rio.
   * Usa COUNT(*) com head:true â€” sem carregar dados.
   * Retorna 0 em caso de erro (nunca bloqueia a landing).
   */
  static async getTerritoryStats(filter: TerritoryFilter): Promise<TerritoryStats> {
    if (filter.scope === 'none') return { businesses: 0, services: 0, classifieds: 0 };



    const supabaseAny = supabase as any;
    const [businessRes, serviceRes, classifiedRes] = await Promise.allSettled([
      (() => {
        let q = supabaseAny.from('business_data')
          .select('profile_id', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('location_id', 'is', null);
        q = applyTerritoryFilter(q as any, filter) as any;
        return q;
      })(),
      (() => {
        let q = supabaseAny.from('professional_data')
          .select('id', { count: 'exact', head: true })
          .eq('is_accepting_clients', true)
          .eq('visibility', 'public_listed')
          .not('location_id', 'is', null);
        q = applyTerritoryFilter(q as any, filter) as any;
        return q;
      })(),
      (() => {
        // eslint-disable-next-line ssot/no-direct-classified-access
        let q = supabaseAny.from('classifieds')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active');
        q = applyTerritoryFilter(q as any, filter) as any;
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


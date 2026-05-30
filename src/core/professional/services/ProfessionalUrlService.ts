/**
 * ProfessionalUrlService - SSOT for public professional URLs.
 *
 * Canonical public URL:
 *   /servicos/:uf/:cidade/profissional/:slug
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { PublicIdentityService } from '@/core/public-identity/services/PublicIdentityService';
import { professionalPublicRoutes } from '@/core/professional/routes/professionalPublicRoutes';

export interface ProfessionalUrlContext {
  /** Professional profile_id. */
  id: string;
  slug: string;
  /** State slug or name. Example: ba, sp. */
  state: string;
  /** City slug or name. Example: salvador, sao-paulo. */
  city: string;
}

export interface ResolvedProfessionalUrl {
  /** Public canonical URL: /servicos/ba/salvador/profissional/joao-silva-dev */
  canonical: string;
  /** Internal dashboard URL: /dashboard/professional/:id */
  dashboard: string;
}

export interface ProfessionalPublicUrlTarget {
  id: string;
  profile_id?: string | null;
  slug?: string | null;
  geographic_path?: string | null;
  geographicPath?: string | null;
  state?: string | null;
  city?: string | null;
}

type ProfessionalLocationRelation = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  type?: string | null;
  geographic_path?: string | null;
  parent?: ProfessionalLocationRelation | ProfessionalLocationRelation[] | null;
};

type ProfessionalUrlRow = {
  id?: string | null;
  profile_id: string | null;
  slug: string | null;
  location?: ProfessionalLocationRelation | ProfessionalLocationRelation[] | null;
};

type ParsedProfessionalTerritory = {
  state: string;
  city: string;
};

const PROFESSIONAL_URL_SELECT = `
  id,
  profile_id,
  slug,
  location:locations!professional_data_location_id_fkey(
    id,
    name,
    slug,
    type,
    geographic_path,
    parent:locations!locations_parent_id_fkey(
      id,
      name,
      slug,
      type,
      geographic_path,
      parent:locations!locations_parent_id_fkey(
        id,
        name,
        slug,
        type,
        geographic_path
      )
    )
  )
`;

function normalizeForUrl(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

function parseTerritoryFromGeographicPath(
  geographicPath: string | null | undefined,
): ParsedProfessionalTerritory | null {
  if (!geographicPath) return null;

  const parts = geographicPath.split('/').filter(Boolean);
  const territoryParts = parts.at(0) === 'br' ? parts.slice(1) : parts;
  const [state, city] = territoryParts;

  if (!state || !city) return null;
  return { state, city };
}

function extractTerritoryFromLocation(
  location: ProfessionalLocationRelation | null | undefined,
): ParsedProfessionalTerritory | null {
  const current = firstRelation(location);
  if (!current) return null;

  const pathTerritory = parseTerritoryFromGeographicPath(current.geographic_path);
  if (pathTerritory) return pathTerritory;

  const parent = firstRelation(current.parent);
  const grandparent = firstRelation(parent?.parent);

  if (current.type === 'neighborhood' || current.type === 'district') {
    const city = parent?.slug ?? parent?.name ?? '';
    const state = grandparent?.slug ?? grandparent?.name ?? '';
    return state && city ? { state, city } : null;
  }

  if (current.type === 'city') {
    const city = current.slug ?? current.name ?? '';
    const state = parent?.slug ?? parent?.name ?? '';
    return state && city ? { state, city } : null;
  }

  return null;
}

function resolveContextFromRow(
  row: ProfessionalUrlRow,
  logContext: Record<string, unknown>,
): ProfessionalUrlContext | null {
  if (!row.profile_id || !row.slug) {
    logger.warn('[ProfessionalUrlService] Professional without public identity', logContext);
    return null;
  }

  const location = firstRelation(row.location);
  if (!location) {
    logger.warn('[ProfessionalUrlService] Professional without location', logContext);
    return null;
  }

  if (location.type === 'state') {
    logger.warn('[ProfessionalUrlService] Professional with state-level location', logContext);
    return null;
  }

  const territory = extractTerritoryFromLocation(location);
  if (!territory) {
    logger.warn('[ProfessionalUrlService] Could not extract state/city', {
      ...logContext,
      location,
    });
    return null;
  }

  return {
    id: row.profile_id,
    slug: row.slug,
    state: territory.state,
    city: territory.city,
  };
}

export class ProfessionalUrlService {
  static buildUrls(ctx: ProfessionalUrlContext): ResolvedProfessionalUrl {
    const { id, slug, state, city } = ctx;

    if (!state || !city) {
      throw new Error(
        `[ProfessionalUrlService] Profissional ${id} sem state/city. ` +
          'Profissionais devem ter location_id apontando para cidade.',
      );
    }

    const canonical = professionalPublicRoutes.detail({ state, city, slug });

    return {
      canonical,
      dashboard: `/dashboard/professional/${id}`,
    };
  }

  static getCanonicalUrl(ctx: ProfessionalUrlContext): string {
    return this.buildUrls(ctx).canonical;
  }

  static getCanonicalUrlFromGeographicPath(ctx: {
    id: string;
    slug: string;
    geographicPath: string;
  }): string | null {
    const territory = parseTerritoryFromGeographicPath(ctx.geographicPath);
    if (!territory) return null;

    return this.getCanonicalUrl({
      id: ctx.id,
      slug: ctx.slug,
      state: territory.state,
      city: territory.city,
    });
  }

  static getCanonicalUrlFromTarget(target: ProfessionalPublicUrlTarget): string | null {
    const slug = typeof target.slug === 'string' && target.slug.trim() ? target.slug : null;
    if (!slug) return null;

    const id = target.profile_id ?? target.id;
    const geographicPath =
      typeof target.geographic_path === 'string' && target.geographic_path.trim()
        ? target.geographic_path
        : typeof target.geographicPath === 'string' && target.geographicPath.trim()
          ? target.geographicPath
          : null;

    try {
      if (geographicPath) {
        return this.getCanonicalUrlFromGeographicPath({
          id,
          slug,
          geographicPath,
        });
      }

      if (target.state && target.city) {
        return this.getCanonicalUrl({
          id,
          slug,
          state: target.state,
          city: target.city,
        });
      }
    } catch (error) {
      logger.warn('[ProfessionalUrlService] Could not build canonical professional URL', {
        id,
        slug,
        error,
      });
    }

    return null;
  }

  static getPublicUrlPreview(slug: string): string {
    return slug ? professionalPublicRoutes.detailPreview(slug) : '';
  }

  static async resolveBySlug(
    slug: string,
    state: string,
    city: string,
  ): Promise<ProfessionalUrlContext | null> {
    try {
      const normalizedState = normalizeForUrl(state);
      const normalizedCity = normalizeForUrl(city);

      const { data, error } = await supabase
        .from('professional_data')
        .select(PROFESSIONAL_URL_SELECT)
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) {
        logger.warn('[ProfessionalUrlService] Professional not found', { slug, state, city, error });
        return null;
      }

      const ctx = resolveContextFromRow(data as ProfessionalUrlRow, { slug });
      if (!ctx) return null;

      const actualState = normalizeForUrl(ctx.state);
      const actualCity = normalizeForUrl(ctx.city);

      if (actualState !== normalizedState || actualCity !== normalizedCity) {
        logger.warn('[ProfessionalUrlService] Professional found but location mismatch', {
          slug,
          expected: { state: normalizedState, city: normalizedCity },
          actual: { state: actualState, city: actualCity },
        });
        return null;
      }

      return ctx;
    } catch (err) {
      logger.error('[ProfessionalUrlService] resolveBySlug error:', err);
      return null;
    }
  }

  static async resolveById(id: string): Promise<ProfessionalUrlContext | null> {
    try {
      const { data, error } = await supabase
        .from('professional_data')
        .select(PROFESSIONAL_URL_SELECT)
        .eq('profile_id', id)
        .maybeSingle();

      if (error || !data) {
        logger.warn('[ProfessionalUrlService] Professional not found by profile id', { id, error });
        return null;
      }

      return resolveContextFromRow(data as ProfessionalUrlRow, { id });
    } catch (err) {
      logger.error('[ProfessionalUrlService] resolveById error:', err);
      return null;
    }
  }

  static async resolveByProfessionalDataId(
    professionalDataId: string,
  ): Promise<ProfessionalUrlContext | null> {
    try {
      const { data, error } = await supabase
        .from('professional_data')
        .select(PROFESSIONAL_URL_SELECT)
        .eq('id', professionalDataId)
        .maybeSingle();

      if (error || !data) {
        logger.warn('[ProfessionalUrlService] Professional not found by data id', {
          professionalDataId,
          error,
        });
        return null;
      }

      return resolveContextFromRow(data as ProfessionalUrlRow, { professionalDataId });
    } catch (err) {
      logger.error('[ProfessionalUrlService] resolveByProfessionalDataId error:', err);
      return null;
    }
  }

  static isValidSlug(slug: string): boolean {
    const validation = PublicIdentityService.validateFormat(slug, 'professional');
    if (!validation.valid) return false;

    if (PublicIdentityService.isReserved(slug, 'professional')) return false;

    return true;
  }

  static generateSlug(name: string): string {
    return PublicIdentityService.normalize(name, 'professional');
  }

  static async generateUniqueSlug(name: string): Promise<string> {
    const slug = this.generateSlug(name);

    const availability = await PublicIdentityService.checkAvailability({
      identifier: slug,
      entityType: 'professional',
    });

    if (availability.status === 'available') {
      return slug;
    }

    if (availability.suggestion) {
      return availability.suggestion;
    }

    const { data } = await supabase
      .from('professional_data')
      .select('slug')
      .ilike('slug', `${slug}%`);

    const existingSlugs: string[] = (data || []).map((d: { slug: string | null }) => d.slug).filter(Boolean);
    let counter = 1;
    while (existingSlugs.includes(`${slug}-${counter}`)) {
      counter++;
    }
    return `${slug}-${counter}`;
  }
}

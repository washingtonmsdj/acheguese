import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { resolveCityToLocationIds, resolveNeighborhoodInCity } from '@/core/location/helpers/territorialResolver';
import { SALVADOR_MOCK_POINTS } from '../data/salvador-mock';
import { LocationType } from '@/shared/types/enums';
import { PAGINATION } from '@/shared/constants';
import type {
  TouristPoint,
  CreateTouristPointInput,
  UpdateTouristPointInput,
  TouristPointFilters,
} from '../types';

const DB_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

const DEFAULT_LEGACY_STATUS = 'active';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SELECT_LEGACY = `
  *,
  location_relation:locations!location_id(id, name, full_name, geographic_path, parent_id, type),
  address_relation:addresses!address_id(street, number, complement, postal_code, latitude, longitude),
  media:tourist_point_media(id, url, alt_text, is_cover, display_order)
`;

function has(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function toText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeDbStatus(status: unknown): string {
  const v = toText(status)?.toLowerCase();
  if (v === 'inactive' || v === 'pending_review' || v === DB_STATUS.DRAFT) return DB_STATUS.DRAFT;
  if (v === DB_STATUS.ARCHIVED) return DB_STATUS.ARCHIVED;
  return DB_STATUS.PUBLISHED;
}

function mapDbStatusToLegacy(status: unknown): TouristPoint['status'] {
  const v = toText(status)?.toLowerCase();
  if (v === DB_STATUS.DRAFT) return 'inactive';
  if (v === DB_STATUS.ARCHIVED) return 'archived';
  return 'active';
}

function normalizeDbPriceType(priceType: unknown): string {
  const v = toText(priceType)?.toLowerCase();
  if (v === 'free' || v === 'gratuito') return 'free';
  if (v === 'paid' || v === 'pago') return 'paid';
  if (v === 'range' || v === 'faixa') return 'range';
  if (v === 'consult' || v === 'consultar') return 'consult';
  return 'free';
}

function mapDbPriceTypeToLegacy(priceType: unknown): TouristPoint['price_type'] {
  const v = toText(priceType)?.toLowerCase();
  if (v === 'free') return 'gratuito';
  if (v === 'consult') return 'consultar';
  return 'pago';
}

function firstOrNull<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function mapDbToLegacy(point: any): TouristPoint {
  const location = firstOrNull(point.location_relation);
  const address = firstOrNull(point.address_relation);
  const media = Array.isArray(point.media) ? point.media : [];
  const cover = media.find((m) => m.is_cover) ?? media[0] ?? null;
  const summary = toText(point.short_description) ?? toText(point.summary) ?? toText(point.description) ?? '';
  const openingHours = toText(point.visiting_hours) ?? toText(point.opening_hours);
  const website = toText(point.website) ?? toText(point.official_url);
  const accessibilityLevel: TouristPoint['accessibility_level'] =
    point.accessibility_level ?? (point.accessibility ? 'parcial' : 'desconhecido');

  return {
    id: point.id,
    name: toText(point.name) ?? toText(point.title) ?? 'Ponto turistico',
    slug: point.slug,
    description: toText(point.description) ?? '',
    short_description: summary,
    category: point.category ?? 'outro',
    tags: Array.isArray(point.tags) ? point.tags : [],
    state: toText(point.state)?.toLowerCase() ?? '',
    city: toText(point.city)?.toLowerCase() ?? '',
    location_id: point.location_id ?? null,
    address_id: point.address_id ?? null,
    location: location
      ? {
          name: location.name,
          full_name: location.full_name,
          geographic_path: location.geographic_path ?? null,
        }
      : null,
    address: address
      ? {
          street: address.street ?? null,
          number: address.number ?? null,
          complement: address.complement ?? null,
          postal_code: address.postal_code ?? null,
          latitude: address.latitude ?? null,
          longitude: address.longitude ?? null,
        }
      : null,
    neighborhood: toText(point.neighborhood) ?? location?.name ?? null,
    address_text: toText(point.address_text) ?? toText(point.address),
    latitude: address?.latitude ?? point.latitude ?? null,
    longitude: address?.longitude ?? point.longitude ?? null,
    photo_url: toText(point.photo_url) ?? cover?.url ?? null,
    gallery_urls: Array.isArray(point.gallery_urls)
      ? point.gallery_urls
      : media.map((m) => m.url).filter(Boolean),
    icon_emoji: toText(point.icon_emoji) ?? '📍',
    visiting_hours: openingHours,
    entry_fee: toText(point.entry_fee) ?? toText(point.price_text),
    price_type: mapDbPriceTypeToLegacy(point.price_type),
    price_text: toText(point.price_text),
    website,
    phone: toText(point.phone),
    accessibility: Boolean(point.accessibility) || accessibilityLevel === 'total' || accessibilityLevel === 'parcial',
    accessibility_level: accessibilityLevel,
    accessibility_description: toText(point.accessibility_description) ?? toText(point.accessibility_notes),
    has_parking: Boolean(point.has_parking),
    has_restaurant: Boolean(point.has_restaurant),
    has_guide: Boolean(point.has_guide),
    is_featured: Boolean(point.is_featured),
    display_order: Number(point.display_order ?? 0),
    rating: Number(point.rating ?? 0),
    total_reviews: Number(point.total_reviews ?? 0),
    status: mapDbStatusToLegacy(point.status),
    observations: toText(point.observations),
    nearby_point_ids: Array.isArray(point.nearby_point_ids) ? point.nearby_point_ids : [],
    created_by: point.created_by ?? null,
    created_at: point.created_at,
    updated_at: point.updated_at,
  };
}

function filterMock(filters: TouristPointFilters = {}): TouristPoint[] {
  let rows = [...SALVADOR_MOCK_POINTS];
  const status = (filters.status ?? DEFAULT_LEGACY_STATUS).toLowerCase();

  rows = rows.filter((p) => p.status === status);
  if (filters.state) rows = rows.filter((p) => p.state === filters.state!.toLowerCase());
  if (filters.city) rows = rows.filter((p) => p.city === filters.city!.toLowerCase());
  if (filters.category) rows = rows.filter((p) => p.category === filters.category);
  if (filters.is_featured !== undefined) rows = rows.filter((p) => p.is_featured === filters.is_featured);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q),
    );
  }
  if (filters.limit) {
    const start = filters.offset ?? 0;
    rows = rows.slice(start, start + filters.limit);
  }

  return rows;
}

function pickName(input: Record<string, unknown>): string | null {
  return toText(input.title) ?? toText(input.name);
}

function pickSummary(input: Record<string, unknown>, description: string): string {
  return toText(input.summary) ?? toText(input.short_description) ?? (description ? description.slice(0, 160) : '');
}

export class TouristPointService {
  private static async validateLocation(locationId: string): Promise<void> {
    const { data, error } = await supabase
      .from('locations')
      .select('id, type')
      .eq('id', locationId)
      .eq('status', 'active')
      .in('type', [LocationType.CITY, LocationType.DISTRICT])
      .maybeSingle();

    if (error || !data) throw new Error(`location_id invalido: ${locationId}`);
  }

  private static async resolveStateAndCity(locationId: string): Promise<{ state: string; city: string }> {
    const fallback = { state: 'ba', city: 'salvador' };

    const { data: location } = await supabase
      .from('locations')
      .select('id, type, name, slug, parent_id')
      .eq('id', locationId)
      .maybeSingle();

    if (!location) return fallback;

    if (location.type === LocationType.CITY) {
      const { data: state } = await supabase
        .from('locations')
        .select('name, slug')
        .eq('id', location.parent_id)
        .maybeSingle();

      return {
        state: toText(state?.slug ?? state?.name)?.toLowerCase() ?? fallback.state,
        city: toText(location.slug ?? location.name)?.toLowerCase() ?? fallback.city,
      };
    }

    if (location.type === LocationType.DISTRICT && location.parent_id) {
      const { data: city } = await supabase
        .from('locations')
        .select('id, name, slug, parent_id')
        .eq('id', location.parent_id)
        .maybeSingle();
      const { data: state } = city?.parent_id
        ? await supabase.from('locations').select('name, slug').eq('id', city.parent_id).maybeSingle()
        : { data: null };

      return {
        state: toText(state?.slug ?? state?.name)?.toLowerCase() ?? fallback.state,
        city: toText(city?.slug ?? city?.name)?.toLowerCase() ?? fallback.city,
      };
    }

    return fallback;
  }

  private static async ensureUniqueSlug(locationId: string, baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let attempt = 0;

    while (true) {
      let query = supabase.from('tourist_points').select('id').eq('location_id', locationId).eq('slug', slug);
      if (excludeId) query = query.neq('id', excludeId);
      const { data } = await query.maybeSingle();
      if (!data) return slug;
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }
  }

  static async list(filters: TouristPointFilters = {}): Promise<TouristPoint[]> {
    try {
      const dbStatus = normalizeDbStatus(filters.status ?? DEFAULT_LEGACY_STATUS);

      let query = supabase
        .from('tourist_points')
        .select(SELECT_LEGACY)
        .eq('status', dbStatus)
        .order('display_order', { ascending: true })
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })
        .order('title', { ascending: true });

      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      } else if (filters.state && filters.city) {
        const resolution = await resolveCityToLocationIds(filters.state, filters.city);
        if (resolution) {
          query = query.in('location_id', [resolution.cityId, ...resolution.districtIds]);
        } else {
          query = query.eq('state', filters.state.toLowerCase()).eq('city', filters.city.toLowerCase());
        }
      } else {
        if (filters.state) query = query.eq('state', filters.state.toLowerCase());
        if (filters.city) query = query.eq('city', filters.city.toLowerCase());
      }

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.is_featured !== undefined) query = query.eq('is_featured', filters.is_featured);
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,name.ilike.%${filters.search}%,summary.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );
      }
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);

      const { data, error } = await query;
      if (error || !data || data.length === 0) return filterMock(filters);
      return data.map(mapDbToLegacy);
    } catch (error) {
      logger.warn('TouristPointService.list fallback', error);
      return filterMock(filters);
    }
  }

  static async getById(id: string): Promise<TouristPoint | null> {
    try {
      const { data, error } = await supabase.from('tourist_points').select(SELECT_LEGACY).eq('id', id).maybeSingle();
      if (error) return SALVADOR_MOCK_POINTS.find((p) => p.id === id) ?? null;
      if (!data) return null;
      return mapDbToLegacy(data);
    } catch {
      return SALVADOR_MOCK_POINTS.find((p) => p.id === id) ?? null;
    }
  }

  static async getBySlug(state: string, city: string, slug: string): Promise<TouristPoint | null> {
    const fallbackMock = SALVADOR_MOCK_POINTS.find(
      (p) => p.state === state.toLowerCase() && p.city === city.toLowerCase() && p.slug === slug,
    );

    try {
      const resolution = await resolveCityToLocationIds(state, city);
      if (resolution) {
        const { data } = await supabase
          .from('tourist_points')
          .select(SELECT_LEGACY)
          .eq('slug', slug)
          .eq('status', DB_STATUS.PUBLISHED)
          .in('location_id', [resolution.cityId, ...resolution.districtIds])
          .maybeSingle();
        if (data) return mapDbToLegacy(data);
      }

      const { data: fallback } = await supabase
        .from('tourist_points')
        .select(SELECT_LEGACY)
        .eq('state', state.toLowerCase())
        .eq('city', city.toLowerCase())
        .eq('slug', slug)
        .eq('status', DB_STATUS.PUBLISHED)
        .maybeSingle();

      if (fallback) return mapDbToLegacy(fallback);
      return fallbackMock ?? null;
    } catch {
      return fallbackMock ?? null;
    }
  }

  static async getByIds(ids: string[]): Promise<TouristPoint[]> {
    if (!ids.length) return [];
    const uuidIds = ids.filter((id) => UUID_RE.test(id));
    const mockRows = SALVADOR_MOCK_POINTS.filter((p) => ids.includes(p.id));
    if (!uuidIds.length) return mockRows;

    try {
      const { data, error } = await supabase.from('tourist_points').select(SELECT_LEGACY).in('id', uuidIds);
      if (error || !data) return mockRows;
      return [...data.map(mapDbToLegacy), ...mockRows];
    } catch {
      return mockRows;
    }
  }

  static async create(input: CreateTouristPointInput | Record<string, unknown>, userId?: string): Promise<TouristPoint> {
    const payload = input as Record<string, unknown>;
    const locationId = toText(payload.location_id);
    if (!locationId) throw new Error('location_id e obrigatorio');

    await this.validateLocation(locationId);

    const name = pickName(payload);
    if (!name) throw new Error('title/name e obrigatorio');

    const description = toText(payload.description) ?? '';
    const summary = pickSummary(payload, description);
    const baseSlug = toText(payload.slug) ?? slugify(name);
    const slug = await this.ensureUniqueSlug(locationId, baseSlug);
    const territory = await this.resolveStateAndCity(locationId);
    const dbStatus = normalizeDbStatus(payload.status ?? (has(payload, 'title') ? DB_STATUS.DRAFT : DEFAULT_LEGACY_STATUS));
    const dbPriceType = normalizeDbPriceType(payload.price_type ?? payload.entry_fee);

    const addressText = toText(payload.address_text) ?? toText(payload.address);
    const openingHours = toText(payload.opening_hours) ?? toText(payload.visiting_hours);
    const officialUrl = toText(payload.official_url) ?? toText(payload.website);
    const accessibilityNotes = toText(payload.accessibility_notes) ?? toText(payload.accessibility_description);

    const insertPayload: Record<string, unknown> = {
      location_id: locationId,
      address_id: toText(payload.address_id),
      slug,
      title: name,
      name,
      summary,
      short_description: summary,
      description,
      category: toText(payload.category) ?? 'outro',
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      state: toText(payload.state)?.toLowerCase() ?? territory.state,
      city: toText(payload.city)?.toLowerCase() ?? territory.city,
      neighborhood: toText(payload.neighborhood),
      address_text: addressText,
      address: addressText,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      photo_url: toText(payload.photo_url),
      gallery_urls: Array.isArray(payload.gallery_urls) ? payload.gallery_urls : [],
      icon_emoji: toText(payload.icon_emoji) ?? '📍',
      opening_hours: openingHours,
      visiting_hours: openingHours,
      entry_fee: toText(payload.entry_fee) ?? toText(payload.price_text),
      price_type: dbPriceType,
      price_text: toText(payload.price_text),
      official_url: officialUrl,
      website: officialUrl,
      phone: toText(payload.phone),
      accessibility: Boolean(payload.accessibility),
      accessibility_level: toText(payload.accessibility_level) ?? 'desconhecido',
      accessibility_description: accessibilityNotes,
      accessibility_notes: accessibilityNotes,
      has_parking: Boolean(payload.has_parking),
      has_restaurant: Boolean(payload.has_restaurant),
      has_guide: Boolean(payload.has_guide),
      is_featured: Boolean(payload.is_featured),
      display_order: Number(payload.display_order ?? 0),
      rating: Number(payload.rating ?? 0),
      total_reviews: Number(payload.total_reviews ?? 0),
      status: dbStatus,
      observations: toText(payload.observations),
      nearby_point_ids: Array.isArray(payload.nearby_point_ids) ? payload.nearby_point_ids : [],
      published_at: dbStatus === DB_STATUS.PUBLISHED ? new Date().toISOString() : null,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    };

    const { data, error } = await supabase
      .from('tourist_points')
      .insert(insertPayload)
      .select(SELECT_LEGACY)
      .single();
    if (error || !data) throw error ?? new Error('Falha ao criar ponto turistico');
    return mapDbToLegacy(data);
  }

  static async update(
    id: string,
    input: UpdateTouristPointInput | Record<string, unknown>,
    userId?: string,
  ): Promise<TouristPoint> {
    const payload = input as Record<string, unknown>;
    const { data: existing, error: existingError } = await supabase
      .from('tourist_points')
      .select('id, location_id, slug, published_at, state, city')
      .eq('id', id)
      .single();
    if (existingError || !existing) throw existingError ?? new Error('Ponto turistico nao encontrado');

    const patch: Record<string, unknown> = { updated_by: userId ?? null };
    let locationId = existing.location_id;

    if (has(payload, 'location_id')) {
      const nextLocationId = toText(payload.location_id);
      if (!nextLocationId) throw new Error('location_id invalido');
      await this.validateLocation(nextLocationId);
      locationId = nextLocationId;
      patch.location_id = nextLocationId;
      const territory = await this.resolveStateAndCity(nextLocationId);
      patch.state = territory.state;
      patch.city = territory.city;
    }

    if (has(payload, 'state')) patch.state = toText(payload.state)?.toLowerCase() ?? existing.state;
    if (has(payload, 'city')) patch.city = toText(payload.city)?.toLowerCase() ?? existing.city;

    const name = pickName(payload);
    if (name) {
      patch.title = name;
      patch.name = name;
    }

    if (has(payload, 'summary') || has(payload, 'short_description')) {
      const summary = toText(payload.summary) ?? toText(payload.short_description);
      patch.summary = summary;
      patch.short_description = summary;
    }

    if (has(payload, 'description')) patch.description = toText(payload.description) ?? '';
    if (has(payload, 'category')) patch.category = toText(payload.category) ?? 'outro';
    if (has(payload, 'tags')) patch.tags = Array.isArray(payload.tags) ? payload.tags : [];
    if (has(payload, 'address_id')) patch.address_id = toText(payload.address_id);

    if (has(payload, 'address_text') || has(payload, 'address')) {
      const addressText = toText(payload.address_text) ?? toText(payload.address);
      patch.address_text = addressText;
      patch.address = addressText;
    }

    if (has(payload, 'latitude')) patch.latitude = payload.latitude ?? null;
    if (has(payload, 'longitude')) patch.longitude = payload.longitude ?? null;
    if (has(payload, 'photo_url')) patch.photo_url = toText(payload.photo_url);
    if (has(payload, 'gallery_urls')) patch.gallery_urls = Array.isArray(payload.gallery_urls) ? payload.gallery_urls : [];
    if (has(payload, 'icon_emoji')) patch.icon_emoji = toText(payload.icon_emoji) ?? '📍';

    if (has(payload, 'opening_hours') || has(payload, 'visiting_hours')) {
      const openingHours = toText(payload.opening_hours) ?? toText(payload.visiting_hours);
      patch.opening_hours = openingHours;
      patch.visiting_hours = openingHours;
    }

    if (has(payload, 'official_url') || has(payload, 'website')) {
      const officialUrl = toText(payload.official_url) ?? toText(payload.website);
      patch.official_url = officialUrl;
      patch.website = officialUrl;
    }

    if (has(payload, 'accessibility_notes') || has(payload, 'accessibility_description')) {
      const notes = toText(payload.accessibility_notes) ?? toText(payload.accessibility_description);
      patch.accessibility_notes = notes;
      patch.accessibility_description = notes;
    }

    if (has(payload, 'entry_fee')) patch.entry_fee = toText(payload.entry_fee);
    if (has(payload, 'price_type')) patch.price_type = normalizeDbPriceType(payload.price_type);
    if (has(payload, 'price_text')) patch.price_text = toText(payload.price_text);
    if (has(payload, 'phone')) patch.phone = toText(payload.phone);
    if (has(payload, 'accessibility')) patch.accessibility = Boolean(payload.accessibility);
    if (has(payload, 'accessibility_level')) patch.accessibility_level = toText(payload.accessibility_level) ?? 'desconhecido';
    if (has(payload, 'has_parking')) patch.has_parking = Boolean(payload.has_parking);
    if (has(payload, 'has_restaurant')) patch.has_restaurant = Boolean(payload.has_restaurant);
    if (has(payload, 'has_guide')) patch.has_guide = Boolean(payload.has_guide);
    if (has(payload, 'is_featured')) patch.is_featured = Boolean(payload.is_featured);
    if (has(payload, 'display_order')) patch.display_order = Number(payload.display_order ?? 0);
    if (has(payload, 'observations')) patch.observations = toText(payload.observations);
    if (has(payload, 'nearby_point_ids')) patch.nearby_point_ids = Array.isArray(payload.nearby_point_ids) ? payload.nearby_point_ids : [];

    if (has(payload, 'status')) {
      const status = normalizeDbStatus(payload.status);
      patch.status = status;
      if (status === DB_STATUS.PUBLISHED && !existing.published_at) patch.published_at = new Date().toISOString();
    }

    let nextSlug = toText(payload.slug);
    if (!nextSlug && name) nextSlug = slugify(name);
    if (nextSlug) patch.slug = await this.ensureUniqueSlug(locationId, nextSlug, id);

    const { data, error } = await supabase.from('tourist_points').update(patch).eq('id', id).select(SELECT_LEGACY).single();
    if (error || !data) throw error ?? new Error('Falha ao atualizar ponto turistico');
    return mapDbToLegacy(data);
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tourist_points').delete().eq('id', id);
    if (error) throw error;
  }

  static async toggleFeatured(id: string, is_featured: boolean): Promise<void> {
    await this.setFeatured(id, is_featured);
  }

  static async setFeatured(id: string, is_featured: boolean, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('tourist_points')
      .update({ is_featured, updated_by: userId ?? null })
      .eq('id', id);
    if (error) throw error;
  }

  static async toggleStatus(id: string, status: string): Promise<void> {
    await this.setStatus(id, status);
  }

  static async setStatus(id: string, status: string, userId?: string): Promise<void> {
    const dbStatus = normalizeDbStatus(status);
    const patch: Record<string, unknown> = { status: dbStatus, updated_by: userId ?? null };
    if (dbStatus === DB_STATUS.PUBLISHED) patch.published_at = new Date().toISOString();
    const { error } = await supabase.from('tourist_points').update(patch).eq('id', id);
    if (error) throw error;
  }

  static async publish(id: string, userId?: string): Promise<void> {
    await this.setStatus(id, DB_STATUS.PUBLISHED, userId);
  }

  static async archive(id: string, userId?: string): Promise<void> {
    await this.setStatus(id, DB_STATUS.ARCHIVED, userId);
  }

  static async countByCity(state: string, city: string): Promise<number> {
    try {
      const resolution = await resolveCityToLocationIds(state, city);
      if (!resolution) {
        const { count, error } = await supabase
          .from('tourist_points')
          .select('*', { count: 'exact', head: true })
          .eq('state', state.toLowerCase())
          .eq('city', city.toLowerCase())
          .eq('status', DB_STATUS.PUBLISHED);
        if (error) return 0;
        return count ?? 0;
      }

      if (!resolution.districtIds.length) return 0;
      const { count, error } = await supabase
        .from('tourist_points')
        .select('*', { count: 'exact', head: true })
        .in('location_id', resolution.districtIds)
        .eq('status', DB_STATUS.PUBLISHED);
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  }

  static async getCategoriesByCity(state: string, city: string): Promise<string[]> {
    try {
      const resolution = await resolveCityToLocationIds(state, city);
      if (!resolution) {
        const { data, error } = await supabase
          .from('tourist_points')
          .select('category')
          .eq('state', state.toLowerCase())
          .eq('city', city.toLowerCase())
          .eq('status', DB_STATUS.PUBLISHED);
        if (error) return [];
        return [...new Set((data ?? []).map((d: any) => d.category).filter(Boolean))];
      }

      if (!resolution.districtIds.length) return [];
      const { data, error } = await supabase
        .from('tourist_points')
        .select('category')
        .in('location_id', resolution.districtIds)
        .eq('status', DB_STATUS.PUBLISHED);
      if (error) return [];
      return [...new Set((data ?? []).map((d: any) => d.category).filter(Boolean))];
    } catch {
      return [];
    }
  }

  static async getCommunityPhotos(
    locationId: string | null,
    city: string,
    neighborhood: string | null,
    state?: string,
  ): Promise<
    Array<{
      id: string;
      image_url: string;
      content: string;
      author_name: string;
      author_avatar: string | null;
      created_at: string;
    }>
  > {
    const mock = [
      {
        id: 'mock-photo-1',
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75',
        content: 'Tarde perfeita na praia!',
        author_name: 'Ana Lima',
        author_avatar: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-photo-2',
        image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=75',
        content: 'Por do sol incrivel aqui na Barra',
        author_name: 'Joao Silva',
        author_avatar: null,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-photo-3',
        image_url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&q=75',
        content: 'Agua cristalina hoje!',
        author_name: 'Maria Santos',
        author_avatar: null,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    try {
      const { postService } = await import('@/core/posts/services');

      // Resolver location IDs para a query
      let resolvedLocationId: string | undefined;
      let resolvedLocationIds: string[] | undefined;

      if (locationId) {
        resolvedLocationId = locationId;
      } else if (neighborhood && city && state) {
        const neighborhoodId = await resolveNeighborhoodInCity(state, city, neighborhood);
        if (neighborhoodId) resolvedLocationId = neighborhoodId;
      } else if (city && state) {
        const resolution = await resolveCityToLocationIds(state, city);
        if (resolution?.districtIds?.length) resolvedLocationIds = resolution.districtIds;
      }

      const results = await postService.getPostsWithImages({
        locationId: resolvedLocationId,
        locationIds: resolvedLocationIds,
        city: !resolvedLocationId && !resolvedLocationIds ? city : undefined,
        neighborhood: !resolvedLocationId && !resolvedLocationIds ? (neighborhood ?? undefined) : undefined,
        limit: PAGINATION.DEFAULT_PAGE_SIZE,
      });

      if (!results.length) return mock;
      return results;
    } catch (error) {
      logger.error('TouristPointService.getCommunityPhotos', error);
      return mock;
    }
  }
}

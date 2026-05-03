import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { createHash, timingSafeEqual } from 'crypto';
import { createServiceSupabaseClient } from '../../src/core/supabase/services/adminClient';
import { profileService } from '../../src/core/profiles/services/ProfileService';

type ReqBody = {
  mode?: 'dry-run' | 'apply';
  limit?: number;
  sample?: boolean;
  ownerUserId?: string;
};

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  setHeader: (key: string, value: string) => ResponseLike;
  end: (payload?: string) => void;
};

type NormalizedPlace = {
  google_place_id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  primary_type: string | null;
  types: string[];
  maps_url: string | null;
  business_status: string | null;
  city: 'Salvador';
  source: 'google_places_api';
  imported_at: string;
};

type PreviewFile = {
  generated_at: string;
  query: string;
  total_collected: number;
  items: NormalizedPlace[];
};

type PlanItem = {
  google_place_id: string;
  name: string | null;
  slug: string;
  action: 'create' | 'skip_existing_google_id';
  reason: string;
};

const DEFAULT_INPUT = resolve(process.cwd(), 'tests', 'fixtures', 'salvador', 'google-places-preview.json');
const SALVADOR_GEO_PATH = '/br/ba/salvador';
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_LIMIT = 100;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const APPLY_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const APPLY_RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function json(res: ResponseLike, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function getHeader(req: RequestLike, key: string): string | undefined {
  const value = req.headers[key.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function extractProvidedToken(req: RequestLike): string | null {
  const explicitHeader = getHeader(req, 'x-import-admin-token');
  if (explicitHeader?.trim()) return explicitHeader.trim();

  const authHeader = getHeader(req, 'authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function parseBody(rawBody: unknown): ReqBody {
  if (typeof rawBody === 'string') {
    return JSON.parse(rawBody || '{}') as ReqBody;
  }
  if (rawBody && typeof rawBody === 'object') {
    return rawBody as ReqBody;
  }
  return {};
}

function getClientIp(req: RequestLike): string {
  const forwarded = getHeader(req, 'x-forwarded-for');
  const firstForwarded = forwarded?.split(',')[0]?.trim();
  if (firstForwarded) return firstForwarded;
  return getHeader(req, 'x-real-ip') ?? 'unknown';
}

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return { allowed: true };
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'empresa';
}

function categoryFromPrimaryType(primaryType: string | null): string {
  if (!primaryType) return 'Servicos';
  const normalized = primaryType.replace(/_/g, ' ').trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function buildSampleData(): PreviewFile {
  const now = new Date().toISOString();
  return {
    generated_at: now,
    query: 'sample data',
    total_collected: 2,
    items: [
      {
        google_place_id: 'api_sample_place_1',
        name: 'Padaria da Barra',
        address: 'Av. Sete de Setembro, Barra, Salvador - BA',
        phone: '(71) 98888-0001',
        latitude: -13.0119,
        longitude: -38.5321,
        primary_type: 'bakery',
        types: ['bakery', 'food'],
        maps_url: 'https://maps.google.com',
        business_status: 'OPERATIONAL',
        city: 'Salvador',
        source: 'google_places_api',
        imported_at: now,
      },
      {
        google_place_id: 'api_sample_place_2',
        name: 'Mercadinho da Pituba',
        address: 'Av. Manoel Dias da Silva, Pituba, Salvador - BA',
        phone: '(71) 98888-0002',
        latitude: -12.9904,
        longitude: -38.4637,
        primary_type: 'grocery_store',
        types: ['grocery_store', 'store'],
        maps_url: 'https://maps.google.com',
        business_status: 'OPERATIONAL',
        city: 'Salvador',
        source: 'google_places_api',
        imported_at: now,
      },
    ],
  };
}

async function readPreview(sample: boolean): Promise<PreviewFile> {
  if (sample) return buildSampleData();
  const raw = await readFile(DEFAULT_INPUT, 'utf-8');
  return JSON.parse(raw) as PreviewFile;
}

async function resolveLocationId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const byPath = await supabase
    .from('locations')
    .select('id')
    .eq('geographic_path', SALVADOR_GEO_PATH)
    .limit(1)
    .maybeSingle();

  if (!byPath.error && byPath.data?.id) {
    return byPath.data.id as string;
  }

  const fallback = await supabase
    .from('locations')
    .select('id')
    .ilike('full_name', '%Salvador%')
    .eq('type', 'city')
    .limit(1)
    .maybeSingle();

  if (fallback.error) {
    throw new Error(`Erro ao resolver Salvador: ${fallback.error.message}`);
  }

  return (fallback.data?.id as string | undefined) ?? null;
}

async function getExistingByGooglePlaceId(
  supabase: ReturnType<typeof createClient>,
  googlePlaceId: string,
): Promise<{ id: string } | null> {
  const found = await supabase
    .from('business_data')
    .select('id')
    .contains('metadata', { google_place_id: googlePlaceId })
    .limit(1)
    .maybeSingle();

  if (found.error) {
    throw new Error(`Erro ao consultar duplicidade: ${found.error.message}`);
  }

  return (found.data as { id: string } | null) ?? null;
}

async function slugExists(supabase: ReturnType<typeof createClient>, slug: string): Promise<boolean> {
  const found = await supabase
    .from('business_data')
    .select('id')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();

  if (found.error) {
    throw new Error(`Erro ao consultar slug ${slug}: ${found.error.message}`);
  }
  return Boolean(found.data);
}

async function profileHandleExists(
  _supabase: ReturnType<typeof createClient>,
  handle: string,
): Promise<boolean> {
  const available = await profileService.isUsernameAvailable(handle);
  return !available;
}

async function createUniqueSlug(
  supabase: ReturnType<typeof createClient>,
  name: string,
  inRun: Set<string>,
): Promise<string> {
  const base = slugify(name);
  let attempt = 0;
  while (attempt < 200) {
    const candidate = attempt === 0 ? base : `${base}-${attempt}`;
    if (inRun.has(candidate)) {
      attempt += 1;
      continue;
    }
    const exists = await slugExists(supabase, candidate);
    if (!exists) {
      inRun.add(candidate);
      return candidate;
    }
    attempt += 1;
  }
  throw new Error(`Nao foi possivel gerar slug para ${name}`);
}

async function createUniqueHandle(
  supabase: ReturnType<typeof createClient>,
  slug: string,
): Promise<string> {
  let attempt = 0;
  while (attempt < 200) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const exists = await profileHandleExists(supabase, candidate);
    if (!exists) return candidate;
    attempt += 1;
  }
  throw new Error(`Nao foi possivel gerar handle para ${slug}`);
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  try {
    if (req.method !== 'POST') {
      json(res, 405, { error: 'Method not allowed' });
      return;
    }

    const adminToken = process.env.IMPORT_ADMIN_TOKEN;
    const providedToken = extractProvidedToken(req);
    if (!adminToken || !providedToken || !constantTimeEquals(providedToken, adminToken)) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    let body: ReqBody;
    try {
      body = parseBody(req.body);
    } catch {
      json(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    const requestIp = getClientIp(req);
    const globalRateLimit = checkRateLimit(
      `google-places-import:global:${requestIp}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!globalRateLimit.allowed) {
      res.setHeader('Retry-After', String(globalRateLimit.retryAfterSeconds ?? 60));
      json(res, 429, { error: 'Too many requests' });
      return;
    }

    const mode = body.mode === 'apply' ? 'apply' : 'dry-run';
    const limit = Number.isFinite(body.limit) ? Math.min(MAX_LIMIT, Math.max(1, Number(body.limit))) : 20;
    const sample = Boolean(body.sample);
    const ownerUserId = body.ownerUserId?.trim();

    if (mode === 'apply') {
      const applyRateLimit = checkRateLimit(
        `google-places-import:apply:${requestIp}`,
        APPLY_RATE_LIMIT_MAX,
        APPLY_RATE_LIMIT_WINDOW_MS,
      );
      if (!applyRateLimit.allowed) {
        res.setHeader('Retry-After', String(applyRateLimit.retryAfterSeconds ?? 120));
        json(res, 429, { error: 'Too many apply requests' });
        return;
      }
    }

    if (mode === 'apply' && !ownerUserId) {
      json(res, 400, { error: 'ownerUserId is required for apply mode' });
      return;
    }
    if (ownerUserId && !UUID_V4_REGEX.test(ownerUserId)) {
      json(res, 400, { error: 'ownerUserId must be a valid UUID' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey || !adminToken) {
      json(res, 500, { error: 'Server configuration error' });
      return;
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (mode === 'apply' && ownerUserId) {
      const ownerCheck = await supabase.auth.admin.getUserById(ownerUserId);
      if (ownerCheck.error || !ownerCheck.data.user) {
        json(res, 400, { error: `ownerUserId invalid: ${ownerCheck.error?.message ?? 'not found'}` });
        return;
      }
    }

    const preview = await readPreview(sample);
    const inputItems = preview.items.slice(0, limit);
    const locationId = await resolveLocationId(supabase);

    const inRunSlugs = new Set<string>();
    const plans: PlanItem[] = [];
    const created: Array<{ profile_id: string; business_id: string; slug: string; name: string | null }> = [];

    for (const item of inputItems) {
      const name = item.name || 'Empresa sem nome';
      const existing = await getExistingByGooglePlaceId(supabase, item.google_place_id);

      if (existing) {
        plans.push({
          google_place_id: item.google_place_id,
          name: item.name,
          slug: slugify(name),
          action: 'skip_existing_google_id',
          reason: `Ja existe business_data.id=${existing.id}`,
        });
        continue;
      }

      const slug = await createUniqueSlug(supabase, name, inRunSlugs);
      plans.push({
        google_place_id: item.google_place_id,
        name: item.name,
        slug,
        action: 'create',
        reason: mode === 'dry-run' ? 'Pronto para criar' : 'Criado',
      });

      if (mode === 'dry-run' || !ownerUserId) {
        continue;
      }

      const handle = await createUniqueHandle(supabase, slug);
      const profile = await profileService.createProfile({
        user_id: ownerUserId,
        profile_type: 'business',
        name,
        display_name: name,
        username: handle,
        city: 'Salvador',
        state: 'BA',
        phone: item.phone || undefined,
        location: item.address || undefined,
        is_active: true,
        is_public: true,
        verified: false,
      });

      const business = await supabase
        .from('business_data')
        .insert({
          profile_id: profile.id,
          business_name: name,
          business_city: 'Salvador',
          business_state: 'BA',
          business_address: item.address,
          category: categoryFromPrimaryType(item.primary_type),
          slug,
          status: 'active',
          business_role: 'standalone',
          location_id: locationId,
          is_verified: false,
          is_premium: false,
          metadata: {
            google_place_id: item.google_place_id,
            google_types: item.types,
            google_primary_type: item.primary_type,
            google_maps_url: item.maps_url,
            google_business_status: item.business_status,
            phone: item.phone,
            latitude: item.latitude,
            longitude: item.longitude,
            source: 'google_places_api_poc',
            city: 'Salvador',
            claim_status: 'unclaimed',
            imported_at: new Date().toISOString(),
          },
        })
        .select('id')
        .single();

      if (business.error || !business.data?.id) {
        throw new Error(`Erro ao criar business_data: ${business.error?.message}`);
      }

      created.push({
        profile_id: profile.id as string,
        business_id: business.data.id as string,
        slug,
        name: item.name,
      });
    }

    json(res, 200, {
      ok: true,
      mode,
      sample,
      input_count: inputItems.length,
      plan_create_count: plans.filter((p) => p.action === 'create').length,
      plan_skip_count: plans.filter((p) => p.action !== 'create').length,
      created_count: created.length,
      location_id_resolved: locationId,
      plans,
      created,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isProd = process.env.NODE_ENV === 'production';
    json(res, 500, {
      error: isProd ? 'Internal server error' : message,
    });
  }
}



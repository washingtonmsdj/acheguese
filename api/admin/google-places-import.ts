import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

type ReqBody = {
  mode?: 'dry-run' | 'apply';
  limit?: number;
  sample?: boolean;
  ownerUserId?: string;
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

function json(res: any, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
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
  supabase: ReturnType<typeof createClient>,
  handle: string,
): Promise<boolean> {
  const found = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', handle)
    .limit(1)
    .maybeSingle();

  if (found.error) {
    throw new Error(`Erro ao consultar handle ${handle}: ${found.error.message}`);
  }
  return Boolean(found.data);
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

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      json(res, 405, { error: 'Method not allowed' });
      return;
    }

    const adminToken = process.env.IMPORT_ADMIN_TOKEN;
    const providedToken = req.headers['x-import-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
    if (!adminToken || providedToken !== adminToken) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    const body = (req.body || {}) as ReqBody;
    const mode = body.mode === 'apply' ? 'apply' : 'dry-run';
    const limit = Number.isFinite(body.limit) ? Math.max(1, Number(body.limit)) : 20;
    const sample = Boolean(body.sample);
    const ownerUserId = body.ownerUserId;

    if (mode === 'apply' && !ownerUserId) {
      json(res, 400, { error: 'ownerUserId is required for apply mode' });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      json(res, 500, { error: 'Missing VITE_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' });
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
      const profile = await supabase
        .from('profiles')
        .insert({
          user_id: ownerUserId,
          profile_type: 'business',
          name,
          display_name: name,
          handle,
          username: handle,
          city: 'Salvador',
          state: 'BA',
          phone: item.phone,
          location: item.address,
          is_active: true,
          is_public: true,
          verified: false,
        })
        .select('id')
        .single();

      if (profile.error || !profile.data?.id) {
        throw new Error(`Erro ao criar profile: ${profile.error?.message}`);
      }

      const business = await supabase
        .from('business_data')
        .insert({
          profile_id: profile.data.id,
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
        profile_id: profile.data.id as string,
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
    json(res, 500, { error: message });
  }
}

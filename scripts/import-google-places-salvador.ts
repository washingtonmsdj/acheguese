import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

type ImportMode = 'dry-run' | 'apply';

type ExistingBusiness = {
  id: string;
  profile_id: string;
  business_name: string;
  slug: string | null;
  metadata: Record<string, unknown> | null;
};

type PlanItem = {
  google_place_id: string;
  name: string | null;
  slug: string;
  action: 'create' | 'skip_existing_google_id' | 'skip_existing_slug';
  reason: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env') });
dotenv.config({ path: join(rootDir, '.env.local'), override: false });

const DEFAULT_INPUT = join(rootDir, 'tests', 'fixtures', 'salvador', 'google-places-preview.json');
const DEFAULT_REPORT = join(rootDir, 'tests', 'fixtures', 'salvador', 'google-places-import-report.json');
const SALVADOR_GEO_PATH = '/br/ba/salvador';

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found?.slice(prefix.length);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
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
  if (!primaryType) return 'Serviços';

  const normalized = primaryType
    .replace('food_', '')
    .replace('point_of_interest', 'servicos')
    .replace(/_/g, ' ')
    .trim();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function parseLimit(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '50', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 50;
  return parsed;
}

function buildSampleData(): PreviewFile {
  const now = new Date().toISOString();
  return {
    generated_at: now,
    query: 'sample data',
    total_collected: 3,
    items: [
      {
        google_place_id: 'sample_place_1',
        name: 'Padaria do Farol',
        address: 'Av. Sete de Setembro, Barra, Salvador - BA',
        phone: '(71) 99999-0001',
        latitude: -13.012,
        longitude: -38.532,
        primary_type: 'bakery',
        types: ['bakery', 'food'],
        maps_url: 'https://maps.google.com',
        business_status: 'OPERATIONAL',
        city: 'Salvador',
        source: 'google_places_api',
        imported_at: now,
      },
      {
        google_place_id: 'sample_place_2',
        name: 'Mercadinho Rio Vermelho',
        address: 'Rua da Paciência, Rio Vermelho, Salvador - BA',
        phone: '(71) 99999-0002',
        latitude: -13.01,
        longitude: -38.49,
        primary_type: 'grocery_store',
        types: ['grocery_store', 'store'],
        maps_url: 'https://maps.google.com',
        business_status: 'OPERATIONAL',
        city: 'Salvador',
        source: 'google_places_api',
        imported_at: now,
      },
      {
        google_place_id: 'sample_place_3',
        name: 'Lava Jato Pituba',
        address: 'Av. Manoel Dias da Silva, Pituba, Salvador - BA',
        phone: '(71) 99999-0003',
        latitude: -12.99,
        longitude: -38.46,
        primary_type: 'car_wash',
        types: ['car_wash'],
        maps_url: 'https://maps.google.com',
        business_status: 'OPERATIONAL',
        city: 'Salvador',
        source: 'google_places_api',
        imported_at: now,
      },
    ],
  };
}

async function readInput(pathValue: string, useSample: boolean): Promise<PreviewFile> {
  if (useSample) return buildSampleData();

  const raw = await readFile(pathValue, 'utf-8');
  const parsed = JSON.parse(raw) as PreviewFile;

  if (!Array.isArray(parsed.items)) {
    throw new Error('Arquivo de preview inválido: campo "items" ausente.');
  }

  return parsed;
}

function makeSupabaseClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('VITE_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configuradas.');
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function resolveLocationId(supabase: SupabaseClient): Promise<string | null> {
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
    throw new Error(`Erro ao resolver location de Salvador: ${fallback.error.message}`);
  }

  return (fallback.data?.id as string | undefined) ?? null;
}

async function getExistingByGooglePlaceId(
  supabase: SupabaseClient,
  googlePlaceId: string,
): Promise<ExistingBusiness | null> {
  const result = await supabase
    .from('business_data')
    .select('id, profile_id, business_name, slug, metadata')
    .contains('metadata', { google_place_id: googlePlaceId })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Erro ao consultar business_data por google_place_id: ${result.error.message}`);
  }

  return (result.data as ExistingBusiness | null) ?? null;
}

async function slugExists(supabase: SupabaseClient, slug: string): Promise<boolean> {
  const result = await supabase
    .from('business_data')
    .select('id')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Erro ao validar slug "${slug}": ${result.error.message}`);
  }

  return Boolean(result.data);
}

async function profileHandleExists(supabase: SupabaseClient, handle: string): Promise<boolean> {
  const result = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', handle)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Erro ao validar handle "${handle}": ${result.error.message}`);
  }

  return Boolean(result.data);
}

async function createUniqueSlug(
  supabase: SupabaseClient | null,
  baseName: string,
  usedInRun: Set<string>,
): Promise<string> {
  const base = slugify(baseName);
  let attempt = 0;

  while (attempt < 200) {
    const candidate = attempt === 0 ? base : `${base}-${attempt}`;
    if (usedInRun.has(candidate)) {
      attempt += 1;
      continue;
    }

    if (!supabase) {
      usedInRun.add(candidate);
      return candidate;
    }

    const exists = await slugExists(supabase, candidate);
    if (!exists) {
      usedInRun.add(candidate);
      return candidate;
    }

    attempt += 1;
  }

  throw new Error(`Não foi possível gerar slug único para "${baseName}".`);
}

async function createUniqueHandle(
  supabase: SupabaseClient,
  baseValue: string,
): Promise<string> {
  const base = slugify(baseValue);
  let attempt = 0;

  while (attempt < 200) {
    const candidate = attempt === 0 ? base : `${base}-${attempt}`;
    const exists = await profileHandleExists(supabase, candidate);
    if (!exists) return candidate;
    attempt += 1;
  }

  throw new Error(`Não foi possível gerar handle único para "${baseValue}".`);
}

async function validateOwnerUser(supabase: SupabaseClient, ownerUserId: string): Promise<void> {
  const userCheck = await supabase.auth.admin.getUserById(ownerUserId);
  if (userCheck.error || !userCheck.data.user) {
    throw new Error(
      `owner-user-id inválido (${ownerUserId}). Erro: ${userCheck.error?.message ?? 'usuário não encontrado'}`,
    );
  }
}

async function writeReport(reportPath: string, payload: unknown): Promise<void> {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(payload, null, 2), 'utf-8');
}

async function run(): Promise<void> {
  const mode = (getArg('mode') ?? 'dry-run') as ImportMode;
  const inputPath = resolve(getArg('input') ?? DEFAULT_INPUT);
  const reportPath = resolve(getArg('report') ?? DEFAULT_REPORT);
  const useSample = hasFlag('sample');
  const offline = hasFlag('offline');
  const limit = parseLimit(getArg('limit'));
  const ownerUserId = getArg('owner-user-id');

  if (mode !== 'dry-run' && mode !== 'apply') {
    throw new Error('Modo inválido. Use --mode=dry-run ou --mode=apply');
  }

  if (mode === 'apply' && !ownerUserId) {
    throw new Error('Para apply, informe --owner-user-id=<uuid>');
  }

  const input = await readInput(inputPath, useSample);
  const selected = input.items.slice(0, limit);

  let supabase: SupabaseClient | null = null;
  const useDatabase = !offline;
  if (useDatabase) {
    supabase = makeSupabaseClient();
  }

  if (mode === 'apply' && supabase && ownerUserId) {
    await validateOwnerUser(supabase, ownerUserId);
  }

  const usedSlugs = new Set<string>();
  const plans: PlanItem[] = [];
  const created: Array<{ profile_id: string; business_id: string; slug: string; name: string | null }> = [];
  const skipped: PlanItem[] = [];

  const locationId = supabase ? await resolveLocationId(supabase) : null;

  for (const item of selected) {
    const placeName = item.name || 'Empresa sem nome';
    const slug = await createUniqueSlug(supabase, placeName, usedSlugs);

    if (supabase) {
      const existingByGoogleId = await getExistingByGooglePlaceId(supabase, item.google_place_id);
      if (existingByGoogleId) {
        const plan: PlanItem = {
          google_place_id: item.google_place_id,
          name: item.name,
          slug,
          action: 'skip_existing_google_id',
          reason: `Já existe business_data.id=${existingByGoogleId.id}`,
        };
        plans.push(plan);
        skipped.push(plan);
        continue;
      }
    }

    const plan: PlanItem = {
      google_place_id: item.google_place_id,
      name: item.name,
      slug,
      action: 'create',
      reason: mode === 'dry-run' ? 'Pronto para criar' : 'Criado',
    };
    plans.push(plan);

    if (mode === 'dry-run' || !supabase || !ownerUserId) {
      continue;
    }

    const handle = await createUniqueHandle(supabase, slug);
    const profileInsert = await supabase
      .from('profiles')
      .insert({
        user_id: ownerUserId,
        profile_type: 'business',
        name: placeName,
        display_name: placeName,
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

    if (profileInsert.error || !profileInsert.data?.id) {
      throw new Error(`Erro ao criar profile para ${placeName}: ${profileInsert.error?.message}`);
    }

    const profileId = profileInsert.data.id as string;

    const businessInsert = await supabase
      .from('business_data')
      .insert({
        profile_id: profileId,
        business_name: placeName,
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

    if (businessInsert.error || !businessInsert.data?.id) {
      throw new Error(`Erro ao criar business_data para ${placeName}: ${businessInsert.error?.message}`);
    }

    created.push({
      profile_id: profileId,
      business_id: businessInsert.data.id as string,
      slug,
      name: item.name,
    });
  }

  const report = {
    mode,
    input: useSample ? 'sample' : inputPath,
    report_path: reportPath,
    offline,
    limit,
    total_input: selected.length,
    total_create_planned: plans.filter((p) => p.action === 'create').length,
    total_skipped: skipped.length,
    created_count: created.length,
    location_id_resolved: locationId,
    plans,
    created,
    generated_at: new Date().toISOString(),
  };

  await writeReport(reportPath, report);

  console.log(`Modo: ${mode}`);
  console.log(`Entrada: ${useSample ? 'sample' : inputPath}`);
  console.log(`Itens analisados: ${selected.length}`);
  console.log(`Criar planejados: ${report.total_create_planned}`);
  console.log(`Ignorados: ${report.total_skipped}`);
  console.log(`Criados: ${created.length}`);
  console.log(`Relatório: ${reportPath}`);
}

run().catch((error) => {
  console.error('Falha na importação POC:', error);
  process.exit(1);
});

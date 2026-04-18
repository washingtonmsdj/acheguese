import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  types?: string[];
  googleMapsUri?: string;
  businessStatus?: string;
};

type PlacesResponse = {
  places?: GooglePlace[];
  nextPageToken?: string;
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local'), override: false });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const DEFAULT_QUERY = 'restaurantes em Salvador BA';
const DEFAULT_LIMIT = 20;
const OUTPUT_PATH = join(__dirname, '..', 'tests', 'fixtures', 'salvador', 'google-places-preview.json');

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

async function searchPlaces(query: string, pageToken?: string): Promise<PlacesResponse> {
  const body: Record<string, unknown> = {
    textQuery: query,
    regionCode: 'BR',
    languageCode: 'pt-BR',
    maxResultCount: 20,
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY ?? '',
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.location,places.primaryType,places.types,places.googleMapsUri,places.businessStatus,nextPageToken',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Places API error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PlacesResponse;
}

function normalizePlace(place: GooglePlace): NormalizedPlace {
  return {
    google_place_id: place.id,
    name: place.displayName?.text ?? null,
    address: place.formattedAddress ?? null,
    phone: place.nationalPhoneNumber ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    primary_type: place.primaryType ?? null,
    types: place.types ?? [],
    maps_url: place.googleMapsUri ?? null,
    business_status: place.businessStatus ?? null,
    city: 'Salvador',
    source: 'google_places_api',
    imported_at: new Date().toISOString(),
  };
}

async function main() {
  if (!API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY ou VITE_GOOGLE_MAPS_API_KEY não encontrada no .env');
    process.exit(1);
  }

  const query = parseArg('query') ?? DEFAULT_QUERY;
  const limit = Number.parseInt(parseArg('limit') ?? `${DEFAULT_LIMIT}`, 10);
  const pages = Number.parseInt(parseArg('pages') ?? '1', 10);

  const collected: GooglePlace[] = [];
  let nextPageToken: string | undefined;

  for (let currentPage = 1; currentPage <= pages; currentPage++) {
    const result = await searchPlaces(query, nextPageToken);
    const places = result.places ?? [];
    collected.push(...places);

    console.log(`[page ${currentPage}] recebidos: ${places.length}`);

    if (!result.nextPageToken) {
      break;
    }

    nextPageToken = result.nextPageToken;
  }

  const uniqueById = new Map<string, GooglePlace>();
  for (const place of collected) {
    uniqueById.set(place.id, place);
  }

  const normalized = Array.from(uniqueById.values())
    .slice(0, Math.max(1, limit))
    .map(normalizePlace);

  await mkdir(join(__dirname, '..', 'tests', 'fixtures', 'salvador'), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        query,
        total_collected: normalized.length,
        items: normalized,
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(`Arquivo gerado: ${OUTPUT_PATH}`);
  console.log(`Empresas salvas: ${normalized.length}`);
}

main().catch((error) => {
  console.error('Falha no POC:', error);
  process.exit(1);
});

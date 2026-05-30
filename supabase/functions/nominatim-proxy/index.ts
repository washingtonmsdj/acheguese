/**
 * EDGE FUNCTION: nominatim-proxy
 * Browser-safe proxy for OpenStreetMap Nominatim with database caching.
 *
 * Features:
 * - Database cache (30 days TTL)
 * - Rate limiting (60 req/min)
 * - Input sanitization
 * - Security headers
 *
 * Supported routes:
 * GET /functions/v1/nominatim-proxy?q=<query>
 * GET /functions/v1/nominatim-proxy?postalcode=<cep>&country=br
 * GET /functions/v1/nominatim-proxy?reverse=1&lat=<lat>&lon=<lon>&zoom=<zoom>
 * 
 * @version 2.0.0 - Added database caching
 */

import {
  getAllSecurityHeaders,
  getRequiredEnv,
  jsonResponse,
  methodNotAllowedResponse,
  rateLimitMiddleware,
  sanitizeString,
} from '../_shared/security.ts';
import { withCache, CACHE_TTL, generateCacheKey } from '../_shared/cache.ts';
import {
  isCommaSeparatedCountryCodes,
  isCountryCode,
  trimTrailingSlashes,
} from '../_shared/url_validation.ts';

const ALLOWED_METHODS = 'GET, OPTIONS';
const NOMINATIM_BASE = getNominatimBaseUrl();
const NOMINATIM_USER_AGENT = getRequiredEnv('NOMINATIM_USER_AGENT');
const NOMINATIM_ACCEPT_LANGUAGE = getRequiredEnv('NOMINATIM_ACCEPT_LANGUAGE');

function getNominatimBaseUrl(): string {
  const configuredUrl = getRequiredEnv('NOMINATIM_BASE_URL');
  const parsedUrl = new URL(configuredUrl);

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('NOMINATIM_BASE_URL must use https');
  }

  return trimTrailingSlashes(parsedUrl.toString());
}

function readBooleanParam(value: string | null, fallback: string): string {
  const resolved = value ?? fallback;
  return resolved === '1' ? '1' : '0';
}

function readCountryParam(value: string | null, fallback: string): string {
  const resolved = sanitizeString(value ?? fallback, 2).toLowerCase();
  if (!isCountryCode(resolved)) {
    throw new Error('Invalid country parameter');
  }

  return resolved;
}

function readCountryCodesParam(value: string | null, fallback: string): string {
  const resolved = sanitizeString(value ?? fallback, 32).toLowerCase();
  if (!isCommaSeparatedCountryCodes(resolved)) {
    throw new Error('Invalid countrycodes parameter');
  }

  return resolved;
}

function readLimitParam(value: string | null, fallback: string): string {
  const parsed = Number.parseInt(value ?? fallback, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    throw new Error('Invalid limit parameter');
  }

  return String(parsed);
}

function readFormatParam(value: string | null, fallback: string): string {
  const resolved = sanitizeString(value ?? fallback, 16).toLowerCase();
  if (resolved !== 'json' && resolved !== 'jsonv2') {
    throw new Error('Invalid format parameter');
  }

  return resolved;
}

function readZoomParam(value: string | null): string | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 18) {
    throw new Error('Invalid zoom parameter');
  }

  return String(parsed);
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, 
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse(ALLOWED_METHODS, req);
  }

  // Rate limiting (mais permissivo para geocoding)
  const rateLimitResponse = await rateLimitMiddleware(req, 60, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  let q: string | null;
  let postalcode: string | null;
  let country: string;
  let reverse: boolean;
  let lat: string | null;
  let lon: string | null;
  let zoom: string | null;
  let nominatimUrl: string;

  try {
    const url = new URL(req.url);
    q = url.searchParams.get('q');
    postalcode = url.searchParams.get('postalcode');
    const defaultCountry = getRequiredEnv('NOMINATIM_DEFAULT_COUNTRY');
    const defaultCountryCodes = getRequiredEnv('NOMINATIM_DEFAULT_COUNTRY_CODES');
    country = readCountryParam(url.searchParams.get('country'), defaultCountry);
    reverse = url.searchParams.get('reverse') === '1';
    lat = url.searchParams.get('lat');
    lon = url.searchParams.get('lon');
    zoom = readZoomParam(url.searchParams.get('zoom'));
    const format = readFormatParam(url.searchParams.get('format'), getRequiredEnv('NOMINATIM_DEFAULT_FORMAT'));
    const addressdetails = readBooleanParam(
      url.searchParams.get('addressdetails'),
      getRequiredEnv('NOMINATIM_DEFAULT_ADDRESSDETAILS'),
    );
    const limit = readLimitParam(url.searchParams.get('limit'), getRequiredEnv('NOMINATIM_DEFAULT_LIMIT'));
    const countryCodes = readCountryCodesParam(url.searchParams.get('countrycodes'), defaultCountryCodes);

    if (reverse) {
      if (!lat || !lon) {
        return jsonResponse({ error: 'Parametros obrigatorios para reverse: lat e lon' }, 400, ALLOWED_METHODS, req);
      }

      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
        return jsonResponse({ error: 'Coordenadas invalidas' }, 400, ALLOWED_METHODS, req);
      }

      nominatimUrl =
        `${NOMINATIM_BASE}/reverse` +
        `?lat=${encodeURIComponent(lat)}` +
        `&lon=${encodeURIComponent(lon)}` +
        `&format=${encodeURIComponent(format)}` +
        `&addressdetails=${encodeURIComponent(addressdetails)}`;
      if (zoom) {
        nominatimUrl += `&zoom=${encodeURIComponent(zoom)}`;
      }
    } else if (q) {
      const sanitizedQuery = sanitizeString(q, 200);
      if (!sanitizedQuery) {
        return jsonResponse({ error: 'Query invalida' }, 400, ALLOWED_METHODS, req);
      }

      nominatimUrl =
        `${NOMINATIM_BASE}/search?q=${encodeURIComponent(sanitizedQuery)}` +
        `&format=${encodeURIComponent(format)}` +
        `&limit=${encodeURIComponent(limit)}` +
        `&countrycodes=${encodeURIComponent(countryCodes)}` +
        `&addressdetails=${encodeURIComponent(addressdetails)}`;
    } else if (postalcode) {
      const sanitizedPostalcode = sanitizeString(postalcode, 20);
      if (!sanitizedPostalcode) {
        return jsonResponse({ error: 'Postalcode invalido' }, 400, ALLOWED_METHODS, req);
      }

      nominatimUrl =
        `${NOMINATIM_BASE}/search` +
        `?postalcode=${encodeURIComponent(sanitizedPostalcode)}` +
        `&country=${encodeURIComponent(country)}` +
        `&format=${encodeURIComponent(format)}` +
        `&limit=${encodeURIComponent(limit)}`;
    } else {
      return jsonResponse({ error: 'Parametro obrigatorio: q, postalcode ou reverse=1' }, 400, ALLOWED_METHODS, req);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    const isClientError = message.startsWith('Invalid ');
    return jsonResponse(
      { error: isClientError ? message : 'Function misconfigured' },
      isClientError ? 400 : 500,
      ALLOWED_METHODS,
      req,
    );
  }

  // Generate cache key
  const cacheKey = generateCacheKey('geocoding', {
    type: reverse ? 'reverse' : (q ? 'search' : 'postalcode'),
    q: q || undefined,
    postalcode: postalcode || undefined,
    country,
    lat: lat || undefined,
    lon: lon || undefined,
    zoom: zoom || undefined,
  });

  try {
    // Use cache wrapper
    const data = await withCache(
      cacheKey,
      async () => {
        // Fetch from Nominatim
        const response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': NOMINATIM_USER_AGENT,
            'Accept-Language': NOMINATIM_ACCEPT_LANGUAGE,
          },
        });

        const rawBody = await response.text();
        let parsedData: unknown;
        try {
          parsedData = JSON.parse(rawBody);
        } catch {
          throw new Error('Invalid JSON response from Nominatim');
        }

        return parsedData;
      },
      CACHE_TTL.VERY_LONG, // 30 days
      'geocoding'
    );

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...getAllSecurityHeaders(ALLOWED_METHODS, req),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('[nominatim-proxy] Falha ao consultar Nominatim', err);
    return jsonResponse({ error: 'Falha ao consultar Nominatim' }, 502, ALLOWED_METHODS, req);
  }
});

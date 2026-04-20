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
  rateLimitMiddleware,
  errorResponse,
  sanitizeString,
} from '../_shared/security.ts';
import { withCache, CACHE_TTL, generateCacheKey } from '../_shared/cache.ts';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: getAllSecurityHeaders('GET, OPTIONS'),
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 204, 
      headers: getAllSecurityHeaders('GET, OPTIONS'),
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting (mais permissivo para geocoding)
  const rateLimitResponse = await rateLimitMiddleware(req, 60, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const postalcode = url.searchParams.get('postalcode');
  const country = url.searchParams.get('country') ?? 'br';
  const reverse = url.searchParams.get('reverse') === '1';
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const zoom = url.searchParams.get('zoom');
  const format = url.searchParams.get('format') ?? 'json';
  const addressdetails = url.searchParams.get('addressdetails') ?? '1';
  const limit = url.searchParams.get('limit') ?? '3';
  const countryCodes = url.searchParams.get('countrycodes') ?? 'br';

  let nominatimUrl: string;

  if (reverse) {
    if (!lat || !lon) {
      return jsonResponse({ error: 'Parametros obrigatorios para reverse: lat e lon' }, 400);
    }

    // Validar coordenadas
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return jsonResponse({ error: 'Coordenadas invalidas' }, 400);
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
    // Sanitizar query
    const sanitizedQuery = sanitizeString(q, 200);
    if (!sanitizedQuery) {
      return jsonResponse({ error: 'Query invalida' }, 400);
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
      return jsonResponse({ error: 'Postalcode invalido' }, 400);
    }

    nominatimUrl =
      `${NOMINATIM_BASE}/search` +
      `?postalcode=${encodeURIComponent(sanitizedPostalcode)}` +
      `&country=${encodeURIComponent(country)}` +
      `&format=${encodeURIComponent(format)}&limit=1`;
  } else {
    return jsonResponse({ error: 'Parametro obrigatorio: q, postalcode ou reverse=1' }, 400);
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
            'User-Agent': 'Ordax/1.0 (supabase-edge-function)',
            'Accept-Language': 'pt-BR,pt;q=0.9',
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
        ...getAllSecurityHeaders('GET, OPTIONS'),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return errorResponse('Falha ao consultar Nominatim', 502, err);
  }
});


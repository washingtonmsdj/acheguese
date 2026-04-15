/**
 * EDGE FUNCTION: nominatim-proxy
 * Browser-safe proxy for OpenStreetMap Nominatim.
 *
 * Supported routes:
 * GET /functions/v1/nominatim-proxy?q=<query>
 * GET /functions/v1/nominatim-proxy?postalcode=<cep>&country=br
 * GET /functions/v1/nominatim-proxy?reverse=1&lat=<lat>&lon=<lon>&zoom=<zoom>
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

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
    nominatimUrl =
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}` +
      `&format=${encodeURIComponent(format)}` +
      `&limit=${encodeURIComponent(limit)}` +
      `&countrycodes=${encodeURIComponent(countryCodes)}` +
      `&addressdetails=${encodeURIComponent(addressdetails)}`;
  } else if (postalcode) {
    nominatimUrl =
      `${NOMINATIM_BASE}/search` +
      `?postalcode=${encodeURIComponent(postalcode)}` +
      `&country=${encodeURIComponent(country)}` +
      `&format=${encodeURIComponent(format)}&limit=1`;
  } else {
    return jsonResponse({ error: 'Parametro obrigatorio: q, postalcode ou reverse=1' }, 400);
  }

  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'VitrineBairro/1.0 (supabase-edge-function)',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    const rawBody = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = {
        error: 'Resposta invalida do Nominatim',
        raw: rawBody.slice(0, 300),
      };
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error('[nominatim-proxy] Error calling Nominatim:', err);
    return jsonResponse(
      { error: 'Falha ao consultar Nominatim', detail: String(err) },
      502,
    );
  }
});

/**
 * EDGE FUNCTION: Process Dispatch Timeouts
 *
 * Processa timeouts de dispatch de corridas automaticamente.
 * Deve ser chamada via cron.
 *
 * SEGURANCA: requer x-cron-secret OU Authorization Bearer com SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getAllSecurityHeaders, isOriginAllowed } from '../_shared/security.ts';

const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getAllSecurityHeaders('GET, POST, OPTIONS'),
      'Content-Type': 'application/json',
    },
  });
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7).trim();
}

function isAuthorized(req: Request): boolean {
  const cronHeader = req.headers.get('x-cron-secret') || '';
  const bearerToken = extractBearerToken(req);

  const hasValidCronSecret = CRON_SECRET.length > 0 && cronHeader === CRON_SECRET;
  const hasValidServiceToken =
    SUPABASE_SERVICE_ROLE_KEY.length > 0 && bearerToken === SUPABASE_SERVICE_ROLE_KEY;

  return hasValidCronSecret || hasValidServiceToken;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (origin && !isOriginAllowed(origin)) {
    return jsonResponse({ success: false, error: 'Origin not allowed' }, 403);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders('GET, POST, OPTIONS'),
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { success: false, error: 'Function misconfigured: missing Supabase credentials' },
      500,
    );
  }

  if (!CRON_SECRET && !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { success: false, error: 'Function misconfigured: no authentication secret configured' },
      500,
    );
  }

  if (!isAuthorized(req)) {
    return jsonResponse(
      {
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      },
      401,
    );
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const startTime = Date.now();

    const { data, error } = await supabaseClient.rpc('process_dispatch_timeouts');
    const executionTime = Date.now() - startTime;

    if (error) {
      console.error('Error processing timeouts:', error);
      return jsonResponse(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          executionTime,
        },
        500,
      );
    }

    const processed = data?.length || 0;

    console.log(`[${new Date().toISOString()}] Processed ${processed} timeout(s) in ${executionTime}ms`);

    return jsonResponse(
      {
        success: true,
        processed,
        results: data,
        timestamp: new Date().toISOString(),
        executionTime,
      },
      200,
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return jsonResponse(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unexpected error',
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});



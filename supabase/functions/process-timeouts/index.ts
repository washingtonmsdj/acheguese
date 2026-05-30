/**
 * EDGE FUNCTION: Process Dispatch Timeouts
 *
 * Processa timeouts de dispatch de corridas automaticamente.
 * Deve ser chamada via cron.
 *
 * SEGURANÇA: requer x-cron-secret OU Authorization Bearer com CRON_SECRET.
 * NUNCA use SUPABASE_SERVICE_ROLE_KEY como token de autenticação HTTP.
 *
 * SSOT: mesmo padrão de `auto-dispatch-ride/index.ts`.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  getAllSecurityHeaders,
  isOriginAllowed,
  jsonResponse,
  rateLimitMiddleware,
  requireCronSecret,
  requireHttpMethod,
} from '../_shared/security.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (origin && !isOriginAllowed(origin)) {
    return jsonResponse({ success: false, error: 'Origin not allowed' }, 403, 'POST, OPTIONS', req);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders('POST, OPTIONS', req),
    });
  }

  const methodError = requireHttpMethod(req, ['POST'], 'POST, OPTIONS');
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 30, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { success: false, error: 'Function misconfigured: missing Supabase credentials' },
      500,
      'POST, OPTIONS',
      req,
    );
  }

  const cronAuthError = requireCronSecret(req, 'POST, OPTIONS');
  if (cronAuthError) return cronAuthError;

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
        'POST, OPTIONS',
        req,
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
      'POST, OPTIONS',
      req,
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
      'POST, OPTIONS',
      req,
    );
  }
});


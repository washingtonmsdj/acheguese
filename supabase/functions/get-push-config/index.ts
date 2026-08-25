/**
 * Get Push Config Edge Function
 *
 * Returns the public VAPID key used by browsers to create push subscriptions.
 * This endpoint is intentionally public; the VAPID public key is not a secret.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  getAllSecurityHeaders,
  jsonResponse,
  rateLimitMiddleware,
  requireHttpMethod,
} from '../_shared/security.ts';

const ALLOWED_METHODS = 'GET, POST, OPTIONS';

// Compatibility fallback equals the public key already served by the deployed
// legacy function. Environment configuration wins when present, so rotations
// can be performed without a code change. This is a PUBLIC key, never a secret.
const LEGACY_PUBLIC_VAPID_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function getVapidPublicKey(): string {
  return Deno.env.get('VAPID_PUBLIC_KEY')?.trim() || LEGACY_PUBLIC_VAPID_KEY;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ['GET', 'POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 100, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    return new Response(JSON.stringify({ vapidPublicKey: getVapidPublicKey() }), {
      status: 200,
      headers: {
        ...getAllSecurityHeaders(ALLOWED_METHODS, req),
        'Cache-Control': 'public, max-age=3600, immutable',
        'CDN-Cache-Control': 'public, max-age=3600',
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('[get-push-config] unexpected failure', error);
    return jsonResponse({ error: 'Internal server error' }, 500, ALLOWED_METHODS, req);
  }
});

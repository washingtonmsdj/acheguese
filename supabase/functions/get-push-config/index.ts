/**
 * Get Push Config Edge Function
 * 
 * Returns VAPID public key for push notification subscription.
 * 
 * Features:
 * - Browser cache (1 hour)
 * - CDN cache (1 hour)
 * - Immutable response
 * 
 * Rate Limit: 100 requests per minute
 * 
 * @version 2.0.0 - Added aggressive caching
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  getAllSecurityHeaders,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  requireHttpMethod,
} from '../_shared/security.ts';

const ALLOWED_METHODS = 'GET, POST, OPTIONS';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ['GET', 'POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 100, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const vapidPublicKey = getRequiredEnv('VAPID_PUBLIC_KEY');

    return new Response(
      JSON.stringify({ vapidPublicKey }),
      {
        status: 200,
        headers: {
          ...getAllSecurityHeaders(ALLOWED_METHODS, req),
          // VAPID key é pública e imutável — cache agressivo é seguro
          'Cache-Control': 'public, max-age=3600, immutable',
          'CDN-Cache-Control': 'public, max-age=3600',
          'Vary': 'Accept-Encoding',
        },
      }
    );
  } catch (error) {
    console.error('Exception in get-push-config function:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, ALLOWED_METHODS, req);
  }
});


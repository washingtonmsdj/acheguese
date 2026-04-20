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
import { getAllSecurityHeaders, errorResponse } from '../_shared/security.ts';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders('GET, POST, OPTIONS'),
    });
  }

  // Allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: getAllSecurityHeaders(),
    });
  }

  try {
    return new Response(
      JSON.stringify({ vapidPublicKey: VAPID_PUBLIC_KEY }),
      {
        status: 200,
        headers: {
          ...getAllSecurityHeaders('GET, POST, OPTIONS'),
          // VAPID key é pública e imutável — cache agressivo é seguro
          'Cache-Control': 'public, max-age=3600, immutable',
          'CDN-Cache-Control': 'public, max-age=3600',
          'Vary': 'Accept-Encoding',
        },
      }
    );
  } catch (error) {
    console.error('Exception in get-push-config function:', error);
    return errorResponse('Internal server error', 500, error);
  }
});


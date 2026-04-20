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

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }

  // Allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    return new Response(
      JSON.stringify({
        vapidPublicKey: VAPID_PUBLIC_KEY,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          // Aggressive caching - VAPID key never changes
          'Cache-Control': 'public, max-age=3600, immutable', // 1 hour, immutable
          'CDN-Cache-Control': 'public, max-age=3600', // CDN cache 1 hour
          'Vary': 'Accept-Encoding', // Vary by encoding only
        },
      }
    );
  } catch (error) {
    console.error('Exception in get-push-config function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


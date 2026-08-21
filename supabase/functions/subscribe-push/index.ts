/**
 * Subscribe Push Edge Function
 *
 * Stores push notification subscription in database.
 *
 * Rate Limit: 10 requests per minute per user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireOperationalAccount } from '../_shared/accountOperational.ts';
import {
  errorResponse,
  getAllSecurityHeaders,
  isValidUUID,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from '../_shared/security.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_METHODS = 'POST, OPTIONS';

interface SubscribePushRequest {
  userId: string;
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  deviceName?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('Invalid token', 401);
    }

    const accountOperationalError = await requireOperationalAccount(
      supabase,
      user.id,
      req,
      ALLOWED_METHODS,
    );
    if (accountOperationalError) return accountOperationalError;

    const rawBody = await readJsonBody<SubscribePushRequest>(req, {
      maxBytes: 16_000,
      methods: ALLOWED_METHODS,
    });
    if (!rawBody.ok) return rawBody.response;

    const body = rawBody.data;
    const { userId, subscription, userAgent, deviceName } = body;

    if (!userId || !isValidUUID(userId) || !subscription || !subscription.endpoint || !subscription.p256dh || !subscription.auth) {
      return errorResponse('Missing or invalid required fields', 400);
    }

    if (user.id !== userId) {
      return errorResponse('Cannot subscribe for another user', 403);
    }

    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          user_agent: userAgent || null,
          device_name: deviceName || null,
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating push subscription:', updateError);
        return errorResponse('Failed to update subscription', 500);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Subscription updated',
          subscriptionId: existing.id,
        }),
        { status: 200, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) }
      );
    }

    const { data: newSubscription, error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        user_agent: userAgent || null,
        device_name: deviceName || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating push subscription:', insertError);
      return errorResponse('Failed to create subscription', 500);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription created',
        subscriptionId: newSubscription.id,
      }),
      { status: 200, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) }
    );
  } catch (error) {
    console.error('Exception in subscribe-push function:', error);
    return errorResponse('Internal server error', 500, error);
  }
});

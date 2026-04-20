/**
 * Unsubscribe Push Edge Function
 * 
 * Removes push notification subscription from database.
 * 
 * Rate Limit: 10 requests per minute per user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllSecurityHeaders, rateLimitMiddleware, errorResponse, isValidUUID } from '../_shared/security.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface UnsubscribePushRequest {
  subscriptionId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') });
  }

  // Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(req, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  // 1. Validate HTTP method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: getAllSecurityHeaders(),
    });
  }

  try {
    // 2. Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('Invalid token', 401);
    }

    // 3. Parse and validate input
    const body: UnsubscribePushRequest = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId || !isValidUUID(subscriptionId)) {
      return errorResponse('Missing or invalid subscriptionId', 400);
    }

    // 4. Verify subscription belongs to user
    const { data: subscription, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return errorResponse('Subscription not found', 404);
    }

    if (subscription.user_id !== user.id) {
      return errorResponse('Cannot unsubscribe another user', 403);
    }

    // 5. Mark subscription as inactive (soft delete)
    const { error: updateError } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error deactivating push subscription:', updateError);
      return errorResponse('Failed to unsubscribe', 500);
    }

    // 6. Return success
    return new Response(
      JSON.stringify({ success: true, message: 'Unsubscribed successfully' }),
      { status: 200, headers: getAllSecurityHeaders() }
    );
  } catch (error) {
    console.error('Exception in unsubscribe-push function:', error);
    return errorResponse('Internal server error', 500, error);
  }
});


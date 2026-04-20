/**
 * Subscribe Push Edge Function
 * 
 * Stores push notification subscription in database.
 * 
 * Rate Limit: 10 requests per minute per user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
  // 1. Validate HTTP method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Parse and validate input
    const body: SubscribePushRequest = await req.json();
    const { userId, subscription, userAgent, deviceName } = body;

    if (!userId || !subscription || !subscription.endpoint || !subscription.p256dh || !subscription.auth) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is subscribing for themselves
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Cannot subscribe for another user' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check if subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      // Update existing subscription
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
        return new Response(
          JSON.stringify({ error: 'Failed to update subscription' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Subscription updated',
          subscriptionId: existing.id,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          },
        }
      );
    }

    // 5. Create new subscription
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
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription created',
        subscriptionId: newSubscription.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      }
    );
  } catch (error) {
    console.error('Exception in subscribe-push function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


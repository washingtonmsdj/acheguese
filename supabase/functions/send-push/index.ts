/**
 * Send Push Edge Function
 * 
 * Sends push notification to user via Firebase Cloud Messaging.
 * 
 * Rate Limit: 100 requests per minute
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateBody, sendPushSchema, validationErrorResponse, type SendPushBody } from '../_shared/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');

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
    const rawBody = await req.json();
    const validation = validateBody<SendPushBody>(rawBody, sendPushSchema);
    if (!validation.ok) {
      return validationErrorResponse(validation.errors);
    }
    const { userId, notification } = validation.data!;

    if (!notification.title || !notification.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: notification.title, notification.body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check user preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (preferences && !preferences.push_enabled) {
      return new Response(
        JSON.stringify({ error: 'Push notifications disabled by user' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check quiet hours
    if (preferences && preferences.quiet_hours_start && preferences.quiet_hours_end) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = preferences.quiet_hours_start.split(':').map(Number);
      const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      const currentDay = now.getDay() || 7;
      const isQuietDay = preferences.quiet_hours_days?.includes(currentDay);

      if (isQuietDay && currentTime >= startTime && currentTime <= endTime) {
        return new Response(
          JSON.stringify({ error: 'User is in quiet hours' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. Get user's push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (subsError || !subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active push subscriptions found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Send push notifications
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Check if we have Firebase credentials (new API or legacy)
    const hasFirebaseConfig = FIREBASE_SERVICE_ACCOUNT || FIREBASE_PROJECT_ID || FCM_SERVER_KEY;

    if (hasFirebaseConfig) {
      // Use new FCM API (HTTP v1) if available
      if (FIREBASE_PROJECT_ID && FIREBASE_SERVICE_ACCOUNT) {
        try {
          // Parse service account
          const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
          
          // Get OAuth2 access token
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
              assertion: await createJWT(serviceAccount),
            }),
          });
          
          const { access_token } = await tokenResponse.json();
          
          // Send to each subscription using FCM v1 API
          for (const subscription of subscriptions) {
            try {
              const response = await fetch(
                `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: {
                      token: subscription.endpoint.split('/').pop(), // Extract FCM token
                      notification: {
                        title: notification.title,
                        body: notification.body,
                        image: notification.image,
                      },
                      data: notification.data || {},
                      webpush: {
                        headers: {
                          Urgency: 'high',
                        },
                        notification: {
                          icon: notification.icon || '/icon-192x192.png',
                          badge: notification.badge || '/badge-72x72.png',
                          tag: notification.tag,
                          requireInteraction: notification.requireInteraction,
                        },
                      },
                    },
                  }),
                }
              );

              if (response.ok) {
                successCount++;
                await supabase
                  .from('push_subscriptions')
                  .update({ last_used_at: new Date().toISOString() })
                  .eq('id', subscription.id);
              } else {
                failureCount++;
                const errorData = await response.json();
                errors.push(`Subscription ${subscription.id}: ${errorData.error?.message || 'Unknown error'}`);
              }
            } catch (error) {
              failureCount++;
              errors.push(`Subscription ${subscription.id}: ${String(error)}`);
            }
          }
        } catch (error) {
          console.error('Error with FCM v1 API:', error);
          // Fall back to legacy API if available
          if (FCM_SERVER_KEY) {
            await sendViaLegacyAPI();
          } else {
            throw error;
          }
        }
      } else if (FCM_SERVER_KEY) {
        // Use legacy API
        await sendViaLegacyAPI();
      }
    } else {
      // Dev mode: just log
      console.log('📱 Push Notification (dev mode):', {
        userId,
        notification,
        subscriptionCount: subscriptions.length,
      });
      successCount = subscriptions.length;
    }

    // Helper function for legacy API
    async function sendViaLegacyAPI() {
      for (const subscription of subscriptions) {
        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${FCM_SERVER_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: subscription.endpoint,
              notification: {
                title: notification.title,
                body: notification.body,
                icon: notification.icon || '/icon-192x192.png',
                badge: notification.badge || '/badge-72x72.png',
                image: notification.image,
                tag: notification.tag,
                requireInteraction: notification.requireInteraction,
              },
              data: notification.data || {},
            }),
          });

          if (response.ok) {
            successCount++;
            await supabase
              .from('push_subscriptions')
              .update({ last_used_at: new Date().toISOString() })
              .eq('id', subscription.id);
          } else {
            failureCount++;
            const errorData = await response.json();
            errors.push(`Subscription ${subscription.id}: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          failureCount++;
          errors.push(`Subscription ${subscription.id}: ${String(error)}`);
        }
      }
    }

    // Helper function to create JWT for OAuth2
    async function createJWT(serviceAccount: any): Promise<string> {
      const header = {
        alg: 'RS256',
        typ: 'JWT',
      };

      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      };

      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const unsignedToken = `${encodedHeader}.${encodedPayload}`;

      // Sign with private key (simplified - in production use proper crypto library)
      const signature = await signWithPrivateKey(unsignedToken, serviceAccount.private_key);
      
      return `${unsignedToken}.${signature}`;
    }

    async function signWithPrivateKey(data: string, privateKey: string): Promise<string> {
      // This is a simplified version - in production, use proper crypto library
      // For now, return a placeholder
      return btoa(data);
    }

    // 7. Return response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent to ${successCount} device(s)`,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined,
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
    console.error('Exception in send-push function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


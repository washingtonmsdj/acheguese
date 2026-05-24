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
import { getAllSecurityHeaders, rateLimitMiddleware, errorResponse } from '../_shared/security.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') });
  }

  // Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(req, 100, 60000);
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
    const rawBody = await req.json();
    const validation = validateBody<SendPushBody>(rawBody, sendPushSchema);
    if (!validation.ok) {
      return validationErrorResponse(validation.errors);
    }
    const { userId, notification } = validation.data!;

    // Verificar ownership: apenas o próprio usuário pode enviar push para si mesmo.
    // Admins que precisem enviar notificações devem usar a service role diretamente.
    if (user.id !== userId) {
      return errorResponse('Cannot send push notification for another user', 403);
    }

    if (!notification.title || !notification.body) {
      return errorResponse('Missing required fields: notification.title, notification.body', 400);
    }

    // 4. Check user preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (preferences && !preferences.push_enabled) {
      return errorResponse('Push notifications disabled by user', 403);
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
        return errorResponse('User is in quiet hours', 403);
      }
    }

    // 5. Get user's push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (subsError || !subscriptions || subscriptions.length === 0) {
      return errorResponse('No active push subscriptions found', 404);
    }

    // 6. Send push notifications
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    if (!FIREBASE_PROJECT_ID || !FIREBASE_SERVICE_ACCOUNT) {
      return errorResponse('Firebase push provider is not configured', 503);
    }

    try {
      const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: await createJWT(serviceAccount),
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Failed to authorize Firebase provider: ${tokenResponse.status}`);
      }

      const { access_token } = await tokenResponse.json();
      if (!access_token) {
        throw new Error('Firebase provider did not return an access token');
      }

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
                  token: subscription.endpoint.split('/').pop(),
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
      throw error;
    }

    // Helper function to create JWT for OAuth2 (RS256 via Web Crypto API)
    async function createJWT(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
      const header = { alg: 'RS256', typ: 'JWT' };

      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      };

      // Base64url encode (sem padding, substituindo +/ por -_)
      const base64url = (input: string): string =>
        btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const encodedHeader = base64url(JSON.stringify(header));
      const encodedPayload = base64url(JSON.stringify(payload));
      const signingInput = `${encodedHeader}.${encodedPayload}`;

      const signature = await signRS256(signingInput, serviceAccount.private_key);
      return `${signingInput}.${signature}`;
    }

    /**
     * Assina dados com chave privada RSA-SHA256 usando a Web Crypto API nativa do Deno.
     * Substitui o placeholder `btoa(data)` que não era uma assinatura criptográfica real.
     */
    async function signRS256(data: string, pemPrivateKey: string): Promise<string> {
      // Remove cabeçalho/rodapé PEM e espaços em branco
      const pemBody = pemPrivateKey
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s+/g, '');

      const derBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        derBuffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign'],
      );

      const encoder = new TextEncoder();
      const signatureBuffer = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        encoder.encode(data),
      );

      // Base64url encode da assinatura
      const signatureBytes = new Uint8Array(signatureBuffer);
      const base64 = btoa(String.fromCharCode(...signatureBytes));
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
        headers: getAllSecurityHeaders(),
      }
    );
  } catch (error) {
    console.error('Exception in send-push function:', error);
    return errorResponse('Internal server error', 500, error);
  }
});


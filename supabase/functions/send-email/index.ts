/**
 * Send Email Edge Function
 * 
 * Sends emails using Resend API.
 * Respects user preferences and quiet hours.
 * 
 * Rate Limit: 50 requests per minute per user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateBody, sendEmailSchema, validationErrorResponse, type SendEmailBody } from '../_shared/validation.ts';
import {
  errorResponse,
  getAllSecurityHeaders,
  getRequiredEnv,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from '../_shared/security.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = getRequiredEnv('FROM_EMAIL');
const ALLOWED_METHODS = 'POST, OPTIONS';

function isCategoryEmailEnabled(
  preferences: {
    transactional_enabled?: boolean | null;
    social_enabled?: boolean | null;
    system_enabled?: boolean | null;
    marketing_enabled?: boolean | null;
  },
  category: NonNullable<SendEmailBody['category']>,
): boolean {
  switch (category) {
    case 'transactional':
      return preferences.transactional_enabled !== false;
    case 'social':
      return preferences.social_enabled !== false;
    case 'system':
      return preferences.system_enabled !== false;
    case 'marketing':
      return preferences.marketing_enabled !== false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  // Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(req, 50, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // 2. Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('Invalid token', 401);
    }

    // 3. Parse and validate input
    const rawBody = await readJsonBody<SendEmailBody>(req, {
      maxBytes: 120_000,
      methods: ALLOWED_METHODS,
    });
    if (!rawBody.ok) return rawBody.response;

    const validation = validateBody<SendEmailBody>(rawBody.data, sendEmailSchema);
    if (!validation.ok) {
      return validationErrorResponse(validation.errors, ALLOWED_METHODS, req);
    }
    const { to, subject, html, text, userId, category = 'transactional' } = validation.data!;

    // 4. Check user preferences (if userId provided)
    if (userId) {
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (preferences) {
        // Check if email is enabled
        if (!preferences.email_enabled) {
          return errorResponse('Email notifications disabled by user', 403);
        }

        // Check category preferences
        if (!isCategoryEmailEnabled(preferences, category)) {
          return errorResponse(`${category} emails disabled by user`, 403);
        }

        // Check quiet hours
        if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
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
            if (category !== 'transactional') {
              return errorResponse('User is in quiet hours', 403);
            }
          }
        }
      }
    }

    // 5. Send email via Resend
    let emailStatus: 'sent' | 'failed' = 'sent';
    let errorMessage: string | null = null;
    let emailId: string | null = null;

    if (!RESEND_API_KEY) {
      return errorResponse('Email provider is not configured', 503);
    }

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
          text: text || undefined,
        }),
      });

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
          emailStatus = 'failed';
          errorMessage = resendData.message || 'Failed to send email';
          console.error('Resend API error:', resendData);
        } else {
          emailId = resendData.id;
        }
      } catch (error) {
        emailStatus = 'failed';
        errorMessage = String(error);
        console.error('Error sending email via Resend:', error);
      }
    // 6. Log email
    const { error: logError } = await supabase.from('email_logs').insert({
      user_id: userId || null,
      recipient_email: to,
      subject,
      category,
      status: emailStatus,
      error_message: errorMessage,
      metadata: {
        email_id: emailId,
        has_text: !!text,
        html_length: html.length,
      },
    });

    if (logError) {
      console.error('Error logging email:', logError);
    }

    // 7. Return response
    if (emailStatus === 'failed') {
      return errorResponse('Failed to send email', 500);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId,
      }),
      {
        status: 200,
        headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
      }
    );
  } catch (error) {
    console.error('Exception in send-email function:', error);
    return errorResponse('Internal server error', 500, error);
  }
});


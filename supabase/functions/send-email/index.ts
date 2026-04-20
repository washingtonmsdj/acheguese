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
import { getAllSecurityHeaders, rateLimitMiddleware, errorResponse } from '../_shared/security.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') });
  }

  // Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(req, 50, 60000);
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
    const validation = validateBody<SendEmailBody>(rawBody, sendEmailSchema);
    if (!validation.ok) {
      return validationErrorResponse(validation.errors);
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
        const categoryKey = `${category}_enabled`;
        if (preferences[categoryKey] === false && category !== 'transactional') {
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

    if (RESEND_API_KEY) {
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
    } else {
      // Development mode: log email instead of sending
      console.log('📧 Email (dev mode):', { to, subject, html: html.substring(0, 100) });
      emailStatus = 'sent';
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
        headers: getAllSecurityHeaders(),
      }
    );
  } catch (error) {
    console.error('Exception in send-email function:', error);
    return errorResponse('Internal server error', 500, error);
  }
});


// Supabase Edge Function - Send Emergency Email
// Deploy: supabase functions deploy send-emergency-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonSecurityResponse, requireAuthenticatedUser } from '../_shared/businessAuth.ts';
import {
  checkRateLimit,
  getAllSecurityHeaders,
  rateLimitMiddleware,
  auditLog,
  getAuditInfo,
  errorResponse,
  getRequiredEnv,
  isValidUUID,
  isOriginAllowed,
  readJsonBody,
  requireHttpMethod,
  sanitizeString,
} from '../_shared/security.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM_DOMAIN = getRequiredEnv('EMAIL_FROM_DOMAIN');
const EMAIL_FROM_NAME = getRequiredEnv('EMAIL_FROM_NAME');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_METHODS = 'POST, OPTIONS';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 5;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface EmailRequest {
  contactId: string;
  alertId: string;
}

interface EmailResponse {
  success: boolean;
  contactId: string;
  channel: 'email';
  timestamp: string;
  status: 'sent' | 'failed';
  error?: string;
  metadata?: Record<string, unknown>;
}

interface UserProfileRecord {
  id: string;
  name: string | null;
  phone: string | null;
}

interface AlertRecord {
  id: string;
  profile_id: string | null;
  alert_type: string;
  status: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
}

interface ContactRecord {
  id: string;
  profile_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_active?: boolean | null;
}

serve(async (req: Request) => {
  const auditInfo = getAuditInfo(req);
  const origin = req.headers.get('origin');
  const respond = (body: Record<string, unknown>, status = 200) =>
    jsonSecurityResponse(body, status, ALLOWED_METHODS, req);

  if (origin && !isOriginAllowed(origin)) {
    return respond({ error: 'Origin not allowed' }, 403);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 100, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  if (!RESEND_API_KEY) {
    return errorResponse('Email service not configured', 500, {
      code: 'MISSING_RESEND_API_KEY',
    });
  }

  const authResult = await requireAuthenticatedUser(req, supabase);
  if (authResult instanceof Response) {
    auditLog({
      timestamp: new Date().toISOString(),
      action: 'emergency_email_auth_failed',
      resource: 'emergency_alerts',
      status: 'failure',
      details: { reason: 'invalid_or_missing_token' },
      ...auditInfo,
    });
    return authResult;
  }

  const userId = authResult.user.id;
  const userRateLimit = await checkRateLimit(`emergency-email:${userId}`, 30, 5 * 60 * 1000);
  if (!userRateLimit.allowed) {
    return respond(
      { error: 'Rate limit exceeded. Try again later.' },
      429,
    );
  }

  try {
    const rawBody = await readJsonBody<EmailRequest>(req, {
      maxBytes: 8192,
      methods: ALLOWED_METHODS,
    });
    if (!rawBody.ok) return rawBody.response;
    const emailRequest = rawBody.data;

    if (!emailRequest.alertId || !isValidUUID(emailRequest.alertId)) {
      return respond({ error: 'Valid alertId is required' }, 400);
    }
    if (!emailRequest.contactId || !isValidUUID(emailRequest.contactId)) {
      return respond({ error: 'Valid contactId is required' }, 400);
    }

    const { data: userProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('user_id', userId);

    if (profileError) {
      return errorResponse('Failed to validate user profile', 500, profileError);
    }
    if (!userProfiles || userProfiles.length === 0) {
      return respond({ error: 'User profile not found' }, 403);
    }

    const userProfileIds = new Set(userProfiles.map((profile: UserProfileRecord) => profile.id));

    const { data: alertData, error: alertError } = await supabase
      .from('emergency_alerts')
      .select('id, profile_id, alert_type, status, description, latitude, longitude, created_at')
      .eq('id', emailRequest.alertId)
      .maybeSingle();

    if (alertError) {
      return errorResponse('Failed to validate alert', 500, alertError);
    }
    if (!alertData) {
      return respond({ error: 'Alert not found' }, 404);
    }

    const alert = alertData as AlertRecord;
    if (!alert.profile_id || !userProfileIds.has(alert.profile_id)) {
      auditLog({
        timestamp: new Date().toISOString(),
        userId,
        action: 'emergency_email_forbidden',
        resource: 'emergency_alerts',
        status: 'failure',
        details: { reason: 'alert_not_owned_by_user', alertId: emailRequest.alertId },
        ...auditInfo,
      });
      return respond({ error: 'Forbidden' }, 403);
    }

    if (alert.status !== 'active') {
      auditLog({
        timestamp: new Date().toISOString(),
        userId,
        action: 'emergency_email_blocked',
        resource: 'emergency_alerts',
        status: 'failure',
        details: {
          reason: 'alert_not_active',
          alertId: emailRequest.alertId,
          alertStatus: alert.status,
        },
        ...auditInfo,
      });
      return respond({ error: 'Emergency alert is no longer active' }, 409);
    }

    const { data: contactData, error: contactError } = await supabase
      .from('emergency_contacts')
      .select('id, profile_id, name, email, phone, is_active')
      .eq('id', emailRequest.contactId)
      .maybeSingle();

    if (contactError) {
      return errorResponse('Failed to validate emergency contact', 500, contactError);
    }
    if (!contactData) {
      return respond({ error: 'Emergency contact not found' }, 404);
    }

    const contact = contactData as ContactRecord;
    if (contact.profile_id !== alert.profile_id) {
      auditLog({
        timestamp: new Date().toISOString(),
        userId,
        action: 'emergency_email_forbidden',
        resource: 'emergency_contacts',
        status: 'failure',
        details: {
          reason: 'contact_not_linked_to_alert_profile',
          alertId: emailRequest.alertId,
          contactId: emailRequest.contactId,
        },
        ...auditInfo,
      });
      return respond({ error: 'Forbidden' }, 403);
    }
    if (contact.is_active === false) {
      return respond({ error: 'Emergency contact is inactive' }, 403);
    }

    const contactEmail = extractEmail(contact.email || '');
    if (!contactEmail) {
      return respond(
        { error: 'Emergency contact email is not configured' },
        400,
      );
    }

    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    const { count: recentCount, error: logsError } = await supabase
      .from('emergency_delivery_log')
      .select('id', { count: 'exact', head: true })
      .eq('alert_id', emailRequest.alertId)
      .eq('contact_id', emailRequest.contactId)
      .eq('channel', 'email')
      .gte('created_at', windowStart);

    if (logsError) {
      return errorResponse('Failed to validate rate limit', 500, logsError);
    }

    if ((recentCount || 0) >= RATE_LIMIT_MAX) {
      await supabase.from('emergency_delivery_log').insert({
        alert_id: emailRequest.alertId,
        contact_id: emailRequest.contactId,
        channel: 'email',
        status: 'failed',
        target: contactEmail,
        error_message: `Rate limit exceeded: ${RATE_LIMIT_MAX} emails per ${RATE_LIMIT_WINDOW_MINUTES} minutes`,
        metadata: {
          rate_limit_blocked: true,
          recent_count: recentCount || 0,
          window_minutes: RATE_LIMIT_WINDOW_MINUTES,
        },
        created_at: new Date().toISOString(),
      });

      auditLog({
        timestamp: new Date().toISOString(),
        userId,
        action: 'emergency_email_rate_limited',
        resource: 'emergency_alerts',
        status: 'failure',
        details: { alertId: emailRequest.alertId, contactId: emailRequest.contactId },
        ...auditInfo,
      });

      return respond(
        { error: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} attempts per ${RATE_LIMIT_WINDOW_MINUTES} minutes.` },
        429,
      );
    }

    const ownerProfile = userProfiles.find(
      (profile: UserProfileRecord) => profile.id === alert.profile_id,
    );

    const sanitizedContactName = sanitizeString(contact.name || 'Contato', 100);
    const sanitizedUserName = sanitizeString(ownerProfile?.name || 'Usuario', 100);
    const sanitizedUserPhone = sanitizeString(ownerProfile?.phone || 'Nao informado', 50);
    const sanitizedDescription =
      typeof alert.description === 'string' && alert.description.trim().length > 0
        ? sanitizeString(alert.description, 500)
        : undefined;

    const alertType = translateAlertType(
      sanitizeString(alert.alert_type || 'sos', 50).toLowerCase(),
    );

    const alertCreatedAt =
      normalizeIsoDatetime(alert.created_at) ||
      new Date().toISOString();

    const location = normalizeLocation(
      alert.latitude != null && alert.longitude != null
        ? { latitude: alert.latitude, longitude: alert.longitude }
        : undefined,
    );

    const subject = 'ALERTA DE EMERGENCIA';
    const htmlBody = buildEmailHtml(
      sanitizedContactName,
      sanitizedUserName,
      sanitizedUserPhone,
      alertType,
      alertCreatedAt,
      location,
      sanitizedDescription,
    );

    const textBody = buildEmailText(
      sanitizedContactName,
      sanitizedUserName,
      sanitizedUserPhone,
      alertType,
      alertCreatedAt,
      location,
      sanitizedDescription,
    );

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_DOMAIN}>`,
        to: [contactEmail],
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    const resendRaw = await resendResponse.text();
    if (!resendResponse.ok) {
      const providerError = `Email provider returned HTTP ${resendResponse.status}`;
      const { error: failureLogError } = await supabase
        .from('emergency_delivery_log')
        .insert({
          alert_id: emailRequest.alertId,
          contact_id: emailRequest.contactId,
          channel: 'email',
          status: 'failed',
          target: contactEmail,
          error_message: providerError,
          metadata: {
            provider: 'resend',
            provider_status: resendResponse.status,
          },
          created_at: new Date().toISOString(),
        });

      if (failureLogError) {
        console.error('Failed to persist emergency email delivery failure', {
          status: resendResponse.status,
          errorCode: failureLogError.code,
        });
      }

      auditLog({
        timestamp: new Date().toISOString(),
        userId,
        action: 'emergency_email_provider_failed',
        resource: 'emergency_alerts',
        status: 'failure',
        details: {
          alertId: emailRequest.alertId,
          contactId: emailRequest.contactId,
          providerStatus: resendResponse.status,
        },
        ...auditInfo,
      });

      return errorResponse('Failed to send emergency email', 502, {
        status: resendResponse.status,
      });
    }

    let resendResult: Record<string, unknown> = {};
    try {
      resendResult = resendRaw ? JSON.parse(resendRaw) : {};
    } catch {
      resendResult = {};
    }

    await supabase.from('emergency_delivery_log').insert({
      alert_id: emailRequest.alertId,
      contact_id: emailRequest.contactId,
      channel: 'email',
      status: 'sent',
      target: contactEmail,
      metadata: {
        emailId: resendResult.id,
        subject,
        alertType,
      },
      created_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
    });

    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: 'emergency_email_sent',
      resource: 'emergency_alerts',
      status: 'success',
      details: {
        alertId: emailRequest.alertId,
        contactId: emailRequest.contactId,
        emailId: resendResult.id,
      },
      ...auditInfo,
    });

    const response: EmailResponse = {
      success: true,
      contactId: emailRequest.contactId,
      channel: 'email',
      timestamp: new Date().toISOString(),
      status: 'sent',
      metadata: {
        to: contactEmail,
        subject,
        alertId: emailRequest.alertId,
        alertType,
        emailId: resendResult.id,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  } catch (error) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: 'emergency_email_failed',
      resource: 'emergency_alerts',
      status: 'failure',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      ...auditInfo,
    });

    return errorResponse('Failed to send emergency email', 500, error);
  }
});

function normalizeIsoDatetime(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeLocation(
  location: { latitude: number; longitude: number } | undefined,
): string {
  if (!location) return 'Nao disponivel';
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return 'Nao disponivel';
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return 'Nao disponivel';
  }

  return `${latitude}, ${longitude}`;
}

function extractEmail(value: string): string | null {
  const candidate = value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!candidate || !emailRegex.test(candidate)) {
    return null;
  }
  return candidate;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function translateAlertType(type: string): string {
  switch (type) {
    case 'sos':
      return 'SOS';
    case 'emergency_button':
      return 'Botao de Emergencia';
    case 'automatic':
      return 'Alerta Automatico';
    case 'manual':
      return 'Alerta Manual';
    case 'panic':
      return 'Panico';
    default:
      return type;
  }
}

function buildEmailHtml(
  contactName: string,
  userName: string,
  userPhone: string,
  alertType: string,
  createdAt: string,
  location: string,
  description?: string,
): string {
  const safeContactName = escapeHtml(contactName);
  const safeUserName = escapeHtml(userName);
  const safeUserPhone = escapeHtml(userPhone);
  const safeAlertType = escapeHtml(alertType);
  const safeLocation = escapeHtml(location);
  const safeDescription = description ? escapeHtml(description) : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .detail { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #dc2626; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ALERTA DE EMERGENCIA</h1>
    </div>
    <div class="content">
      <p>Ola <strong>${safeContactName}</strong>,</p>
      <p>Este e um <strong>ALERTA DE EMERGENCIA</strong> automatico.</p>
      <p><strong>${safeUserName}</strong> acionou um alerta de emergencia e voce esta cadastrado como contato de emergencia.</p>

      <h3>DETALHES DO ALERTA:</h3>
      <div class="detail"><strong>Tipo:</strong> ${safeAlertType}</div>
      <div class="detail"><strong>Data/Hora:</strong> ${new Date(createdAt).toLocaleString('pt-BR')}</div>
      <div class="detail"><strong>Localizacao:</strong> ${safeLocation}</div>
      <div class="detail"><strong>Telefone:</strong> ${safeUserPhone}</div>
      ${safeDescription ? `<div class="detail"><strong>Descricao:</strong> ${safeDescription}</div>` : ''}

      <p style="margin-top: 20px; padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">
        <strong>ACAO NECESSARIA:</strong><br>
        Se voce recebeu este email, entre em contato com <strong>${safeUserName}</strong> imediatamente.
      </p>
    </div>
    <div class="footer">
      <p>Este e um email automatico do sistema de seguranca.</p>
      <p>Nao responda a este email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildEmailText(
  contactName: string,
  userName: string,
  userPhone: string,
  alertType: string,
  createdAt: string,
  location: string,
  description?: string,
): string {
  return `
ALERTA DE EMERGENCIA

Ola ${contactName},

Este e um ALERTA DE EMERGENCIA automatico.

${userName} acionou um alerta de emergencia e voce esta cadastrado como contato de emergencia.

DETALHES DO ALERTA:
- Tipo: ${alertType}
- Data/Hora: ${new Date(createdAt).toLocaleString('pt-BR')}
- Localizacao: ${location}
- Telefone: ${userPhone}

${description ? `Descricao: ${description}` : ''}

ACAO NECESSARIA:
Se voce recebeu este email, entre em contato com ${userName} imediatamente.

---
Este e um email automatico do sistema de seguranca.
Nao responda a este email.
  `.trim();
}

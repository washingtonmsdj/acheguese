import { createClient } from '@supabase/supabase-js';
import { requireOperationalAccount } from '../_shared/accountOperational.ts';
import {
  auditLog,
  checkRateLimit,
  errorResponse,
  extractBearerToken,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  isOriginAllowed,
  isValidUUID,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from '../_shared/security.ts';
import {
  buildEmergencyProviderPayload,
  extractEmail,
  type ProviderPayload,
} from './providerPayload.ts';

const RESEND_API_KEY = getRequiredEnv('RESEND_API_KEY');
const EMAIL_FROM_DOMAIN = getRequiredEnv('EMAIL_FROM_DOMAIN');
const EMAIL_FROM_NAME = getRequiredEnv('EMAIL_FROM_NAME');
const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const ALLOWED_METHODS = 'POST, OPTIONS';
const MAX_CLAIM_ATTEMPTS = 5;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface EmailRequest {
  contactId: string;
  alertId: string;
}

type DeliveryStatus =
  | 'pending'
  | 'processing'
  | 'dispatching'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'reconciliation_required';

interface EmailResponse {
  success: boolean;
  contactId: string;
  channel: 'email';
  timestamp: string;
  status: DeliveryStatus;
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
  is_active?: boolean | null;
}

interface DeliveryRecord {
  id: string;
  status: DeliveryStatus;
  attempt_count: number;
  provider_attempt_count?: number;
  provider_message_id?: string | null;
  dispatch_authorized_at?: string | null;
  last_provider_attempt_at?: string | null;
  cancelled_at?: string | null;
  reconciliation_required_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type FailableDeliveryStatus = 'processing' | 'dispatching';

export default {
  async fetch(req: Request): Promise<Response> {
    const auditInfo = getAuditInfo(req);
    const respond = (body: Record<string, unknown>, status = 200) =>
      jsonResponse(body, status, ALLOWED_METHODS, req);

    const origin = req.headers.get('origin');
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

    const edgeRateLimit = await rateLimitMiddleware(req, 100, 60_000);
    if (edgeRateLimit) return edgeRateLimit;

    const token = extractBearerToken(req);
    if (!token) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: 'emergency_email_auth_failed',
        resource: 'emergency_alerts',
        status: 'failure',
        details: { reason: 'missing_token' },
        ...auditInfo,
      });
      return respond({ error: 'Missing authorization token' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user?.id) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: 'emergency_email_auth_failed',
        resource: 'emergency_alerts',
        status: 'failure',
        details: { reason: 'invalid_or_expired_token' },
        ...auditInfo,
      });
      return respond({ error: 'Invalid or expired token' }, 401);
    }

    const accountOperationalError = await requireOperationalAccount(
      supabaseAdmin,
      user.id,
      req,
      ALLOWED_METHODS,
    );
    if (accountOperationalError) return accountOperationalError;

    const userId = user.id;
    const userRateLimit = await checkRateLimit(
      `emergency-email:${userId}`,
      30,
      5 * 60 * 1000,
    );
    if (!userRateLimit.allowed) {
      return respond({ error: 'Rate limit exceeded. Try again later.' }, 429);
    }

    try {
      const rawBody = await readJsonBody<EmailRequest>(req, {
        maxBytes: 8192,
        methods: ALLOWED_METHODS,
      });
      if (!rawBody.ok) return rawBody.response;

      const { alertId, contactId } = rawBody.data;
      if (!alertId || !isValidUUID(alertId)) {
        return respond({ error: 'Valid alertId is required' }, 400);
      }
      if (!contactId || !isValidUUID(contactId)) {
        return respond({ error: 'Valid contactId is required' }, 400);
      }

      const { data: userProfiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, phone')
        .eq('user_id', userId);
      if (profileError) {
        return errorResponse('Failed to validate user profile', 500, profileError);
      }
      if (!userProfiles?.length) {
        return respond({ error: 'User profile not found' }, 403);
      }

      const profileRows = userProfiles as UserProfileRecord[];
      const ownedProfileIds = new Set(profileRows.map((profile) => profile.id));

      const { data: alertData, error: alertError } = await supabaseAdmin
        .from('emergency_alerts')
        .select(
          'id, profile_id, alert_type, status, description, latitude, longitude, created_at',
        )
        .eq('id', alertId)
        .maybeSingle();
      if (alertError) {
        return errorResponse('Failed to validate alert', 500, alertError);
      }
      if (!alertData) return respond({ error: 'Alert not found' }, 404);

      const alert = alertData as AlertRecord;
      if (!alert.profile_id || !ownedProfileIds.has(alert.profile_id)) {
        auditLog({
          timestamp: new Date().toISOString(),
          userId,
          action: 'emergency_email_forbidden',
          resource: 'emergency_alerts',
          status: 'failure',
          details: { reason: 'alert_not_owned_by_user', alertId },
          ...auditInfo,
        });
        return respond({ error: 'Forbidden' }, 403);
      }

      const latestBeforeClaim = await getLatestDelivery(alertId, contactId);
      let dispatching: DeliveryRecord | null =
        latestBeforeClaim?.status === 'dispatching' ? latestBeforeClaim : null;

      if (!['active', 'acknowledged'].includes(alert.status) && !dispatching) {
        if (
          latestBeforeClaim &&
          ['sent', 'delivered', 'reconciliation_required'].includes(
            latestBeforeClaim.status,
          )
        ) {
          return respond({
            success:
              latestBeforeClaim.status === 'sent' ||
              latestBeforeClaim.status === 'delivered',
            contactId,
            channel: 'email',
            timestamp: new Date().toISOString(),
            status: latestBeforeClaim.status,
            metadata: {
              deliveryId: latestBeforeClaim.id,
              terminalAlert: true,
            },
          });
        }
        return respond({ error: 'Emergency alert is no longer actionable' }, 409);
      }

      if (!dispatching) {
        const contactResult = await loadActiveOwnedContact(
          contactId,
          alert.profile_id,
          req,
        );
        if (contactResult.response) return contactResult.response;
        const contact = contactResult.contact;

        const contactEmail = extractEmail(contact.email || '');
        if (!contactEmail) {
          return respond(
            { error: 'Emergency contact email is not configured' },
            400,
          );
        }

        const { data: claimedData, error: claimError } = await supabaseAdmin.rpc(
          'claim_emergency_delivery_attempt',
          {
            p_alert_id: alertId,
            p_contact_id: contactId,
            p_channel: 'email',
          },
        );
        if (claimError) {
          return errorResponse(
            'Failed to claim emergency delivery',
            500,
            claimError,
          );
        }

        const claimed = claimedData as DeliveryRecord | null;
        if (!claimed) {
          const latest = await getLatestDelivery(alertId, contactId);
          if (!latest) {
            return respond(
              { error: 'No emergency delivery obligation', status: 'missing' },
              409,
            );
          }
          if (['sent', 'delivered'].includes(latest.status)) {
            return respond({
              success: true,
              contactId,
              channel: 'email',
              timestamp: new Date().toISOString(),
              status: latest.status,
              metadata: { deliveryId: latest.id, idempotent: true },
            });
          }
          if (latest.status === 'processing') {
            return respond({
              success: true,
              contactId,
              channel: 'email',
              timestamp: new Date().toISOString(),
              status: 'processing',
              metadata: { deliveryId: latest.id, inProgress: true },
            });
          }
          if (latest.status !== 'dispatching') {
            return respond(
              {
                error: 'Emergency delivery is not dispatchable',
                status: latest.status,
              },
              409,
            );
          }
          dispatching = latest;
        } else {
          if (claimed.attempt_count > MAX_CLAIM_ATTEMPTS) {
            await markDeliveryFailed(
              claimed.id,
              `Claim attempt limit exceeded (${MAX_CLAIM_ATTEMPTS})`,
              {},
              'processing',
            );
            return respond(
              { error: 'Emergency delivery claim limit exceeded' },
              429,
            );
          }

          const ownerProfile = profileRows.find(
            (profile) => profile.id === alert.profile_id,
          );
          const candidatePayload = buildEmergencyProviderPayload({
            deliveryId: claimed.id,
            fromName: EMAIL_FROM_NAME,
            fromDomain: EMAIL_FROM_DOMAIN,
            contactEmail,
            contactName: contact.name || 'Contato',
            userName: ownerProfile?.name || 'Usuario',
            userPhone: ownerProfile?.phone || 'Nao informado',
            alertType: alert.alert_type || 'sos',
            createdAt: alert.created_at || new Date().toISOString(),
            latitude: alert.latitude,
            longitude: alert.longitude,
            description: alert.description,
          });

          const { data: dispatchData, error: dispatchError } =
            await supabaseAdmin.rpc('authorize_emergency_email_dispatch', {
              p_delivery_id: claimed.id,
              p_payload: candidatePayload,
            });
          if (dispatchError) {
            return errorResponse(
              'Failed to authorize emergency email dispatch',
              500,
              dispatchError,
            );
          }

          dispatching = dispatchData as DeliveryRecord | null;
          if (!dispatching) {
            auditLog({
              timestamp: new Date().toISOString(),
              userId,
              action: 'emergency_email_dispatch_cancelled',
              resource: 'emergency_delivery_log',
              status: 'success',
              details: { alertId, contactId, deliveryId: claimed.id },
              ...auditInfo,
            });
            return respond(
              {
                error: 'Emergency delivery is no longer dispatchable',
                status: 'cancelled',
              },
              409,
            );
          }
        }
      }

      if (!dispatching) {
        return errorResponse('Emergency delivery dispatch state is missing', 500);
      }

      const providerPayload = await getProviderPayload(dispatching.id);
      if (!providerPayload) {
        await requireDeliveryReconciliation(
          dispatching.id,
          'dispatching row missing immutable provider payload',
        );
        return respond(
          {
            error: 'Emergency delivery requires provider reconciliation',
            status: 'reconciliation_required',
          },
          409,
        );
      }

      const { data: providerAttemptData, error: providerAttemptError } =
        await supabaseAdmin.rpc('begin_emergency_provider_attempt', {
          p_delivery_id: dispatching.id,
        });
      if (providerAttemptError) {
        return errorResponse(
          'Failed to begin emergency provider attempt',
          500,
          providerAttemptError,
        );
      }

      const providerAttempt = providerAttemptData as DeliveryRecord | null;
      if (!providerAttempt) {
        const current = await getDeliveryById(dispatching.id);
        if (current?.status === 'reconciliation_required') {
          return respond(
            {
              error: 'Emergency delivery requires provider reconciliation',
              status: 'reconciliation_required',
            },
            409,
          );
        }

        return respond({
          success: true,
          contactId,
          channel: 'email',
          timestamp: new Date().toISOString(),
          status: current?.status ?? 'dispatching',
          metadata: {
            deliveryId: dispatching.id,
            providerAttemptSuppressed: true,
          },
        });
      }

      const idempotencyKey = `emergency-delivery/${providerAttempt.id}`;
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(providerPayload),
      });

      const resendRaw = await resendResponse.text();
      const resendResult = parseJsonObject(resendRaw);

      if (!resendResponse.ok) {
        return handleProviderFailure({
          resendResponse,
          resendResult,
          providerAttempt,
          alertId,
          contactId,
          userId,
          auditInfo,
          respond,
        });
      }

      const providerMessageId =
        typeof resendResult.id === 'string' ? resendResult.id.trim() : '';
      if (!providerMessageId) {
        await requireDeliveryReconciliation(
          providerAttempt.id,
          'provider accepted request without email id',
        );
        return respond(
          {
            error: 'Emergency delivery requires provider reconciliation',
            status: 'reconciliation_required',
          },
          409,
        );
      }

      const providerAcceptedAt = new Date().toISOString();
      const { data: confirmedData, error: confirmError } =
        await supabaseAdmin.rpc('confirm_emergency_delivery_provider_acceptance', {
          p_delivery_id: providerAttempt.id,
          p_provider_message_id: providerMessageId,
          p_accepted_at: providerAcceptedAt,
        });
      if (confirmError || !confirmedData) {
        auditLog({
          timestamp: providerAcceptedAt,
          userId,
          action: 'emergency_email_provider_acceptance_persist_failed',
          resource: 'emergency_delivery_log',
          status: 'failure',
          details: {
            alertId,
            contactId,
            deliveryId: providerAttempt.id,
            providerMessageId,
            errorCode: confirmError?.code,
          },
          ...auditInfo,
        });
        return errorResponse(
          'Provider accepted emergency email but tracking persistence failed',
          500,
          confirmError,
        );
      }

      const confirmed = confirmedData as DeliveryRecord;
      auditLog({
        timestamp: providerAcceptedAt,
        userId,
        action: 'emergency_email_provider_accepted',
        resource: 'emergency_alerts',
        status: 'success',
        details: {
          alertId,
          contactId,
          deliveryId: providerAttempt.id,
          providerMessageId,
          providerAttemptCount: providerAttempt.provider_attempt_count,
          deliveryStatus: confirmed.status,
        },
        ...auditInfo,
      });

      const response: EmailResponse = {
        success: true,
        contactId,
        channel: 'email',
        timestamp: providerAcceptedAt,
        status: confirmed.status,
        metadata: {
          deliveryId: providerAttempt.id,
          providerAccepted: true,
          providerAttemptCount: providerAttempt.provider_attempt_count,
        },
      };
      return respond(response);
    } catch (error) {
      auditLog({
        timestamp: new Date().toISOString(),
        userId,
        action: 'emergency_email_failed',
        resource: 'emergency_alerts',
        status: 'failure',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        ...auditInfo,
      });
      return errorResponse('Failed to send emergency email', 500, error);
    }
  },
};

async function loadActiveOwnedContact(
  contactId: string,
  profileId: string,
  req: Request,
): Promise<
  | { contact: ContactRecord; response?: never }
  | { contact?: never; response: Response }
> {
  const { data, error } = await supabaseAdmin
    .from('emergency_contacts')
    .select('id, profile_id, name, email, is_active')
    .eq('id', contactId)
    .maybeSingle();
  if (error) {
    return {
      response: errorResponse('Failed to validate emergency contact', 500, error),
    };
  }
  if (!data) {
    return {
      response: jsonResponse(
        { error: 'Emergency contact not found' },
        404,
        ALLOWED_METHODS,
        req,
      ),
    };
  }

  const contact = data as ContactRecord;
  if (contact.profile_id !== profileId || contact.is_active === false) {
    return {
      response: jsonResponse(
        { error: 'Forbidden' },
        403,
        ALLOWED_METHODS,
        req,
      ),
    };
  }
  return { contact };
}

async function getLatestDelivery(
  alertId: string,
  contactId: string,
): Promise<DeliveryRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('emergency_delivery_log')
    .select(
      'id, status, attempt_count, provider_attempt_count, provider_message_id, dispatch_authorized_at, last_provider_attempt_at, cancelled_at, reconciliation_required_at, created_at, updated_at',
    )
    .eq('alert_id', alertId)
    .eq('contact_id', contactId)
    .eq('channel', 'email')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as DeliveryRecord | null) ?? null;
}

async function getDeliveryById(
  deliveryId: string,
): Promise<DeliveryRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('emergency_delivery_log')
    .select(
      'id, status, attempt_count, provider_attempt_count, provider_message_id, dispatch_authorized_at, last_provider_attempt_at, cancelled_at, reconciliation_required_at, created_at, updated_at',
    )
    .eq('id', deliveryId)
    .maybeSingle();
  if (error) throw error;
  return (data as DeliveryRecord | null) ?? null;
}

async function getProviderPayload(
  deliveryId: string,
): Promise<ProviderPayload | null> {
  const { data, error } = await supabaseAdmin.rpc(
    'get_emergency_email_provider_payload',
    { p_delivery_id: deliveryId },
  );
  if (error) throw error;
  return isProviderPayload(data) ? data : null;
}

async function requireDeliveryReconciliation(
  deliveryId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabaseAdmin.rpc(
    'require_emergency_delivery_reconciliation',
    {
      p_delivery_id: deliveryId,
      p_reason: reason,
    },
  );
  if (error) throw error;
}

async function markDeliveryFailed(
  deliveryId: string,
  message: string,
  metadata: Record<string, unknown> = {},
  expectedStatus: FailableDeliveryStatus = 'dispatching',
): Promise<DeliveryRecord | null> {
  const { data, error } = await supabaseAdmin.rpc(
    'fail_emergency_delivery_attempt',
    {
      p_delivery_id: deliveryId,
      p_expected_status: expectedStatus,
      p_error_message: message,
      p_metadata: metadata,
    },
  );
  if (error) throw error;
  return (data as DeliveryRecord | null) ?? null;
}

async function handleProviderFailure(input: {
  resendResponse: Response;
  resendResult: Record<string, unknown>;
  providerAttempt: DeliveryRecord;
  alertId: string;
  contactId: string;
  userId: string;
  auditInfo: Record<string, unknown>;
  respond: (body: Record<string, unknown>, status?: number) => Response;
}): Promise<Response> {
  const {
    resendResponse,
    resendResult,
    providerAttempt,
    alertId,
    contactId,
    userId,
    auditInfo,
    respond,
  } = input;
  const providerErrorCode = readProviderErrorCode(resendResult);
  const providerError = `Email provider returned HTTP ${resendResponse.status}`;

  if (
    resendResponse.status === 409 &&
    providerErrorCode === 'concurrent_idempotent_requests'
  ) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: 'emergency_email_provider_attempt_concurrent',
      resource: 'emergency_delivery_log',
      status: 'success',
      details: { alertId, contactId, deliveryId: providerAttempt.id },
      ...auditInfo,
    });
    return respond(
      {
        error: 'Emergency email provider attempt already in progress',
        status: 'dispatching',
      },
      409,
    );
  }

  if (resendResponse.status === 409) {
    await requireDeliveryReconciliation(
      providerAttempt.id,
      providerErrorCode
        ? `provider idempotency conflict: ${providerErrorCode}`
        : 'provider idempotency conflict',
    );
    return respond(
      {
        error: 'Emergency delivery requires provider reconciliation',
        status: 'reconciliation_required',
      },
      409,
    );
  }

  if (
    resendResponse.status === 408 ||
    resendResponse.status === 429 ||
    resendResponse.status >= 500
  ) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: 'emergency_email_provider_retryable_failure',
      resource: 'emergency_delivery_log',
      status: 'failure',
      details: {
        alertId,
        contactId,
        deliveryId: providerAttempt.id,
        providerStatus: resendResponse.status,
        providerErrorCode,
      },
      ...auditInfo,
    });
    return errorResponse('Emergency email provider temporarily unavailable', 502, {
      status: resendResponse.status,
      code: providerErrorCode,
    });
  }

  const failedOrCurrent = await markDeliveryFailed(
    providerAttempt.id,
    providerError,
    {
      provider: 'resend',
      provider_status: resendResponse.status,
      provider_error_code: providerErrorCode,
    },
    'dispatching',
  );
  auditLog({
    timestamp: new Date().toISOString(),
    userId,
    action: 'emergency_email_provider_failed',
    resource: 'emergency_alerts',
    status: 'failure',
    details: {
      alertId,
      contactId,
      deliveryId: providerAttempt.id,
      providerStatus: resendResponse.status,
      providerErrorCode,
      deliveryStatus: failedOrCurrent?.status ?? 'missing',
    },
    ...auditInfo,
  });
  return errorResponse('Failed to send emergency email', 502, {
    status: resendResponse.status,
    code: providerErrorCode,
  });
}

function isProviderPayload(value: unknown): value is ProviderPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.from === 'string' &&
    Array.isArray(payload.to) &&
    payload.to.length === 1 &&
    typeof payload.to[0] === 'string' &&
    typeof payload.subject === 'string' &&
    typeof payload.html === 'string' &&
    typeof payload.text === 'string' &&
    Array.isArray(payload.tags)
  );
}

function parseJsonObject(value: string): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function readProviderErrorCode(value: Record<string, unknown>): string | null {
  if (typeof value.name === 'string') return value.name;
  if (typeof value.code === 'string') return value.code;
  return null;
}

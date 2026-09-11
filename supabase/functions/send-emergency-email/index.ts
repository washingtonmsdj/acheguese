import { createClient } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '../_shared/businessAuth.ts';
import {
  auditLog,
  checkRateLimit,
  errorResponse,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  isOriginAllowed,
  isValidUUID,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireCronSecret,
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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

interface DeliveryRecord {
  id: string;
  status: DeliveryStatus;
  target?: string | null;
  metadata?: Record<string, unknown> | null;
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

const SUCCESSFUL_DELIVERY_STATUSES = new Set<DeliveryStatus>([
  'processing',
  'dispatching',
  'sent',
  'delivered',
]);

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

    const cronRequested = req.headers.has('x-cron-secret');
    let userId: string | undefined;

    if (cronRequested) {
      const cronAuthError = requireCronSecret(req, ALLOWED_METHODS);
      if (cronAuthError) {
        auditLog({
          timestamp: new Date().toISOString(),
          action: 'emergency_email_cron_auth_failed',
          resource: 'emergency_alerts',
          status: 'failure',
          details: { reason: 'invalid_cron_secret' },
          ...auditInfo,
        });
        return cronAuthError;
      }
    } else {
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

      userId = authResult.user.id;
      const userRateLimit = await checkRateLimit(
        `emergency-email:${userId}`,
        30,
        5 * 60 * 1000,
      );
      if (!userRateLimit.allowed) {
        return respond({ error: 'Rate limit exceeded. Try again later.' }, 429);
      }
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

      const { data: alertData, error: alertError } = await supabase
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
      if (!alert.profile_id) {
        return respond({ error: 'Emergency alert has no owner profile' }, 409);
      }

      let ownerProfile: UserProfileRecord | null = null;
      if (userId) {
        const { data: userProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .eq('user_id', userId);
        if (profileError) {
          return errorResponse('Failed to validate user profile', 500, profileError);
        }

        const profileRows = (userProfiles ?? []) as UserProfileRecord[];
        ownerProfile =
          profileRows.find((profile) => profile.id === alert.profile_id) ?? null;
        if (!ownerProfile) {
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
      } else {
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .eq('id', alert.profile_id)
          .maybeSingle();
        if (ownerError) {
          return errorResponse('Failed to load emergency alert owner', 500, ownerError);
        }
        if (!ownerData) {
          return respond({ error: 'Emergency alert owner profile is missing' }, 409);
        }
        ownerProfile = ownerData as UserProfileRecord;
      }

      const latestBeforeClaim = await getLatestDelivery(alertId, contactId);
      let dispatching: DeliveryRecord | null =
        latestBeforeClaim?.status === 'dispatching' ? latestBeforeClaim : null;

      if (!['active', 'acknowledged'].includes(alert.status) && !dispatching) {
        if (
          latestBeforeClaim &&
          [
            'sent',
            'delivered',
            'failed',
            'cancelled',
            'reconciliation_required',
          ].includes(latestBeforeClaim.status)
        ) {
          return respond(
            buildDeliveryOutcome(contactId, latestBeforeClaim, {
              terminalAlert: true,
            }),
          );
        }
        return respond({ error: 'Emergency alert is no longer actionable' }, 409);
      }

      if (!dispatching) {
        const { data: claimedData, error: claimError } = await supabase.rpc(
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

          if (
            [
              'processing',
              'dispatching',
              'sent',
              'delivered',
              'failed',
              'cancelled',
              'reconciliation_required',
            ].includes(latest.status)
          ) {
            return respond(
              buildDeliveryOutcome(contactId, latest, {
                idempotent: true,
                inProgress: ['processing', 'dispatching'].includes(latest.status),
              }),
            );
          }

          return respond(
            {
              error: 'Emergency delivery is not dispatchable',
              status: latest.status,
            },
            409,
          );
        }

        if (claimed.attempt_count > MAX_CLAIM_ATTEMPTS) {
          const failedOrCurrent = await markDeliveryFailed(
            claimed.id,
            `Claim attempt limit exceeded (${MAX_CLAIM_ATTEMPTS})`,
            {},
            'processing',
          );
          if (failedOrCurrent) {
            return respond(
              buildDeliveryOutcome(contactId, failedOrCurrent, {
                claimAttemptLimitExceeded: true,
              }),
            );
          }
          return respond(
            { error: 'Emergency delivery claim limit exceeded' },
            429,
          );
        }

        const contactEmail = extractEmail(claimed.target || '');
        if (!contactEmail) {
          const failedOrCurrent = await markDeliveryFailed(
            claimed.id,
            'Queued emergency delivery target is invalid',
            { reason: 'invalid_queued_target' },
            'processing',
          );
          if (failedOrCurrent) {
            return respond(
              buildDeliveryOutcome(contactId, failedOrCurrent, {
                invalidQueuedTarget: true,
              }),
            );
          }
          return errorResponse(
            'Failed to persist invalid emergency delivery target',
            500,
          );
        }

        const candidatePayload = buildEmergencyProviderPayload({
          deliveryId: claimed.id,
          fromName: EMAIL_FROM_NAME,
          fromDomain: EMAIL_FROM_DOMAIN,
          contactEmail,
          contactName: readQueuedContactName(claimed.metadata),
          userName: ownerProfile.name || 'Usuario',
          userPhone: ownerProfile.phone || 'Nao informado',
          alertType: alert.alert_type || 'sos',
          createdAt: alert.created_at || new Date().toISOString(),
          latitude: alert.latitude,
          longitude: alert.longitude,
          description: alert.description,
        });

        const { data: dispatchData, error: dispatchError } =
          await supabase.rpc('authorize_emergency_email_dispatch', {
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
            ...(userId ? { userId } : {}),
            action: 'emergency_email_dispatch_cancelled',
            resource: 'emergency_delivery_log',
            status: 'success',
            details: { alertId, contactId, deliveryId: claimed.id },
            ...auditInfo,
          });
          return respond({
            success: false,
            contactId,
            channel: 'email',
            timestamp: new Date().toISOString(),
            status: 'cancelled',
            error: 'Emergency delivery is no longer dispatchable',
            metadata: { deliveryId: claimed.id },
          });
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
        return respond({
          success: false,
          contactId,
          channel: 'email',
          timestamp: new Date().toISOString(),
          status: 'reconciliation_required',
          error: 'Emergency delivery requires provider reconciliation',
          metadata: { deliveryId: dispatching.id },
        });
      }

      const { data: providerAttemptData, error: providerAttemptError } =
        await supabase.rpc('begin_emergency_provider_attempt', {
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
        if (!current) {
          return errorResponse('Emergency delivery state is missing', 500);
        }

        return respond(
          buildDeliveryOutcome(contactId, current, {
            providerAttemptSuppressed: true,
          }),
        );
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
        return respond({
          success: false,
          contactId,
          channel: 'email',
          timestamp: new Date().toISOString(),
          status: 'reconciliation_required',
          error: 'Emergency delivery requires provider reconciliation',
          metadata: { deliveryId: providerAttempt.id },
        });
      }

      const providerAcceptedAt = new Date().toISOString();
      const { data: confirmedData, error: confirmError } =
        await supabase.rpc('confirm_emergency_delivery_provider_acceptance', {
          p_delivery_id: providerAttempt.id,
          p_provider_message_id: providerMessageId,
          p_accepted_at: providerAcceptedAt,
        });
      if (confirmError || !confirmedData) {
        auditLog({
          timestamp: providerAcceptedAt,
          ...(userId ? { userId } : {}),
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
        ...(userId ? { userId } : {}),
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
          actor: userId ? 'user' : 'cron',
        },
        ...auditInfo,
      });

      const response = buildDeliveryOutcome(
        contactId,
        confirmed,
        {
          providerAccepted: true,
          providerAttemptCount: providerAttempt.provider_attempt_count,
        },
        providerAcceptedAt,
      );
      return respond(response);
    } catch (error) {
      auditLog({
        timestamp: new Date().toISOString(),
        ...(userId ? { userId } : {}),
        action: 'emergency_email_failed',
        resource: 'emergency_alerts',
        status: 'failure',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          actor: userId ? 'user' : 'cron',
        },
        ...auditInfo,
      });
      return errorResponse('Failed to send emergency email', 500, error);
    }
  },
};

async function getLatestDelivery(
  alertId: string,
  contactId: string,
): Promise<DeliveryRecord | null> {
  const { data, error } = await supabase
    .from('emergency_delivery_log')
    .select(
      'id, status, target, metadata, attempt_count, provider_attempt_count, provider_message_id, dispatch_authorized_at, last_provider_attempt_at, cancelled_at, reconciliation_required_at, created_at, updated_at',
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
  const { data, error } = await supabase
    .from('emergency_delivery_log')
    .select(
      'id, status, target, metadata, attempt_count, provider_attempt_count, provider_message_id, dispatch_authorized_at, last_provider_attempt_at, cancelled_at, reconciliation_required_at, created_at, updated_at',
    )
    .eq('id', deliveryId)
    .maybeSingle();
  if (error) throw error;
  return (data as DeliveryRecord | null) ?? null;
}

async function getProviderPayload(
  deliveryId: string,
): Promise<ProviderPayload | null> {
  const { data, error } = await supabase.rpc(
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
  const { error } = await supabase.rpc(
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
  const { data, error } = await supabase.rpc(
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
  userId?: string;
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
      ...(userId ? { userId } : {}),
      action: 'emergency_email_provider_attempt_concurrent',
      resource: 'emergency_delivery_log',
      status: 'success',
      details: { alertId, contactId, deliveryId: providerAttempt.id },
      ...auditInfo,
    });
    return respond(
      buildDeliveryOutcome(contactId, providerAttempt, {
        providerAttemptConcurrent: true,
      }),
    );
  }

  if (resendResponse.status === 409) {
    await requireDeliveryReconciliation(
      providerAttempt.id,
      providerErrorCode
        ? `provider idempotency conflict: ${providerErrorCode}`
        : 'provider idempotency conflict',
    );
    return respond({
      success: false,
      contactId,
      channel: 'email',
      timestamp: new Date().toISOString(),
      status: 'reconciliation_required',
      error: 'Emergency delivery requires provider reconciliation',
      metadata: {
        deliveryId: providerAttempt.id,
        providerErrorCode,
      },
    });
  }

  if (
    resendResponse.status === 408 ||
    resendResponse.status === 429 ||
    resendResponse.status >= 500
  ) {
    auditLog({
      timestamp: new Date().toISOString(),
      ...(userId ? { userId } : {}),
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
    return respond(
      buildDeliveryOutcome(contactId, providerAttempt, {
        retryableProviderFailure: true,
        providerStatus: resendResponse.status,
        providerErrorCode,
      }),
    );
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
    ...(userId ? { userId } : {}),
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

  if (failedOrCurrent) {
    return respond(
      buildDeliveryOutcome(contactId, failedOrCurrent, {
        providerStatus: resendResponse.status,
        providerErrorCode,
      }),
    );
  }

  return errorResponse('Failed to persist emergency email provider failure', 500, {
    status: resendResponse.status,
    code: providerErrorCode,
  });
}

function buildDeliveryOutcome(
  contactId: string,
  delivery: Pick<DeliveryRecord, 'id' | 'status'>,
  metadata: Record<string, unknown> = {},
  timestamp = new Date().toISOString(),
): EmailResponse {
  const success = SUCCESSFUL_DELIVERY_STATUSES.has(delivery.status);
  const response: EmailResponse = {
    success,
    contactId,
    channel: 'email',
    timestamp,
    status: delivery.status,
    metadata: {
      deliveryId: delivery.id,
      ...metadata,
    },
  };

  if (!success) {
    response.error = deliveryStatusError(delivery.status);
  }

  return response;
}

function deliveryStatusError(status: DeliveryStatus): string {
  switch (status) {
    case 'failed':
      return 'Emergency delivery failed';
    case 'cancelled':
      return 'Emergency delivery was cancelled';
    case 'reconciliation_required':
      return 'Emergency delivery requires provider reconciliation';
    case 'pending':
      return 'Emergency delivery is still pending';
    default:
      return 'Emergency delivery did not complete';
  }
}

function readQueuedContactName(
  metadata: Record<string, unknown> | null | undefined,
): string {
  const value = metadata?.contact_name;
  if (typeof value !== 'string') return 'Contato';
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 100) : 'Contato';
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

import type { SupabaseClient } from '@supabase/supabase-js';
import { auditLog, getRequiredEnv } from '../_shared/security.ts';
import {
  buildEmergencyProviderPayload,
  extractEmail,
  type ProviderPayload,
} from './providerPayload.ts';

const RESEND_API_KEY = getRequiredEnv('RESEND_API_KEY');
const EMAIL_FROM_DOMAIN = getRequiredEnv('EMAIL_FROM_DOMAIN');
const EMAIL_FROM_NAME = getRequiredEnv('EMAIL_FROM_NAME');
const MAX_CLAIM_ATTEMPTS = 5;

export type DeliveryStatus =
  | 'pending'
  | 'processing'
  | 'dispatching'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'reconciliation_required';

export interface EmailDeliveryOutcome {
  success: boolean;
  contactId: string;
  channel: 'email';
  timestamp: string;
  status: DeliveryStatus;
  error?: string;
  metadata?: Record<string, unknown>;
}

export type EmergencyDeliveryActor =
  | {
      kind: 'user';
      userId: string;
      auditInfo?: Record<string, unknown>;
    }
  | {
      kind: 'system';
      workerId: string;
      auditInfo?: Record<string, unknown>;
    };

export class EmergencyDeliveryCommandError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'EmergencyDeliveryCommandError';
    this.status = status;
  }
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

export async function executeEmergencyEmailDelivery(input: {
  supabase: SupabaseClient;
  alertId: string;
  contactId: string;
  actor: EmergencyDeliveryActor;
}): Promise<EmailDeliveryOutcome> {
  const { supabase, alertId, contactId, actor } = input;

  const alert = await loadAlert(supabase, alertId);
  const ownerProfile = await authorizeAndLoadOwnerProfile(
    supabase,
    alert,
    actor,
  );

  const latestBeforeClaim = await getLatestDelivery(
    supabase,
    alertId,
    contactId,
  );
  let dispatching: DeliveryRecord | null =
    latestBeforeClaim?.status === 'dispatching' ? latestBeforeClaim : null;

  if (!['active', 'acknowledged'].includes(alert.status) && !dispatching) {
    if (
      latestBeforeClaim &&
      ['sent', 'delivered', 'failed', 'cancelled', 'reconciliation_required'].includes(
        latestBeforeClaim.status,
      )
    ) {
      return buildDeliveryOutcome(contactId, latestBeforeClaim, {
        terminalAlert: true,
      });
    }
    throw new EmergencyDeliveryCommandError(
      409,
      'Emergency alert is no longer actionable',
    );
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
    if (claimError) throw claimError;

    const claimed = claimedData as DeliveryRecord | null;
    if (!claimed) {
      const latest = await getLatestDelivery(supabase, alertId, contactId);
      if (!latest) {
        throw new EmergencyDeliveryCommandError(
          409,
          'No emergency delivery obligation',
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
        return buildDeliveryOutcome(contactId, latest, {
          idempotent: true,
          inProgress: ['processing', 'dispatching'].includes(latest.status),
        });
      }

      throw new EmergencyDeliveryCommandError(
        409,
        'Emergency delivery is not dispatchable',
      );
    }

    if (claimed.attempt_count > MAX_CLAIM_ATTEMPTS) {
      const failedOrCurrent = await markDeliveryFailed(
        supabase,
        claimed.id,
        `Claim attempt limit exceeded (${MAX_CLAIM_ATTEMPTS})`,
        {},
        'processing',
      );
      if (failedOrCurrent) {
        return buildDeliveryOutcome(contactId, failedOrCurrent, {
          claimAttemptLimitExceeded: true,
        });
      }
      throw new EmergencyDeliveryCommandError(
        429,
        'Emergency delivery claim limit exceeded',
      );
    }

    const queuedEmail = extractEmail(claimed.target || '');
    if (!queuedEmail) {
      const failedOrCurrent = await markDeliveryFailed(
        supabase,
        claimed.id,
        'Queued emergency delivery target is invalid',
        { reason: 'invalid_queued_target' },
        'processing',
      );
      if (failedOrCurrent) {
        return buildDeliveryOutcome(contactId, failedOrCurrent, {
          invalidQueuedTarget: true,
        });
      }
      throw new Error('Failed to persist invalid emergency delivery target');
    }

    const candidatePayload = buildEmergencyProviderPayload({
      deliveryId: claimed.id,
      fromName: EMAIL_FROM_NAME,
      fromDomain: EMAIL_FROM_DOMAIN,
      contactEmail: queuedEmail,
      contactName: readQueuedContactName(claimed.metadata),
      userName: ownerProfile.name || 'Usuario',
      userPhone: ownerProfile.phone || 'Nao informado',
      alertType: alert.alert_type || 'sos',
      createdAt: alert.created_at || new Date().toISOString(),
      latitude: alert.latitude,
      longitude: alert.longitude,
      description: alert.description,
    });

    const { data: dispatchData, error: dispatchError } = await supabase.rpc(
      'authorize_emergency_email_dispatch',
      {
        p_delivery_id: claimed.id,
        p_payload: candidatePayload,
      },
    );
    if (dispatchError) throw dispatchError;

    dispatching = dispatchData as DeliveryRecord | null;
    if (!dispatching) {
      auditDelivery(actor, {
        action: 'emergency_email_dispatch_cancelled',
        resource: 'emergency_delivery_log',
        status: 'success',
        details: { alertId, contactId, deliveryId: claimed.id },
      });
      return {
        success: false,
        contactId,
        channel: 'email',
        timestamp: new Date().toISOString(),
        status: 'cancelled',
        error: 'Emergency delivery is no longer dispatchable',
        metadata: { deliveryId: claimed.id },
      };
    }
  }

  const providerPayload = await getProviderPayload(supabase, dispatching.id);
  if (!providerPayload) {
    await requireDeliveryReconciliation(
      supabase,
      dispatching.id,
      'dispatching row missing immutable provider payload',
    );
    return {
      success: false,
      contactId,
      channel: 'email',
      timestamp: new Date().toISOString(),
      status: 'reconciliation_required',
      error: 'Emergency delivery requires provider reconciliation',
      metadata: { deliveryId: dispatching.id },
    };
  }

  const { data: providerAttemptData, error: providerAttemptError } =
    await supabase.rpc('begin_emergency_provider_attempt', {
      p_delivery_id: dispatching.id,
    });
  if (providerAttemptError) throw providerAttemptError;

  const providerAttempt = providerAttemptData as DeliveryRecord | null;
  if (!providerAttempt) {
    const current = await getDeliveryById(supabase, dispatching.id);
    if (!current) throw new Error('Emergency delivery state is missing');

    return buildDeliveryOutcome(contactId, current, {
      providerAttemptSuppressed: true,
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
      supabase,
      resendResponse,
      resendResult,
      providerAttempt,
      alertId,
      contactId,
      actor,
    });
  }

  const providerMessageId =
    typeof resendResult.id === 'string' ? resendResult.id.trim() : '';
  if (!providerMessageId) {
    await requireDeliveryReconciliation(
      supabase,
      providerAttempt.id,
      'provider accepted request without email id',
    );
    return {
      success: false,
      contactId,
      channel: 'email',
      timestamp: new Date().toISOString(),
      status: 'reconciliation_required',
      error: 'Emergency delivery requires provider reconciliation',
      metadata: { deliveryId: providerAttempt.id },
    };
  }

  const providerAcceptedAt = new Date().toISOString();
  const { data: confirmedData, error: confirmError } = await supabase.rpc(
    'confirm_emergency_delivery_provider_acceptance',
    {
      p_delivery_id: providerAttempt.id,
      p_provider_message_id: providerMessageId,
      p_accepted_at: providerAcceptedAt,
    },
  );
  if (confirmError || !confirmedData) {
    auditDelivery(actor, {
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
    });
    throw confirmError ?? new Error(
      'Provider accepted emergency email but tracking persistence failed',
    );
  }

  const confirmed = confirmedData as DeliveryRecord;
  auditDelivery(actor, {
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
  });

  return buildDeliveryOutcome(
    contactId,
    confirmed,
    {
      providerAccepted: true,
      providerAttemptCount: providerAttempt.provider_attempt_count,
    },
    providerAcceptedAt,
  );
}

async function loadAlert(
  supabase: SupabaseClient,
  alertId: string,
): Promise<AlertRecord> {
  const { data, error } = await supabase
    .from('emergency_alerts')
    .select(
      'id, profile_id, alert_type, status, description, latitude, longitude, created_at',
    )
    .eq('id', alertId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new EmergencyDeliveryCommandError(404, 'Alert not found');
  return data as AlertRecord;
}

async function authorizeAndLoadOwnerProfile(
  supabase: SupabaseClient,
  alert: AlertRecord,
  actor: EmergencyDeliveryActor,
): Promise<UserProfileRecord> {
  if (!alert.profile_id) {
    throw new EmergencyDeliveryCommandError(409, 'Emergency alert has no owner');
  }

  if (actor.kind === 'user') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('user_id', actor.userId);
    if (error) throw error;

    const profiles = (data ?? []) as UserProfileRecord[];
    const owner = profiles.find((profile) => profile.id === alert.profile_id);
    if (!owner) {
      auditDelivery(actor, {
        action: 'emergency_email_forbidden',
        resource: 'emergency_alerts',
        status: 'failure',
        details: { reason: 'alert_not_owned_by_user', alertId: alert.id },
      });
      throw new EmergencyDeliveryCommandError(403, 'Forbidden');
    }
    return owner;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, phone')
    .eq('id', alert.profile_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new EmergencyDeliveryCommandError(
      409,
      'Emergency alert owner profile is missing',
    );
  }
  return data as UserProfileRecord;
}

async function getLatestDelivery(
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient;
  resendResponse: Response;
  resendResult: Record<string, unknown>;
  providerAttempt: DeliveryRecord;
  alertId: string;
  contactId: string;
  actor: EmergencyDeliveryActor;
}): Promise<EmailDeliveryOutcome> {
  const {
    supabase,
    resendResponse,
    resendResult,
    providerAttempt,
    alertId,
    contactId,
    actor,
  } = input;
  const providerErrorCode = readProviderErrorCode(resendResult);
  const providerError = `Email provider returned HTTP ${resendResponse.status}`;

  if (
    resendResponse.status === 409 &&
    providerErrorCode === 'concurrent_idempotent_requests'
  ) {
    auditDelivery(actor, {
      action: 'emergency_email_provider_attempt_concurrent',
      resource: 'emergency_delivery_log',
      status: 'success',
      details: { alertId, contactId, deliveryId: providerAttempt.id },
    });
    return buildDeliveryOutcome(contactId, providerAttempt, {
      providerAttemptConcurrent: true,
    });
  }

  if (resendResponse.status === 409) {
    await requireDeliveryReconciliation(
      supabase,
      providerAttempt.id,
      providerErrorCode
        ? `provider idempotency conflict: ${providerErrorCode}`
        : 'provider idempotency conflict',
    );
    return {
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
    };
  }

  if (
    resendResponse.status === 408 ||
    resendResponse.status === 429 ||
    resendResponse.status >= 500
  ) {
    auditDelivery(actor, {
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
    });
    return buildDeliveryOutcome(contactId, providerAttempt, {
      retryableProviderFailure: true,
      providerStatus: resendResponse.status,
      providerErrorCode,
    });
  }

  const failedOrCurrent = await markDeliveryFailed(
    supabase,
    providerAttempt.id,
    providerError,
    {
      provider: 'resend',
      provider_status: resendResponse.status,
      provider_error_code: providerErrorCode,
    },
    'dispatching',
  );
  auditDelivery(actor, {
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
  });

  if (failedOrCurrent) {
    return buildDeliveryOutcome(contactId, failedOrCurrent, {
      providerStatus: resendResponse.status,
      providerErrorCode,
    });
  }

  throw new Error('Failed to persist emergency email provider failure');
}

function buildDeliveryOutcome(
  contactId: string,
  delivery: Pick<DeliveryRecord, 'id' | 'status'>,
  metadata: Record<string, unknown> = {},
  timestamp = new Date().toISOString(),
): EmailDeliveryOutcome {
  const success = SUCCESSFUL_DELIVERY_STATUSES.has(delivery.status);
  const response: EmailDeliveryOutcome = {
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

  if (!success) response.error = deliveryStatusError(delivery.status);
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
  return typeof value === 'string' && value.trim() ? value.trim() : 'Contato';
}

function auditDelivery(
  actor: EmergencyDeliveryActor,
  event: {
    action: string;
    resource: string;
    status: 'success' | 'failure';
    details?: Record<string, unknown>;
  },
): void {
  auditLog({
    timestamp: new Date().toISOString(),
    ...(actor.kind === 'user' ? { userId: actor.userId } : {}),
    action: event.action,
    resource: event.resource,
    status: event.status,
    details: {
      ...(event.details ?? {}),
      actorKind: actor.kind,
      ...(actor.kind === 'system' ? { workerId: actor.workerId } : {}),
    },
    ...(actor.auditInfo ?? {}),
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

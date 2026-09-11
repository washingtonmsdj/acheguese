import { createClient } from '@supabase/supabase-js';
import {
  getAllSecurityHeaders,
  getRequiredEnv,
  isOriginAllowed,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireCronSecret,
  requireHttpMethod,
} from '../_shared/security.ts';
import {
  EmergencyDeliveryCommandError,
  executeEmergencyEmailDelivery,
  type DeliveryStatus,
} from '../send-emergency-email/deliveryExecutor.ts';

const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const ALLOWED_METHODS = 'POST, OPTIONS';
const DEFAULT_BATCH_LIMIT = 10;
const MAX_BATCH_LIMIT = 25;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface WorkerRequest {
  limit?: unknown;
}

interface WorkCandidate {
  delivery_id: string;
  alert_id: string;
  contact_id: string;
  status: string;
}

function emptyStatusCounts(): Record<DeliveryStatus, number> {
  return {
    pending: 0,
    processing: 0,
    dispatching: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    cancelled: 0,
    reconciliation_required: 0,
  };
}

export default {
  async fetch(req: Request): Promise<Response> {
    const respond = (body: Record<string, unknown>, status = 200) =>
      jsonResponse(body, status, ALLOWED_METHODS, req);

    const origin = req.headers.get('origin');
    if (origin && !isOriginAllowed(origin)) {
      return respond({ success: false, error: 'Origin not allowed' }, 403);
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        status: 204,
        headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
      });
    }

    const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
    if (methodError) return methodError;

    const rateLimitResponse = await rateLimitMiddleware(req, 30, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const cronAuthError = requireCronSecret(req, ALLOWED_METHODS);
    if (cronAuthError) return cronAuthError;

    const body = await readJsonBody<WorkerRequest>(req, {
      maxBytes: 1024,
      methods: ALLOWED_METHODS,
    });
    if (!body.ok) return body.response;

    const limit = normalizeLimit(body.data.limit);
    if (limit === null) {
      return respond(
        { success: false, error: `limit must be an integer from 1 to ${MAX_BATCH_LIMIT}` },
        400,
      );
    }

    const startedAt = Date.now();
    const { data, error } = await supabase.rpc(
      'prepare_emergency_delivery_work',
      { p_limit: limit },
    );
    if (error) {
      console.error('[process-emergency-delivery-outbox] prepare failed', {
        code: error.code,
      });
      return respond(
        { success: false, error: 'Failed to prepare emergency delivery work' },
        500,
      );
    }

    const candidates = Array.isArray(data) ? (data as WorkCandidate[]) : [];
    const outcomes = emptyStatusCounts();
    let commandRejected = 0;
    let unexpectedErrors = 0;

    for (const candidate of candidates) {
      try {
        const outcome = await executeEmergencyEmailDelivery({
          supabase,
          alertId: candidate.alert_id,
          contactId: candidate.contact_id,
          actor: {
            kind: 'system',
            workerId: 'emergency-delivery-cron',
          },
        });
        outcomes[outcome.status] += 1;
      } catch (workerError) {
        if (workerError instanceof EmergencyDeliveryCommandError) {
          commandRejected += 1;
          console.warn('[process-emergency-delivery-outbox] candidate rejected', {
            status: workerError.status,
            reason: workerError.message,
          });
          continue;
        }

        unexpectedErrors += 1;
        console.error('[process-emergency-delivery-outbox] candidate failed', {
          error:
            workerError instanceof Error
              ? workerError.message
              : 'Unexpected worker error',
        });
      }
    }

    return respond({
      success: unexpectedErrors === 0,
      processed: candidates.length,
      commandRejected,
      unexpectedErrors,
      outcomes,
      executionTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  },
};

function normalizeLimit(value: unknown): number | null {
  if (value === undefined) return DEFAULT_BATCH_LIMIT;
  if (!Number.isInteger(value)) return null;

  const limit = Number(value);
  return limit >= 1 && limit <= MAX_BATCH_LIMIT ? limit : null;
}

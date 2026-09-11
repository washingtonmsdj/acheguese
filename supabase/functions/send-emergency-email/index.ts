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
  requireHttpMethod,
} from '../_shared/security.ts';
import {
  EmergencyDeliveryCommandError,
  executeEmergencyEmailDelivery,
} from './deliveryExecutor.ts';

const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const ALLOWED_METHODS = 'POST, OPTIONS';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface EmailRequest {
  contactId: string;
  alertId: string;
}

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

      const outcome = await executeEmergencyEmailDelivery({
        supabase,
        alertId,
        contactId,
        actor: {
          kind: 'user',
          userId,
          auditInfo,
        },
      });
      return respond(outcome);
    } catch (error) {
      if (error instanceof EmergencyDeliveryCommandError) {
        return respond({ error: error.message }, error.status);
      }

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
      return errorResponse('Failed to process emergency email', 500, error);
    }
  },
};

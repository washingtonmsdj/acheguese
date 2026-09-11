import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';
import {
  getRequiredEnv,
  isValidUUID,
  jsonResponse,
  readTextBody,
  requireHttpMethod,
} from '../_shared/security.ts';

const ALLOWED_METHODS = 'POST';
const MAX_WEBHOOK_BYTES = 256_000;
const SUPPORTED_EVENTS = new Set([
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.bounced',
  'email.complained',
  'email.failed',
  'email.suppressed',
]);

type ResendWebhookEvent = {
  type?: unknown;
  created_at?: unknown;
  data?: {
    email_id?: unknown;
    tags?: unknown;
  } | null;
};

type EventTags = Record<string, string>;

const supabaseAdmin = createClient(
  getRequiredEnv('SUPABASE_URL'),
  getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const webhookVerifier = new Webhook(getRequiredEnv('RESEND_WEBHOOK_SECRET'));

export default {
  async fetch(req: Request): Promise<Response> {
    const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
    if (methodError) return methodError;

    const svixId = req.headers.get('svix-id')?.trim() ?? '';
    const svixTimestamp = req.headers.get('svix-timestamp')?.trim() ?? '';
    const svixSignature = req.headers.get('svix-signature')?.trim() ?? '';

    if (!svixId || !svixTimestamp || !svixSignature) {
      return jsonResponse(
        { error: 'Missing webhook signature headers' },
        401,
        ALLOWED_METHODS,
        req,
      );
    }

    const rawBody = await readTextBody(req, {
      maxBytes: MAX_WEBHOOK_BYTES,
      methods: ALLOWED_METHODS,
    });
    if (!rawBody.ok) return rawBody.response;

    let verified: ResendWebhookEvent;
    try {
      verified = webhookVerifier.verify(rawBody.data, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendWebhookEvent;
    } catch {
      return jsonResponse(
        { error: 'Invalid webhook signature' },
        401,
        ALLOWED_METHODS,
        req,
      );
    }

    const eventType = typeof verified.type === 'string' ? verified.type : '';
    if (!SUPPORTED_EVENTS.has(eventType)) {
      return jsonResponse(
        { received: true, ignored: true },
        200,
        ALLOWED_METHODS,
        req,
      );
    }

    const eventCreatedAt = normalizeIsoDate(verified.created_at);
    const providerMessageId =
      typeof verified.data?.email_id === 'string'
        ? verified.data.email_id.trim()
        : '';

    if (!eventCreatedAt || !providerMessageId) {
      return jsonResponse(
        { error: 'Invalid emergency email webhook payload' },
        400,
        ALLOWED_METHODS,
        req,
      );
    }

    const tags = normalizeTags(verified.data?.tags);
    const taggedDeliveryId = tags?.acheguese_delivery_id ?? null;
    const deliveryId =
      taggedDeliveryId && isValidUUID(taggedDeliveryId)
        ? taggedDeliveryId
        : null;

    const { data, error } = await supabaseAdmin.rpc(
      'apply_emergency_delivery_provider_event',
      {
        p_provider_event_id: svixId,
        p_event_type: eventType,
        p_provider_message_id: providerMessageId,
        p_delivery_id: deliveryId,
        p_event_created_at: eventCreatedAt,
      },
    );

    if (error) {
      console.error('[resend-emergency-webhook] provider event apply failed', {
        code: error.code,
        eventType,
        svixId,
      });
      return jsonResponse(
        { error: 'Failed to apply provider event' },
        500,
        ALLOWED_METHODS,
        req,
      );
    }

    if (!data) {
      return jsonResponse(
        { received: true, ignored: true },
        200,
        ALLOWED_METHODS,
        req,
      );
    }

    return jsonResponse(
      { received: true },
      200,
      ALLOWED_METHODS,
      req,
    );
  },
};

function normalizeTags(value: unknown): EventTags | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const tags: EventTags = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') tags[key] = entry;
  }
  return tags;
}

function normalizeIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

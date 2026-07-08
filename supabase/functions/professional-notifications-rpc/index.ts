/**
 * Edge Function: professional-notifications-rpc
 *
 * Authenticated broker for Professional/Leads notifications. Browser clients
 * never pass recipient user_id; this function resolves recipients from
 * validated lead, message, quote and professional ownership records.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  auditLog,
  extractBearerToken,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = {
  leadMessage: true,
  leadQuote: true,
} as const;

type ProfessionalNotificationAction = keyof typeof ACTIONS;
type SupabaseClient = ReturnType<typeof createClient>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
}

interface LeadRow {
  id: string;
  professional_id: string;
  requester_user_id: string | null;
  service_needed: string | null;
}

interface MessageRow {
  id: string;
  lead_id: string;
  sender_user_id: string | null;
  sender_role: "requester" | "professional" | "system";
  message: string | null;
}

interface QuoteRow {
  id: string;
  lead_id: string;
  professional_user_id: string | null;
  description: string | null;
  status: string | null;
}

interface ProfessionalOwnerRecord {
  id: string;
  profile_id: string;
  professional_name: string | null;
  service_category: string | null;
  profiles: { user_id: string | null } | { user_id: string | null }[] | null;
}

interface LeadContext {
  lead: LeadRow;
  owner: ProfessionalOwnerRecord | null;
  ownerUserId: string | null;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function cleanPreview(value: unknown, maxLength = 160): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function firstProfileUserId(
  profiles: ProfessionalOwnerRecord["profiles"],
): string | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) {
    return profiles[0]?.user_id ?? null;
  }
  return profiles.user_id ?? null;
}

function isLeadParticipant(
  userId: string,
  lead: LeadRow,
  ownerUserId: string | null,
): boolean {
  return lead.requester_user_id === userId || ownerUserId === userId;
}

async function requireUser(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<UserAuthResult | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse({ error: "Missing or invalid authorization header" }, 401, ALLOWED_METHODS, req);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401, ALLOWED_METHODS, req);
  }

  return { userId: data.user.id };
}

async function getLeadById(
  supabaseAdmin: SupabaseClient,
  leadId: string,
): Promise<LeadRow | null> {
  const { data, error } = await supabaseAdmin
    .from("professional_leads")
    .select("id,professional_id,requester_user_id,service_needed")
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  return data as LeadRow | null;
}

async function getProfessionalOwner(
  supabaseAdmin: SupabaseClient,
  professionalId: string,
): Promise<ProfessionalOwnerRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("professional_data")
    .select("id,profile_id,professional_name,service_category,profiles!inner(user_id)")
    .eq("id", professionalId)
    .maybeSingle();

  if (error) throw error;
  return data as ProfessionalOwnerRecord | null;
}

async function getLeadContext(
  supabaseAdmin: SupabaseClient,
  leadId: string,
): Promise<LeadContext> {
  const lead = await getLeadById(supabaseAdmin, leadId);
  if (!lead) {
    throw new RequestValidationError("Lead not found");
  }

  const owner = await getProfessionalOwner(supabaseAdmin, lead.professional_id);
  const ownerUserId = firstProfileUserId(owner?.profiles ?? null);

  return { lead, owner, ownerUserId };
}

async function getMessageById(
  supabaseAdmin: SupabaseClient,
  messageId: string,
): Promise<MessageRow | null> {
  const { data, error } = await supabaseAdmin
    .from("professional_lead_messages")
    .select("id,lead_id,sender_user_id,sender_role,message")
    .eq("id", messageId)
    .maybeSingle();

  if (error) throw error;
  return data as MessageRow | null;
}

async function getQuoteById(
  supabaseAdmin: SupabaseClient,
  quoteId: string,
): Promise<QuoteRow | null> {
  const { data, error } = await supabaseAdmin
    .from("professional_lead_quotes")
    .select("id,lead_id,professional_user_id,description,status")
    .eq("id", quoteId)
    .maybeSingle();

  if (error) throw error;
  return data as QuoteRow | null;
}

async function createNotification(
  supabaseAdmin: SupabaseClient,
  userId: string,
  title: string,
  message: string,
  actionUrl: string,
  actionLabel: string,
  metadata: Record<string, unknown>,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc("create_notification", {
    p_user_id: userId,
    p_type: "info",
    p_category: "transactional",
    p_title: title,
    p_message: message,
    p_action_url: actionUrl,
    p_action_label: actionLabel,
    p_metadata: metadata,
  });

  if (error) throw error;
  return data as string | null;
}

async function handleLeadMessage(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const messageId = requireUuid(params.messageId ?? params.message_id, "messageId");
  const message = await getMessageById(supabaseAdmin, messageId);
  if (!message) {
    throw new RequestValidationError("Message not found");
  }

  if (message.sender_user_id !== userId) {
    throw new RequestValidationError("Message sender does not match authenticated user");
  }

  if (message.sender_role !== "professional" && message.sender_role !== "requester") {
    throw new RequestValidationError("Unsupported message sender role");
  }

  const { lead, ownerUserId } = await getLeadContext(supabaseAdmin, message.lead_id);
  if (!isLeadParticipant(userId, lead, ownerUserId)) {
    throw new RequestValidationError("Authenticated user is not a lead participant");
  }

  const senderIsProfessional = message.sender_role === "professional";
  if (senderIsProfessional && ownerUserId !== userId) {
    throw new RequestValidationError("Professional message sender mismatch");
  }
  if (!senderIsProfessional && lead.requester_user_id !== userId) {
    throw new RequestValidationError("Requester message sender mismatch");
  }

  const recipientUserId = senderIsProfessional ? lead.requester_user_id : ownerUserId;
  if (!recipientUserId) {
    return { notificationId: null, skipped: true, reason: "recipient_without_user" };
  }
  if (recipientUserId === userId) {
    return { notificationId: null, skipped: true, reason: "self_event" };
  }

  const notificationId = await createNotification(
    supabaseAdmin,
    recipientUserId,
    senderIsProfessional ? "Resposta do profissional" : "Nova mensagem no orcamento",
    cleanPreview(message.message),
    senderIsProfessional ? `/servicos/orcamentos/${lead.id}` : "/central/profissional",
    "Abrir orcamento",
    {
      domain: "professional",
      event: "lead_message",
      lead_id: lead.id,
      professional_id: lead.professional_id,
      message_id: message.id,
      sender_role: message.sender_role,
      content_preview: cleanPreview(message.message),
    },
  );

  return { notificationId, skipped: notificationId === null };
}

async function handleLeadQuote(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const quoteId = requireUuid(params.quoteId ?? params.quote_id, "quoteId");
  const quote = await getQuoteById(supabaseAdmin, quoteId);
  if (!quote) {
    throw new RequestValidationError("Quote not found");
  }

  if (quote.professional_user_id !== userId) {
    throw new RequestValidationError("Quote professional does not match authenticated user");
  }

  const { lead, ownerUserId } = await getLeadContext(supabaseAdmin, quote.lead_id);
  if (ownerUserId !== userId) {
    throw new RequestValidationError("Authenticated user is not the professional owner");
  }

  if (!lead.requester_user_id) {
    return { notificationId: null, skipped: true, reason: "recipient_without_user" };
  }
  if (lead.requester_user_id === userId) {
    return { notificationId: null, skipped: true, reason: "self_event" };
  }

  const notificationId = await createNotification(
    supabaseAdmin,
    lead.requester_user_id,
    "Proposta de orcamento recebida",
    cleanPreview(quote.description),
    `/servicos/orcamentos/${lead.id}`,
    "Ver proposta",
    {
      domain: "professional",
      event: "lead_quote",
      lead_id: lead.id,
      professional_id: lead.professional_id,
      quote_id: quote.id,
      quote_status: quote.status,
      content_preview: cleanPreview(quote.description),
    },
  );

  return { notificationId, skipped: notificationId === null };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  userId: string,
  action: ProfessionalNotificationAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "leadMessage":
      return handleLeadMessage(supabaseAdmin, userId, params);
    case "leadQuote":
      return handleLeadQuote(supabaseAdmin, userId, params);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 120, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseAdmin = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const auth = await requireUser(req, supabaseAdmin);
  if (auth instanceof Response) return auth;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 16_384,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as ProfessionalNotificationAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth.userId, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `professional_notification_${safeAction}`,
      resource: "professional-notifications-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[professional-notifications-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `professional_notification_${safeAction}`,
      resource: "professional-notifications-rpc",
      status: "failure",
      details: { action: safeAction, reason: "notification_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});

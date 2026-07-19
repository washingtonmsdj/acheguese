/**
 * Edge Function: delivery-rpc
 *
 * Authenticated broker for order/delivery mutation RPCs. Browser clients never
 * execute the backing SECURITY DEFINER functions directly.
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
const MAX_BODY_BYTES = 131_072;
const MAX_ITEMS = 100;
const MAX_TEXT_LENGTH = 1_000;
const MAX_REFERENCE_LENGTH = 256;
const MAX_PAYMENT_REFERENCE_LENGTH = 512;
const MAX_MONEY_VALUE = 1_000_000;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIONS = {
  createOrder: true,
  transitionLogisticsStatus: true,
  markPickedUp: true,
  attachDeliveryProof: true,
  markDelivered: true,
  transitionFinancialStatus: true,
  updateOrderNotes: true,
  updateOrderSourceMetadata: true,
  reportOccurrence: true,
  resolveOccurrence: true,
} as const;

const PAYMENT_MODES = new Set(["direct_to_merchant", "platform_checkout"]);
const DELIVERY_MODES = new Set([
  "merchant_own_fleet",
  "platform_courier_network",
]);
const FINANCIAL_STATUSES = new Set([
  "not_applicable",
  "pending_payment",
  "paid",
  "refunded",
  "partially_refunded",
  "payout_pending",
  "payout_sent",
  "payout_failed",
]);
const LOGISTICS_STATUSES = new Set([
  "pending",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "delivered",
  "canceled",
  "failed",
]);
const ORDER_SOURCE_TYPES = new Set([
  "manual",
  "business",
  "gastronomy",
  "service",
]);
const OCCURRENCE_TYPES = new Set([
  "recipient_unavailable",
  "address_issue",
  "traffic_delay",
  "vehicle_issue",
  "safety_issue",
  "package_issue",
  "other",
]);
const OCCURRENCE_SEVERITIES = new Set([
  "low",
  "medium",
  "high",
  "critical",
]);

type DeliveryRpcAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;
type ActorRole = "customer" | "merchant" | "courier" | "platform";

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
  isProjectAdmin: boolean;
}

interface OrderRow {
  id: string;
  customer_profile_id: string;
  merchant_profile_id: string;
  courier_profile_id: string | null;
  logistics_status: string;
  financial_status: string;
}

interface ActorPermissions {
  allowCustomer: boolean;
  allowMerchant: boolean;
  allowCourier: boolean;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

class RequestAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestAuthorizationError";
  }
}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireUuid(value, field);
}

function requireEnum(
  value: unknown,
  field: string,
  allowedValues: Set<string>,
): string {
  if (typeof value !== "string" || !allowedValues.has(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function optionalText(
  value: unknown,
  field: string,
  maxLength = MAX_TEXT_LENGTH,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value.trim().slice(0, maxLength) || null;
}

function requireText(
  value: unknown,
  field: string,
  maxLength = MAX_TEXT_LENGTH,
): string {
  const text = optionalText(value, field, maxLength);
  if (!text) throw new RequestValidationError(`Invalid ${field}`);
  return text;
}

function requireMoney(value: unknown, field: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > MAX_MONEY_VALUE
  ) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function optionalMoney(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null;
  return requireMoney(value, field);
}

function normalizeObject(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (!isPlainObject(value)) throw new RequestValidationError(`Invalid ${field}`);
  return value;
}

function normalizeProof(value: unknown, required = false): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    if (required) throw new RequestValidationError("Invalid proof");
    return null;
  }
  const proof = normalizeObject(value, "proof");
  for (const key of ["photo_url", "code", "observation", "signed_at"]) {
    if (proof[key] !== undefined && proof[key] !== null && typeof proof[key] !== "string") {
      throw new RequestValidationError(`Invalid proof.${key}`);
    }
  }
  return proof;
}

function normalizeOrderItems(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) {
    throw new RequestValidationError("Invalid orderItems");
  }

  return value.map((rawItem, index) => {
    const item = normalizeObject(rawItem, `orderItems[${index}]`);
    const name = requireText(item.name, `orderItems[${index}].name`, 200);
    const quantity = item.quantity;
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 1_000) {
      throw new RequestValidationError(`Invalid orderItems[${index}].quantity`);
    }

    return {
      source_item_id: optionalText(item.source_item_id, `orderItems[${index}].source_item_id`, 128),
      sku: optionalText(item.sku, `orderItems[${index}].sku`, 128),
      name,
      quantity,
      unit_price: requireMoney(item.unit_price, `orderItems[${index}].unit_price`),
      addons_total: optionalMoney(item.addons_total, `orderItems[${index}].addons_total`) ?? 0,
      line_total: optionalMoney(item.line_total, `orderItems[${index}].line_total`) ?? null,
      notes: optionalText(item.notes, `orderItems[${index}].notes`, 500),
      item_snapshot: normalizeObject(item.item_snapshot, `orderItems[${index}].item_snapshot`),
      metadata: normalizeObject(item.metadata, `orderItems[${index}].metadata`),
    };
  });
}

async function isProjectAdmin(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .in("role_enum", ["admin", "super_admin"])
    .is("revoked_at", null)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

async function requireUser(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<UserAuthResult | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse(
      { error: "Missing or invalid authorization header" },
      401,
      ALLOWED_METHODS,
      req,
    );
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return jsonResponse(
      { error: "Invalid or expired token" },
      401,
      ALLOWED_METHODS,
      req,
    );
  }

  return {
    userId: data.user.id,
    isProjectAdmin: await isProjectAdmin(supabaseAdmin, data.user.id),
  };
}

async function profileExists(
  supabaseAdmin: SupabaseClient,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function canAccessProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  profileId: string,
): Promise<boolean> {
  const { data: ownerProfile, error: ownerError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (ownerError) throw ownerError;
  if (ownerProfile) return true;

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("profile_members")
    .select("id")
    .eq("profile_id", profileId)
    .eq("user_id", auth.userId)
    .eq("is_active", true)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (membership) return true;

  if (!auth.isProjectAdmin) return false;
  return profileExists(supabaseAdmin, profileId);
}

async function requireAccessibleProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  profileId: string,
): Promise<void> {
  if (!await canAccessProfile(supabaseAdmin, auth, profileId)) {
    throw new RequestAuthorizationError("Actor profile is not available to this user");
  }
}

async function getOrder(
  supabaseAdmin: SupabaseClient,
  orderId: string,
): Promise<OrderRow> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, customer_profile_id, merchant_profile_id, courier_profile_id, logistics_status, financial_status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestValidationError("Order was not found");
  return data as OrderRow;
}

async function requireOrderActor(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  order: OrderRow,
  actorProfileId: string,
  permissions: ActorPermissions,
): Promise<ActorRole> {
  await requireAccessibleProfile(supabaseAdmin, auth, actorProfileId);

  if (permissions.allowCustomer && order.customer_profile_id === actorProfileId) {
    return "customer";
  }
  if (permissions.allowMerchant && order.merchant_profile_id === actorProfileId) {
    return "merchant";
  }
  if (permissions.allowCourier && order.courier_profile_id === actorProfileId) {
    return "courier";
  }
  if (auth.isProjectAdmin) return "platform";

  throw new RequestAuthorizationError("Actor profile cannot mutate this order");
}

async function requireCreateOrderActor(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  customerProfileId: string,
  merchantProfileId: string,
  actorProfileId: string,
): Promise<void> {
  await requireAccessibleProfile(supabaseAdmin, auth, actorProfileId);

  if (
    actorProfileId === customerProfileId ||
    actorProfileId === merchantProfileId ||
    auth.isProjectAdmin
  ) {
    return;
  }

  throw new RequestAuthorizationError("Actor profile cannot create this order");
}

async function handleCreateOrder(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const customerProfileId = requireUuid(
    params.customerProfileId ?? params.customer_profile_id,
    "customerProfileId",
  );
  const merchantProfileId = requireUuid(
    params.merchantProfileId ?? params.merchant_profile_id,
    "merchantProfileId",
  );
  const courierProfileId = optionalUuid(
    params.courierProfileId ?? params.courier_profile_id,
    "courierProfileId",
  );
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );

  await requireCreateOrderActor(
    supabaseAdmin,
    auth,
    customerProfileId,
    merchantProfileId,
    actorProfileId,
  );

  const { data, error } = await supabaseAdmin.rpc("delivery_create_order", {
    p_customer_profile_id: customerProfileId,
    p_merchant_profile_id: merchantProfileId,
    p_courier_profile_id: courierProfileId,
    p_payment_mode: requireEnum(params.paymentMode ?? params.payment_mode, "paymentMode", PAYMENT_MODES),
    p_delivery_mode: requireEnum(params.deliveryMode ?? params.delivery_mode, "deliveryMode", DELIVERY_MODES),
    p_financial_status: requireEnum(
      params.financialStatus ?? params.financial_status,
      "financialStatus",
      FINANCIAL_STATUSES,
    ),
    p_items_total: requireMoney(params.itemsTotal ?? params.items_total, "itemsTotal"),
    p_delivery_fee: requireMoney(params.deliveryFee ?? params.delivery_fee, "deliveryFee"),
    p_discount_total: requireMoney(params.discountTotal ?? params.discount_total, "discountTotal"),
    p_order_total: requireMoney(params.orderTotal ?? params.order_total, "orderTotal"),
    p_platform_fee_amount: optionalMoney(
      params.platformFeeAmount ?? params.platform_fee_amount,
      "platformFeeAmount",
    ),
    p_merchant_net_amount: optionalMoney(
      params.merchantNetAmount ?? params.merchant_net_amount,
      "merchantNetAmount",
    ),
    p_courier_amount: optionalMoney(params.courierAmount ?? params.courier_amount, "courierAmount"),
    p_source_type: requireEnum(params.sourceType ?? params.source_type, "sourceType", ORDER_SOURCE_TYPES),
    p_source_id: optionalText(params.sourceId ?? params.source_id, "sourceId", MAX_REFERENCE_LENGTH),
    p_source_reference: optionalText(
      params.sourceReference ?? params.source_reference,
      "sourceReference",
      MAX_REFERENCE_LENGTH,
    ),
    p_source_metadata: normalizeObject(params.sourceMetadata ?? params.source_metadata, "sourceMetadata"),
    p_order_items: normalizeOrderItems(params.orderItems ?? params.order_items),
    p_payment_method: optionalText(params.paymentMethod ?? params.payment_method, "paymentMethod", 80),
    p_external_payment_reference: optionalText(
      params.externalPaymentReference ?? params.external_payment_reference,
      "externalPaymentReference",
      MAX_PAYMENT_REFERENCE_LENGTH,
    ),
    p_notes: optionalText(params.notes, "notes"),
    p_actor_profile_id: actorProfileId,
  });

  if (error) throw error;
  return data;
}

async function handleTransitionLogisticsStatus(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: false,
    allowMerchant: true,
    allowCourier: true,
  });

  const { data, error } = await supabaseAdmin.rpc("delivery_transition_logistics_status", {
    p_order_id: orderId,
    p_to_status: requireEnum(params.toStatus ?? params.to_status, "toStatus", LOGISTICS_STATUSES),
    p_actor_profile_id: actorProfileId,
    p_reason: optionalText(params.reason, "reason"),
    p_metadata: normalizeObject(params.metadata, "metadata"),
  });

  if (error) throw error;
  return data;
}

async function handleMarkPickedUp(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const courierProfileId = optionalUuid(
    params.courierProfileId ?? params.courier_profile_id,
    "courierProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  const actorRole = await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: false,
    allowMerchant: true,
    allowCourier: true,
  });

  if (actorRole === "courier" && courierProfileId && courierProfileId !== actorProfileId) {
    throw new RequestAuthorizationError("Courier actor cannot assign another courier profile");
  }
  if (courierProfileId && !await profileExists(supabaseAdmin, courierProfileId)) {
    throw new RequestValidationError("Courier profile was not found");
  }

  const { data, error } = await supabaseAdmin.rpc("delivery_mark_picked_up", {
    p_order_id: orderId,
    p_actor_profile_id: actorProfileId,
    p_courier_profile_id: courierProfileId,
    p_reason: optionalText(params.reason, "reason"),
  });

  if (error) throw error;
  return data;
}

async function handleAttachDeliveryProof(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: false,
    allowMerchant: true,
    allowCourier: true,
  });

  const { data, error } = await supabaseAdmin.rpc("delivery_attach_delivery_proof", {
    p_order_id: orderId,
    p_actor_profile_id: actorProfileId,
    p_proof: normalizeProof(params.proof, true),
  });

  if (error) throw error;
  return data;
}

async function handleMarkDelivered(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: false,
    allowMerchant: true,
    allowCourier: true,
  });

  const { data, error } = await supabaseAdmin.rpc("delivery_mark_delivered", {
    p_order_id: orderId,
    p_actor_profile_id: actorProfileId,
    p_reason: optionalText(params.reason, "reason"),
    p_proof: normalizeProof(params.proof, false),
  });

  if (error) throw error;
  return data;
}

async function handleTransitionFinancialStatus(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: false,
    allowMerchant: true,
    allowCourier: false,
  });

  const { data, error } = await supabaseAdmin.rpc("delivery_transition_financial_status", {
    p_order_id: orderId,
    p_to_status: requireEnum(params.toStatus ?? params.to_status, "toStatus", FINANCIAL_STATUSES),
    p_actor_profile_id: actorProfileId,
    p_reason: optionalText(params.reason, "reason"),
    p_metadata: normalizeObject(params.metadata, "metadata"),
  });

  if (error) throw error;
  return data;
}

async function handleUpdateOrderNotes(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: true,
    allowMerchant: true,
    allowCourier: true,
  });

  const { data, error } = await supabaseAdmin.rpc("delivery_update_order_notes", {
    p_order_id: orderId,
    p_notes: requireText(params.notes, "notes"),
    p_actor_profile_id: actorProfileId,
    p_metadata: normalizeObject(params.metadata, "metadata"),
  });

  if (error) throw error;
  return data;
}

async function handleUpdateOrderSourceMetadata(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: true,
    allowMerchant: true,
    allowCourier: true,
  });

  const { data, error } = await supabaseAdmin.rpc("delivery_update_order_source_metadata", {
    p_order_id: orderId,
    p_actor_profile_id: actorProfileId,
    p_metadata_patch: normalizeObject(
      params.metadataPatch ?? params.metadata_patch,
      "metadataPatch",
    ),
  });

  if (error) throw error;
  return data;
}

async function handleReportOccurrence(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: false,
    allowMerchant: true,
    allowCourier: true,
  });

  const { data, error } = await supabaseAdmin.rpc("delivery_report_occurrence", {
    p_order_id: orderId,
    p_occurrence_type: requireEnum(
      params.occurrenceType ?? params.occurrence_type,
      "occurrenceType",
      OCCURRENCE_TYPES,
    ),
    p_description: requireText(params.description, "description"),
    p_actor_profile_id: actorProfileId,
    p_severity: requireEnum(params.severity ?? "medium", "severity", OCCURRENCE_SEVERITIES),
    p_metadata: normalizeObject(params.metadata, "metadata"),
  });

  if (error) throw error;
  return data;
}

async function handleResolveOccurrence(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const orderId = requireUuid(params.orderId ?? params.order_id, "orderId");
  const actorProfileId = requireUuid(
    params.actorProfileId ?? params.actor_profile_id,
    "actorProfileId",
  );
  const order = await getOrder(supabaseAdmin, orderId);
  await requireOrderActor(supabaseAdmin, auth, order, actorProfileId, {
    allowCustomer: false,
    allowMerchant: true,
    allowCourier: false,
  });

  const { data, error } = await supabaseAdmin.rpc("delivery_resolve_occurrence", {
    p_order_id: orderId,
    p_occurrence_id: requireUuid(
      params.occurrenceId ?? params.occurrence_id,
      "occurrenceId",
    ),
    p_actor_profile_id: actorProfileId,
    p_resolution_notes: requireText(
      params.resolutionNotes ?? params.resolution_notes,
      "resolutionNotes",
    ),
  });

  if (error) throw error;
  return data;
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: DeliveryRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "createOrder":
      return handleCreateOrder(supabaseAdmin, auth, params);
    case "transitionLogisticsStatus":
      return handleTransitionLogisticsStatus(supabaseAdmin, auth, params);
    case "markPickedUp":
      return handleMarkPickedUp(supabaseAdmin, auth, params);
    case "attachDeliveryProof":
      return handleAttachDeliveryProof(supabaseAdmin, auth, params);
    case "markDelivered":
      return handleMarkDelivered(supabaseAdmin, auth, params);
    case "transitionFinancialStatus":
      return handleTransitionFinancialStatus(supabaseAdmin, auth, params);
    case "updateOrderNotes":
      return handleUpdateOrderNotes(supabaseAdmin, auth, params);
    case "updateOrderSourceMetadata":
      return handleUpdateOrderSourceMetadata(supabaseAdmin, auth, params);
    case "reportOccurrence":
      return handleReportOccurrence(supabaseAdmin, auth, params);
    case "resolveOccurrence":
      return handleResolveOccurrence(supabaseAdmin, auth, params);
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
    maxBytes: MAX_BODY_BYTES,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as DeliveryRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `delivery_rpc_${safeAction}`,
      resource: "delivery-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }
    if (error instanceof RequestAuthorizationError) {
      return jsonResponse({ error: error.message }, 403, ALLOWED_METHODS, req);
    }

    console.error("[delivery-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `delivery_rpc_${safeAction}`,
      resource: "delivery-rpc",
      status: "failure",
      details: { action: safeAction, reason: "delivery_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});

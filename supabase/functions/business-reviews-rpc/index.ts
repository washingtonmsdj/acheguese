/**
 * Edge Function: business-reviews-rpc
 *
 * Authenticated broker for business review mutations/checks. Browser clients
 * never call the privileged database functions directly and never provide a
 * trusted user id; the broker derives the actor from the JWT.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireOperationalAccount } from "../_shared/accountOperational.ts";
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
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_COMMENT_LENGTH = 1000;
const MAX_PHOTOS = 6;
const MAX_PHOTO_URL_LENGTH = 2048;
const UUID_SOURCE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const REVIEW_PHOTO_REFERENCE_PATTERN = new RegExp(
  `^storage://media-assets/(${UUID_SOURCE})/review_photo/v1/(${UUID_SOURCE})\\.jpg$`,
  "i",
);

const ACTIONS = {
  canUserReviewBusiness: true,
  createReview: true,
  updateReview: true,
  deleteReview: true,
  addBusinessResponse: true,
} as const;

type BusinessReviewsAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
  isProjectAdmin: boolean;
}

interface ReviewRow {
  id: string;
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment: string | null;
  photos: string[] | null;
  business_response: string | null;
  business_response_at: string | null;
  order_id: string | null;
  review_type: string;
  status: string;
}

interface OrderRow {
  id: string;
  customer_profile_id: string;
  merchant_profile_id: string;
  logistics_status: string;
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

class RequestConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestConflictError";
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

function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireUuid(value, field);
}

function requireRating(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new RequestValidationError("Rating must be between 1 and 5");
  }
  return value;
}

function optionalRating(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  return requireRating(value);
}

function normalizeText(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const text = value.trim();
  if (!text) return null;
  return text.slice(0, MAX_COMMENT_LENGTH);
}

function requireNonEmptyText(value: unknown, field: string): string {
  const text = normalizeText(value, field);
  if (!text) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return text;
}

function normalizePhotos(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new RequestValidationError("Invalid photos");
  }
  if (value.length > MAX_PHOTOS) {
    throw new RequestValidationError("A review accepts at most 6 photos");
  }

  const normalized = value.map((photo) => {
    if (typeof photo !== "string" || photo.length > MAX_PHOTO_URL_LENGTH) {
      throw new RequestValidationError("Invalid photo");
    }
    const reference = photo.trim();
    if (!REVIEW_PHOTO_REFERENCE_PATTERN.test(reference)) {
      throw new RequestValidationError("Invalid photo reference");
    }
    return reference;
  });
  if (new Set(normalized.map((photo) => photo.toLowerCase())).size !== normalized.length) {
    throw new RequestValidationError("Duplicate photo reference");
  }
  return normalized;
}

function hasOwnParam(
  params: Record<string, unknown>,
  camelKey: string,
  snakeKey: string,
): boolean {
  return (
    Object.prototype.hasOwnProperty.call(params, camelKey) ||
    Object.prototype.hasOwnProperty.call(params, snakeKey)
  );
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

async function listAccessibleProfileIds(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data: ownedProfiles, error: ownedError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", userId);

  if (ownedError) throw ownedError;

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("profile_members")
    .select("profile_id")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (membershipError) throw membershipError;

  const ids = new Set<string>();
  for (const profile of ownedProfiles ?? []) {
    if (typeof profile.id === "string") ids.add(profile.id);
  }
  for (const membership of memberships ?? []) {
    if (typeof membership.profile_id === "string")
      ids.add(membership.profile_id);
  }

  return [...ids];
}

async function getBusinessReview(
  supabaseAdmin: SupabaseClient,
  reviewId: string,
  activeOnly: boolean,
): Promise<ReviewRow | null> {
  let query = supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("review_type", "business");

  if (activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as ReviewRow | null;
}

async function handleCanUserReviewBusiness(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const businessProfileId = requireUuid(
    params.businessProfileId ?? params.business_profile_id,
    "businessProfileId",
  );
  const requestedReviewerProfileId = optionalUuid(
    params.reviewerProfileId ?? params.reviewer_profile_id,
    "reviewerProfileId",
  );
  const reviewerProfileIds = requestedReviewerProfileId
    ? [requestedReviewerProfileId]
    : await listAccessibleProfileIds(supabaseAdmin, auth.userId);

  if (reviewerProfileIds.length === 0) {
    return { canReview: false };
  }

  if (
    requestedReviewerProfileId &&
    !(await canAccessProfile(supabaseAdmin, auth, requestedReviewerProfileId))
  ) {
    return { canReview: false };
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id")
    .eq("reviewed_profile_id", businessProfileId)
    .eq("review_type", "business")
    .eq("status", "active")
    .in("reviewer_profile_id", reviewerProfileIds)
    .limit(1);

  if (error) throw error;
  return { canReview: !Array.isArray(data) || data.length === 0 };
}

async function handleCreateReview(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const reviewedProfileId = requireUuid(
    params.reviewedProfileId ?? params.reviewed_profile_id,
    "reviewedProfileId",
  );
  const reviewerProfileId = requireUuid(
    params.reviewerProfileId ?? params.reviewer_profile_id,
    "reviewerProfileId",
  );
  const rating = requireRating(params.rating);
  const comment = normalizeText(params.comment, "comment");
  const photos = normalizePhotos(params.photos);
  const orderId = optionalUuid(params.orderId ?? params.order_id, "orderId");

  if (reviewedProfileId === reviewerProfileId) {
    throw new RequestValidationError("Reviewed profile is invalid");
  }

  if (!(await canAccessProfile(supabaseAdmin, auth, reviewerProfileId))) {
    throw new RequestAuthorizationError(
      "Reviewer profile is not available to this user",
    );
  }

  if (orderId) {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, customer_profile_id, merchant_profile_id, logistics_status")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      throw new RequestValidationError("Order was not found for review");
    }

    const candidateOrder = order as OrderRow;
    if (
      candidateOrder.customer_profile_id !== reviewerProfileId ||
      candidateOrder.merchant_profile_id !== reviewedProfileId ||
      candidateOrder.logistics_status !== "delivered"
    ) {
      throw new RequestAuthorizationError(
        "Order is not eligible for public review",
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      reviewed_profile_id: reviewedProfileId,
      reviewer_profile_id: reviewerProfileId,
      rating,
      comment,
      photos,
      business_response: null,
      business_response_at: null,
      order_id: orderId,
      review_type: "business",
      status: "active",
    })
    .select("*")
    .single();

  if (error?.code === "23505") {
    throw new RequestConflictError("Review already exists");
  }
  if (error) throw error;

  return { review: data, id: (data as ReviewRow).id };
}

async function handleUpdateReview(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const reviewId = requireUuid(params.reviewId ?? params.review_id, "reviewId");
  const existing = await getBusinessReview(supabaseAdmin, reviewId, true);

  if (!existing) {
    throw new RequestValidationError("Review was not found");
  }
  if (
    !(await canAccessProfile(supabaseAdmin, auth, existing.reviewer_profile_id))
  ) {
    throw new RequestAuthorizationError("User cannot update this review");
  }

  const rating = optionalRating(params.rating) ?? existing.rating;
  const hasPhotos = hasOwnParam(params, "photos", "photos");
  const photos =
    hasPhotos && params.photos !== null && params.photos !== undefined
      ? normalizePhotos(params.photos)
      : (existing.photos ?? []);
  const hasComment = hasOwnParam(params, "comment", "comment");
  const comment =
    hasComment && params.comment !== null && params.comment !== undefined
      ? normalizeText(params.comment, "comment")
      : existing.comment;

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .update({
      rating,
      comment,
      photos,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("review_type", "business")
    .eq("status", "active")
    .select("*")
    .single();

  if (error) throw error;
  return { review: data };
}

async function handleDeleteReview(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const reviewId = requireUuid(params.reviewId ?? params.review_id, "reviewId");
  const existing = await getBusinessReview(supabaseAdmin, reviewId, false);

  if (!existing) {
    throw new RequestValidationError("Review was not found");
  }
  if (
    !(await canAccessProfile(supabaseAdmin, auth, existing.reviewer_profile_id))
  ) {
    throw new RequestAuthorizationError("User cannot delete this review");
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("review_type", "business")
    .select("id");

  if (error) throw error;
  return { deleted: Array.isArray(data) && data.length > 0 };
}

async function handleAddBusinessResponse(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const reviewId = requireUuid(params.reviewId ?? params.review_id, "reviewId");
  const businessResponse = requireNonEmptyText(
    params.businessResponse ?? params.business_response,
    "businessResponse",
  );
  const existing = await getBusinessReview(supabaseAdmin, reviewId, true);

  if (!existing) {
    throw new RequestValidationError("Review was not found");
  }
  if (
    !(await canAccessProfile(supabaseAdmin, auth, existing.reviewed_profile_id))
  ) {
    throw new RequestAuthorizationError(
      "User cannot respond for this business",
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .update({
      business_response: businessResponse,
      business_response_at: now,
      updated_at: now,
    })
    .eq("id", reviewId)
    .eq("review_type", "business")
    .eq("status", "active")
    .select("*")
    .single();

  if (error) throw error;
  return { review: data };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: BusinessReviewsAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "canUserReviewBusiness":
      return handleCanUserReviewBusiness(supabaseAdmin, auth, params);
    case "createReview":
      return handleCreateReview(supabaseAdmin, auth, params);
    case "updateReview":
      return handleUpdateReview(supabaseAdmin, auth, params);
    case "deleteReview":
      return handleDeleteReview(supabaseAdmin, auth, params);
    case "addBusinessResponse":
      return handleAddBusinessResponse(supabaseAdmin, auth, params);
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

  const accountOperationalError = await requireOperationalAccount(
    supabaseAdmin,
    auth.userId,
    req,
    ALLOWED_METHODS,
  );
  if (accountOperationalError) return accountOperationalError;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 24_576,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as BusinessReviewsAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `business_reviews_rpc_${safeAction}`,
      resource: "business-reviews-rpc",
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
    if (error instanceof RequestConflictError) {
      return jsonResponse({ error: error.message }, 409, ALLOWED_METHODS, req);
    }

    console.error("[business-reviews-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `business_reviews_rpc_${safeAction}`,
      resource: "business-reviews-rpc",
      status: "failure",
      details: { action: safeAction, reason: "business_reviews_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse(
      { error: "Internal server error" },
      500,
      ALLOWED_METHODS,
      req,
    );
  }
});
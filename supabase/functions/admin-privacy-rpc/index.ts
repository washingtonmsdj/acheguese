import { getSupabaseAdminClient, requireAdmin } from "../_shared/adminAuth.ts";
import {
  auditLog,
  getAuditInfo,
  getCorsHeaders,
  isValidUUID,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MAX_BODY_BYTES = 8_192;
const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

const ACTIONS = {
  listRequests: true,
  getRequest: true,
  transitionRequest: true,
} as const;

type Action = keyof typeof ACTIONS;
type Params = Record<string, unknown>;

type RequestStatus =
  | "received"
  | "in_review"
  | "waiting_for_requester"
  | "completed"
  | "denied"
  | "cancelled";

type RequestType =
  | "access"
  | "correction"
  | "anonymization"
  | "portability"
  | "deletion"
  | "information"
  | "consent_revocation"
  | "automated_decision"
  | "violation_report"
  | "other";

const STATUSES = new Set<RequestStatus>([
  "received",
  "in_review",
  "waiting_for_requester",
  "completed",
  "denied",
  "cancelled",
]);

const TYPES = new Set<RequestType>([
  "access",
  "correction",
  "anonymization",
  "portability",
  "deletion",
  "information",
  "consent_revocation",
  "automated_decision",
  "violation_report",
  "other",
]);

const NEXT_STATUSES = new Set<RequestStatus>([
  "in_review",
  "waiting_for_requester",
  "completed",
  "denied",
  "cancelled",
]);

class AdminPrivacyHttpError extends Error {
  readonly status: number;
  readonly clientCode: string;

  constructor(clientCode: string, status: number) {
    super(clientCode);
    this.name = "AdminPrivacyHttpError";
    this.status = status;
    this.clientCode = clientCode;
  }
}

function optionalEnum<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  field: string,
): T | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !allowed.has(value as T)) {
    throw new AdminPrivacyHttpError(`invalid_${field}`, 400);
  }
  return value as T;
}

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  field: string,
): number {
  if (value === undefined || value === null) return fallback;
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw new AdminPrivacyHttpError(`invalid_${field}`, 400);
  }
  return Number(value);
}

function requireRequestId(value: unknown): string {
  if (!isValidUUID(value)) throw new AdminPrivacyHttpError("invalid_request_id", 400);
  return value as string;
}

function mapRpcError(error: { message?: string; code?: string }): never {
  const message = error.message ?? "";
  if (message.includes("privacy_request_not_found")) {
    throw new AdminPrivacyHttpError("request_not_found", 404);
  }
  if (
    message.includes("privacy_admin_invalid_transition") ||
    message.includes("privacy_admin_invalid_status") ||
    message.includes("privacy_admin_invalid_request_type") ||
    message.includes("privacy_admin_invalid_pagination")
  ) {
    throw new AdminPrivacyHttpError("invalid_request", 400);
  }
  if (message.includes("privacy_admin_required") || error.code === "42501") {
    throw new AdminPrivacyHttpError("forbidden", 403);
  }
  throw new Error("PRIVACY_ADMIN_RPC_FAILED");
}

function totalFromRows(rows: unknown[]): number {
  if (rows.length === 0 || !rows[0] || typeof rows[0] !== "object") return 0;
  const value = Reflect.get(rows[0] as object, "total_count");
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : 0;
  }
  return 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 120, 60_000, ALLOWED_METHODS);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req, ALLOWED_METHODS);
  if (auth instanceof Response) return auth;

  const body = await readJsonBody<{ action?: unknown; params?: unknown }>(req, {
    maxBytes: MAX_BODY_BYTES,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  const action = body.data.action;
  if (typeof action !== "string" || !(action in ACTIONS)) {
    return jsonResponse({ error: "invalid_action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as Action;
  const params: Params =
    body.data.params && typeof body.data.params === "object" && !Array.isArray(body.data.params)
      ? (body.data.params as Params)
      : {};

  const admin = getSupabaseAdminClient();
  let auditedRequestId: string | undefined;
  let auditedNextStatus: RequestStatus | undefined;

  try {
    let data: unknown;

    switch (safeAction) {
      case "listRequests": {
        const status = optionalEnum(params.status, STATUSES, "status");
        const requestType = optionalEnum(params.requestType, TYPES, "request_type");
        const page = boundedInteger(params.page, 1, 1, 100_000, "page");
        const pageSize = boundedInteger(
          params.pageSize,
          PAGE_SIZE_DEFAULT,
          1,
          PAGE_SIZE_MAX,
          "page_size",
        );
        const offset = (page - 1) * pageSize;

        const { data: rows, error } = await admin.rpc(
          "admin_list_privacy_subject_requests",
          {
            p_actor_user_id: auth.userId,
            p_status: status,
            p_request_type: requestType,
            p_limit: pageSize,
            p_offset: offset,
          },
        );
        if (error) mapRpcError(error);

        const items = Array.isArray(rows) ? rows : [];
        data = {
          items: items.map((row) => {
            if (!row || typeof row !== "object") return row;
            const { total_count: _totalCount, ...safeRow } = row as Record<string, unknown>;
            return safeRow;
          }),
          total: totalFromRows(items),
          page,
          pageSize,
        };
        break;
      }

      case "getRequest": {
        const requestId = requireRequestId(params.requestId);
        auditedRequestId = requestId;
        const { data: row, error } = await admin.rpc(
          "admin_get_privacy_subject_request",
          {
            p_actor_user_id: auth.userId,
            p_request_id: requestId,
          },
        );
        if (error) mapRpcError(error);
        data = row;
        break;
      }

      case "transitionRequest": {
        const requestId = requireRequestId(params.requestId);
        const nextStatus = optionalEnum(
          params.nextStatus,
          NEXT_STATUSES,
          "next_status",
        );
        if (!nextStatus) {
          throw new AdminPrivacyHttpError("invalid_status", 400);
        }
        auditedRequestId = requestId;
        auditedNextStatus = nextStatus;

        const { data: row, error } = await admin.rpc(
          "admin_transition_privacy_subject_request",
          {
            p_actor_user_id: auth.userId,
            p_request_id: requestId,
            p_next_status: nextStatus,
          },
        );
        if (error) mapRpcError(error);
        data = row;
        break;
      }
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_privacy_${safeAction}`,
      resource: "admin-privacy-rpc",
      status: "success",
      details: {
        action: safeAction,
        ...(auditedRequestId ? { requestId: auditedRequestId } : {}),
        ...(auditedNextStatus ? { nextStatus: auditedNextStatus } : {}),
      },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error) {
    const clientCode =
      error instanceof AdminPrivacyHttpError
        ? error.clientCode
        : "privacy_admin_operation_failed";

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_privacy_${safeAction}`,
      resource: "admin-privacy-rpc",
      status: "failure",
      details: {
        action: safeAction,
        reason: clientCode,
        ...(auditedRequestId ? { requestId: auditedRequestId } : {}),
        ...(auditedNextStatus ? { nextStatus: auditedNextStatus } : {}),
      },
      ...getAuditInfo(req),
    });

    if (error instanceof AdminPrivacyHttpError) {
      return jsonResponse(
        { error: error.clientCode },
        error.status,
        ALLOWED_METHODS,
        req,
      );
    }

    console.error("[admin-privacy-rpc] operation failed", {
      action: safeAction,
      reason: "privacy_admin_operation_failed",
    });
    return jsonResponse({ error: "internal_server_error" }, 500, ALLOWED_METHODS, req);
  }
});

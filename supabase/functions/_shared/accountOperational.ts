import { jsonResponse } from "./security.ts";

const BLOCKED_ACCOUNT_STATUSES = new Set([
  "scheduled",
  "processing",
  "failed",
  "completed",
]);

// deno-lint-ignore no-explicit-any
type ServiceRoleClient = any;

export async function requireOperationalAccount(
  supabaseAdmin: ServiceRoleClient,
  userId: string,
  req: Request,
  methods = "POST, OPTIONS",
): Promise<Response | null> {
  if (!userId) {
    return jsonResponse(
      { error: "Invalid authenticated user context" },
      401,
      methods,
      req,
    );
  }

  const { data, error } = await supabaseAdmin
    .from("account_deletion_requests")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[AccountOperational] account state lookup failed", {
      code: typeof error.code === "string" ? error.code : "unknown",
    });
    return jsonResponse(
      { error: "Account state unavailable" },
      503,
      methods,
      req,
    );
  }

  const status = typeof data?.status === "string" ? data.status : null;
  if (status && BLOCKED_ACCOUNT_STATUSES.has(status)) {
    return jsonResponse(
      {
        error: "Account is pending deletion and is read-only",
        code: "ACCOUNT_PENDING_DELETION_READ_ONLY",
      },
      403,
      methods,
      req,
    );
  }

  return null;
}

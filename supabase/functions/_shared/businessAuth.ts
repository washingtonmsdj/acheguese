import { getAllSecurityHeaders } from "./security.ts";

export function jsonSecurityResponse(
  body: Record<string, unknown>,
  status = 200,
  methods = "POST, OPTIONS",
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getAllSecurityHeaders(methods),
      "Content-Type": "application/json",
    },
  });
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}

export async function requireAuthenticatedUser(
  req: Request,
  supabase: any,
): Promise<{ user: { id: string } } | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonSecurityResponse(
      { success: false, error: "Missing authorization token" },
      401,
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.id) {
    return jsonSecurityResponse(
      { success: false, error: "Invalid or expired token" },
      401,
    );
  }

  return { user: { id: user.id } };
}

export async function requireBusinessManagementAccess(
  req: Request,
  supabase: any,
  businessId: string,
): Promise<{ user: { id: string }; businessProfileId: string } | Response> {
  const authResult = await requireAuthenticatedUser(req, supabase);
  if (authResult instanceof Response) {
    return authResult;
  }

  const userId = authResult.user.id;

  const { data: business, error: businessError } = await supabase
    .from("business_data")
    .select("id, profile_id")
    .eq("id", businessId)
    .maybeSingle();

  if (businessError) {
    return jsonSecurityResponse(
      { success: false, error: "Failed to verify business access" },
      500,
    );
  }

  if (!business?.profile_id) {
    return jsonSecurityResponse(
      { success: false, error: "Business not found" },
      404,
    );
  }

  const businessProfileId = business.profile_id as string;

  const { data: ownedProfile, error: ownerError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", businessProfileId)
    .eq("user_id", userId)
    .maybeSingle();

  if (ownerError) {
    return jsonSecurityResponse(
      { success: false, error: "Failed to verify business ownership" },
      500,
    );
  }

  if (ownedProfile) {
    return { user: { id: userId }, businessProfileId };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("profile_members")
    .select("role")
    .eq("profile_id", businessProfileId)
    .eq("user_id", userId);

  if (membershipError) {
    return jsonSecurityResponse(
      { success: false, error: "Failed to verify profile membership" },
      500,
    );
  }

  const isManager = (memberships ?? []).some((membership: { role?: string | null }) =>
    ["owner", "admin"].includes((membership.role ?? "").toLowerCase()),
  );

  if (!isManager) {
    return jsonSecurityResponse(
      { success: false, error: "User is not allowed to manage this business" },
      403,
    );
  }

  return { user: { id: userId }, businessProfileId };
}


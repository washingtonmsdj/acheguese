import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

export type MfaPolicyReason =
  | "not_enforced"
  | "exempt"
  | "grace_period"
  | "enrollment_required"
  | "verification_required"
  | "satisfied";

export interface UserMfaPolicyState {
  enforced: boolean;
  required: boolean;
  reason: MfaPolicyReason;
  hasVerifiedFactor: boolean;
  currentLevel: "aal1" | "aal2" | null;
  gracePeriodExpiresAt: string | null;
}

interface MfaTrackerRow {
  id: string;
  is_exempt: boolean | null;
  grace_period_expires_at: string | null;
}

interface VerifiedFactor {
  factor_type?: unknown;
  status?: unknown;
}

function isMfaCapableFactor(factor: VerifiedFactor): boolean {
  return (
    factor.status === "verified" &&
    (factor.factor_type === "totp" ||
      factor.factor_type === "phone" ||
      factor.factor_type === "webauthn")
  );
}

function factorMethod(factor: VerifiedFactor | undefined): string | null {
  if (!factor) return null;
  if (factor.factor_type === "totp") return "totp";
  if (factor.factor_type === "phone") return "sms";
  if (factor.factor_type === "webauthn") return "webauthn";
  return null;
}

function isFutureIsoTimestamp(value: string | null): boolean {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time > Date.now();
}

async function loadEnforcement(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: roles, error: rolesError } = await supabaseAdmin.rpc(
    "get_user_roles",
    { _user_id: userId },
  );
  if (rolesError) throw rolesError;
  if (!Array.isArray(roles) || roles.length === 0) return false;

  const roleNames = roles.filter((role): role is string => typeof role === "string");
  if (roleNames.length === 0) return false;

  const { data: enforcement, error: enforcementError } = await supabaseAdmin
    .from("admin_mfa_enforcement")
    .select("role_enum")
    .in("role_enum", roleNames)
    .eq("mfa_required", true)
    .limit(1);
  if (enforcementError) throw enforcementError;

  return Array.isArray(enforcement) && enforcement.length > 0;
}

async function loadTracker(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<MfaTrackerRow | null> {
  const { data, error } = await supabaseAdmin
    .from("user_mfa_status")
    .select("id,is_exempt,grace_period_expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as MfaTrackerRow | null;
}

async function loadVerifiedFactors(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<VerifiedFactor[]> {
  const { data, error } = await supabaseAdmin.auth.admin.mfa.listFactors({
    userId,
  });
  if (error) throw error;
  if (!data || !Array.isArray(data.factors)) {
    throw new Error("Auth MFA factor authority returned an invalid response");
  }

  return (data.factors as VerifiedFactor[]).filter(isMfaCapableFactor);
}

async function reconcileTracker(
  supabaseAdmin: SupabaseClient,
  userId: string,
  tracker: MfaTrackerRow | null,
  verifiedFactors: VerifiedFactor[],
): Promise<void> {
  const firstFactor = verifiedFactors[0];
  const update = {
    mfa_enabled: verifiedFactors.length > 0,
    mfa_method: factorMethod(firstFactor),
    // Achegue-se não habilita recovery codes neste fluxo. Os antigos códigos
    // gerados no browser nunca constituíram uma autoridade real de recuperação.
    backup_codes_generated: false,
    backup_codes_count: 0,
    updated_at: new Date().toISOString(),
  };

  if (tracker?.id) {
    const { error } = await supabaseAdmin
      .from("user_mfa_status")
      .update(update)
      .eq("id", tracker.id);
    if (error) throw error;
    return;
  }

  // Ausência inesperada do tracker não concede um novo grace period. O trigger
  // de role é quem cria esse prazo; aqui registramos somente o estado do Auth.
  const { error } = await supabaseAdmin
    .from("user_mfa_status")
    .insert({ user_id: userId, ...update });
  if (error) throw error;
}

async function loadCurrentAal(
  supabaseAdmin: SupabaseClient,
  token: string,
): Promise<"aal1" | "aal2" | null> {
  const { data, error } =
    await supabaseAdmin.auth.mfa.getAuthenticatorAssuranceLevel(token);
  if (error) throw error;

  const level = data?.currentLevel ?? null;
  if (level !== null && level !== "aal1" && level !== "aal2") {
    throw new Error("Auth MFA assurance authority returned an invalid response");
  }
  return level;
}

/**
 * Canonical server-side MFA policy decision for privileged accounts.
 *
 * Security properties:
 * - enforcement is derived from server-owned roles/configuration;
 * - exemptions/grace are read server-side;
 * - enrollment is derived from verified Supabase Auth factors;
 * - configured MFA requires AAL2 on the current JWT, not merely an enrolled
 *   factor on some other session;
 * - a missing tracker never creates a fresh grace period.
 */
export async function evaluateUserMfaPolicy(
  supabaseAdmin: SupabaseClient,
  userId: string,
  token: string,
): Promise<UserMfaPolicyState> {
  const enforced = await loadEnforcement(supabaseAdmin, userId);
  if (!enforced) {
    return {
      enforced: false,
      required: false,
      reason: "not_enforced",
      hasVerifiedFactor: false,
      currentLevel: null,
      gracePeriodExpiresAt: null,
    };
  }

  const tracker = await loadTracker(supabaseAdmin, userId);
  if (tracker?.is_exempt === true) {
    return {
      enforced: true,
      required: false,
      reason: "exempt",
      hasVerifiedFactor: false,
      currentLevel: null,
      gracePeriodExpiresAt: tracker.grace_period_expires_at ?? null,
    };
  }

  const verifiedFactors = await loadVerifiedFactors(supabaseAdmin, userId);
  await reconcileTracker(supabaseAdmin, userId, tracker, verifiedFactors);

  if (verifiedFactors.length === 0) {
    const gracePeriodExpiresAt = tracker?.grace_period_expires_at ?? null;
    if (isFutureIsoTimestamp(gracePeriodExpiresAt)) {
      return {
        enforced: true,
        required: false,
        reason: "grace_period",
        hasVerifiedFactor: false,
        currentLevel: "aal1",
        gracePeriodExpiresAt,
      };
    }

    return {
      enforced: true,
      required: true,
      reason: "enrollment_required",
      hasVerifiedFactor: false,
      currentLevel: "aal1",
      gracePeriodExpiresAt,
    };
  }

  const currentLevel = await loadCurrentAal(supabaseAdmin, token);
  if (currentLevel !== "aal2") {
    return {
      enforced: true,
      required: true,
      reason: "verification_required",
      hasVerifiedFactor: true,
      currentLevel,
      gracePeriodExpiresAt: tracker?.grace_period_expires_at ?? null,
    };
  }

  return {
    enforced: true,
    required: false,
    reason: "satisfied",
    hasVerifiedFactor: true,
    currentLevel,
    gracePeriodExpiresAt: tracker?.grace_period_expires_at ?? null,
  };
}

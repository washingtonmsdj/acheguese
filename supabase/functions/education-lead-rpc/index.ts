/**
 * Edge Function: education-lead-rpc
 *
 * Server-owned public intake for Education leads. The browser never receives
 * INSERT authority on public.education_leads.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MAX_BODY_BYTES = 24_576;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SHIFTS = new Set(["morning", "afternoon", "evening", "full_day"]);

type SupabaseClient = ReturnType<typeof createClient>;

interface RequestBody {
  educationProfileId?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  childName?: unknown;
  childAge?: unknown;
  interestNote?: unknown;
  guardianName?: unknown;
  studentName?: unknown;
  studentAge?: unknown;
  desiredGrade?: unknown;
  desiredShift?: unknown;
}

class IntakeError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "IntakeError";
    this.status = status;
  }
}

function headers(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function requireText(
  value: unknown,
  field: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") throw new IntakeError(`invalid_${field}`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max) {
    throw new IntakeError(`invalid_${field}`);
  }
  return normalized;
}

function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new IntakeError(`invalid_${field}`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  if (normalized.length > max) throw new IntakeError(`invalid_${field}`);
  return normalized;
}

function optionalAge(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 120) {
    throw new IntakeError(`invalid_${field}`);
  }
  return value;
}

function normalizeEmail(value: unknown): string {
  const email = requireText(value, "email", 5, 254).toLowerCase();
  if (!EMAIL_REGEX.test(email)) throw new IntakeError("invalid_email");
  return email;
}

function normalizePhone(value: unknown): string {
  const phone = requireText(value, "phone", 8, 32);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new IntakeError("invalid_phone");
  }
  return phone;
}

async function requireLeadEligibleProfile(
  supabaseAdmin: SupabaseClient,
  educationProfileId: string,
): Promise<{ businessDataId: string; nicheKey: string }> {
  const { data: education, error: educationError } = await supabaseAdmin
    .from("education_profiles")
    .select("id,business_id,status,school_type,niche_key")
    .eq("id", educationProfileId)
    .maybeSingle();

  if (educationError) throw educationError;
  if (!education || education.status !== "published") {
    throw new IntakeError("education_profile_not_available", 404);
  }
  if (education.school_type === "public") {
    throw new IntakeError("public_institution_lead_intake_disabled", 403);
  }

  const { data: business, error: businessError } = await supabaseAdmin
    .from("business_data")
    .select("id,status,is_claimable")
    .eq("profile_id", education.business_id)
    .maybeSingle();

  if (businessError) throw businessError;
  if (!business || business.status !== "active" || business.is_claimable === true) {
    throw new IntakeError("institution_lead_authority_not_enabled", 403);
  }

  return {
    businessDataId: business.id,
    nicheKey: education.niche_key,
  };
}

async function findRecentDuplicate(
  supabaseAdmin: SupabaseClient,
  educationProfileId: string,
  email: string,
): Promise<string | null> {
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("education_leads")
    .select("id")
    .eq("education_profile_id", educationProfileId)
    .eq("email", email)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function enforceDailySubjectLimit(
  supabaseAdmin: SupabaseClient,
  educationProfileId: string,
  email: string,
): Promise<void> {
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("education_leads")
    .select("id", { count: "exact", head: true })
    .eq("education_profile_id", educationProfileId)
    .eq("email", email)
    .gte("created_at", since);

  if (error) throw error;
  if ((count ?? 0) >= 5) {
    throw new IntakeError("education_lead_daily_limit_exceeded", 429);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headers(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 8, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readJsonBody<RequestBody>(req, {
    maxBytes: MAX_BODY_BYTES,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  const educationProfileId =
    typeof body.data.educationProfileId === "string"
      ? body.data.educationProfileId
      : "";
  if (!UUID_REGEX.test(educationProfileId)) {
    return jsonResponse(
      { error: "invalid_education_profile_id" },
      400,
      ALLOWED_METHODS,
      req,
    );
  }

  const supabaseAdmin = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const fullName = requireText(body.data.fullName, "full_name", 2, 160);
    const email = normalizeEmail(body.data.email);
    const phone = normalizePhone(body.data.phone);
    const childName = optionalText(body.data.childName, "child_name", 160);
    const childAge = optionalAge(body.data.childAge, "child_age");
    const interestNote = optionalText(body.data.interestNote, "interest_note", 1000);
    const guardianName = optionalText(body.data.guardianName, "guardian_name", 160);
    const studentName = optionalText(body.data.studentName, "student_name", 160);
    const studentAge = optionalAge(body.data.studentAge, "student_age");
    const desiredGrade = optionalText(body.data.desiredGrade, "desired_grade", 120);

    const desiredShift =
      body.data.desiredShift === undefined ||
        body.data.desiredShift === null ||
        body.data.desiredShift === ""
        ? null
        : typeof body.data.desiredShift === "string" &&
            ALLOWED_SHIFTS.has(body.data.desiredShift)
          ? body.data.desiredShift
          : (() => {
              throw new IntakeError("invalid_desired_shift");
            })();

    const eligibility = await requireLeadEligibleProfile(
      supabaseAdmin,
      educationProfileId,
    );

    const duplicateId = await findRecentDuplicate(
      supabaseAdmin,
      educationProfileId,
      email,
    );
    if (duplicateId) {
      return jsonResponse(
        {
          leadId: duplicateId,
          created: false,
          educationProfileId,
          businessDataId: eligibility.businessDataId,
        },
        200,
        ALLOWED_METHODS,
        req,
      );
    }

    await enforceDailySubjectLimit(supabaseAdmin, educationProfileId, email);

    const { data: lead, error: insertError } = await supabaseAdmin
      .from("education_leads")
      .insert({
        education_profile_id: educationProfileId,
        full_name: fullName,
        email,
        phone,
        child_name: childName,
        child_age: childAge,
        interest_note: interestNote,
        source_channel: "public_directory_form",
        status: "new",
        owner_user_id: null,
        first_contact_at: null,
        lost_reason: null,
        guardian_name: guardianName,
        student_name: studentName,
        student_age: studentAge,
        desired_grade: desiredGrade,
        desired_shift: desiredShift,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    auditLog({
      timestamp: new Date().toISOString(),
      action: "education_public_lead_created",
      resource: "education-lead-rpc",
      status: "success",
      details: {
        educationProfileId,
        businessDataId: eligibility.businessDataId,
        nicheKey: eligibility.nicheKey,
      },
      ...getAuditInfo(req),
    });

    return jsonResponse(
      {
        leadId: lead.id,
        created: true,
        educationProfileId,
        businessDataId: eligibility.businessDataId,
      },
      201,
      ALLOWED_METHODS,
      req,
    );
  } catch (error: unknown) {
    if (error instanceof IntakeError) {
      return jsonResponse(
        { error: error.message },
        error.status,
        ALLOWED_METHODS,
        req,
      );
    }

    console.error("[education-lead-rpc] failed", error);
    auditLog({
      timestamp: new Date().toISOString(),
      action: "education_public_lead_create_failed",
      resource: "education-lead-rpc",
      status: "failure",
      details: { educationProfileId },
      ...getAuditInfo(req),
    });
    return jsonResponse(
      { error: "education_lead_intake_failed" },
      500,
      ALLOWED_METHODS,
      req,
    );
  }
});

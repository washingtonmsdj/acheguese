// Edge Function: verify-turnstile-token
// Valida um token do Cloudflare Turnstile contra a Siteverify API.
// Deploy: verify_jwt = false (endpoint público consumido antes do login).
// Secret obrigatório: TURNSTILE_SECRET_KEY

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface VerifyBody {
  token?: string;
  action?: string;
}

interface TurnstileResponse {
  success: boolean;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "method_not_allowed" }, 405);
  }

  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    return json({ success: false, error: "turnstile_not_configured" }, 503);
  }

  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return json({ success: false, error: "invalid_json" }, 400);
  }

  const token = body.token?.trim();
  if (!token || token.length > 2048) {
    return json({ success: false, error: "missing_token" }, 400);
  }

  const remoteIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    undefined;

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  let cf: TurnstileResponse;
  try {
    const cfRes = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body: form });
    cf = (await cfRes.json()) as TurnstileResponse;
  } catch {
    return json({ success: false, error: "turnstile_unreachable" }, 502);
  }

  if (!cf.success) {
    return json(
      {
        success: false,
        error: "turnstile_rejected",
        codes: cf["error-codes"] ?? [],
      },
      403,
    );
  }

  if (body.action && cf.action && body.action !== cf.action) {
    return json({ success: false, error: "action_mismatch" }, 403);
  }

  return json({ success: true, action: cf.action, hostname: cf.hostname });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

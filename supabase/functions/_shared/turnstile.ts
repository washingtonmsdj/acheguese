const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;

interface TurnstileProviderResponse {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export type TurnstileVerificationResult =
  | { ok: true }
  | { ok: false; reason: "rejected" | "unavailable" };

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export function parseAllowedTurnstileHostnames(allowedOrigins: string): Set<string> {
  const hostnames = new Set<string>();

  for (const rawOrigin of allowedOrigins.split(",")) {
    const origin = rawOrigin.trim();
    if (!origin) continue;

    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("ALLOWED_ORIGINS contains an unsupported protocol");
    }
    hostnames.add(parsed.hostname.toLowerCase());
  }

  if (hostnames.size === 0) {
    throw new Error("ALLOWED_ORIGINS has no valid origins");
  }

  return hostnames;
}

function isTurnstileProviderResponse(value: unknown): value is TurnstileProviderResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const success = Reflect.get(value, "success");
  const action = Reflect.get(value, "action");
  const hostname = Reflect.get(value, "hostname");
  const errorCodes = Reflect.get(value, "error-codes");

  return (
    typeof success === "boolean" &&
    (action === undefined || typeof action === "string") &&
    (hostname === undefined || typeof hostname === "string") &&
    (errorCodes === undefined ||
      (Array.isArray(errorCodes) && errorCodes.every((code) => typeof code === "string")))
  );
}

export async function verifyTurnstileToken(options: {
  token: string;
  secret: string;
  expectedAction: string;
  allowedHostnames: ReadonlySet<string>;
  remoteIp: string | null;
  fetchImpl?: FetchImplementation;
}): Promise<TurnstileVerificationResult> {
  const expectedAction = options.expectedAction.trim();
  if (!expectedAction || expectedAction.length > 64) {
    return { ok: false, reason: "rejected" };
  }

  const form = new URLSearchParams({
    secret: options.secret,
    response: options.token,
  });
  if (options.remoteIp) form.set("remoteip", options.remoteIp);

  try {
    const providerResponse = await (options.fetchImpl ?? fetch)(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    const payload: unknown = await providerResponse.json();

    if (!providerResponse.ok || !isTurnstileProviderResponse(payload)) {
      return { ok: false, reason: "unavailable" };
    }
    if (!payload.success) return { ok: false, reason: "rejected" };
    if (payload.action !== expectedAction) return { ok: false, reason: "rejected" };
    if (!payload.hostname || !options.allowedHostnames.has(payload.hostname.toLowerCase())) {
      return { ok: false, reason: "rejected" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

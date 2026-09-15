import { PUBLIC_SUPABASE_CONFIG } from "@/shared/config/publicSupabase";

const AUTH_READINESS_TIMEOUT_MS = 4_000;
const AUTH_TEMPORARILY_UNAVAILABLE_MESSAGE =
  "O serviço de acesso está temporariamente indisponível. Tente novamente em instantes.";
const GOOGLE_AUTH_UNAVAILABLE_MESSAGE =
  "Entrar com Google está temporariamente indisponível. Use e-mail ou tente novamente em instantes.";

type AuthSettings = {
  external?: Record<string, boolean | undefined>;
};

async function fetchAuthSettings(signal: AbortSignal): Promise<AuthSettings> {
  let response: Response;

  try {
    response = await fetch(`${PUBLIC_SUPABASE_CONFIG.url}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: PUBLIC_SUPABASE_CONFIG.publishableKey,
      },
      cache: "no-store",
      signal,
    });
  } catch {
    throw new Error(AUTH_TEMPORARILY_UNAVAILABLE_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(AUTH_TEMPORARILY_UNAVAILABLE_MESSAGE);
  }

  try {
    return (await response.json()) as AuthSettings;
  } catch {
    throw new Error(AUTH_TEMPORARILY_UNAVAILABLE_MESSAGE);
  }
}

/**
 * Browser-side readiness probe for flows that navigate away from the app.
 * The public Auth settings endpoint is stronger than a health-only probe: a
 * healthy GoTrue instance can still have Google disabled or misconfigured.
 * Supabase documents `external.google === true` as the provider readiness
 * signal exposed by `/auth/v1/settings`.
 */
export class AuthBackendAvailability {
  static async assertReadyForExternalOAuth(): Promise<void> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(
      () => controller.abort(),
      AUTH_READINESS_TIMEOUT_MS,
    );

    try {
      const settings = await fetchAuthSettings(controller.signal);
      if (settings.external?.google !== true) {
        throw new Error(GOOGLE_AUTH_UNAVAILABLE_MESSAGE);
      }
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }
}

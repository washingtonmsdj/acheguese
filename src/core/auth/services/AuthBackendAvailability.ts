import { PUBLIC_SUPABASE_CONFIG } from "@/shared/config/publicSupabase";

const AUTH_HEALTH_TIMEOUT_MS = 4_000;
const AUTH_TEMPORARILY_UNAVAILABLE_MESSAGE =
  "O serviço de acesso está temporariamente indisponível. Tente novamente em instantes.";

/**
 * Lightweight browser-side readiness probe for flows that navigate away from
 * the app. Once OAuth leaves Achegue-se, gateway failures are rendered by the
 * provider/Supabase origin and cannot be recovered by our React error boundary.
 */
export class AuthBackendAvailability {
  static async assertReadyForExternalOAuth(): Promise<void> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(
      () => controller.abort(),
      AUTH_HEALTH_TIMEOUT_MS,
    );

    try {
      const response = await fetch(
        `${PUBLIC_SUPABASE_CONFIG.url}/auth/v1/health`,
        {
          method: "GET",
          headers: {
            apikey: PUBLIC_SUPABASE_CONFIG.publishableKey,
          },
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Auth health check failed with ${response.status}`);
      }
    } catch {
      throw new Error(AUTH_TEMPORARILY_UNAVAILABLE_MESSAGE);
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }
}

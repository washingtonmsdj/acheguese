import * as Sentry from "@sentry/react";

export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

function isAutomatedRuntime(): boolean {
  if (typeof navigator !== "undefined" && navigator.webdriver) return true;
  if (typeof window !== "undefined" && "__PLAYWRIGHT__" in window) return true;
  return false;
}

export function getSentryConfig(): SentryConfig {
  const automatedRuntime = isAutomatedRuntime();

  return {
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    environment: import.meta.env.MODE || "development",
    enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN && !automatedRuntime,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  };
}

export function initializeSentry(): void {
  const config = getSentryConfig();
  const debugSentry =
    import.meta.env.DEV && import.meta.env.VITE_DEBUG_SENTRY === "true";

  if (!config.enabled) {
    if (debugSentry) {
      console.debug("Sentry desabilitado (ambiente/DSN).");
    }
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: config.tracesSampleRate,
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
      beforeSend(event, hint) {
        if (config.environment === "development") {
          if (debugSentry) {
            console.debug("Sentry Event (dev):", event);
          }
          return null;
        }

        const error = hint.originalException;
        if (error instanceof Error) {
          if (
            error.message.includes("NetworkError") ||
            error.message.includes("Failed to fetch")
          ) {
            return null;
          }
          if (
            error.stack?.includes("chrome-extension://") ||
            error.stack?.includes("moz-extension://")
          ) {
            return null;
          }
        }

        return event;
      },
      ignoreErrors: [
        "NetworkError",
        "Failed to fetch",
        "Load failed",
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "chrome-extension://",
        "moz-extension://",
      ],
    });

    if (debugSentry) {
      console.debug("Sentry inicializado com sucesso");
    }
  } catch (error) {
    if (debugSentry) {
      console.error("Erro ao inicializar Sentry:", error);
    }
  }
}

export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

export function clearSentryUser(): void {
  const config = getSentryConfig();
  if (!config.enabled) return;
  Sentry.setUser(null);
}

export function setSentryContext(
  key: string,
  context: Record<string, unknown>,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;
  Sentry.setContext(key, context);
}

export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: "debug" | "info" | "warning" | "error" | "fatal" = "info",
  data?: Record<string, unknown>,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

export function captureSentryException(
  error: Error,
  context?: Record<string, unknown>,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  Sentry.captureException(error, { extra: context });
}

export function captureSentryMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" | "fatal" = "info",
  context?: Record<string, unknown>,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

export function startSentryTransaction(name: string, op: string): unknown {
  const config = getSentryConfig();
  if (!config.enabled) return null;

  const sentryApi = Sentry as unknown as Record<string, unknown>;
  const startTransaction = sentryApi["startTransaction"];
  if (typeof startTransaction !== "function") return null;

  return (startTransaction as (context: { name: string; op: string }) => unknown)(
    { name, op },
  );
}

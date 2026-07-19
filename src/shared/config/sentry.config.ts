import type { SeverityLevel } from "@sentry/react";

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  enabled: boolean;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

type SentryModule = typeof import("@sentry/react");
type SentryReportDialogOptions = Record<string, unknown>;

let sentryModulePromise: Promise<SentryModule> | null = null;
let sentryInitPromise: Promise<SentryModule | null> | null = null;
let sentryInitialized = false;

function loadSentryModule(): Promise<SentryModule> {
  sentryModulePromise ??= import("@sentry/react");
  return sentryModulePromise;
}

function isAutomatedRuntime(): boolean {
  if (typeof navigator !== "undefined" && navigator.webdriver) return true;
  if (typeof window !== "undefined" && "__PLAYWRIGHT__" in window) return true;
  return false;
}

function debugSentryEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEBUG_SENTRY === "true";
}

function logSentryDebug(message: string, error?: unknown): void {
  if (!debugSentryEnabled()) return;
  if (error) {
    console.error(message, error);
    return;
  }
  console.debug(message);
}

function ensureSentryInitialized(): Promise<SentryModule | null> {
  const config = getSentryConfig();

  if (!config.enabled) {
    logSentryDebug("Sentry desabilitado (ambiente/DSN).");
    return Promise.resolve(null);
  }

  sentryInitPromise ??= loadSentryModule()
    .then((Sentry) => {
      if (sentryInitialized) return Sentry;

      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        sendDefaultPii: false,
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
            if (debugSentryEnabled()) {
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

          if (event.user) {
            event.user = event.user.id ? { id: event.user.id } : undefined;
          }

          if (event.request) {
            delete event.request.cookies;
            delete event.request.data;
            delete event.request.headers;
            delete event.request.query_string;

            if (event.request.url) {
              try {
                const url = new URL(event.request.url);
                event.request.url = `${url.origin}${url.pathname}`;
              } catch {
                event.request.url = undefined;
              }
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

      sentryInitialized = true;
      logSentryDebug("Sentry inicializado com sucesso");
      return Sentry;
    })
    .catch((error: unknown) => {
      logSentryDebug("Erro ao inicializar Sentry:", error);
      sentryInitPromise = null;
      return null;
    });

  return sentryInitPromise;
}

function withSentry(callback: (Sentry: SentryModule) => void): void {
  void ensureSentryInitialized().then((Sentry) => {
    if (!Sentry) return;
    callback(Sentry);
  });
}

export function getSentryConfig(): SentryConfig {
  const automatedRuntime = isAutomatedRuntime();

  return {
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT ||
      import.meta.env.MODE ||
      "development",
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    enabled:
      import.meta.env.PROD &&
      !!import.meta.env.VITE_SENTRY_DSN &&
      !automatedRuntime,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  };
}

export function initializeSentry(): void {
  void ensureSentryInitialized();
}

export function setSentryUser(user: { id: string }): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  withSentry((Sentry) => Sentry.setUser({ id: user.id }));
}

export function clearSentryUser(): void {
  const config = getSentryConfig();
  if (!config.enabled) return;
  withSentry((Sentry) => Sentry.setUser(null));
}

export function setSentryContext(
  key: string,
  context: Record<string, unknown>,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;
  withSentry((Sentry) => Sentry.setContext(key, context));
}

export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: "debug" | "info" | "warning" | "error" | "fatal" = "info",
  data?: Record<string, unknown>,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  withSentry((Sentry) =>
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    }),
  );
}

export function captureSentryException(
  error: Error,
  context?: Record<string, unknown>,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  withSentry((Sentry) => {
    Sentry.captureException(error, { extra: context });
  });
}

export function captureSentryMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" | "fatal" = "info",
  context?: Record<string, unknown>,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  withSentry((Sentry) =>
    Sentry.captureMessage(message, {
      level: level as SeverityLevel,
      extra: context,
    }),
  );
}

export function startSentryTransaction(name: string, op: string): unknown {
  const config = getSentryConfig();
  if (!config.enabled) return null;

  void ensureSentryInitialized().then((Sentry) => {
    if (!Sentry) return;
    const sentryApi = Sentry as unknown as Record<string, unknown>;
    const startTransaction = sentryApi["startTransaction"];
    if (typeof startTransaction !== "function") return;
    startTransaction({ name, op });
  });

  return null;
}

export function showSentryReportDialog(
  options?: SentryReportDialogOptions,
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  withSentry((Sentry) => {
    const showReportDialog = Sentry.showReportDialog as
      | ((dialogOptions?: SentryReportDialogOptions) => void)
      | undefined;
    showReportDialog?.(options);
  });
}

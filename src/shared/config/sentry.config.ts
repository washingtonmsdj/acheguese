import type { SeverityLevel } from "@sentry/react";

export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

type SentryModule = typeof import("@sentry/react");
type SentryReportDialogOptions = Record<string, unknown>;
type OptionalReplayMode = "session" | "buffer" | "off";
type ReplayController = {
  start: () => void | Promise<void>;
  startBuffering: () => void | Promise<void>;
  stop: () => void | Promise<void>;
};

type SentryModuleWithReplay = SentryModule & {
  getReplay?: () => ReplayController | undefined;
};

let sentryModulePromise: Promise<SentryModule> | null = null;
let sentryInitPromise: Promise<SentryModule | null> | null = null;
let sentryInitialized = false;
let optionalTelemetryEnabled = false;
let optionalReplayMode: OptionalReplayMode | null = null;
let optionalReplayRecording = false;
let optionalReplaySyncPromise: Promise<void> = Promise.resolve();

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

function chooseOptionalReplayMode(config: SentryConfig): OptionalReplayMode {
  if (Math.random() < config.replaysSessionSampleRate) return "session";
  if (Math.random() < config.replaysOnErrorSampleRate) return "buffer";
  return "off";
}

async function syncOptionalReplayNow(
  Sentry: SentryModule,
  config: SentryConfig,
): Promise<void> {
  const replay = (Sentry as SentryModuleWithReplay).getReplay?.();
  if (!replay) return;

  // Read the current global preference only when this queued transition runs.
  // A rapid off -> on toggle therefore converges to the latest consent state
  // instead of replaying an obsolete stop/start request captured earlier.
  if (!optionalTelemetryEnabled) {
    if (!optionalReplayRecording) return;

    try {
      await Promise.resolve(replay.stop());
      optionalReplayRecording = false;
    } catch (error) {
      // Keep the recording flag true when stop fails so a later sync can retry
      // instead of assuming the SDK stopped when it may still be recording.
      logSentryDebug("Erro ao interromper Session Replay:", error);
    }
    return;
  }

  if (optionalReplayRecording) return;

  // Keep the sampled mode stable for the lifetime of this document. Consent
  // can pause/resume optional telemetry without repeatedly resampling the user.
  optionalReplayMode ??= chooseOptionalReplayMode(config);
  if (optionalReplayMode === "off") return;

  try {
    if (optionalReplayMode === "session") {
      await Promise.resolve(replay.start());
    } else {
      await Promise.resolve(replay.startBuffering());
    }
    optionalReplayRecording = true;
  } catch (error) {
    optionalReplayRecording = false;
    logSentryDebug("Erro ao iniciar Session Replay:", error);
  }
}

function queueOptionalReplaySync(
  Sentry: SentryModule,
  config: SentryConfig,
): void {
  optionalReplaySyncPromise = optionalReplaySyncPromise
    .catch(() => undefined)
    .then(() => syncOptionalReplayNow(Sentry, config))
    .catch((error: unknown) => {
      logSentryDebug("Erro ao sincronizar telemetria opcional do Sentry:", error);
    });
}

function ensureSentryInitialized(): Promise<SentryModule | null> {
  const config = getSentryConfig();

  if (!config.enabled) {
    logSentryDebug("Sentry desabilitado (ambiente/DSN).");
    return Promise.resolve(null);
  }

  sentryInitPromise ??= loadSentryModule()
    .then((Sentry) => {
      if (sentryInitialized) {
        queueOptionalReplaySync(Sentry, config);
        return Sentry;
      }

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
        // Error monitoring stays available independently. Performance spans are
        // sampled only while the product-level analytics permission is active.
        tracesSampler: () =>
          optionalTelemetryEnabled ? config.tracesSampleRate : 0,
        // Replay is manually controlled below so it never records before opt-in.
        // The configured product rates are applied when choosing session versus
        // error-buffer mode after analytics consent is granted.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
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
      queueOptionalReplaySync(Sentry, config);
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
    environment: import.meta.env.MODE || "development",
    enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN && !automatedRuntime,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  };
}

/**
 * Controls only optional performance/replay telemetry. Error reporting remains
 * governed by getSentryConfig().enabled and is intentionally independent.
 */
export function setSentryOptionalTelemetryEnabled(enabled: boolean): void {
  optionalTelemetryEnabled = enabled;

  if (!sentryInitialized || !sentryModulePromise) return;

  void sentryModulePromise
    .then((Sentry) => queueOptionalReplaySync(Sentry, getSentryConfig()))
    .catch((error: unknown) => {
      logSentryDebug("Erro ao carregar Sentry para telemetria opcional:", error);
    });
}

export function initializeSentry(): void {
  void ensureSentryInitialized();
}

export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  withSentry((Sentry) => Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  }));
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

  withSentry((Sentry) => Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  }));
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

  withSentry((Sentry) => Sentry.captureMessage(message, {
    level: level as SeverityLevel,
    extra: context,
  }));
}

export function startSentryTransaction(name: string, op: string): unknown {
  const config = getSentryConfig();
  if (!config.enabled || !optionalTelemetryEnabled) return null;

  void ensureSentryInitialized().then((Sentry) => {
    if (!Sentry) return;
    const sentryApi = Sentry as unknown as Record<string, unknown>;
    const startTransaction = sentryApi["startTransaction"];
    if (typeof startTransaction !== "function") return;
    startTransaction({ name, op });
  });

  return null;
}

export function showSentryReportDialog(options?: SentryReportDialogOptions): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  withSentry((Sentry) => {
    const showReportDialog = Sentry.showReportDialog as
      | ((dialogOptions?: SentryReportDialogOptions) => void)
      | undefined;
    showReportDialog?.(options);
  });
}

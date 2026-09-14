import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Sentry optional telemetry consent boundary", () => {
  it("keeps performance and replay telemetry behind explicit analytics consent", () => {
    const sentry = read("src/shared/config/sentry.config.ts");

    expect(sentry).toContain("setSentryOptionalTelemetryEnabled");
    expect(sentry).toContain(
      "optionalTelemetryEnabled ? config.tracesSampleRate : 0",
    );
    expect(sentry).toContain("replaysSessionSampleRate: 0");
    expect(sentry).toContain("replaysOnErrorSampleRate: 0");
    expect(sentry).toContain("replay.start()");
    expect(sentry).toContain("replay.startBuffering()");
    expect(sentry).toContain("replay.stop()");
  });

  it("serializes replay transitions and reads the latest consent state at execution time", () => {
    const sentry = read("src/shared/config/sentry.config.ts");

    expect(sentry).toContain(
      "let optionalReplaySyncPromise: Promise<void> = Promise.resolve();",
    );
    expect(sentry).toContain("async function syncOptionalReplayNow(");
    expect(sentry).toContain("function queueOptionalReplaySync(");
    expect(sentry).toContain(
      ".then(() => syncOptionalReplayNow(Sentry, config))",
    );
    expect(sentry).toContain("if (!optionalTelemetryEnabled) {");
    expect(sentry).toContain("await Promise.resolve(replay.stop())");
    expect(sentry).toContain("await Promise.resolve(replay.start())");
    expect(sentry).toContain("await Promise.resolve(replay.startBuffering())");
    expect(sentry).not.toContain("void Promise.resolve(replay.stop())");
  });

  it("keeps operational error reporting independent from optional analytics telemetry", () => {
    const sentry = read("src/shared/config/sentry.config.ts");
    const captureExceptionStart = sentry.indexOf(
      "export function captureSentryException",
    );
    const captureMessageStart = sentry.indexOf(
      "export function captureSentryMessage",
    );
    const exceptionBlock = sentry.slice(captureExceptionStart, captureMessageStart);

    expect(exceptionBlock).toContain("Sentry.captureException");
    expect(exceptionBlock).not.toContain("optionalTelemetryEnabled");
  });

  it("keeps consent ownership outside the Sentry config layer", () => {
    const sentry = read("src/shared/config/sentry.config.ts");

    expect(sentry).not.toContain("ConsentService");
    expect(sentry).not.toContain("core/privacy");
    expect(sentry).not.toContain("lgpd-consent");
  });

  it("syncs optional telemetry and Web Vitals from the canonical consent owner", () => {
    const main = read("src/main.tsx");

    expect(main).toContain('import("./core/privacy/services/ConsentService.ts")');
    expect(main).not.toContain(
      'import { ConsentService } from "./core/privacy/services/ConsentService.ts"',
    );
    expect(main).toContain(
      'ConsentService.hasGrantedLocalConsent("analytics")',
    );
    expect(main).toContain("sentry.setSentryOptionalTelemetryEnabled(analyticsEnabled)");
    expect(main).toContain("installWebVitalsSentryReporter");
    expect(main).toContain("setWebVitalsReporter(null)");
    expect(main).toContain("ConsentService.subscribeToLocalConsent");
  });

  it("keeps the base Web Vitals collector independent from Sentry", () => {
    const webVitals = read("src/shared/utils/webVitals.ts");

    expect(webVitals).not.toContain("@sentry/");
    expect(webVitals).not.toContain("sentry.config");
  });
});

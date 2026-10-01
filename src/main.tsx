import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { deferFrame, deferIdle, deferLoad } from "./shared/utils/deferredInit.ts";

// In local development, remove any previously registered SW/caches that can
// intercept Vite assets and break HMR/WebSocket.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => undefined);

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => undefined);
  }
}

const isPublicRootAtBoot = window.location.pathname === "/";

// `index.html` is shared by every SPA route, so a static canonical there would
// incorrectly canonicalize internal pages to `/`. On the lean public root,
// reuse the already-versioned Open Graph URL as the canonical source.
if (isPublicRootAtBoot && !document.querySelector('link[rel="canonical"]')) {
  const canonicalSource = document.querySelector<HTMLMetaElement>(
    'meta[property="og:url"]',
  );
  const canonicalHref = canonicalSource?.content.trim();
  if (canonicalHref) {
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = canonicalHref;
    canonical.dataset.publicRootCanonical = "true";
    document.head.appendChild(canonical);
  }
}

// Critical path: render the app before starting non-critical services.
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

function loadOptionalFontStylesheet(): void {
  if (document.querySelector("link[data-public-font-loaded]")) return;

  const source = document.querySelector<HTMLMetaElement>(
    "meta[data-public-font-stylesheet]",
  );
  const href = source?.content.trim();
  if (!href) return;

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = href;
  stylesheet.dataset.publicFontLoaded = "true";
  document.head.appendChild(stylesheet);
}

// Typography is optional on the lean public root. Start it after document
// load so it never competes with the first contentful render.
if (isPublicRootAtBoot) {
  deferLoad(loadOptionalFontStylesheet);
} else {
  deferFrame(loadOptionalFontStylesheet);
}

// Measurement stays lightweight and starts after the first paint/load. It is
// local-only until the consent-aware Sentry reporter is explicitly attached.
const scheduleVitals = isPublicRootAtBoot ? deferLoad : deferFrame;
scheduleVitals(() => {
  import("./shared/utils/webVitals.ts").then(({ initWebVitals }) => {
    initWebVitals();
  });
});

let observabilityBootstrapped = false;
let webVitalsReporterInstalled = false;

const initializeObservability = () => {
  if (observabilityBootstrapped) return;
  observabilityBootstrapped = true;

  void Promise.all([
    import("./shared/config/sentry.config.ts"),
    import("./core/privacy/services/ConsentService.ts"),
  ]).then(async ([sentry, { ConsentService }]) => {
    const syncOptionalTelemetry = async () => {
      const analyticsEnabled =
        ConsentService.hasGrantedLocalConsent("analytics");

      sentry.setSentryOptionalTelemetryEnabled(analyticsEnabled);

      if (analyticsEnabled) {
        if (webVitalsReporterInstalled) return;

        const { installWebVitalsSentryReporter } = await import(
          "./shared/utils/webVitalsSentryReporter.ts"
        );
        // Consent may have changed while the reporter chunk was downloading.
        if (!ConsentService.hasGrantedLocalConsent("analytics")) return;

        installWebVitalsSentryReporter();
        webVitalsReporterInstalled = true;
        return;
      }

      if (!webVitalsReporterInstalled) return;
      webVitalsReporterInstalled = false;
      const { setWebVitalsReporter } = await import(
        "./shared/utils/webVitals.ts"
      );
      setWebVitalsReporter(null);
    };

    // Configure optional tracing/replay before Sentry initializes. Error
    // monitoring itself remains independent from the analytics preference.
    await syncOptionalTelemetry();
    sentry.initializeSentry();

    ConsentService.subscribeToLocalConsent(() => {
      void syncOptionalTelemetry();
    });
  });
};

// Error reporting is useful on every surface, but on `/` it should start only
// after the lean landing has completed its critical load path.
if (isPublicRootAtBoot) {
  deferLoad(initializeObservability);
} else {
  deferIdle(initializeObservability);
}

// AdSense is intentionally absent from the global bootstrap. The reusable
// AdSense component owns its configured client ID and loads the provider only
// when an actual ad slot is mounted, keeping ad networking off pages such as `/`
// that have no advertising surface.

deferLoad(() => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_BOOT === "true") {
    console.debug("Deferred initialization complete - App ready");
  }
});

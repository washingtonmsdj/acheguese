import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { DEFAULT_TILE_STYLE } from "./shared/config/mapDefaults.ts";
import { deferFrame, deferIdle, deferLoad } from "./shared/utils/deferredInit.ts";
import { scheduleAfterPublicRootMap } from "./shared/utils/publicRootReadiness.ts";

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

// The root map is a primary surface. Discover its small style document before
// React renders so MapLibre can reuse the response immediately when the canvas
// mounts. The URL remains owned by the canonical map defaults SSOT.
if (isPublicRootAtBoot && !document.querySelector("link[data-entry-map-style-preload]")) {
  const mapStylePreload = document.createElement("link");
  mapStylePreload.rel = "preload";
  mapStylePreload.as = "fetch";
  mapStylePreload.href = DEFAULT_TILE_STYLE.styleUrl;
  mapStylePreload.crossOrigin = "anonymous";
  mapStylePreload.setAttribute("fetchpriority", "high");
  mapStylePreload.dataset.entryMapStylePreload = "true";
  document.head.appendChild(mapStylePreload);
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

// Typography is optional on the community-first root. Let hero + map own the
// first network window; display=optional keeps the system fallback stable if
// the webfont arrives too late to improve this navigation.
if (isPublicRootAtBoot) {
  scheduleAfterPublicRootMap(loadOptionalFontStylesheet, {
    maxWaitMs: 2400,
    idleTimeoutMs: 1600,
    idleFallbackDelayMs: 650,
  });
} else {
  deferFrame(loadOptionalFontStylesheet);
}

// Measurement stays lightweight and starts after the first paint/load. The
// Sentry telemetry sink is attached later, after the public map has priority.
const scheduleVitals = isPublicRootAtBoot ? deferLoad : deferFrame;
scheduleVitals(() => {
  import("./shared/utils/webVitals.ts").then(({ initWebVitals }) => {
    initWebVitals();
  });
});

const initializeObservability = () => {
  void import("./shared/config/sentry.config.ts").then(async ({ initializeSentry }) => {
    initializeSentry();
    const { installWebVitalsSentryReporter } = await import(
      "./shared/utils/webVitalsSentryReporter.ts"
    );
    installWebVitalsSentryReporter();
  });
};

// Error reporting is useful on every surface, but on `/` it must not compete
// with the first usable map. A safety timeout prevents indefinite deferral.
if (isPublicRootAtBoot) {
  deferLoad(() => {
    scheduleAfterPublicRootMap(initializeObservability, {
      maxWaitMs: 2800,
      idleTimeoutMs: 2200,
      idleFallbackDelayMs: 900,
    });
  });
} else {
  deferIdle(initializeObservability);
}

const loadAds = () => {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1";
  if (isLocalhost) return;

  if (document.querySelector("script[data-acheguese-adsense]")) return;

  const ads = document.createElement("script");
  ads.async = true;
  ads.src =
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6454131132519516";
  ads.crossOrigin = "anonymous";
  ads.dataset.achegueseAdsense = "true";
  document.head.appendChild(ads);
};

// Ads remain entirely outside HTML parsing and, on `/`, wait for the map or a
// bounded timeout before consuming network/main-thread time.
if (isPublicRootAtBoot) {
  deferLoad(() => {
    scheduleAfterPublicRootMap(loadAds, {
      maxWaitMs: 3200,
      idleTimeoutMs: 2600,
      idleFallbackDelayMs: 1400,
    });
  });
} else {
  deferLoad(loadAds);
}

deferLoad(() => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_BOOT === "true") {
    console.debug("Deferred initialization complete - App ready");
  }
});

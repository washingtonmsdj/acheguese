import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  DEFAULT_TILE_STYLE,
  OPENFREEMAP_TILEJSON_URL,
} from "./shared/config/mapDefaults.ts";
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

// The root map is a primary surface. Discover the style and its vector-source
// TileJSON before React renders, cutting the otherwise sequential
// style -> TileJSON -> vector-tile network cascade. Both URLs remain owned by
// the canonical map defaults SSOT.
if (isPublicRootAtBoot) {
  if (!document.querySelector("link[data-entry-map-style-preload]")) {
    const mapStylePreload = document.createElement("link");
    mapStylePreload.rel = "preload";
    mapStylePreload.as = "fetch";
    mapStylePreload.href = DEFAULT_TILE_STYLE.styleUrl;
    mapStylePreload.crossOrigin = "anonymous";
    mapStylePreload.setAttribute("fetchpriority", "high");
    mapStylePreload.dataset.entryMapStylePreload = "true";
    document.head.appendChild(mapStylePreload);
  }

  if (!document.querySelector("link[data-entry-map-tilejson-preload]")) {
    const tileJsonPreload = document.createElement("link");
    tileJsonPreload.rel = "preload";
    tileJsonPreload.as = "fetch";
    tileJsonPreload.href = OPENFREEMAP_TILEJSON_URL;
    tileJsonPreload.crossOrigin = "anonymous";
    tileJsonPreload.setAttribute("fetchpriority", "high");
    tileJsonPreload.dataset.entryMapTilejsonPreload = "true";
    document.head.appendChild(tileJsonPreload);
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

// AdSense is intentionally absent from the global bootstrap. The reusable
// AdSense component owns its configured client ID and loads the provider only
// when an actual ad slot is mounted, keeping ad networking off pages such as `/`
// that have no advertising surface.

deferLoad(() => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_BOOT === "true") {
    console.debug("Deferred initialization complete - App ready");
  }
});

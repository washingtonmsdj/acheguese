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

// Critical path: render the app before starting non-critical services.
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

const isPublicRootAtBoot = window.location.pathname === "/";

// The public font stylesheet is already being fetched as a low-priority preload.
// Promote it only after the first paint without an extra bootstrap-script request.
deferFrame(() => {
  const fontStylesheet = document.querySelector<HTMLLinkElement>(
    "link[data-public-font-stylesheet]",
  );
  if (!fontStylesheet || fontStylesheet.rel === "stylesheet") return;

  fontStylesheet.rel = "stylesheet";
  fontStylesheet.removeAttribute("as");
  fontStylesheet.removeAttribute("fetchpriority");
});

// Keep measurements off the root's first paint. Other routes can start them
// earlier because their runtime already carries a larger application shell.
const scheduleVitals = isPublicRootAtBoot ? deferLoad : deferFrame;
scheduleVitals(() => {
  import("./shared/utils/webVitals.ts").then(({ initWebVitals }) => {
    initWebVitals();
  });
});

// Error reporting is useful on every surface, but does not need to compete
// with the community-first root for first paint, map startup or interaction.
const scheduleSentry = isPublicRootAtBoot ? deferLoad : deferIdle;
scheduleSentry(() => {
  import("./shared/config/sentry.config.ts").then(({ initializeSentry }) => {
    initializeSentry();
  });
});

// AdSense must not download or execute while the public entry and map are
// competing for the network/main thread. deferLoad already means load + idle.
deferLoad(() => {
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
});

deferLoad(() => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_BOOT === "true") {
    console.debug("Deferred initialization complete - App ready");
  }
});

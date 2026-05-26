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

// Defer one frame to keep the first paint responsive.
deferFrame(() => {
  import("./shared/utils/webVitals.ts").then(({ initWebVitals }) => {
    initWebVitals();
  });
});

// Services that are useful but should not block page startup.
deferIdle(() => {
  import("./shared/config/sentry.config.ts").then(({ initializeSentry }) => {
    initializeSentry();
  });

  import("@/core/authorization/services/AuthorizationEngine").then(({ AuthorizationEngine }) => {
    AuthorizationEngine.initialize();
  });

  import("@/integrations/maps").then(({ setupDefaultProviders }) => {
    setupDefaultProviders();
  });
});

deferLoad(() => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_BOOT === "true") {
    console.debug("Deferred initialization complete - App ready");
  }
});

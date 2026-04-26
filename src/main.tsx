import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSentry } from "./shared/config/sentry.config.ts";
import { deferFrame, deferIdle, deferLoad } from "./shared/utils/deferredInit.ts";

// In local development, remove any previously registered SW/caches that can
// intercept Vite assets and break HMR/WebSocket.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => undefined);

  if ("caches" in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => undefined);
  }
}

// ============================================================
// 🚀 CRITICAL PATH - Mínimo necessário para FCP
// ============================================================

// Render app imediatamente (máxima prioridade para FCP)
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// ============================================================
// ⏱️ DEFERRED INITIALIZATION - Após FCP
// ============================================================

// Defer 1 frame: Libera main thread para render
deferFrame(() => {
  // Initialize Web Vitals (métricas, não bloqueia funcionalidade)
  import("./shared/utils/webVitals.ts").then(({ initWebVitals }) => {
    initWebVitals();
  });
});

// Defer idle: Serviços não-críticos
deferIdle(() => {
  // Initialize Sentry (error tracking)
  initializeSentry();

  // Initialize authorization engine
  import("@/core/authorization").then(({ AuthorizationEngine }) => {
    AuthorizationEngine.initialize();
  });

  // Initialize map providers (só necessário para páginas com mapa)
  import("@/integrations/maps").then(({ setupDefaultProviders }) => {
    setupDefaultProviders();
  });
});

// Defer load: Métricas e analytics
deferLoad(() => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_BOOT === "true") {
    console.debug("Deferred initialization complete - App ready");
  }
});

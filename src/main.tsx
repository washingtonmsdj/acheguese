import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { deferFrame, deferIdle, deferLoad } from "./shared/utils/deferredInit.ts";

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
  import("./shared/config/sentry.config.ts").then(({ initializeSentry }) => {
    initializeSentry();
  });

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
  console.info('✅ Deferred initialization complete - App ready');
});

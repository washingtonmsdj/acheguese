import { Suspense } from "react";

// ============================================================
// 🚀 CRITICAL IMPORTS - Necessários para FCP
// ============================================================
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SEO } from "@/app/components/SEO";
import { WebVitalsReporter } from "@/app/components/WebVitalsReporter";
import { queryClient } from "@/shared/utils/queryClient";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";
import { SessionProvider } from "@/core/session/providers/SessionProvider";
import {
  MultiProfileProvider,
  ModuleContextSync,
} from "@/core/profiles/contexts/multi-profile-runtime-context";
import { AccessibilityProvider } from "@/shared/components/accessibility/AccessibilityProvider";
import { SkipToContent } from "@/shared/components/accessibility/SkipToContent";
import { TerritoryModeInitializer } from "@/core/location/components/TerritoryModeInitializer";
import {
  OfflineBanner,
  OfflineIndicator,
} from "@/shared/components/offline/OfflineIndicator";
import { AppRoutes } from "@/app/routes/AppRoutes";
import "@/styles/accessibility.css";

// ============================================================
// 🚀 COMPONENTE PRINCIPAL
// ============================================================

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <SEO />
      <WebVitalsReporter />
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <TooltipProvider>
            <SessionProvider>
              <MultiProfileProvider>
                <SkipToContent />
                <Toaster />
                <Sonner />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <TerritoryModeInitializer />
                  <OfflineIndicator />
                  <OfflineBanner />
                  <ModuleContextSync />
                  <Suspense fallback={<FullScreenLoader />}>
                    <AppRoutes />
                  </Suspense>
                </BrowserRouter>
              </MultiProfileProvider>
            </SessionProvider>
          </TooltipProvider>
        </AccessibilityProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;

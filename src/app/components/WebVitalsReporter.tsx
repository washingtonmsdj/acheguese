/**
 * WEB VITALS REPORTER (NÍVEL AAA)
 *
 * Monitora e reporta Core Web Vitals
 * Implementado sem hooks para evitar problemas de bundling
 */

import { type Metric } from "web-vitals";
import { logger } from "@/shared/utils/logger";

let initialized = false;

function initWebVitals() {
  if (initialized) return;
  initialized = true;

  // Dynamic import para evitar problemas de bundling com React
  import("web-vitals")
    .then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const reportMetric = (metric: Metric) => {
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_WEB_VITALS === "true") {
          logger.info(`WebVital ${metric.name}: ${metric.value}`, {
            action: metric.name,
          });
        }
      };

      onCLS(reportMetric);
      onINP(reportMetric);
      onFCP(reportMetric);
      onLCP(reportMetric);
      onTTFB(reportMetric);
    })
    .catch(() => {
      // Silently fail if web-vitals can't load
    });
}

interface WebVitalsReporterProps {
  onReport?: (metric: Metric) => void;
}

export function WebVitalsReporter(_props: WebVitalsReporterProps) {
  initWebVitals();
  return null;
}

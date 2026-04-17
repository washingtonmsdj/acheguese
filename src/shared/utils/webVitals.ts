/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals (LCP, INP, CLS) for performance monitoring
 * Integrado com Sentry para monitoramento em produÃ§Ã£o
 * 
 * @version 2.0.0
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";
import { logger } from "@/shared/utils/logger";
import { addSentryBreadcrumb } from "@/shared/config/sentry.config";

interface VitalsReport {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

// Thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 }, // Replaces FID
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(
  name: string,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

function reportMetric(metric: Metric) {
  const report: VitalsReport = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
  };

  // Log to console in development (opt-in)
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_WEB_VITALS === "true") {
    logger.info(
      `[WebVitals] ${report.name}: ${Math.round(report.value)}ms (${report.rating})`,
    );
  }

  // Send to analytics in production
  if (import.meta.env.PROD) {
    // Enviar para Sentry
    addSentryBreadcrumb(
      `Web Vital: ${report.name}`,
      'performance',
      report.rating === 'poor' ? 'warning' : 'info',
      {
        name: report.name,
        value: report.value,
        rating: report.rating,
        delta: report.delta,
        id: report.id,
      }
    );
  }
}

export function initWebVitals() {
  // Core Web Vitals
  onLCP(reportMetric); // Largest Contentful Paint
  onINP(reportMetric); // Interaction to Next Paint (replaces FID)
  onCLS(reportMetric); // Cumulative Layout Shift

  // Additional metrics
  onFCP(reportMetric); // First Contentful Paint
  onTTFB(reportMetric); // Time to First Byte
}


/**
 * Web Vitals measurement.
 *
 * Measurement stays lightweight and independent from Sentry. Telemetry can be
 * attached later through setWebVitalsReporter(), which lets the public root
 * collect buffered metrics without downloading observability code while the
 * map is still competing for CPU/network.
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

export interface VitalsReport {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

type VitalsReporter = (report: VitalsReport) => void;

const MAX_PENDING_REPORTS = 16;
const pendingReports: VitalsReport[] = [];
let reporter: VitalsReporter | null = null;

// Thresholds based on Google's recommendations.
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
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

export function setWebVitalsReporter(nextReporter: VitalsReporter | null): void {
  reporter = nextReporter;
  if (!reporter || pendingReports.length === 0) return;

  const queued = pendingReports.splice(0, pendingReports.length);
  queued.forEach((report) => reporter?.(report));
}

function reportMetric(metric: Metric): void {
  const report: VitalsReport = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
  };

  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_WEB_VITALS === "true") {
    console.debug(
      `[WebVitals] ${report.name}: ${Math.round(report.value)}ms (${report.rating})`,
    );
  }

  if (!import.meta.env.PROD) return;

  if (reporter) {
    reporter(report);
    return;
  }

  if (pendingReports.length >= MAX_PENDING_REPORTS) {
    pendingReports.shift();
  }
  pendingReports.push(report);
}

export function initWebVitals(): void {
  onLCP(reportMetric);
  onINP(reportMetric);
  onCLS(reportMetric);
  onFCP(reportMetric);
  onTTFB(reportMetric);
}

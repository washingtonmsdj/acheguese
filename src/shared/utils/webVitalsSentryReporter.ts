import { addSentryBreadcrumb } from "@/shared/config/sentry.config";
import {
  setWebVitalsReporter,
  type VitalsReport,
} from "@/shared/utils/webVitals";

function reportWebVitalToSentry(report: VitalsReport): void {
  addSentryBreadcrumb(
    `Web Vital: ${report.name}`,
    "performance",
    report.rating === "poor" ? "warning" : "info",
    {
      name: report.name,
      value: report.value,
      rating: report.rating,
      delta: report.delta,
      id: report.id,
    },
  );
}

/**
 * Installs Sentry as the telemetry sink only after observability is allowed to
 * enter the runtime. Metrics collected before this point are flushed from the
 * lightweight Web Vitals queue.
 */
export function installWebVitalsSentryReporter(): void {
  setWebVitalsReporter(reportWebVitalToSentry);
}

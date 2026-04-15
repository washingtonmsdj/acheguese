/**
 * Utilitário para tracking de erros
 * Integra com Sentry para monitoramento em produção
 *
 * @version 3.0.0 - Integrado com Sentry
 */

import { logger } from "@/shared/utils/logger";
import {
  captureSentryException,
  addSentryBreadcrumb,
  captureSentryMessage,
} from "@/shared/config/sentry.config";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  profileId?: string;
  severity?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
}

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface PerformanceMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Rastreia erro para serviço de monitoramento
 */
export function trackError(
  error: Error | unknown,
  context?: ErrorContext,
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  // Usar logger centralizado
  logger.error("Error tracked", errorObj, {
    component: context?.component,
    action: context?.action,
    userId: context?.userId,
    profileId: context?.profileId,
    severity: context?.severity || "medium",
    ...context?.metadata,
  });

  // Integrar com Sentry
  captureSentryException(errorObj, {
    component: context?.component,
    action: context?.action,
    userId: context?.userId,
    profileId: context?.profileId,
    severity: context?.severity || "medium",
    ...context?.metadata,
  });
}

/**
 * Rastreia evento customizado
 */
export function trackEvent(
  eventName: string,
  properties?: EventProperties,
): void {
  logger.info(`Event: ${eventName}`, {
    action: "track_event",
    ...properties,
  });

  // Adicionar breadcrumb no Sentry
  addSentryBreadcrumb(
    eventName,
    'event',
    'info',
    properties as Record<string, unknown>
  );
}

/**
 * Rastreia performance
 */
export function trackPerformance(
  metricName: string,
  value: number,
  metadata?: PerformanceMetadata,
): void {
  logger.info(`Performance: ${metricName}`, {
    action: "track_performance",
    metric: metricName,
    value,
    ...metadata,
  });

  // Adicionar breadcrumb de performance no Sentry
  addSentryBreadcrumb(
    `Performance: ${metricName} = ${value}ms`,
    'performance',
    'info',
    {
      metric: metricName,
      value,
      ...metadata,
    } as Record<string, unknown>
  );
}

/**
 * Identity Logger - Logs centralizados para eventos de identidade pública
 * Garante consistência e rastreabilidade de todas as operações críticas
 */

import { logger } from '@/shared/utils/logger';
import type { EntityType } from '../domain/types';

interface IdentitySaveAttemptParams {
  entityType: EntityType;
  entityId: string;
  oldIdentifier: string;
  newIdentifier: string;
  userId: string;
  page: string;
}

interface IdentitySaveSuccessParams extends IdentitySaveAttemptParams {
  durationMs: number;
}

interface IdentitySaveErrorParams extends IdentitySaveAttemptParams {
  error: string;
  errorCode?: string;
}

interface PageNotFoundParams {
  entityType: EntityType;
  identifier: string;
  attemptedUrl: string;
}

interface PageViewParams {
  entityType: EntityType;
  identifier: string;
  wasRedirected?: boolean;
  userId?: string;
}

/**
 * Log de tentativa de alteração de identidade
 */
export function logIdentitySaveAttempt(params: IdentitySaveAttemptParams): void {
  logger.info(`[${params.page}] identity_change_save_attempt`, {
    entityType: params.entityType,
    entityId: params.entityId,
    oldIdentifier: params.oldIdentifier,
    newIdentifier: params.newIdentifier,
    userId: params.userId,
  });
}

/**
 * Log de sucesso de alteração de identidade
 */
export function logIdentitySaveSuccess(params: IdentitySaveSuccessParams): void {
  logger.info(`[${params.page}] identity_change_save_success`, {
    entityType: params.entityType,
    entityId: params.entityId,
    oldIdentifier: params.oldIdentifier,
    newIdentifier: params.newIdentifier,
    userId: params.userId,
    durationMs: params.durationMs,
  });
}

/**
 * Log de erro de alteração de identidade
 */
export function logIdentitySaveError(params: IdentitySaveErrorParams): void {
  logger.error(`[${params.page}] identity_change_save_error`, {
    entityType: params.entityType,
    entityId: params.entityId,
    oldIdentifier: params.oldIdentifier,
    newIdentifier: params.newIdentifier,
    userId: params.userId,
    error: params.error,
    errorCode: params.errorCode,
  });
}

/**
 * Log de página pública não encontrada (404)
 */
export function logPageNotFound(params: PageNotFoundParams): void {
  logger.info('[PublicPage] page_not_found', {
    entityType: params.entityType,
    identifier: params.identifier,
    attemptedUrl: params.attemptedUrl,
  });
}

/**
 * Log de visualização de página pública
 */
export function logPageView(params: PageViewParams): void {
  logger.info('[PublicPage] page_view', {
    entityType: params.entityType,
    identifier: params.identifier,
    wasRedirected: params.wasRedirected,
    userId: params.userId,
  });
}

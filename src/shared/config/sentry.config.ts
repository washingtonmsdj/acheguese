/**
 * Configuração do Sentry para Monitoramento de Erros
 * 
 * Este arquivo centraliza toda a configuração do Sentry,
 * incluindo inicialização, opções e integrações.
 * 
 * @version 1.0.0
 */

import * as Sentry from '@sentry/react';

/**
 * Configuração do Sentry
 */
export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * Obtém configuração do Sentry a partir das variáveis de ambiente
 */
export function getSentryConfig(): SentryConfig {
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.MODE || 'development',
    enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% em produção, 100% em dev
    replaysSessionSampleRate: 0.1, // 10% das sessões
    replaysOnErrorSampleRate: 1.0, // 100% quando há erro
  };
}

/**
 * Inicializa o Sentry
 */
export function initializeSentry(): void {
  const config = getSentryConfig();

  // Não inicializar se não estiver habilitado
  if (!config.enabled) {
    console.info('ℹ️  Sentry não habilitado (desenvolvimento ou DSN não configurado)');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      
      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance
      tracesSampleRate: config.tracesSampleRate,
      
      // Session Replay
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
      
      // Filtros
      beforeSend(event, hint) {
        // Filtrar erros de desenvolvimento
        if (config.environment === 'development') {
          console.log('🔍 Sentry Event (dev):', event);
          return null; // Não enviar em desenvolvimento
        }

        // Filtrar erros conhecidos/ignoráveis
        const error = hint.originalException;
        if (error instanceof Error) {
          // Ignorar erros de rede temporários
          if (error.message.includes('NetworkError') || 
              error.message.includes('Failed to fetch')) {
            return null;
          }
          
          // Ignorar erros de extensões do navegador
          if (error.stack?.includes('chrome-extension://') ||
              error.stack?.includes('moz-extension://')) {
            return null;
          }
        }

        return event;
      },
      
      // Ignorar erros específicos
      ignoreErrors: [
        // Erros de rede
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        
        // Erros de navegador
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        
        // Erros de extensões
        'chrome-extension://',
        'moz-extension://',
      ],
    });

    console.info('✅ Sentry inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Sentry:', error);
  }
}

/**
 * Define usuário no Sentry
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Remove usuário do Sentry (logout)
 */
export function clearSentryUser(): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  Sentry.setUser(null);
}

/**
 * Define contexto adicional no Sentry
 */
export function setSentryContext(
  key: string,
  context: Record<string, unknown>
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  Sentry.setContext(key, context);
}

/**
 * Adiciona breadcrumb ao Sentry
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  data?: Record<string, unknown>
): void {
  const config = getSentryConfig();
  if (!config.enabled) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Captura exceção manualmente
 */
export function captureSentryException(
  error: Error,
  context?: Record<string, unknown>
): void {
  const config = getSentryConfig();
  if (!config.enabled) {
    console.error('Error (Sentry disabled):', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Captura mensagem manualmente
 */
export function captureSentryMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, unknown>
): void {
  const config = getSentryConfig();
  if (!config.enabled) {
    console.log(`Message (Sentry disabled) [${level}]:`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Inicia transação de performance
 */
export function startSentryTransaction(
  name: string,
  op: string
): any {
  const config = getSentryConfig();
  if (!config.enabled) return null;

  const sentryApi = Sentry as unknown as Record<string, unknown>;
  const startTransaction = sentryApi['startTransaction'];

  if (typeof startTransaction === 'function') {
    return (startTransaction as (context: { name: string; op: string }) => unknown)({
      name,
      op,
    });
  }

  return null;
}

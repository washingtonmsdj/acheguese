/**
 * StructuredLogger - Logger estruturado para PostService
 * Sprint 2 - Fase 2
 */

export class StructuredLogger {
  static error(service: string, method: string, message: string, context: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
      stack: context.error?.stack,
    }));
  }

  static warn(service: string, method: string, message: string, context: any) {
    console.warn(JSON.stringify({
      level: 'WARN',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }

  static info(service: string, method: string, message: string, context: any) {
    console.info(JSON.stringify({
      level: 'INFO',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
}

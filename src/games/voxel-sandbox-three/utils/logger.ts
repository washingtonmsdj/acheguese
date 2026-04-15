/**
 * Logger estruturado para o sistema de flood test
 * 
 * Fornece logging com níveis (debug, info, warn, error) e controle de verbosidade.
 */

/**
 * Níveis de log
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Configuração do logger
 */
interface LoggerConfig {
  /** Nível mínimo de log (padrão: INFO em produção, DEBUG em desenvolvimento) */
  minLevel?: LogLevel;
  /** Prefixo para todas as mensagens (padrão: "[FloodTest]") */
  prefix?: string;
  /** Incluir timestamp (padrão: true em desenvolvimento) */
  includeTimestamp?: boolean;
}

/**
 * Logger estruturado
 */
class Logger {
  private minLevel: LogLevel;
  private prefix: string;
  private includeTimestamp: boolean;
  
  constructor(config: LoggerConfig = {}) {
    this.minLevel = config.minLevel ?? (
      process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
    );
    this.prefix = config.prefix ?? "[FloodTest]";
    this.includeTimestamp = config.includeTimestamp ?? (
      process.env.NODE_ENV !== 'production'
    );
  }
  
  /**
   * Formatar mensagem com prefixo e timestamp
   */
  private format(level: string, message: string): string {
    const parts: string[] = [this.prefix];
    
    if (this.includeTimestamp) {
      const now = new Date();
      const time = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        // fractionalSecondDigits not in TS DateTimeFormatOptions
      });
      parts.push(`[${time}]`);
    }
    
    parts.push(`[${level}]`);
    parts.push(message);
    
    return parts.join(' ');
  }
  
  /**
   * Log de debug (apenas em desenvolvimento)
   * 
   * @param message - Mensagem
   * @param data - Dados adicionais (opcional)
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      const formatted = this.format('DEBUG', message);
      if (data !== undefined) {
        console.log(formatted, data);
      } else {
        console.log(formatted);
      }
    }
  }
  
  /**
   * Log de informação
   * 
   * @param message - Mensagem
   * @param data - Dados adicionais (opcional)
   */
  info(message: string, data?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.INFO) {
      const formatted = this.format('INFO', message);
      if (data !== undefined) {
        console.log(formatted, data);
      } else {
        console.log(formatted);
      }
    }
  }
  
  /**
   * Log de aviso
   * 
   * @param message - Mensagem
   * @param data - Dados adicionais (opcional)
   */
  warn(message: string, data?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.WARN) {
      const formatted = this.format('WARN', message);
      if (data !== undefined) {
        console.warn(formatted, data);
      } else {
        console.warn(formatted);
      }
    }
  }
  
  /**
   * Log de erro
   *
   * @param message - Mensagem
   * @param error - Erro (opcional) — aceita qualquer tipo
   */
  error(message: string, error?: unknown): void {
    if (this.minLevel <= LogLevel.ERROR) {
      const formatted = this.format('ERROR', message);
      if (error !== undefined) {
        console.error(formatted, error);
      } else {
        console.error(formatted);
      }
    }
  }
  
  /**
   * Definir nível mínimo de log
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * Obter nível mínimo atual
   */
  getMinLevel(): LogLevel {
    return this.minLevel;
  }
  
  /**
   * Criar sub-logger com prefixo adicional
   * 
   * @param subPrefix - Prefixo adicional
   * @returns Novo logger
   * 
   * @example
   * const mainLogger = new Logger({ prefix: "[FloodTest]" });
   * const physicsLogger = mainLogger.createChild("Physics");
   * physicsLogger.info("Arca flutuando"); // [FloodTest] [Physics] [INFO] Arca flutuando
   */
  createChild(subPrefix: string): Logger {
    return new Logger({
      minLevel: this.minLevel,
      prefix: `${this.prefix} [${subPrefix}]`,
      includeTimestamp: this.includeTimestamp,
    });
  }
}

/**
 * Logger global para o sistema de flood test
 */
export const logger = new Logger();

/**
 * Loggers especializados
 */
export const loggers = {
  /** Logger para física */
  physics: logger.createChild("Physics"),
  /** Logger para renderização */
  render: logger.createChild("Render"),
  /** Logger para partículas */
  particles: logger.createChild("Particles"),
  /** Logger para texturas */
  textures: logger.createChild("Textures"),
  /** Logger para performance */
  performance: logger.createChild("Performance"),
};

/**
 * Medir tempo de execução de uma função
 * 
 * @param name - Nome da operação
 * @param fn - Função a executar
 * @returns Resultado da função
 * 
 * @example
 * const result = measureTime("Carregar texturas", () => {
 *   return loadTextures();
 * });
 */
export function measureTime<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  
  loggers.performance.debug(`${name} levou ${duration.toFixed(2)}ms`);
  
  return result;
}

/**
 * Medir tempo de execução de uma função assíncrona
 * 
 * @param name - Nome da operação
 * @param fn - Função assíncrona a executar
 * @returns Promise com resultado da função
 * 
 * @example
 * const result = await measureTimeAsync("Carregar texturas", async () => {
 *   return await loadTexturesAsync();
 * });
 */
export async function measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  
  loggers.performance.debug(`${name} levou ${duration.toFixed(2)}ms`);
  
  return result;
}

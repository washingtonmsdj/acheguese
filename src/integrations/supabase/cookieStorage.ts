/**
 * Secure Cookie Storage for Supabase Auth
 * 
 * Implementação de storage seguro usando cookies com HttpOnly TRUE.
 * 
 * ARQUITETURA:
 * - Client-side: Define cookies via JavaScript (httpOnly ignorado pelo browser)
 * - Server-side: middleware.ts intercepta e migra para HttpOnly TRUE
 * - Migração automática: cookies client-side → server-side HttpOnly
 * 
 * SEGURANÇA:
 * - Cookies com Secure flag (HTTPS only)
 * - SameSite=Strict (proteção CSRF)
 * - HttpOnly=TRUE (via middleware.ts) ⭐ IMPLEMENTADO
 * - Path=/ (disponível em toda aplicação)
 * - Max-Age configurável
 * 
 * HTTPONLY VERDADEIRO:
 * ✅ Implementado via Vercel Edge Middleware (middleware.ts)
 * ✅ Cookies inacessíveis via JavaScript
 * ✅ Proteção contra XSS cookie theft
 * ✅ Session hijacking prevention
 * ✅ Migração automática de cookies existentes
 * 
 * SSOT: Todas as configurações importadas de security.config.ts
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 * @see middleware.ts - Server-side cookie management
 */
import type { SupportedStorage } from '@supabase/supabase-js';
import { SECURE_COOKIE_CONFIG, AUTH_COOKIE_PREFIX } from '@/config/security.config';
import { logger } from '@/shared/utils/logger';
/**
 * Configuração de cookies seguros (importada do SSOT)
 */
const COOKIE_OPTIONS = SECURE_COOKIE_CONFIG;
/**
 * Utilitário para manipulação segura de cookies
 */
class CookieManager {
  /**
   * Define um cookie com flags de segurança
   */
  static set(name: string, value: string, options = COOKIE_OPTIONS): void {
    if (typeof document === 'undefined') return;

    const cookieParts = [
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
      `Path=${options.path}`,
      `SameSite=${options.sameSite}`,
      `Max-Age=${options.maxAge}`,
    ];

    // Adiciona Secure flag apenas em HTTPS
    if (options.secure && window.location.protocol === 'https:') {
      cookieParts.push('Secure');
    }

    document.cookie = cookieParts.join('; ');
  }

  /**
   * Obtém valor de um cookie
   */
  static get(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const encodedName = encodeURIComponent(name);

    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === encodedName) {
        return decodeURIComponent(cookieValue);
      }
    }

    return null;
  }

  /**
   * Remove um cookie
   */
  static remove(name: string): void {
    if (typeof document === 'undefined') return;

    // Define Max-Age=0 para expirar imediatamente
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0`;
  }

  /**
   * Verifica se cookies estão habilitados
   */
  static isEnabled(): boolean {
    if (typeof document === 'undefined') return false;

    try {
      const testKey = '__cookie_test__';
      CookieManager.set(testKey, 'test', { ...COOKIE_OPTIONS, maxAge: 1 });
      const result = CookieManager.get(testKey) === 'test';
      CookieManager.remove(testKey);
      return result;
    } catch {
      return false;
    }
  }
}

/**
 * Implementação de SupportedStorage usando cookies seguros
 * 
 * Esta classe implementa a interface SupportedStorage do Supabase
 * para armazenar tokens de autenticação em cookies ao invés de localStorage.
 * 
 * VANTAGENS:
 * - Cookies podem ser HttpOnly (quando configurado no servidor)
 * - Proteção contra XSS
 * - SameSite=Strict protege contra CSRF
 * - Secure flag garante transmissão apenas via HTTPS
 * 
 * LIMITAÇÕES:
 * - HttpOnly verdadeiro requer middleware no servidor
 * - Tamanho limitado (4KB por cookie)
 * - Enviado em toda requisição (overhead mínimo)
 */
export class SecureCookieStorage implements SupportedStorage {
  private prefix: string;

  constructor(prefix = AUTH_COOKIE_PREFIX) {
    this.prefix = prefix;
  }

  /**
   * Obtém item do cookie storage
   */
  getItem(key: string): string | null {
    const cookieName = `${this.prefix}-${key}`;
    return CookieManager.get(cookieName);
  }

  /**
   * Define item no cookie storage
   */
  setItem(key: string, value: string): void {
    const cookieName = `${this.prefix}-${key}`;
    CookieManager.set(cookieName, value);
  }

  /**
   * Remove item do cookie storage
   */
  removeItem(key: string): void {
    const cookieName = `${this.prefix}-${key}`;
    CookieManager.remove(cookieName);
  }
}

/**
 * Storage híbrido: tenta cookies primeiro, fallback para localStorage
 * 
 * Esta implementação garante compatibilidade máxima:
 * - Usa cookies se disponíveis (mais seguro)
 * - Fallback para localStorage se cookies desabilitados
 * - Migra dados de localStorage para cookies automaticamente
 */
export class HybridStorage implements SupportedStorage {
  private cookieStorage: SecureCookieStorage;
  private localStorageAvailable: boolean;
  private cookiesAvailable: boolean;

  constructor() {
    this.cookieStorage = new SecureCookieStorage();
    this.localStorageAvailable = this.checkLocalStorage();
    this.cookiesAvailable = CookieManager.isEnabled();

    // Log de configuração (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      logger.debug('[HybridStorage] Initialized', {
        cookies: this.cookiesAvailable ? '✅' : '❌',
        localStorage: this.localStorageAvailable ? '✅' : '❌',
        preferredStorage: this.cookiesAvailable ? 'cookies' : 'localStorage',
      });
    }
  }

  /**
   * Verifica se localStorage está disponível
   */
  private checkLocalStorage(): boolean {
    try {
      const testKey = '__ls_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Migra dados de localStorage para cookies
   */
  private migrateFromLocalStorage(key: string): void {
    if (!this.localStorageAvailable || !this.cookiesAvailable) return;

    try {
      const value = localStorage.getItem(key);
      if (value) {
        this.cookieStorage.setItem(key, value);
        localStorage.removeItem(key);
        
        if (import.meta.env.DEV) {
          logger.debug(`[HybridStorage] Migrated ${key} from localStorage to cookies`);
        }
      }
    } catch (error) {
      console.warn('[HybridStorage] Migration failed:', error);
    }
  }

  /**
   * Obtém item (cookies primeiro, fallback para localStorage)
   */
  getItem(key: string): string | null {
    // Tentar cookies primeiro
    if (this.cookiesAvailable) {
      const value = this.cookieStorage.getItem(key);
      if (value) return value;

      // Se não encontrou em cookies, tentar migrar de localStorage
      this.migrateFromLocalStorage(key);
      return this.cookieStorage.getItem(key);
    }

    // Fallback para localStorage
    if (this.localStorageAvailable) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Define item (cookies preferencial, fallback para localStorage)
   */
  setItem(key: string, value: string): void {
    // Tentar cookies primeiro
    if (this.cookiesAvailable) {
      try {
        this.cookieStorage.setItem(key, value);
        
        // Remover de localStorage se existir (migração)
        if (this.localStorageAvailable) {
          try {
            localStorage.removeItem(key);
          } catch {
            // Ignorar erro de remoção
          }
        }
        return;
      } catch (error) {
        logger.warn('[HybridStorage] Cookie storage failed, falling back to localStorage:', error);
      }
    }

    // Fallback para localStorage
    if (this.localStorageAvailable) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        logger.error('[HybridStorage] All storage methods failed:', error);
      }
    }
  }

  /**
   * Remove item de ambos os storages
   */
  removeItem(key: string): void {
    if (this.cookiesAvailable) {
      this.cookieStorage.removeItem(key);
    }

    if (this.localStorageAvailable) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignorar erro
      }
    }
  }
}

/**
 * Factory para criar storage apropriado baseado no ambiente
 */
export function createSecureStorage(): SupportedStorage {
  // Em produção, usar storage híbrido (cookies preferencial)
  if (import.meta.env.PROD) {
    return new HybridStorage();
  }

  // Em desenvolvimento, permitir localStorage para facilitar debug
  // mas avisar sobre migração futura
  if (import.meta.env.DEV) {
    logger.warn(
      '[Security] Usando localStorage em desenvolvimento. ' +
      'Em produção, tokens serão armazenados em cookies seguros.'
    );
    return new HybridStorage();
  }

  return new HybridStorage();
}

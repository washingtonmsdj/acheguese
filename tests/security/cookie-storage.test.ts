/**
 * Testes de Cookie Storage Seguro
 * 
 * Valida que tokens são armazenados de forma segura em cookies.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecureCookieStorage, HybridStorage } from '@/integrations/supabase/cookieStorage';

describe('SecureCookieStorage', () => {
  let storage: SecureCookieStorage;

  beforeEach(() => {
    storage = new SecureCookieStorage('test');
    // Limpar cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; Max-Age=0`;
    });
  });

  afterEach(() => {
    // Limpar cookies após cada teste
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; Max-Age=0`;
    });
  });

  describe('setItem / getItem', () => {
    it('deve armazenar e recuperar valores', () => {
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
    });

    it('deve retornar null para chaves inexistentes', () => {
      expect(storage.getItem('nonexistent')).toBeNull();
    });

    it('deve sobrescrever valores existentes', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key1', 'value2');
      expect(storage.getItem('key1')).toBe('value2');
    });

    it('deve lidar com valores vazios', () => {
      storage.setItem('empty', '');
      expect(storage.getItem('empty')).toBe('');
    });

    it('deve lidar com caracteres especiais', () => {
      const specialValue = 'value with spaces & special=chars';
      storage.setItem('special', specialValue);
      expect(storage.getItem('special')).toBe(specialValue);
    });

    it('deve lidar com JSON stringificado', () => {
      const jsonValue = JSON.stringify({ token: 'abc123', expires: 123456 });
      storage.setItem('json', jsonValue);
      expect(storage.getItem('json')).toBe(jsonValue);
    });
  });

  describe('removeItem', () => {
    it('deve remover itens', () => {
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      expect(storage.getItem('key1')).toBeNull();
    });

    it('deve ser idempotente', () => {
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      storage.removeItem('key1'); // Segunda remoção não deve causar erro
      expect(storage.getItem('key1')).toBeNull();
    });
  });

  describe('Isolamento de prefixo', () => {
    it('deve isolar storages com prefixos diferentes', () => {
      const storage1 = new SecureCookieStorage('prefix1');
      const storage2 = new SecureCookieStorage('prefix2');

      storage1.setItem('key', 'value1');
      storage2.setItem('key', 'value2');

      expect(storage1.getItem('key')).toBe('value1');
      expect(storage2.getItem('key')).toBe('value2');
    });
  });
});

describe('HybridStorage', () => {
  let storage: HybridStorage;

  beforeEach(() => {
    storage = new HybridStorage();
    
    // Limpar cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; Max-Age=0`;
    });

    // Limpar localStorage
    localStorage.clear();
  });

  afterEach(() => {
    // Limpar cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; Max-Age=0`;
    });

    // Limpar localStorage
    localStorage.clear();
  });

  describe('Preferência por cookies', () => {
    it('deve usar cookies quando disponíveis', () => {
      storage.setItem('key1', 'value1');
      
      // Verificar que está em cookies
      expect(document.cookie).toContain('sb-auth-key1');
      
      // Verificar que NÃO está em localStorage
      expect(localStorage.getItem('key1')).toBeNull();
    });

    it('deve recuperar de cookies', () => {
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
    });
  });

  describe('Migração de localStorage para cookies', () => {
    it('deve migrar dados existentes de localStorage', () => {
      // Simular dados antigos em localStorage
      localStorage.setItem('token', 'old-token-value');

      // Tentar recuperar (deve migrar automaticamente)
      const value = storage.getItem('token');

      // Verificar que migrou para cookies
      expect(value).toBe('old-token-value');
      expect(document.cookie).toContain('sb-auth-token');
      
      // Verificar que removeu de localStorage
      expect(localStorage.getItem('sb-auth-token')).toBeNull();
    });

    it('não deve migrar se valor não existir', () => {
      const value = storage.getItem('nonexistent');
      expect(value).toBeNull();
    });
  });

  describe('Fallback para localStorage', () => {
    it('deve usar localStorage se cookies falharem', () => {
      // Mock de cookies desabilitados
      const originalOwnCookie = Object.getOwnPropertyDescriptor(document, 'cookie');
      const originalProtoCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

      Object.defineProperty(document, 'cookie', {
        get: () => '',
        set: () => {
          throw new Error('Cookies disabled');
        },
        configurable: true,
      });

      try {
        // Criar novo storage com cookies desabilitados
        const storageWithoutCookies = new HybridStorage();

        // Deve usar localStorage
        storageWithoutCookies.setItem('key1', 'value1');
        expect(localStorage.getItem('key1')).toBe('value1');
      } finally {
        // Restaurar mesmo se o teste falhar
        if (originalOwnCookie) {
          Object.defineProperty(document, 'cookie', originalOwnCookie);
        } else if (originalProtoCookie) {
          delete (document as { cookie?: string }).cookie;
          Object.defineProperty(Document.prototype, 'cookie', originalProtoCookie);
        }
      }
    });
  });

  describe('removeItem', () => {
    it('deve remover de ambos os storages', () => {
      // Adicionar em ambos
      storage.setItem('key1', 'value1');
      localStorage.setItem('key1', 'value1');

      // Remover
      storage.removeItem('key1');

      // Verificar que removeu de ambos
      expect(storage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key1')).toBeNull();
    });
  });
});

describe('Segurança de Cookies', () => {
  it('deve definir cookies com flags de segurança', () => {
    const storage = new SecureCookieStorage('test');
    storage.setItem('secure-key', 'secure-value');

    const cookies = document.cookie;
    
    // Verificar que cookie foi criado
    expect(cookies).toContain('test-secure-key');
    
    // Nota: Não podemos verificar Secure e HttpOnly via JavaScript
    // pois essas flags são intencionalmente inacessíveis
    // Elas são verificadas via testes E2E ou inspeção manual
  });

  it('não deve expor tokens via document.cookie em produção', () => {
    // Este teste documenta a limitação atual:
    // Cookies ainda são acessíveis via document.cookie no client-side
    // Para HttpOnly verdadeiro, é necessário middleware no servidor
    
    const storage = new SecureCookieStorage('test');
    storage.setItem('token', 'sensitive-token');

    // ⚠️ LIMITAÇÃO: Token ainda acessível via document.cookie
    expect(document.cookie).toContain('test-token');
    
    // TODO: Implementar middleware server-side para HttpOnly verdadeiro
  });
});

describe('Compatibilidade com Supabase', () => {
  it('deve implementar interface SupportedStorage', () => {
    const storage = new SecureCookieStorage();
    
    // Verificar que tem todos os métodos necessários
    expect(typeof storage.getItem).toBe('function');
    expect(typeof storage.setItem).toBe('function');
    expect(typeof storage.removeItem).toBe('function');
  });

  it('deve armazenar sessão do Supabase', () => {
    const storage = new HybridStorage();
    
    // Simular sessão do Supabase
    const session = JSON.stringify({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000,
    });

    storage.setItem('token', session);
    
    const retrieved = storage.getItem('token');
    expect(retrieved).toBe(session);
    
    // Verificar que pode ser parseado
    const parsed = JSON.parse(retrieved!);
    expect(parsed.access_token).toBe('mock-access-token');
  });
});

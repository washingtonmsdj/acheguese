/**
 * SECURITY UTILITIES
 * Funções centralizadas de segurança para edge functions
 */

// ══════════════════════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Retorna headers CORS seguros baseados em configuração de ambiente
 * 
 * IMPORTANTE: Nunca use '*' em produção!
 * Configure ALLOWED_ORIGINS no ambiente com domínios específicos
 */
export function getCorsHeaders(methods = 'POST, OPTIONS'): Record<string, string> {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';
  
  // Em desenvolvimento, permite localhost
  const isDev = Deno.env.get('DENO_ENV') === 'development';
  const defaultOrigin = isDev 
    ? 'http://localhost:8080,http://localhost:5173' 
    : '';
  
  const origins = allowedOrigins || defaultOrigin;
  
  // Se não houver origens configuradas, bloqueia tudo
  if (!origins) {
    console.warn('⚠️ ALLOWED_ORIGINS não configurado - bloqueando CORS');
    return {
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info',
    };
  }
  
  // Retorna primeira origem (edge functions não suportam múltiplas origens diretamente)
  // Para suporte completo, implemente validação dinâmica baseada no header Origin
  const primaryOrigin = origins.split(',')[0].trim();
  
  return {
    'Access-Control-Allow-Origin': primaryOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, stripe-signature',
    'Access-Control-Max-Age': '86400', // 24 horas
  };
}

/**
 * Valida se a origem da requisição é permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';
  const isDev = Deno.env.get('DENO_ENV') === 'development';
  
  if (isDev && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return true;
  }
  
  const origins = allowedOrigins.split(',').map(o => o.trim());
  return origins.includes(origin);
}

// ══════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Retorna headers de segurança padrão
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}

/**
 * Combina todos os headers de segurança
 */
export function getAllSecurityHeaders(methods = 'POST, OPTIONS'): Record<string, string> {
  return {
    ...getCorsHeaders(methods),
    ...getSecurityHeaders(),
    'Content-Type': 'application/json',
  };
}

// ══════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ══════════════════════════════════════════════════════════════════════════

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Implementação simples de rate limiting em memória
 * 
 * NOTA: Para produção, use Redis ou Deno KV para rate limiting distribuído
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  // Limpa entradas expiradas
  if (rateLimitStore[key] && rateLimitStore[key].resetAt < now) {
    delete rateLimitStore[key];
  }
  
  // Inicializa ou incrementa contador
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return { allowed: true, remaining: maxRequests - 1, resetAt: rateLimitStore[key].resetAt };
  }
  
  rateLimitStore[key].count++;
  const remaining = Math.max(0, maxRequests - rateLimitStore[key].count);
  const allowed = rateLimitStore[key].count <= maxRequests;
  
  return { allowed, remaining, resetAt: rateLimitStore[key].resetAt };
}

/**
 * Middleware de rate limiting para edge functions
 */
export function rateLimitMiddleware(
  req: Request,
  maxRequests = 100,
  windowMs = 60000
): Response | null {
  // Usa IP ou user-agent como identificador
  const identifier = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('user-agent') || 
                     'unknown';
  
  const { allowed, remaining, resetAt } = checkRateLimit(identifier, maxRequests, windowMs);
  
  if (!allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      }),
      { 
        status: 429,
        headers: {
          ...getAllSecurityHeaders(),
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  }
  
  return null; // Permitido
}

// ══════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Valida e sanitiza entrada de string
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove caracteres de controle e limita tamanho
  const sanitized = input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
    .trim()
    .slice(0, maxLength);
  
  return sanitized;
}

/**
 * Valida UUID
 */
export function isValidUUID(uuid: unknown): boolean {
  if (typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida email
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida objeto contra schema simples
 */
export function validateSchema<T>(
  data: unknown,
  schema: Record<string, (value: unknown) => boolean>
): { valid: boolean; errors: string[]; data?: T } {
  const errors: string[] = [];
  
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] };
  }
  
  const obj = data as Record<string, unknown>;
  
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(obj[key])) {
      errors.push(`Invalid value for field: ${key}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (data as T) : undefined,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ══════════════════════════════════════════════════════════════════════════

/**
 * Retorna resposta de erro segura (sem expor detalhes internos)
 */
export function errorResponse(
  message: string,
  status = 500,
  logDetails?: unknown
): Response {
  // Log detalhes internamente
  if (logDetails) {
    console.error('[Error]', message, logDetails);
  }
  
  // Retorna mensagem genérica ao cliente
  const clientMessage = status >= 500 
    ? 'Internal server error' 
    : message;
  
  return new Response(
    JSON.stringify({ error: clientMessage }),
    { 
      status,
      headers: getAllSecurityHeaders(),
    }
  );
}

/**
 * Wrapper para try-catch com logging seguro
 */
export async function safeHandler<T>(
  handler: () => Promise<T>,
  errorMessage = 'Operation failed'
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await handler();
    return { success: true, data };
  } catch (error) {
    console.error('[SafeHandler]', errorMessage, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ══════════════════════════════════════════════════════════════════════════

export interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Registra evento de auditoria
 * 
 * NOTA: Em produção, envie para sistema de logging centralizado
 */
export function auditLog(entry: AuditLogEntry): void {
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  
  // Log estruturado para CloudWatch/Datadog/etc
  console.log('[AUDIT]', JSON.stringify(logEntry));
}

/**
 * Extrai informações de auditoria da requisição
 */
export function getAuditInfo(req: Request): Pick<AuditLogEntry, 'ip' | 'userAgent'> {
  return {
    ip: req.headers.get('x-forwarded-for') || 
        req.headers.get('x-real-ip') || 
        'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };
}

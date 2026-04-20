/**
 * SECURITY UTILITIES
 * Funções centralizadas de segurança para edge functions
 *
 * NOTA: Este arquivo roda em Deno (edge functions) e não pode importar
 * diretamente do SSOT (src/config/security.config.ts) que é TypeScript/Node.
 *
 * Os valores aqui devem ser mantidos sincronizados manualmente com o SSOT.
 * Referência: src/config/security.config.ts -> SECURITY_HEADERS
 *
 * REGRA: Toda edge function DEVE importar e usar este módulo.
 * Proibido: corsHeaders locais, CORS '*', error details expostos ao cliente.
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

  // Desenvolvimento: APENAS quando DENO_ENV ou NODE_ENV está explicitamente
  // definido como 'development'. Nunca inferir pelo conteúdo da SUPABASE_URL.
  const isDev =
    Deno.env.get('DENO_ENV') === 'development' ||
    Deno.env.get('NODE_ENV') === 'development';

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
 * Valida se a origem da requisição é permitida.
 *
 * SEGURANÇA: A detecção de ambiente de desenvolvimento é feita APENAS via
 * DENO_ENV/NODE_ENV explícito. Nunca inferimos dev a partir da SUPABASE_URL
 * para evitar que uma configuração acidental em produção abra o CORS para
 * localhost.
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';

  // Desenvolvimento: APENAS quando DENO_ENV ou NODE_ENV está explicitamente
  // definido como 'development'. Nunca inferir pelo conteúdo da SUPABASE_URL.
  const isDev =
    Deno.env.get('DENO_ENV') === 'development' ||
    Deno.env.get('NODE_ENV') === 'development';

  if (isDev && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    return true;
  }

  if (!allowedOrigins) return false;

  const origins = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);
  return origins.includes(origin);
}

// ══════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Retorna headers de segurança padrão
 * 
 * IMPORTANTE: Estes valores devem estar sincronizados com o SSOT:
 * src/config/security.config.ts -> SECURITY_HEADERS
 * 
 * Última sincronização: 2026-04-18
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // XSS Protection (legacy, but defense-in-depth)
    'X-XSS-Protection': '1; mode=block',
    
    // Force HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Control browser features
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

/**
 * Rate limiting distribuído via Deno KV.
 *
 * Deno KV é o único storage persistente disponível nativamente em Supabase
 * Edge Functions, garantindo que o limite seja respeitado entre todas as
 * instâncias simultâneas da função (ao contrário de um Map em memória).
 *
 * Fallback: se o KV não estiver disponível (ambiente de teste), usa Map
 * em memória com aviso explícito no log.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Fallback em memória — usado APENAS quando Deno KV não está disponível
// (ex: testes unitários locais). Em produção, Deno KV sempre está disponível.
const _memoryFallback = new Map<string, RateLimitEntry>();

async function _getKv(): Promise<Deno.Kv | null> {
  try {
    return await Deno.openKv();
  } catch {
    console.warn('[RateLimit] Deno KV indisponível — usando fallback em memória (não distribuído)');
    return null;
  }
}

export async function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  const kv = await _getKv();

  if (kv) {
    // ── Caminho principal: Deno KV (distribuído) ──────────────────────────
    const kvKey = ['ratelimit', identifier];
    const result = await kv.get<RateLimitEntry>(kvKey);
    const entry = result.value;

    if (!entry || entry.resetAt < now) {
      // Janela nova ou expirada
      const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
      await kv.set(kvKey, newEntry, { expireIn: windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
    }

    const newCount = entry.count + 1;
    const remaining = Math.max(0, maxRequests - newCount);
    const allowed = newCount <= maxRequests;

    // Atualiza contador mantendo o mesmo resetAt (janela fixa)
    const ttlMs = Math.max(1, entry.resetAt - now);
    await kv.set(kvKey, { count: newCount, resetAt: entry.resetAt }, { expireIn: ttlMs });

    return { allowed, remaining, resetAt: entry.resetAt };
  }

  // ── Fallback: Map em memória (instância única, não distribuído) ──────────
  const existing = _memoryFallback.get(key);

  if (!existing || existing.resetAt < now) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    _memoryFallback.set(key, newEntry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
  }

  existing.count++;
  const remaining = Math.max(0, maxRequests - existing.count);
  const allowed = existing.count <= maxRequests;

  return { allowed, remaining, resetAt: existing.resetAt };
}

/**
 * Middleware de rate limiting para edge functions.
 * Retorna Response 429 se o limite foi excedido, null caso contrário.
 */
export async function rateLimitMiddleware(
  req: Request,
  maxRequests = 100,
  windowMs = 60000,
): Promise<Response | null> {
  const identifier =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('user-agent') ||
    'unknown';

  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, maxRequests, windowMs);

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...getAllSecurityHeaders(),
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        },
      },
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
 * Retorna resposta de erro segura (NUNCA expõe detalhes internos ao cliente).
 *
 * - Erros 5xx: mensagem genérica ao cliente, detalhes apenas no log interno.
 * - Erros 4xx: mensagem descritiva ao cliente (sem stack/detalhes de infra).
 */
export function errorResponse(
  message: string,
  status = 500,
  logDetails?: unknown
): Response {
  if (logDetails) {
    console.error('[Error]', message, logDetails);
  }

  const clientMessage = status >= 500 ? 'Internal server error' : message;

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
 * Registra evento de auditoria.
 *
 * Persiste na tabela `function_audit` via Supabase service role.
 * Em caso de falha na persistência, faz fallback para console.log
 * para não bloquear o fluxo principal.
 *
 * SSOT: tabela `function_audit` (migration 20260418120000_create_function_audit.sql)
 */
export function auditLog(entry: AuditLogEntry): void {
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  // Log estruturado imediato (síncrono) — garante visibilidade mesmo se o KV falhar
  console.log('[AUDIT]', JSON.stringify(logEntry));

  // Persistência assíncrona no banco — fire-and-forget com tratamento de erro
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  // Suporta novo formato (SUPABASE_SECRET_KEY) e legado (SUPABASE_SERVICE_ROLE_KEY)
  const serviceKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (supabaseUrl && serviceKey) {
    fetch(`${supabaseUrl}/rest/v1/function_audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        // Nota: com as novas chaves (sb_secret_...), a secret key não é um JWT
        // e não deve ser usada no Authorization header. O header apikey é suficiente
        // para autenticar chamadas REST internas server-side.
        // Referência: https://github.com/orgs/supabase/discussions/29260
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        function_name: logEntry.resource,
        user_id: logEntry.userId ?? null,
        input: {
          action: logEntry.action,
          details: logEntry.details ?? null,
        },
        output: { status: logEntry.status },
        success: logEntry.status === 'success',
        ip_address: logEntry.ip ?? null,
        user_agent: logEntry.userAgent ?? null,
      }),
    }).catch((err) => {
      // Nunca deixar falha de auditoria quebrar o fluxo principal
      console.error('[AUDIT] Falha ao persistir no banco:', err);
    });
  }
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

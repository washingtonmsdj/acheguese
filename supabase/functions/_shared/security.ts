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
 * Retorna headers CORS seguros baseados em configuração de ambiente.
 *
 * Implementa validação dinâmica de Origin: verifica o header Origin da
 * requisição contra a lista ALLOWED_ORIGINS e retorna apenas a origem
 * solicitada se ela for permitida — suportando múltiplas origens corretamente.
 *
 * IMPORTANTE: Nunca use '*' em produção!
 * Configure ALLOWED_ORIGINS no ambiente com domínios específicos.
 */
export function getCorsHeaders(methods = 'POST, OPTIONS', req?: Request): Record<string, string> {
  const requestOrigin = req?.headers.get('origin') ?? null;
  const allowedOrigin = resolveAllowedOrigin(requestOrigin);

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, stripe-signature',
    'Access-Control-Max-Age': '86400', // 24 horas
    ...(allowedOrigin !== 'null' ? { 'Vary': 'Origin' } : {}),
  };
}

/**
 * Resolve a origem permitida para o header CORS.
 *
 * Retorna a origem solicitada se ela estiver na lista de origens permitidas,
 * ou 'null' (string) para bloquear o acesso.
 *
 * Separado de getCorsHeaders para permitir reutilização em isOriginAllowed.
 */
function resolveAllowedOrigin(requestOrigin: string | null): string {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';

  // Sem Origin no request (ex: chamadas server-to-server, webhooks) — permitir
  if (!requestOrigin) {
    if (!allowedOrigins) {
      console.warn('⚠️ ALLOWED_ORIGINS não configurado - bloqueando CORS');
    }
    // Sem Origin = não é um request de browser cross-origin; retornar primeira origem
    // configurada como fallback para preflight sem Origin (raro mas possível)
    const origins = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);
    return origins[0] ?? 'null';
  }

  // Verificar se a origem solicitada está na lista permitida
  if (isOriginAllowed(requestOrigin)) {
    return requestOrigin;
  }

  console.warn(`⚠️ Origem bloqueada pelo CORS: ${requestOrigin}`);
  return 'null';
}

/**
 * Valida se a origem da requisição é permitida.
 *
 * SEGURANÇA: todas as origens permitidas devem estar em ALLOWED_ORIGINS.
 * Ambiente local tambem deve declarar explicitamente suas origens no template.
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';
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
    
    // Disable deprecated browser XSS filters; CSP and sanitization are the controls.
    'X-XSS-Protection': '0',
    
    // Force HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Control browser features
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}

/**
 * Combina todos os headers de segurança.
 * Passa o request para getCorsHeaders para validação dinâmica de Origin.
 */
export function getAllSecurityHeaders(methods = 'POST, OPTIONS', req?: Request): Record<string, string> {
  return {
    ...getCorsHeaders(methods, req),
    ...getSecurityHeaders(),
    'Content-Type': 'application/json',
  };
}

export function jsonResponse(
  body: unknown,
  status = 200,
  methods = 'POST, OPTIONS',
  req?: Request,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: getAllSecurityHeaders(methods, req),
  });
}

export function methodNotAllowedResponse(methods = 'POST, OPTIONS', req?: Request): Response {
  return jsonResponse({ error: 'Method not allowed' }, 405, methods, req);
}

export function requireHttpMethod(
  req: Request,
  allowedMethods: readonly string[],
  methods = `${allowedMethods.join(', ')}, OPTIONS`,
): Response | null {
  if (allowedMethods.includes(req.method)) return null;
  return methodNotAllowedResponse(methods, req);
}

export function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7).trim();
}

export function requireCronSecret(req: Request, methods = 'POST, OPTIONS'): Response | null {
  const cronSecret = Deno.env.get('CRON_SECRET')?.trim() ?? '';
  if (!cronSecret) {
    console.error('[CronAuth] CRON_SECRET is not configured; request blocked');
    return jsonResponse(
      { error: 'Function misconfigured: CRON_SECRET not set' },
      500,
      methods,
      req,
    );
  }

  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  const bearerToken = extractBearerToken(req);
  if (cronHeader === cronSecret || bearerToken === cronSecret) return null;

  return jsonResponse({ error: 'Unauthorized' }, 401, methods, req);
}

const DEFAULT_JSON_BODY_LIMIT_BYTES = 64_000;

export async function readJsonBody<T = unknown>(
  req: Request,
  options: { maxBytes?: number; methods?: string } = {},
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const maxBytes = options.maxBytes ?? DEFAULT_JSON_BODY_LIMIT_BYTES;
  const methods = options.methods ?? 'POST, OPTIONS';
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Content-Type must be application/json' }, 415, methods, req),
    };
  }

  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (!Number.isFinite(declaredBytes) || declaredBytes < 0) {
      return {
        ok: false,
        response: jsonResponse({ error: 'Invalid Content-Length' }, 400, methods, req),
      };
    }
    if (declaredBytes > maxBytes) {
      return {
        ok: false,
        response: jsonResponse({ error: 'Request body too large' }, 413, methods, req),
      };
    }
  }

  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Request body too large' }, 413, methods, req),
    };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      response: jsonResponse({ error: 'Invalid JSON body' }, 400, methods, req),
    };
  }
}

export async function readTextBody(
  req: Request,
  options: { maxBytes?: number; methods?: string } = {},
): Promise<{ ok: true; data: string } | { ok: false; response: Response }> {
  const maxBytes = options.maxBytes ?? DEFAULT_JSON_BODY_LIMIT_BYTES;
  const methods = options.methods ?? 'POST, OPTIONS';
  const contentLength = req.headers.get('content-length');

  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (!Number.isFinite(declaredBytes) || declaredBytes < 0) {
      return {
        ok: false,
        response: jsonResponse({ error: 'Invalid Content-Length' }, 400, methods, req),
      };
    }
    if (declaredBytes > maxBytes) {
      return {
        ok: false,
        response: jsonResponse({ error: 'Request body too large' }, 413, methods, req),
      };
    }
  }

  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Request body too large' }, 413, methods, req),
    };
  }

  return { ok: true, data: text };
}

// ══════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ══════════════════════════════════════════════════════════════════════════

/**
 * Best-effort perimeter rate limiting.
 *
 * Deno KV shares state between instances when the runtime provides it, but
 * this helper does not implement an atomic counter. Critical mutations must
 * also enforce an atomic, fail-closed limit in their authoritative backend.
 * If KV is unavailable, the local Map only limits the current instance.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Instance-local fallback used only when the runtime does not provide Deno KV.
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

export function getTrustedClientIp(req: Request): string | null {
  const cfIp = req.headers.get('cf-connecting-ip')?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  const forwardedFor = req.headers.get('x-forwarded-for');
  const lastForwardedIp = forwardedFor
    ? forwardedFor.split(',').at(-1)?.trim() ?? null
    : null;

  return cfIp || realIp || lastForwardedIp || null;
}

/**
 * Middleware de rate limiting para edge functions.
 * Retorna Response 429 se o limite foi excedido, null caso contrário.
 *
 * Identifier usa CF-Connecting-IP (Cloudflare) ou x-real-ip (Supabase/proxies
 * confiáveis) antes de x-forwarded-for, que pode ser forjado pelo cliente.
 * Combina IP + user-agent como fallback para reduzir colisões.
 */
export async function rateLimitMiddleware(
  req: Request,
  maxRequests = 100,
  windowMs = 60000,
): Promise<Response | null> {
  // Preferência: CF-Connecting-IP > x-real-ip > primeiro IP de x-forwarded-for
  // x-forwarded-for pode conter múltiplos IPs (client, proxy1, proxy2...)
  // O ÚLTIMO IP é o mais confiável (adicionado pelo proxy mais próximo ao servidor)
  const ip = getTrustedClientIp(req) ?? 'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown-ua';
  // Combinar IP + primeiros 32 chars do UA para reduzir colisões sem expor UA completo
  const identifier = `${ip}:${ua.slice(0, 32)}`;

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
          ...getAllSecurityHeaders('POST, OPTIONS', req),
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
  
  // Remove caracteres de controle e limita tamanho sem regex de control chars.
  let withoutControlChars = '';
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    const isControl = (code >= 0 && code <= 31) || code === 127;
    if (!isControl) {
      withoutControlChars += input.charAt(i);
    }
  }

  const sanitized = withoutControlChars.trim().slice(0, maxLength);
  
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
    const value = Reflect.get(obj, key);
    if (!validator(value)) {
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
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (supabaseUrl && serviceKey) {
    fetch(`${supabaseUrl}/rest/v1/function_audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        // O header apikey autentica chamadas REST internas server-side.
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

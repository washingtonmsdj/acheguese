/**
 * SECURITY UTILITIES
 * Funções centralizadas de segurança para Edge Functions.
 *
 * Este módulo é o owner compartilhado de CORS, headers, parsing, rate limit,
 * validação, respostas de erro e auditoria das funções Deno.
 *
 * REGRA: toda Edge Function deve reutilizar este módulo. Não crie CORS "*",
 * contadores paralelos ou respostas 5xx que exponham detalhes internos.
 */

// ══════════════════════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════

function resolveAllowedOrigin(requestOrigin: string | null): string {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';

  if (!requestOrigin) {
    if (!allowedOrigins) {
      console.warn('[CORS] ALLOWED_ORIGINS não configurado; CORS ficará bloqueado');
    }
    const origins = allowedOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    return origins[0] ?? 'null';
  }

  if (isOriginAllowed(requestOrigin)) return requestOrigin;
  console.warn(`[CORS] origem bloqueada: ${requestOrigin}`);
  return 'null';
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';
  if (!allowedOrigins) return false;

  return allowedOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(origin);
}

export function getCorsHeaders(
  methods = 'POST, OPTIONS',
  req?: Request,
): Record<string, string> {
  const allowedOrigin = resolveAllowedOrigin(req?.headers.get('origin') ?? null);

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers':
      'authorization, apikey, content-type, x-client-info, stripe-signature',
    'Access-Control-Max-Age': '86400',
    ...(allowedOrigin !== 'null' ? { Vary: 'Origin' } : {}),
  };
}

// ══════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ══════════════════════════════════════════════════════════════════════════

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}

export function getAllSecurityHeaders(
  methods = 'POST, OPTIONS',
  req?: Request,
): Record<string, string> {
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

export function methodNotAllowedResponse(
  methods = 'POST, OPTIONS',
  req?: Request,
): Response {
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
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

export function requireCronSecret(
  req: Request,
  methods = 'POST, OPTIONS',
): Response | null {
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

// ══════════════════════════════════════════════════════════════════════════
// BODY READING
// ══════════════════════════════════════════════════════════════════════════

const DEFAULT_JSON_BODY_LIMIT_BYTES = 64_000;

async function readBodyText(
  req: Request,
  options: { maxBytes?: number; methods?: string },
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

export async function readJsonBody<T = unknown>(
  req: Request,
  options: { maxBytes?: number; methods?: string } = {},
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const methods = options.methods ?? 'POST, OPTIONS';
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    return {
      ok: false,
      response: jsonResponse(
        { error: 'Content-Type must be application/json' },
        415,
        methods,
        req,
      ),
    };
  }

  const body = await readBodyText(req, options);
  if (!body.ok) return body;

  try {
    return { ok: true, data: JSON.parse(body.data) as T };
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
  return readBodyText(req, options);
}

// ══════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ══════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MAX_MEMORY_RATE_LIMIT_ENTRIES = 10_000;
const MAX_KV_COMMIT_ATTEMPTS = 5;
const _memoryFallback = new Map<string, RateLimitEntry>();
let _kvPromise: Promise<Deno.Kv | null> | null = null;

function evictMemoryRateLimitEntries(now: number): void {
  if (_memoryFallback.size < MAX_MEMORY_RATE_LIMIT_ENTRIES) return;

  for (const [key, entry] of _memoryFallback) {
    if (entry.resetAt <= now) _memoryFallback.delete(key);
  }

  while (_memoryFallback.size >= MAX_MEMORY_RATE_LIMIT_ENTRIES) {
    const oldestKey = _memoryFallback.keys().next().value as string | undefined;
    if (!oldestKey) break;
    _memoryFallback.delete(oldestKey);
  }
}

async function _getKv(): Promise<Deno.Kv | null> {
  if (!_kvPromise) {
    _kvPromise = (async () => {
      try {
        return await Deno.openKv();
      } catch {
        console.warn(
          '[RateLimit] Deno KV indisponível; usando fallback local limitado',
        );
        return null;
      }
    })();
  }

  return await _kvPromise;
}

/**
 * Contador distribuído de janela fixa.
 *
 * O caminho Deno KV usa compare-and-set atômico. Se todas as tentativas de
 * commit perderem uma corrida, o limite falha fechado em vez de liberar uma
 * requisição sem contabilização. O Map é apenas fallback por instância e tem
 * limite de cardinalidade para impedir crescimento sem controle.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60_000,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const kv = await _getKv();

  if (kv) {
    const kvKey = ['ratelimit', identifier];

    for (let attempt = 0; attempt < MAX_KV_COMMIT_ATTEMPTS; attempt += 1) {
      const current = await kv.get<RateLimitEntry>(kvKey);
      const entry = current.value;

      if (entry && entry.resetAt > now && entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      const nextEntry: RateLimitEntry =
        !entry || entry.resetAt <= now
          ? { count: 1, resetAt: now + windowMs }
          : { count: entry.count + 1, resetAt: entry.resetAt };

      const commit = await kv
        .atomic()
        .check(current)
        .set(kvKey, nextEntry, {
          expireIn: Math.max(1, nextEntry.resetAt - now),
        })
        .commit();

      if (commit.ok) {
        return {
          allowed: nextEntry.count <= maxRequests,
          remaining: Math.max(0, maxRequests - nextEntry.count),
          resetAt: nextEntry.resetAt,
        };
      }
    }

    return { allowed: false, remaining: 0, resetAt: now + windowMs };
  }

  const key = `ratelimit:${identifier}`;
  const existing = _memoryFallback.get(key);

  if (!existing || existing.resetAt <= now) {
    evictMemoryRateLimitEntries(now);
    const nextEntry = { count: 1, resetAt: now + windowMs };
    _memoryFallback.set(key, nextEntry);
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetAt: nextEntry.resetAt,
    };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= maxRequests,
    remaining: Math.max(0, maxRequests - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Precedência canônica para metadados de auditoria e identificação de origem.
 * O último x-forwarded-for é o hop acrescentado pelo proxy mais próximo.
 */
export function getTrustedClientIp(req: Request): string | null {
  const cfIp = req.headers.get('cf-connecting-ip')?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  const forwardedFor = req.headers.get('x-forwarded-for');
  const lastForwardedIp = forwardedFor
    ? forwardedFor.split(',').at(-1)?.trim() ?? null
    : null;

  return cfIp || realIp || lastForwardedIp || null;
}

function getRateLimitIdentifier(req: Request): string {
  const candidate = getTrustedClientIp(req);
  if (!candidate || !/^[0-9a-f:.]{2,64}$/i.test(candidate)) return 'unknown';
  return candidate.toLowerCase();
}

/**
 * Rate limit de perímetro compartilhado.
 *
 * O identificador depende apenas do IP fornecido pela cadeia de proxies
 * confiável. User-Agent é controlável pelo cliente e não participa da chave,
 * evitando que sua simples rotação contorne o contador.
 */
export async function rateLimitMiddleware(
  req: Request,
  maxRequests = 100,
  windowMs = 60_000,
  methods?: string,
): Promise<Response | null> {
  const identifier = getRateLimitIdentifier(req);
  const responseMethods = methods ?? `${req.method}, OPTIONS`;
  const { allowed, remaining, resetAt } = await checkRateLimit(
    identifier,
    maxRequests,
    windowMs,
  );

  if (allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded', retryAfter }),
    {
      status: 429,
      headers: {
        ...getAllSecurityHeaders(responseMethods, req),
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      },
    },
  );
}

// ══════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ══════════════════════════════════════════════════════════════════════════

export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') throw new Error('Input must be a string');

  let withoutControlChars = '';
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    const isControl = (code >= 0 && code <= 31) || code === 127;
    if (!isControl) withoutControlChars += input.charAt(index);
  }

  return withoutControlChars.trim().slice(0, maxLength);
}

export function isValidUUID(uuid: unknown): boolean {
  if (typeof uuid !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    uuid,
  );
}

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function validateSchema<T>(
  data: unknown,
  schema: Record<string, (value: unknown) => boolean>,
): { valid: boolean; errors: string[]; data?: T } {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const obj = data as Record<string, unknown>;
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(Reflect.get(obj, key))) {
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

export function errorResponse(
  message: string,
  status = 500,
  logDetails?: unknown,
  req?: Request,
  methods = 'POST, OPTIONS',
): Response {
  if (logDetails) console.error('[Error]', message, logDetails);

  const clientMessage = status >= 500 ? 'Internal server error' : message;
  return new Response(JSON.stringify({ error: clientMessage }), {
    status,
    headers: getAllSecurityHeaders(methods, req),
  });
}

export async function safeHandler<T>(
  handler: () => Promise<T>,
  errorMessage = 'Operation failed',
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

export function auditLog(entry: AuditLogEntry): void {
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  console.log('[AUDIT]', JSON.stringify(logEntry));

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return;

  fetch(`${supabaseUrl}/rest/v1/function_audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Prefer: 'return=minimal',
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
  }).catch((error) => {
    console.error('[AUDIT] Falha ao persistir no banco:', error);
  });
}

export function getAuditInfo(
  req: Request,
): Pick<AuditLogEntry, 'ip' | 'userAgent'> {
  return {
    ip: getTrustedClientIp(req) ?? 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };
}

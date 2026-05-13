type RateLimitResult = { allowed: boolean; retryAfterSeconds?: number };

type AuthBackoffState = {
  failCount: number;
  blockUntil: number;
};

const memoryRateLimitStore = new Map<string, { count: number; resetAt: number }>();
const memoryAuthBackoffStore = new Map<string, AuthBackoffState>();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const redisEnabled = Boolean(redisUrl && redisToken);

async function redisCommand<T = unknown>(command: (string | number)[]): Promise<T> {
  if (!redisEnabled) {
    throw new Error('Redis is not configured');
  }
  const response = await fetch(`${redisUrl as string}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken as string}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error(`Redis command failed with status ${response.status}`);
  }
  const payload = (await response.json()) as { result?: T; error?: string };
  if (payload.error) {
    throw new Error(`Redis command error: ${payload.error}`);
  }
  return payload.result as T;
}

function memoryCheckRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = memoryRateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    memoryRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (current.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  current.count += 1;
  memoryRateLimitStore.set(key, current);
  return { allowed: true };
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!redisEnabled) {
    return memoryCheckRateLimit(key, maxRequests, windowMs);
  }

  const namespacedKey = `security:ratelimit:${key}`;
  const count = Number(await redisCommand<number>(['INCR', namespacedKey]));
  const ttlMs = Number(await redisCommand<number>(['PTTL', namespacedKey]));

  if (count === 1 || ttlMs < 0) {
    await redisCommand(['PEXPIRE', namespacedKey, windowMs]);
  }

  if (count > maxRequests) {
    const effectiveTtlMs = ttlMs > 0 ? ttlMs : windowMs;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(effectiveTtlMs / 1000),
    };
  }

  return { allowed: true };
}

function memoryGetAuthBackoffRemainingMs(principalKey: string): number {
  const now = Date.now();
  const entry = memoryAuthBackoffStore.get(principalKey);
  if (!entry) return 0;
  return Math.max(0, entry.blockUntil - now);
}

export async function getAuthBackoffRemainingMs(principalKey: string): Promise<number> {
  if (!redisEnabled) {
    return memoryGetAuthBackoffRemainingMs(principalKey);
  }
  const key = `security:authbackoff:${principalKey}`;
  const blockUntilValue = await redisCommand<string | null>(['HGET', key, 'block_until']);
  const blockUntil = Number(blockUntilValue ?? 0);
  if (!Number.isFinite(blockUntil) || blockUntil <= 0) return 0;
  return Math.max(0, blockUntil - Date.now());
}

export async function registerAuthFailure(
  principalKey: string,
  baseMs: number,
  maxMs: number,
): Promise<number> {
  if (!redisEnabled) {
    const now = Date.now();
    const previous = memoryAuthBackoffStore.get(principalKey);
    const failCount = previous ? previous.failCount + 1 : 1;
    const exponent = Math.min(failCount - 1, 10);
    const blockMs = Math.min(baseMs * 2 ** exponent, maxMs);
    memoryAuthBackoffStore.set(principalKey, { failCount, blockUntil: now + blockMs });
    return blockMs;
  }

  const key = `security:authbackoff:${principalKey}`;
  const failCount = Number(await redisCommand<number>(['HINCRBY', key, 'fail_count', 1]));
  const exponent = Math.min(failCount - 1, 10);
  const blockMs = Math.min(baseMs * 2 ** exponent, maxMs);
  const blockUntil = Date.now() + blockMs;

  await redisCommand(['HSET', key, 'block_until', blockUntil]);
  await redisCommand(['PEXPIRE', key, maxMs]);
  return blockMs;
}

export async function clearAuthFailures(principalKey: string): Promise<void> {
  if (!redisEnabled) {
    memoryAuthBackoffStore.delete(principalKey);
    return;
  }
  const key = `security:authbackoff:${principalKey}`;
  await redisCommand(['DEL', key]);
}


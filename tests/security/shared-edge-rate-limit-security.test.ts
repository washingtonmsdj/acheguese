import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SECURITY = join(ROOT, "supabase", "functions", "_shared", "security.ts");

function readSecurity(): string {
  return readFileSync(SECURITY, "utf8");
}

describe("shared Edge Function rate limiting", () => {
  it("uses an atomic Deno KV counter and fails closed after repeated contention", () => {
    const source = readSecurity();

    expect(source).toContain("MAX_KV_COMMIT_ATTEMPTS");
    expect(source).toContain("kv.atomic()");
    expect(source).toContain(".check(current)");
    expect(source).toContain(".commit()");
    expect(source).toContain(
      "return { allowed: false, remaining: 0, resetAt: now + windowMs }",
    );
    expect(source).not.toContain("await kv.set(kvKey, newEntry");
  });

  it("bounds the instance-local fallback instead of allowing unbounded identifiers", () => {
    const source = readSecurity();

    expect(source).toContain("MAX_MEMORY_RATE_LIMIT_ENTRIES = 10_000");
    expect(source).toContain("evictMemoryRateLimitEntries(now)");
    expect(source).toContain(
      "while (_memoryFallback.size >= MAX_MEMORY_RATE_LIMIT_ENTRIES)",
    );
  });

  it("keys the limiter by trusted proxy IP and not by caller-controlled User-Agent", () => {
    const source = readSecurity();
    const start = source.indexOf("function getRateLimitIdentifier");
    const end = source.indexOf("export async function rateLimitMiddleware", start);
    const identifierOwner = source.slice(start, end);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(identifierOwner).toContain("getTrustedClientIp(req)");
    expect(identifierOwner).not.toContain("user-agent");

    const middlewareStart = end;
    const middlewareEnd = source.indexOf("// ═", middlewareStart);
    const middleware = source.slice(middlewareStart, middlewareEnd);
    expect(middleware).toContain("getRateLimitIdentifier(req)");
    expect(middleware).not.toContain("user-agent");
  });
});

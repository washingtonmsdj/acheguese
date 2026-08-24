import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const EDGE = join(ROOT, 'supabase', 'functions', 'admin-get-user-auth-summary', 'index.ts');
const LOADER = join(ROOT, 'src', 'core', 'admin', 'services', 'AdminProfileGovernanceAuthLoaders.ts');

describe('admin-get-user-auth-summary contract', () => {
  it('keeps the privileged Edge handler admin-only and input-bounded', () => {
    const edge = readFileSync(EDGE, 'utf8');

    expect(edge).toContain("requireAdmin(req)");
    expect(edge).toContain("rateLimitMiddleware(req, 200, 60000)");
    expect(edge).toContain("maxBytes: 4096");
    expect(edge).toContain("auth.admin.getUserById(userId)");
  });

  it('keeps the response inside the canonical summary envelope', () => {
    const edge = readFileSync(EDGE, 'utf8');

    expect(edge).toContain('summary: {');
    expect(edge).toContain('email: u.email');
    expect(edge).toContain('emailConfirmed: !!u.email_confirmed_at');
    expect(edge).toContain('createdAt: u.created_at');
    expect(edge).toContain('lastSignInAt: u.last_sign_in_at');
  });

  it('makes the admin loader consume the same envelope and camelCase fields', () => {
    const loader = readFileSync(LOADER, 'utf8');

    expect(loader).toContain('const summary = data?.summary');
    expect(loader).toContain('email: summary.email ?? null');
    expect(loader).toContain('emailConfirmed: summary.emailConfirmed === true');
    expect(loader).toContain('createdAt: summary.createdAt ?? null');
    expect(loader).toContain('lastSignInAt: summary.lastSignInAt ?? null');

    expect(loader).not.toContain('data.email_confirmed_at');
    expect(loader).not.toContain('data.created_at');
    expect(loader).not.toContain('data.last_sign_in_at');
  });
});

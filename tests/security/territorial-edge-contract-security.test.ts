import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const EDGE = join(ROOT, 'supabase', 'functions', 'territorial-get-tree', 'index.ts');
const QUERY = join(ROOT, 'src', 'core', 'territorial', 'services', 'territorial.queries.ts');

describe('territorial-get-tree admin contract', () => {
  it('keeps the endpoint admin-only, POST-only and fail-closed on env', () => {
    const edge = readFileSync(EDGE, 'utf8');

    expect(edge).toContain("requireHttpMethod(req, ['POST'], ALLOWED_METHODS)");
    expect(edge).toContain('requireAdmin(req)');
    expect(edge).toContain("getRequiredEnv('SUPABASE_URL')");
    expect(edge).toContain("getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')");
    expect(edge).toContain('rateLimitMiddleware(req, 60, 60_000)');
  });

  it('returns the flat serializable shape consumed by the admin UI', () => {
    const edge = readFileSync(EDGE, 'utf8');

    expect(edge).toContain('JSON.stringify({ locations, groups, groupMembers })');
    expect(edge).toContain("type: 'group'");
    expect(edge).toContain('parent_id: group.anchor_city_id');
    expect(edge).toContain("is_selector_active: metadataFlag(metadata, 'is_selector_active')");
    expect(edge).toContain('const groupMembers = Object.fromEntries(memberIdsMap.entries())');

    expect(edge).not.toContain('JSON.stringify({ tree })');
    expect(edge).not.toContain("'Cache-Control': 'public");
  });

  it('keeps authenticated admin data non-cacheable by shared intermediaries', () => {
    const edge = readFileSync(EDGE, 'utf8');

    expect(edge).toContain("'Cache-Control': 'private, no-store'");
    expect(edge).toContain('getAllSecurityHeaders(ALLOWED_METHODS, req)');
  });

  it('normalizes JSON memberships to the Map expected by domain consumers', () => {
    const query = readFileSync(QUERY, 'utf8');

    expect(query).toContain('groupMembers?: Record<string, string[]>');
    expect(query).toContain('!Array.isArray(data.locations)');
    expect(query).toContain('!Array.isArray(data.groups)');
    expect(query).toContain('groupMembers: new Map(memberEntries)');
    expect(query).not.toContain('return data as TerritoryTreeData');
  });
});

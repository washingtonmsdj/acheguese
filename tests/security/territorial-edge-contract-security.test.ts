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
    expect(edge).toContain('const groupMembers = Object.fromEntries(memberIdsMap.entries())');

    expect(edge).not.toContain('JSON.stringify({ tree })');
    expect(edge).not.toContain("'Cache-Control': 'public");
  });

  it('preserves canonical territorial visibility defaults', () => {
    const edge = readFileSync(EDGE, 'utf8');

    expect(edge).toContain('return metadata.is_selector_active === true');
    expect(edge).toContain('return metadata.is_landing_enabled !== false');
    expect(edge).toContain('return metadata.is_navigable !== false');
    expect(edge).toContain('is_selector_active: isSelectorActive(metadata)');
    expect(edge).toContain('is_landing_enabled: isLandingEnabled(metadata)');
    expect(edge).toContain('is_navigable: isNavigable(metadata)');
    expect(edge).not.toContain('metadata[flag]');
  });

  it('keeps authenticated admin data non-cacheable and origin-aware on failures', () => {
    const edge = readFileSync(EDGE, 'utf8');

    expect(edge).toContain("'Cache-Control': 'private, no-store'");
    expect(edge).toContain('getAllSecurityHeaders(ALLOWED_METHODS, req)');
    expect(edge).toContain("{ error: 'Internal server error' }");
    expect(edge).toContain('ALLOWED_METHODS,\n      req,');
    expect(edge).not.toContain("errorResponse('Internal server error'");
  });

  it('logs ordinary Supabase audit insert errors without exposing the dataset', () => {
    const edge = readFileSync(EDGE, 'utf8');

    expect(edge).toContain("const { error: auditError } = await supabaseAdmin.from('function_audit').insert");
    expect(edge).toContain("console.error('Audit log error:', auditError)");
    expect(edge).toContain('locations: locations.length');
    expect(edge).toContain('groups: groups.length');
    expect(edge).not.toContain('output: { locations, groups, groupMembers }');
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

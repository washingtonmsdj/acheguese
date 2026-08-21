import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PREFLIGHT = join(ROOT, 'scripts', 'security', 'supabase-lgpd-edge-rollout-preflight.mjs');
const DELETE_HANDLER = join(ROOT, 'supabase', 'functions', 'user-delete-account', 'index.ts');
const EXPORT_HANDLER = join(ROOT, 'supabase', 'functions', 'user-export-data', 'index.ts');

describe('LGPD Edge rollout preflight', () => {
  it('is explicitly scoped to the two stale LGPD handlers and issue #68', () => {
    const source = readFileSync(PREFLIGHT, 'utf8');

    expect(source).toContain("'user-delete-account': Object.freeze({");
    expect(source).toContain("'user-export-data': Object.freeze({");
    expect(source).toContain('issues/68');
    expect(source).toContain('O argumento --function e obrigatorio.');
    expect(source).toContain('Funcao fora do escopo deste preflight');
  });

  it('fails closed while account deletion references proven legacy schema', () => {
    const preflight = readFileSync(PREFLIGHT, 'utf8');
    const handler = readFileSync(DELETE_HANDLER, 'utf8');

    const provenStaleMarkers = [
      ".from('user_deletion_schedule')",
      ".eq('owner_id', userId)",
      ".eq('passenger_id', userId)",
      'document_number: null',
      'granted: false',
      'is_valid: false',
    ];

    for (const marker of provenStaleMarkers) {
      expect(handler).toContain(marker);
      expect(preflight).toContain(marker);
    }
  });

  it('fails closed while export uses legacy ownership/session keys', () => {
    const preflight = readFileSync(PREFLIGHT, 'utf8');
    const handler = readFileSync(EXPORT_HANDLER, 'utf8');

    const provenStaleMarkers = [
      ".eq('owner_id', userId)",
      ".eq('passenger_id', userId)",
      ".from('user_sessions')",
      ".eq('organizer_id', userId)",
    ];

    for (const marker of provenStaleMarkers) {
      expect(handler).toContain(marker);
      expect(preflight).toContain(marker);
    }
  });

  it('never reads secrets, calls Supabase, or performs a deploy', () => {
    const source = readFileSync(PREFLIGHT, 'utf8');

    expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(source).not.toContain('SUPABASE_ACCESS_TOKEN');
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain('functions deploy');
    expect(source).not.toContain('execFile');
    expect(source).toContain('if (!status.ready) process.exitCode = 1');
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PREFLIGHT = join(ROOT, 'scripts', 'security', 'supabase-lgpd-edge-rollout-preflight.mjs');
const DELETE_HANDLER = join(ROOT, 'supabase', 'functions', 'user-delete-account', 'index.ts');
const EXPORT_HANDLER = join(ROOT, 'supabase', 'functions', 'user-export-data', 'index.ts');
const EXPORT_MATRIX = join(
  ROOT,
  'docs',
  '09-reference',
  'governance',
  'privacy',
  'LGPD_EXPORT_MATRIX.json',
);

describe('LGPD Edge rollout preflight', () => {
  it('is explicitly scoped to the two blocked LGPD handlers and issue #68', () => {
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

  it('keeps rewritten export blocked by certification even after legacy markers are removed', () => {
    const preflight = readFileSync(PREFLIGHT, 'utf8');
    const handler = readFileSync(EXPORT_HANDLER, 'utf8');

    const removedLegacyMarkers = [
      ".eq('owner_id', userId)",
      ".eq('passenger_id', userId)",
      ".from('user_sessions')",
      ".eq('organizer_id', userId)",
    ];

    for (const marker of removedLegacyMarkers) {
      expect(handler).not.toContain(marker);
      expect(preflight).toContain(marker);
    }

    expect(handler).toContain(
      'const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;',
    );
    expect(handler).not.toContain(
      'const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = true;',
    );
    expect(preflight).toContain(
      "'const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = true;'",
    );
  });

  it('requires the canonical export matrix and explicit implementation certification', () => {
    const source = readFileSync(PREFLIGHT, 'utf8');
    const matrix = JSON.parse(readFileSync(EXPORT_MATRIX, 'utf8')) as {
      schemaVersion?: string;
      rules?: Record<string, unknown>;
    };

    expect(source).toContain('LGPD_EXPORT_MATRIX.json');
    expect(source).toContain("const EXPORT_MATRIX_SCHEMA_VERSION = 'lgpd-export-matrix/v1';");
    expect(source).toContain("'const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = true;'");
    expect(source).toContain('requiresExportMatrix: true');

    expect(matrix.schemaVersion).toBe('lgpd-export-matrix/v1');
    expect(matrix.rules?.default).toBe('exclude');
    expect(matrix.rules?.selectStarForbidden).toBe(true);
    expect(matrix.rules?.sharedRowsRequireRedaction).toBe(true);
    expect(matrix.rules?.requiredQueryFailure).toBe('fail-closed');
  });

  it('blocks select-star, raw auth metadata and operational log/session dumps in exports', () => {
    const source = readFileSync(PREFLIGHT, 'utf8');

    for (const marker of [
      ".from('application_logs')",
      'app_metadata:',
      'identity_data:',
      ".select('*')",
      ".select('*,",
    ]) {
      expect(source).toContain(marker);
    }
  });

  it('only becomes ready when stale markers, required markers and matrix checks all pass', () => {
    const source = readFileSync(PREFLIGHT, 'utf8');

    expect(source).toContain(
      'const ready = staleMarkers.length === 0 && missingMarkers.length === 0 && exportMatrix.ready;',
    );
    expect(source).toContain('missingMarkers');
    expect(source).toContain('exportMatrixReady');
    expect(source).toContain('Matriz de exportacao: INVALIDA/AUSENTE');
  });

  it('keeps user-delete-account independent of the export matrix', () => {
    const source = readFileSync(PREFLIGHT, 'utf8');
    const deleteBlock = source.split("'user-delete-account': Object.freeze({")[1]
      ?.split("'user-export-data': Object.freeze({")[0];

    expect(deleteBlock).toContain('requiredMarkers: Object.freeze([])');
    expect(deleteBlock).toContain('requiresExportMatrix: false');
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

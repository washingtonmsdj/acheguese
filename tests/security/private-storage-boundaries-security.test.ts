import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('private storage boundaries', () => {
  const documentsMigration = read(
    'supabase/migrations/20260826031800_restrict_documents_storage_policies_to_authenticated.sql',
  );
  const safetyMigration = read(
    'supabase/migrations/20260826032200_restore_private_safety_evidence_storage_flow.sql',
  );
  const safetyEvidenceService = read(
    'src/core/safety/services/SafetyEvidenceService.ts',
  );
  const safetyEvidenceHook = read(
    'src/core/safety/hooks/useSafetyEvidence.ts',
  );

  it('keeps the legacy documents bucket private and authenticated-owner only', () => {
    expect(documentsMigration).toContain("WHERE id = 'documents'");
    expect(documentsMigration).toContain('public = false');
    expect(documentsMigration).toContain('TO authenticated');
    expect(documentsMigration).toContain(
      "auth.uid()::text = (storage.foldername(name))[1]",
    );
    expect(documentsMigration).toContain("ARRAY['public', 'anon']::name[]");
  });

  it('keeps safety evidence private and scoped to the incident owner', () => {
    expect(safetyMigration).toContain("WHERE id = 'safety-evidence'");
    expect(safetyMigration).toContain('public = false');
    expect(safetyMigration).toContain('TO authenticated');
    expect(safetyMigration).toContain('incident.id::text = (storage.foldername(name))[1]');
    expect(safetyMigration).toContain('profile.user_id = auth.uid()');
    expect(safetyMigration).not.toContain('TO anon');
  });

  it('does not persist public URLs for private safety evidence', () => {
    expect(safetyEvidenceService).toContain("const STORAGE_PREFIX = `storage://${BUCKET}/`");
    expect(safetyEvidenceService).toContain('createSignedUrl(path, ttl)');
    expect(safetyEvidenceService).not.toContain('getPublicUrl');
  });

  it('supports the evidence media types explicitly allowed by the private bucket', () => {
    for (const mime of [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
    ]) {
      expect(safetyEvidenceService).toContain(`'${mime}'`);
      expect(safetyMigration).toContain(`'${mime}'`);
    }
  });

  it('routes the canonical evidence hook through the private evidence service', () => {
    expect(safetyEvidenceHook).toContain("from '../services/SafetyEvidenceService'");
    expect(safetyEvidenceHook).toContain('safetyEvidenceService.listIncidentEvidence');
    expect(safetyEvidenceHook).toContain('safetyEvidenceService.upload');
    expect(safetyEvidenceHook).not.toContain('safetyService.uploadSafetyEvidence');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('private storage boundaries', () => {
  const documentsMigration = read(
    'supabase/migrations/20260826031850_restrict_documents_storage_policies_to_authenticated.sql',
  );
  const safetyMigration = read(
    'supabase/migrations/20260829161927_repair_safety_evidence_storage_owner_policies.sql',
  );
  const safetyRegistration = read(
    'supabase/migrations/20260909200353_bind_safety_evidence_to_storage_g24.sql',
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
    expect(safetyMigration).toContain('(storage.foldername(name))[1] IN (');
    expect(safetyMigration).toContain('SELECT incident.id::text');
    expect(safetyMigration).toContain('profile.user_id = auth.uid()');
    expect(safetyMigration).not.toContain('storage.foldername(profile.name)');
    expect(safetyMigration).not.toContain('TO anon');
  });

  it('does not persist public URLs for private safety evidence', () => {
    expect(safetyEvidenceService).toContain("const STORAGE_PREFIX = `storage://${BUCKET}/`");
    expect(safetyEvidenceService).toContain('createPrivateSignedUrl');
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

  it('binds evidence metadata to an existing private Storage object', () => {
    expect(safetyRegistration).toContain(
      'CREATE OR REPLACE FUNCTION public.register_safety_evidence',
    );
    expect(safetyRegistration).toContain('FROM storage.objects object');
    expect(safetyRegistration).toContain(
      'v_object.owner_id IS DISTINCT FROM auth.uid()::text',
    );
    expect(safetyRegistration).toContain(
      "v_size := (v_object.metadata ->> 'size')::bigint",
    );
    expect(safetyRegistration).toContain(
      "v_mime := NULLIF(v_object.metadata ->> 'mimetype', '')",
    );
    expect(safetyRegistration).toContain(
      'REVOKE INSERT ON TABLE public.safety_evidence FROM authenticated',
    );
    expect(safetyRegistration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS safety_evidence_file_url_unique',
    );
    expect(safetyRegistration).toContain(
      "NOT EXISTS (\n      SELECT 1\n      FROM public.safety_evidence evidence",
    );
    expect(safetyEvidenceService).toContain("supabase.rpc('register_safety_evidence'");
    expect(safetyEvidenceService).not.toMatch(
      /from\(['"]safety_evidence['"]\)[\s\S]{0,200}\.insert\(/,
    );
  });

  it('routes the canonical evidence hook through the private evidence service', () => {
    expect(safetyEvidenceHook).toContain("from '../services/SafetyEvidenceService'");
    expect(safetyEvidenceHook).toContain('safetyEvidenceService.listIncidentEvidence');
    expect(safetyEvidenceHook).toContain('safetyEvidenceService.upload');
    expect(safetyEvidenceHook).not.toContain('safetyService.uploadSafetyEvidence');
  });
});

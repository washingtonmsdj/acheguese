import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP vagas runtime reconciliation migration", () => {
  const migration = readFileSync(
    "supabase/migrations/20260920004231_reconcile_vagas_runtime_mvp.sql",
    "utf8",
  );

  it("removes only recognized demo seeds behind engagement guards", () => {
    expect(migration).toContain("MVP_VAGAS_RECONCILE_BLOCKED: known seed vagas have user engagement");
    expect(migration).toContain("[MOCK_FEED_SEED_V1]");
    expect(migration).toContain("Tech Solutions Ltda");
    expect(migration).toContain("DELETE FROM public.vagas");
    expect(migration).toContain("public.vaga_applications");
    expect(migration).toContain("public.vaga_reports");
    expect(migration).toContain("public.vaga_saved_items");
  });

  it("rebuilds the four drifted enums to the application contract", () => {
    expect(migration).toContain("CREATE TYPE public.vaga_status AS ENUM");
    expect(migration).toContain("'pending_review'");
    expect(migration).toContain("'published'");
    expect(migration).toContain("CREATE TYPE public.vaga_contrato AS ENUM");
    expect(migration).toContain("'temporario'");
    expect(migration).toContain("CREATE TYPE public.vaga_modalidade AS ENUM ('presencial', 'hibrido', 'remoto')");
    expect(migration).toContain("CREATE TYPE public.vaga_nivel AS ENUM");
    expect(migration).toContain("'especialista'");
  });

  it("restores canonical public publishing and application boundaries", () => {
    expect(migration).toContain('CREATE POLICY "vagas_public_read"');
    expect(migration).toContain("status = 'published'");
    expect(migration).toContain('CREATE POLICY "vaga_applications_insert"');
    expect(migration).toContain("v.owner_profile_id <> candidato_profile_id");
    expect(migration).toContain("private.can_manage_profile(owner_profile_id)");
    expect(migration).not.toContain('CREATE POLICY "Admins can create vagas"');
  });

  it("adds the fields and search authority already consumed by VagasService", () => {
    for (const field of [
      "empresa_nome",
      "empresa_logo_url",
      "empresa_id",
      "requisitos",
      "responsabilidades",
      "application_email",
      "application_whatsapp",
      "application_url",
      "application_phone",
      "meta_title",
      "meta_description",
      "share_count",
    ]) {
      expect(migration).toContain(field);
    }
    expect(migration).toContain("search_vector tsvector");
    expect(migration).toContain("GENERATED ALWAYS AS");
    expect(migration).toContain("CREATE INDEX idx_vagas_search");
  });

  it("preserves the professional matching trigger around the enum rebind", () => {
    const drop = migration.indexOf("DROP TRIGGER IF EXISTS trg_enqueue_vaga_match_notifications");
    const statusRebind = migration.indexOf("ALTER COLUMN status TYPE public.vaga_status");
    const recreate = migration.indexOf("CREATE TRIGGER trg_enqueue_vaga_match_notifications");

    expect(drop).toBeGreaterThanOrEqual(0);
    expect(statusRebind).toBeGreaterThan(drop);
    expect(recreate).toBeGreaterThan(statusRebind);
  });
});

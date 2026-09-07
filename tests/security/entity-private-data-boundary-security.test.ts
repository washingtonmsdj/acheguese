import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Business and Professional private-data boundary", () => {
  const migration = read(
    "supabase/migrations/20260718170000_consolidate_entity_contact_channels.sql",
  );
  const contactUpsertFix = read(
    "supabase/migrations/20260907033641_fix_contact_rpc_channel_type_ambiguity_g6.sql",
  );

  it("keeps contact channels in one private FK-backed store", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS private.entity_contact_channels");
    expect(migration).toContain("business_id UUID REFERENCES public.business_data(id)");
    expect(migration).toContain("professional_id UUID REFERENCES public.professional_data(id)");
    expect(migration).toContain("CHECK (num_nonnulls(business_id, professional_id) = 1)");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.entity_contact_channels FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain("business_data_metadata_no_contact");
    expect(migration).toContain("professional_data_metadata_no_contact");
    expect(migration).toContain("ALTER TABLE public.business_data DROP COLUMN email");
    expect(migration).toContain("ALTER TABLE public.professional_data DROP COLUMN email");
    expect(migration).toContain("ALTER TABLE public.professional_data DROP COLUMN whatsapp");
  });

  it("moves professional registration identifiers to a private audited table", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS private.professional_credentials");
    expect(migration).toContain("private.professional_credentials_audit_log");
    expect(migration).toContain("ALTER TABLE public.professional_data DROP COLUMN license_number");
    expect(migration).toContain("ALTER TABLE public.professional_data DROP COLUMN license_state");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.professional_credentials_rpc_get_owned(UUID, UUID)",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.professional_credentials_rpc_patch_owned(UUID, UUID, JSONB)",
    );
    expect(migration).toContain("TO service_role");
  });

  it("keeps contact upserts free of PL/pgSQL output-column ambiguity", () => {
    expect(contactUpsertFix).toContain(
      "CREATE OR REPLACE FUNCTION public.contact_rpc_patch_owned_channels",
    );
    expect(contactUpsertFix).toContain("ON CONFLICT DO NOTHING");
    expect(contactUpsertFix).toContain(
      "UPDATE private.entity_contact_channels AS channels",
    );
    expect(contactUpsertFix).toContain(
      "channels.business_id = p_entity_id",
    );
    expect(contactUpsertFix).toContain(
      "channels.professional_id = p_entity_id",
    );
    expect(contactUpsertFix).not.toContain(
      "ON CONFLICT (business_id, channel_type)",
    );
    expect(contactUpsertFix).not.toContain(
      "ON CONFLICT (professional_id, channel_type)",
    );
    expect(contactUpsertFix).toContain(
      "member.is_active = true AND member.role IN ('owner', 'admin')",
    );
    expect(contactUpsertFix).toContain(
      "REVOKE ALL ON FUNCTION public.contact_rpc_patch_owned_channels",
    );
    expect(contactUpsertFix).toContain("TO service_role");
  });

  it("binds privileged RPC actors to authenticated brokers", () => {
    const contactEdge = read("supabase/functions/contact-rpc/index.ts");
    const credentialsEdge = read(
      "supabase/functions/professional-credentials-rpc/index.ts",
    );
    const config = read("supabase/config.toml");

    for (const edge of [contactEdge, credentialsEdge]) {
      expect(edge).toContain("auth.getUser(token)");
      expect(edge).toContain("p_actor_user_id: auth.userId");
      expect(edge).not.toMatch(/p_actor_user_id:\s*params\./);
      expect(edge).toContain("rateLimitMiddleware");
    }
    expect(config).toMatch(/\[functions\.contact-rpc\]\s+verify_jwt = true/);
    expect(config).toMatch(
      /\[functions\.professional-credentials-rpc\]\s+verify_jwt = true/,
    );
    expect(credentialsEdge).not.toMatch(
      /console\.(?:log|error|warn)\([^\n]*(?:licenseNumber|licenseState)/,
    );
  });

  it("keeps public professional projections free of ownership and private fields", () => {
    const view = migration.match(
      /CREATE VIEW public\.public_professional_search[\s\S]*?REVOKE SELECT ON TABLE public\.professional_data/,
    )?.[0];
    const grant = migration.match(
      /GRANT SELECT \(([\s\S]*?)\) ON TABLE public\.professional_data TO anon, authenticated;/,
    )?.[1];

    expect(view).toBeTruthy();
    expect(view).not.toMatch(/\bowner_user_id\b|\blicense_number\b|\blicense_state\b/);
    expect(grant).toBeTruthy();
    expect(grant).not.toMatch(
      /\bowner_user_id\b|\bupdated_by_user_id\b|\blicense_number\b|\blicense_state\b/,
    );
  });

  it("preserves the established invoker security of public snapshots", () => {
    for (const name of [
      "get_public_business_snapshot_by_slug",
      "get_public_gastronomy_snapshot_by_slug",
    ]) {
      const definition = migration.match(
        new RegExp(`CREATE OR REPLACE FUNCTION ${name}\\([\\s\\S]*?AS \\$\\$`),
      )?.[0];
      expect(definition).toContain("SECURITY INVOKER");
      expect(definition).toContain("SET search_path = public, pg_temp");
      expect(definition).not.toContain("SECURITY DEFINER");
    }
  });

  it("keeps profile creation and opportunity matching on the same private boundary", () => {
    const profileCreate = migration.match(
      /CREATE OR REPLACE FUNCTION private\.profile_create_profile_with_extension[\s\S]*?REVOKE ALL ON FUNCTION private\.profile_create_profile_with_extension/,
    )?.[0];
    const candidates = migration.match(
      /CREATE VIEW public\.work_opportunity_match_candidates[\s\S]*?REVOKE ALL ON TABLE public\.work_opportunity_match_candidates/,
    )?.[0];

    expect(profileCreate).toContain("contact_rpc_patch_owned_channels");
    expect(profileCreate).toContain("professional_credentials_rpc_patch_owned");
    expect(profileCreate).not.toMatch(/\bwhatsapp\s*,\s*\n\s*is_accepting_clients/);
    expect(candidates).toBeTruthy();
    expect(candidates).not.toMatch(/professional_owner_user_id|opportunity_author_user_id/);
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.enforce_work_opportunity_professional_ownership()",
    );
  });
});

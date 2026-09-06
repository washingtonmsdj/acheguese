import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PARSER_VERSION,
  RAW_RECORD_HASH_CONTRACT,
  sha256RawRecord,
} from "../../tools/data-quality/prepare-public-education-inep-import.mjs";
import {
  extractSupabaseProjectRefFromDatabaseUrl,
  parseStageArgs,
  validateInepImportManifest,
  validateNormalizedInepRow,
} from "../../tools/data-quality/stage-public-education-inep-import.mjs";

function manifestFixture() {
  return {
    contract: "acheguese.public-education-inep-normalized/1",
    parser_version: PARSER_VERSION,
    source: {
      landing_url:
        "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar",
      archive_url:
        "https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip",
      archive_sha256: "a".repeat(64),
      archive_entry: "DADOS/Tabela_Escola_2025.csv",
      archive_entry_sha256: "b".repeat(64),
      record_hash_contract: RAW_RECORD_HASH_CONTRACT,
      source_year: 2025,
      landing_page_updated_at: "2026-07-31T14:52:00.000Z",
      extracted_file: "Tabela_Escola_2025.csv",
      extracted_file_sha256: "b".repeat(64),
      file_role: "school_table",
      encoding: "utf8",
      delimiter: ";",
    },
    target: {
      municipality_ibge_code: "2927408",
      uf_ibge_code: "29",
    },
    counts: {
      source_rows: 100,
      target_municipality_rows: 2,
      public_dependency_rows: 2,
      private_dependency_rows: 0,
      active_operation_rows: 2,
      public_active_rows: 2,
    },
    safety: {
      calls_supabase: false,
      publishes_records: false,
      staging_quality_gate_required: true,
      official_archive_host_required: true,
      archive_binding_verified: true,
      header_contract_verified: true,
    },
  };
}

describe("public Education INEP staging CLI", () => {
  it("defaults to offline dry-run and requires explicit commit flag", () => {
    const parsed = parseStageArgs([
      "--manifest",
      "./manifest.json",
      "--jsonl",
      "./salvador.jsonl",
    ]);

    expect(parsed.commitStaging).toBe(false);

    expect(
      parseStageArgs([
        "--manifest",
        "./manifest.json",
        "--jsonl",
        "./salvador.jsonl",
        "--commit-staging",
      ]).commitStaging,
    ).toBe(true);
  });

  it("keeps plan output coupled to explicit database staging", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "tools/data-quality/stage-public-education-inep-import.mjs",
      ),
      "utf8",
    );

    expect(source).toContain("--plan-output requires --commit-staging");
    expect(source).toContain(
      "validate_public_education_import_batch returned invalid result",
    );
  });

  it("proves Supabase project refs from direct and pooler URLs", () => {
    expect(
      extractSupabaseProjectRefFromDatabaseUrl(
        "postgresql://postgres:secret@db.xhdowzacfujckjelqhtd.supabase.co:5432/postgres",
      ),
    ).toBe("xhdowzacfujckjelqhtd");

    expect(
      extractSupabaseProjectRefFromDatabaseUrl(
        "postgresql://postgres.xhdowzacfujckjelqhtd:secret@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
      ),
    ).toBe("xhdowzacfujckjelqhtd");

    expect(
      extractSupabaseProjectRefFromDatabaseUrl(
        "postgresql://postgres:secret@example.com:5432/postgres",
      ),
    ).toBeNull();

    expect(
      extractSupabaseProjectRefFromDatabaseUrl(
        "postgresql://postgres.xhdowzacfujckjelqhtd:secret@example.com:6543/postgres",
      ),
    ).toBeNull();
  });

  it("accepts only the current official-bound manifest contract", () => {
    const manifest = manifestFixture();
    const summary = validateInepImportManifest(manifest);

    expect(summary.targetRows).toBe(2);
    expect(summary.municipalityIbge).toBe("2927408");

    expect(() =>
      validateInepImportManifest({
        ...manifest,
        source: {
          ...manifest.source,
          record_hash_contract: "legacy-hash",
        },
      }),
    ).toThrow(/raw-record hash contract mismatch/);

    expect(() =>
      validateInepImportManifest({
        ...manifest,
        counts: {
          ...manifest.counts,
          target_municipality_rows: 0,
        },
      }),
    ).toThrow(/positive integer/);
  });

  it("recomputes every JSONL row hash before any database connection", () => {
    const summary = validateInepImportManifest(manifestFixture());
    const rawRecord = {
      NU_ANO_CENSO: "2025",
      CO_ENTIDADE: "29412277",
      NO_ENTIDADE: "Escola Municipal",
      TP_SITUACAO_FUNCIONAMENTO: "1",
      CO_UF: "29",
      CO_MUNICIPIO: "2927408",
      TP_DEPENDENCIA: "3",
    };

    const row = {
      source_row_number: 2,
      municipality_ibge_code: "2927408",
      source_record_sha256: sha256RawRecord(rawRecord),
      raw_record: rawRecord,
    };

    expect(validateNormalizedInepRow(row, summary)).toBe(2);

    expect(() =>
      validateNormalizedInepRow(
        {
          ...row,
          source_record_sha256: "0".repeat(64),
        },
        summary,
      ),
    ).toThrow(/does not match raw_record/);
  });

  it("contains no canonical Profile/Business/Education materialization", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "tools/data-quality/stage-public-education-inep-import.mjs",
      ),
      "utf8",
    );

    expect(source).not.toMatch(
      /INSERT\s+INTO\s+public\.(?:profiles|business_data|education_profiles)/i,
    );
    expect(source).not.toContain("profile_create_profile_with_extension");
    expect(source).toContain("private.stage_public_education_import_rows");
    expect(source).toContain("private.validate_public_education_import_batch");
    expect(source).toContain("private.plan_public_education_import_batch");
    expect(source).toContain("materializes_records: false");
  });
});

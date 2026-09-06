import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  NORMALIZED_OUTPUT_CONTRACT,
  PARSER_VERSION,
  RAW_RECORD_HASH_CONTRACT,
  sha256RawRecord,
} from "../../tools/data-quality/prepare-public-education-inep-import.mjs";
import {
  extractSupabaseProjectRefFromDatabaseUrl,
  parseStageArgs,
  runPublicEducationInepStager,
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
    normalized_output: {
      contract: NORMALIZED_OUTPUT_CONTRACT,
      file: "salvador.jsonl",
      sha256: "c".repeat(64),
      rows: 2,
      raw_record_hash_contract: RAW_RECORD_HASH_CONTRACT,
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
    expect(summary.normalizedOutput.contract).toBe(
      "acheguese.public-education-inep-jsonl/1",
    );

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

  it("requires the manifest to bind the normalized JSONL artifact", () => {
    const manifest = manifestFixture();

    expect(() =>
      validateInepImportManifest({
        ...manifest,
        normalized_output: {
          ...manifest.normalized_output,
          contract: "legacy-jsonl-contract",
        },
      }),
    ).toThrow(/normalized output contract mismatch/);

    expect(() =>
      validateInepImportManifest({
        ...manifest,
        normalized_output: {
          ...manifest.normalized_output,
          rows: 3,
        },
      }),
    ).toThrow(/normalized output row count mismatch/);
  });

  it("dry-runs the exact normalized JSONL artifact and rejects a swapped file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "acheguese-inep-stager-"));
    try {
      const jsonlPath = join(dir, "salvador.jsonl");
      const manifestPath = join(dir, "manifest.json");
      const raw1 = {
        NU_ANO_CENSO: "2025",
        CO_ENTIDADE: "29412277",
        NO_ENTIDADE: "Escola Municipal 1",
        TP_SITUACAO_FUNCIONAMENTO: "1",
        CO_UF: "29",
        CO_MUNICIPIO: "2927408",
        TP_DEPENDENCIA: "3",
      };
      const raw2 = {
        ...raw1,
        CO_ENTIDADE: "29412278",
        NO_ENTIDADE: "Escola Municipal 2",
      };
      const rows = [
        {
          source_row_number: 2,
          inep_code: "29412277",
          school_name: "Escola Municipal 1",
          uf_ibge_code: "29",
          municipality_ibge_code: "2927408",
          administrative_dependency_code: "3",
          operation_status_code: "1",
          source_record_sha256: sha256RawRecord(raw1),
          raw_record: raw1,
        },
        {
          source_row_number: 3,
          inep_code: "29412278",
          school_name: "Escola Municipal 2",
          uf_ibge_code: "29",
          municipality_ibge_code: "2927408",
          administrative_dependency_code: "3",
          operation_status_code: "1",
          source_record_sha256: sha256RawRecord(raw2),
          raw_record: raw2,
        },
      ];
      const jsonl = rows.map((row) => JSON.stringify(row)).join("\n") + "\n";
      writeFileSync(jsonlPath, jsonl, "utf8");

      const manifest = manifestFixture();
      manifest.normalized_output.sha256 = createHash("sha256")
        .update(jsonl, "utf8")
        .digest("hex");
      writeFileSync(
        manifestPath,
        JSON.stringify(manifest, null, 2) + "\n",
        "utf8",
      );

      await expect(
        runPublicEducationInepStager({
          manifestPath,
          jsonlPath,
          planOutputPath: null,
          commitStaging: false,
        }),
      ).resolves.toMatchObject({
        ok: true,
        mode: "dry-run",
        rows: 2,
        writes_database: false,
        materializes_records: false,
      });

      writeFileSync(
        jsonlPath,
        jsonl.replace("Escola Municipal 2", "Arquivo trocado"),
        "utf8",
      );

      await expect(
        runPublicEducationInepStager({
          manifestPath,
          jsonlPath,
          planOutputPath: null,
          commitStaging: false,
        }),
      ).rejects.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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

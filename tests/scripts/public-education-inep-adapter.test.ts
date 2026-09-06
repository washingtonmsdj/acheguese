import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const modulePath =
  "../../tools/data-quality/prepare-public-education-inep-import.mjs";

type AdapterModule = {
  PARSER_VERSION: string;
  REQUIRED_COLUMNS: readonly string[];
  detectDelimiter: (header: string) => {
    delimiter: string;
    headers: string[];
  };
  normalizeCensoSchoolRecord: (
    rawRecord: Record<string, string>,
    sourceRowNumber: number,
    options?: {
      sourceYear?: number;
      municipalityIbge?: string;
    },
  ) => Record<string, unknown> | null;
  parseDelimitedRecord: (value: string, delimiter: string) => string[];
  preparePublicEducationInepImport: (options: {
    csvPath: string;
    outputPath: string;
    manifestPath: string;
    sourceYear: number;
    municipalityIbge: string;
    archivePath: string;
    archiveUrl: string;
    sourcePageUpdatedAt: string | null;
    encoding: string;
  }) => Promise<Record<string, any>>;
};

async function loadModule(): Promise<AdapterModule> {
  return (await import(modulePath)) as AdapterModule;
}

const tempDirs: string[] = [];

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "acheguese-inep-adapter-"));
  tempDirs.push(dir);
  return dir;
}


function writeStoredZip(
  zipPath: string,
  entryName: string,
  content: string,
) {
  const name = Buffer.from(entryName, "utf8");
  const data = Buffer.from(content, "utf8");

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt32LE(0, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt32LE(0, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(0, 42);

  const centralOffset = local.length + name.length + data.length;
  const centralSize = central.length + name.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);

  writeFileSync(
    zipPath,
    Buffer.concat([local, name, data, central, name, eocd]),
  );
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("public Education INEP adapter", () => {
  it("keeps the canonical Censo school identity columns fail-closed", async () => {
    const { REQUIRED_COLUMNS, detectDelimiter } = await loadModule();
    const header = [
      ...REQUIRED_COLUMNS,
      "DS_ENDERECO",
      "NU_ENDERECO",
      "NO_BAIRRO",
      "CO_CEP",
    ].join(";");

    expect(detectDelimiter(header)).toMatchObject({
      delimiter: ";",
      headers: expect.arrayContaining([
        "NU_ANO_CENSO",
        "CO_ENTIDADE",
        "NO_ENTIDADE",
        "TP_SITUACAO_FUNCIONAMENTO",
        "CO_UF",
        "CO_MUNICIPIO",
        "TP_DEPENDENCIA",
      ]),
    });

    expect(() =>
      detectDelimiter(
        header.replace("TP_DEPENDENCIA", "DEPENDENCIA_INVENTADA"),
      ),
    ).toThrow(/Censo school header mismatch/);
  });

  it("parses delimiters and escaped quotes without corrupting source text", async () => {
    const { parseDelimitedRecord } = await loadModule();

    expect(
      parseDelimitedRecord(
        '2025;29412277;"Escola; Municipal ""Teste""";1;29;2927408;3',
        ";",
      ),
    ).toEqual([
      "2025",
      "29412277",
      'Escola; Municipal "Teste"',
      "1",
      "29",
      "2927408",
      "3",
    ]);
  });

  it("filters only by canonical municipality while preserving the raw source record", async () => {
    const { normalizeCensoSchoolRecord } = await loadModule();
    const raw = {
      NU_ANO_CENSO: "2025",
      CO_ENTIDADE: "29412277",
      NO_ENTIDADE: "CMEI Dalia de Menezes",
      TP_SITUACAO_FUNCIONAMENTO: "1",
      CO_UF: "29",
      CO_MUNICIPIO: "2927408",
      TP_DEPENDENCIA: "3",
      DS_ENDERECO: "Rua Exemplo",
      CO_CEP: "41900123",
    };

    const normalized = normalizeCensoSchoolRecord(raw, 2, {
      sourceYear: 2025,
      municipalityIbge: "2927408",
    });

    expect(normalized).toMatchObject({
      source_row_number: 2,
      inep_code: "29412277",
      school_name: "CMEI Dalia de Menezes",
      municipality_ibge_code: "2927408",
      administrative_dependency_code: "3",
      operation_status_code: "1",
      address_street: "Rua Exemplo",
      postal_code: "41900123",
      raw_record: raw,
    });
    expect(normalized?.source_record_sha256).toMatch(/^[0-9a-f]{64}$/);

    expect(
      normalizeCensoSchoolRecord(
        { ...raw, CO_MUNICIPIO: "2611606" },
        3,
        {
          sourceYear: 2025,
          municipalityIbge: "2927408",
        },
      ),
    ).toBeNull();

    expect(() =>
      normalizeCensoSchoolRecord(
        { ...raw, NU_ANO_CENSO: "2024" },
        4,
        {
          sourceYear: 2025,
          municipalityIbge: "2927408",
        },
      ),
    ).toThrow(/does not match source year 2025/);
  });

  it("builds a reproducible Salvador manifest without pretending private or inactive rows are public-active", async () => {
    const { PARSER_VERSION, preparePublicEducationInepImport } =
      await loadModule();
    const dir = makeTempDir();
    const csvPath = join(dir, "Tabela_Escola_2025.csv");
    const outputPath = join(dir, "salvador.jsonl");
    const manifestPath = join(dir, "manifest.json");

    const header = [
      "NU_ANO_CENSO",
      "CO_ENTIDADE",
      "NO_ENTIDADE",
      "TP_SITUACAO_FUNCIONAMENTO",
      "CO_UF",
      "CO_MUNICIPIO",
      "TP_DEPENDENCIA",
      "DS_ENDERECO",
      "NU_ENDERECO",
      "NO_BAIRRO",
      "CO_CEP",
    ].join(";");

    const csvContent = [
      header,
      '2025;29412277;"Escola; Municipal";1;29;2927408;3;Rua A;10;Santa Cruz;41900123',
      "2025;29999991;Escola Privada;1;29;2927408;4;Rua B;20;Pituba;41830000",
      "2025;29999992;Escola Estadual Paralisada;2;29;2927408;2;Rua C;30;Centro;40000000",
      "2025;26999999;Escola Recife;1;26;2611606;3;Rua D;40;Centro;50000000",
    ].join("\n");
    writeFileSync(csvPath, csvContent, "utf8");
    const archivePath = join(dir, "microdados_censo_escolar_2025_.zip");
    writeStoredZip(
      archivePath,
      "DADOS/Tabela_Escola_2025.csv",
      csvContent,
    );

    const manifest = await preparePublicEducationInepImport({
      csvPath,
      outputPath,
      manifestPath,
      sourceYear: 2025,
      municipalityIbge: "2927408",
      archivePath,
      archiveUrl:
        "https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip",
      sourcePageUpdatedAt: "2026-07-31T14:52:00.000Z",
      encoding: "utf8",
    });

    expect(PARSER_VERSION).toBe("inep-censo-school-adapter/4");
    expect(manifest).toMatchObject({
      contract: "acheguese.public-education-inep-normalized/1",
      parser_version: PARSER_VERSION,
      source: {
        archive_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        archive_entry: "DADOS/Tabela_Escola_2025.csv",
        archive_entry_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        extracted_file_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        source_year: 2025,
        landing_page_updated_at: "2026-07-31T14:52:00.000Z",
        file_role: "school_table",
      },
      target: {
        municipality_ibge_code: "2927408",
        uf_ibge_code: "29",
      },
      counts: {
        source_rows: 4,
        target_municipality_rows: 3,
        dependency_codes: {
          "2": 1,
          "3": 1,
          "4": 1,
        },
        operation_status_codes: {
          "1": 2,
          "2": 1,
        },
        public_dependency_rows: 2,
        private_dependency_rows: 1,
        active_operation_rows: 2,
        public_active_rows: 1,
      },
      safety: {
        calls_supabase: false,
        publishes_records: false,
        staging_quality_gate_required: true,
        official_archive_host_required: true,
        archive_binding_verified: true,
        header_contract_verified: true,
      },
    });

    const rows = readFileSync(outputPath, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      inep_code: "29412277",
      school_name: "Escola; Municipal",
    });
    expect(rows.some((row) => row.inep_code === "26999999")).toBe(false);

    expect(JSON.parse(readFileSync(manifestPath, "utf8"))).toMatchObject({
      parser_version: PARSER_VERSION,
      counts: {
        public_active_rows: 1,
      },
    });
  });

  it("removes normalized output if the manifest cannot be committed", async () => {
    const { preparePublicEducationInepImport } = await loadModule();
    const dir = makeTempDir();
    const csvPath = join(dir, "Tabela_Escola_2025.csv");
    const outputPath = join(dir, "salvador.jsonl");
    const manifestPath = join(dir, "manifest.json");

    writeFileSync(
      csvPath,
      [
        "NU_ANO_CENSO;CO_ENTIDADE;NO_ENTIDADE;TP_SITUACAO_FUNCIONAMENTO;CO_UF;CO_MUNICIPIO;TP_DEPENDENCIA",
        "2025;29412277;Escola Municipal;1;29;2927408;3",
      ].join("\n"),
      "utf8",
    );
    const archivePath = join(dir, "microdados_censo_escolar_2025_.zip");
    writeStoredZip(
      archivePath,
      "DADOS/Tabela_Escola_2025.csv",
      readFileSync(csvPath, "utf8"),
    );
    writeFileSync(manifestPath, '{"do_not_overwrite":true}\n', "utf8");

    await expect(
      preparePublicEducationInepImport({
        csvPath,
        outputPath,
        manifestPath,
        sourceYear: 2025,
        municipalityIbge: "2927408",
        archivePath,
        archiveUrl:
          "https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip",
        sourcePageUpdatedAt: null,
        encoding: "utf8",
      }),
    ).rejects.toMatchObject({ code: "EEXIST" });

    expect(() => readFileSync(outputPath, "utf8")).toThrow();
    expect(readFileSync(manifestPath, "utf8")).toContain(
      '"do_not_overwrite":true',
    );
  });

  it("rejects a CSV that is not the file contained in the supplied ZIP", async () => {
    const { preparePublicEducationInepImport } = await loadModule();
    const dir = makeTempDir();
    const csvPath = join(dir, "Tabela_Escola_2025.csv");
    const outputPath = join(dir, "salvador.jsonl");
    const manifestPath = join(dir, "manifest.json");
    const archivePath = join(dir, "microdados_censo_escolar_2025_.zip");
    const original = [
      "NU_ANO_CENSO;CO_ENTIDADE;NO_ENTIDADE;TP_SITUACAO_FUNCIONAMENTO;CO_UF;CO_MUNICIPIO;TP_DEPENDENCIA",
      "2025;29412277;Escola Municipal;1;29;2927408;3",
    ].join("\n");

    writeStoredZip(
      archivePath,
      "DADOS/Tabela_Escola_2025.csv",
      original,
    );
    writeFileSync(
      csvPath,
      original.replace("Escola Municipal", "CSV adulterado"),
      "utf8",
    );

    await expect(
      preparePublicEducationInepImport({
        csvPath,
        outputPath,
        manifestPath,
        sourceYear: 2025,
        municipalityIbge: "2927408",
        archivePath,
        archiveUrl:
          "https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip",
        sourcePageUpdatedAt: null,
        encoding: "utf8",
      }),
    ).rejects.toThrow(/does not match archive entry/);

    expect(() => readFileSync(outputPath, "utf8")).toThrow();
  });

  it("contains no Supabase client or canonical publish mutation", async () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "tools/data-quality/prepare-public-education-inep-import.mjs",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/@supabase|createClient|SUPABASE_/);
    expect(source).not.toMatch(
      /education_profiles|business_data|profile_create_profile_with_extension/,
    );
    expect(source).toContain(
      "This command never calls Supabase and never publishes Education records.",
    );
  });
});

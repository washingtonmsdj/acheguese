#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  promises as fs,
} from 'node:fs';
import { once } from 'node:events';
import { basename, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

export const PARSER_VERSION = 'inep-censo-school-adapter/1';

export const REQUIRED_COLUMNS = Object.freeze([
  'NU_ANO_CENSO',
  'CO_ENTIDADE',
  'NO_ENTIDADE',
  'TP_SITUACAO_FUNCIONAMENTO',
  'CO_UF',
  'CO_MUNICIPIO',
  'TP_DEPENDENCIA',
]);

const OPTIONAL_COLUMN_ALIASES = Object.freeze({
  address_street: ['DS_ENDERECO', 'NO_ENDERECO'],
  address_number: ['NU_ENDERECO'],
  address_complement: ['DS_COMPLEMENTO'],
  neighborhood_name: ['NO_BAIRRO'],
  postal_code: ['CO_CEP'],
  latitude: ['NU_LATITUDE', 'LATITUDE'],
  longitude: ['NU_LONGITUDE', 'LONGITUDE'],
});

const SUPPORTED_ENCODINGS = new Set(['utf8', 'latin1']);
const DELIMITERS = [';', ',', '\t', '|'];

function usage() {
  return [
    'Usage:',
    '  node tools/data-quality/prepare-public-education-inep-import.mjs',
    '    --csv <extracted-censo-school.csv>',
    '    --output <salvador-normalized.jsonl>',
    '    --manifest <manifest.json>',
    '    --source-archive-sha256 <64-hex>',
    '    [--source-year 2025]',
    '    [--municipality-ibge 2927408]',
    '    [--encoding utf8|latin1]',
    '',
    'This command never calls Supabase and never publishes Education records.',
  ].join('\n');
}

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      throw new Error(`unexpected argument: ${token}\n\n${usage()}`);
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`missing value for --${key}\n\n${usage()}`);
    }

    args.set(key, value);
    index += 1;
  }

  const required = [
    'csv',
    'output',
    'manifest',
    'source-archive-sha256',
  ];

  for (const key of required) {
    if (!args.has(key)) {
      throw new Error(`missing --${key}\n\n${usage()}`);
    }
  }

  const sourceYear = Number(args.get('source-year') ?? '2025');
  if (!Number.isInteger(sourceYear) || sourceYear < 2007 || sourceYear > 2100) {
    throw new Error('source year must be an integer between 2007 and 2100');
  }

  const municipalityIbge = args.get('municipality-ibge') ?? '2927408';
  if (!/^[0-9]{7}$/.test(municipalityIbge)) {
    throw new Error('municipality IBGE code must contain exactly 7 digits');
  }

  const archiveSha256 = String(args.get('source-archive-sha256')).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(archiveSha256)) {
    throw new Error('source archive SHA-256 must contain exactly 64 hex characters');
  }

  const encoding = args.get('encoding') ?? 'utf8';
  if (!SUPPORTED_ENCODINGS.has(encoding)) {
    throw new Error('encoding must be utf8 or latin1');
  }

  return {
    csvPath: resolve(String(args.get('csv'))),
    outputPath: resolve(String(args.get('output'))),
    manifestPath: resolve(String(args.get('manifest'))),
    sourceYear,
    municipalityIbge,
    archiveSha256,
    encoding,
  };
}

function quotesBalanced(value) {
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '"') continue;

    if (inQuotes && value[index + 1] === '"') {
      index += 1;
      continue;
    }

    inQuotes = !inQuotes;
  }

  return !inQuotes;
}

export function parseDelimitedRecord(value, delimiter) {
  const fields = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === '"') {
      if (inQuotes && value[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      fields.push(field);
      field = '';
      continue;
    }

    field += char;
  }

  if (inQuotes) {
    throw new Error('unterminated quoted CSV field');
  }

  fields.push(field);
  return fields;
}

export function detectDelimiter(headerRecord) {
  let best = null;

  for (const delimiter of DELIMITERS) {
    const fields = parseDelimitedRecord(headerRecord, delimiter).map((field) =>
      field.replace(/^\uFEFF/, '').trim(),
    );
    const requiredMatches = REQUIRED_COLUMNS.filter((column) =>
      fields.includes(column),
    ).length;
    const score = requiredMatches * 10000 + fields.length;

    if (!best || score > best.score) {
      best = { delimiter, fields, requiredMatches, score };
    }
  }

  if (!best || best.requiredMatches !== REQUIRED_COLUMNS.length) {
    throw new Error(
      `Censo school header mismatch. Required columns: ${REQUIRED_COLUMNS.join(', ')}`,
    );
  }

  const duplicateHeaders = best.fields.filter(
    (field, index) => best.fields.indexOf(field) !== index,
  );
  if (duplicateHeaders.length > 0) {
    throw new Error(
      `duplicate CSV headers: ${Array.from(new Set(duplicateHeaders)).join(', ')}`,
    );
  }

  return { delimiter: best.delimiter, headers: best.fields };
}

function toRecord(headers, fields, sourceRowNumber) {
  if (fields.length !== headers.length) {
    throw new Error(
      `CSV row ${sourceRowNumber} has ${fields.length} fields; expected ${headers.length}`,
    );
  }

  return Object.fromEntries(
    headers.map((header, index) => [header, fields[index]]),
  );
}

function nullableTrimmed(value) {
  const normalized = String(value ?? '').trim();
  return normalized === '' ? null : normalized;
}

function firstPresent(record, aliases) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(record, alias)) {
      return nullableTrimmed(record[alias]);
    }
  }

  return null;
}

function sha256Json(record) {
  return createHash('sha256')
    .update(JSON.stringify(record), 'utf8')
    .digest('hex');
}

export function normalizeCensoSchoolRecord(
  rawRecord,
  sourceRowNumber,
  {
    sourceYear = 2025,
    municipalityIbge = '2927408',
  } = {},
) {
  const rowYear = nullableTrimmed(rawRecord.NU_ANO_CENSO);
  if (rowYear !== String(sourceYear)) {
    throw new Error(
      `row ${sourceRowNumber}: NU_ANO_CENSO=${rowYear ?? 'null'} does not match source year ${sourceYear}`,
    );
  }

  if (nullableTrimmed(rawRecord.CO_MUNICIPIO) !== municipalityIbge) {
    return null;
  }

  return {
    source_row_number: sourceRowNumber,
    inep_code: nullableTrimmed(rawRecord.CO_ENTIDADE),
    school_name: nullableTrimmed(rawRecord.NO_ENTIDADE),
    uf_ibge_code: nullableTrimmed(rawRecord.CO_UF),
    municipality_ibge_code: nullableTrimmed(rawRecord.CO_MUNICIPIO),
    administrative_dependency_code: nullableTrimmed(
      rawRecord.TP_DEPENDENCIA,
    ),
    operation_status_code: nullableTrimmed(
      rawRecord.TP_SITUACAO_FUNCIONAMENTO,
    ),
    address_street: firstPresent(
      rawRecord,
      OPTIONAL_COLUMN_ALIASES.address_street,
    ),
    address_number: firstPresent(
      rawRecord,
      OPTIONAL_COLUMN_ALIASES.address_number,
    ),
    address_complement: firstPresent(
      rawRecord,
      OPTIONAL_COLUMN_ALIASES.address_complement,
    ),
    neighborhood_name: firstPresent(
      rawRecord,
      OPTIONAL_COLUMN_ALIASES.neighborhood_name,
    ),
    postal_code: firstPresent(
      rawRecord,
      OPTIONAL_COLUMN_ALIASES.postal_code,
    ),
    latitude: firstPresent(
      rawRecord,
      OPTIONAL_COLUMN_ALIASES.latitude,
    ),
    longitude: firstPresent(
      rawRecord,
      OPTIONAL_COLUMN_ALIASES.longitude,
    ),
    source_record_sha256: sha256Json(rawRecord),
    raw_record: rawRecord,
  };
}

async function* logicalCsvRecords(csvPath, encoding) {
  const input = createReadStream(csvPath, { encoding });
  const lines = createInterface({
    input,
    crlfDelay: Infinity,
  });

  let buffer = '';
  let startLine = 0;
  let physicalLine = 0;

  for await (const line of lines) {
    physicalLine += 1;

    if (buffer === '') {
      startLine = physicalLine;
      buffer = line;
    } else {
      buffer += `\n${line}`;
    }

    if (!quotesBalanced(buffer)) {
      continue;
    }

    yield { text: buffer, sourceRowNumber: startLine };
    buffer = '';
  }

  if (buffer !== '') {
    throw new Error(
      `unterminated quoted CSV record starting at physical line ${startLine}`,
    );
  }
}

function delimiterLabel(delimiter) {
  return delimiter === '\t' ? 'tab' : delimiter;
}

async function writeJsonLine(stream, value) {
  if (stream.write(`${JSON.stringify(value)}\n`)) return;
  await once(stream, 'drain');
}

export async function preparePublicEducationInepImport(options) {
  await fs.access(options.csvPath);

  const output = createWriteStream(options.outputPath, {
    encoding: 'utf8',
    flags: 'wx',
  });

  let headers = null;
  let delimiter = null;
  let sourceRows = 0;
  let targetRows = 0;
  let replacementCharacterRows = 0;

  const dependencyCounts = Object.create(null);
  const operationStatusCounts = Object.create(null);

  try {
    for await (const record of logicalCsvRecords(
      options.csvPath,
      options.encoding,
    )) {
      if (headers === null) {
        const detected = detectDelimiter(record.text);
        headers = detected.headers;
        delimiter = detected.delimiter;
        continue;
      }

      sourceRows += 1;

      const fields = parseDelimitedRecord(record.text, delimiter);
      const rawRecord = toRecord(
        headers,
        fields,
        record.sourceRowNumber,
      );

      if (
        options.encoding === 'utf8' &&
        Object.values(rawRecord).some(
          (value) => typeof value === 'string' && value.includes('\uFFFD'),
        )
      ) {
        replacementCharacterRows += 1;
      }

      const normalized = normalizeCensoSchoolRecord(
        rawRecord,
        record.sourceRowNumber,
        options,
      );

      if (!normalized) continue;

      targetRows += 1;

      const dependency =
        normalized.administrative_dependency_code ?? 'missing';
      dependencyCounts[dependency] =
        (dependencyCounts[dependency] ?? 0) + 1;

      const operationStatus = normalized.operation_status_code ?? 'missing';
      operationStatusCounts[operationStatus] =
        (operationStatusCounts[operationStatus] ?? 0) + 1;

      await writeJsonLine(output, normalized);
    }
  } catch (error) {
    output.destroy();
    await fs.rm(options.outputPath, { force: true });
    throw error;
  }

  output.end();
  await once(output, 'close');

  if (!headers || !delimiter) {
    await fs.rm(options.outputPath, { force: true });
    throw new Error('empty CSV file');
  }

  if (replacementCharacterRows > 0) {
    await fs.rm(options.outputPath, { force: true });
    throw new Error(
      `UTF-8 decoding produced replacement characters in ${replacementCharacterRows} rows. Retry with --encoding latin1 after verifying the source encoding.`,
    );
  }

  const optionalColumnsFound = Object.fromEntries(
    Object.entries(OPTIONAL_COLUMN_ALIASES).map(([field, aliases]) => [
      field,
      aliases.find((alias) => headers.includes(alias)) ?? null,
    ]),
  );

  const publicActiveCandidates =
    (dependencyCounts['1'] ?? 0) +
    (dependencyCounts['2'] ?? 0) +
    (dependencyCounts['3'] ?? 0);

  const manifest = {
    contract: 'acheguese.public-education-inep-normalized/1',
    parser_version: PARSER_VERSION,
    generated_at: new Date().toISOString(),
    source: {
      landing_url:
        'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar',
      archive_url:
        'https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip',
      archive_sha256: options.archiveSha256,
      source_year: options.sourceYear,
      extracted_file: basename(options.csvPath),
      encoding: options.encoding,
      delimiter: delimiterLabel(delimiter),
    },
    target: {
      municipality_ibge_code: options.municipalityIbge,
      uf_ibge_code: options.municipalityIbge.slice(0, 2),
    },
    columns: {
      required: REQUIRED_COLUMNS,
      optional_found: optionalColumnsFound,
      source_column_count: headers.length,
    },
    counts: {
      source_rows: sourceRows,
      target_municipality_rows: targetRows,
      dependency_codes: dependencyCounts,
      operation_status_codes: operationStatusCounts,
      public_dependency_rows:
        publicActiveCandidates - (dependencyCounts['4'] ?? 0),
    },
    safety: {
      calls_supabase: false,
      publishes_records: false,
      private_dependency_code: '4',
      active_operation_status_code: '1',
      staging_quality_gate_required: true,
    },
  };

  await fs.writeFile(
    options.manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );

  return manifest;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = await preparePublicEducationInepImport(options);
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      parser_version: PARSER_VERSION,
      output: options.outputPath,
      manifest: options.manifestPath,
      counts: manifest.counts,
    })}\n`,
  );
}

const isCli =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isCli) {
  main().catch((error) => {
    process.stderr.write(
      `${JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
    );
    process.exitCode = 1;
  });
}

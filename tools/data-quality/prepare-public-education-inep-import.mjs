#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  promises as fs,
} from 'node:fs';
import { once } from 'node:events';
import { basename, resolve } from 'node:path';
import { createInflateRaw } from 'node:zlib';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

export const PARSER_VERSION = 'inep-censo-school-adapter/6';
export const RAW_RECORD_HASH_CONTRACT =
  'acheguese.inep-raw-record-sha256/1';
export const NORMALIZED_OUTPUT_CONTRACT =
  'acheguese.public-education-inep-jsonl/1';

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
    '    --source-archive <downloaded-official.zip>',
    '    --source-archive-url <https://download.inep.gov.br/...zip>',
    '    [--source-page-updated-at <ISO timestamp>]',
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
    'source-archive',
    'source-archive-url',
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

  const archivePath = resolve(String(args.get('source-archive')));
  if (!/\.zip$/i.test(archivePath)) {
    throw new Error('source archive path must point to a .zip file');
  }

  const archiveUrl = String(args.get('source-archive-url'));
  if (
    !/^https:\/\/download\.inep\.gov\.br\/.+\.zip(?:[?#].*)?$/i.test(
      archiveUrl,
    )
  ) {
    throw new Error(
      'source archive URL must be an official download.inep.gov.br ZIP',
    );
  }

  const sourcePageUpdatedAtRaw = args.get('source-page-updated-at') ?? null;
  let sourcePageUpdatedAt = null;

  if (sourcePageUpdatedAtRaw !== null) {
    const sourcePageUpdatedAtMs = Date.parse(sourcePageUpdatedAtRaw);
    if (Number.isNaN(sourcePageUpdatedAtMs)) {
      throw new Error('source page updated-at must be a valid ISO timestamp');
    }
    sourcePageUpdatedAt = new Date(sourcePageUpdatedAtMs).toISOString();
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
    archivePath,
    archiveUrl,
    sourcePageUpdatedAt,
    encoding,
  };
}

export async function sha256File(filePath) {
  const hash = createHash('sha256');
  const input = createReadStream(filePath);

  for await (const chunk of input) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}

export async function assertZipSignature(filePath) {
  const handle = await fs.open(filePath, 'r');

  try {
    const signature = Buffer.alloc(4);
    const { bytesRead } = await handle.read(signature, 0, 4, 0);

    if (bytesRead < 4 || signature[0] !== 0x50 || signature[1] !== 0x4b) {
      throw new Error('source archive does not have a ZIP signature');
    }

    const marker = `${signature[2].toString(16).padStart(2, '0')}${signature[3]
      .toString(16)
      .padStart(2, '0')}`;

    if (!new Set(['0304', '0506', '0708']).has(marker)) {
      throw new Error('source archive has an unsupported ZIP signature');
    }
  } finally {
    await handle.close();
  }
}


const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_EOCD_MIN_SIZE = 22;
const ZIP_MAX_COMMENT_SIZE = 0xffff;
const ZIP_MAX_CENTRAL_DIRECTORY_SIZE = 32 * 1024 * 1024;

async function readFileRange(filePath, start, length) {
  if (!Number.isSafeInteger(start) || start < 0) {
    throw new Error('invalid ZIP read offset');
  }
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new Error('invalid ZIP read length');
  }

  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    let totalRead = 0;

    while (totalRead < length) {
      const { bytesRead } = await handle.read(
        buffer,
        totalRead,
        length - totalRead,
        start + totalRead,
      );
      if (bytesRead === 0) break;
      totalRead += bytesRead;
    }

    if (totalRead !== length) {
      throw new Error('unexpected end of ZIP archive');
    }

    return buffer;
  } finally {
    await handle.close();
  }
}

function zipEntryBasename(entryName) {
  const normalized = String(entryName ?? '').replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  return segments.at(-1) ?? '';
}

async function readZipCentralDirectory(filePath) {
  const stat = await fs.stat(filePath);
  if (stat.size < ZIP_EOCD_MIN_SIZE) {
    throw new Error('source archive is too small to be a ZIP file');
  }

  const tailLength = Math.min(
    stat.size,
    ZIP_EOCD_MIN_SIZE + ZIP_MAX_COMMENT_SIZE,
  );
  const tailStart = stat.size - tailLength;
  const tail = await readFileRange(filePath, tailStart, tailLength);

  let eocdOffset = -1;
  for (let index = tail.length - ZIP_EOCD_MIN_SIZE; index >= 0; index -= 1) {
    if (
      tail.readUInt32LE(index) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE
    ) {
      const commentLength = tail.readUInt16LE(index + 20);
      if (index + ZIP_EOCD_MIN_SIZE + commentLength === tail.length) {
        eocdOffset = index;
        break;
      }
    }
  }

  if (eocdOffset < 0) {
    throw new Error('ZIP end-of-central-directory record not found');
  }

  const diskNumber = tail.readUInt16LE(eocdOffset + 4);
  const centralDirectoryDisk = tail.readUInt16LE(eocdOffset + 6);
  const entriesOnDisk = tail.readUInt16LE(eocdOffset + 8);
  const totalEntries = tail.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = tail.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = tail.readUInt32LE(eocdOffset + 16);

  if (diskNumber !== 0 || centralDirectoryDisk !== 0) {
    throw new Error('multi-disk ZIP archives are not supported');
  }

  if (
    entriesOnDisk === 0xffff ||
    totalEntries === 0xffff ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff
  ) {
    throw new Error('ZIP64 archives require an explicit adapter upgrade');
  }

  if (entriesOnDisk !== totalEntries) {
    throw new Error('ZIP central-directory entry count mismatch');
  }

  if (
    centralDirectorySize > ZIP_MAX_CENTRAL_DIRECTORY_SIZE ||
    centralDirectoryOffset + centralDirectorySize > stat.size
  ) {
    throw new Error('ZIP central directory is out of bounds');
  }

  const centralDirectory = await readFileRange(
    filePath,
    centralDirectoryOffset,
    centralDirectorySize,
  );
  const entries = [];
  let cursor = 0;

  while (cursor < centralDirectory.length) {
    if (cursor + 46 > centralDirectory.length) {
      throw new Error('truncated ZIP central-directory entry');
    }
    if (
      centralDirectory.readUInt32LE(cursor) !==
      ZIP_CENTRAL_DIRECTORY_SIGNATURE
    ) {
      throw new Error('invalid ZIP central-directory signature');
    }

    const flags = centralDirectory.readUInt16LE(cursor + 8);
    const compressionMethod = centralDirectory.readUInt16LE(cursor + 10);
    const compressedSize = centralDirectory.readUInt32LE(cursor + 20);
    const uncompressedSize = centralDirectory.readUInt32LE(cursor + 24);
    const fileNameLength = centralDirectory.readUInt16LE(cursor + 28);
    const extraLength = centralDirectory.readUInt16LE(cursor + 30);
    const commentLength = centralDirectory.readUInt16LE(cursor + 32);
    const localHeaderOffset = centralDirectory.readUInt32LE(cursor + 42);
    const entrySize = 46 + fileNameLength + extraLength + commentLength;

    if (cursor + entrySize > centralDirectory.length) {
      throw new Error('ZIP central-directory entry exceeds archive bounds');
    }

    const fileName = centralDirectory
      .subarray(cursor + 46, cursor + 46 + fileNameLength)
      .toString('utf8');

    entries.push({
      fileName,
      flags,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    cursor += entrySize;
  }

  if (entries.length !== totalEntries) {
    throw new Error(
      `ZIP central directory declared ${totalEntries} entries but parsed ${entries.length}`,
    );
  }

  return entries;
}

export async function findZipEntryByBasename(archivePath, expectedBasename) {
  const entries = await readZipCentralDirectory(archivePath);
  const target = basename(expectedBasename);
  const matches = entries.filter(
    (entry) =>
      !entry.fileName.endsWith('/') &&
      zipEntryBasename(entry.fileName) === target,
  );

  if (matches.length === 0) {
    throw new Error(
      `source archive does not contain expected file: ${target}`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `source archive contains duplicate basenames for expected file: ${target}`,
    );
  }

  return matches[0];
}

async function sha256ZipEntry(archivePath, entry) {
  if ((entry.flags & 0x0001) !== 0) {
    throw new Error('encrypted ZIP entries are not supported');
  }

  const localHeader = await readFileRange(
    archivePath,
    entry.localHeaderOffset,
    30,
  );
  if (
    localHeader.readUInt32LE(0) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE
  ) {
    throw new Error('invalid ZIP local-file-header signature');
  }

  const localFlags = localHeader.readUInt16LE(6);
  const localCompressionMethod = localHeader.readUInt16LE(8);
  const fileNameLength = localHeader.readUInt16LE(26);
  const extraLength = localHeader.readUInt16LE(28);

  if ((localFlags & 0x0001) !== 0) {
    throw new Error('encrypted ZIP entries are not supported');
  }
  if (localCompressionMethod !== entry.compressionMethod) {
    throw new Error('ZIP compression method mismatch');
  }

  const dataStart =
    entry.localHeaderOffset + 30 + fileNameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize - 1;
  const hash = createHash('sha256');
  let uncompressedBytes = 0;

  if (entry.compressedSize === 0) {
    if (entry.uncompressedSize !== 0) {
      throw new Error('ZIP entry has inconsistent empty compressed payload');
    }
    return hash.digest('hex');
  }

  const input = createReadStream(archivePath, {
    start: dataStart,
    end: dataEnd,
  });

  let contentStream;
  if (entry.compressionMethod === 0) {
    contentStream = input;
  } else if (entry.compressionMethod === 8) {
    contentStream = input.pipe(createInflateRaw());
  } else {
    input.destroy();
    throw new Error(
      `unsupported ZIP compression method: ${entry.compressionMethod}`,
    );
  }

  for await (const chunk of contentStream) {
    hash.update(chunk);
    uncompressedBytes += chunk.length;
  }

  if (uncompressedBytes !== entry.uncompressedSize) {
    throw new Error(
      `ZIP entry size mismatch: expected ${entry.uncompressedSize}, got ${uncompressedBytes}`,
    );
  }

  return hash.digest('hex');
}

export async function verifyExtractedFileBelongsToArchive(
  archivePath,
  extractedFilePath,
) {
  const entry = await findZipEntryByBasename(
    archivePath,
    basename(extractedFilePath),
  );
  const extractedStat = await fs.stat(extractedFilePath);

  if (extractedStat.size !== entry.uncompressedSize) {
    throw new Error(
      `extracted file size does not match archive entry ${entry.fileName}`,
    );
  }

  const [archiveEntrySha256, extractedFileSha256] = await Promise.all([
    sha256ZipEntry(archivePath, entry),
    sha256File(extractedFilePath),
  ]);

  if (archiveEntrySha256 !== extractedFileSha256) {
    throw new Error(
      `extracted file does not match archive entry ${entry.fileName}`,
    );
  }

  return {
    archiveEntryName: entry.fileName,
    archiveEntrySha256,
    extractedFileSha256,
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

export function canonicalRawRecordPayload(record) {
  if (
    record === null ||
    typeof record !== 'object' ||
    Array.isArray(record)
  ) {
    throw new Error('raw Censo record must be an object');
  }

  const entries = Object.entries(record);
  for (const [key, value] of entries) {
    if (typeof value !== 'string') {
      throw new Error(
        `raw Censo record value for ${key} must be a string`,
      );
    }
  }

  entries.sort(([left], [right]) =>
    Buffer.compare(
      Buffer.from(left, 'utf8'),
      Buffer.from(right, 'utf8'),
    ),
  );

  return entries
    .map(
      ([key, value]) =>
        `${Buffer.byteLength(key, 'utf8')}:${key}:${Buffer.byteLength(value, 'utf8')}:${value}`,
    )
    .join('\n');
}

export function sha256RawRecord(record) {
  return createHash('sha256')
    .update(canonicalRawRecordPayload(record), 'utf8')
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
    source_record_sha256: sha256RawRecord(rawRecord),
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
  await Promise.all([
    fs.access(options.csvPath),
    fs.access(options.archivePath),
  ]);
  await assertZipSignature(options.archivePath);

  const [archiveSha256, archiveBinding] = await Promise.all([
    sha256File(options.archivePath),
    verifyExtractedFileBelongsToArchive(
      options.archivePath,
      options.csvPath,
    ),
  ]);
  const extractedFileSha256 = archiveBinding.extractedFileSha256;

  const output = createWriteStream(options.outputPath, {
    encoding: 'utf8',
    flags: 'wx',
  });

  let headers = null;
  let delimiter = null;
  let sourceRows = 0;
  let targetRows = 0;
  let replacementCharacterRows = 0;
  let publicDependencyRows = 0;
  let privateRows = 0;
  let activeOperationRows = 0;
  let publicActiveRows = 0;

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

      const isPublicDependency = ['1', '2', '3'].includes(dependency);
      const isActive = operationStatus === '1';

      if (isPublicDependency) publicDependencyRows += 1;
      if (dependency === '4') privateRows += 1;
      if (isActive) activeOperationRows += 1;
      if (isPublicDependency && isActive) publicActiveRows += 1;

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
  const normalizedOutputSha256 = await sha256File(options.outputPath);

  const manifest = {
    contract: 'acheguese.public-education-inep-normalized/1',
    parser_version: PARSER_VERSION,
    generated_at: new Date().toISOString(),
    source: {
      landing_url:
        'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar',
      archive_url: options.archiveUrl,
      archive_file: basename(options.archivePath),
      archive_sha256: archiveSha256,
      archive_entry: archiveBinding.archiveEntryName,
      archive_entry_sha256: archiveBinding.archiveEntrySha256,
      record_hash_contract: RAW_RECORD_HASH_CONTRACT,
      source_year: options.sourceYear,
      landing_page_updated_at: options.sourcePageUpdatedAt,
      extracted_file: basename(options.csvPath),
      extracted_file_sha256: extractedFileSha256,
      file_role: 'school_table',
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
      public_dependency_rows: publicDependencyRows,
      private_dependency_rows: privateRows,
      active_operation_rows: activeOperationRows,
      public_active_rows: publicActiveRows,
    },
    normalized_output: {
      contract: NORMALIZED_OUTPUT_CONTRACT,
      file: basename(options.outputPath),
      sha256: normalizedOutputSha256,
      rows: targetRows,
      raw_record_hash_contract: RAW_RECORD_HASH_CONTRACT,
    },
    safety: {
      calls_supabase: false,
      publishes_records: false,
      private_dependency_code: '4',
      active_operation_status_code: '1',
      staging_quality_gate_required: true,
      official_archive_host_required: true,
      archive_binding_verified: true,
      header_contract_verified: true,
    },
  };

  try {
    await fs.writeFile(
      options.manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx' },
    );
  } catch (error) {
    await fs.rm(options.outputPath, { force: true });
    throw error;
  }

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
      archive_sha256: manifest.source.archive_sha256,
      extracted_file_sha256: manifest.source.extracted_file_sha256,
      normalized_output_sha256: manifest.normalized_output.sha256,
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

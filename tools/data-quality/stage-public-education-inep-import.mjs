#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, promises as fs, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import pg from 'pg';

import {
  PARSER_VERSION,
  RAW_RECORD_HASH_CONTRACT,
  sha256File,
  sha256RawRecord,
} from './prepare-public-education-inep-import.mjs';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const LINKED_CONFIG = resolve(ROOT, 'supabase/config.toml');
const DEFAULT_ENV_FILES = ['.env.local', '.env.remote', '.env.test', '.env'];
const APPROVAL_ENV = 'PUBLIC_EDUCATION_INEP_IMPORT_APPROVED';
const MAX_STAGE_ROWS = 250;
const MAX_STAGE_BYTES = 4_000_000;

function usage() {
  return [
    'Usage:',
    '  node tools/data-quality/stage-public-education-inep-import.mjs',
    '    --manifest <manifest.json>',
    '    --jsonl <normalized.jsonl>',
    '    [--plan-output <plan.json>]',
    '    [--commit-staging]',
    '',
    'Without --commit-staging this command performs offline validation only.',
    `With --commit-staging it requires ${APPROVAL_ENV}=true and a SUPABASE_DB_URL`,
    'that proves the same project_ref linked in supabase/config.toml.',
    '',
    'This command writes only private Education staging and never materializes Profile,',
    'Business or Education records.',
  ].join('\n');
}

export function parseStageArgs(argv) {
  const result = {
    manifestPath: null,
    jsonlPath: null,
    planOutputPath: null,
    commitStaging: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--commit-staging') {
      result.commitStaging = true;
      continue;
    }

    if (!token.startsWith('--')) {
      throw new Error(`unexpected argument: ${token}\n\n${usage()}`);
    }

    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`missing value for ${token}\n\n${usage()}`);
    }

    if (token === '--manifest') result.manifestPath = resolve(value);
    else if (token === '--jsonl') result.jsonlPath = resolve(value);
    else if (token === '--plan-output') result.planOutputPath = resolve(value);
    else throw new Error(`unknown option: ${token}\n\n${usage()}`);

    index += 1;
  }

  if (!result.manifestPath || !result.jsonlPath) {
    throw new Error(`--manifest and --jsonl are required\n\n${usage()}`);
  }

  return result;
}

function assertObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value;
}

function assertSha256(value, label) {
  if (!/^[0-9a-f]{64}$/.test(String(value ?? '').trim().toLowerCase())) {
    throw new Error(`${label} must be a SHA-256 hex string`);
  }
}

function assertOfficialUrl(value, pattern, label) {
  const text = String(value ?? '').trim();
  if (!pattern.test(text)) {
    throw new Error(`${label} is not an allowed official INEP URL`);
  }
}

export function validateInepImportManifest(input) {
  const manifest = assertObject(input, 'manifest');
  const source = assertObject(manifest.source, 'manifest.source');
  const target = assertObject(manifest.target, 'manifest.target');
  const counts = assertObject(manifest.counts, 'manifest.counts');
  const safety = assertObject(manifest.safety, 'manifest.safety');

  if (manifest.contract !== 'acheguese.public-education-inep-normalized/1') {
    throw new Error('manifest contract mismatch');
  }
  if (manifest.parser_version !== PARSER_VERSION) {
    throw new Error(
      `manifest parser_version must be ${PARSER_VERSION}`,
    );
  }
  if (source.record_hash_contract !== RAW_RECORD_HASH_CONTRACT) {
    throw new Error('manifest raw-record hash contract mismatch');
  }

  assertOfficialUrl(
    source.landing_url,
    /^https:\/\/www\.gov\.br\/inep\//i,
    'manifest.source.landing_url',
  );
  assertOfficialUrl(
    source.archive_url,
    /^https:\/\/download\.inep\.gov\.br\/.+\.zip(?:[?#].*)?$/i,
    'manifest.source.archive_url',
  );
  assertSha256(source.archive_sha256, 'manifest.source.archive_sha256');
  assertSha256(
    source.archive_entry_sha256,
    'manifest.source.archive_entry_sha256',
  );
  assertSha256(
    source.extracted_file_sha256,
    'manifest.source.extracted_file_sha256',
  );

  if (
    String(source.archive_entry_sha256).toLowerCase() !==
    String(source.extracted_file_sha256).toLowerCase()
  ) {
    throw new Error('manifest archive entry and extracted file hashes differ');
  }

  const extractedFile = String(source.extracted_file ?? '').trim();
  const archiveEntry = String(source.archive_entry ?? '').trim();
  if (!extractedFile || !archiveEntry) {
    throw new Error('manifest source file binding is incomplete');
  }
  if (basename(archiveEntry.replace(/\\/g, '/')) !== extractedFile) {
    throw new Error('manifest archive entry basename mismatch');
  }
  if (source.file_role !== 'school_table') {
    throw new Error('manifest source.file_role must be school_table');
  }

  const sourceYear = Number(source.source_year);
  if (!Number.isInteger(sourceYear) || sourceYear < 2007 || sourceYear > 2100) {
    throw new Error('manifest source.source_year is invalid');
  }

  const municipalityIbge = String(target.municipality_ibge_code ?? '');
  const ufIbge = String(target.uf_ibge_code ?? '');
  if (!/^[0-9]{7}$/.test(municipalityIbge)) {
    throw new Error('manifest target municipality IBGE code is invalid');
  }
  if (ufIbge !== municipalityIbge.slice(0, 2)) {
    throw new Error('manifest target UF does not match municipality');
  }

  const targetRows = Number(counts.target_municipality_rows);
  const sourceRows = Number(counts.source_rows);
  if (!Number.isInteger(targetRows) || targetRows < 1 || targetRows > 999_999_999) {
    throw new Error('manifest target_municipality_rows must be a positive integer');
  }
  if (!Number.isInteger(sourceRows) || sourceRows < targetRows) {
    throw new Error('manifest source_rows is smaller than target_municipality_rows');
  }

  for (const flag of [
    'staging_quality_gate_required',
    'official_archive_host_required',
    'archive_binding_verified',
    'header_contract_verified',
  ]) {
    if (safety[flag] !== true) {
      throw new Error(`manifest safety.${flag} must be true`);
    }
  }
  if (safety.calls_supabase !== false || safety.publishes_records !== false) {
    throw new Error('manifest safety mutation flags are invalid');
  }

  return {
    manifest,
    source,
    target,
    counts,
    targetRows,
    municipalityIbge,
    sourceYear,
  };
}

export function validateNormalizedInepRow(row, manifestSummary) {
  assertObject(row, 'normalized row');
  const rawRecord = assertObject(row.raw_record, 'normalized row.raw_record');

  for (const [key, value] of Object.entries(rawRecord)) {
    if (typeof value !== 'string') {
      throw new Error(`raw_record value for ${key} must be a string`);
    }
  }

  const rowNumber = Number(row.source_row_number);
  if (!Number.isInteger(rowNumber) || rowNumber < 1 || rowNumber > 999_999_999) {
    throw new Error('normalized row source_row_number is invalid');
  }

  if (
    String(row.municipality_ibge_code ?? '') !==
    manifestSummary.municipalityIbge
  ) {
    throw new Error(
      `row ${rowNumber} municipality does not match manifest target`,
    );
  }

  const declaredHash = String(row.source_record_sha256 ?? '')
    .trim()
    .toLowerCase();
  assertSha256(declaredHash, `row ${rowNumber} source_record_sha256`);

  const calculatedHash = sha256RawRecord(rawRecord);
  if (declaredHash !== calculatedHash) {
    throw new Error(
      `row ${rowNumber} source_record_sha256 does not match raw_record`,
    );
  }

  return rowNumber;
}

async function* readJsonLines(filePath) {
  const input = createReadStream(filePath, { encoding: 'utf8' });
  const lines = createInterface({ input, crlfDelay: Infinity });
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber += 1;
    if (!line.trim()) {
      throw new Error(`blank JSONL record at line ${lineNumber}`);
    }

    let row;
    try {
      row = JSON.parse(line);
    } catch {
      throw new Error(`invalid JSON at JSONL line ${lineNumber}`);
    }

    yield { row, lineNumber };
  }
}

export async function validateNormalizedJsonl(jsonlPath, manifestSummary) {
  await fs.access(jsonlPath);
  const seenSourceRows = new Set();
  let rowCount = 0;

  for await (const { row, lineNumber } of readJsonLines(jsonlPath)) {
    const sourceRowNumber = validateNormalizedInepRow(row, manifestSummary);
    if (seenSourceRows.has(sourceRowNumber)) {
      throw new Error(
        `duplicate source_row_number ${sourceRowNumber} at JSONL line ${lineNumber}`,
      );
    }
    seenSourceRows.add(sourceRowNumber);
    rowCount += 1;
  }

  if (rowCount !== manifestSummary.targetRows) {
    throw new Error(
      `JSONL row count mismatch: manifest=${manifestSummary.targetRows} jsonl=${rowCount}`,
    );
  }

  return {
    rowCount,
    jsonlSha256: await sha256File(jsonlPath),
  };
}

function loadEnv() {
  for (const file of DEFAULT_ENV_FILES) {
    dotenv.config({ path: resolve(ROOT, file), override: false });
  }
}

function linkedProjectRef() {
  if (!existsSync(LINKED_CONFIG)) {
    throw new Error(`required file not found: ${LINKED_CONFIG}`);
  }
  const config = readFileSync(LINKED_CONFIG, 'utf8');
  const match = config.match(/^project_id\s*=\s*["']([^"']+)["']/m);
  if (!match?.[1]) {
    throw new Error('linked Supabase project_id is missing');
  }
  return match[1].trim();
}

export function extractSupabaseProjectRefFromDatabaseUrl(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    return null;
  }

  const direct = url.hostname
    .toLowerCase()
    .match(/^db\.([a-z0-9-]+)\.supabase\.co$/)?.[1];
  if (direct) return direct;

  const username = decodeURIComponent(url.username || '');
  return username.match(/^postgres\.([a-z0-9-]+)$/i)?.[1]?.toLowerCase() ?? null;
}

function getApprovedDatabaseUrl() {
  loadEnv();
  const connectionString = process.env.SUPABASE_DB_URL?.trim();
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL is required for --commit-staging');
  }

  if (String(process.env[APPROVAL_ENV] ?? '').trim().toLowerCase() !== 'true') {
    throw new Error(`${APPROVAL_ENV}=true is required for --commit-staging`);
  }

  const targetRef = extractSupabaseProjectRefFromDatabaseUrl(connectionString);
  const linkedRef = linkedProjectRef();

  if (!targetRef || targetRef !== linkedRef) {
    throw new Error(
      `database target mismatch: expected linked project ${linkedRef}, got ${targetRef ?? 'unproven'}`,
    );
  }

  return connectionString;
}

function redact(value, secret) {
  if (!secret) return value;
  return String(value).split(secret).join('[REDACTED_DB_URL]');
}

async function resolveTargetCity(client, municipalityIbge) {
  const result = await client.query(
    `select id
       from public.locations
      where type = 'city'
        and status = 'active'
        and metadata->>'ibge_code' = $1
      order by id
      limit 2`,
    [municipalityIbge],
  );

  if (result.rows.length !== 1) {
    throw new Error(
      `canonical target city resolution expected 1 row, got ${result.rows.length}`,
    );
  }

  return result.rows[0].id;
}

async function createBatch(client, manifestSummary, targetCityId) {
  const { manifest, source, sourceYear } = manifestSummary;
  const result = await client.query(
    `select private.create_public_education_import_batch(
       $1::integer,$2::text,$3::text,$4::text,$5::text,
       $6::timestamptz,$7::uuid,$8::text,$9::jsonb
     ) as result`,
    [
      sourceYear,
      source.landing_url,
      source.archive_url,
      source.archive_sha256,
      source.extracted_file,
      source.landing_page_updated_at ?? null,
      targetCityId,
      manifest.parser_version,
      JSON.stringify(manifest),
    ],
  );

  return result.rows[0]?.result;
}

async function flushStageChunk(client, batchId, chunk) {
  if (chunk.length === 0) return;
  await client.query(
    `select private.stage_public_education_import_rows(
       $1::uuid,$2::jsonb
     ) as result`,
    [batchId, JSON.stringify(chunk)],
  );
}

async function stageJsonl(client, batchId, jsonlPath, manifestSummary) {
  let chunk = [];
  let chunkBytes = 2;
  let stagedRows = 0;

  for await (const { row } of readJsonLines(jsonlPath)) {
    validateNormalizedInepRow(row, manifestSummary);
    const serialized = JSON.stringify(row);
    const rowBytes = Buffer.byteLength(serialized, 'utf8') + 1;

    if (rowBytes > MAX_STAGE_BYTES) {
      throw new Error(
        `source row ${row.source_row_number} exceeds staging payload bound`,
      );
    }

    if (
      chunk.length > 0 &&
      (chunk.length >= MAX_STAGE_ROWS ||
        chunkBytes + rowBytes > MAX_STAGE_BYTES)
    ) {
      await flushStageChunk(client, batchId, chunk);
      stagedRows += chunk.length;
      chunk = [];
      chunkBytes = 2;
    }

    chunk.push(row);
    chunkBytes += rowBytes;
  }

  if (chunk.length > 0) {
    await flushStageChunk(client, batchId, chunk);
    stagedRows += chunk.length;
  }

  return stagedRows;
}

function summarizePlan(rows) {
  const counts = {};
  const reasonCounts = {};

  for (const row of rows) {
    const status = String(row.plan_status ?? 'unknown');
    counts[status] = (counts[status] ?? 0) + 1;

    for (const reason of row.reason_codes ?? []) {
      reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
    }
  }

  return { counts, reasonCounts };
}

async function persistStaging({
  manifestSummary,
  jsonlPath,
  jsonlSha256,
  planOutputPath,
}) {
  const connectionString = getApprovedDatabaseUrl();
  const client = new Client({
    connectionString,
    ssl: true,
    connectionTimeoutMillis: 15_000,
  });

  try {
    await client.connect();
    await client.query('begin');
    await client.query("set local lock_timeout = '5s'");
    await client.query("set local statement_timeout = '60s'");
    await client.query('set local role service_role');

    const targetCityId = await resolveTargetCity(
      client,
      manifestSummary.municipalityIbge,
    );
    const batch = await createBatch(client, manifestSummary, targetCityId);

    if (!batch?.batch_id || !batch?.status) {
      throw new Error('create_public_education_import_batch returned invalid result');
    }

    let validation = null;
    let planRows = [];
    let invalidRows = [];

    if (batch.idempotent === true && batch.status !== 'staging') {
      if (batch.status !== 'validated') {
        throw new Error(
          `existing idempotent batch is ${batch.status}; refusing automatic mutation`,
        );
      }
    } else {
      if (batch.idempotent === true) {
        throw new Error(
          'existing staging batch requires manual review before resume',
        );
      }

      const stagedRows = await stageJsonl(
        client,
        batch.batch_id,
        jsonlPath,
        manifestSummary,
      );
      if (stagedRows !== manifestSummary.targetRows) {
        throw new Error(
          `staged row count mismatch before validator: expected=${manifestSummary.targetRows} staged=${stagedRows}`,
        );
      }

      const hashAfterStage = await sha256File(jsonlPath);
      if (hashAfterStage !== jsonlSha256) {
        throw new Error('JSONL changed between offline validation and staging');
      }

      const result = await client.query(
        'select private.validate_public_education_import_batch($1::uuid) as result',
        [batch.batch_id],
      );
      validation = result.rows[0]?.result ?? null;

      if (validation?.status === 'rejected') {
        const invalid = await client.query(
          `select source_row_number, inep_code, validation_errors
             from private.education_public_import_rows
            where batch_id = $1::uuid
              and validation_status = 'invalid'
            order by source_row_number
            limit 50`,
          [batch.batch_id],
        );
        invalidRows = invalid.rows;
      }
    }

    const effectiveStatus = validation?.status ?? batch.status;
    if (effectiveStatus === 'validated') {
      const planned = await client.query(
        'select * from private.plan_public_education_import_batch($1::uuid)',
        [batch.batch_id],
      );
      planRows = planned.rows;
    }

    await client.query('commit');

    let planOutputWritten = false;
    let planOutputError = null;

    if (planOutputPath && planRows.length > 0) {
      try {
        await fs.writeFile(
          planOutputPath,
          `${JSON.stringify(
            {
              contract: 'acheguese.public-education-inep-plan/1',
              batch_id: batch.batch_id,
              generated_at: new Date().toISOString(),
              summary: summarizePlan(planRows),
              rows: planRows,
            },
            null,
            2,
          )}\n`,
          { encoding: 'utf8', flag: 'wx' },
        );
        planOutputWritten = true;
      } catch (error) {
        planOutputError =
          error instanceof Error ? error.message : String(error);
      }
    }

    return {
      batch_id: batch.batch_id,
      idempotent: batch.idempotent === true,
      status: effectiveStatus,
      validation,
      planSummary: summarizePlan(planRows),
      invalidRows,
      planOutputWritten,
      planOutputError,
    };
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw new Error(
      redact(error instanceof Error ? error.message : String(error), connectionString),
    );
  } finally {
    await client.end().catch(() => {});
  }
}

export async function runPublicEducationInepStager(options) {
  const manifest = JSON.parse(await fs.readFile(options.manifestPath, 'utf8'));
  const manifestSummary = validateInepImportManifest(manifest);

  if (
    basename(options.jsonlPath) === basename(options.manifestPath)
  ) {
    throw new Error('manifest and JSONL paths must be different files');
  }

  const local = await validateNormalizedJsonl(
    options.jsonlPath,
    manifestSummary,
  );

  if (
    options.planOutputPath &&
    existsSync(options.planOutputPath)
  ) {
    throw new Error(
      `plan output already exists: ${options.planOutputPath}`,
    );
  }

  if (!options.commitStaging) {
    return {
      ok: true,
      mode: 'dry-run',
      parser_version: PARSER_VERSION,
      record_hash_contract: RAW_RECORD_HASH_CONTRACT,
      target_municipality_ibge_code: manifestSummary.municipalityIbge,
      rows: local.rowCount,
      jsonl_sha256: local.jsonlSha256,
      writes_database: false,
      materializes_records: false,
    };
  }

  const persisted = await persistStaging({
    manifestSummary,
    jsonlPath: options.jsonlPath,
    jsonlSha256: local.jsonlSha256,
    planOutputPath: options.planOutputPath,
  });

  return {
    ok: persisted.status === 'validated',
    mode: 'commit-staging',
    parser_version: PARSER_VERSION,
    record_hash_contract: RAW_RECORD_HASH_CONTRACT,
    target_municipality_ibge_code: manifestSummary.municipalityIbge,
    rows: local.rowCount,
    jsonl_sha256: local.jsonlSha256,
    writes_database: true,
    materializes_records: false,
    ...persisted,
  };
}

async function main() {
  const options = parseStageArgs(process.argv.slice(2));
  const result = await runPublicEducationInepStager(options);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.ok && result.mode === 'commit-staging') {
    process.exitCode = 2;
  }
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

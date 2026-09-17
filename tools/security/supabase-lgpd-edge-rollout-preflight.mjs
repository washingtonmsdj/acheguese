#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ISSUE_URL = 'https://github.com/washingtonmsdj/acheguese/issues/68';
const EXPORT_MATRIX_PATH = join(
  process.cwd(),
  'docs',
  '09-reference',
  'governance',
  'privacy',
  'LGPD_EXPORT_MATRIX.json',
);
const PURGE_MATRIX_PATH = join(
  process.cwd(),
  'docs',
  '09-reference',
  'governance',
  'privacy',
  'LGPD_PURGE_MATRIX.json',
);
const EXPORT_MATRIX_SCHEMA_VERSION = 'lgpd-export-matrix/v1';
const PURGE_MATRIX_SCHEMA_VERSION = 'lgpd-purge-matrix/v1';

const BLOCKED_FUNCTIONS = Object.freeze({
  'user-delete-account': Object.freeze({
    reason: 'account deletion handler still depends on removed/legacy schema or purge retention has not been certified',
    markers: Object.freeze([
      ".from('user_deletion_schedule')",
      ".eq('owner_id', userId)",
      ".eq('passenger_id', userId)",
      'deleted_at: new Date().toISOString()',
      'document_number: null',
      'granted: false',
      'is_valid: false',
      "revoke_reason: 'Account deletion'",
    ]),
    requiredMarkers: Object.freeze([
      'const LGPD_PURGE_IMPLEMENTATION_COMPLETE = true;',
    ]),
    requiresExportMatrix: false,
    requiresPurgeMatrix: true,
  }),
  'user-export-data': Object.freeze({
    reason: 'LGPD export handler still has stale/unsafe export behavior or has not certified the canonical export matrix',
    markers: Object.freeze([
      ".eq('owner_id', userId)",
      ".eq('passenger_id', userId)",
      ".from('user_sessions')",
      ".eq('organizer_id', userId)",
      ".from('application_logs')",
      'app_metadata:',
      'identity_data:',
      ".select('*')",
      ".select('*,",
      '.select("*")',
      '.select("*,',
    ]),
    requiredMarkers: Object.freeze([
      'const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = true;',
    ]),
    requiresExportMatrix: true,
    requiresPurgeMatrix: false,
  }),
});

function usage() {
  return [
    'Uso:',
    '  node tools/security/supabase-lgpd-edge-rollout-preflight.mjs --function user-delete-account',
    '  node tools/security/supabase-lgpd-edge-rollout-preflight.mjs --function user-export-data --json',
    '',
    'Este preflight existe para impedir rollout acidental dos handlers LGPD stale ou incompletos.',
    `Autoridade do bloqueio: ${ISSUE_URL}`,
  ].join('\n');
}

function parseArgs(argv) {
  let functionName;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--function') {
      functionName = argv[index + 1]?.trim();
      if (!functionName) throw new Error('Use --function <slug>.');
      index += 1;
      continue;
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (!functionName) throw new Error('O argumento --function e obrigatorio.');
  if (!Object.hasOwn(BLOCKED_FUNCTIONS, functionName)) {
    throw new Error(
      `Funcao fora do escopo deste preflight: ${functionName}. ` +
      'Use este gate somente para os handlers LGPD explicitamente bloqueados.',
    );
  }

  return { functionName, json };
}

function inspectExportMatrix() {
  if (!existsSync(EXPORT_MATRIX_PATH)) {
    return {
      ready: false,
      reason: 'matriz canonica de exportacao ausente',
    };
  }

  try {
    const matrix = JSON.parse(readFileSync(EXPORT_MATRIX_PATH, 'utf8'));
    const valid =
      matrix?.schemaVersion === EXPORT_MATRIX_SCHEMA_VERSION &&
      matrix?.rules?.default === 'exclude' &&
      matrix?.rules?.selectStarForbidden === true &&
      matrix?.rules?.sharedRowsRequireRedaction === true &&
      matrix?.rules?.requiredQueryFailure === 'fail-closed';

    return {
      ready: valid,
      reason: valid ? null : 'matriz canonica de exportacao invalida ou enfraquecida',
    };
  } catch {
    return {
      ready: false,
      reason: 'matriz canonica de exportacao contem JSON invalido',
    };
  }
}

function inspectPurgeMatrix() {
  if (!existsSync(PURGE_MATRIX_PATH)) {
    return {
      ready: false,
      reason: 'matriz canonica de purge ausente',
      unresolvedReferences: null,
    };
  }

  try {
    const matrix = JSON.parse(readFileSync(PURGE_MATRIX_PATH, 'utf8'));
    const references = Array.isArray(matrix?.blockingReferences)
      ? matrix.blockingReferences
      : [];
    const unresolvedReferences = references.filter(
      (reference) => reference?.decision === 'unclassified',
    ).length;
    const structurallyValid =
      matrix?.schemaVersion === PURGE_MATRIX_SCHEMA_VERSION &&
      matrix?.rules?.default === 'block' &&
      matrix?.rules?.unclassifiedReference === 'block' &&
      matrix?.rules?.authUserDeleteRequiresZeroUnclassifiedReferences === true &&
      matrix?.rules?.profileDeleteRequiresZeroUnclassifiedReferences === true &&
      references.length > 0;
    const ready =
      structurallyValid &&
      matrix?.implementationComplete === true &&
      unresolvedReferences === 0;

    return {
      ready,
      reason: ready
        ? null
        : structurallyValid
          ? 'matriz canonica de purge ainda possui referencias sem decisao ou implementationComplete=false'
          : 'matriz canonica de purge invalida ou enfraquecida',
      unresolvedReferences,
    };
  } catch {
    return {
      ready: false,
      reason: 'matriz canonica de purge contem JSON invalido',
      unresolvedReferences: null,
    };
  }
}

function inspectFunction(functionName) {
  const policy = BLOCKED_FUNCTIONS[functionName];
  const path = join(process.cwd(), 'supabase', 'functions', functionName, 'index.ts');
  if (!existsSync(path)) {
    return {
      function: functionName,
      ready: false,
      reason: 'source ausente',
      issue: ISSUE_URL,
      staleMarkers: [],
      missingMarkers: [...policy.requiredMarkers],
      exportMatrixReady: policy.requiresExportMatrix ? false : null,
      purgeMatrixReady: policy.requiresPurgeMatrix ? false : null,
      unresolvedPurgeReferences: policy.requiresPurgeMatrix ? null : undefined,
    };
  }

  const source = readFileSync(path, 'utf8');
  const staleMarkers = policy.markers.filter((marker) => source.includes(marker));
  const missingMarkers = policy.requiredMarkers.filter((marker) => !source.includes(marker));
  const exportMatrix = policy.requiresExportMatrix
    ? inspectExportMatrix()
    : { ready: true, reason: null };
  const purgeMatrix = policy.requiresPurgeMatrix
    ? inspectPurgeMatrix()
    : { ready: true, reason: null, unresolvedReferences: null };
  const ready =
    staleMarkers.length === 0 &&
    missingMarkers.length === 0 &&
    exportMatrix.ready &&
    purgeMatrix.ready;

  return {
    function: functionName,
    ready,
    reason: ready
      ? null
      : purgeMatrix.reason ?? exportMatrix.reason ?? policy.reason,
    issue: ISSUE_URL,
    staleMarkers,
    missingMarkers,
    exportMatrixReady: policy.requiresExportMatrix ? exportMatrix.ready : null,
    purgeMatrixReady: policy.requiresPurgeMatrix ? purgeMatrix.ready : null,
    unresolvedPurgeReferences: policy.requiresPurgeMatrix
      ? purgeMatrix.unresolvedReferences
      : null,
  };
}

function printStatus(status, json) {
  if (json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (status.ready) {
    console.log(`LGPD_EDGE_ROLLOUT_READY ${status.function}`);
    return;
  }

  console.error(`LGPD_EDGE_ROLLOUT_BLOCKED ${status.function}`);
  console.error(`Motivo: ${status.reason}`);
  console.error(`Issue: ${status.issue}`);
  if (status.staleMarkers.length > 0) {
    console.error(`Marcadores stale: ${status.staleMarkers.join(', ')}`);
  }
  if (status.missingMarkers.length > 0) {
    console.error(`Marcadores obrigatorios ausentes: ${status.missingMarkers.join(', ')}`);
  }
  if (status.exportMatrixReady === false) {
    console.error('Matriz de exportacao: INVALIDA/AUSENTE');
  }
  if (status.purgeMatrixReady === false) {
    console.error('Matriz de purge: INCOMPLETA/INVALIDA');
    if (status.unresolvedPurgeReferences !== null) {
      console.error(`Referencias de purge sem decisao: ${status.unresolvedPurgeReferences}`);
    }
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  const status = inspectFunction(options.functionName);
  printStatus(status, options.json);
  if (!status.ready) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.message : 'Falha desconhecida no preflight LGPD.';
  console.error(`LGPD_EDGE_ROLLOUT_ERROR: ${message}`);
  process.exitCode = 1;
}

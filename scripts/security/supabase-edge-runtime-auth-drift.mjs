#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_TOKEN_ENV_NAMES = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_MANAGEMENT_API_TOKEN',
];

const CONFIG_PATH = join(process.cwd(), 'supabase', 'config.toml');
const AUTH_POLICY_PATH = join(
  process.cwd(),
  'docs',
  '09-reference',
  'governance',
  'security',
  'EDGE_FUNCTION_AUTH_POLICY.json',
);

function usage() {
  return [
    'Uso:',
    '  node scripts/security/supabase-edge-runtime-auth-drift.mjs',
    '  node scripts/security/supabase-edge-runtime-auth-drift.mjs --json',
    '  node scripts/security/supabase-edge-runtime-auth-drift.mjs --strict-existence',
    '',
    'Opcoes:',
    '  --project-ref <ref>     Project ref esperado; deve coincidir com supabase/config.toml.',
    '  --token-env <name>      Le o PAT Supabase da env var indicada.',
    '  --strict-existence      Tambem falha se uma funcao configurada nao estiver implantada.',
    '  --json                  Imprime o relatorio em JSON.',
    '',
    'O preflight usa `supabase functions list --output json` e nunca imprime o token.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    projectRef: undefined,
    tokenEnv: undefined,
    strictExistence: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--project-ref') {
      const value = argv[index + 1]?.trim();
      if (!value) throw new Error('Use --project-ref <ref>.');
      options.projectRef = value;
      index += 1;
      continue;
    }

    if (arg === '--token-env') {
      const value = argv[index + 1]?.trim();
      if (!value) throw new Error('Use --token-env <nome_da_env>.');
      options.tokenEnv = value;
      index += 1;
      continue;
    }

    if (arg === '--strict-existence') {
      options.strictExistence = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }

    throw new Error(`Argumento desconhecido: ${arg}`);
  }

  return options;
}

function validateProjectRef(projectRef) {
  if (!/^[a-z0-9-]{6,64}$/.test(projectRef)) {
    throw new Error('Project ref invalido.');
  }
}

function validateTokenEnvName(envName) {
  if (!/^[A-Z_][A-Z0-9_]*$/.test(envName)) {
    throw new Error('Nome de env var invalido para token Supabase.');
  }
}

export function parseSupabaseFunctionConfig(configText) {
  const functions = new Map();
  let currentFunction = null;
  let projectRef = null;

  for (const rawLine of configText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const projectMatch = line.match(/^project_id\s*=\s*"([a-z0-9-]+)"$/);
    if (projectMatch) {
      projectRef = projectMatch[1];
      continue;
    }

    const sectionMatch = line.match(/^\[functions\.([a-z0-9-]+)\]$/);
    if (sectionMatch) {
      currentFunction = sectionMatch[1];
      continue;
    }

    if (line.startsWith('[')) {
      currentFunction = null;
      continue;
    }

    if (!currentFunction) continue;
    const jwtMatch = line.match(/^verify_jwt\s*=\s*(true|false)$/);
    if (!jwtMatch) continue;

    functions.set(currentFunction, jwtMatch[1] === 'true');
  }

  if (!projectRef) {
    throw new Error('project_id ausente em supabase/config.toml.');
  }

  return { projectRef, functions };
}

export function normalizeRemoteFunctions(entries) {
  if (!Array.isArray(entries)) {
    throw new Error('Supabase CLI retornou formato inesperado para functions list.');
  }

  return entries.map((entry, index) => {
    const slug = typeof entry?.slug === 'string'
      ? entry.slug.trim()
      : typeof entry?.name === 'string'
        ? entry.name.trim()
        : '';
    const verifyJwt = typeof entry?.verify_jwt === 'boolean'
      ? entry.verify_jwt
      : typeof entry?.verifyJwt === 'boolean'
        ? entry.verifyJwt
        : undefined;

    if (!slug) {
      throw new Error(`Supabase CLI retornou funcao sem slug no indice ${index}.`);
    }

    return {
      slug,
      verifyJwt,
      version: entry?.version ?? null,
      status: typeof entry?.status === 'string' ? entry.status : null,
    };
  });
}

export function buildRemoteAuthDriftReport({
  configuredFunctions,
  remoteFunctions,
  noJwtAllowlist,
  strictExistence = false,
}) {
  const issues = [];
  const remoteNames = new Set(remoteFunctions.map((entry) => entry.slug));

  for (const remote of remoteFunctions) {
    const expected = configuredFunctions.get(remote.slug);

    if (expected === undefined) {
      issues.push({
        code: 'REMOTE_FUNCTION_WITHOUT_CONFIG',
        function: remote.slug,
        message: `${remote.slug} esta implantada, mas nao possui [functions.${remote.slug}] em supabase/config.toml`,
      });
      continue;
    }

    if (typeof remote.verifyJwt !== 'boolean') {
      issues.push({
        code: 'REMOTE_VERIFY_JWT_UNREADABLE',
        function: remote.slug,
        message: `${remote.slug} nao informou verify_jwt em formato booleano`,
      });
      continue;
    }

    if (remote.verifyJwt !== expected) {
      issues.push({
        code: 'VERIFY_JWT_DRIFT',
        function: remote.slug,
        expected,
        actual: remote.verifyJwt,
        message: `${remote.slug} verify_jwt remoto=${remote.verifyJwt} difere do config=${expected}`,
      });
    }

    if (remote.verifyJwt === false && !Object.hasOwn(noJwtAllowlist, remote.slug)) {
      issues.push({
        code: 'REMOTE_NO_JWT_NOT_ALLOWLISTED',
        function: remote.slug,
        message: `${remote.slug} esta implantada com verify_jwt=false fora da noJwtAllowlist`,
      });
    }
  }

  const configuredNotDeployed = [...configuredFunctions.keys()]
    .filter((slug) => !remoteNames.has(slug))
    .sort();

  if (strictExistence) {
    for (const slug of configuredNotDeployed) {
      issues.push({
        code: 'CONFIGURED_FUNCTION_NOT_DEPLOYED',
        function: slug,
        message: `${slug} esta configurada no Git, mas nao aparece no inventario remoto`,
      });
    }
  }

  return {
    ready: issues.length === 0,
    strictExistence,
    remoteCount: remoteFunctions.length,
    configuredCount: configuredFunctions.size,
    configuredNotDeployed,
    issues,
  };
}

function readJson(path, label) {
  if (!existsSync(path)) throw new Error(`${label} ausente: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`${label} contem JSON invalido: ${path}`);
  }
}

function resolveAccessToken(tokenEnv) {
  const envNames = tokenEnv ? [tokenEnv] : DEFAULT_TOKEN_ENV_NAMES;

  for (const envName of envNames) {
    validateTokenEnvName(envName);
    const token = process.env[envName]?.trim();
    if (token) return { envName, token };
  }

  return { envName: envNames.join(' or '), token: undefined };
}

function listRemoteFunctions(projectRef, accessToken) {
  let stdout;
  try {
    stdout = execFileSync(
      'supabase',
      ['functions', 'list', '--project-ref', projectRef, '--output', 'json'],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          SUPABASE_ACCESS_TOKEN: accessToken,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch {
    throw new Error(
      'Falha ao executar `supabase functions list`. Verifique CLI, autenticacao e permissao de leitura.',
    );
  }

  let entries;
  try {
    entries = JSON.parse(stdout);
  } catch {
    throw new Error('Supabase CLI retornou JSON invalido em functions list.');
  }

  return normalizeRemoteFunctions(entries);
}

function printReport(report, metadata, json) {
  const output = { ...metadata, ...report };
  if (json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  for (const issue of report.issues) {
    console.error(`BLOCKED ${issue.code}: ${issue.message}`);
  }

  if (report.configuredNotDeployed.length > 0 && !report.strictExistence) {
    console.log(
      `INFO configured-not-deployed (${report.configuredNotDeployed.length}): ${report.configuredNotDeployed.join(', ')}`,
    );
  }

  console.log(
    report.ready
      ? 'EDGE_RUNTIME_AUTH_DRIFT_READY'
      : 'EDGE_RUNTIME_AUTH_DRIFT_BLOCKED',
  );
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(CONFIG_PATH)) {
    throw new Error('supabase/config.toml ausente. Execute a partir da raiz do repositorio.');
  }

  const config = parseSupabaseFunctionConfig(readFileSync(CONFIG_PATH, 'utf8'));
  const projectRef = options.projectRef?.trim() || config.projectRef;
  validateProjectRef(projectRef);
  if (projectRef !== config.projectRef) {
    throw new Error(
      `Project ref recusado: ${projectRef} difere do project_id versionado ${config.projectRef}.`,
    );
  }

  const policy = readJson(AUTH_POLICY_PATH, 'EDGE_FUNCTION_AUTH_POLICY.json');
  if (!policy.noJwtAllowlist || typeof policy.noJwtAllowlist !== 'object') {
    throw new Error('EDGE_FUNCTION_AUTH_POLICY.json sem noJwtAllowlist valida.');
  }

  const token = resolveAccessToken(options.tokenEnv);
  if (!token.token) {
    throw new Error(
      `Token Supabase ausente. Defina ${token.envName.replace(' or ', ' ou ')} com permissao para listar Edge Functions.`,
    );
  }

  const remoteFunctions = listRemoteFunctions(projectRef, token.token);
  const report = buildRemoteAuthDriftReport({
    configuredFunctions: config.functions,
    remoteFunctions,
    noJwtAllowlist: policy.noJwtAllowlist,
    strictExistence: options.strictExistence,
  });

  printReport(
    report,
    {
      checkedAt: new Date().toISOString(),
      projectRef,
      tokenEnv: token.envName,
    },
    options.json,
  );

  if (!report.ready) process.exitCode = 1;
}

const invokedAsScript = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (invokedAsScript) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida no Edge runtime auth drift preflight.';
    console.error(`EDGE_RUNTIME_AUTH_DRIFT_ERROR: ${message}`);
    process.exitCode = 1;
  }
}

#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_TOKEN_ENV_NAMES = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_MANAGEMENT_API_TOKEN',
];

const FUNCTION_SECRET_REQUIREMENTS = Object.freeze({
  'get-push-config': Object.freeze([
    'ALLOWED_ORIGINS',
  ]),
  'nominatim-proxy': Object.freeze([
    'ALLOWED_ORIGINS',
  ]),
  'media-assets-cleanup': Object.freeze([
    'ALLOWED_ORIGINS',
    'CRON_SECRET',
  ]),
  'process-timeouts': Object.freeze([
    'ALLOWED_ORIGINS',
    'CRON_SECRET',
  ]),
  'auto-dispatch-ride': Object.freeze([
    'ALLOWED_ORIGINS',
    'CRON_SECRET',
  ]),
  'territory-ai-content': Object.freeze([
    'ALLOWED_ORIGINS',
    'LOVABLE_API_KEY',
  ]),
});

function usage() {
  return [
    'Uso:',
    '  node scripts/security/supabase-edge-secrets-preflight.mjs',
    '  node scripts/security/supabase-edge-secrets-preflight.mjs --function get-push-config',
    '  node scripts/security/supabase-edge-secrets-preflight.mjs --function media-assets-cleanup --json',
    '',
    'Opcoes:',
    '  --function <slug>      Valida uma funcao suportada. Pode ser repetido.',
    '  --project-ref <ref>    Usa um project ref especifico.',
    '  --token-env <name>     Le o token da env var especificada.',
    '  --json                 Imprime somente status e nomes de configuracao.',
    '',
    'O preflight usa `supabase secrets list --output json`.',
    'O CLI oficial retorna NAME + DIGEST; este script ignora o digest e usa apenas NAME.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    functions: [],
    json: false,
    projectRef: undefined,
    tokenEnv: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--function') {
      const value = argv[index + 1]?.trim();
      if (!value) throw new Error('Use --function <slug>.');
      if (!Object.hasOwn(FUNCTION_SECRET_REQUIREMENTS, value)) {
        throw new Error(`Funcao nao suportada: ${value}.`);
      }
      options.functions.push(value);
      index += 1;
      continue;
    }

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

  if (options.functions.length === 0) {
    options.functions = Object.keys(FUNCTION_SECRET_REQUIREMENTS);
  } else {
    options.functions = [...new Set(options.functions)];
  }

  return options;
}

function validateProjectRef(projectRef) {
  if (!/^[a-z0-9-]{6,64}$/.test(projectRef)) {
    throw new Error('Project ref invalido. Use apenas letras minusculas, numeros e hifen.');
  }
}

function validateTokenEnvName(envName) {
  if (!/^[A-Z_][A-Z0-9_]*$/.test(envName)) {
    throw new Error('Nome de env var invalido para token Supabase.');
  }
}

function readLinkedProjectRef() {
  const path = join(process.cwd(), 'supabase', '.temp', 'project-ref');
  if (!existsSync(path)) return undefined;
  const value = readFileSync(path, 'utf8').trim();
  return value || undefined;
}

function resolveProjectRef(explicitProjectRef) {
  const projectRef = (
    explicitProjectRef ||
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    readLinkedProjectRef()
  );

  if (projectRef) validateProjectRef(projectRef);
  return projectRef;
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

function listRemoteSecretNames(projectRef, accessToken) {
  let stdout;
  try {
    stdout = execFileSync(
      'supabase',
      ['secrets', 'list', '--project-ref', projectRef, '--output', 'json'],
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
      'Falha ao executar `supabase secrets list`. Verifique CLI instalado, autenticacao e permissao de leitura de secrets.',
    );
  }

  let entries;
  try {
    entries = JSON.parse(stdout);
  } catch {
    throw new Error('Supabase CLI retornou JSON invalido ao listar Edge Function secrets.');
  }

  if (!Array.isArray(entries)) {
    throw new Error('Supabase CLI retornou formato inesperado ao listar Edge Function secrets.');
  }

  return new Set(
    entries
      .map((entry) => (entry && typeof entry.name === 'string' ? entry.name.trim() : ''))
      .filter(Boolean),
  );
}

function buildStatus(projectRef, tokenEnv, functions, remoteNames) {
  const checks = functions.map((slug) => {
    const required = [...FUNCTION_SECRET_REQUIREMENTS[slug]];
    const present = required.filter((name) => remoteNames.has(name));
    const missing = required.filter((name) => !remoteNames.has(name));

    return {
      function: slug,
      required,
      present,
      missing,
      ready: missing.length === 0,
    };
  });

  return {
    checkedAt: new Date().toISOString(),
    projectRef,
    tokenEnv,
    ready: checks.every((check) => check.ready),
    checks,
  };
}

function printStatus(status, json) {
  if (json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  for (const check of status.checks) {
    if (check.ready) {
      console.log(`OK ${check.function}: ${check.required.length} nomes obrigatorios presentes.`);
      continue;
    }

    console.error(`BLOCKED ${check.function}: ausentes ${check.missing.join(', ')}`);
  }

  console.log(status.ready ? 'EDGE_SECRETS_PREFLIGHT_READY' : 'EDGE_SECRETS_PREFLIGHT_BLOCKED');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectRef = resolveProjectRef(options.projectRef);
  const token = resolveAccessToken(options.tokenEnv);

  if (!projectRef) {
    throw new Error('Project ref ausente. Defina SUPABASE_PROJECT_REF ou linke o projeto Supabase.');
  }

  if (!token.token) {
    throw new Error(
      `Token Supabase ausente. Defina ${token.envName.replace(' or ', ' ou ')} com permissao para listar Edge Function secrets.`,
    );
  }

  const remoteNames = listRemoteSecretNames(projectRef, token.token);
  const status = buildStatus(projectRef, token.envName, options.functions, remoteNames);
  printStatus(status, options.json);

  if (!status.ready) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Falha desconhecida no preflight de Edge secrets.';
  console.error(`EDGE_SECRETS_PREFLIGHT_ERROR: ${message}`);
  process.exitCode = 1;
}

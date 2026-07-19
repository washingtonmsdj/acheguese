#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE_URL = 'https://api.supabase.com/v1';
const DEFAULT_TOKEN_ENV_NAMES = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_MANAGEMENT_API_TOKEN',
];

function createAlreadyReportedError(message) {
  const error = new Error(message);
  error.alreadyReported = true;
  return error;
}

function usage() {
  return [
    'Uso:',
    '  node scripts/security/supabase-auth-hibp.mjs --check',
    '  node scripts/security/supabase-auth-hibp.mjs --apply',
    '',
    'Opcoes:',
    '  --project-ref <ref>   Usa um project ref especifico.',
    '  --token-env <name>    Le o PAT de uma env var especifica.',
    '  --json                Imprime resultado estruturado sem expor token.',
    '',
    'Sem --project-ref, o script usa SUPABASE_PROJECT_REF ou supabase/.temp/project-ref.',
    'Sem --token-env, o script tenta SUPABASE_ACCESS_TOKEN e SUPABASE_MANAGEMENT_API_TOKEN.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    action: 'check',
    json: false,
    projectRef: undefined,
    tokenEnv: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--check') {
      options.action = 'check';
      continue;
    }

    if (arg === '--apply') {
      options.action = 'apply';
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--project-ref') {
      const value = argv[index + 1];
      if (!value) throw new Error('Use --project-ref <ref>.');
      options.projectRef = value.trim();
      index += 1;
      continue;
    }

    if (arg === '--token-env') {
      const value = argv[index + 1];
      if (!value) throw new Error('Use --token-env <nome_da_env>.');
      options.tokenEnv = value.trim();
      index += 1;
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

function readLinkedProjectRef() {
  const path = join(process.cwd(), 'supabase', '.temp', 'project-ref');
  if (!existsSync(path)) return undefined;

  const value = readFileSync(path, 'utf8').trim();
  return value.length > 0 ? value : undefined;
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
    const value = process.env[envName]?.trim();
    if (value) return { envName, value };
  }

  return { envName: envNames.join(' or '), value: undefined };
}

export async function requestAuthConfig(projectRef, token, init = {}) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectRef}/config/auth`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let body;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.error === 'string'
          ? body.error
          : `HTTP ${response.status}`;

    throw new Error(`Management API retornou ${response.status}: ${message}`);
  }

  return body ?? {};
}

function isHibpEnabled(authConfig) {
  return authConfig.password_hibp_enabled === true;
}

function createHibpStatus({
  action,
  enabled,
  projectRef,
  tokenEnv,
  status,
  blocker,
  message,
}) {
  return {
    action,
    checkedAt: new Date().toISOString(),
    enabled,
    projectRef,
    tokenEnv,
    status: status ?? (enabled === true ? 'enabled' : 'disabled'),
    ...(blocker ? { blocker } : {}),
    ...(message ? { message } : {}),
  };
}

function printHibpStatus(status, json) {
  if (json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (status.blocker) {
    console.log(status.message ?? `HIBP check bloqueado: ${status.blocker}.`);
    return;
  }

  if (!status.enabled) {
    console.log('password_hibp_enabled=false no Supabase Auth config remoto.');
    return;
  }

  console.log('OK password_hibp_enabled=true no Supabase Auth config remoto.');
}

async function checkHibp({ projectRef, token }) {
  const authConfig = await requestAuthConfig(projectRef, token);
  return {
    authConfig,
    enabled: isHibpEnabled(authConfig),
  };
}

async function applyHibp({ projectRef, token }) {
  await requestAuthConfig(projectRef, token, {
    method: 'PATCH',
    body: JSON.stringify({ password_hibp_enabled: true }),
  });

  return checkHibp({ projectRef, token });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectRef = resolveProjectRef(options.projectRef);
  const token = resolveAccessToken(options.tokenEnv);

  if (!projectRef) {
    const message = 'Project ref ausente. Defina SUPABASE_PROJECT_REF ou linke o projeto Supabase.';
    if (options.json) {
      printHibpStatus(
        createHibpStatus({
          action: options.action,
          blocker: 'missing_project_ref',
          enabled: null,
          message,
          projectRef: null,
          status: 'blocked',
          tokenEnv: token.envName,
        }),
        options.json,
      );
    }
    throw options.json ? createAlreadyReportedError(message) : new Error(message);
  }

  if (!token.value) {
    const message = `PAT ausente. Defina ${token.envName.replace(' or ', ' ou ')} com escopos auth_config_write/project_admin_write.`;
    if (options.json) {
      printHibpStatus(
        createHibpStatus({
          action: options.action,
          blocker: 'missing_pat',
          enabled: null,
          message,
          projectRef,
          status: 'blocked',
          tokenEnv: token.envName,
        }),
        options.json,
      );
    }
    throw options.json ? createAlreadyReportedError(message) : new Error(message);
  }

  if (options.action === 'apply') {
    const result = await applyHibp({ projectRef, token: token.value });
    const status = createHibpStatus({
      action: 'apply',
      enabled: result.enabled,
      projectRef,
      tokenEnv: token.envName,
    });

    if (!result.enabled) {
      throw new Error('PATCH executado, mas password_hibp_enabled nao ficou true.');
    }

    printHibpStatus(status, options.json);
    return;
  }

  const result = await checkHibp({ projectRef, token: token.value });
  const status = createHibpStatus({
    action: 'check',
    enabled: result.enabled,
    projectRef,
    tokenEnv: token.envName,
  });

  if (!result.enabled) {
    if (options.json) printHibpStatus(status, options.json);
    const message = 'password_hibp_enabled ainda nao esta ativo no Supabase Auth config remoto.';
    throw options.json ? createAlreadyReportedError(message) : new Error(message);
  }

  printHibpStatus(status, options.json);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    if (!error?.alreadyReported) {
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  });
}

export {
  applyHibp,
  checkHibp,
  createHibpStatus,
  isHibpEnabled,
  parseArgs,
  printHibpStatus,
  resolveAccessToken,
  resolveProjectRef,
  validateProjectRef,
  validateTokenEnvName,
};

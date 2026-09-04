#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_TOKEN_ENV_NAMES = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_MANAGEMENT_API_TOKEN',
];

const CANARY_FUNCTIONS = Object.freeze({
  'admin-list-users': Object.freeze({
    verifyJwt: true,
    requiredFiles: Object.freeze([
      'supabase/functions/admin-list-users/index.ts',
      'supabase/functions/_shared/adminAuth.ts',
      'supabase/functions/_shared/security.ts',
      'supabase/functions/_shared/validation.ts',
    ]),
  }),
  'admin-get-user': Object.freeze({
    verifyJwt: true,
    requiredFiles: Object.freeze([
      'supabase/functions/admin-get-user/index.ts',
      'supabase/functions/_shared/adminAuth.ts',
      'supabase/functions/_shared/security.ts',
      'supabase/functions/_shared/validation.ts',
    ]),
  }),
});

function usage() {
  return [
    'Uso:',
    '  node scripts/security/supabase-edge-admin-canary-deploy.mjs --function <admin-list-users|admin-get-user> --expected-sha <40-hex>',
    '  node scripts/security/supabase-edge-admin-canary-deploy.mjs --function <admin-list-users|admin-get-user> --expected-sha <40-hex> --apply',
    '',
    'Opcoes:',
    '  --function <slug>       Funcao canario permitida.',
    '  --project-ref <ref>     Project ref esperado. Deve coincidir com supabase/config.toml.',
    '  --token-env <name>      Le o PAT Supabase da env var indicada.',
    '  --expected-sha <sha>    SHA Git exato do source autorizado.',
    '  --apply                 Executa o deploy. Sem esta flag, faz somente preflight.',
    '  --json                  Imprime o preflight em JSON.',
    '',
    'O deploy usa exclusivamente:',
    '  supabase functions deploy <slug> --project-ref <ref> --use-api',
    'Nunca usa --prune nem --no-verify-jwt.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    functionSlug: 'admin-list-users',
    projectRef: undefined,
    tokenEnv: undefined,
    expectedSha: undefined,
    apply: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--function') {
      const value = argv[index + 1]?.trim();
      if (!value) throw new Error('Use --function <slug>.');
      if (!Object.hasOwn(CANARY_FUNCTIONS, value)) {
        throw new Error(`Funcao canario nao permitida: ${value}.`);
      }
      options.functionSlug = value;
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

    if (arg === '--expected-sha') {
      const value = argv[index + 1]?.trim();
      if (!value) throw new Error('Use --expected-sha <40-hex>.');
      options.expectedSha = value.toLowerCase();
      index += 1;
      continue;
    }

    if (arg === '--apply') {
      options.apply = true;
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

function validateExpectedSha(sha) {
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error('expected-sha invalido; informe exatamente 40 caracteres hexadecimais.');
  }
}

function readConfig() {
  const configPath = join(process.cwd(), 'supabase', 'config.toml');
  if (!existsSync(configPath)) {
    throw new Error('supabase/config.toml ausente. Execute a partir da raiz do repositorio.');
  }
  return readFileSync(configPath, 'utf8');
}

function readConfiguredProjectRef(config) {
  const match = config.match(/^project_id\s*=\s*"([a-z0-9-]+)"\s*$/m);
  if (!match) throw new Error('project_id ausente em supabase/config.toml.');
  return match[1];
}

function resolveProjectRef(explicitProjectRef, configuredProjectRef) {
  const projectRef =
    explicitProjectRef ||
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    configuredProjectRef;

  validateProjectRef(projectRef);
  if (projectRef !== configuredProjectRef) {
    throw new Error(
      `Project ref recusado: ${projectRef} difere do project_id versionado ${configuredProjectRef}.`,
    );
  }
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

function runGit(args) {
  try {
    return execFileSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new Error(`Falha ao executar git ${args.join(' ')}.`);
  }
}

function inspectGit(expectedSha, apply) {
  const headSha = runGit(['rev-parse', 'HEAD']).toLowerCase();
  const branch = runGit(['branch', '--show-current']);
  const dirty = runGit(['status', '--porcelain', '--untracked-files=normal']);

  if (dirty) {
    throw new Error('Worktree sujo; deploy recusado para preservar proveniencia exata.');
  }

  if (expectedSha) {
    validateExpectedSha(expectedSha);
    if (headSha !== expectedSha) {
      throw new Error(`HEAD ${headSha} difere do expected-sha ${expectedSha}.`);
    }
  } else if (apply) {
    throw new Error('--expected-sha e obrigatorio com --apply.');
  }

  if (apply && branch && branch !== 'main') {
    throw new Error(`Deploy recusado a partir da branch ${branch}; use main ou checkout detached do SHA autorizado.`);
  }

  return { headSha, branch: branch || '(detached)' };
}

function assertJwtConfig(config, functionSlug, expected) {
  const escaped = functionSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionPattern = new RegExp(
    `\\[functions\\.${escaped}\\]([\\s\\S]*?)(?=\\n\\[|$)`,
  );
  const section = config.match(sectionPattern)?.[1];
  if (!section) throw new Error(`Secao [functions.${functionSlug}] ausente em config.toml.`);

  const jwtMatch = section.match(/^verify_jwt\s*=\s*(true|false)\s*$/m);
  if (!jwtMatch) throw new Error(`verify_jwt ausente para ${functionSlug}.`);

  const actual = jwtMatch[1] === 'true';
  if (actual !== expected) {
    throw new Error(`verify_jwt inesperado para ${functionSlug}: ${actual}.`);
  }
}

function assertSourceContracts(functionSlug) {
  const entrypoint = readFileSync(
    join(process.cwd(), 'supabase', 'functions', functionSlug, 'index.ts'),
    'utf8',
  );
  const adminAuth = readFileSync(
    join(process.cwd(), 'supabase', 'functions', '_shared', 'adminAuth.ts'),
    'utf8',
  );

  if (functionSlug === 'admin-list-users') {
    if (!entrypoint.includes('admin_list_user_account_contexts')) {
      throw new Error('admin-list-users nao usa o RPC account-level autoritativo.');
    }
    if (/\.from\(["']profiles["']\)/.test(entrypoint)) {
      throw new Error('admin-list-users voltou a paginar profiles diretamente.');
    }
  }

  if (functionSlug === 'admin-get-user') {
    const requiredGetUserMarkers = [
      'const auth = await requireAdmin(req);',
      'readJsonBody<GetUserBody>(req, {',
      'maxBytes: 4096',
      'validateBody<GetUserBody>(rawBody.data, getUserSchema)',
      '.auth.admin.getUserById(userId)',
      ".select('role_enum, expires_at')",
      ".eq('is_active', true)",
      ".is('revoked_at', null)",
      'function hasCurrentRoleValidity',
      'Date.parse(role.expires_at)',
      'Number.isFinite(expiresAtMs) && expiresAtMs > nowMs',
      '.filter((role) => hasCurrentRoleValidity(role, nowMs))',
    ];

    for (const marker of requiredGetUserMarkers) {
      if (!entrypoint.includes(marker)) {
        throw new Error(`admin-get-user sem contrato obrigatorio: ${marker}`);
      }
    }
  }

  const requiredAdminAuthMarkers = [
    "supabase.rpc('get_user_roles'",
    "_user_id: user.id",
    "const adminRole = resolveAdminRole(roles)",
  ];
  for (const marker of requiredAdminAuthMarkers) {
    if (!adminAuth.includes(marker)) {
      throw new Error(`adminAuth sem contrato obrigatorio: ${marker}`);
    }
  }
  if (/\.from\(["']user_roles["']\)/.test(adminAuth)) {
    throw new Error('adminAuth voltou a consultar user_roles diretamente');
  }
}

function hashBundle(requiredFiles) {
  return requiredFiles.map((relativePath) => {
    const absolutePath = join(process.cwd(), relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`Arquivo obrigatorio ausente: ${relativePath}.`);
    }
    const content = readFileSync(absolutePath);
    return {
      path: relativePath,
      sha256: createHash('sha256').update(content).digest('hex'),
    };
  });
}

function assertSupabaseCli() {
  try {
    return execFileSync('supabase', ['--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new Error('Supabase CLI ausente ou indisponivel no PATH.');
  }
}

function buildStatus({ functionSlug, projectRef, tokenEnv, git, bundle, cliVersion, apply }) {
  return {
    checkedAt: new Date().toISOString(),
    mode: apply ? 'apply' : 'check',
    function: functionSlug,
    projectRef,
    tokenEnv,
    git,
    cliVersion,
    bundle,
    ready: true,
  };
}

function printStatus(status, json) {
  if (json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  console.log(`OK function: ${status.function}`);
  console.log(`OK project: ${status.projectRef}`);
  console.log(`OK git: ${status.git.headSha} (${status.git.branch})`);
  console.log(`OK supabase-cli: ${status.cliVersion}`);
  for (const file of status.bundle) {
    console.log(`OK bundle ${file.path} sha256=${file.sha256}`);
  }
}

function deploy(functionSlug, projectRef, accessToken) {
  try {
    execFileSync(
      'supabase',
      ['functions', 'deploy', functionSlug, '--project-ref', projectRef, '--use-api'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: {
          ...process.env,
          SUPABASE_ACCESS_TOKEN: accessToken,
        },
        stdio: ['ignore', 'inherit', 'inherit'],
      },
    );
  } catch {
    throw new Error(`Deploy Supabase falhou para ${functionSlug}.`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const policy = CANARY_FUNCTIONS[options.functionSlug];
  const config = readConfig();
  const configuredProjectRef = readConfiguredProjectRef(config);
  const projectRef = resolveProjectRef(options.projectRef, configuredProjectRef);
  const token = resolveAccessToken(options.tokenEnv);

  if (!token.token) {
    throw new Error(
      `Token Supabase ausente. Defina ${token.envName.replace(' or ', ' ou ')}; o valor nunca sera impresso.`,
    );
  }

  const git = inspectGit(options.expectedSha, options.apply);
  assertJwtConfig(config, options.functionSlug, policy.verifyJwt);
  assertSourceContracts(options.functionSlug);
  const bundle = hashBundle(policy.requiredFiles);
  const cliVersion = assertSupabaseCli();
  const status = buildStatus({
    functionSlug: options.functionSlug,
    projectRef,
    tokenEnv: token.envName,
    git,
    bundle,
    cliVersion,
    apply: options.apply,
  });
  printStatus(status, options.json);

  if (!options.apply) {
    console.log('EDGE_ADMIN_CANARY_DEPLOY_CHECK_READY');
    return;
  }

  deploy(options.functionSlug, projectRef, token.token);
  console.log(`EDGE_ADMIN_CANARY_DEPLOY_APPLIED ${options.functionSlug} ${git.headSha}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Falha desconhecida no deploy canario Edge.';
  console.error(`EDGE_ADMIN_CANARY_DEPLOY_BLOCKED: ${message}`);
  process.exitCode = 1;
}

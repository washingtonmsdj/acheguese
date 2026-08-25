/**
 * Runtime Supabase helper for Node-executed operational scripts.
 * Keep service_role env access centralized here; TypeScript scripts use
 * scripts/lib/supabase-client.ts as a typed facade over this implementation.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertApprovedRemoteMutationTarget } from './remote-mutation-safety.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');
const GUARDED_MUTATING_E2E_ENTRYPOINTS = new Set([
  'seed-e2e-users',
  'seed-e2e-network',
  'validate-slug-history-final',
]);

export const DEFAULT_SUPABASE_SCRIPT_ENV_FILES = ['.env.local', '.env.remote', '.env.test', '.env'];

export function loadSupabaseScriptEnv(envFiles = DEFAULT_SUPABASE_SCRIPT_ENV_FILES) {
  for (const envFile of envFiles) {
    dotenv.config({ path: resolve(ROOT_DIR, envFile), override: false });
  }
}

function getCleanEnv(name) {
  const value = process.env[name]?.trim();
  return value ? value.replace(/^['"]|['"]$/g, '') : undefined;
}

function currentEntrypointName() {
  const argvEntry = String(process.argv[1] || '').trim();
  if (!argvEntry) return '';
  return basename(argvEntry).replace(/\.[^.]+$/, '');
}

function assertKnownMutatingE2ETarget(url) {
  const entrypoint = currentEntrypointName();
  if (!GUARDED_MUTATING_E2E_ENTRYPOINTS.has(entrypoint)) return;
  assertApprovedRemoteMutationTarget(url);
}

function addSupabaseClientCandidate(candidates, seen, url, key, source, kind) {
  const cleanUrl = String(url || '').trim();
  const cleanKey = String(key || '').trim();
  if (!cleanUrl || !cleanKey) return;
  if (cleanUrl.includes('your-project')) return;

  const token = `${cleanUrl}::${cleanKey}`;
  if (seen.has(token)) return;

  seen.add(token);
  candidates.push({ url: cleanUrl, key: cleanKey, source, kind });
}

export function getSupabaseClientCandidates(envFiles = DEFAULT_SUPABASE_SCRIPT_ENV_FILES) {
  loadSupabaseScriptEnv(envFiles);

  const candidates = [];
  const seen = new Set();

  for (const envFile of envFiles) {
    const envPath = resolve(ROOT_DIR, envFile);
    if (!existsSync(envPath)) continue;

    const parsed = dotenv.parse(readFileSync(envPath, 'utf8'));
    const url = parsed.SUPABASE_URL || parsed.VITE_SUPABASE_URL;
    addSupabaseClientCandidate(candidates, seen, url, parsed.SUPABASE_SERVICE_ROLE_KEY, envFile, 'admin');
    addSupabaseClientCandidate(candidates, seen, url, parsed.VITE_SUPABASE_PUBLISHABLE_KEY, envFile, 'publishable');
  }

  const runtimeConfig = getSupabaseConfig({ envFiles });
  addSupabaseClientCandidate(
    candidates,
    seen,
    runtimeConfig.url,
    runtimeConfig.serviceRoleKey,
    'process.env',
    'admin',
  );
  addSupabaseClientCandidate(
    candidates,
    seen,
    runtimeConfig.url,
    runtimeConfig.anonKey,
    'process.env',
    'publishable',
  );

  return candidates;
}

export function createServiceRoleClient(config = {}) {
  loadSupabaseScriptEnv(config.envFiles);

  const url = config.url || getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
  const serviceRoleKey = config.serviceRoleKey || getCleanEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase URL e Service Role Key sao obrigatorios.\n' +
        'Configure as variaveis de ambiente:\n' +
        '  SUPABASE_SERVICE_ROLE_KEY\n' +
        '  SUPABASE_URL ou VITE_SUPABASE_URL\n' +
        'Carregue secrets locais com .\\scripts\\security\\Import-LocalSupabaseSecrets.ps1',
    );
  }

  assertKnownMutatingE2ETarget(url);

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createAnonClient(config = {}) {
  loadSupabaseScriptEnv(config.envFiles);

  const url = config.url || getCleanEnv('VITE_SUPABASE_URL');
  const anonKey = config.anonKey || getCleanEnv('VITE_SUPABASE_PUBLISHABLE_KEY');

  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL e Anon Key sao obrigatorios.\n' +
        'Configure as variaveis de ambiente:\n' +
        '  VITE_SUPABASE_URL\n' +
        '  VITE_SUPABASE_PUBLISHABLE_KEY',
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseScriptClient(config = {}) {
  loadSupabaseScriptEnv(config.envFiles);

  const url = config.url;
  const key = config.key;

  if (!url || !key) {
    throw new Error('Supabase URL e key sao obrigatorios para criar cliente operacional.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseConfig(config = {}) {
  loadSupabaseScriptEnv(config.envFiles);

  return {
    url: getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL'),
    projectId: getCleanEnv('SUPABASE_PROJECT_ID') || getCleanEnv('VITE_SUPABASE_PROJECT_ID'),
    serviceRoleKey: getCleanEnv('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: getCleanEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  };
}

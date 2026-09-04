#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from '../supabase/supabase-client.mjs';
import {
  getRemoteMutationTargetSafety,
} from '../supabase/remote-mutation-safety.mjs';

const ENV_FILES = ['.env.test', '.env.local'];
const BUSINESS_LIFECYCLE_TEST =
  'login cria edita publica e gerencia empresa pelo fluxo canonico';

loadSupabaseScriptEnv(ENV_FILES);

function requireValue(value, label) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new Error(`${label} is required for Business lifecycle certification.`);
  }
  return normalized;
}

function validateBaseUrl(value) {
  const raw = value || 'http://127.0.0.1:8099';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('PLAYWRIGHT_BASE_URL must be an absolute URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('PLAYWRIGHT_BASE_URL must use http or https.');
  }
  return parsed.origin;
}

const config = getSupabaseConfig({ envFiles: ENV_FILES });
const supabaseUrl = requireValue(config.url, 'VITE_SUPABASE_URL');
const publishableKey = requireValue(
  config.anonKey,
  'VITE_SUPABASE_PUBLISHABLE_KEY',
);
requireValue(config.serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY');

const baseUrl = validateBaseUrl(process.env.PLAYWRIGHT_BASE_URL);
const safetyEnv = {
  ...process.env,
  PLAYWRIGHT_BASE_URL: baseUrl,
  VITE_PUBLIC_APP_URL: baseUrl,
};

const previousBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const previousPublicUrl = process.env.VITE_PUBLIC_APP_URL;
process.env.PLAYWRIGHT_BASE_URL = baseUrl;
process.env.VITE_PUBLIC_APP_URL = baseUrl;
const safety = getRemoteMutationTargetSafety(supabaseUrl);
if (previousBaseUrl === undefined) delete process.env.PLAYWRIGHT_BASE_URL;
else process.env.PLAYWRIGHT_BASE_URL = previousBaseUrl;
if (previousPublicUrl === undefined) delete process.env.VITE_PUBLIC_APP_URL;
else process.env.VITE_PUBLIC_APP_URL = previousPublicUrl;

if (!safety.safe) {
  throw new Error(`Business lifecycle certification blocked: ${safety.reason}`);
}

console.log(
  `[business-certification] target=${safety.kind} app=${baseUrl} retries=0`,
);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npx,
  [
    'playwright',
    'test',
    'tests/e2e/auth-business.spec.ts',
    '--project=chromium',
    '--reporter=list',
    '--retries=0',
    '--grep',
    BUSINESS_LIFECYCLE_TEST,
  ],
  {
    stdio: 'inherit',
    shell: false,
    env: {
      ...safetyEnv,
      CI: 'true',
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      VITE_SUPABASE_ANON_KEY: publishableKey,
    },
  },
);

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('BUSINESS_LIFECYCLE_CERTIFICATION_PASS');

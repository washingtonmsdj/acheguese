import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LINKED_PROJECT_CONFIG = resolve(process.cwd(), 'supabase/config.toml');
const REMOTE_TARGET_ENV = 'E2E_REMOTE_MUTATION_TARGET';
const REMOTE_APPROVAL_ENV = 'E2E_REMOTE_MUTATION_APPROVED';

export interface RemoteMutationTargetSafety {
  safe: boolean;
  kind: 'local' | 'remote-isolated' | 'production' | 'unproven';
  reason: string;
}

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function normalizeHostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isProductionApplicationTarget(): boolean {
  if (readEnv('VERCEL_ENV').toLowerCase() === 'production') {
    return true;
  }

  for (const name of ['PLAYWRIGHT_BASE_URL', 'VITE_PUBLIC_APP_URL'] as const) {
    const value = readEnv(name);
    if (!value) continue;

    const hostname = normalizeHostname(value);
    if (!hostname) {
      return true;
    }

    if (hostname === 'acheguese.com.br' || hostname.endsWith('.acheguese.com.br')) {
      return true;
    }
  }

  return false;
}

export function linkedProductionProjectRef(): string {
  const config = readFileSync(LINKED_PROJECT_CONFIG, 'utf8');
  const projectRef = config.match(/^project_id\s*=\s*["']([^"']+)["']/m)?.[1]?.trim();

  if (!projectRef) {
    throw new Error('Supabase linked production project_id is missing from supabase/config.toml.');
  }

  return projectRef;
}

export function extractSupabaseProjectRef(supabaseUrl: string): string | null {
  const hostname = normalizeHostname(supabaseUrl);
  if (!hostname) return null;

  const match = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/);
  return match?.[1] ?? null;
}

export function getRemoteMutationTargetSafety(
  supabaseUrl: string | undefined,
): RemoteMutationTargetSafety {
  if (!supabaseUrl?.trim()) {
    return {
      safe: false,
      kind: 'unproven',
      reason: 'Supabase mutation URL is required to prove the target.',
    };
  }

  if (isProductionApplicationTarget()) {
    return {
      safe: false,
      kind: 'production',
      reason: 'Remote E2E mutation is forbidden while the application target is Production.',
    };
  }

  const hostname = normalizeHostname(supabaseUrl);
  if (!hostname) {
    return {
      safe: false,
      kind: 'unproven',
      reason: 'Supabase mutation URL is not a valid URL.',
    };
  }

  if (isLoopbackHostname(hostname)) {
    return {
      safe: true,
      kind: 'local',
      reason: 'Loopback Supabase target is isolated from Production.',
    };
  }

  const projectRef = extractSupabaseProjectRef(supabaseUrl);
  if (!projectRef) {
    return {
      safe: false,
      kind: 'unproven',
      reason: 'Remote Supabase project ref cannot be proven from the mutation URL.',
    };
  }

  let productionProjectRef: string;
  try {
    productionProjectRef = linkedProductionProjectRef();
  } catch (error) {
    return {
      safe: false,
      kind: 'unproven',
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  if (projectRef === productionProjectRef) {
    return {
      safe: false,
      kind: 'production',
      reason: `Refusing remote E2E mutation against linked Production project ${productionProjectRef}.`,
    };
  }

  const explicitTarget = readEnv(REMOTE_TARGET_ENV).toLowerCase();
  const explicitApproval = readEnv(REMOTE_APPROVAL_ENV).toLowerCase();
  if (explicitTarget !== 'isolated' || explicitApproval !== 'true') {
    return {
      safe: false,
      kind: 'unproven',
      reason: `Remote E2E mutation requires ${REMOTE_TARGET_ENV}=isolated and ${REMOTE_APPROVAL_ENV}=true.`,
    };
  }

  return {
    safe: true,
    kind: 'remote-isolated',
    reason: `Remote Supabase project ${projectRef} is explicitly approved and differs from Production.`,
  };
}

export function hasApprovedRemoteMutationTarget(
  supabaseUrl: string | undefined,
): boolean {
  return getRemoteMutationTargetSafety(supabaseUrl).safe;
}

export function assertApprovedRemoteMutationTarget(
  supabaseUrl: string | undefined,
): void {
  const safety = getRemoteMutationTargetSafety(supabaseUrl);
  if (!safety.safe) {
    throw new Error(`Remote mutation blocked: ${safety.reason}`);
  }
}

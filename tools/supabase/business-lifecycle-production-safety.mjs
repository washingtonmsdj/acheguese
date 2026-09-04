import {
  extractSupabaseProjectRef,
  linkedProductionProjectRef,
} from './remote-mutation-safety.mjs';

export const BUSINESS_LIFECYCLE_PRODUCTION_CERTIFICATION = 'business-lifecycle';
export const BUSINESS_LIFECYCLE_PRODUCTION_APPROVAL_ENV =
  'E2E_PRODUCTION_FIXTURE_APPROVED';
export const BUSINESS_LIFECYCLE_PRODUCTION_MODE_ENV =
  'E2E_PRODUCTION_FIXTURE_CERTIFICATION';
export const BUSINESS_LIFECYCLE_PRESERVE_HANDLE_ENV =
  'E2E_PRODUCTION_PRESERVE_HANDLE';
export const BUSINESS_LIFECYCLE_PRESERVED_HANDLE = 'washingtonmsdj';

function readEnv(env, name) {
  return String(env?.[name] ?? '').trim();
}

function productionAppHostIsAllowed(env) {
  const raw =
    readEnv(env, 'PLAYWRIGHT_BASE_URL') ||
    readEnv(env, 'VITE_PUBLIC_APP_URL');
  if (!raw) return false;

  try {
    const hostname = new URL(raw).hostname.toLowerCase();
    return [
      'acheguese.com.br',
      'www.acheguese.com.br',
      'acheguese.vercel.app',
    ].includes(hostname);
  } catch {
    return false;
  }
}

export function getBusinessLifecycleProductionSafety(
  supabaseUrl,
  env = process.env,
) {
  if (
    readEnv(env, BUSINESS_LIFECYCLE_PRODUCTION_MODE_ENV) !==
    BUSINESS_LIFECYCLE_PRODUCTION_CERTIFICATION
  ) {
    return {
      safe: false,
      kind: 'disabled',
      reason: `${BUSINESS_LIFECYCLE_PRODUCTION_MODE_ENV}=business-lifecycle is required.`,
    };
  }

  if (
    readEnv(env, BUSINESS_LIFECYCLE_PRODUCTION_APPROVAL_ENV).toLowerCase() !==
    'true'
  ) {
    return {
      safe: false,
      kind: 'unapproved',
      reason: `${BUSINESS_LIFECYCLE_PRODUCTION_APPROVAL_ENV}=true is required.`,
    };
  }

  if (
    readEnv(env, BUSINESS_LIFECYCLE_PRESERVE_HANDLE_ENV).toLowerCase() !==
    BUSINESS_LIFECYCLE_PRESERVED_HANDLE
  ) {
    return {
      safe: false,
      kind: 'preserve-identity-mismatch',
      reason: `${BUSINESS_LIFECYCLE_PRESERVE_HANDLE_ENV} must be ${BUSINESS_LIFECYCLE_PRESERVED_HANDLE}.`,
    };
  }

  const projectRef = extractSupabaseProjectRef(supabaseUrl);
  if (!projectRef) {
    return {
      safe: false,
      kind: 'unproven',
      reason: 'Supabase project ref cannot be proven from VITE_SUPABASE_URL.',
    };
  }

  const productionProjectRef = linkedProductionProjectRef();
  if (projectRef !== productionProjectRef) {
    return {
      safe: false,
      kind: 'not-linked-production',
      reason: 'Production fixture certification is valid only for the linked Production project.',
    };
  }

  if (!productionAppHostIsAllowed(env)) {
    return {
      safe: false,
      kind: 'application-target-mismatch',
      reason: 'Production fixture certification requires the canonical Achegue-se Production origin.',
    };
  }

  return {
    safe: true,
    kind: 'production-business-lifecycle',
    reason:
      'Business lifecycle certification is explicitly approved for technical fixtures while preserving washingtonmsdj.',
    preserveHandle: BUSINESS_LIFECYCLE_PRESERVED_HANDLE,
    projectRef,
  };
}

export function isBusinessLifecycleProductionCertification(
  supabaseUrl,
  env = process.env,
) {
  return getBusinessLifecycleProductionSafety(supabaseUrl, env).safe;
}

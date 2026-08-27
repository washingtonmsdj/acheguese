import { readFileSync } from 'fs';
import { extname } from 'path';

const SERVICE_ROLE_BOUNDARY_SCHEMA_VERSION = 'service-role-boundary-policy/v1';
const RISK_LEVELS = new Set(['Critical', 'High', 'Medium', 'Low']);

export const SERVICE_ROLE_BOUNDARY_PATTERN_IDS = new Set([
  'service-role-env-access',
  'service-role-key-literal',
  'browser-supabase-client-factory-import',
  'server-api-supabase-client-factory-import',
  'runtime-supabase-package-import',
  'operational-supabase-env-access',
  'operational-supabase-client-factory',
  'script-supabase-client-factory',
]);

const SERVICE_ROLE_BOUNDARY_MATCHERS = [
  {
    id: 'service-role-env-access',
    label: 'acesso runtime a service_role key',
    pattern:
      /\b(?:process\.env|import\.meta\.env)\.(?:VITE_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)\b|\b(?:process\.env|import\.meta\.env)\[\s*['"](?:VITE_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)['"]\s*\]|\b(?:Deno\.env\.get|readEnv)\(\s*['"](?:VITE_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)['"]\s*\)/g,
  },
  {
    id: 'service-role-key-literal',
    label: 'literal de service_role key',
    pattern: /\b(?:VITE_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)\b/g,
  },
  {
    id: 'browser-supabase-client-factory-import',
    label: 'import/export de factory createClient Supabase no browser',
    pattern:
      /(?:import\s*{\s*[^}]*\bcreateClient\b[^}]*}\s*from\s*|export\s*{\s*[^}]*\bcreateClient\b[^}]*}\s*from\s*)['"]@supabase\/supabase-js['"]/g,
    scanPrefixes: ['src/'],
  },
  {
    id: 'server-api-supabase-client-factory-import',
    label: 'import de factory createClient Supabase em API serverless',
    pattern:
      /import\s*{\s*[^}]*\bcreateClient\b[^}]*}\s*from\s*['"]@supabase\/supabase-js['"]/g,
    scanPrefixes: ['api/'],
  },
  {
    id: 'runtime-supabase-package-import',
    label: 'import/export direto do pacote supabase-js no runtime',
    pattern:
      /(?:import\s+(?:type\s+)?[^;]*?\s+from\s*|export\s+(?:type\s+)?[^;]*?\s+from\s*)['"]@supabase\/supabase-js['"]/g,
    scanPrefixes: ['src/'],
  },
  {
    id: 'operational-supabase-env-access',
    label: 'acesso runtime a env Supabase operacional',
    pattern:
      /\b(?:process\.env|import\.meta\.env)\.(?:VITE_SUPABASE_URL|VITE_SUPABASE_PUBLISHABLE_KEY|VITE_SUPABASE_ANON_KEY)\b|\b(?:process\.env|import\.meta\.env)\[\s*['"](?:VITE_SUPABASE_URL|VITE_SUPABASE_PUBLISHABLE_KEY|VITE_SUPABASE_ANON_KEY)['"]\s*\]|\breadEnv\(\s*['"](?:VITE_SUPABASE_URL|VITE_SUPABASE_PUBLISHABLE_KEY|VITE_SUPABASE_ANON_KEY)['"]\s*\)/g,
    scanPrefixes: ['tests/e2e/', 'tests/helpers/', 'tests/operational/'],
  },
  {
    id: 'operational-supabase-client-factory',
    label: 'criacao direta de cliente Supabase operacional',
    pattern: /\bcreateClient\s*\(/g,
    scanPrefixes: ['tests/e2e/', 'tests/helpers/', 'tests/operational/'],
  },
  {
    id: 'script-supabase-client-factory',
    label: 'criacao direta de cliente Supabase em script',
    pattern: /\bcreateClient\s*\(/g,
    scanPrefixes: ['scripts/'],
  },
];

const SERVICE_ROLE_BOUNDARY_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.sql',
  '.ps1',
  '.sh',
  '.json',
  '.html',
  '.md',
  '.toml',
]);

const SERVICE_ROLE_BOUNDARY_SCAN_PREFIXES = [
  'src/',
  'api/',
  'supabase/functions/',
  'scripts/',
  'public/',
  'docs/09-reference/governance/security/',
  'tests/e2e/',
  'tests/helpers/',
  'tests/operational/',
  'tests/security/',
  '.kiro/',
];

function toPosix(path) {
  return path.replace(/\\/g, '/');
}

function assertPlainRelativePath(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  if (value.startsWith('/') || value.includes('\\') || value.includes('..')) {
    throw new Error(`${fieldName} must be a repository-relative POSIX path`);
  }
}

function validateAllowedPatternIds(entry, fieldName) {
  if (!Array.isArray(entry.allowedPatternIds) || entry.allowedPatternIds.length === 0) {
    throw new Error(`${fieldName} must define allowedPatternIds`);
  }

  for (const patternId of entry.allowedPatternIds) {
    if (!SERVICE_ROLE_BOUNDARY_PATTERN_IDS.has(patternId)) {
      throw new Error(`${fieldName} references unknown pattern id: ${patternId}`);
    }
  }
}

function validateBoundaryEntry(entry, fieldName) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error(`${fieldName} must be a JSON object`);
  }

  if (typeof entry.kind !== 'string' || entry.kind.trim().length === 0) {
    throw new Error(`${fieldName} must define kind`);
  }

  if (!RISK_LEVELS.has(entry.risk)) {
    throw new Error(`${fieldName} must define risk as Critical, High, Medium, or Low`);
  }

  if (typeof entry.label !== 'string' || entry.label.trim().length === 0) {
    throw new Error(`${fieldName} must define label`);
  }

  if (typeof entry.authority !== 'string' || entry.authority.trim().length === 0) {
    throw new Error(`${fieldName} must define authority`);
  }

  validateAllowedPatternIds(entry, fieldName);
}

export function validateServiceRoleBoundaryPolicy(policy) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    throw new Error('service_role boundary policy must be a JSON object');
  }

  if (policy.schemaVersion !== SERVICE_ROLE_BOUNDARY_SCHEMA_VERSION) {
    throw new Error('service_role boundary policy has invalid schemaVersion');
  }

  if (!Array.isArray(policy.trackedPatternIds)) {
    throw new Error('service_role boundary policy must define trackedPatternIds');
  }

  const trackedPatternIds = new Set(policy.trackedPatternIds);
  for (const patternId of SERVICE_ROLE_BOUNDARY_PATTERN_IDS) {
    if (!trackedPatternIds.has(patternId)) {
      throw new Error(`service_role boundary policy is missing tracked pattern: ${patternId}`);
    }
  }

  const seenAllowedPaths = new Set();
  for (const [index, entry] of (policy.allowedPaths ?? []).entries()) {
    validateBoundaryEntry(entry, `allowedPaths[${index}]`);
    assertPlainRelativePath(entry.path, `allowedPaths[${index}].path`);
    if (seenAllowedPaths.has(entry.path)) {
      throw new Error(`duplicate service_role boundary allowed path: ${entry.path}`);
    }
    seenAllowedPaths.add(entry.path);
  }

  const seenAllowedPrefixes = new Set();
  for (const [index, entry] of (policy.allowedPrefixes ?? []).entries()) {
    validateBoundaryEntry(entry, `allowedPrefixes[${index}]`);
    assertPlainRelativePath(entry.prefix, `allowedPrefixes[${index}].prefix`);
    if (!entry.prefix.endsWith('/')) {
      throw new Error(`allowedPrefixes[${index}].prefix must end with /`);
    }
    if (seenAllowedPrefixes.has(entry.prefix)) {
      throw new Error(`duplicate service_role boundary allowed prefix: ${entry.prefix}`);
    }
    seenAllowedPrefixes.add(entry.prefix);
  }

  const seenForbiddenPrefixes = new Set();
  for (const [index, entry] of (policy.forbiddenPrefixes ?? []).entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`forbiddenPrefixes[${index}] must be a JSON object`);
    }
    assertPlainRelativePath(entry.prefix, `forbiddenPrefixes[${index}].prefix`);
    if (!entry.prefix.endsWith('/')) {
      throw new Error(`forbiddenPrefixes[${index}].prefix must end with /`);
    }
    if (typeof entry.label !== 'string' || entry.label.trim().length === 0) {
      throw new Error(`forbiddenPrefixes[${index}] must define label`);
    }
    if (seenForbiddenPrefixes.has(entry.prefix)) {
      throw new Error(`duplicate service_role boundary forbidden prefix: ${entry.prefix}`);
    }
    seenForbiddenPrefixes.add(entry.prefix);
  }
}

export function loadServiceRoleBoundaryPolicy(policyPath) {
  const policy = JSON.parse(readFileSync(policyPath, 'utf-8'));
  validateServiceRoleBoundaryPolicy(policy);
  return policy;
}

export function shouldScanServiceRoleBoundaryFile(relativePath) {
  const normalized = toPosix(relativePath);
  if (
    normalized.includes('/node_modules/') ||
    normalized.includes('/dist/') ||
    normalized.includes('/coverage/') ||
    normalized.includes('/playwright-report/') ||
    normalized.includes('/test-results/')
  ) {
    return false;
  }

  if (normalized.startsWith('.env')) return false;
  if (normalized === 'package.json' || normalized === 'vercel.json') return true;

  const hasPrefix = SERVICE_ROLE_BOUNDARY_SCAN_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix),
  );
  if (!hasPrefix) return false;

  return SERVICE_ROLE_BOUNDARY_EXTENSIONS.has(extname(normalized));
}

function shouldApplyMatcherToPath(matcher, relativePath) {
  if (!matcher.scanPrefixes) return true;
  return matcher.scanPrefixes.some((prefix) => relativePath.startsWith(prefix));
}

function collectServiceRoleBoundaryMatches(content, relativePath) {
  const matches = [];

  for (const matcher of SERVICE_ROLE_BOUNDARY_MATCHERS) {
    if (!shouldApplyMatcherToPath(matcher, relativePath)) continue;

    matcher.pattern.lastIndex = 0;
    let match = matcher.pattern.exec(content);
    while (match) {
      matches.push({
        id: matcher.id,
        label: matcher.label,
        value: match[0],
      });
      match = matcher.pattern.exec(content);
    }
  }

  return matches;
}

function findAllowedEntry(policy, relativePath) {
  const normalized = toPosix(relativePath);
  const exact = (policy.allowedPaths ?? []).find((entry) => entry.path === normalized);
  if (exact) return exact;

  return (policy.allowedPrefixes ?? [])
    .filter((entry) => normalized.startsWith(entry.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

function findForbiddenPrefix(policy, relativePath) {
  const normalized = toPosix(relativePath);
  return (policy.forbiddenPrefixes ?? [])
    .filter((entry) => normalized.startsWith(entry.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

function summarizeUnauthorizedMatches(matches, allowedEntry) {
  const groups = new Map();

  for (const match of matches) {
    if (allowedEntry?.allowedPatternIds?.includes(match.id)) continue;

    const current = groups.get(match.id) ?? {
      id: match.id,
      label: match.label,
      matches: 0,
    };
    current.matches += 1;
    groups.set(match.id, current);
  }

  return Array.from(groups.values());
}

export function validateServiceRoleBoundaryFiles({ files, policy }) {
  validateServiceRoleBoundaryPolicy(policy);

  const issues = [];
  for (const file of files) {
    const relativePath = toPosix(file.path ?? file.relativePath ?? '');
    const content = file.content ?? '';
    if (!relativePath || typeof content !== 'string') continue;

    const matches = collectServiceRoleBoundaryMatches(content, relativePath);
    if (matches.length === 0) continue;

    const allowedEntry = findAllowedEntry(policy, relativePath);
    const forbiddenPrefix = findForbiddenPrefix(policy, relativePath);
    const unauthorizedMatches = summarizeUnauthorizedMatches(matches, allowedEntry);

    for (const matchGroup of unauthorizedMatches) {
      const isUnclassified = !allowedEntry;
      const check = forbiddenPrefix
        ? 'Fronteira service_role violada'
        : 'Fronteira service_role sem classificacao';
      const location = forbiddenPrefix
        ? `${forbiddenPrefix.prefix} (${forbiddenPrefix.label})`
        : 'fora da policy canonica';
      const reason = isUnclassified
        ? `${relativePath} contem ${matchGroup.label} em ${location}`
        : `${relativePath} esta classificado como ${allowedEntry.kind}, mas nao permite ${matchGroup.id} (${matchGroup.label})`;

      issues.push({
        severity: 'CRITICO',
        check,
        file: relativePath,
        matches: matchGroup.matches,
        message: `${reason}. Atualize SERVICE_ROLE_BOUNDARY_POLICY.json apenas se o uso for server-side, operacional e auditavel.`,
      });
    }
  }

  return issues;
}

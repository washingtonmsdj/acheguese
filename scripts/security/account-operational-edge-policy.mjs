import { existsSync, readFileSync } from 'node:fs';

const POLICY_SCHEMA = 'account-operational-edge-policy/v1';
const VALID_MODES = new Set([
  'guarded',
  'allowed-during-deletion',
  'blocked-legacy',
  'admin-only',
  'system',
]);

export function loadAccountOperationalEdgePolicy(policyPath) {
  if (!existsSync(policyPath)) {
    throw new Error(`Account operational Edge policy not found: ${policyPath}`);
  }
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  validateAccountOperationalEdgePolicy(policy);
  return policy;
}

export function validateAccountOperationalEdgePolicy(policy) {
  if (!isPlainObject(policy)) {
    throw new Error('Account operational Edge policy must be a JSON object');
  }
  if (policy.schemaVersion !== POLICY_SCHEMA) {
    throw new Error('Invalid account operational Edge policy schema version');
  }
  compileRegex(policy.guardPattern, 'guardPattern');
  compileRegex(policy.adminRequiredPattern, 'adminRequiredPattern');
  requireStringArray(policy.blockedStatuses, 'blockedStatuses', true);
  requireStringArray(policy.guardedKinds, 'guardedKinds', true);
  requireStringArray(policy.systemKinds, 'systemKinds', true);
  if (!isPlainObject(policy.allowedDuringDeletion)) {
    throw new Error('Account operational Edge policy must define allowedDuringDeletion');
  }
  if (!isPlainObject(policy.blockedLegacy)) {
    throw new Error('Account operational Edge policy must define blockedLegacy');
  }

  const allowed = new Set(Object.keys(policy.allowedDuringDeletion));
  const blocked = new Set(Object.keys(policy.blockedLegacy));
  for (const functionName of allowed) {
    validateFunctionName(functionName, 'allowedDuringDeletion');
    validateReason(policy.allowedDuringDeletion[functionName], `allowedDuringDeletion.${functionName}`);
    if (blocked.has(functionName)) {
      throw new Error(`${functionName} cannot be both allowedDuringDeletion and blockedLegacy`);
    }
  }
  for (const functionName of blocked) {
    validateFunctionName(functionName, 'blockedLegacy');
    validateReason(policy.blockedLegacy[functionName], `blockedLegacy.${functionName}`);
  }

  const guardedKinds = new Set(policy.guardedKinds);
  for (const kind of policy.systemKinds) {
    if (guardedKinds.has(kind)) {
      throw new Error(`Edge policy kind cannot be both guarded and system: ${kind}`);
    }
  }
}

export function classifyAccountOperationalMode({
  functionName,
  classification,
  content,
  policy,
}) {
  validateAccountOperationalEdgePolicy(policy);

  if (Object.hasOwn(policy.allowedDuringDeletion, functionName)) {
    return 'allowed-during-deletion';
  }
  if (Object.hasOwn(policy.blockedLegacy, functionName)) {
    return 'blocked-legacy';
  }

  if (classification?.kind === 'admin-broker') {
    return 'admin-only';
  }

  const adminPattern = compileRegex(policy.adminRequiredPattern, 'adminRequiredPattern');
  if (typeof content === 'string' && adminPattern.test(content)) {
    return 'admin-only';
  }

  if (policy.systemKinds.includes(classification?.kind)) {
    return 'system';
  }
  if (policy.guardedKinds.includes(classification?.kind)) {
    return 'guarded';
  }

  return null;
}

export function validateAccountOperationalEdgeCoverage({
  authPolicy,
  operationalPolicy,
  serviceRoleFunctionContents,
  fileForFunction = (functionName) => `supabase/functions/${functionName}/index.ts`,
}) {
  validateAccountOperationalEdgePolicy(operationalPolicy);
  const issues = [];
  const modes = new Map();
  const contents = serviceRoleFunctionContents instanceof Map
    ? serviceRoleFunctionContents
    : new Map(Object.entries(serviceRoleFunctionContents ?? {}));
  const guardPattern = compileRegex(operationalPolicy.guardPattern, 'guardPattern');

  if (!isPlainObject(authPolicy?.serviceRoleAllowlist)) {
    throw new Error('Edge auth policy serviceRoleAllowlist is required');
  }

  for (const [functionName, classification] of Object.entries(authPolicy.serviceRoleAllowlist)) {
    const content = contents.get(functionName);
    if (typeof content !== 'string') {
      issues.push({
        severity: 'CRITICO',
        check: 'Operational account policy sem source service_role',
        file: fileForFunction(functionName),
        message: `${functionName} esta no serviceRoleAllowlist, mas o source nao foi fornecido ao validador`,
      });
      continue;
    }

    const mode = classifyAccountOperationalMode({
      functionName,
      classification,
      content,
      policy: operationalPolicy,
    });
    if (!mode || !VALID_MODES.has(mode)) {
      issues.push({
        severity: 'CRITICO',
        check: 'Service-role broker sem classificacao operacional',
        file: fileForFunction(functionName),
        message: `${functionName} (${classification?.kind ?? 'unknown'}) nao resolve para um modo operacional explicito`,
      });
      continue;
    }
    modes.set(functionName, mode);

    const hasGuard = guardPattern.test(content);
    guardPattern.lastIndex = 0;

    if (mode === 'guarded' && !hasGuard) {
      issues.push({
        severity: 'CRITICO',
        check: 'Broker autenticado sem pending-deletion guard',
        file: fileForFunction(functionName),
        message: `${functionName} usa service_role para fluxo de usuario e deve chamar requireOperationalAccount(...)`,
      });
    }

    if (mode === 'allowed-during-deletion' && hasGuard) {
      issues.push({
        severity: 'CRITICO',
        check: 'Canal de recuperacao bloqueado pelo operational guard',
        file: fileForFunction(functionName),
        message: `${functionName} deve permanecer acessivel durante pending deletion e nao pode aplicar o guard global`,
      });
    }
  }

  for (const functionName of Object.keys(operationalPolicy.allowedDuringDeletion)) {
    if (authPolicy.serviceRoleAllowlist[functionName]) continue;
    issues.push({
      severity: 'CRITICO',
      check: 'Excecao operacional sem classificacao service_role',
      file: 'docs/09-reference/governance/security/ACCOUNT_OPERATIONAL_EDGE_POLICY.json',
      message: `${functionName} esta allowedDuringDeletion, mas nao existe no serviceRoleAllowlist`,
    });
  }
  for (const functionName of Object.keys(operationalPolicy.blockedLegacy)) {
    if (authPolicy.serviceRoleAllowlist[functionName]) continue;
    issues.push({
      severity: 'CRITICO',
      check: 'Legacy block operacional sem classificacao service_role',
      file: 'docs/09-reference/governance/security/ACCOUNT_OPERATIONAL_EDGE_POLICY.json',
      message: `${functionName} esta blockedLegacy, mas nao existe no serviceRoleAllowlist`,
    });
  }

  return { issues, modes };
}

function compileRegex(rawPattern, fieldName) {
  if (typeof rawPattern !== 'string' || rawPattern.trim().length === 0) {
    throw new Error(`Account operational Edge policy ${fieldName} must be a non-empty regex string`);
  }
  try {
    return new RegExp(rawPattern);
  } catch (error) {
    throw new Error(`Invalid ${fieldName} regex: ${error.message}`);
  }
}

function requireStringArray(value, fieldName, requireNonEmpty = false) {
  if (!Array.isArray(value)) {
    throw new Error(`Account operational Edge policy ${fieldName} must be an array`);
  }
  if (requireNonEmpty && value.length === 0) {
    throw new Error(`Account operational Edge policy ${fieldName} must not be empty`);
  }
  const seen = new Set();
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      throw new Error(`Account operational Edge policy ${fieldName} must contain non-empty strings`);
    }
    if (seen.has(entry)) {
      throw new Error(`Account operational Edge policy ${fieldName} contains duplicate ${entry}`);
    }
    seen.add(entry);
  }
}

function validateFunctionName(functionName, fieldName) {
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(functionName)) {
    throw new Error(`Invalid Edge Function name in ${fieldName}: ${functionName}`);
  }
}

function validateReason(entry, fieldName) {
  if (!isPlainObject(entry) || typeof entry.reason !== 'string' || entry.reason.trim().length === 0) {
    throw new Error(`${fieldName} must define a non-empty reason`);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

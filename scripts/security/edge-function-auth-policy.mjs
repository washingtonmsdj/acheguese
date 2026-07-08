import { existsSync, readFileSync } from 'fs';

export const EDGE_FUNCTION_NO_JWT_POLICY_KINDS = new Set([
  'cron-secret',
  'public-auth-broker',
  'public-counter-broker',
  'public-proxy',
  'public-read',
  'signed-webhook',
]);

export const EDGE_FUNCTION_SERVICE_ROLE_POLICY_KINDS = new Set([
  'admin-broker',
  'ai-broker',
  'authenticated-broker',
  'billing-broker',
  'cron-secret',
  'notification-broker',
  'public-auth-broker',
  'public-counter-broker',
  'signed-webhook',
  'user-data-broker',
]);

const EDGE_FUNCTION_SERVICE_ROLE_RISK_LEVELS = new Set(['Critical', 'High']);

export function loadEdgeFunctionAuthPolicy(policyPath) {
  if (!existsSync(policyPath)) {
    throw new Error(`Edge Function auth policy not found: ${policyPath}`);
  }

  const policy = JSON.parse(readFileSync(policyPath, 'utf-8'));
  validateEdgeFunctionAuthPolicy(policy);
  return policy;
}

export function validateEdgeFunctionAuthPolicy(policy) {
  if (!isPlainObject(policy)) {
    throw new Error('Edge Function auth policy must be a JSON object');
  }
  if (policy.schemaVersion !== 'edge-function-auth-policy/v1') {
    throw new Error('Invalid Edge Function auth policy schema version');
  }
  if (policy.requireExplicitConfigForAllFunctions !== true) {
    throw new Error('Edge Function auth policy must require explicit config for all functions');
  }
  if (!isPlainObject(policy.noJwtAllowlist)) {
    throw new Error('Edge Function auth policy must define noJwtAllowlist');
  }
  if (!isPlainObject(policy.serviceRoleAllowlist)) {
    throw new Error('Edge Function auth policy must define serviceRoleAllowlist');
  }

  const jwtRequiredNamePatterns = compileRegexList(
    policy.jwtRequiredNamePatterns,
    'jwtRequiredNamePatterns',
    { requireNonEmpty: true },
  );

  for (const [functionName, exception] of Object.entries(policy.noJwtAllowlist)) {
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(functionName)) {
      throw new Error(`Invalid Edge Function name in noJwtAllowlist: ${functionName}`);
    }
    if (!isPlainObject(exception)) {
      throw new Error(`No-JWT policy for ${functionName} must be a JSON object`);
    }
    if (!EDGE_FUNCTION_NO_JWT_POLICY_KINDS.has(exception.kind)) {
      throw new Error(`No-JWT policy for ${functionName} has invalid kind: ${exception.kind}`);
    }
    if (typeof exception.label !== 'string' || exception.label.trim().length === 0) {
      throw new Error(`No-JWT policy for ${functionName} must define a non-empty label`);
    }

    compileRegexList(exception.requiredPatterns, `noJwtAllowlist.${functionName}.requiredPatterns`, {
      requireNonEmpty: true,
    });

    if (jwtRequiredNamePatterns.some((pattern) => pattern.test(functionName))) {
      throw new Error(
        `No-JWT policy for ${functionName} conflicts with jwtRequiredNamePatterns`,
      );
    }
  }

  for (const [functionName, classification] of Object.entries(policy.serviceRoleAllowlist)) {
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(functionName)) {
      throw new Error(`Invalid Edge Function name in serviceRoleAllowlist: ${functionName}`);
    }
    if (!isPlainObject(classification)) {
      throw new Error(`service_role policy for ${functionName} must be a JSON object`);
    }
    if (!EDGE_FUNCTION_SERVICE_ROLE_POLICY_KINDS.has(classification.kind)) {
      throw new Error(
        `service_role policy for ${functionName} has invalid kind: ${classification.kind}`,
      );
    }
    if (!EDGE_FUNCTION_SERVICE_ROLE_RISK_LEVELS.has(classification.risk)) {
      throw new Error(
        `service_role policy for ${functionName} has invalid risk: ${classification.risk}`,
      );
    }
    if (typeof classification.label !== 'string' || classification.label.trim().length === 0) {
      throw new Error(`service_role policy for ${functionName} must define a non-empty label`);
    }

    compileRegexList(classification.requiredPatterns, `serviceRoleAllowlist.${functionName}.requiredPatterns`, {
      requireNonEmpty: true,
    });
  }
}

export function validateEdgeFunctionServiceRoleCoverage({
  authPolicy,
  implementedFunctionNames,
  serviceRoleFunctionContents,
  fileForFunction = (functionName) => `supabase/functions/${functionName}/index.ts`,
}) {
  const issues = [];
  const implementedFunctionNameSet = new Set(implementedFunctionNames);
  const serviceRoleContentEntries =
    serviceRoleFunctionContents instanceof Map
      ? Array.from(serviceRoleFunctionContents.entries())
      : Object.entries(serviceRoleFunctionContents);
  const serviceRoleFunctionNames = new Set(serviceRoleContentEntries.map(([functionName]) => functionName));

  for (const [functionName, classification] of Object.entries(authPolicy.serviceRoleAllowlist)) {
    if (!implementedFunctionNameSet.has(functionName)) {
      issues.push({
        severity: 'CRITICO',
        check: 'Classificacao service_role sem implementacao',
        file: 'docs/governance/security/EDGE_FUNCTION_AUTH_POLICY.json',
        message: `${functionName} esta em serviceRoleAllowlist, mas nao existe em supabase/functions`,
      });
      continue;
    }

    if (!serviceRoleFunctionNames.has(functionName)) {
      issues.push({
        severity: 'CRITICO',
        check: 'Classificacao service_role sem uso detectado',
        file: fileForFunction(functionName),
        message: `${functionName} esta em serviceRoleAllowlist, mas nao usa SUPABASE_SERVICE_ROLE_KEY/SERVICE_ROLE`,
      });
      continue;
    }

    for (const rawPattern of classification.requiredPatterns) {
      const pattern = new RegExp(rawPattern);
      const content = serviceRoleFunctionContents.get
        ? serviceRoleFunctionContents.get(functionName)
        : serviceRoleFunctionContents[functionName];
      if (pattern.test(content)) continue;

      issues.push({
        severity: 'CRITICO',
        check: 'Edge Function com service_role sem controle classificado',
        file: fileForFunction(functionName),
        message: `${functionName} usa service_role, mas nao contem o padrao obrigatorio ${rawPattern}`,
      });
    }
  }

  for (const [functionName] of serviceRoleContentEntries) {
    if (authPolicy.serviceRoleAllowlist[functionName]) continue;

    issues.push({
      severity: 'CRITICO',
      check: 'Edge Function com service_role sem classificacao',
      file: fileForFunction(functionName),
      message: `${functionName} usa service_role, mas nao esta em serviceRoleAllowlist`,
    });
  }

  return issues;
}

export function compileRegexList(patterns, fieldName, options = {}) {
  if (!Array.isArray(patterns)) {
    throw new Error(`Edge Function auth policy must define ${fieldName} as an array`);
  }
  if (options.requireNonEmpty && patterns.length === 0) {
    throw new Error(`Edge Function auth policy must define at least one entry in ${fieldName}`);
  }

  return patterns.map((rawPattern, index) => {
    if (typeof rawPattern !== 'string' || rawPattern.trim().length === 0) {
      throw new Error(`Edge Function auth policy ${fieldName}[${index}] must be a non-empty string`);
    }

    try {
      return new RegExp(rawPattern);
    } catch (error) {
      throw new Error(
        `Edge Function auth policy ${fieldName}[${index}] is not a valid regex: ${error.message}`,
      );
    }
  });
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseSupabaseFunctionAuthConfig(content) {
  const configs = new Map();
  let currentFunctionName = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '').trim();
    if (!line) continue;

    const section = line.match(/^\[functions\.([A-Za-z0-9_-]+)\]$/);
    if (section) {
      currentFunctionName = section[1];
      if (!configs.has(currentFunctionName)) configs.set(currentFunctionName, {});
      continue;
    }

    if (line.startsWith('[')) {
      currentFunctionName = null;
      continue;
    }

    if (!currentFunctionName) continue;

    const verifyJwt = line.match(/^verify_jwt\s*=\s*(true|false)$/i);
    if (verifyJwt) {
      configs.get(currentFunctionName).verifyJwt = verifyJwt[1].toLowerCase() === 'true';
    }
  }

  return configs;
}

export function validateEdgeFunctionAuthConfigContract({
  authPolicy,
  configContent,
  configFile = 'supabase/config.toml',
  implementedFunctionNames,
}) {
  const issues = [];
  const functionConfigs = parseSupabaseFunctionAuthConfig(configContent);
  const implementedFunctionNameSet = new Set(implementedFunctionNames);
  const noJwtAllowlist = new Set(Object.keys(authPolicy.noJwtAllowlist));
  const jwtRequiredNamePatterns = authPolicy.jwtRequiredNamePatterns.map(
    (pattern) => new RegExp(pattern),
  );
  const functionNames = new Set([
    ...implementedFunctionNameSet,
    ...functionConfigs.keys(),
    ...noJwtAllowlist,
  ]);

  for (const functionName of functionNames) {
    const config = functionConfigs.get(functionName);
    const isPublicNoJwt = noJwtAllowlist.has(functionName);
    const isPrivilegedBroker = jwtRequiredNamePatterns.some((pattern) =>
      pattern.test(functionName),
    );

    if (!implementedFunctionNameSet.has(functionName)) {
      issues.push({
        severity: 'CRITICO',
        check: 'Contrato de Edge Function sem implementacao',
        file: configFile,
        message: `${functionName} esta em supabase/config.toml ou na allowlist de seguranca, mas nao existe em supabase/functions`,
      });
      continue;
    }

    if (authPolicy.requireExplicitConfigForAllFunctions && !config) {
      issues.push({
        severity: 'CRITICO',
        check: 'Edge Function sem contrato verify_jwt',
        file: configFile,
        message: `${functionName} existe em supabase/functions, mas nao declara verify_jwt em supabase/config.toml`,
      });
      continue;
    }

    if (isPublicNoJwt) {
      if (config?.verifyJwt !== false) {
        issues.push({
          severity: 'CRITICO',
          check: 'Edge Function publica sem JWT fora do contrato',
          file: configFile,
          message: `${functionName} deve declarar verify_jwt = false como excecao publica documentada`,
        });
      }
      continue;
    }

    if (config?.verifyJwt === false) {
      issues.push({
        severity: 'CRITICO',
        check: 'Edge Function sem JWT nao autorizada',
        file: configFile,
        message: `${functionName} declara verify_jwt = false, mas nao esta na allowlist da Security Authority`,
      });
    }

    if (isPrivilegedBroker && config?.verifyJwt !== true) {
      issues.push({
        severity: 'CRITICO',
        check: 'Broker privilegiado sem JWT obrigatorio',
        file: configFile,
        message: `${functionName} deve declarar verify_jwt = true por ser admin-* ou *-rpc`,
      });
    }
  }

  return { functionConfigs, issues };
}

export function validateNoJwtEdgeFunctionControls(functionName, policy, content, relativePath) {
  const issues = [];

  for (const rawPattern of policy.requiredPatterns) {
    const pattern = new RegExp(rawPattern);
    if (pattern.test(content)) continue;

    issues.push({
      severity: 'CRITICO',
      check: 'Edge Function sem JWT sem controle obrigatorio',
      file: relativePath,
      message: `${functionName} esta na allowlist sem JWT, mas nao contem o padrao obrigatorio ${rawPattern}`,
    });
  }

  return issues;
}

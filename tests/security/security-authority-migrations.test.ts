import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  loadAllowedResidualCacheKeys,
  parseAdvisorFindings,
  validateAdvisorFindings,
} from "../../scripts/validate-supabase-advisor-residuals";
import {
  validateMigrationFiles,
  type MigrationFile,
} from "../../scripts/validate-supabase-migrations";
import { PASSWORD_POLICY } from "../../src/shared/validation/passwordPolicy";

const tempDirs: string[] = [];
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const exceptionRegisterPath = join(
  repoRoot,
  "docs",
  "09-reference",
  "governance",
  "security",
  "EXCEPTIONS.md",
);
const advisorResidualRegisterPath = join(
  repoRoot,
  "docs",
  "09-reference",
  "governance",
  "security",
  "SUPABASE_ADVISOR_RESIDUALS.json",
);
const advisorKnownResidualFixturePath = join(
  repoRoot,
  "tests",
  "security",
  "fixtures",
  "supabase-advisor-known-residual.json",
);
const supabaseConfigPath = join(repoRoot, "supabase", "config.toml");
const supabaseSecurityModelPath = join(
  repoRoot,
  "docs",
  "09-reference",
  "governance",
  "security",
  "SUPABASE_SECURITY_MODEL.md",
);
const edgeFunctionAuthPolicyPath = join(
  repoRoot,
  "docs",
  "09-reference",
  "governance",
  "security",
  "EDGE_FUNCTION_AUTH_POLICY.json",
);
const serviceRoleBoundaryPolicyPath = join(
  repoRoot,
  "docs",
  "09-reference",
  "governance",
  "security",
  "SERVICE_ROLE_BOUNDARY_POLICY.json",
);
const edgeFunctionAuthConfigModulePath =
  "../../scripts/security/edge-function-auth-config.mjs";
const edgeFunctionAuthPolicyModulePath =
  "../../scripts/security/edge-function-auth-policy.mjs";
const serviceRoleBoundaryModulePath =
  "../../scripts/security/service-role-boundary.mjs";
const supabaseAccessBoundaryModulePath =
  "../../scripts/security/supabase-access-boundary.mjs";
const edgeFunctionBrokerBoundaryModulePath =
  "../../scripts/security/edge-function-broker-boundary.mjs";
const supabaseAuthHibpModulePath =
  "../../scripts/security/supabase-auth-hibp.mjs";
const supabasePostgisOwnerPreflightModulePath =
  "../../scripts/security/supabase-postgis-owner-preflight.mjs";

type EdgeFunctionAuthConfig = {
  verifyJwt?: boolean;
};

type EdgeFunctionAuthConfigIssue = {
  check?: string;
  file?: string;
  message?: string;
  severity: string;
};

type EdgeFunctionAuthPolicy = {
  jwtRequiredNamePatterns: string[];
  noJwtAllowlist: Record<
    string,
    { kind: string; label: string; requiredPatterns: string[] }
  >;
  requireExplicitConfigForAllFunctions: boolean;
  serviceRoleAllowlist: Record<
    string,
    { kind: string; label: string; requiredPatterns: string[]; risk: string }
  >;
  schemaVersion: string;
};

type EdgeFunctionAuthConfigModule = {
  parseSupabaseFunctionAuthConfig: (
    content: string,
  ) => Map<string, EdgeFunctionAuthConfig>;
  validateEdgeFunctionAuthConfigContract: (input: {
    authPolicy: EdgeFunctionAuthPolicy;
    configContent: string;
    configFile?: string;
    implementedFunctionNames: string[];
  }) => {
    functionConfigs: Map<string, EdgeFunctionAuthConfig>;
    issues: EdgeFunctionAuthConfigIssue[];
  };
};

type EdgeFunctionAuthPolicyModule = {
  EDGE_FUNCTION_NO_JWT_POLICY_KINDS: Set<string>;
  EDGE_FUNCTION_SERVICE_ROLE_POLICY_KINDS: Set<string>;
  validateEdgeFunctionAuthPolicy: (policy: unknown) => void;
  validateEdgeFunctionServiceRoleCoverage: (input: {
    authPolicy: EdgeFunctionAuthPolicy;
    fileForFunction?: (functionName: string) => string;
    implementedFunctionNames: string[];
    serviceRoleFunctionContents: Map<string, string> | Record<string, string>;
  }) => EdgeFunctionAuthConfigIssue[];
};

type ServiceRoleBoundaryPolicyEntry = {
  allowedPatternIds: string[];
  authority: string;
  kind: string;
  label: string;
  path?: string;
  prefix?: string;
  risk: string;
};

type ServiceRoleBoundaryPolicy = {
  allowedPaths: ServiceRoleBoundaryPolicyEntry[];
  allowedPrefixes: ServiceRoleBoundaryPolicyEntry[];
  forbiddenPrefixes: Array<{ label: string; prefix: string }>;
  schemaVersion: string;
  trackedPatternIds: string[];
};

type ServiceRoleBoundaryIssue = {
  check?: string;
  file?: string;
  matches?: number;
  message?: string;
  severity: string;
};

type ServiceRoleBoundaryModule = {
  SERVICE_ROLE_BOUNDARY_PATTERN_IDS: Set<string>;
  shouldScanServiceRoleBoundaryFile: (relativePath: string) => boolean;
  validateServiceRoleBoundaryFiles: (input: {
    files: Array<{ content: string; path: string }>;
    policy: ServiceRoleBoundaryPolicy;
  }) => ServiceRoleBoundaryIssue[];
  validateServiceRoleBoundaryPolicy: (policy: unknown) => void;
};

type SupabaseAccessBoundaryModule = {
  shouldScanSupabaseAccessBoundaryFile: (relativePath: string) => boolean;
  validateSupabaseAccessBoundaryFiles: (
    files: Array<{ content: string; path: string }>,
  ) => ServiceRoleBoundaryIssue[];
};

type EdgeFunctionBrokerBoundaryModule = {
  shouldScanEdgeFunctionBrokerBoundaryFile: (relativePath: string) => boolean;
  validateEdgeFunctionBrokerBoundaryFiles: (
    files: Array<{ content: string; path: string }>,
  ) => ServiceRoleBoundaryIssue[];
};

type SupabaseAuthHibpModule = {
  createHibpStatus: (input: {
    action: string;
    enabled: boolean;
    projectRef: string;
    tokenEnv: string;
  }) => {
    action: string;
    checkedAt: string;
    enabled: boolean;
    projectRef: string;
    tokenEnv: string;
  };
  parseArgs: (args: string[]) => {
    action: string;
    json: boolean;
    projectRef?: string;
    tokenEnv?: string;
  };
  validateProjectRef: (projectRef: string) => void;
  validateTokenEnvName: (envName: string) => void;
};

type SupabasePostgisOwnerPreflightModule = {
  buildPostgisOwnerPreflightSql: () => string;
  evaluatePostgisOwnerPreflight: (snapshot: {
    roleContext: {
      current_user: string | null;
      current_user_is_superuser: boolean;
    };
    extensions: Array<{
      extname: string;
      extension_owner: string | null;
      extension_schema: string;
    }>;
    spatialRefSys: Array<{
      rls_enabled: boolean;
      table_name: string;
      table_owner: string | null;
      table_schema: string;
    }>;
    stEstimatedExtent: Array<{
      anon_execute: boolean;
      authenticated_execute: boolean;
      function_owner: string | null;
      signature: string;
    }>;
  }) => {
    exceptionId: string;
    findings: Array<{ object: string; ready: boolean; risk: string }>;
    ready: boolean;
    status: "blocked" | "ready" | "resolved";
  };
  normalizePostgisPreflightRow: (row: unknown) => {
    roleContext: {
      current_user: string | null;
      current_user_is_superuser: boolean;
    };
    extensions: unknown[];
    spatialRefSys: unknown[];
    stEstimatedExtent: unknown[];
  };
  parseArgs: (args: string[]) => { failIfBlocked: boolean; json: boolean };
  parseSupabaseQueryJson: (output: string) => unknown;
};

const baseEdgeFunctionAuthPolicy: EdgeFunctionAuthPolicy = {
  jwtRequiredNamePatterns: ["^admin-", "-rpc$"],
  noJwtAllowlist: {
    "public-status": {
      kind: "public-read",
      label: "public status endpoint",
      requiredPatterns: ["rateLimitMiddleware\\s*\\("],
    },
  },
  requireExplicitConfigForAllFunctions: true,
  serviceRoleAllowlist: {},
  schemaVersion: "edge-function-auth-policy/v1",
};

const baseServiceRoleAuthPolicy: EdgeFunctionAuthPolicy = {
  ...baseEdgeFunctionAuthPolicy,
  serviceRoleAllowlist: {
    "classified-function": {
      kind: "authenticated-broker",
      label: "classified service role fixture",
      requiredPatterns: ["auth\\.getUser\\s*\\("],
      risk: "Critical",
    },
  },
};

const invalidEdgeFunctionAuthPolicyCases: Array<
  [string, (policy: EdgeFunctionAuthPolicy) => void, RegExp]
> = [
  [
    "implicit verify_jwt default",
    (policy) => {
      policy.requireExplicitConfigForAllFunctions = false;
    },
    /explicit config/,
  ],
  [
    "invalid no-JWT kind",
    (policy) => {
      policy.noJwtAllowlist["auth-username-login"].kind = "public";
    },
    /invalid kind/,
  ],
  [
    "invalid required regex",
    (policy) => {
      policy.noJwtAllowlist["auth-username-login"].requiredPatterns = ["("];
    },
    /not a valid regex/,
  ],
  [
    "no-JWT function matching privileged name pattern",
    (policy) => {
      policy.noJwtAllowlist["admin-open-proxy"] = {
        kind: "public-proxy",
        label: "invalid privileged public proxy",
        requiredPatterns: ["rateLimitMiddleware\\s*\\("],
      };
    },
    /conflicts with jwtRequiredNamePatterns/,
  ],
  [
    "invalid service_role kind",
    (policy) => {
      policy.serviceRoleAllowlist["admin-business-rpc"].kind = "admin";
    },
    /service_role policy.*invalid kind/,
  ],
  [
    "invalid service_role risk",
    (policy) => {
      policy.serviceRoleAllowlist["admin-business-rpc"].risk = "Medium";
    },
    /service_role policy.*invalid risk/,
  ],
  [
    "invalid service_role required regex",
    (policy) => {
      policy.serviceRoleAllowlist["admin-business-rpc"].requiredPatterns = [
        "(",
      ];
    },
    /not a valid regex/,
  ],
];

const invalidEdgeFunctionAuthConfigCases: Array<
  [
    string,
    {
      configContent: string;
      expectedCheck: string;
      expectedMessage: string;
      implementedFunctionNames: string[];
    },
  ]
> = [
  [
    "missing verify_jwt contract",
    {
      configContent: "",
      expectedCheck: "Edge Function sem contrato verify_jwt",
      expectedMessage: "secure-rpc existe em supabase/functions",
      implementedFunctionNames: ["secure-rpc"],
    },
  ],
  [
    "unauthorized no-JWT function",
    {
      configContent: `
        [functions.open-proxy]
        verify_jwt = false
      `,
      expectedCheck: "Edge Function sem JWT nao autorizada",
      expectedMessage: "open-proxy declara verify_jwt = false",
      implementedFunctionNames: ["open-proxy"],
    },
  ],
  [
    "allowlisted no-JWT function configured with JWT",
    {
      configContent: `
        [functions.public-status]
        verify_jwt = true
      `,
      expectedCheck: "Edge Function publica sem JWT fora do contrato",
      expectedMessage: "public-status deve declarar verify_jwt = false",
      implementedFunctionNames: ["public-status"],
    },
  ],
  [
    "stale config section",
    {
      configContent: `
        [functions.removed-function]
        verify_jwt = true
      `,
      expectedCheck: "Contrato de Edge Function sem implementacao",
      expectedMessage: "removed-function esta em supabase/config.toml",
      implementedFunctionNames: [],
    },
  ],
  [
    "privileged broker without JWT",
    {
      configContent: `
        [functions.admin-open]
        verify_jwt = false
      `,
      expectedCheck: "Broker privilegiado sem JWT obrigatorio",
      expectedMessage: "admin-open deve declarar verify_jwt = true",
      implementedFunctionNames: ["admin-open"],
    },
  ],
];

const invalidServiceRoleCoverageCases: Array<
  [
    string,
    {
      expectedCheck: string;
      expectedMessage: string;
      implementedFunctionNames: string[];
      serviceRoleFunctionContents: Map<string, string>;
    },
  ]
> = [
  [
    "service_role function without classification",
    {
      expectedCheck: "Edge Function com service_role sem classificacao",
      expectedMessage: "unclassified-function usa service_role",
      implementedFunctionNames: ["unclassified-function"],
      serviceRoleFunctionContents: new Map([
        [
          "unclassified-function",
          "const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); auth.getUser();",
        ],
      ]),
    },
  ],
  [
    "classification without implementation",
    {
      expectedCheck: "Classificacao service_role sem implementacao",
      expectedMessage: "classified-function esta em serviceRoleAllowlist",
      implementedFunctionNames: [],
      serviceRoleFunctionContents: new Map(),
    },
  ],
  [
    "classification without service_role usage",
    {
      expectedCheck: "Classificacao service_role sem uso detectado",
      expectedMessage: "classified-function esta em serviceRoleAllowlist",
      implementedFunctionNames: ["classified-function"],
      serviceRoleFunctionContents: new Map(),
    },
  ],
  [
    "service_role function missing classified control",
    {
      expectedCheck: "Edge Function com service_role sem controle classificado",
      expectedMessage: "classified-function usa service_role",
      implementedFunctionNames: ["classified-function"],
      serviceRoleFunctionContents: new Map([
        [
          "classified-function",
          "const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');",
        ],
      ]),
    },
  ],
];

async function loadEdgeFunctionAuthConfigModule(): Promise<EdgeFunctionAuthConfigModule> {
  return (await import(
    edgeFunctionAuthConfigModulePath
  )) as EdgeFunctionAuthConfigModule;
}

async function loadEdgeFunctionAuthPolicyModule(): Promise<EdgeFunctionAuthPolicyModule> {
  return (await import(
    edgeFunctionAuthPolicyModulePath
  )) as EdgeFunctionAuthPolicyModule;
}

async function loadServiceRoleBoundaryModule(): Promise<ServiceRoleBoundaryModule> {
  return (await import(
    serviceRoleBoundaryModulePath
  )) as ServiceRoleBoundaryModule;
}

async function loadSupabaseAccessBoundaryModule(): Promise<SupabaseAccessBoundaryModule> {
  return (await import(
    supabaseAccessBoundaryModulePath
  )) as SupabaseAccessBoundaryModule;
}

async function loadEdgeFunctionBrokerBoundaryModule(): Promise<EdgeFunctionBrokerBoundaryModule> {
  return (await import(
    edgeFunctionBrokerBoundaryModulePath
  )) as EdgeFunctionBrokerBoundaryModule;
}

async function loadSupabaseAuthHibpModule(): Promise<SupabaseAuthHibpModule> {
  return (await import(supabaseAuthHibpModulePath)) as SupabaseAuthHibpModule;
}

async function loadSupabasePostgisOwnerPreflightModule(): Promise<SupabasePostgisOwnerPreflightModule> {
  return (await import(
    supabasePostgisOwnerPreflightModulePath
  )) as SupabasePostgisOwnerPreflightModule;
}

function createTempMigration(name: string, content: string): MigrationFile {
  const dir = mkdtempSync(join(tmpdir(), "achegue-security-authority-"));
  tempDirs.push(dir);

  const fullPath = join(dir, name);
  writeFileSync(fullPath, content);

  const version = name.match(/^(\d+)_/)?.[1];
  if (!version) throw new Error(`Invalid migration fixture name: ${name}`);

  return { name, version, fullPath };
}

function validateFixture(content: string): string[] {
  const baseline = createTempMigration(
    "20260526000001_harden_security_definer_search_path.sql",
    "-- baseline required by validate-supabase-migrations\n",
  );
  const fixture = createTempMigration(
    "20260707120000_security_authority_probe.sql",
    content,
  );

  return validateMigrationFiles([baseline, fixture]);
}

function validatePostExceptionFixture(content: string): string[] {
  const baseline = createTempMigration(
    "20260526000001_harden_security_definer_search_path.sql",
    "-- baseline required by validate-supabase-migrations\n",
  );
  const fixture = createTempMigration(
    "20260708120000_security_authority_extension_owner_probe.sql",
    content,
  );

  return validateMigrationFiles([baseline, fixture]);
}

function parseField(section: string, field: string): string | null {
  const match = section.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function readMarkdown(path: string): string {
  return readFileSync(path, "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function readSupabaseAuthConfig(): {
  minimumPasswordLength: number;
  passwordRequirements: string;
} {
  const authConfigLines: string[] = [];
  let insideAuthSection = false;

  for (const line of readMarkdown(supabaseConfigPath).split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed === "[auth]") {
      insideAuthSection = true;
      continue;
    }

    if (insideAuthSection && trimmed.startsWith("[") && trimmed.endsWith("]")) {
      break;
    }

    if (insideAuthSection) {
      authConfigLines.push(line);
    }
  }

  const authConfig = authConfigLines.join("\n");
  const minimumPasswordLength = authConfig.match(
    /^minimum_password_length\s*=\s*(\d+)$/m,
  )?.[1];
  const passwordRequirements = authConfig.match(
    /^password_requirements\s*=\s*"([^"]+)"$/m,
  )?.[1];

  if (!minimumPasswordLength || !passwordRequirements) {
    throw new Error(
      "Supabase auth password settings are missing from config.toml",
    );
  }

  return {
    minimumPasswordLength: Number(minimumPasswordLength),
    passwordRequirements,
  };
}

async function readSupabaseFunctionConfigs(): Promise<
  Map<string, EdgeFunctionAuthConfig>
> {
  const { parseSupabaseFunctionAuthConfig } =
    await loadEdgeFunctionAuthConfigModule();
  return parseSupabaseFunctionAuthConfig(readMarkdown(supabaseConfigPath));
}

function readEdgeFunctionNames(): string[] {
  return readdirSync(join(repoRoot, "supabase", "functions"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

function readEdgeFunctionServiceRoleContents(): Map<string, string> {
  const serviceRoleFunctionContents = new Map<string, string>();

  for (const functionName of readEdgeFunctionNames()) {
    const content = readMarkdown(
      join(repoRoot, "supabase", "functions", functionName, "index.ts"),
    );
    if (
      /SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE|getSupabaseAdminClient/.test(
        content,
      )
    ) {
      serviceRoleFunctionContents.set(functionName, content);
    }
  }

  return serviceRoleFunctionContents;
}

function extractConcreteExceptionIds(markdown: string): string[] {
  return Array.from(
    markdown.matchAll(/\bEXC-\d{4}-\d{2}-\d{2}-[A-Z0-9-]+\b/g),
    ([match]) => match,
  );
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("Security Authority migration validator", () => {
  it("requires an explicit Data API decision for new public tables", () => {
    const violations = validateFixture(`
      CREATE TABLE public.security_authority_probe (
        id uuid primary key
      );

      ALTER TABLE public.security_authority_probe ENABLE ROW LEVEL SECURITY;
    `);

    expect(violations).toContainEqual(
      expect.stringContaining(
        "Tabela publica criada sem decisao explicita de acesso Data API",
      ),
    );
  });

  it("accepts a no-data-api marker for an internal public table", () => {
    const violations = validateFixture(`
      -- security-authority: no-data-api public.security_authority_probe
      CREATE TABLE public.security_authority_probe (
        id uuid primary key
      );

      ALTER TABLE public.security_authority_probe ENABLE ROW LEVEL SECURITY;
    `);

    expect(violations).toEqual([]);
  });

  it("accepts explicit grants for a public table exposed through Data API", () => {
    const violations = validateFixture(`
      CREATE TABLE public.security_authority_probe (
        id uuid primary key
      );

      ALTER TABLE public.security_authority_probe ENABLE ROW LEVEL SECURITY;
      GRANT SELECT ON TABLE public.security_authority_probe TO authenticated;
    `);

    expect(violations).toEqual([]);
  });

  it("requires public-rpc classification for anon executable RPC grants", () => {
    const violations = validateFixture(`
      GRANT EXECUTE ON FUNCTION public.security_authority_public_snapshot(uuid) TO anon;
    `);

    expect(violations).toContainEqual(
      expect.stringContaining("RPC concedida a anon/PUBLIC sem classificacao"),
    );
  });

  it("accepts public-rpc classification for anon executable RPC grants", () => {
    const violations = validateFixture(`
      -- security-authority: public-rpc public.security_authority_public_snapshot
      GRANT EXECUTE ON FUNCTION public.security_authority_public_snapshot(uuid) TO anon;
    `);

    expect(violations).toEqual([]);
  });

  it("rejects an exposed mutating SECURITY DEFINER RPC without an auth guard", () => {
    const violations = validateFixture(`
      CREATE OR REPLACE FUNCTION public.update_security_authority_probe(p_value text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      BEGIN
        PERFORM p_value;
      END;
      $$;

      GRANT EXECUTE ON FUNCTION public.update_security_authority_probe(text)
        TO authenticated;
    `);

    expect(violations).toContainEqual(
      expect.stringContaining(
        "RPC mutante SECURITY DEFINER exposto sem guarda de auth",
      ),
    );
  });

  it("models PostgreSQL's default PUBLIC execute privilege for new functions", () => {
    const violations = validateFixture(`
      CREATE OR REPLACE FUNCTION public.update_security_authority_probe(p_value text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      BEGIN
        PERFORM p_value;
      END;
      $$;
    `);

    expect(violations).toContainEqual(
      expect.stringContaining(
        "RPC mutante SECURITY DEFINER exposto sem guarda de auth",
      ),
    );
  });

  it("uses the final ordered GRANT/REVOKE state instead of a closed RPC allowlist", () => {
    const violations = validateFixture(`
      CREATE OR REPLACE FUNCTION public.update_security_authority_probe(p_value text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      BEGIN
        PERFORM p_value;
      END;
      $$;

      GRANT EXECUTE ON FUNCTION public.update_security_authority_probe(text)
        TO authenticated;
      REVOKE ALL ON FUNCTION public.update_security_authority_probe(text)
        FROM PUBLIC, anon, authenticated;
      GRANT EXECUTE ON FUNCTION public.update_security_authority_probe(text)
        TO service_role;
    `);

    expect(violations).toEqual([]);
  });

  it("requires classification for broad anon storage listings", () => {
    const violations = validateFixture(`
      CREATE POLICY "public storage list"
        ON storage.objects
        FOR SELECT
        TO anon
        USING (true);
    `);

    expect(violations).toContainEqual(
      expect.stringContaining(
        "Policy de listagem publica ampla em storage.objects",
      ),
    );
  });

  it("accepts classification for intentionally public storage listings", () => {
    const violations = validateFixture(`
      -- security-authority: public-storage-listing storage.objects
      CREATE POLICY "public storage list"
        ON storage.objects
        FOR SELECT
        TO anon
        USING (true);
    `);

    expect(violations).toEqual([]);
  });

  it("requires extension-owner preflight before touching blocked PostGIS objects", () => {
    const violations = validatePostExceptionFixture(`
      ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
    `);

    expect(violations).toContainEqual(
      expect.stringContaining(
        "Migration toca objeto PostGIS/extension-owner sem preflight vinculado",
      ),
    );
  });

  it("accepts extension-owner preflight marker for approved platform migrations", () => {
    const violations = validatePostExceptionFixture(`
      -- security-authority: extension-owner-preflight EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE
      REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text) FROM anon;
    `);

    expect(violations).toEqual([]);
  });
});

describe("Security Authority Supabase Auth config", () => {
  it("keeps Supabase password requirements aligned with the app password SSOT", () => {
    const authConfig = readSupabaseAuthConfig();

    expect(authConfig.minimumPasswordLength).toBe(PASSWORD_POLICY.MIN_LENGTH);
    expect(authConfig.passwordRequirements).toBe(
      "lower_upper_letters_digits_symbols",
    );
  });

  it("keeps leaked-password checks centralized on the auth compromise helper", () => {
    const passwordMutationSurfaces = [
      "src/app/features/onboarding/hooks/useCadastro.ts",
      "src/app/pages/ResetPasswordPage.tsx",
      "src/core/auth/hooks/usePasswordChange.ts",
    ];
    const allowedDirectHibpImports = new Set([
      "src/core/auth/services/HibpService.ts",
      "src/core/auth/utils/compromisedPassword.ts",
      "src/core/auth/utils/__tests__/compromisedPassword.test.ts",
    ]);

    for (const relativePath of passwordMutationSurfaces) {
      const content = readMarkdown(join(repoRoot, relativePath));
      expect(content).toContain("checkPasswordCompromise");
    }

    const authFiles = [
      "src/core/auth/hooks/usePasswordChange.ts",
      "src/core/auth/utils/authMessages.ts",
      "src/core/auth/utils/passwordPolicy.ts",
      "src/app/features/onboarding/hooks/useCadastro.ts",
      "src/app/pages/ResetPasswordPage.tsx",
    ];

    for (const relativePath of authFiles) {
      if (allowedDirectHibpImports.has(relativePath)) continue;

      const content = readMarkdown(join(repoRoot, relativePath));
      expect(content).not.toContain("HibpService");
      expect(content).not.toContain(".checkPassword(");
    }
  });

  it("keeps the remote HIBP provider check executable through the Management API script", () => {
    const pkg = readJson<{ scripts?: Record<string, string> }>(
      join(repoRoot, "package.json"),
    );
    const scriptContent = readMarkdown(
      join(repoRoot, "scripts", "security", "supabase-auth-hibp.mjs"),
    );

    expect(pkg.scripts?.["security:auth:hibp"]).toBe(
      "node scripts/security/supabase-auth-hibp.mjs --check",
    );
    expect(scriptContent).toContain("/projects/${projectRef}/config/auth");
    expect(scriptContent).toContain("password_hibp_enabled");
    expect(scriptContent).toContain("SUPABASE_ACCESS_TOKEN");
    expect(scriptContent).not.toContain("console.log(token");
    expect(scriptContent).not.toContain("console.error(token");
  });

  it("keeps the remote HIBP operator auditable without leaking PAT values", async () => {
    const {
      createHibpStatus,
      parseArgs,
      validateProjectRef,
      validateTokenEnvName,
    } = await loadSupabaseAuthHibpModule();

    expect(
      parseArgs([
        "--apply",
        "--json",
        "--project-ref",
        "abcdefghijklmnopqrst",
        "--token-env",
        "SUPABASE_ACCESS_TOKEN",
      ]),
    ).toEqual({
      action: "apply",
      json: true,
      projectRef: "abcdefghijklmnopqrst",
      tokenEnv: "SUPABASE_ACCESS_TOKEN",
    });

    expect(() => validateProjectRef("abcdefghijklmnopqrst")).not.toThrow();
    expect(() => validateProjectRef("bad ref!")).toThrow(
      /Project ref invalido/,
    );
    expect(() => validateTokenEnvName("SUPABASE_ACCESS_TOKEN")).not.toThrow();
    expect(() => validateTokenEnvName("bad-token-env")).toThrow(
      /env var invalido/,
    );

    const status = createHibpStatus({
      action: "check",
      enabled: true,
      projectRef: "abcdefghijklmnopqrst",
      tokenEnv: "SUPABASE_ACCESS_TOKEN",
    });

    expect(status).toEqual(
      expect.objectContaining({
        action: "check",
        enabled: true,
        projectRef: "abcdefghijklmnopqrst",
        status: "enabled",
        tokenEnv: "SUPABASE_ACCESS_TOKEN",
      }),
    );
    expect(JSON.stringify(status)).not.toContain("sbp_");
    expect(JSON.stringify(status)).not.toContain("Bearer");

    const blockedStatus = createHibpStatus({
      action: "check",
      blocker: "missing_pat",
      enabled: null,
      message: "PAT ausente.",
      projectRef: "abcdefghijklmnopqrst",
      status: "blocked",
      tokenEnv: "SUPABASE_ACCESS_TOKEN or SUPABASE_MANAGEMENT_API_TOKEN",
    });

    expect(blockedStatus).toEqual(
      expect.objectContaining({
        action: "check",
        blocker: "missing_pat",
        enabled: null,
        status: "blocked",
      }),
    );
    expect(JSON.stringify(blockedStatus)).not.toContain("sbp_");
    expect(JSON.stringify(blockedStatus)).not.toContain("Bearer");
  });
});

describe("Security Authority Edge Function auth config", () => {
  it("keeps no-JWT public Edge Functions explicitly allowlisted and documented", async () => {
    const edgeFunctionAuthPolicy = readJson<EdgeFunctionAuthPolicy>(
      edgeFunctionAuthPolicyPath,
    );
    const {
      EDGE_FUNCTION_NO_JWT_POLICY_KINDS,
      validateEdgeFunctionAuthPolicy,
    } = await loadEdgeFunctionAuthPolicyModule();
    const functionConfigs = await readSupabaseFunctionConfigs();
    const allowedPublicNoJwtEdgeFunctions = Object.keys(
      edgeFunctionAuthPolicy.noJwtAllowlist,
    );
    const jwtRequiredNamePatterns =
      edgeFunctionAuthPolicy.jwtRequiredNamePatterns.map(
        (pattern) => new RegExp(pattern),
      );
    const noJwtFunctions = Array.from(functionConfigs.entries())
      .filter(([, config]) => config.verifyJwt === false)
      .map(([name]) => name)
      .sort();
    const securityModel = readMarkdown(supabaseSecurityModelPath);

    expect(edgeFunctionAuthPolicy.schemaVersion).toBe(
      "edge-function-auth-policy/v1",
    );
    expect(edgeFunctionAuthPolicy.requireExplicitConfigForAllFunctions).toBe(
      true,
    );
    expect(
      edgeFunctionAuthPolicy.jwtRequiredNamePatterns.length,
    ).toBeGreaterThan(0);
    expect(() =>
      validateEdgeFunctionAuthPolicy(edgeFunctionAuthPolicy),
    ).not.toThrow();
    expect(noJwtFunctions).toEqual([...allowedPublicNoJwtEdgeFunctions].sort());

    for (const functionName of allowedPublicNoJwtEdgeFunctions) {
      const policy = edgeFunctionAuthPolicy.noJwtAllowlist[functionName];

      expect(functionName).toMatch(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);
      expect(EDGE_FUNCTION_NO_JWT_POLICY_KINDS.has(policy.kind)).toBe(true);
      expect(policy.label.trim().length).toBeGreaterThan(0);
      expect(policy.requiredPatterns.length).toBeGreaterThan(0);
      expect(
        jwtRequiredNamePatterns.some((pattern) => pattern.test(functionName)),
      ).toBe(false);
      expect(securityModel).toContain(`\`${functionName}\``);
      for (const pattern of policy.requiredPatterns) {
        expect(() => new RegExp(pattern)).not.toThrow();
      }
    }
  });

  it("keeps every service_role Edge Function explicitly classified", async () => {
    const edgeFunctionAuthPolicy = readJson<EdgeFunctionAuthPolicy>(
      edgeFunctionAuthPolicyPath,
    );
    const {
      EDGE_FUNCTION_SERVICE_ROLE_POLICY_KINDS,
      validateEdgeFunctionServiceRoleCoverage,
    } = await loadEdgeFunctionAuthPolicyModule();
    const serviceRoleFunctionContents = readEdgeFunctionServiceRoleContents();
    const serviceRoleFunctionNames = Array.from(
      serviceRoleFunctionContents.keys(),
    ).sort();
    const classifiedFunctionNames = Object.keys(
      edgeFunctionAuthPolicy.serviceRoleAllowlist,
    ).sort();

    expect(classifiedFunctionNames).toEqual(serviceRoleFunctionNames);

    const coverageIssues = validateEdgeFunctionServiceRoleCoverage({
      authPolicy: edgeFunctionAuthPolicy,
      implementedFunctionNames: readEdgeFunctionNames(),
      serviceRoleFunctionContents,
    });
    expect(coverageIssues).toEqual([]);

    for (const [functionName, classification] of Object.entries(
      edgeFunctionAuthPolicy.serviceRoleAllowlist,
    )) {
      expect(
        EDGE_FUNCTION_SERVICE_ROLE_POLICY_KINDS.has(classification.kind),
      ).toBe(true);
      expect(classification.risk).toMatch(/^(Critical|High)$/);
      expect(classification.label.trim().length).toBeGreaterThan(0);
      expect(classification.requiredPatterns.length).toBeGreaterThan(0);

      const content = serviceRoleFunctionContents.get(functionName) ?? "";
      for (const pattern of classification.requiredPatterns) {
        expect(
          new RegExp(pattern).test(content),
          `${functionName} missing ${pattern}`,
        ).toBe(true);
      }
    }
  });

  it.each(invalidEdgeFunctionAuthPolicyCases)(
    "rejects invalid Edge Function auth policy: %s",
    async (_label, mutate, expectedError) => {
      const { validateEdgeFunctionAuthPolicy } =
        await loadEdgeFunctionAuthPolicyModule();
      const invalidPolicy = structuredClone(
        readJson<EdgeFunctionAuthPolicy>(edgeFunctionAuthPolicyPath),
      );

      mutate(invalidPolicy);

      expect(() => validateEdgeFunctionAuthPolicy(invalidPolicy)).toThrow(
        expectedError,
      );
    },
  );

  it.each(invalidEdgeFunctionAuthConfigCases)(
    "rejects invalid Edge Function config contract: %s",
    async (
      _label,
      {
        configContent,
        expectedCheck,
        expectedMessage,
        implementedFunctionNames,
      },
    ) => {
      const { validateEdgeFunctionAuthConfigContract } =
        await loadEdgeFunctionAuthConfigModule();
      const { issues } = validateEdgeFunctionAuthConfigContract({
        authPolicy: structuredClone(baseEdgeFunctionAuthPolicy),
        configContent,
        implementedFunctionNames,
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          check: expectedCheck,
          message: expect.stringContaining(expectedMessage),
          severity: "CRITICO",
        }),
      );
    },
  );

  it.each(invalidServiceRoleCoverageCases)(
    "rejects invalid service_role coverage: %s",
    async (
      _label,
      {
        expectedCheck,
        expectedMessage,
        implementedFunctionNames,
        serviceRoleFunctionContents,
      },
    ) => {
      const { validateEdgeFunctionServiceRoleCoverage } =
        await loadEdgeFunctionAuthPolicyModule();
      const issues = validateEdgeFunctionServiceRoleCoverage({
        authPolicy: structuredClone(baseServiceRoleAuthPolicy),
        implementedFunctionNames,
        serviceRoleFunctionContents,
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          check: expectedCheck,
          message: expect.stringContaining(expectedMessage),
          severity: "CRITICO",
        }),
      );
    },
  );

  it("keeps every Edge Function explicitly configured for JWT verification", async () => {
    const functionConfigs = await readSupabaseFunctionConfigs();
    const edgeFunctionNames = readEdgeFunctionNames();
    const configuredFunctionNames = Array.from(functionConfigs.keys()).sort();

    expect(configuredFunctionNames).toEqual(edgeFunctionNames);

    for (const functionName of edgeFunctionNames) {
      expect(functionConfigs.get(functionName)?.verifyJwt).not.toBeUndefined();
    }
  });

  it("requires configured admin and RPC broker Edge Functions to verify JWTs", async () => {
    const functionConfigs = await readSupabaseFunctionConfigs();
    const unsafeBrokers = Array.from(functionConfigs.entries())
      .filter(([name]) => name.startsWith("admin-") || name.endsWith("-rpc"))
      .filter(([, config]) => config.verifyJwt !== true)
      .map(([name]) => name);

    expect(unsafeBrokers).toEqual([]);
  });
});

describe("Security Authority service_role boundary", () => {
  it("keeps the service_role boundary policy aligned with the validator", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const {
      SERVICE_ROLE_BOUNDARY_PATTERN_IDS,
      validateServiceRoleBoundaryPolicy,
    } = await loadServiceRoleBoundaryModule();

    expect(serviceRoleBoundaryPolicy.schemaVersion).toBe(
      "service-role-boundary-policy/v1",
    );
    expect(() =>
      validateServiceRoleBoundaryPolicy(serviceRoleBoundaryPolicy),
    ).not.toThrow();

    for (const patternId of serviceRoleBoundaryPolicy.trackedPatternIds) {
      expect(SERVICE_ROLE_BOUNDARY_PATTERN_IDS.has(patternId)).toBe(true);
    }

    expect(
      serviceRoleBoundaryPolicy.allowedPrefixes.some(
        (entry) => entry.prefix === "supabase/functions/",
      ),
    ).toBe(true);
    expect(
      serviceRoleBoundaryPolicy.allowedPaths.some(
        (entry) => entry.path === "api/_shared/supabaseAdmin.ts",
      ),
    ).toBe(true);
    expect(
      serviceRoleBoundaryPolicy.allowedPaths.some(
        (entry) => entry.path === "src/integrations/supabase/supabase.ts",
      ),
    ).toBe(true);
  });

  it("rejects service_role env access in browser source", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "src/app/leak.ts",
          content: "const key = process.env.SUPABASE_SERVICE_ROLE_KEY;",
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        check: "Fronteira service_role violada",
        file: "src/app/leak.ts",
        severity: "CRITICO",
      }),
    );
  });

  it("rejects service_role literals in public assets", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "public/config.js",
          content: 'window.__env = { keyName: "SUPABASE_SERVICE_ROLE_KEY" };',
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        check: "Fronteira service_role violada",
        file: "public/config.js",
        severity: "CRITICO",
      }),
    );
  });

  it("allows the shared API admin helper boundary", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "api/_shared/supabaseAdmin.ts",
          content:
            "import { createClient } from '@supabase/supabase-js'; const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');",
        },
      ],
    });

    expect(issues).toEqual([]);
  });

  it("allows only the canonical browser Supabase client to import createClient", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "src/integrations/supabase/supabase.ts",
          content:
            'import { createClient } from "@supabase/supabase-js"; export const supabase = createClient(url, key);',
        },
      ],
    });

    expect(issues).toEqual([]);
  });

  it("allows only Supabase integration internals to import or re-export supabase-js package types", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "src/integrations/supabase/index.ts",
          content:
            'export type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";',
        },
        {
          path: "src/integrations/supabase/cookieStorage.ts",
          content:
            'import type { SupportedStorage } from "@supabase/supabase-js";',
        },
      ],
    });

    expect(issues).toEqual([]);
  });

  it("rejects direct supabase-js type imports outside the Supabase integration boundary", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "src/core/session/services/unsafe-types.ts",
          content: 'import type { Session } from "@supabase/supabase-js";',
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/core/session/services/unsafe-types.ts",
        message: expect.stringContaining(
          "import/export direto do pacote supabase-js no runtime",
        ),
        severity: "CRITICO",
      }),
    );
  });

  it("rejects createClient imports or reexports outside the canonical browser Supabase client", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "src/core/business/services/unsafe-client.ts",
          content:
            'import { createClient } from "@supabase/supabase-js"; export const client = createClient(url, key);',
        },
        {
          path: "src/integrations/supabase/index.ts",
          content: 'export { createClient } from "@supabase/supabase-js";',
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/core/business/services/unsafe-client.ts",
        message: expect.stringContaining(
          "import/export de factory createClient Supabase no browser",
        ),
        severity: "CRITICO",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/integrations/supabase/index.ts",
        message: expect.stringContaining(
          "import/export de factory createClient Supabase no browser",
        ),
        severity: "CRITICO",
      }),
    );
  });

  it("rejects createClient imports in API runtime outside the shared admin helper", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "api/unsafe-admin.ts",
          content: 'import { createClient } from "@supabase/supabase-js";',
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "api/unsafe-admin.ts",
        message: expect.stringContaining(
          "import de factory createClient Supabase em API serverless",
        ),
        severity: "CRITICO",
      }),
    );
  });

  it("allows only the runtime script Supabase helper to read service_role env values", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "scripts/lib/supabase-client.mjs",
          content: "const key = process.env.SUPABASE_SERVICE_ROLE_KEY;",
        },
      ],
    });

    expect(issues).toEqual([]);
  });

  it("rejects direct service_role env access in the typed script facade", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "scripts/lib/supabase-client.ts",
          content: "const key = process.env.SUPABASE_SERVICE_ROLE_KEY;",
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "scripts/lib/supabase-client.ts",
        message: expect.stringContaining("service-role-env-access"),
        severity: "CRITICO",
      }),
    );
  });

  it("rejects direct service_role env access in migrated operator scripts", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "scripts/backup-storage.ts",
          content: "const key = process.env.SUPABASE_SERVICE_ROLE_KEY;",
        },
        {
          path: "scripts/validate-gate3-metadata.mjs",
          content: "const key = process.env.SUPABASE_SERVICE_ROLE_KEY;",
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "scripts/backup-storage.ts",
        message: expect.stringContaining("service-role-env-access"),
        severity: "CRITICO",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "scripts/validate-gate3-metadata.mjs",
        message: expect.stringContaining("service-role-env-access"),
        severity: "CRITICO",
      }),
    );
  });

  it("allows only the operational env helper to read E2E service_role env aliases", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "tests/helpers/operational-env.ts",
          content:
            "const key = readEnv('SUPABASE_SERVICE_ROLE_KEY') || readEnv('SUPABASE_SECRET_KEY');",
        },
      ],
    });

    expect(issues).toEqual([]);
  });

  it("allows only the operational env helper to create E2E Supabase clients", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "tests/helpers/operational-env.ts",
          content:
            "const url = readEnv('VITE_SUPABASE_URL'); const key = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY'); return createClient(url, key);",
        },
      ],
    });

    expect(issues).toEqual([]);
  });

  it("rejects direct Supabase publishable env access in E2E specs", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "tests/e2e/gastronomy-operational.spec.ts",
          content:
            "const url = process.env.VITE_SUPABASE_URL; const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;",
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "tests/e2e/gastronomy-operational.spec.ts",
        message: expect.stringContaining("operational-supabase-env-access"),
        severity: "CRITICO",
      }),
    );
  });

  it("rejects direct Supabase client creation in E2E and operational tests", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "tests/e2e/business-recommendation-operational.spec.ts",
          content: "const client = createClient(url, key);",
        },
        {
          path: "tests/operational/gate2-validation.test.ts",
          content: "const client = createClient(url, key);",
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "tests/e2e/business-recommendation-operational.spec.ts",
        message: expect.stringContaining("operational-supabase-client-factory"),
        severity: "CRITICO",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "tests/operational/gate2-validation.test.ts",
        message: expect.stringContaining("operational-supabase-client-factory"),
        severity: "CRITICO",
      }),
    );
  });

  it("allows only the script Supabase helper to create script clients", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "scripts/lib/supabase-client.mjs",
          content:
            "return createClient(url, key, { auth: { persistSession: false } });",
        },
      ],
    });

    expect(issues).toEqual([]);
  });

  it("rejects direct Supabase client creation in operational scripts", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "scripts/validate-comment-likes.mjs",
          content: "const client = createClient(url, key);",
        },
        {
          path: "scripts/economic-benchmark-ssot.mjs",
          content:
            "const candidate = createClient(apiCandidate.url, apiCandidate.key);",
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "scripts/validate-comment-likes.mjs",
        message: expect.stringContaining(
          "criacao direta de cliente Supabase em script",
        ),
        severity: "CRITICO",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "scripts/economic-benchmark-ssot.mjs",
        message: expect.stringContaining("script-supabase-client-factory"),
        severity: "CRITICO",
      }),
    );
  });

  it("rejects direct service_role env access in E2E specs", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "tests/e2e/gastronomy-onboarding.spec.ts",
          content: "const key = process.env.SUPABASE_SERVICE_ROLE_KEY;",
        },
        {
          path: "tests/helpers/education-setup.ts",
          content: "const key = process.env.SUPABASE_SECRET_KEY;",
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "tests/e2e/gastronomy-onboarding.spec.ts",
        message: expect.stringContaining("service-role-env-access"),
        severity: "CRITICO",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "tests/helpers/education-setup.ts",
        message: expect.stringContaining("service-role-env-access"),
        severity: "CRITICO",
      }),
    );
  });

  it("does not let audit-history paths access service_role env values", async () => {
    const serviceRoleBoundaryPolicy = readJson<ServiceRoleBoundaryPolicy>(
      serviceRoleBoundaryPolicyPath,
    );
    const { validateServiceRoleBoundaryFiles } =
      await loadServiceRoleBoundaryModule();

    const issues = validateServiceRoleBoundaryFiles({
      policy: serviceRoleBoundaryPolicy,
      files: [
        {
          path: "src/config/security.config.ts",
          content: "const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;",
        },
      ],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/config/security.config.ts",
        message: expect.stringContaining("service-role-env-access"),
        severity: "CRITICO",
      }),
    );
  });

  it("scans runtime boundary files while skipping local env files", async () => {
    const { shouldScanServiceRoleBoundaryFile } =
      await loadServiceRoleBoundaryModule();

    expect(shouldScanServiceRoleBoundaryFile("src/app/App.tsx")).toBe(true);
    expect(
      shouldScanServiceRoleBoundaryFile("api/_shared/supabaseAdmin.ts"),
    ).toBe(true);
    expect(
      shouldScanServiceRoleBoundaryFile("tests/e2e/gastronomy.spec.ts"),
    ).toBe(true);
    expect(
      shouldScanServiceRoleBoundaryFile("tests/helpers/operational-env.ts"),
    ).toBe(true);
    expect(shouldScanServiceRoleBoundaryFile(".env.local")).toBe(false);
    expect(shouldScanServiceRoleBoundaryFile("node_modules/pkg/index.js")).toBe(
      false,
    );
  });
});

describe("Security Authority Supabase UI access boundary", () => {
  it("rejects direct Supabase access from UI layer files", async () => {
    const { validateSupabaseAccessBoundaryFiles } =
      await loadSupabaseAccessBoundaryModule();

    const issues = validateSupabaseAccessBoundaryFiles([
      {
        path: "src/modules/business/gastronomy/pages/UnsafePage.tsx",
        content:
          "import { supabase } from '@/integrations/supabase'; export async function load() { return supabase.from('orders').select('*'); }",
      },
      {
        path: "src/core/community/components/UnsafeCard.tsx",
        content:
          "import { supabase } from '@/integrations/supabase'; export const save = () => supabase.rpc('unsafe_rpc');",
      },
      {
        path: "src/core/profiles/hooks/useUnsafeProfile.ts",
        content:
          "import { supabase } from '@/integrations/supabase'; export const run = () => supabase.auth.getUser();",
      },
    ]);

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/modules/business/gastronomy/pages/UnsafePage.tsx",
        message: expect.stringContaining("chama Supabase diretamente"),
        severity: "CRITICO",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/core/community/components/UnsafeCard.tsx",
        message: expect.stringContaining("chama Supabase diretamente"),
        severity: "CRITICO",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/core/profiles/hooks/useUnsafeProfile.ts",
        message: expect.stringContaining("chama Supabase diretamente"),
        severity: "CRITICO",
      }),
    );
  });

  it("allows direct Supabase access in domain services and repository boundaries", async () => {
    const { validateSupabaseAccessBoundaryFiles } =
      await loadSupabaseAccessBoundaryModule();

    const issues = validateSupabaseAccessBoundaryFiles([
      {
        path: "src/modules/business/gastronomy/services/OrderService.ts",
        content:
          "import { supabase } from '@/integrations/supabase'; export async function load() { return supabase.from('orders').select('*'); }",
      },
      {
        path: "src/core/infrastructure/database/repositories/RideRepository.ts",
        content:
          "import { supabase } from '@/integrations/supabase'; export const load = () => supabase.rpc('safe_domain_rpc');",
      },
      {
        path: "src/modules/business/gastronomy/pages/OrderPage.spec.tsx",
        content:
          "vi.mock('@/integrations/supabase', () => ({ supabase: { from: vi.fn() } }));",
      },
    ]);

    expect(issues).toEqual([]);
  });

  it("scans only runtime UI layers for direct Supabase access", async () => {
    const { shouldScanSupabaseAccessBoundaryFile } =
      await loadSupabaseAccessBoundaryModule();

    expect(
      shouldScanSupabaseAccessBoundaryFile(
        "src/modules/business/gastronomy/pages/OrdersPage.tsx",
      ),
    ).toBe(true);
    expect(
      shouldScanSupabaseAccessBoundaryFile(
        "src/core/community/components/CommunityFeed.tsx",
      ),
    ).toBe(true);
    expect(
      shouldScanSupabaseAccessBoundaryFile(
        "src/core/profiles/hooks/useProfileHub.ts",
      ),
    ).toBe(true);
    expect(
      shouldScanSupabaseAccessBoundaryFile(
        "src/modules/business/gastronomy/services/OrderService.ts",
      ),
    ).toBe(false);
    expect(
      shouldScanSupabaseAccessBoundaryFile(
        "src/modules/business/gastronomy/pages/OrdersPage.spec.tsx",
      ),
    ).toBe(false);
  });
});

describe("Security Authority Edge Function broker boundary", () => {
  it("rejects direct broker envelopes outside the canonical helper", async () => {
    const { validateEdgeFunctionBrokerBoundaryFiles } =
      await loadEdgeFunctionBrokerBoundaryModule();

    const issues = validateEdgeFunctionBrokerBoundaryFiles([
      {
        path: "src/core/profiles/services/UnsafeProfileRpcService.ts",
        content:
          "import { supabase } from '@/integrations/supabase'; export async function run(action, params) { return supabase.functions.invoke('profile-rpc', { body: { action, params } }); }",
      },
      {
        path: "src/core/admin/services/UnsafeAdminRpcService.ts",
        content:
          "import { supabase } from '@/integrations/supabase'; export async function run(action, params) { return supabase.functions.invoke('admin-rpc', { body: { params, action } }); }",
      },
    ]);

    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/core/profiles/services/UnsafeProfileRpcService.ts",
        message: expect.stringContaining("fora do helper canonico"),
        severity: "CRITICO",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        file: "src/core/admin/services/UnsafeAdminRpcService.ts",
        message: expect.stringContaining("fora do helper canonico"),
        severity: "CRITICO",
      }),
    );
  });

  it("allows the canonical helper and non-broker Edge Function payloads", async () => {
    const { validateEdgeFunctionBrokerBoundaryFiles } =
      await loadEdgeFunctionBrokerBoundaryModule();

    const issues = validateEdgeFunctionBrokerBoundaryFiles([
      {
        path: "src/core/infrastructure/edge-functions/edgeFunctionBroker.ts",
        content:
          "import { supabase } from '@/integrations/supabase'; export async function invoke(action, params) { return supabase.functions.invoke('profile-rpc', { body: { action, params } }); }",
      },
      {
        path: "src/core/billing/services/BillingCheckoutService.ts",
        content:
          "import { supabase } from '@/integrations/supabase'; export async function checkout(planCode) { return supabase.functions.invoke('billing-checkout', { body: { planCode } }); }",
      },
      {
        path: "src/core/profiles/services/ProfileRpcService.test.ts",
        content:
          "expect(supabase.functions.invoke).toHaveBeenCalledWith('profile-rpc', { body: { action, params } });",
      },
    ]);

    expect(issues).toEqual([]);
  });

  it("scans runtime source files while skipping tests and the canonical helper", async () => {
    const { shouldScanEdgeFunctionBrokerBoundaryFile } =
      await loadEdgeFunctionBrokerBoundaryModule();

    expect(
      shouldScanEdgeFunctionBrokerBoundaryFile(
        "src/core/profiles/services/ProfileRpcService.ts",
      ),
    ).toBe(true);
    expect(
      shouldScanEdgeFunctionBrokerBoundaryFile(
        "src/core/business/services/BusinessReviewService.ts",
      ),
    ).toBe(true);
    expect(
      shouldScanEdgeFunctionBrokerBoundaryFile(
        "src/core/infrastructure/edge-functions/edgeFunctionBroker.ts",
      ),
    ).toBe(false);
    expect(
      shouldScanEdgeFunctionBrokerBoundaryFile(
        "src/core/profiles/services/ProfileRpcService.test.ts",
      ),
    ).toBe(false);
    expect(
      shouldScanEdgeFunctionBrokerBoundaryFile("scripts/security/check.mjs"),
    ).toBe(false);
  });
});

describe("Security Authority exception register", () => {
  it("requires formal exceptions to keep owner, dates, mitigation and evidence", () => {
    const markdown = readMarkdown(exceptionRegisterPath);
    const exceptionSections = Array.from(
      markdown.matchAll(
        /(?:^|\r?\n)## (EXC-\d{4}-\d{2}-\d{2}-[A-Z0-9-]+)\r?\n([\s\S]*?)(?=\r?\n## |$)/g,
      ),
      ([, id, body]) => ({ id, body }),
    );

    expect(exceptionSections.length).toBeGreaterThan(0);

    const allowedStatuses = new Set(["aberta", "fechada"]);
    const allowedRisks = new Set(["Critical", "High", "Medium", "Low"]);
    const allowedAreas = new Set([
      "Supabase",
      "Auth",
      "Storage",
      "Routes",
      "PII",
      "Other",
    ]);
    const allowedValidationScopes = new Set(["local", "remota"]);
    const requiredSubsections = [
      "Contexto",
      "Regra Afetada",
      "Risco",
      "Mitigacao Temporaria",
      "Plano De Remocao",
      "Evidencias",
    ];
    const today = startOfTodayUtc();
    const expiredLocalExceptions: string[] = [];
    const expiredRemoteExceptions: string[] = [];

    for (const { id, body } of exceptionSections) {
      const status = parseField(body, "Status");
      const risk = parseField(body, "Risco");
      const area = parseField(body, "Area");
      const owner = parseField(body, "Responsavel");
      const createdAt = parseField(body, "Criada em");
      const validUntil = parseField(body, "Valida ate");
      const validationScope = parseField(body, "Validacao");

      expect(status, `${id} status`).toSatisfy(
        (value: string | null) => value !== null && allowedStatuses.has(value),
      );
      expect(risk, `${id} risk`).toSatisfy(
        (value: string | null) => value !== null && allowedRisks.has(value),
      );
      expect(area, `${id} area`).toSatisfy(
        (value: string | null) => value !== null && allowedAreas.has(value),
      );
      expect(owner, `${id} owner`).toSatisfy(
        (value: string | null) => value !== null && value.length > 0,
      );
      expect(validationScope, `${id} validation scope`).toSatisfy(
        (value: string | null) =>
          value !== null && allowedValidationScopes.has(value),
      );

      const createdDate = createdAt ? parseIsoDate(createdAt) : null;
      const validUntilDate = validUntil ? parseIsoDate(validUntil) : null;

      expect(createdDate, `${id} created date`).not.toBeNull();
      expect(validUntilDate, `${id} valid-until date`).not.toBeNull();

      if (createdDate && validUntilDate) {
        expect(
          validUntilDate.getTime(),
          `${id} expiration before creation`,
        ).toBeGreaterThanOrEqual(createdDate.getTime());

        if (status === "aberta" && validUntilDate.getTime() < today.getTime()) {
          if (validationScope === "remota") {
            expiredRemoteExceptions.push(id);
          } else {
            expiredLocalExceptions.push(id);
          }
        }
      }

      for (const subsection of requiredSubsections) {
        expect(body, `${id} missing subsection ${subsection}`).toContain(
          `### ${subsection}`,
        );
      }
    }

    expect(
      expiredLocalExceptions,
      `LOCAL_FAILURE: excecoes locais abertas e vencidas: ${expiredLocalExceptions.join(", ")}`,
    ).toEqual([]);
    expect(
      expiredRemoteExceptions,
      `REMOTE_VALIDATION_REQUIRED: excecoes abertas e vencidas exigem evidencia externa: ${expiredRemoteExceptions.join(", ")}`,
    ).toEqual([]);
  });

  it("keeps referenced exception ids defined in the canonical register", () => {
    const registerMarkdown = readMarkdown(exceptionRegisterPath);
    const definedIds = new Set(extractConcreteExceptionIds(registerMarkdown));
    const documentsWithExceptionReferences = [
      exceptionRegisterPath,
      join(repoRoot, "docs", "01-product", "STATUS.md"),
      join(
        repoRoot,
        "docs",
        "10-archive",
        "audits",
        "SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md",
      ),
      join(
        repoRoot,
        "docs",
        "10-archive",
        "audits",
        "SECURITY_AUTHORITY_PILOT_2026-07-07.md",
      ),
      join(
        repoRoot,
        "docs",
        "09-reference",
        "governance",
        "security",
        "SUPABASE_SECURITY_MODEL.md",
      ),
      advisorResidualRegisterPath,
      join(repoRoot, "plans", "SECURITY_AUTHORITY_IMPLEMENTATION_PLAN.md"),
    ];

    const referencedIds = new Set(
      documentsWithExceptionReferences.flatMap((path) =>
        extractConcreteExceptionIds(readMarkdown(path)),
      ),
    );
    const missingIds = Array.from(referencedIds).filter(
      (id) => !definedIds.has(id),
    );

    expect(missingIds).toEqual([]);
  });

  it("keeps Supabase Advisor residual allowlist canonical and exception-backed", () => {
    const registerMarkdown = readMarkdown(exceptionRegisterPath);
    const definedExceptionIds = new Set(
      extractConcreteExceptionIds(registerMarkdown),
    );
    const residualRegister = readJson<{
      residuals: Array<{
        cacheKey?: string;
        exceptionId?: string;
        summary?: string;
      }>;
      schemaVersion?: string;
      sourceCommand?: string;
      updatedAt?: string;
    }>(advisorResidualRegisterPath);

    expect(residualRegister.schemaVersion).toBe(
      "supabase-advisor-residuals/v1",
    );
    expect(residualRegister.sourceCommand).toBe(
      "supabase db advisors --linked --type security --fail-on none --output json",
    );
    expect(residualRegister.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(residualRegister.residuals.length).toBeGreaterThan(0);

    const cacheKeys = residualRegister.residuals.map(
      (residual) => residual.cacheKey,
    );
    expect(new Set(cacheKeys).size).toBe(cacheKeys.length);

    for (const residual of residualRegister.residuals) {
      expect(residual.cacheKey).toSatisfy(
        (value: string | undefined) =>
          typeof value === "string" && value.length > 0,
      );
      expect(residual.exceptionId).toSatisfy(
        (value: string | undefined) =>
          typeof value === "string" && definedExceptionIds.has(value),
      );
      expect(residual.summary).toSatisfy(
        (value: string | undefined) =>
          typeof value === "string" && value.length > 0,
      );
    }
  });
});

describe("Supabase Advisor residual validator", () => {
  it("accepts an offline Advisor export containing known residual findings", () => {
    const findings = parseAdvisorFindings(
      readMarkdown(advisorKnownResidualFixturePath),
    );
    const result = validateAdvisorFindings(
      findings,
      loadAllowedResidualCacheKeys(),
    );

    expect(result.unknownFindings).toEqual([]);
    expect(result.currentKeys.has("auth_leaked_password_protection")).toBe(
      true,
    );
    expect(result.resolvedKnownFindings.length).toBeGreaterThan(0);
  });

  it("reports an offline Advisor export containing an unmapped finding", () => {
    const findings = parseAdvisorFindings(`
      [
        {
          "cache_key": "new_unmapped_security_finding",
          "detail": "Unexpected security finding.",
          "level": "ERROR",
          "name": "new_unmapped_security_finding",
          "title": "Unexpected Security Finding"
        }
      ]
      A new version of Supabase CLI is available.
    `);
    const result = validateAdvisorFindings(
      findings,
      loadAllowedResidualCacheKeys(),
    );

    expect(result.unknownFindings).toHaveLength(1);
    expect(result.unknownFindings[0].cache_key).toBe(
      "new_unmapped_security_finding",
    );
  });
});

describe("Supabase PostGIS owner preflight", () => {
  it("keeps the PostGIS owner preflight read-only and wired as an operational command", async () => {
    const pkg = readJson<{ scripts?: Record<string, string> }>(
      join(repoRoot, "package.json"),
    );
    const { buildPostgisOwnerPreflightSql, parseArgs, parseSupabaseQueryJson } =
      await loadSupabasePostgisOwnerPreflightModule();

    const sql = buildPostgisOwnerPreflightSql();

    expect(pkg.scripts?.["security:postgis:preflight"]).toBe(
      "node scripts/security/supabase-postgis-owner-preflight.mjs --json",
    );
    expect(parseArgs(["--json", "--fail-if-blocked"])).toEqual({
      failIfBlocked: true,
      json: true,
    });
    expect(sql).toMatch(/pg_extension/);
    expect(sql).toMatch(/spatial_ref_sys/);
    expect(sql).toMatch(/st_estimatedextent/);
    expect(sql).not.toMatch(
      /\b(?:ALTER|REVOKE|GRANT|DROP|CREATE|UPDATE|DELETE|INSERT|TRUNCATE)\b/i,
    );

    expect(
      parseSupabaseQueryJson(`
        {
          "boundary": "test",
          "rows": [{ "role_context": { "current_user": "postgres" } }],
          "warning": "untrusted"
        }
        A new version of Supabase CLI is available.
      `),
    ).toEqual({ role_context: { current_user: "postgres" } });
  });

  it("blocks extension-owner migration markers when the current role does not own residual PostGIS objects", async () => {
    const { evaluatePostgisOwnerPreflight, normalizePostgisPreflightRow } =
      await loadSupabasePostgisOwnerPreflightModule();

    const snapshot = normalizePostgisPreflightRow({
      role_context: {
        current_user: "postgres",
        current_user_is_superuser: false,
      },
      extensions: [
        {
          extname: "postgis",
          extension_owner: "supabase_admin",
          extension_schema: "public",
        },
      ],
      spatial_ref_sys: [
        {
          rls_enabled: false,
          table_name: "spatial_ref_sys",
          table_owner: "supabase_admin",
          table_schema: "public",
        },
      ],
      st_estimatedextent: [
        {
          anon_execute: true,
          authenticated_execute: true,
          function_owner: "supabase_admin",
          signature: "st_estimatedextent(text,text)",
        },
      ],
    });

    const result = evaluatePostgisOwnerPreflight(snapshot);

    expect(result.exceptionId).toBe("EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE");
    expect(result.status).toBe("blocked");
    expect(result.ready).toBe(false);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          object: "extension:postgis",
          ready: false,
          risk: "extension_in_public",
        }),
        expect.objectContaining({
          object: "public.spatial_ref_sys",
          ready: false,
          risk: "rls_disabled",
        }),
        expect.objectContaining({
          object: "public.st_estimatedextent(text,text)",
          ready: false,
          risk: "public_execute_security_definer",
        }),
      ]),
    );
  });

  it("marks PostGIS owner preflight ready only when residual objects are owned by the current role", async () => {
    const { evaluatePostgisOwnerPreflight } =
      await loadSupabasePostgisOwnerPreflightModule();

    const result = evaluatePostgisOwnerPreflight({
      roleContext: {
        current_user: "supabase_admin",
        current_user_is_superuser: false,
      },
      extensions: [
        {
          extname: "postgis",
          extension_owner: "supabase_admin",
          extension_schema: "public",
        },
      ],
      spatialRefSys: [
        {
          rls_enabled: false,
          table_name: "spatial_ref_sys",
          table_owner: "supabase_admin",
          table_schema: "public",
        },
      ],
      stEstimatedExtent: [
        {
          anon_execute: true,
          authenticated_execute: false,
          function_owner: "supabase_admin",
          signature: "st_estimatedextent(text,text)",
        },
      ],
    });

    expect(result.status).toBe("ready");
    expect(result.ready).toBe(true);
    expect(result.findings.every((finding) => finding.ready)).toBe(true);
  });
});

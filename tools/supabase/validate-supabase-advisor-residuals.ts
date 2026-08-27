import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runSupabaseCli } from "./supabase-cli-runner.mjs";

export interface AdvisorFinding {
  cache_key?: string;
  detail?: string;
  level?: string;
  name?: string;
  title?: string;
}

export interface AdvisorResidual {
  cacheKey: string;
  exceptionId: string;
  summary: string;
}

export interface AdvisorResidualRegister {
  residuals: AdvisorResidual[];
  schemaVersion: string;
  sourceCommand: string;
  updatedAt: string;
}

export interface AdvisorResidualValidationResult {
  currentKeys: Set<string>;
  findings: AdvisorFinding[];
  resolvedKnownFindings: string[];
  unknownFindings: AdvisorFinding[];
}

interface CliOptions {
  advisorJsonPath?: string;
}

const RESIDUAL_REGISTER_PATH = join(
  process.cwd(),
  "docs",
  "09-reference",
  "governance",
  "security",
  "SUPABASE_ADVISOR_RESIDUALS.json",
);

export function loadAllowedResidualCacheKeys(): Set<string> {
  const register = JSON.parse(
    readFileSync(RESIDUAL_REGISTER_PATH, "utf8"),
  ) as AdvisorResidualRegister;

  if (register.schemaVersion !== "supabase-advisor-residuals/v1") {
    throw new Error(
      `Schema invalido em ${RESIDUAL_REGISTER_PATH}: ${register.schemaVersion}`,
    );
  }

  if (!Array.isArray(register.residuals) || register.residuals.length === 0) {
    throw new Error(`Nenhum residual mapeado em ${RESIDUAL_REGISTER_PATH}.`);
  }

  const cacheKeys = register.residuals.map((residual) => residual.cacheKey);
  const duplicateKeys = cacheKeys.filter(
    (key, index) => cacheKeys.indexOf(key) !== index,
  );

  if (duplicateKeys.length > 0) {
    throw new Error(
      `Cache keys duplicadas em ${RESIDUAL_REGISTER_PATH}: ${Array.from(
        new Set(duplicateKeys),
      ).join(", ")}`,
    );
  }

  return new Set(cacheKeys);
}

function runSupabaseAdvisor(): string {
  const result = runSupabaseCli(
    [
      "db",
      "advisors",
      "--linked",
      "--type",
      "security",
      "--fail-on",
      "none",
      "--output",
      "json",
    ],
    {
      cwd: process.cwd(),
    },
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  if (result.error) {
    throw new Error(`Falha ao executar Supabase CLI: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      [
        "Falha ao consultar Supabase Advisor remoto.",
        "Comando: supabase db advisors --linked --type security --fail-on none --output json",
        output.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return output;
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--advisor-json") {
      const advisorJsonPath = args[index + 1];
      if (!advisorJsonPath) {
        throw new Error("Use --advisor-json <arquivo>.");
      }

      options.advisorJsonPath = advisorJsonPath;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Uso:",
          "  npm run security:advisor:residuals",
          "  npm run security:advisor:residuals -- --advisor-json caminho/advisor.json",
          "",
          "Sem --advisor-json, o comando consulta o Supabase Advisor remoto do projeto linkado.",
        ].join("\n"),
      );
      process.exit(0);
    }

    throw new Error(`Argumento desconhecido: ${arg}`);
  }

  return options;
}

function readAdvisorOutput(options: CliOptions): string {
  if (!options.advisorJsonPath) {
    return runSupabaseAdvisor();
  }

  return readFileSync(options.advisorJsonPath, "utf8");
}

function extractJsonArray(output: string): string {
  const start = output.indexOf("[");
  if (start < 0) {
    throw new Error("Supabase Advisor nao retornou JSON array.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < output.length; index += 1) {
    const char = output[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return output.slice(start, index + 1);
      }
    }
  }

  throw new Error("Supabase Advisor retornou JSON incompleto.");
}

export function parseAdvisorFindings(output: string): AdvisorFinding[] {
  const parsed = JSON.parse(extractJsonArray(output));
  if (!Array.isArray(parsed)) {
    throw new Error("Supabase Advisor JSON nao e um array.");
  }

  return parsed as AdvisorFinding[];
}

export function findingKey(finding: AdvisorFinding): string {
  return (
    finding.cache_key ??
    `${finding.name ?? "<sem nome>"}: ${finding.detail ?? "<sem detalhe>"}`
  );
}

export function validateAdvisorFindings(
  findings: AdvisorFinding[],
  allowedResidualCacheKeys: Set<string>,
): AdvisorResidualValidationResult {
  const unknownFindings = findings.filter(
    (finding) => !allowedResidualCacheKeys.has(findingKey(finding)),
  );
  const currentKeys = new Set(findings.map(findingKey));
  const resolvedKnownFindings = Array.from(allowedResidualCacheKeys).filter(
    (key) => !currentKeys.has(key),
  );

  return {
    currentKeys,
    findings,
    resolvedKnownFindings,
    unknownFindings,
  };
}

export function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const allowedResidualCacheKeys = loadAllowedResidualCacheKeys();
  const result = validateAdvisorFindings(
    parseAdvisorFindings(readAdvisorOutput(options)),
    allowedResidualCacheKeys,
  );

  if (result.unknownFindings.length > 0) {
    console.error("Supabase Advisor remoto retornou achados nao mapeados:\n");
    for (const finding of result.unknownFindings) {
      console.error(`- ${finding.level ?? "UNKNOWN"} ${findingKey(finding)}`);
      if (finding.detail) console.error(`  ${finding.detail}`);
    }
    console.error("");
    console.error(
      "Corrija o achado ou registre uma excecao formal em docs/09-reference/governance/security/EXCEPTIONS.md.",
    );
    process.exit(1);
  }

  console.log(
    `Advisor validado: ${result.findings.length} achado(s), todos dentro dos residuais mapeados.`,
  );

  if (result.resolvedKnownFindings.length > 0) {
    console.log("Achados residuais mapeados que ja nao aparecem:");
    for (const key of result.resolvedKnownFindings) {
      console.log(`- ${key}`);
    }
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  main();
}
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const MODULE_ROOT = join(ROOT, "src", "modules", "communication-territorial");
const MIGRATIONS_ROOT = join(ROOT, "supabase", "migrations");

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /@\/integrations\/supabase|from\s+["'].*supabase["']|\.from\s*\(|\.rpc\s*\(/,
    message: "UI de communication-territorial nao pode acessar Supabase diretamente; use core/communication-territorial services.",
  },
  {
    pattern: /@\/modules\/(?!communication-territorial\/)/,
    message: "communication-territorial nao deve importar outros modules/* diretamente.",
  },
];

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return walk(fullPath);
    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : [];
  });
}

const violations: string[] = [];

for (const file of walk(MODULE_ROOT)) {
  const source = readFileSync(file, "utf8");
  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(source)) {
      violations.push(`${relative(ROOT, file)}: ${rule.message}`);
    }
  }
}

const INTERNAL_DB_FUNCTIONS = [
  "communication_upsert_default_distribution",
  "communication_distribution_relevance_score",
  "communication_distribution_rank_score",
  "communication_distribution_rank_reason",
] as const;

function validateInternalDbFunctionGrants() {
  const migrationFiles = readdirSync(MIGRATIONS_ROOT)
    .filter((entry) => entry.endsWith(".sql"))
    .sort()
    .map((entry) => join(MIGRATIONS_ROOT, entry));

  const exposed = new Map<string, string>();

  for (const file of migrationFiles) {
    const source = readFileSync(file, "utf8");

    for (const functionName of INTERNAL_DB_FUNCTIONS) {
      const functionPattern = `${functionName}\\s*\\(`;
      const grantPattern = new RegExp(
        `GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+(?:public\\.)?${functionPattern}[^;]*\\bTO\\s+[^;]*(PUBLIC|anon|authenticated)\\b`,
        "i",
      );
      const revokePattern = new RegExp(
        `REVOKE\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+(?:public\\.)?${functionPattern}[^;]*\\bFROM\\s+[^;]*(PUBLIC|anon|authenticated)\\b`,
        "i",
      );

      if (grantPattern.test(source)) exposed.set(functionName, relative(ROOT, file));
      if (revokePattern.test(source)) exposed.delete(functionName);
    }
  }

  for (const [functionName, file] of exposed) {
    violations.push(
      `${file}: funcao interna ${functionName} nao pode ficar exposta para PUBLIC, anon ou authenticated.`,
    );
  }
}

validateInternalDbFunctionGrants();

if (violations.length) {
  console.error("Communication Territorial boundary violations:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Communication Territorial boundaries OK");

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const ARCHITECTURE_DIR = path.join(ROOT, "tools", "architecture");
const PHASE1_PATH = path.join(
  ARCHITECTURE_DIR,
  "validate-architecture-phase1.mjs",
);
const WORKFLOW_PATH = path.join(
  ROOT,
  ".github",
  "workflows",
  "ssot-enforcement.yml",
);
const PACKAGE_PATH = path.join(ROOT, "package.json");
const PERMANENT_PLAN = "URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md";

const NON_BLOCKING_VALIDATORS = new Map([
  [
    "tools/architecture/validate-maps-integration.sh",
    "manual Maps V4 pre-deploy checklist; canonical architecture enforcement is validate-maps-architecture.mjs",
  ],
]);

const VALIDATOR_FILE_RE = /^validate-.*\.(?:ts|mjs|js|sh)$/;
const SCRIPT_REF_RE = /\b(?:validate|check|report|audit):[A-Za-z0-9:_-]+\b/g;
const VALIDATOR_PATH_RE =
  /tools\/architecture\/validate-[A-Za-z0-9._/-]+\.(?:ts|mjs|js|sh)/g;

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function walkValidators(dir: string): string[] {
  const validators: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      validators.push(...walkValidators(fullPath));
      continue;
    }
    if (!entry.isFile() || !VALIDATOR_FILE_RE.test(entry.name)) continue;
    validators.push(normalize(path.relative(ROOT, fullPath)));
  }

  return validators.sort();
}

function extractScriptRefs(text: string): string[] {
  return [...text.matchAll(SCRIPT_REF_RE)].map((match) => match[0]);
}

function extractValidatorPaths(text: string): string[] {
  return [...text.matchAll(VALIDATOR_PATH_RE)].map((match) => match[0]);
}

function collectReachableValidators(): Set<string> {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  const phase1 = fs.readFileSync(PHASE1_PATH, "utf8");
  const executionTexts = [workflow, phase1];

  const queue = [...new Set(executionTexts.flatMap(extractScriptRefs))].filter(
    (name) => Object.hasOwn(scripts, name),
  );
  const visited = new Set<string>();

  while (queue.length > 0) {
    const scriptName = queue.shift();
    if (!scriptName || visited.has(scriptName)) continue;
    visited.add(scriptName);

    const scriptBody = scripts[scriptName] ?? "";
    executionTexts.push(scriptBody);

    for (const nested of extractScriptRefs(scriptBody)) {
      if (Object.hasOwn(scripts, nested) && !visited.has(nested)) {
        queue.push(nested);
      }
    }
  }

  return new Set(executionTexts.flatMap(extractValidatorPaths));
}

describe("G3 architecture validator coverage", () => {
  it("keeps every blocking architecture validator reachable from the SSOT workflow", () => {
    const validators = walkValidators(ARCHITECTURE_DIR);
    const reachable = collectReachableValidators();
    const missing = validators.filter(
      (validator) =>
        !NON_BLOCKING_VALIDATORS.has(validator) && !reachable.has(validator),
    );

    expect(missing).toEqual([]);
  });

  it("keeps non-blocking validator exceptions explicit and narrow", () => {
    const validators = new Set(walkValidators(ARCHITECTURE_DIR));
    const reachable = collectReachableValidators();

    for (const [validator, rationale] of NON_BLOCKING_VALIDATORS) {
      expect(validators.has(validator), `${validator} must exist`).toBe(true);
      expect(rationale.length).toBeGreaterThan(20);
      expect(reachable.has(validator), `${validator} must remain manual`).toBe(false);
    }
  });

  it("keeps the canonical root-doc validator aligned with permanent-plan governance", () => {
    const docsValidator = fs.readFileSync(
      path.join(ARCHITECTURE_DIR, "validate-docs-structure.ts"),
      "utf8",
    );

    expect(docsValidator).toContain(PERMANENT_PLAN);
  });
});

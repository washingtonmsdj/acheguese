import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RUNTIME_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function collectRuntimeFiles(root: string): string[] {
  if (!existsSync(root)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      files.push(...collectRuntimeFiles(path));
      continue;
    }

    const extension = path.slice(path.lastIndexOf("."));
    if (RUNTIME_EXTENSIONS.has(extension)) {
      files.push(path);
    }
  }

  return files;
}

describe("release SSOT scripts", () => {
  it("keeps the phase core gate pointing to versioned files", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    const command = pkg.scripts["test:e2e:phase-core"];
    expect(command).toBeTruthy();

    const referencedSpecs = command
      .split(/\s+/)
      .filter((part) => part.startsWith("tests/") && /\.spec\.ts$/.test(part));

    expect(referencedSpecs.length).toBeGreaterThan(0);
    for (const spec of referencedSpecs) {
      expect(existsSync(spec), `${spec} referenced by test:e2e:phase-core`).toBe(true);
    }
  });

  it("keeps deprecated billing runtime out of the app", () => {
    const forbiddenFunctions = [
      "supabase/functions/stripe-webhook/index.ts",
      "supabase/functions/gastronomy-upgrade-plan/index.ts",
      "supabase/functions/gastronomy-cancel-subscription/index.ts",
      "supabase/functions/gastronomy-reactivate-subscription/index.ts",
      "supabase/functions/gastronomy-add-payment-method/index.ts",
    ];

    for (const file of forbiddenFunctions) {
      expect(existsSync(file), `${file} should not be deployed from this repo`).toBe(false);
    }

    const runtimeFiles = [
      ...collectRuntimeFiles("src"),
      ...collectRuntimeFiles("supabase/functions"),
    ].filter((file) => !file.endsWith("types.generated.ts"));

    const offenders = runtimeFiles.filter((file) => {
      const source = readFileSync(file, "utf8");
      return (
        source.includes(".from(\"gastronomy_subscriptions\")") ||
        source.includes(".from('gastronomy_subscriptions')") ||
        source.includes(".from(\"business_subscriptions\")") ||
        source.includes(".from('business_subscriptions')")
      );
    });

    expect(offenders).toEqual([]);
  });
});

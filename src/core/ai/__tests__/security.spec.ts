import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { OpenAIProvider } from "../providers/OpenAIProvider";

function listReactFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listReactFiles(full));
      continue;
    }
    if (full.endsWith(".tsx") || full.endsWith(".jsx")) {
      files.push(full);
    }
  }

  return files;
}

describe("AI security boundaries", () => {
  it("componentes React nao importam OpenAIProvider", () => {
    const reactFiles = listReactFiles("src");
    const offenders = reactFiles.filter((file) => {
      const content = readFileSync(file, "utf8");
      return content.includes("OpenAIProvider");
    });

    expect(offenders).toEqual([]);
  });

  it("OpenAIProvider chama somente Supabase Edge Function", async () => {
    const source = readFileSync("src/core/ai/providers/OpenAIProvider.ts", "utf8");
    expect(source.includes("functions.invoke(\"ai-intent-parse\"")).toBe(true);
    expect(source.includes("sk-")).toBe(false);
    expect(source.includes("OPENAI_API_KEY")).toBe(false);
    expect(OpenAIProvider).toBeTypeOf("function");
  });
});

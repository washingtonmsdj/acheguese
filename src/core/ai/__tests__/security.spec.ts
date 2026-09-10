import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { EdgeAIProvider } from "../providers/EdgeAIProvider";

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
  it("componentes React nao importam providers de infraestrutura de IA", () => {
    const reactFiles = listReactFiles("src");
    const offenders = reactFiles.filter((file) => {
      const content = readFileSync(file, "utf8");
      return content.includes("EdgeAIProvider") || content.includes("OpenAIProvider");
    });

    expect(offenders).toEqual([]);
  });

  it("IntentParser usa o broker de IA canônico, sem Edge fantasma", () => {
    const parser = readFileSync("src/core/ai/intent/IntentParser.ts", "utf8");
    const provider = readFileSync("src/core/ai/providers/EdgeAIProvider.ts", "utf8");

    expect(parser).toContain("new EdgeAIProvider()");
    expect(provider).toContain("aiClient.text");
    expect(provider).toContain('feature: "search.intent"');
    expect(provider).not.toContain("supabase.functions.invoke");
    expect(provider).not.toContain("ai-intent-parse");
    expect(provider).not.toContain("sk-");
    expect(provider).not.toContain("OPENAI_API_KEY");
    expect(EdgeAIProvider).toBeTypeOf("function");
  });

  it("mantem aposentado o provider que apontava para ai-intent-parse inexistente", () => {
    expect(existsSync("src/core/ai/providers/OpenAIProvider.ts")).toBe(false);
  });
});

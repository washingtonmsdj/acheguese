import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function executableVerticalKeys(): string[] {
  const config = read("src/core/verticals/config.ts");
  const match = config.match(
    /export\s+const\s+VERTICAL_KEYS[^=]*=\s*\[([^\]]*)\]/m,
  );

  if (!match) {
    throw new Error("VERTICAL_KEYS nao encontrado em src/core/verticals/config.ts");
  }

  return Array.from(match[1].matchAll(/["']([^"']+)["']/g)).map(
    (item) => item[1],
  );
}

function backtickValuesOnLine(content: string, prefix: string): string[] {
  const line = content
    .split(/\r?\n/)
    .find((candidate) => candidate.trim().startsWith(prefix));

  if (!line) {
    throw new Error(`Marcador documental ausente: ${prefix}`);
  }

  return Array.from(line.matchAll(/`([^`]+)`/g)).map((item) => item[1]);
}

describe("vertical taxonomy documentation SSOT", () => {
  it("keeps module and architecture docs aligned with executable vertical keys", () => {
    const expected = executableVerticalKeys();
    const modulesReadme = read("src/modules/README.md");
    const currentRules = read("docs/03-architecture/CURRENT_RULES.md");

    expect(
      backtickValuesOnLine(
        modulesReadme,
        "- Current official vertical state:",
      ),
    ).toEqual(expected);

    expect(
      backtickValuesOnLine(currentRules, "- Estado oficial atual:"),
    ).toEqual(expected);
  });

  it("does not classify community Events as a business vertical", () => {
    const eventsReadme = read("src/modules/community-events/README.md");

    expect(eventsReadme).toContain("Eventos **nao e vertical empresarial**");
    expect(eventsReadme).toContain("`src/core/verticals/config.ts`");
    expect(eventsReadme).toContain("`src/features/events`");
    expect(eventsReadme).not.toMatch(
      /vertical canonico\s+`src\/core\/verticals\/events`/i,
    );
  });

  it("keeps the canonical documentation entry point explicit", () => {
    const rootReadme = read("README.md");
    const docsReadme = read("docs/README.md");
    const security = read("SECURITY.md");

    expect(rootReadme).toContain("docs/README.md");
    expect(rootReadme).not.toContain("docs/INDEX_CANONICO.md");
    expect(security).toContain("docs/README.md");
    expect(security).not.toContain("docs/INDEX_CANONICO.md");
    expect(docsReadme).toMatch(/Porta de entrada (?:única|unica)/i);
    expect(docsReadme).toContain("EXECUCAO_MAIN_ONLY.md");
  });
});

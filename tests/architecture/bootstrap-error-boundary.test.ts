import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("bootstrap error boundary", () => {
  it("reports production bootstrap failures without pulling Sentry into the normal path", () => {
    const boundary = read("src/app/components/BootstrapErrorBoundary.tsx");

    expect(boundary).toContain('import("@/shared/config/sentry.config")');
    expect(boundary).toContain("captureSentryException(error");
    expect(boundary).toContain('surface: "bootstrap"');
    expect(boundary).not.toContain(
      'import { captureSentryException } from "@/shared/config/sentry.config"',
    );
  });

  it("renders an assertive and readable territorial recovery surface", () => {
    const boundary = read("src/app/components/BootstrapErrorBoundary.tsx");

    expect(boundary).toContain('role="alert"');
    expect(boundary).toContain('aria-live="assertive"');
    expect(boundary).toContain("Não foi possível iniciar o Achegue-se");
    expect(boundary).toContain("Recarregue a página para tentar novamente.");
    expect(boundary).toContain("window.location.reload()");
    expect(boundary).toContain("bg-territory-canvas");
    expect(boundary).toContain("bg-territory-surface");
    expect(boundary).toContain("bg-territory-brand");
    expect(boundary).toContain("text-territory-muted");
    expect(boundary).not.toContain("bg-background");
    expect(boundary).not.toContain("bg-card");
    expect(boundary).not.toContain("bg-primary");
    expect(boundary).not.toContain("text-muted-foreground");
  });
});

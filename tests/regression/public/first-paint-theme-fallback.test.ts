import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("refresh first paint", () => {
  it("applies the persisted theme before React through a CSP-safe same-origin bootstrap", () => {
    const html = read("index.html");
    const themeInit = read("public/theme-init.js");
    const themeHook = read("src/shared/hooks/useTheme.ts");
    const vercelConfig = JSON.parse(read("vercel.json")) as {
      headers?: Array<{
        headers?: Array<{ key?: string; value?: string }>;
      }>;
    };
    const csp = vercelConfig.headers
      ?.flatMap((entry) => entry.headers ?? [])
      .find((header) => header.key === "Content-Security-Policy")?.value;
    const scriptSrc =
      csp
        ?.split(";")
        .map((directive) => directive.trim())
        .find((directive) => directive.startsWith("script-src ")) ?? "";

    expect(html).toContain(
      '<html lang="pt-BR" class="light" data-theme-storage-key="acheguese-theme">',
    );
    expect(html).toContain(
      '<script src="/theme-init.js" data-theme-bootstrap></script>',
    );
    expect(html.indexOf("data-theme-bootstrap")).toBeLessThan(
      html.indexOf('<script type="module" src="/src/main.tsx"></script>'),
    );
    expect(html).not.toContain("window.localStorage.getItem(storageKey)");

    expect(themeInit).toContain("root.dataset.themeStorageKey");
    expect(themeInit).toContain("window.localStorage.getItem(storageKey)");
    expect(themeInit).toContain('root.classList.toggle("dark", isDark)');
    expect(themeInit).toContain('root.classList.toggle("light", !isDark)');

    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");

    expect(themeHook).toContain("document.documentElement.dataset.themeStorageKey");
    expect(themeHook).toContain("useLayoutEffect");
    expect(themeHook).not.toContain('localStorage.getItem("acheguese-theme")');
    expect(themeHook).not.toContain('localStorage.setItem("acheguese-theme"');
  });

  it("renders a passive surface while routed chunks load instead of exposing the raw page background", () => {
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");
    const sessionShell = read("src/app/components/SessionProfileRuntimeShell.tsx");
    const passive = read("src/shared/components/loading/PassivePageFallback.tsx");

    expect(fullShell).toContain(
      'import { PassivePageFallback } from "@/shared/components/loading/PassivePageFallback";',
    );
    expect(fullShell).toContain(
      "<Suspense fallback={<PassivePageFallback />}>",
    );
    expect(sessionShell).toContain(
      'import { PassivePageFallback } from "@/shared/components/loading/PassivePageFallback";',
    );
    expect(sessionShell).toContain(
      "<Suspense fallback={<PassivePageFallback />}>",
    );

    expect(passive).toContain("min-h-screen bg-background");
    expect(passive).not.toContain("Loader2");
    expect(passive).not.toContain("animate-spin");
    expect(passive).not.toContain("setTimeout");
  });
});

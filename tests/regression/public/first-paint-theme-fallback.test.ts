import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("refresh first paint", () => {
  it("applies the persisted theme before React through a CSP-hashed inline bootstrap", () => {
    const html = read("index.html");
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
    const themeBootstrapMatch = html.match(
      /<script data-theme-bootstrap>([\s\S]*?)<\/script>/,
    );
    const themeBootstrap = themeBootstrapMatch?.[1] ?? "";
    const bootstrapHash = crypto
      .createHash("sha256")
      .update(themeBootstrap, "utf8")
      .digest("base64");

    expect(html).toContain(
      '<html lang="pt-BR" class="light" data-theme-storage-key="acheguese-theme">',
    );
    expect(themeBootstrap).not.toBe("");
    expect(html.indexOf("data-theme-bootstrap")).toBeLessThan(
      html.indexOf('<script type="module" src="/src/main.tsx"></script>'),
    );
    expect(html).not.toContain('src="/theme-init.js"');
    expect(fs.existsSync(path.join(ROOT, "public/theme-init.js"))).toBe(false);

    expect(themeBootstrap).toContain("document.documentElement");
    expect(themeBootstrap).toContain("dataset.themeStorageKey");
    expect(themeBootstrap).toContain("localStorage.getItem(t)");
    expect(themeBootstrap).toContain('classList.toggle("dark",s)');
    expect(themeBootstrap).toContain('classList.toggle("light",!s)');

    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).toContain(`'sha256-${bootstrapHash}'`);
    expect(scriptSrc).not.toContain("'unsafe-inline'");

    expect(themeHook).toContain("document.documentElement.dataset.themeStorageKey");
    expect(themeHook).toContain("useLayoutEffect");
    expect(themeHook).not.toContain('localStorage.getItem("acheguese-theme")');
    expect(themeHook).not.toContain('localStorage.setItem("acheguese-theme"');
  });

  it("keeps the routed first paint passive without a redundant shell loading step", () => {
    const appRuntime = read("src/app/components/AppRuntime.tsx");
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");
    const sessionShell = read("src/app/components/SessionProfileRuntimeShell.tsx");
    const passive = read("src/shared/components/loading/PassivePageFallback.tsx");
    const passiveImport =
      'import { PassivePageFallback } from "@/shared/components/loading/PassivePageFallback";';
    const passiveSuspense = "<Suspense fallback={<PassivePageFallback />}>";

    expect(appRuntime).toContain(passiveImport);
    expect(appRuntime).toContain(passiveSuspense);
    expect(appRuntime).not.toContain("RuntimeLoadingFallback");

    expect(fullShell).toContain(
      'import SessionProfileRuntimeShell from "@/app/components/SessionProfileRuntimeShell";',
    );
    expect(fullShell).toContain("<SessionProfileRuntimeShell />");
    expect(fullShell).not.toContain(passiveImport);
    expect(fullShell).not.toContain(
      'import("@/app/components/SessionProfileRuntimeShell")',
    );

    expect(sessionShell).toContain(passiveImport);
    expect(sessionShell).toContain(passiveSuspense);

    expect(passive).toContain("min-h-screen bg-background");
    expect(passive).not.toContain("Loader2");
    expect(passive).not.toContain("animate-spin");
    expect(passive).not.toContain("setTimeout");
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root accessibility CSS budget", () => {
  it("loads only accessibility core in the public bootstrap", () => {
    const app = read("src/App.tsx");
    const core = read("src/styles/accessibility-core.css");
    const extensions = read("src/styles/accessibility.css");
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");

    expect(app).toContain('import "@/styles/accessibility-core.css"');
    expect(app).not.toContain('import "@/styles/accessibility.css"');
    expect(fullShell).toContain('import "@/styles/accessibility.css"');

    expect(core).toContain(".sr-only");
    expect(core).toContain(".accessibility-high-contrast");
    expect(core).toContain(".accessibility-font-large");
    expect(core).toContain("min-height: 44px");
    expect(core).toContain("prefers-reduced-motion");
    expect(core).toContain(".skip-link");

    expect(core).not.toContain("fieldset");
    expect(core).not.toContain("table {");
    expect(core).not.toContain(".loading::after");

    expect(extensions).toContain("fieldset");
    expect(extensions).toContain("table {");
    expect(extensions).toContain(".loading::after");
    expect(extensions).not.toContain(".accessibility-high-contrast");
    expect(extensions).not.toContain(".skip-link");
  });
});

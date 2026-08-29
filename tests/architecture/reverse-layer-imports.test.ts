import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectReverseLayerViolations,
  extractImportReferences,
} from "../../tools/architecture/validate-reverse-layer-imports.mjs";

const tempRoots: string[] = [];

function createRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "achegue-reverse-layer-"));
  tempRoots.push(root);
  return root;
}

function write(root: string, relativePath: string, content: string): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("reverse-layer runtime import validator", () => {
  it("blocks shared runtime imports from core aliases", () => {
    const root = createRoot();
    write(root, "src/shared/config.ts", 'import { value } from "@/core/config";\n');

    expect(collectReverseLayerViolations(root)).toEqual([
      expect.objectContaining({
        file: "src/shared/config.ts",
        sourceLayer: "shared",
        targetLayer: "core",
        specifier: "@/core/config",
      }),
    ]);
  });

  it("blocks relative core imports that resolve into modules", () => {
    const root = createRoot();
    write(root, "src/modules/feature/index.ts", "export const feature = true;\n");
    write(root, "src/core/service.ts", 'import { feature } from "../modules/feature";\n');

    expect(collectReverseLayerViolations(root)).toEqual([
      expect.objectContaining({
        file: "src/core/service.ts",
        sourceLayer: "core",
        targetLayer: "modules",
        resolvedTarget: "src/modules/feature/index.ts",
      }),
    ]);
  });

  it("blocks dynamic integrations imports from core runtime", () => {
    const root = createRoot();
    write(root, "src/integrations/adapter.ts", 'export const load = () => import("@/core/runtime");\n');

    expect(collectReverseLayerViolations(root)).toEqual([
      expect.objectContaining({
        importKind: "dynamic-import",
        sourceLayer: "integrations",
        targetLayer: "core",
      }),
    ]);
  });

  it("allows type-only integrations contracts from core", () => {
    const root = createRoot();
    write(root, "src/integrations/adapter.ts", 'import type { Port } from "@/core/ports";\n');

    expect(collectReverseLayerViolations(root)).toEqual([]);
  });

  it("allows core runtime dependencies on integrations", () => {
    const root = createRoot();
    write(root, "src/core/service.ts", 'import { client } from "@/integrations/client";\n');

    expect(collectReverseLayerViolations(root)).toEqual([]);
  });

  it("blocks modules runtime imports from app", () => {
    const root = createRoot();
    write(root, "src/modules/feature/service.ts", 'import { shell } from "@/app/shell";\n');

    expect(collectReverseLayerViolations(root)).toEqual([
      expect.objectContaining({
        sourceLayer: "modules",
        targetLayer: "app",
      }),
    ]);
  });

  it("blocks reverse runtime re-exports and ignores comments", () => {
    const root = createRoot();
    write(
      root,
      "src/shared/index.ts",
      '// export { fake } from "@/core/fake";\nexport { real } from "@/core/real";\n',
    );

    const violations = collectReverseLayerViolations(root);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toEqual(
      expect.objectContaining({
        importKind: "export",
        specifier: "@/core/real",
      }),
    );
  });

  it("classifies type-only references separately", () => {
    expect(
      extractImportReferences(
        'import type { Port } from "@/core/port"; export type { Shape } from "@/core/shape";',
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ specifier: "@/core/port", typeOnly: true }),
        expect.objectContaining({ specifier: "@/core/shape", typeOnly: true }),
      ]),
    );
  });
});

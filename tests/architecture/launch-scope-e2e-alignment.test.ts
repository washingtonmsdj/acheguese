import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const launchScope = read("src/app/config/launchScope.ts");
const launchE2e = read("tests/e2e/launch-scope-public.spec.ts");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");

describe("MVP launch-scope E2E alignment", () => {
  it("does not classify enabled community messaging as paused", () => {
    expect(launchScope).toContain("communityCommunication: true");
    expect(launchE2e).not.toContain("'/mensagens'");
    expect(appRoutes).toContain('path="/mensagens"');
    expect(appRoutes).toContain('"communityCommunication"');
    expect(appRoutes).toContain("protectedElement(");
  });

  it("keeps explicitly paused public modules in the launch isolation E2E", () => {
    for (const path of [
      "/educacao",
      "/comunicacao",
      "/cupons",
      "/analytics",
      "/mobilidade",
      "/ranking",
      "/alertas",
      "/problemas",
      "/achados-perdidos",
    ]) {
      expect(launchE2e).toContain(`'${path}'`);
    }
  });
});

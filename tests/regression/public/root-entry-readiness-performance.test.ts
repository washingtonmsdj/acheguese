import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root map-first readiness", () => {
  it("uses one bounded owner for work that must wait for the first usable map", () => {
    const readiness = read("src/shared/utils/publicRootReadiness.ts");

    expect(readiness).toContain(
      'PUBLIC_ROOT_MAP_READY_EVENT = "acheguese:public-root-map-ready"',
    );
    expect(readiness).toContain("publicRootMapReady = true");
    expect(readiness).toContain("scheduleBrowserIdleWork");
    expect(readiness).toContain("window.setTimeout(schedule, maxWaitMs)");
    expect(readiness).toContain("window.addEventListener(PUBLIC_ROOT_MAP_READY_EVENT");
    expect(readiness).toContain("cancelIdleWork?.()");
  });

  it("signals readiness from the real MapLibre onLoad callback", () => {
    const runtime = read(
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
    );

    expect(runtime).toContain("markPublicRootMapReady");
    expect(runtime).toContain("onLoad={() => {");
    expect(runtime.indexOf("markPublicRootMapReady();")).toBeLessThan(
      runtime.indexOf("setMapReady(true);"),
    );
  });
});

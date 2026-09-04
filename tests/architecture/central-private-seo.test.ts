import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Central private SEO boundary", () => {
  it("keeps every /central surface noindex at the shared layout owner", () => {
    const layout = readFileSync(
      join(ROOT, "src/modules/central/components/CentralLayout.tsx"),
      "utf8",
    );
    const routes = readFileSync(
      join(ROOT, "src/app/routes/sections/CentralRoutes.tsx"),
      "utf8",
    );

    expect(layout).toContain('import { Helmet } from "react-helmet-async"');
    expect(layout).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(layout).toContain("<Outlet />");
    expect(routes).toContain("<Route element={<P.CentralLayout />}>");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const detailHook = readFileSync("src/core/business/hooks/useBusiness.ts", "utf8");
const guard = readFileSync("src/modules/central/guards/BusinessAdminGuard.tsx", "utf8");

describe("Business Central fail-closed guard error boundary", () => {
  it("keeps unavailable business reads distinct from confirmed absence", () => {
    expect(detailHook).toContain("retry: () => void;");
    expect(detailHook).toContain("void query.refetch()");
    expect(guard).toContain("if (loadingBusiness) return;");
    expect(guard).toContain("if (businessError || !business) return;");
    expect(guard).toContain("if (!businessId || businessNotFound)");
    expect(detailHook).toContain("notFound: error instanceof BusinessNotFoundError,");
    expect(guard).toContain("error: businessError,");
  });

  it("does not redirect on authorization service failure or reveal management UI", () => {
    expect(guard).toContain("if (!accessReady || accessError) return;");
    expect(guard).toContain("if (businessError || accessError) {");
    expect(guard).toContain('role="alert"');
    expect(guard).toContain("Tentar novamente");
    expect(guard).toContain("if (accessError) void retryAccess();");
    expect(guard).toContain("if (!businessId || businessNotFound || !business || !permissions.hasAccess)");
  });
});

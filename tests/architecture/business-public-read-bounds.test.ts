import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Business public read bounds", () => {
  it("keeps compatibility list bounded to one canonical public page", () => {
    const service = read("src/core/business/services/BusinessService.ts");

    expect(service).toContain("PUBLIC_BUSINESS_COMPAT_PAGE_SIZE");
    expect(service).toContain("BusinessQueries.getBusinessesList");
    expect(service).not.toContain("PUBLIC_BUSINESS_MAX_PAGES");
    expect(service).not.toMatch(/for\s*\([^)]*pageIndex/);
    expect(service).not.toContain("businesses.push(...page.businesses)");
  });

  it("keeps tourist nearby discovery on bounded paginated reads", () => {
    const nearby = read(
      "src/core/guide/tourist-points/hooks/useNearbyBusinesses.ts",
    );
    const limits = read(
      "src/core/guide/tourist-points/constants/nearby.ts",
    );

    expect(nearby).toContain("BusinessService.getBusinessesList");
    expect(nearby).not.toContain("BusinessService.getBusinesses({");
    expect(nearby).toContain("TOURIST_POINT_NEARBY_LIMITS.CANDIDATES_PER_CATEGORY");
    expect(limits).toContain("CANDIDATES_PER_CATEGORY");
  });

  it("does not reintroduce the retired unbounded admin list API", () => {
    const adminPath = resolve(root, "src/core/admin/services/AdminBusinessService.ts");
    expect(existsSync(adminPath)).toBe(true);
    const admin = read("src/core/admin/services/AdminBusinessService.ts");
    expect(admin).not.toContain("getAllBusinesses()");
  });
});
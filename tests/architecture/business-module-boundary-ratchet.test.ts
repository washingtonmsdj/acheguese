import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (filePath: string) => readFileSync(resolve(repoRoot, filePath), "utf8");

describe("Business module architecture hardening", () => {
  it("keeps public snapshot RPC and contracts core-owned", () => {
    const canonicalRpc = read("src/core/business/services/PublicSnapshotRpcService.ts");
    const moduleRpc = read("src/modules/business/public/services/PublicSnapshotRpcService.ts");
    const canonicalContracts = read("src/core/business/types/publicSnapshots.ts");
    const moduleContracts = read("src/modules/business/public/types/publicSnapshots.ts");

    expect(canonicalRpc).toContain("@/integrations/supabase");
    expect(canonicalRpc).toContain("@/core/business/types/publicSnapshots");
    expect(canonicalRpc).not.toContain("@/modules/business");
    expect(moduleRpc).toContain("@/core/business/services/PublicSnapshotRpcService");
    expect(moduleRpc).not.toContain("@/integrations/");

    expect(canonicalContracts).toContain("export interface PublicBusinessSnapshot");
    expect(canonicalContracts).not.toContain("@/modules/business");
    expect(moduleContracts).toContain("@/core/business/types/publicSnapshots");
  });

  it("locks the entire Business module to zero direct runtime integration access", () => {
    const validator = read("scripts/validate-business-module-boundaries.ts");

    expect(validator).toContain('const BUSINESS_ROOT = "src/modules/business"');
    expect(validator).toContain("direct runtime @/integrations/* access is forbidden");
    expect(validator).toContain("direct runtime @supabase/supabase-js access is forbidden");
    expect(validator).toContain("TYPE_ONLY_IMPORT_RE");
    expect(validator).not.toContain("ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES");
  });
});

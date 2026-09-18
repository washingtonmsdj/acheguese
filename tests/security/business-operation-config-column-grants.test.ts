import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("business operation config browser projection", () => {
  const migration = read(
    "supabase/migrations/20260918123447_bound_business_operation_config_select_columns.sql",
  );
  const service = read("src/core/business/BusinessHoursService.ts");

  it("replaces table-wide SELECT with an explicit current-column grant", () => {
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.business_operation_config",
    );
    expect(migration).toContain("FROM anon, authenticated");
    expect(migration).toContain("GRANT SELECT (");
    expect(migration).toContain(
      ") ON TABLE public.business_operation_config\nTO anon, authenticated;",
    );

    for (const column of [
      "id",
      "business_id",
      "accepts_pickup",
      "accepts_delivery",
      "accepts_dine_in",
      "uses_own_delivery",
      "uses_platform_delivery",
      "preparation_time_min",
      "advance_order_hours",
      "is_temporarily_closed",
      "temporarily_closed_reason",
      "temporarily_closed_until",
      "created_at",
      "updated_at",
    ]) {
      expect(migration).toContain(column);
    }
  });

  it("keeps the service on the same explicit projection for reads and mutation receipts", () => {
    expect(service).toContain("const BUSINESS_OPERATION_CONFIG_COLUMNS = [");
    expect(
      service.match(/\.select\(BUSINESS_OPERATION_CONFIG_COLUMNS\)/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(2);

    const operationConfigSection = service.slice(
      service.indexOf("// CONFIGURAÇÃO OPERACIONAL"),
      service.indexOf("// STATUS E VERIFICAÇÕES"),
    );
    expect(operationConfigSection).not.toContain(".select('*')");
    expect(operationConfigSection).not.toContain(".select()");
  });
});

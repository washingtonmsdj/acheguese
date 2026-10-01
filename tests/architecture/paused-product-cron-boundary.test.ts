import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { PRODUCT_MODULE_REGISTRY } from "@/app/config/productModuleRegistry";

const root = process.cwd();
const migration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20261001054425_pause_paused_product_cron_workers.sql",
  ),
  "utf8",
);

describe("paused product cron boundary", () => {
  it("disconnects autonomous workers owned by paused Mobility and Family Safety", () => {
    expect(PRODUCT_MODULE_REGISTRY.mobility.status).toBe("paused");
    expect(PRODUCT_MODULE_REGISTRY.familySafety.status).toBe("paused");

    expect(migration).toContain("'process-dispatch-timeouts-1m'");
    expect(migration).toContain("'emergency-delivery-outbox-every-minute'");
    expect(migration).toContain("cron.unschedule(v_job_id)");
  });

  it("preserves active horizontal Notifications scheduling", () => {
    expect(migration).not.toContain("'acheguese-notification-outbox-dispatch'");
    expect(migration).toContain(
      "Horizontal Notifications is active in the MVP and is intentionally untouched.",
    );
  });
});

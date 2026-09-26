import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const TRACKED_PUBLIC_ENV = readFileSync(".env", "utf8");

const FORBIDDEN_SECRET_MARKERS = [
  "SERVICE_ROLE",
  "SUPABASE_SECRET_KEY",
  "STRIPE_SECRET",
  "STRIPE_WEBHOOK_SECRET",
  "JWT_SECRET",
  "PRIVATE_KEY",
  "CLIENT_SECRET",
  "API_SECRET",
  "ADMIN_PASSWORD",
  "ACCESS_TOKEN",
  "REFRESH_TOKEN",
];

describe("tracked public .env safety", () => {
  it("keeps server-side secrets out of the repository-tracked public baseline", () => {
    for (const marker of FORBIDDEN_SECRET_MARKERS) {
      expect(TRACKED_PUBLIC_ENV).not.toContain(marker);
    }
  });

  it("documents that the tracked baseline is public-only", () => {
    expect(TRACKED_PUBLIC_ENV).toContain("Public development baseline only.");
    expect(TRACKED_PUBLIC_ENV).toContain("Never add service_role");
  });
});

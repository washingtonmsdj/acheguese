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

const TRACKED_PUBLIC_ENV_KEYS = TRACKED_PUBLIC_ENV
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith("#"))
  .map((line) => line.split("=", 1)[0].trim().toUpperCase())
  .filter(Boolean);

describe("tracked public .env safety", () => {
  it("keeps server-side secrets out of the repository-tracked public baseline", () => {
    for (const marker of FORBIDDEN_SECRET_MARKERS) {
      expect(
        TRACKED_PUBLIC_ENV_KEYS.some((key) => key.includes(marker)),
        `tracked .env must not expose a key containing ${marker}`,
      ).toBe(false);
    }
  });

  it("documents that the tracked baseline is public-only", () => {
    expect(TRACKED_PUBLIC_ENV).toContain("Public development baseline only.");
    expect(TRACKED_PUBLIC_ENV).toContain("Never add service_role");
  });
});

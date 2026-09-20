import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("community interest real contact boundary", () => {
  const indication = read("src/app/pages/CommunityIndicationPage.tsx");
  const waitlist = read("src/app/pages/PreLaunchWaitlist.tsx");
  const client = read("src/core/routing/services/CommunityInterestRegistrationService.ts");
  const broker = read("supabase/functions/_shared/communityInterestRegistration.ts");
  const migration = read(
    "supabase/migrations/20260920012056_allow_phone_only_community_interest_mvp.sql",
  );
  const generatedTypes = read("src/integrations/supabase/types.generated.ts");

  it("never synthesizes an email identity for WhatsApp contacts", () => {
    for (const source of [indication, waitlist, client, broker]) {
      expect(source).not.toContain("waitlist.acheguese.local");
      expect(source).not.toContain("whatsapp+");
    }

    expect(indication).toContain(
      "const email = isEmail ? contact.trim().toLowerCase() : null",
    );
    expect(waitlist).toContain("email: null");
  });

  it("requires at least one real contact channel in the database", () => {
    expect(migration).toContain("ALTER COLUMN email DROP NOT NULL");
    expect(migration).toContain(
      "CHECK (email IS NOT NULL OR phone IS NOT NULL)",
    );
    expect(migration).toContain(
      "community_interest_unique_phone_per_community",
    );
    expect(migration).toContain("regexp_replace(phone, '[^0-9]', '', 'g')");
  });

  it("keeps browser and broker contracts nullable for email", () => {
    expect(client).toContain("email: string | null");
    expect(broker).toContain("email: string | null");
    expect(broker).toContain("if (email === null && phone === null) return null");

    const tableStart = generatedTypes.indexOf("community_interest_registrations:");
    expect(tableStart).toBeGreaterThanOrEqual(0);
    const tableContract = generatedTypes.slice(tableStart, tableStart + 5000);
    expect(tableContract).toMatch(/email:\s*string\s*\|\s*null/);
  });
});

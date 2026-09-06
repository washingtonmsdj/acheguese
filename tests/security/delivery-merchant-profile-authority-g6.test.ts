import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 delivery merchant profile authority", () => {
  const source = read("supabase/functions/delivery-rpc/index.ts");

  it("separates profile access from business management authority", () => {
    expect(source).toContain("async function canAccessProfile");
    expect(source).toContain("async function canManageProfile");
    expect(source).toContain('"broker_user_can_manage_profile"');
    expect(source).toContain("async function requireManagedMerchantProfile");
  });

  it("requires owner/manager authority before acting as merchant", () => {
    expect(source).toContain(
      "await requireManagedMerchantProfile(supabaseAdmin, auth, actorProfileId)",
    );
    expect(source).toContain(
      '"Merchant profile requires owner or manager access"',
    );

    const merchantBranch = source.match(
      /if \(permissions\.allowMerchant[\s\S]*?return "merchant";/,
    )?.[0];
    expect(merchantBranch).toBeDefined();
    expect(merchantBranch).toContain("requireManagedMerchantProfile");
  });

  it("does not let an arbitrary active member create an order as merchant", () => {
    const createGuard = source.match(
      /async function requireCreateOrderActor[\s\S]*?throw new RequestAuthorizationError\("Actor profile cannot create this order"\);/,
    )?.[0];
    expect(createGuard).toBeDefined();
    expect(createGuard).toContain("actorProfileId === merchantProfileId");
    expect(createGuard).toContain("requireManagedMerchantProfile");
  });

  it("keeps operational-account enforcement in the deployed source contract", () => {
    expect(source).toContain("requireOperationalAccount");
  });
});

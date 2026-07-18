import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Entity private-data SSOT", () => {
  it("routes Business contact writes and detail hydration through Core contact", () => {
    const mutations = read("src/core/business/services/business.mutations.ts");
    const queries = read("src/core/business/services/business.queries.ts");
    const mapper = read("src/core/business/services/business.mappers.ts");

    expect(mutations).toContain("EntityContactService.patchOwnedChannels");
    expect(queries).toContain("EntityContactService.getVisibleForEntity");
    expect(mapper).not.toMatch(/profile\?\.(?:phone|whatsapp|email)/);
    expect(mapper).not.toMatch(/metadata\.(?:phone|whatsapp|email)/);
  });

  it("routes Professional contact and credentials through their canonical brokers", () => {
    const lifecycle = read(
      "src/core/professional/services/professional.profile-lifecycle.ts",
    );
    const queries = read("src/core/professional/services/professional.queries.ts");
    const mapper = read("src/core/professional/services/professional.mappers.ts");
    const extension = read(
      "src/core/profiles/services/multi-profile/professionalService.ts",
    );

    expect(lifecycle).toContain("EntityContactService.patchOwnedChannels");
    expect(queries).toContain("EntityContactService.getVisibleForEntity");
    expect(mapper).not.toMatch(/profile\?\.(?:phone|whatsapp|email)/);
    expect(extension).toContain("ProfessionalCredentialsService.getOwned");
    expect(extension).toContain("ProfessionalCredentialsService.patchOwned");
    expect(extension).not.toMatch(/select\(["']\*["']\)/);
  });

  it("removes duplicate lifecycle writers and duplicate ownership checks", () => {
    const professionalMutations = read(
      "src/core/professional/services/professional.mutations.ts",
    );
    const adminBusiness = read("src/core/admin/services/AdminBusinessService.ts");
    const opportunities = read(
      "src/core/work-opportunities/services/WorkOpportunitiesService.ts",
    );

    expect(professionalMutations).not.toMatch(
      /export async function (?:createProfessional|updateProfessional|deleteProfessional)\b/,
    );
    expect(adminBusiness).not.toContain("profileService.createProfile");
    expect(adminBusiness).toContain("BusinessService.createBusiness");
    expect(opportunities).not.toContain('select("id, owner_user_id")');
    expect(opportunities).not.toContain('.eq("owner_user_id", user.id)');
    expect(opportunities).toContain("getAccessibleProfileIds");
  });

  it("derives entity-creation actors from the authenticated session", () => {
    const business = read("src/core/business/services/business.mutations.ts");
    const professional = read(
      "src/core/professional/services/professional.profile-lifecycle.ts",
    );
    const businessAdmin = read(
      "src/core/admin/services/AdminBusinessService.ts",
    );

    for (const lifecycle of [business, professional]) {
      expect(lifecycle).toContain("SessionService.getCurrentUser()");
      expect(lifecycle).toContain("user_id: user.id");
      expect(lifecycle).not.toMatch(/create(?:Business|ProfessionalWithProfile)\([\s\S]{0,120}userId:\s*string/);
    }
    expect(businessAdmin).not.toMatch(/createBusinessProfile\([\s\S]{0,240}userId:\s*string/);
  });

  it("keeps anonymous snapshots contact-free before authenticated hydration", () => {
    const snapshots = read(
      "src/modules/business/public/services/PublicSnapshotRpcService.ts",
    );
    expect(snapshots).toContain("phone: undefined");
    expect(snapshots).toContain("whatsapp: undefined");
    expect(snapshots).toContain("email: undefined");
    expect(snapshots).toContain("attachAuthenticatedBusinessContact");
    expect(snapshots).toContain("EntityContactService.getVisibleForEntity");
  });
});

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Federated Search ownership", () => {
  it("keeps SearchService as the only horizontal orchestrator", () => {
    const service = read("src/core/search/services/SearchService.ts");
    const providers = read("src/core/search/providers/searchProviders.ts");

    expect(service).toContain("export class SearchService");
    expect(service).toContain("getSearchProviders");
    expect(service).not.toMatch(
      /BusinessService|ProfessionalService|searchClassifieds|eventsReadService|searchPublicPosts/,
    );
    expect(service).not.toContain("@/integrations/supabase");
    expect(service).not.toMatch(/\.from\(["']/);

    expect(providers).toContain('bucket: "communities"');
    expect(providers).toContain('bucket: "businesses"');
    expect(providers).toContain('bucket: "professionals"');
    expect(providers).toContain('bucket: "opportunities"');
    expect(providers).toContain('bucket: "classifieds"');
    expect(providers).toContain('bucket: "events"');
    expect(providers).toContain('bucket: "posts"');
    expect(providers).not.toContain("@/integrations/supabase");
    expect(providers).not.toContain("public_business_search");
    expect(providers).not.toContain("public_professional_search");
  });

  it("keeps domain read models owned by Business and Professional", () => {
    const businessQueries = read("src/core/business/services/business.queries.ts");
    const professionalQueries = read(
      "src/core/professional/services/professional.queries.ts",
    );

    expect(businessQueries).toContain('.from("public_business_search")');
    expect(professionalQueries).toContain(
      '.from<ProfessionalQueryRow>("public_professional_search")',
    );
  });

  it("keeps public search read models SELECT-only for callable roles", () => {
    const migration = read(
      "supabase/migrations/20260829201727_lock_public_search_read_models_to_select.sql",
    );

    expect(migration).toContain("public.public_business_search");
    expect(migration).toContain("public.public_professional_search");
    expect(migration.match(/REVOKE ALL PRIVILEGES/g)?.length).toBe(2);
    expect(migration).toContain(
      "GRANT SELECT ON TABLE public.public_business_search TO anon, authenticated, service_role",
    );
    expect(migration).toContain(
      "GRANT SELECT ON TABLE public.public_professional_search TO anon, authenticated, service_role",
    );
  });

  it("removes the unused community fan-out implementation", () => {
    expect(
      existsSync(resolve(root, "src/core/community/hooks/useSearch.ts")),
    ).toBe(false);
    expect(
      existsSync(resolve(root, "src/core/community/components/SearchModal.tsx")),
    ).toBe(false);
    expect(
      existsSync(resolve(root, "src/modules/search/hooks/useGlobalSearch.ts")),
    ).toBe(false);
  });

  it("keeps the current UI hook inside the Search owner without reverse module imports", () => {
    const hook = read("src/core/search/hooks/useGlobalSearch.ts");

    expect(hook).toContain("SearchService.search");
    expect(hook).not.toContain("@/modules/");
  });

  it("applies community scope through canonical entity links", () => {
    const service = read("src/core/search/services/SearchService.ts");
    const providers = read("src/core/search/providers/searchProviders.ts");

    expect(service).toContain("CommunityEntityLinkService.listActiveByCommunity");
    expect(service).toContain("getCommunitySearchLinkLimit()");
    expect(providers).toContain("Boolean(filters.communityId)");
    expect(providers).toContain("requireLinkedEntity ? []");
    expect(providers).toContain(
      "filters.communityId && !filters.territoryFilter",
    );
  });

  it("bounds candidates, propagates abort and emits latency samples", () => {
    const config = read("src/core/search/config/searchConfig.ts");
    const service = read("src/core/search/services/SearchService.ts");
    const hook = read("src/core/search/hooks/useGlobalSearch.ts");

    expect(config).toContain("DEFAULT: 20");
    expect(config).toContain("COMMUNITY_CANDIDATE_MULTIPLIER: 5");
    expect(config).toContain("COMMUNITY_LINK_MULTIPLIER: 5");
    expect(hook).toContain("queryFn: ({ signal })");
    expect(hook).toContain("{ signal }");
    expect(service).toContain("throwIfAborted(options.signal)");
    expect(service).toContain('trackPerformance("search.federated.duration"');
  });

  it("names history scopes instead of sharing one implicit community key", () => {
    const contracts = read("src/core/search/contracts.ts");
    const service = read("src/core/search/services/SearchService.ts");

    expect(contracts).toContain("`community:${string}`");
    expect(contracts).toContain("`territory:${string}`");
    expect(service).toContain("historyStorageKey(scope)");
    expect(service).toContain("search_history:${scope}");
  });
});

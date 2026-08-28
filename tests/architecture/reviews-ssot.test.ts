import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const migration = read(
  "supabase/migrations/20260715094000_consolidate_review_core.sql",
);
const deleteContractMigration = read(
  "supabase/migrations/20260715096000_fix_profile_review_delete_contract.sql",
);
const adminAggregateMigration = read(
  "supabase/migrations/20260715110000_create_review_aggregate_admin_read_model.sql",
);
const queries = read("src/core/reviews/services/reviews.queries.ts");
const mutations = read("src/core/reviews/services/reviews.mutations.ts");
const engagement = read("src/core/reviews/services/ReviewEngagementService.ts");
const businessAdapter = read(
  "src/core/business/services/BusinessReviewService.ts",
);
const gastronomyAdapter = read(
  "src/core/business/services/gastronomy.review.queries.ts",
);

function runtimeSourceFiles(directory: string): string[] {
  const absoluteDirectory = resolve(root, directory);
  return readdirSync(absoluteDirectory).flatMap((entry) => {
    const absolutePath = resolve(absoluteDirectory, entry);
    const relativePath = `${directory}/${entry}`.replaceAll("\\", "/");
    if (statSync(absolutePath).isDirectory()) {
      return runtimeSourceFiles(relativePath);
    }
    if (!/\.(ts|tsx)$/.test(entry) || entry === "types.generated.ts") return [];
    return [relativePath];
  });
}

describe("Reviews Core SSOT", () => {
  it("reconciles and removes remote-only profile review tables safely", () => {
    expect(migration).toContain("business_review_reconciliation_failed");
    expect(migration).toContain("professional_review_reconciliation_failed");
    expect(migration).toContain(
      "DROP TABLE public.business_reviews_new RESTRICT",
    );
    expect(migration).toContain(
      "DROP TABLE public.professional_reviews_new RESTRICT",
    );

    const offenders = runtimeSourceFiles("src").filter((path) => {
      const source = read(path);
      return /business_reviews_new|professional_reviews_new/.test(source);
    });
    expect(offenders).toEqual([]);
  });

  it("uses public.reviews as the fixed profile-review aggregate", () => {
    expect(queries).toContain('.from("reviews")');
    expect(queries).toContain('rpc("get_profile_review_stats"');
    expect(queries).not.toContain("getTableName");
    expect(mutations).toMatch(/rpc\(\s*"upsert_profile_review"/);
    expect(mutations).toContain('rpc("delete_profile_review"');
    expect(mutations).not.toContain('.from("reviews")');
  });

  it("enforces actor ownership, completed work, rate limits and server writes", () => {
    expect(migration).toContain("private.auth_owns_active_profile");
    expect(migration).toContain("public.professional_service_engagements");
    expect(migration).toContain("public.professional_jobs");
    expect(migration).toContain("completed_professional_service_required");
    expect(migration).toContain("private.enforce_review_command_rate_limit");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.reviews FROM anon, authenticated",
    );
    expect(migration).not.toContain(
      "GRANT INSERT ON TABLE public.reviews TO authenticated",
    );
    expect(deleteContractMigration).toContain("DELETE FROM public.reviews");
    expect(deleteContractMigration).not.toContain("SET status = 'deleted'");
  });

  it("owns reports and helpfulness in the reusable Review Core service", () => {
    expect(engagement).toContain('rpc("create_review_report"');
    expect(engagement).toContain('rpc("set_review_helpfulness"');
    expect(engagement).toMatch(/rpc\(\s*"get_current_review_helpfulness"/);
    expect(gastronomyAdapter).toContain("ReviewEngagementService");
    expect(gastronomyAdapter).not.toContain('.from("review_helpfulness")');
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.review_helpfulness FROM anon, authenticated",
    );
  });

  it("keeps business eligibility in a policy adapter over the same aggregate", () => {
    expect(businessAdapter).toContain(
      'const FUNCTION_NAME = "business-reviews-rpc"',
    );
    expect(gastronomyAdapter).toContain("BusinessReviewService");
    expect(businessAdapter).not.toContain("p_user_id");
    expect(businessAdapter).not.toContain("gastronomy");
    expect(migration).toContain(
      "LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)",
    );
  });

  it("keeps administrative aggregates in a bounded server-owned read model", () => {
    expect(queries).toContain('rpc("get_review_aggregates_admin"');
    expect(adminAggregateMigration).toContain(
      "private.is_admin_user(auth.uid())",
    );
    expect(adminAggregateMigration).toContain(
      "cardinality(v_profile_ids), 0) NOT BETWEEN 1 AND 200",
    );
    expect(adminAggregateMigration).toContain(
      "REVOKE ALL ON FUNCTION public.get_review_aggregates_admin(UUID[], TEXT)",
    );
  });
});

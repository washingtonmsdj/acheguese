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
const brokerManagementMigration = read(
  "supabase/migrations/20260829171858_add_broker_profile_management_authority.sql",
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
const businessBroker = read(
  "supabase/functions/business-reviews-rpc/index.ts",
);

function runtimeSourceFiles(directory: string): string[] {
  const absoluteDirectory = resolve(root, directory);
  return readdirSync(absoluteDirectory).flatMap((entry) => {
    const absolutePath = resolve(absoluteDirectory, entry);
    const relativePath = `${directory}/${entry}`.replaceAll("\\", "/");
    if (statSync(absolutePath).isDirectory()) {
      return runtimeSourceFiles(relativePath);
    }
    if (
      !/\.(ts|tsx)$/.test(entry) ||
      /\.(?:test|spec)\.(?:ts|tsx)$/.test(entry) ||
      entry === "types.generated.ts"
    ) {
      return [];
    }
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

    const directReviewReaders = runtimeSourceFiles("src").filter((path) => {
      const source = read(path);
      return /\.from\(\s*["']reviews["']\s*\)/.test(source);
    });
    expect(directReviewReaders).toEqual([
      "src/core/reviews/services/reviews.queries.ts",
    ]);
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
    expect(gastronomyAdapter).not.toContain("get_business_reviews");
    expect(businessAdapter).not.toContain("p_user_id");
    expect(businessAdapter).not.toContain("gastronomy");
  });

  it("keeps business admin and response authority on canonical helpers", () => {
    expect(businessBroker).toContain('supabaseAdmin.rpc("is_admin"');
    expect(businessBroker).toContain('"broker_user_can_manage_profile"');
    expect(businessBroker).not.toContain('.from("user_roles")');
    expect(brokerManagementMigration).toContain(
      "SELECT private.user_can_manage_profile(p_user_id, p_profile_id)",
    );
    expect(brokerManagementMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid) TO service_role",
    );
    expect(brokerManagementMigration).toContain(
      "REVOKE ALL ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid) FROM authenticated",
    );
  });

  it("keeps dormant business review SQL commands out of the active broker", () => {
    for (const functionName of [
      "can_user_review_business",
      "create_business_review",
      "update_business_review",
      "delete_business_review",
      "add_business_review_response",
    ]) {
      expect(businessBroker).not.toContain(`rpc(\"${functionName}\"`);
    }
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

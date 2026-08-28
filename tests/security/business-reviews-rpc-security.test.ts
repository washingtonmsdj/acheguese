import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("business reviews rpc broker security", () => {
  it("routes authenticated business review mutations through a server broker", () => {
    const edgeFunction = readProjectFile(
      "supabase/functions/business-reviews-rpc/index.ts",
    );
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile(
      "src/core/business/services/BusinessReviewService.ts",
    );
    const reviewQueries = readProjectFile(
      "src/core/business/services/gastronomy.review.queries.ts",
    );

    expect(config).toContain("[functions.business-reviews-rpc]");
    expect(config).toMatch(
      /\[functions\.business-reviews-rpc\]\s+verify_jwt = true/,
    );

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain(
      'getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")',
    );
    expect(edgeFunction).toContain('.from("reviews")');
    expect(edgeFunction).toContain('.from("orders")');
    expect(edgeFunction).toContain('.from("profile_members")');
    expect(edgeFunction).toContain('.from("user_roles")');
    expect(edgeFunction).toContain('.eq("user_id", auth.userId)');
    expect(edgeFunction).toContain('.eq("profile_id", profileId)');
    expect(edgeFunction).toContain('.eq("review_type", "business")');
    expect(edgeFunction).toContain("requestedReviewerProfileId");
    expect(edgeFunction).toContain(
      "canAccessProfile(supabaseAdmin, auth, requestedReviewerProfileId)",
    );
    expect(edgeFunction).toContain(
      "candidateOrder.customer_profile_id !== reviewerProfileId",
    );
    expect(edgeFunction).toContain(
      "candidateOrder.merchant_profile_id !== reviewedProfileId",
    );
    expect(edgeFunction).toContain(
      'candidateOrder.logistics_status !== "delivered"',
    );
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/p_user_id:\s*rawBody/);
    expect(edgeFunction).not.toContain(
      'supabaseAdmin.rpc("create_business_review"',
    );
    expect(edgeFunction).not.toContain(
      'supabaseAdmin.rpc("update_business_review"',
    );
    expect(edgeFunction).not.toContain(
      'supabaseAdmin.rpc("delete_business_review"',
    );
    expect(edgeFunction).not.toContain(
      'supabaseAdmin.rpc("add_business_review_response"',
    );

    expect(broker).toContain('const FUNCTION_NAME = "business-reviews-rpc"');
    expect(broker).not.toContain("p_user_id");

    expect(reviewQueries).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']can_user_review_business/,
    );
    expect(reviewQueries).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']create_business_review/,
    );
    expect(reviewQueries).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']update_business_review/,
    );
    expect(reviewQueries).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']delete_business_review/,
    );
    expect(reviewQueries).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']add_business_review_response/,
    );
  });

  it("revokes direct browser execution of the backing review RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707210813_route_business_reviews_rpcs_through_edge_function.sql",
    );

    for (const signature of [
      "public.can_user_review_business(uuid, uuid)",
      "public.create_business_review(uuid, uuid, integer, text, text[], uuid)",
      "public.update_business_review(uuid, integer, text, text[])",
      "public.delete_business_review(uuid)",
      "public.add_business_review_response(uuid, text)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Ride rating and Trust authority", () => {
  it("keeps rating mutations server-owned and private aggregates scoped", () => {
    const trustBaseline = readProjectFile(
      "supabase/migrations/20260715109000_consolidate_trust_commands.sql",
    );
    const privacyGate = readProjectFile(
      "supabase/migrations/20260909194500_scope_ride_rating_public_summary_g13.sql",
    );
    const ratingService = readProjectFile(
      "src/core/mobility/services/RideRatingService.ts",
    );
    const trustCommandService = readProjectFile(
      "src/core/trust/services/OperationalTrustCommandService.ts",
    );

    expect(trustBaseline).toContain(
      "REVOKE ALL ON TABLE public.ride_ratings FROM anon, authenticated",
    );
    expect(trustBaseline).toContain(
      "GRANT SELECT ON TABLE public.ride_ratings TO authenticated",
    );
    expect(trustBaseline).toContain("public.submit_ride_rating");
    expect(trustBaseline).toContain("public.submit_ride_trust_feedback");
    expect(trustBaseline).toContain(
      "REVOKE ALL ON TABLE public.trust_events FROM anon, authenticated",
    );
    expect(trustBaseline).toContain(
      "REVOKE ALL ON TABLE public.trust_admin_actions FROM anon, authenticated",
    );

    expect(privacyGate).toContain(
      "CREATE OR REPLACE FUNCTION public.get_ride_rating_summary",
    );
    expect(privacyGate).toContain("target.is_public = true");
    expect(privacyGate).toContain("target.user_id = v_actor_user_id");
    expect(privacyGate).toContain(
      "ride.status IN ('completed', 'delivered')",
    );
    expect(privacyGate).toContain(
      "COALESCE(private.is_admin_user(v_actor_user_id), false)",
    );
    expect(privacyGate).toContain("SET search_path TO ''");
    expect(privacyGate).toContain(
      "'average_rating', 0",
    );
    expect(privacyGate).toContain(
      "TO anon, authenticated, service_role",
    );

    expect(ratingService).toContain('"submit_ride_rating"');
    expect(ratingService).not.toMatch(
      /from\(['"]ride_ratings['"]\)[\s\S]{0,160}\.(?:insert|update|upsert|delete)\(/,
    );
    expect(trustCommandService).toContain('"submit_ride_trust_feedback"');
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("gastronomy supabase security audit", () => {
  it("hardens orders RLS and delivery RPC actor authorization", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260702100000_harden_orders_delivery_authorization.sql",
    );
    const anonDeliveryRpcRevoke = readProjectFile(
      "supabase/migrations/20260703232958_revoke_anon_delivery_rpc_execute.sql",
    );
    const overloadCleanup = readProjectFile(
      "supabase/migrations/20260703100000_drop_legacy_delivery_create_order_text_overload.sql",
    );
    const timestampFix = readProjectFile(
      "supabase/migrations/20260703113000_fix_orders_timeline_trigger_and_backfill.sql",
    );

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.auth_can_access_profile");
    expect(migration).toContain("p.user_id = auth.uid()");
    expect(migration).toContain("FROM public.profile_members pm");
    expect(migration).toContain("DROP POLICY IF EXISTS orders_select ON public.orders;");
    expect(migration).toContain("CREATE POLICY orders_select");
    expect(migration).toContain("public.auth_can_access_profile(customer_profile_id)");
    expect(migration).toContain("WITH CHECK (");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.delivery_create_order(");
    expect(migration).toContain("public.resolve_delivery_order_actor_role");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.delivery_create_order");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.delivery_update_order_notes");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.delivery_update_order_source_metadata");
    expect(anonDeliveryRpcRevoke).toContain("REVOKE ALL ON FUNCTION public.delivery_create_order");
    expect(anonDeliveryRpcRevoke).toContain("FROM anon");
    expect(anonDeliveryRpcRevoke).toContain("GRANT EXECUTE ON FUNCTION public.delivery_create_order");
    expect(anonDeliveryRpcRevoke).toContain("TO authenticated");
    expect(overloadCleanup).toContain("DROP FUNCTION IF EXISTS public.delivery_create_order(");
    expect(overloadCleanup).toContain("DROP FUNCTION IF EXISTS public.delivery_transition_logistics_status(");
    expect(overloadCleanup).toContain("DROP FUNCTION IF EXISTS public.delivery_transition_financial_status(");
    expect(overloadCleanup).toContain("DROP FUNCTION IF EXISTS public.delivery_report_occurrence(");
    expect(overloadCleanup).toContain("TEXT,");
    expect(timestampFix).toContain("DROP TRIGGER IF EXISTS log_order_timeline_event_trigger ON public.orders;");
    expect(timestampFix).toContain("DROP TRIGGER IF EXISTS log_order_timeline_event_insert_trigger ON public.orders;");
    expect(timestampFix).toContain("DROP TRIGGER IF EXISTS log_order_timeline_event_update_trigger ON public.orders;");
    expect(timestampFix).toContain("AFTER INSERT ON public.orders");
    expect(timestampFix).toContain("BEFORE UPDATE ON public.orders");
    expect(timestampFix).toContain("MIN(created_at) FILTER (WHERE to_logistics_status = 'accepted')");
    expect(timestampFix).toContain("accepted_at = COALESCE(o.accepted_at, s.accepted_at)");
  });

  it("persists active business profile selection with owner checks", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260703212954_persist_active_profile_selection.sql",
    );

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.user_active_profiles");
    expect(migration).toContain("ALTER TABLE public.profile_members");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true");
    expect(migration).toContain("user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE");
    expect(migration).toContain("profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE");
    expect(migration).toContain("ALTER TABLE public.user_active_profiles ENABLE ROW LEVEL SECURITY;");
    expect(migration).toContain("REVOKE ALL ON TABLE public.user_active_profiles FROM authenticated;");
    expect(migration).not.toContain("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_active_profiles TO authenticated");

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.switch_active_profile(");
    expect(migration).toContain("v_auth_user_id UUID := auth.uid();");
    expect(migration).toContain("Cannot switch active profile for another user");
    expect(migration).toContain("p.user_id = v_target_user_id");
    expect(migration).toContain("FROM public.profile_members pm");
    expect(migration).toContain("pm.user_id = v_target_user_id");
    expect(migration).toContain("p.is_active = true");
    expect(migration).toContain("p.is_suspended = false");
    expect(migration).toContain("ON CONFLICT (user_id)");
    expect(migration).not.toContain("is_admin_from_roles");

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.get_active_profile(");
    expect(migration).toContain("RETURNS SETOF public.profiles");
    expect(migration).toContain("LEFT JOIN public.user_active_profiles uap");
    expect(migration).toContain("WHEN uap.profile_id IS NOT NULL THEN 0");
    expect(migration).toContain("WHEN p.profile_type = 'personal' THEN 1");

    expect(migration).toContain("REVOKE ALL ON FUNCTION public.switch_active_profile(UUID, UUID) FROM PUBLIC;");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_active_profile(UUID) FROM PUBLIC;");
  });

  it("keeps public gastronomy views and engagement RPCs least-privilege", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260703233803_harden_gastronomy_public_views_and_engagement_rpcs.sql",
    );
    const favoritesMigration = readProjectFile(
      "supabase/migrations/20260423000000_create_user_favorites_system.sql",
    );
    const recommendationsMigration = readProjectFile(
      "supabase/migrations/20260423000002_create_business_recommendations_system.sql",
    );

    expect(migration).toContain(
      "ALTER VIEW public.gastronomy_profiles_with_niche_info",
    );
    expect(migration).toContain("SET (security_invoker = true)");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.gastronomy_profiles_with_niche_info FROM anon;",
    );
    expect(migration).toContain(
      "GRANT SELECT ON TABLE public.gastronomy_profiles_with_niche_info TO anon;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.user_favorite_businesses FROM anon;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.user_recommended_businesses FROM anon;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.review_helpfulness FROM anon;",
    );

    expect(migration).toContain("ALTER FUNCTION public.is_business_favorited(UUID, UUID)");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.toggle_business_favorite(UUID, UUID) FROM anon;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.toggle_business_recommendation(UUID, UUID) FROM anon;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.sync_gastronomy_plan_tier() FROM authenticated;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.update_review_helpfulness_counts() FROM authenticated;",
    );

    expect(favoritesMigration).toContain(
      'CREATE POLICY "Users manage own favorites"',
    );
    expect(favoritesMigration).toContain("USING (user_id = auth.uid())");
    expect(favoritesMigration).toContain("WITH CHECK (user_id = auth.uid())");
    expect(recommendationsMigration).toContain(
      'CREATE POLICY "Users manage own business recommendations"',
    );
    expect(recommendationsMigration).toContain("USING (user_id = auth.uid())");
    expect(recommendationsMigration).toContain("WITH CHECK (user_id = auth.uid())");
  });

  it("defines review mutation RPCs with explicit profile authorization", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260703235508_create_gastronomy_review_mutation_rpcs.sql",
    );

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.create_business_review(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.update_business_review(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.delete_business_review(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.add_business_review_response(");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("public.auth_can_access_profile(p_reviewer_profile_id)");
    expect(migration).toContain("public.auth_can_access_profile(v_review.reviewer_profile_id)");
    expect(migration).toContain("public.auth_can_access_profile(v_review.reviewed_profile_id)");
    expect(migration).toContain("v_order.customer_profile_id IS DISTINCT FROM p_reviewer_profile_id");
    expect(migration).toContain("v_order.merchant_profile_id IS DISTINCT FROM p_reviewed_profile_id");
    expect(migration).toContain("v_order.logistics_status::TEXT <> 'delivered'");
  });

  it("keeps public business review reads invoker-scoped", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707112353_harden_get_business_reviews_invoker.sql",
    );

    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER");
    expect(migration).toContain("ON TABLE public.reviews");
    expect(migration).toContain("FROM anon");
    expect(migration).toContain("GRANT SELECT");
    expect(migration).toContain("TO anon, authenticated");
    expect(migration).toContain("-- security-authority: public-rpc public.get_business_reviews");
    expect(migration).toContain("ALTER FUNCTION public.get_business_reviews(uuid, integer, integer)");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("REVOKE ALL");
    expect(migration).toContain("ON FUNCTION public.get_business_reviews(uuid, integer, integer)");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE");
  });

  it("keeps public menu discovery RPCs invoker-scoped", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707113531_harden_gastronomy_public_menu_rpcs_invoker.sql",
    );

    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER");
    expect(migration).toContain("public.menus");
    expect(migration).toContain("public.menu_categories");
    expect(migration).toContain("public.menu_items");
    expect(migration).toContain("public.menu_promotions");
    expect(migration).toContain("FROM anon");
    expect(migration).toContain("GRANT SELECT");
    expect(migration).toContain("TO anon, authenticated");

    expect(migration).toContain("-- security-authority: public-rpc public.get_featured_menu_items");
    expect(migration).toContain("ALTER FUNCTION public.get_featured_menu_items(uuid)");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("ON FUNCTION public.get_featured_menu_items(uuid)");

    expect(migration).toContain("-- security-authority: public-rpc public.get_active_promotions");
    expect(migration).toContain("ALTER FUNCTION public.get_active_promotions(uuid)");
    expect(migration).toContain("ON FUNCTION public.get_active_promotions(uuid)");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE");
  });

  it("keeps public activity feed constrained to public review activity", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707114642_harden_gastronomy_activity_rpc_privacy.sql",
    );

    expect(migration).toContain("-- security-authority: public-rpc public.get_recent_gastronomy_activities");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.get_recent_gastronomy_activities");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50)");
    expect(migration).toContain("COALESCE(array_length(p_types, 1), 0) = 0");
    expect(migration).toContain("FROM public.reviews r");
    expect(migration).toContain("bd.profile_id = r.reviewed_profile_id");
    expect(migration).toContain("bd.status = 'active'");
    expect(migration).toContain("gp.status = 'active'");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO anon, authenticated");

    expect(migration).not.toContain("SECURITY DEFINER");
    expect(migration).not.toContain("user_favorite_businesses");
    expect(migration).not.toContain("FROM public.orders");
    expect(migration).not.toContain("delivery_requests");
    expect(migration).not.toContain("dr.id IS NULL");
  });
  it("aligns Gastronomy management policies with canonical profile authority", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260904232530_align_gastronomy_profile_management_authority_g6.sql",
    );

    for (const policy of [
      "Owners manage own gastronomy profile",
      "Owners manage own menus",
      "Owners manage own categories",
      "Owners manage own items",
      "Owners manage own variants",
      "Owners manage own addons",
      "Owners manage own availability",
      "Owners manage own promotions",
      "Owners view own upgrade history",
    ]) {
      expect(migration).toContain(`ALTER POLICY "${policy}"`);
    }

    expect(migration.match(/private\.can_manage_profile\(bd\.profile_id\)/g)).toHaveLength(17);
    expect(migration.match(/WITH CHECK \(/g)).toHaveLength(8);
    expect(migration).not.toContain("p.user_id = auth.uid()");
    expect(migration).not.toContain("profiles p");
    expect(migration).not.toContain("DROP POLICY");
    expect(migration).not.toContain("GRANT ");
    expect(migration).not.toContain("REVOKE ");
  });

});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function viewDefinition(sql: string, viewName: string): string {
  const start = sql.indexOf(`CREATE VIEW ${viewName}`);
  if (start < 0) return "";
  const end = sql.indexOf("COMMENT ON VIEW", start);
  return sql.slice(start, end < 0 ? undefined : end);
}

describe("community supabase security audit", () => {
  it("keeps canonical residence and public profile location privacy RLS-backed", () => {
    const foundation = readProjectFile(
      "supabase/migrations/20260412000000_create_core_identity_business_foundation.sql",
    );
    const publicProfiles = readProjectFile(
      "supabase/migrations/20260513090000_profile_public_location_visibility_ssot.sql",
    );
    const publicProfileView = viewDefinition(publicProfiles, "public_profiles");

    expect(foundation).toContain("ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;");
    expect(foundation).toContain('CREATE POLICY "Users manage own addresses"');
    expect(foundation).toContain("WITH CHECK (owner_user_id = auth.uid())");
    expect(foundation).toContain("CREATE VIEW public.addresses_public AS");
    expect(foundation).toContain("GRANT SELECT ON public.addresses_public TO anon, authenticated;");

    const addressesPublicStart = foundation.indexOf("CREATE VIEW public.addresses_public AS");
    const addressesPublicEnd = foundation.indexOf("FROM public.addresses", addressesPublicStart);
    const addressesPublicProjection = foundation.slice(addressesPublicStart, addressesPublicEnd);
    expect(addressesPublicProjection).not.toMatch(/\bstreet\b|\bnumber\b|\bcomplement\b|\bpostal_code\b|\bowner_user_id\b/i);

    expect(foundation).toContain("ALTER TABLE public.user_residences ENABLE ROW LEVEL SECURITY;");
    expect(foundation).toContain('CREATE POLICY "Users manage own residences"');
    expect(foundation).toContain("USING (user_id = auth.uid())");
    expect(foundation).toContain("WITH CHECK (user_id = auth.uid())");

    expect(publicProfiles).toContain("ADD COLUMN IF NOT EXISTS public_location_visibility");
    expect(publicProfiles).toContain("FROM user_residences ur");
    expect(publicProfileView).not.toMatch(/\bstreet\b|\bnumber\b|\bcomplement\b|\bpostal_code\b|\baddress_id\b/i);
  });

  it("keeps community and business identity tables under RLS with public reads scoped to public fields", () => {
    const foundation = readProjectFile(
      "supabase/migrations/20260412000000_create_core_identity_business_foundation.sql",
    );
    const communities = readProjectFile(
      "supabase/migrations/20260514094500_create_territory_communities.sql",
    );
    const aliases = readProjectFile(
      "supabase/migrations/20260601090000_create_community_public_aliases.sql",
    );

    expect(foundation).toContain("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;");
    expect(foundation).toContain("ALTER TABLE public.business_data ENABLE ROW LEVEL SECURITY;");
    expect(foundation).toContain("CREATE TABLE IF NOT EXISTS public.business_data");
    expect(foundation).toContain("profile_id UUID NOT NULL REFERENCES public.profiles");

    expect(communities).toContain("ALTER TABLE territory_communities ENABLE ROW LEVEL SECURITY;");
    expect(communities).toContain('CREATE POLICY "territory_communities_public_select"');
    expect(communities).toContain("USING (true);");
    expect(communities).toContain("GRANT SELECT ON territory_communities TO anon, authenticated;");

    expect(aliases).toContain("ALTER TABLE community_public_aliases ENABLE ROW LEVEL SECURITY;");
    expect(aliases).toContain('CREATE POLICY "community_public_aliases_public_select"');
    expect(aliases).toContain("status = 'active'");
    expect(aliases).toContain("GRANT SELECT ON community_public_aliases TO anon, authenticated;");
    expect(aliases).toContain("CONSTRAINT community_public_aliases_alias_not_reserved");
  });

  it("keeps community memberships private, RLS-backed, and owned by community-experience", () => {
    const memberships = readProjectFile(
      "supabase/migrations/20260708215101_create_community_memberships_ssot.sql",
    );
    const repository = readProjectFile(
      "src/core/community-experience/repositories/CommunityMembershipRepository.ts",
    );
    const taxonomy = readProjectFile("scripts/validate-project-taxonomy.ts");

    expect(memberships).toContain("CREATE TABLE IF NOT EXISTS public.community_memberships");
    expect(memberships).toContain("community_id UUID NOT NULL REFERENCES public.territory_communities");
    expect(memberships).toContain("profile_id UUID NOT NULL REFERENCES public.profiles");
    expect(memberships).toContain("user_id UUID NOT NULL REFERENCES auth.users");
    expect(memberships).toContain("ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;");
    expect(memberships).toContain("REVOKE ALL ON TABLE public.community_memberships FROM anon;");
    expect(memberships).toContain(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_memberships TO authenticated;",
    );
    expect(memberships).toContain("CREATE POLICY community_memberships_select_own_or_manager");
    expect(memberships).toContain("CREATE POLICY community_memberships_insert_self_pending");
    expect(memberships).toContain("AND join_method IN ('open', 'approval')");
    expect(memberships).toContain("CREATE POLICY community_memberships_update_by_manager");
    expect(memberships).toContain("CREATE POLICY community_memberships_delete_self_or_manager");
    expect(memberships).toContain("CREATE OR REPLACE FUNCTION private.can_manage_community_membership");
    expect(memberships).toContain("SECURITY DEFINER");
    expect(memberships).toContain("SET search_path = public, private, pg_temp");
    expect(memberships).toContain("Not exposed as public RPC");

    expect(repository).toContain('.from("community_memberships" as never)');
    expect(taxonomy).toContain("community_memberships");
    expect(taxonomy).toContain("CommunityMembershipRepository.ts");
  });

  it("keeps community entity links RLS-backed and owned by community-experience", () => {
    const links = readProjectFile(
      "supabase/migrations/20260708224334_create_community_entity_links_ssot.sql",
    );
    const repository = readProjectFile(
      "src/core/community-experience/repositories/CommunityEntityLinkRepository.ts",
    );
    const service = readProjectFile(
      "src/core/community-experience/services/CommunityEntityLinkService.ts",
    );
    const taxonomy = readProjectFile("scripts/validate-project-taxonomy.ts");
    const architecture = readProjectFile(
      "docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md",
    );

    expect(links).toContain("CREATE TABLE IF NOT EXISTS public.community_entity_links");
    expect(links).toContain("community_id UUID NOT NULL REFERENCES public.territory_communities");
    expect(links).toContain("entity_type TEXT NOT NULL");
    expect(links).toContain("entity_id UUID NOT NULL");
    expect(links).toContain("CHECK (entity_type IN ('business', 'event', 'classified', 'professional', 'post', 'tourist_point'))");
    expect(links).toContain("CHECK (link_type IN ('primary_territory', 'serves_area', 'featured', 'sponsored', 'member_submitted', 'official'))");
    expect(links).toContain("CHECK (status IN ('pending', 'active', 'rejected', 'hidden', 'expired'))");
    expect(links).toContain("ALTER TABLE public.community_entity_links ENABLE ROW LEVEL SECURITY;");
    expect(links).toContain("GRANT SELECT ON TABLE public.community_entity_links TO anon;");
    expect(links).toContain(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_entity_links TO authenticated;",
    );
    expect(links).toContain("CREATE POLICY community_entity_links_public_active_select");
    expect(links).toContain("CREATE POLICY community_entity_links_insert_member_pending");
    expect(links).toContain("CREATE POLICY community_entity_links_update_by_manager");
    expect(links).toContain("CREATE POLICY community_entity_links_delete_by_manager");
    expect(links).toContain("CREATE OR REPLACE FUNCTION private.can_manage_community_entity_link");
    expect(links).toContain("CREATE OR REPLACE FUNCTION private.community_entity_link_target_is_visible");
    expect(links).toContain("CREATE OR REPLACE FUNCTION private.enforce_community_entity_link_contract");
    expect(links).toContain("SECURITY DEFINER");
    expect(links).toContain("SET search_path = public, private, pg_temp");
    expect(links).toContain("Not exposed as public RPC");

    expect(repository).toContain('.from("community_entity_links" as never)');
    expect(service).toContain("CommunityEntityLinkRepository");
    expect(service).toContain("listActiveByCommunity");
    expect(taxonomy).toContain("community_entity_links");
    expect(taxonomy).toContain("CommunityEntityLinkRepository.ts");
    expect(architecture).toContain("community_entity_links");
    expect(architecture).toContain("CommunityEntityLinkRepository.ts");
  });

  it("wires community entity links into public discovery without bypassing the SSOT", () => {
    const landingFeatured = readProjectFile(
      "src/core/landing/services/LandingFeaturedService.ts",
    );
    const landingHook = readProjectFile("src/core/landing/hooks/useLandingFeatured.ts");
    const territorialLanding = readProjectFile(
      "src/core/routing/components/TerritorialLandingPage.tsx",
    );
    const communitySidebar = readProjectFile(
      "src/core/community/components/CommunityRightSidebar.tsx",
    );
    const communityPage = readProjectFile("src/core/community/pages/ComunidadePage.tsx");

    expect(landingFeatured).toContain("CommunityEntityLinkService");
    expect(landingFeatured).toContain("getCommunityFeaturedBusinesses");
    expect(landingFeatured).toContain("getCommunityFeaturedServices");
    expect(landingFeatured).toContain("getCommunityFeaturedGastronomyBusinesses");
    expect(landingFeatured).toContain("getCommunityFeaturedClassifieds");
    expect(landingFeatured).toContain("getGastronomyBusinessesByIds");
    expect(landingFeatured).toContain("orderGastronomyByLinkedBusinessIds");
    expect(landingHook).toContain("communityId");
    expect(landingHook).toContain("getCommunityFeaturedBusinesses");
    expect(landingHook).toContain("getCommunityFeaturedGastronomyBusinesses");
    expect(territorialLanding).toContain("useCommunityProfile");
    expect(territorialLanding).toContain("isPersistedCommunityId");
    expect(territorialLanding).toContain("useLandingFeatured(filter, {");
    expect(territorialLanding).toContain("gastronomy.length > 0");
    expect(territorialLanding).not.toContain(".filter(b => ['restaurante'");
    expect(communitySidebar).toContain("getCommunityFeaturedBusinesses");
    expect(communitySidebar).not.toContain("BusinessService.getBusinessesList");
    expect(communityPage).toContain("linkedCommunityId");
    expect(communityPage).toContain("communityId={linkedCommunityId}");
  });

  it("keeps event reads and mutations centralized in core/verticals/events before broad reactivation", () => {
    const eventReadService = readProjectFile(
      "src/core/verticals/events/services/EventReadService.ts",
    );
    const eventMutationService = readProjectFile(
      "src/core/verticals/events/services/EventMutationService.ts",
    );
    const eventRpc = readProjectFile("supabase/functions/event-rpc/index.ts");
    const eventRpcMigration = readProjectFile(
      "supabase/migrations/20260709005208_atomic_event_participation_rpcs.sql",
    );
    const communityEventsRuntime = readProjectFile(
      "src/core/community/services/CommunityEventsRuntimeService.ts",
    );
    const eventAdapter = readProjectFile("src/features/events/utils/eventAdapters.ts");
    const architecture = readProjectFile(
      "docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md",
    );
    const plan = readProjectFile("plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md");

    expect(eventReadService).toContain('.from<EventRowWithLegacyCity>("events")');
    expect(eventReadService).toContain("applyTerritoryFilter");
    expect(eventReadService).toContain("getEventsPage");
    expect(eventReadService).toContain("getByBounds");
    expect(communityEventsRuntime).toContain("eventsReadService.getEventsPage");
    expect(communityEventsRuntime).toContain("eventsReadService.getByBounds");
    expect(eventMutationService).toContain(".from(\"events\")");
    expect(eventMutationService).toContain(".from(\"event_participants\")");
    expect(eventMutationService).toContain("invokeSupabaseBroker");
    expect(eventMutationService).toContain('const EVENT_RPC_FUNCTION_NAME = "event-rpc"');
    expect(eventMutationService).toContain("functionName: EVENT_RPC_FUNCTION_NAME");
    expect(eventMutationService).toContain('"joinEvent"');
    expect(eventMutationService).toContain('"checkInEventByCode"');
    expect(eventMutationService).not.toContain("incrementEventParticipants");
    expect(eventMutationService).not.toContain("decrementEventParticipants");
    expect(eventRpc).toContain("join_event_participation");
    expect(eventRpc).toContain("check_in_event_participation_by_code");
    expect(eventRpcMigration).toContain("CREATE OR REPLACE FUNCTION public.join_event_participation");
    expect(eventRpcMigration).toContain("CREATE OR REPLACE FUNCTION public.leave_event_participation");
    expect(eventRpcMigration).toContain("CREATE OR REPLACE FUNCTION public.check_in_event_participation");
    expect(eventRpcMigration).toContain("REVOKE ALL ON FUNCTION public.join_event_participation");
    expect(eventRpcMigration).toContain("GRANT EXECUTE ON FUNCTION public.join_event_participation");
    expect(communityEventsRuntime).toContain("eventMutationService.joinEvent");
    expect(communityEventsRuntime).not.toContain(".from(\"event_participants\")");
    expect(eventAdapter).toContain('from "@/core/verticals/events"');
    expect(architecture).toContain("src/core/verticals/events");
    expect(architecture).toContain("EventMutationService");
    expect(plan).toContain("criar/confirmar `core/verticals/events` para leitura publica");
    expect(plan).toContain("EventMutationService");
  });

  it("requires verified residence for community alert and issue creation RPCs", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260706100000_harden_community_creation_residence_authorization.sql",
    );
    const launchScope = readProjectFile("src/config/launchScope.ts");

    expect(hardening).toContain(
      "CREATE OR REPLACE FUNCTION public.auth_has_verified_residence_at_location",
    );
    expect(hardening).toContain("FROM public.user_residences ur");
    expect(hardening).toContain("ur.user_id = auth.uid()");
    expect(hardening).toContain("ur.location_id = p_location_id");
    expect(hardening).toContain("ur.is_verified = TRUE");

    expect(hardening).toContain("CREATE OR REPLACE FUNCTION public.create_community_alert");
    expect(hardening).toContain("CREATE OR REPLACE FUNCTION public.create_community_issue");
    expect(hardening).toContain("IF NOT public.auth_has_verified_residence_at_location(v_location_id) THEN");
    expect(hardening).toContain("verified_residence_required");
    expect(hardening).toContain("REVOKE ALL ON FUNCTION public.create_community_alert(jsonb) FROM anon;");
    expect(hardening).toContain("GRANT EXECUTE ON FUNCTION public.create_community_alert(jsonb) TO authenticated;");
    expect(hardening).toContain("REVOKE ALL ON FUNCTION public.create_community_issue(JSONB) FROM anon;");
    expect(hardening).toContain("GRANT EXECUTE ON FUNCTION public.create_community_issue(JSONB) TO authenticated;");

    expect(launchScope).toContain("communityAlerts: false");
    expect(launchScope).toContain("communityIssues: false");
  });

  it("keeps community social writes tied to the authenticated profile author", () => {
    const social = readProjectFile(
      "supabase/migrations/20260418060000_create_community_domain.sql",
    );
    const groups = readProjectFile(
      "supabase/migrations/20260418080000_create_other_domains.sql",
    );
    const lostFound = readProjectFile(
      "supabase/migrations/20260419100000_create_lost_found_system.sql",
    );
    const hardening = readProjectFile(
      "supabase/migrations/20260706101000_harden_community_social_rls_author_checks.sql",
    );

    expect(social).toContain("ALTER TABLE posts ENABLE ROW LEVEL SECURITY;");
    expect(social).toContain("ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;");
    expect(social).toContain("ALTER TABLE post_likes_new ENABLE ROW LEVEL SECURITY;");
    expect(social).toContain("ALTER TABLE comments ENABLE ROW LEVEL SECURITY;");
    expect(groups).toContain("ALTER TABLE groups ENABLE ROW LEVEL SECURITY;");
    expect(lostFound).toContain("ALTER TABLE lost_found_posts ENABLE ROW LEVEL SECURITY;");
    expect(lostFound).toContain("ALTER TABLE lost_found_comments ENABLE ROW LEVEL SECURITY;");

    expect(hardening).toContain('DROP POLICY IF EXISTS "Authors manage own posts" ON public.posts;');
    expect(hardening).toContain('DROP POLICY IF EXISTS "Authors manage own community questions"');
    expect(hardening).toContain('DROP POLICY IF EXISTS "Users manage own likes" ON public.post_likes_new;');
    expect(hardening).toContain('DROP POLICY IF EXISTS "Authors manage own comments" ON public.comments;');
    expect(hardening).toContain('DROP POLICY IF EXISTS "Authenticated users create groups" ON public.groups;');
    expect(hardening).toContain('DROP POLICY IF EXISTS "Users manage own memberships" ON public.group_members_new;');
    expect(hardening).toContain('DROP POLICY IF EXISTS "Authors update own posts" ON public.lost_found_posts;');
    expect(hardening).toContain("WITH CHECK (");
    expect(hardening).toContain("SELECT id FROM public.profiles WHERE user_id = auth.uid()");
  });

  it("keeps community report moderation behind own-profile or admin policies", () => {
    const reports = readProjectFile(
      "supabase/migrations/20260526024500_create_community_moderation_reports.sql",
    );

    expect(reports).toContain("ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;");
    expect(reports).toContain("CREATE POLICY community_reports_insert_own");
    expect(reports).toContain("reporter_profile_id IN (");
    expect(reports).toContain("SELECT id FROM public.profiles WHERE user_id = auth.uid()");
    expect(reports).toContain("CREATE POLICY community_reports_select_own_or_admin");
    expect(reports).toContain("OR public.is_admin_user(auth.uid())");
    expect(reports).toContain("CREATE POLICY community_reports_admin_update");
    expect(reports).toContain("CREATE POLICY community_reports_admin_delete");
  });

  it("keeps LGPD consent RPCs scoped to the authenticated user, admin, or service role", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260707102718_harden_lgpd_consent_rpc_authorization.sql",
    );
    const brokerRouting = readProjectFile(
      "supabase/migrations/20260707212504_route_privacy_session_rpcs_through_edge_functions.sql",
    );

    expect(hardening).toContain("CREATE OR REPLACE FUNCTION public.has_consent(");
    expect(hardening).toContain("CREATE OR REPLACE FUNCTION public.record_consent(");
    expect(hardening).toContain("SET search_path = public, pg_temp");
    expect(hardening).toContain("v_request_user_id UUID := auth.uid();");
    expect(hardening).toContain("COALESCE(auth.jwt() ->> 'role', '') = 'service_role'");
    expect(hardening).toContain("v_request_user_id <> p_user_id");
    expect(hardening).toContain("public.is_admin_from_roles(v_request_user_id)");

    expect(hardening).toContain("REVOKE ALL ON FUNCTION public.has_consent(UUID, VARCHAR) FROM anon;");
    expect(hardening).toContain(
      "REVOKE ALL ON FUNCTION public.record_consent(UUID, VARCHAR, BOOLEAN, INET, TEXT, VARCHAR, VARCHAR) FROM anon;",
    );
    expect(hardening).toContain("GRANT EXECUTE ON FUNCTION public.has_consent(UUID, VARCHAR) TO authenticated;");
    expect(brokerRouting).toContain(
      "REVOKE ALL ON FUNCTION public.record_consent(uuid, character varying, boolean, inet, text, character varying, character varying)",
    );
    expect(brokerRouting).toContain("FROM PUBLIC, anon, authenticated");
    expect(brokerRouting).toContain(
      "GRANT EXECUTE ON FUNCTION public.record_consent(uuid, character varying, boolean, inet, text, character varying, character varying)",
    );
    expect(brokerRouting).toContain("TO service_role");
  });

  it("keeps username login email lookup out of the browser RPC surface", () => {
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");
    const loginFunction = readProjectFile("supabase/functions/auth-username-login/index.ts");
    const functionConfig = readProjectFile("supabase/config.toml");
    const hardening = readProjectFile(
      "supabase/migrations/20260707103853_harden_username_auth_rpc_surface.sql",
    );

    expect(authService).not.toContain("get_email_by_username");
    expect(authService).toContain('buildSupabaseFunctionUrl("auth-username-login")');
    expect(authService).toContain("supabase.auth.setSession");
    expect(authService).toContain("Para recuperar senha, informe o e-mail cadastrado.");

    expect(loginFunction).toContain("rateLimitMiddleware(req, 8, 60_000)");
    expect(loginFunction).toContain('rpc("get_email_by_username"');
    expect(loginFunction).toContain("signInWithPassword");
    expect(loginFunction).toContain("returnSessionPayload");
    expect(loginFunction).toContain("INVALID_LOGIN_MESSAGE");
    expect(loginFunction).not.toMatch(/session:\s*\{[\s\S]{0,240}email/i);
    expect(loginFunction).not.toContain('.from("profiles")');

    expect(functionConfig).toContain("[functions.auth-username-login]");
    expect(functionConfig).toContain("verify_jwt = false");

    expect(hardening).toContain("p.proname = 'get_email_by_username'");
    expect(hardening).toContain("REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC");
    expect(hardening).toContain("REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon");
    expect(hardening).toContain("REVOKE ALL ON FUNCTION %I.%I(%s) FROM authenticated");
    expect(hardening).toContain("GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role");
  });

  it("keeps public site setting reads invoker-scoped and least-privilege", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260707111214_harden_get_site_setting_invoker.sql",
    );

    expect(hardening).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER");
    expect(hardening).toContain("ON TABLE public.site_settings");
    expect(hardening).toContain("FROM anon, authenticated");
    expect(hardening).toContain("GRANT SELECT");
    expect(hardening).toContain("TO anon, authenticated");
    expect(hardening).toContain("-- security-authority: public-rpc public.get_site_setting");
    expect(hardening).toContain("ALTER FUNCTION public.get_site_setting(text)");
    expect(hardening).toContain("SECURITY INVOKER");
    expect(hardening).toContain("REVOKE ALL");
    expect(hardening).toContain("ON FUNCTION public.get_site_setting(text)");
    expect(hardening).toContain("FROM PUBLIC, anon, authenticated");
    expect(hardening).toContain("GRANT EXECUTE");
  });

  it("keeps public territorial descendant lookup invoker-scoped", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260707115617_harden_location_descendants_rpc_invoker.sql",
    );

    expect(hardening).toContain("-- security-authority: public-rpc public.rpc_get_location_descendants_ids");
    expect(hardening).toContain("ALTER FUNCTION public.rpc_get_location_descendants_ids(uuid)");
    expect(hardening).toContain("SECURITY INVOKER");
    expect(hardening).toContain("SET search_path = public, pg_temp");
    expect(hardening).toContain("FROM PUBLIC, anon, authenticated");
    expect(hardening).toContain("TO anon, authenticated");
    expect(hardening).not.toContain("SECURITY DEFINER");
  });

  it("keeps public brand branch lookup invoker-scoped", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260707120534_harden_brand_branches_rpc_invoker.sql",
    );

    expect(hardening).toContain("-- security-authority: public-rpc public.get_brand_branches");
    expect(hardening).toContain("ALTER FUNCTION public.get_brand_branches(uuid)");
    expect(hardening).toContain("SECURITY INVOKER");
    expect(hardening).toContain("SET search_path = public, pg_temp");
    expect(hardening).toContain("FROM PUBLIC, anon, authenticated");
    expect(hardening).toContain("TO anon, authenticated");
    expect(hardening).not.toContain("SECURITY DEFINER");
  });

  it("keeps public district point matching invoker-scoped and GeoJSON-safe", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260707120937_harden_match_district_by_point_rpc_invoker.sql",
    );

    expect(hardening).toContain("-- security-authority: public-rpc public.rpc_match_district_by_point");
    expect(hardening).toContain("CREATE OR REPLACE FUNCTION public.rpc_match_district_by_point");
    expect(hardening).toContain("SECURITY INVOKER");
    expect(hardening).toContain("SET search_path = public, extensions, pg_temp");
    expect(hardening).toContain("ST_GeomFromGeoJSON(nb.geometry::text)");
    expect(hardening).toContain("ST_Contains(");
    expect(hardening).toContain("FROM PUBLIC, anon, authenticated");
    expect(hardening).toContain("TO anon, authenticated");
    expect(hardening).not.toContain("SECURITY DEFINER");
    expect(hardening).not.toContain("ST_Contains(\n    nb.geometry");
  });

  it("keeps public lost-and-found read RPCs invoker-scoped", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260707121321_harden_lost_found_public_read_rpcs_invoker.sql",
    );

    expect(hardening).toContain("-- security-authority: public-rpc public.count_lost_found_posts_by_type");
    expect(hardening).toContain("ALTER FUNCTION public.count_lost_found_posts_by_type()");
    expect(hardening).toContain("SECURITY INVOKER");
    expect(hardening).toContain("ON FUNCTION public.count_lost_found_posts_by_type()");

    expect(hardening).toContain("-- security-authority: public-rpc public.find_similar_lost_found_posts");
    expect(hardening).toContain("CREATE OR REPLACE FUNCTION public.find_similar_lost_found_posts");
    expect(hardening).toContain("LIMIT LEAST(GREATEST(COALESCE(p_limit, 5), 1), 20)");
    expect(hardening).toContain("ON FUNCTION public.find_similar_lost_found_posts(uuid, integer)");

    expect(hardening).toContain("SET search_path = public, pg_temp");
    expect(hardening).toContain("FROM PUBLIC, anon, authenticated");
    expect(hardening).toContain("TO anon, authenticated");
    expect(hardening).not.toContain("SECURITY DEFINER");
  });

  it("keeps remote advisor public views configured as security invoker", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260706102000_harden_remote_advisor_security_definer_views.sql",
    );
    const advisorViews = [
      "active_user_consents",
      "addresses_public",
      "analytics_kpis",
      "community_alerts_public",
      "community_issues_public",
      "driver_complete_profile",
      "locations_coordinates_status",
      "personal_social_profiles",
      "pii_access_stats",
      "public_business_search",
      "public_professional_search",
      "public_profile_links",
      "public_profiles",
      "public_work_opportunity_search",
      "territory_aliases",
      "user_companies",
      "user_organizations",
      "user_professional_profiles",
      "work_opportunity_match_candidates",
    ];

    for (const viewName of advisorViews) {
      expect(hardening).toContain(
        `ALTER VIEW IF EXISTS public.${viewName} SET (security_invoker = true);`,
      );
    }
  });

  it("hardens remote advisor always-true RLS policies with clear ownership columns", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260706103000_harden_remote_advisor_always_true_rls_subset.sql",
    );

    expect(hardening).toContain(
      'DROP POLICY IF EXISTS "Authenticated users can create addresses" ON public.addresses;',
    );
    expect(hardening).toContain('DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;');
    expect(hardening).toContain("USING (owner_user_id = auth.uid())");
    expect(hardening).toContain("WITH CHECK (owner_user_id = auth.uid())");

    expect(hardening).toContain(
      'DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.classified_reports;',
    );
    expect(hardening).toContain("DROP POLICY IF EXISTS classified_reports_insert_own ON public.classified_reports;");
    expect(hardening).toContain("CREATE POLICY classified_reports_insert_own");
    expect(hardening).toContain("reporter_id IN (");
    expect(hardening).toContain("WHERE p.user_id = auth.uid()");
  });

  it("removes public Storage object listing policies reported by the remote advisor", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260706104000_harden_public_storage_listing_policies.sql",
    );
    const publicListingPolicies = [
      '"Avatar images are publicly accessible"',
      '"Business images are publicly accessible"',
      '"Post images are publicly accessible"',
      '"Event images are publicly accessible"',
      '"Classified images are publicly accessible"',
      "public_assets_select_public",
    ];

    for (const policyName of publicListingPolicies) {
      expect(hardening).toContain(`DROP POLICY IF EXISTS ${policyName} ON storage.objects;`);
    }
  });

  it("pins search_path for the first reviewed remote advisor function subset", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260706162154_harden_function_search_path_low_risk_subset.sql",
    );
    const functionNames = [
      "get_emergency_contacts",
      "get_utility_contacts",
      "get_tourist_attractions",
      "get_city_hall_info",
      "get_elected_officials",
      "get_featured_districts",
      "update_tourist_points_updated_at",
      "update_classified_reports_updated_at",
      "update_operational_verifications_updated_at",
      "update_education_profiles_updated_at",
      "toggle_comment_like",
      "log_order_timeline_event",
      "handle_new_user_profile",
      "get_location_descendants",
      "delivery_resolve_actor_role",
      "fn_generate_classified_public_id",
      "sync_comment_likes_count",
      "create_community_alert",
      "increment_alert_edit_count",
      "create_user_residence_with_canonical",
      "create_ride_request_with_canonical",
      "create_business_data_with_canonical",
      "create_professional_data_with_canonical",
      "find_entities_with_coverage",
      "sync_user_roles_is_active",
    ];

    expect(hardening).toContain("pg_get_function_identity_arguments(p.oid)");
    expect(hardening).toContain("SET search_path = public, extensions, pg_temp");
    expect(hardening).not.toContain("'exec_sql'");

    for (const functionName of functionNames) {
      expect(hardening).toContain(`'${functionName}'`);
    }
  });

  it("pins search_path for the second reviewed remote advisor function subset", () => {
    const hardening = readProjectFile(
      "supabase/migrations/20260706163017_harden_function_search_path_second_subset.sql",
    );
    const functionNames = [
      "is_super_admin",
      "validate_location_coordinates",
      "fn_record_profile_username_history",
      "get_inherited_coordinates",
      "validate_profile_members_type",
      "can_use_premium_link",
      "process_dispatch_timeouts",
      "log_role_change",
      "has_role",
      "get_user_roles",
      "check_delivery_eligibility",
      "aggregate_daily_metrics",
      "get_analytics_metrics",
      "accept_ride_atomic",
      "generate_unique_slug",
      "get_profile_by_slug",
      "get_recent_gastronomy_activities",
      "cleanup_old_logs",
      "get_logs_statistics",
      "search_logs",
      "create_professional_service_engagement_from_quote",
      "prevent_legacy_writes",
      "get_location_by_path",
      "count_lost_found_posts_by_type",
    ];

    expect(hardening).toContain("pg_get_function_identity_arguments(p.oid)");
    expect(hardening).toContain("SET search_path = public, extensions, pg_temp");
    expect(hardening).not.toMatch(/\bGRANT\b|\bREVOKE\b/i);

    for (const functionName of functionNames) {
      expect(hardening).toContain(`'${functionName}'`);
    }
  });
});

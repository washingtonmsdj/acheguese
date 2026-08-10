-- Optimize Supabase RLS auth helpers so PostgreSQL evaluates each helper
-- once per statement instead of once per candidate row.
-- Generated from pg_catalog.pg_policies and limited to public policies
-- reported by the Supabase auth_rls_initplan performance advisor.

BEGIN;
ALTER POLICY "Users can delete own addresses"
  ON "public"."addresses"
  USING (((owner_user_id IS NULL) OR (owner_user_id = (SELECT auth.uid()))));
ALTER POLICY "Users can update own addresses"
  ON "public"."addresses"
  USING (((owner_user_id IS NULL) OR (owner_user_id = (SELECT auth.uid()))));
ALTER POLICY "Users manage own addresses"
  ON "public"."addresses"
  USING ((owner_user_id = (SELECT auth.uid())))
  WITH CHECK ((owner_user_id = (SELECT auth.uid())));
ALTER POLICY "admin_mfa_enforcement_super_admin_all"
  ON "public"."admin_mfa_enforcement"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = 'super_admin'::app_role) AND (user_roles.is_active = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = 'super_admin'::app_role) AND (user_roles.is_active = true)))));
ALTER POLICY "admin_users_admin_manage"
  ON "public"."admin_users"
  USING (private.is_admin_from_roles((SELECT auth.uid())))
  WITH CHECK (private.is_admin_from_roles((SELECT auth.uid())));
ALTER POLICY "admin_users_self_read"
  ON "public"."admin_users"
  USING ((((SELECT auth.uid()) = user_id) OR private.is_admin_from_roles((SELECT auth.uid()))));
ALTER POLICY "ai_images delete own"
  ON "public"."ai_image_generations"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "ai_images insert own"
  ON "public"."ai_image_generations"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "ai_images select own"
  ON "public"."ai_image_generations"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "ai_images update own"
  ON "public"."ai_image_generations"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "ai_moderation select own"
  ON "public"."ai_moderation_log"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "ai_rate select own"
  ON "public"."ai_rate_limits"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "ai_usage select own"
  ON "public"."ai_usage_log"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "Admins can manage blocked terms"
  ON "public"."alert_blocked_terms"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "analytics_daily_metrics_owner_select"
  ON "public"."analytics_daily_metrics"
  USING (((entity_type = 'business'::text) AND (entity_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Admins can view all analytics events"
  ON "public"."analytics_events"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "analytics_events_owner_select"
  ON "public"."analytics_events"
  USING (((entity_type = 'business'::text) AND (entity_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id = (SELECT auth.uid()))))));
ALTER POLICY "analytics_events_public_insert"
  ON "public"."analytics_events"
  WITH CHECK (((entity_type <> ''::text) AND (entity_id IS NOT NULL) AND ((user_id IS NULL) OR (user_id = (SELECT auth.uid())))));
ALTER POLICY "Admins can delete logs"
  ON "public"."application_logs"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'super_admin'::text)))));
ALTER POLICY "Admins can read all logs"
  ON "public"."application_logs"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text]))))));
ALTER POLICY "Admins can view all application logs"
  ON "public"."application_logs"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "System can insert logs"
  ON "public"."application_logs"
  WITH CHECK (((user_id IS NULL) OR (user_id = (SELECT auth.uid()))));
ALTER POLICY "Users can read own logs"
  ON "public"."application_logs"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Admins manage banners"
  ON "public"."banners"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Admins podem ver audit log"
  ON "public"."billing_audit_log"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text])) AND (user_roles.is_active = true)))));
ALTER POLICY "Sistema pode gerenciar audit log"
  ON "public"."billing_audit_log"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Admins podem ver todas as transações"
  ON "public"."billing_transactions"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text])) AND (user_roles.is_active = true)))));
ALTER POLICY "Sistema pode gerenciar transações"
  ON "public"."billing_transactions"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Usuários podem ver suas transações"
  ON "public"."billing_transactions"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Admins manage all claims"
  ON "public"."business_claims"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Users create claims"
  ON "public"."business_claims"
  WITH CHECK (((claimer_id = (SELECT auth.uid())) OR (claimer_id IS NULL)));
ALTER POLICY "Users create own claims"
  ON "public"."business_claims"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users update own pending claims"
  ON "public"."business_claims"
  USING ((((claimer_id = (SELECT auth.uid())) OR (claimer_id IS NULL)) AND ((status = 'pending'::text) OR (status IS NULL))));
ALTER POLICY "Users view own claims"
  ON "public"."business_claims"
  USING (((claimer_id = (SELECT auth.uid())) OR (claimer_id IS NULL)));
ALTER POLICY "Managers can modify business data"
  ON "public"."business_data"
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = business_data.profile_id) AND ((p.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM profile_members pm
          WHERE ((pm.profile_id = business_data.profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))))));
ALTER POLICY "Owners manage own business"
  ON "public"."business_data"
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = business_data.profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM profile_members pm
  WHERE ((pm.profile_id = business_data.profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = business_data.profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM profile_members pm
  WHERE ((pm.profile_id = business_data.profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "Profile members manage business"
  ON "public"."business_data"
  USING ((profile_id IN ( SELECT profile_members.profile_id
   FROM profile_members
  WHERE ((profile_members.user_id = (SELECT auth.uid())) AND (profile_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))
  WITH CHECK ((profile_id IN ( SELECT profile_members.profile_id
   FROM profile_members
  WHERE ((profile_members.user_id = (SELECT auth.uid())) AND (profile_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));
ALTER POLICY "Users can view business data"
  ON "public"."business_data"
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = business_data.profile_id) AND ((p.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM profile_members pm
          WHERE ((pm.profile_id = business_data.profile_id) AND (pm.user_id = (SELECT auth.uid()))))))))));
ALTER POLICY "Owners manage own gallery"
  ON "public"."business_gallery"
  USING ((business_id IN ( SELECT bd.id
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Business owners can manage hours"
  ON "public"."business_hours"
  USING ((EXISTS ( SELECT 1
   FROM business_data bd
  WHERE ((bd.id = business_hours.business_id) AND (bd.profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Business owners can manage exceptions"
  ON "public"."business_hours_exceptions"
  USING ((EXISTS ( SELECT 1
   FROM business_data bd
  WHERE ((bd.id = business_hours_exceptions.business_id) AND (bd.profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Business owners can manage operation config"
  ON "public"."business_operation_config"
  USING ((EXISTS ( SELECT 1
   FROM business_data bd
  WHERE ((bd.id = business_operation_config.business_id) AND (bd.profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Empresas podem gerenciar seus links"
  ON "public"."business_premium_links"
  USING ((business_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own products"
  ON "public"."business_products"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own services"
  ON "public"."business_services"
  USING ((business_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own stats"
  ON "public"."business_stats"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Empresas podem ver suas pr??prias assinaturas"
  ON "public"."business_subscriptions"
  USING ((business_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id = (SELECT auth.uid())))));
ALTER POLICY "Empresas podem ver suas próprias assinaturas"
  ON "public"."business_subscriptions"
  USING ((business_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id = (SELECT auth.uid())))));
ALTER POLICY "Sistema pode gerenciar assinaturas"
  ON "public"."business_subscriptions"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Business views insertable"
  ON "public"."business_views"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM business_data bd
  WHERE (bd.id = business_views.business_id))) AND ((viewer_id IS NULL) OR (viewer_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Owners view own business views"
  ON "public"."business_views"
  USING ((business_id IN ( SELECT bd.id
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own businesses"
  ON "public"."businesses"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Service role can manage eligibility"
  ON "public"."catalog_eligibility_rule"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Service role can manage entitlements"
  ON "public"."catalog_entitlement_policy"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Service role can manage items"
  ON "public"."catalog_item"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Service role can manage pricing"
  ON "public"."catalog_pricing_policy"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Only admins can modify city metadata"
  ON "public"."city_metadata"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Authenticated users create classified comments"
  ON "public"."classified_comments"
  WITH CHECK ((author_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Authors delete own classified comments"
  ON "public"."classified_comments"
  USING ((author_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Authors manage own classified comments"
  ON "public"."classified_comments"
  USING ((author_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))))
  WITH CHECK ((author_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Profiles manage own classified favorites"
  ON "public"."classified_favorites"
  USING ((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))))
  WITH CHECK (((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))) AND (EXISTS ( SELECT 1
   FROM classifieds c
  WHERE (c.id = classified_favorites.classified_id)))));
ALTER POLICY "Users manage own classified likes"
  ON "public"."classified_likes"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Admins can update reports"
  ON "public"."classified_reports"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderator'::text])) AND (user_roles.is_active = true)))));
ALTER POLICY "Admins can view all reports"
  ON "public"."classified_reports"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderator'::text])) AND (user_roles.is_active = true)))));
ALTER POLICY "Users can view their own reports"
  ON "public"."classified_reports"
  USING ((reporter_id = (SELECT auth.uid())));
ALTER POLICY "classified_reports_admin_delete"
  ON "public"."classified_reports"
  USING ((COALESCE(private.is_admin_user((SELECT auth.uid())), false) OR COALESCE(private.is_admin((SELECT auth.uid())), false)));
ALTER POLICY "classified_reports_admin_update"
  ON "public"."classified_reports"
  USING (COALESCE(private.is_admin_user((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_user((SELECT auth.uid())), false));
ALTER POLICY "classified_reports_select_own_or_admin"
  ON "public"."classified_reports"
  USING (((reporter_id = private.current_active_profile_id()) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Admins can manage classifieds"
  ON "public"."classifieds"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all classifieds"
  ON "public"."classifieds"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Owners manage own classifieds"
  ON "public"."classifieds"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "community_comments_owner_or_admin_delete"
  ON "public"."comments"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "community_comments_owner_or_admin_read"
  ON "public"."comments"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "community_comments_owner_or_admin_update"
  ON "public"."comments"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)))
  WITH CHECK ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Service role can manage catalog"
  ON "public"."commercial_catalog_version"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "communication_audit_admin_insert"
  ON "public"."communication_channel_audit"
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "communication_audit_admin_select"
  ON "public"."communication_channel_audit"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "communication_requests_insert_own"
  ON "public"."communication_channel_requests"
  WITH CHECK ((requester_user_id = (SELECT auth.uid())));
ALTER POLICY "communication_requests_select_own_or_admin"
  ON "public"."communication_channel_requests"
  USING (((requester_user_id = (SELECT auth.uid())) OR COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false)));
ALTER POLICY "communication_requests_update_admin"
  ON "public"."communication_channel_requests"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "communication_territories_admin_all"
  ON "public"."communication_channel_territories"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "communication_channels_admin_all"
  ON "public"."communication_channels"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "communication_channels_member_select"
  ON "public"."communication_channels"
  USING ((EXISTS ( SELECT 1
   FROM profile_members pm
  WHERE ((pm.profile_id = communication_channels.profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));
ALTER POLICY "communication_distribution_admin_all"
  ON "public"."communication_publication_distribution"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "communication_publications_admin_all"
  ON "public"."communication_publications"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "community_alert_reports_own_or_admin_read"
  ON "public"."community_alert_reports"
  USING ((private.auth_owns_active_profile(reporter_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Users manage own alerts"
  ON "public"."community_alerts"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "community_direct_reports_own_or_admin_select"
  ON "public"."community_direct_message_reports"
  USING ((private.auth_owns_active_profile(reporter_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "community_issue_reports_own_or_admin_read"
  ON "public"."community_issue_reports"
  USING ((private.auth_owns_active_profile(profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "community_issues_owner_or_admin_read"
  ON "public"."community_issues"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Users manage own poll votes"
  ON "public"."community_poll_votes"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Authors manage polls"
  ON "public"."community_polls"
  USING ((post_id IN ( SELECT posts.id
   FROM posts
  WHERE (posts.author_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((post_id IN ( SELECT posts.id
   FROM posts
  WHERE (posts.author_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Admins can manage community posts"
  ON "public"."community_posts"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all community posts"
  ON "public"."community_posts"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Authors manage own community posts"
  ON "public"."community_posts"
  USING ((author_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))))
  WITH CHECK ((author_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "community_questions_owner_or_admin_delete"
  ON "public"."community_questions"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "community_questions_owner_or_admin_update"
  ON "public"."community_questions"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)))
  WITH CHECK ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "community_reports_admin_delete"
  ON "public"."community_reports"
  USING (private.is_admin_user((SELECT auth.uid())));
ALTER POLICY "community_reports_admin_update"
  ON "public"."community_reports"
  USING (private.is_admin_user((SELECT auth.uid())))
  WITH CHECK (private.is_admin_user((SELECT auth.uid())));
ALTER POLICY "community_reports_insert_own"
  ON "public"."community_reports"
  WITH CHECK ((reporter_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "community_reports_select_own_or_admin"
  ON "public"."community_reports"
  USING (((reporter_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) OR private.is_admin_user((SELECT auth.uid()))));
ALTER POLICY "community_user_moderation_admin_read"
  ON "public"."community_user_moderation_actions"
  USING (COALESCE(private.is_admin_user((SELECT auth.uid())), false));
ALTER POLICY "conversations_select_participant_or_admin"
  ON "public"."conversations"
  USING ((((private.current_active_profile_id() = buyer_id) OR (private.current_active_profile_id() = seller_id)) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Admins manage coupons"
  ON "public"."coupons"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "delivery_area_polygons_owner_all"
  ON "public"."delivery_area_polygons"
  USING ((delivery_area_id IN ( SELECT da.id
   FROM (delivery_areas da
     JOIN business_data bd ON ((bd.id = da.business_id)))
  WHERE (bd.profile_id = (SELECT auth.uid())))));
ALTER POLICY "delivery_areas_owner_all"
  ON "public"."delivery_areas"
  USING ((business_id IN ( SELECT bd.id
   FROM business_data bd
  WHERE (bd.profile_id = (SELECT auth.uid())))));
ALTER POLICY "delivery_neighborhoods_owner_all"
  ON "public"."delivery_neighborhoods"
  USING ((delivery_area_id IN ( SELECT da.id
   FROM (delivery_areas da
     JOIN business_data bd ON ((bd.id = da.business_id)))
  WHERE (bd.profile_id = (SELECT auth.uid())))));
ALTER POLICY "delivery_occurrences_participants_select"
  ON "public"."delivery_occurrences"
  USING ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = delivery_occurrences.order_id) AND ((o.customer_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))) OR (o.merchant_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))) OR (o.courier_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))))))));
ALTER POLICY "delivery_requests_business_insert"
  ON "public"."delivery_requests"
  WITH CHECK ((business_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id = (SELECT auth.uid())))));
ALTER POLICY "delivery_requests_business_select"
  ON "public"."delivery_requests"
  USING ((business_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id = (SELECT auth.uid())))));
ALTER POLICY "delivery_requests_business_update"
  ON "public"."delivery_requests"
  USING ((business_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id = (SELECT auth.uid())))));
ALTER POLICY "delivery_requests_driver_accept"
  ON "public"."delivery_requests"
  USING (((status = 'pending'::delivery_request_status) AND (EXISTS ( SELECT 1
   FROM driver_data
  WHERE (driver_data.profile_id = (SELECT auth.uid()))))));
ALTER POLICY "delivery_requests_driver_select"
  ON "public"."delivery_requests"
  USING (((status = 'pending'::delivery_request_status) OR (driver_id IN ( SELECT driver_data.id
   FROM driver_data
  WHERE (driver_data.profile_id = (SELECT auth.uid()))))));
ALTER POLICY "delivery_requests_driver_update"
  ON "public"."delivery_requests"
  USING ((driver_id IN ( SELECT driver_data.id
   FROM driver_data
  WHERE (driver_data.profile_id = (SELECT auth.uid())))));
ALTER POLICY "delivery_status_history_select"
  ON "public"."delivery_status_history"
  USING ((delivery_request_id IN ( SELECT delivery_requests.id
   FROM delivery_requests
  WHERE ((delivery_requests.business_id IN ( SELECT business_data.id
           FROM business_data
          WHERE (business_data.profile_id = (SELECT auth.uid())))) OR (delivery_requests.driver_id IN ( SELECT driver_data.id
           FROM driver_data
          WHERE (driver_data.profile_id = (SELECT auth.uid()))))))));
ALTER POLICY "delivery_tracking_driver_insert"
  ON "public"."delivery_tracking"
  WITH CHECK ((delivery_request_id IN ( SELECT delivery_requests.id
   FROM delivery_requests
  WHERE (delivery_requests.driver_id IN ( SELECT driver_data.id
           FROM driver_data
          WHERE (driver_data.profile_id = (SELECT auth.uid())))))));
ALTER POLICY "delivery_tracking_select"
  ON "public"."delivery_tracking"
  USING ((delivery_request_id IN ( SELECT delivery_requests.id
   FROM delivery_requests
  WHERE ((delivery_requests.business_id IN ( SELECT business_data.id
           FROM business_data
          WHERE (business_data.profile_id = (SELECT auth.uid())))) OR (delivery_requests.driver_id IN ( SELECT driver_data.id
           FROM driver_data
          WHERE (driver_data.profile_id = (SELECT auth.uid()))))))));
ALTER POLICY "Drivers can manage own availability"
  ON "public"."driver_availability"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.profile_type = 'driver'::text)))))
  WITH CHECK ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.profile_type = 'driver'::text)))));
ALTER POLICY "Drivers manage own data"
  ON "public"."driver_data"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Users can manage their driver data"
  ON "public"."driver_data"
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = driver_data.profile_id) AND (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Drivers manage own location"
  ON "public"."driver_locations"
  USING ((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "driver_locations_delete_policy"
  ON "public"."driver_locations"
  USING ((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.profile_type = 'driver'::text)))));
ALTER POLICY "driver_locations_insert_policy"
  ON "public"."driver_locations"
  WITH CHECK ((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.profile_type = 'driver'::text)))));
ALTER POLICY "driver_locations_update_policy"
  ON "public"."driver_locations"
  USING ((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.profile_type = 'driver'::text)))))
  WITH CHECK ((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.profile_type = 'driver'::text)))));
ALTER POLICY "Admins can manage driver moderation events"
  ON "public"."driver_moderation_events"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Drivers can view own moderation events"
  ON "public"."driver_moderation_events"
  USING ((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Drivers manage own routes"
  ON "public"."driver_routes"
  USING ((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "allow_owner_delete_analytics"
  ON "public"."education_analytics_events"
  USING (((EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((ep.id = education_analytics_events.education_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((ep.id = education_analytics_events.education_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "allow_owner_read_analytics"
  ON "public"."education_analytics_events"
  USING (((EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((ep.id = education_analytics_events.education_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((ep.id = education_analytics_events.education_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "education_events_owner_all"
  ON "public"."education_events"
  USING (((EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((ep.id = education_events.education_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((ep.id = education_events.education_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((ep.id = education_events.education_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((ep.id = education_events.education_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "education_lead_events_owner_all"
  ON "public"."education_lead_events"
  USING (((EXISTS ( SELECT 1
   FROM ((education_leads el
     JOIN education_profiles ep ON ((ep.id = el.education_profile_id)))
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((el.id = education_lead_events.lead_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM ((education_leads el
     JOIN education_profiles ep ON ((ep.id = el.education_profile_id)))
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((el.id = education_lead_events.lead_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM ((education_leads el
     JOIN education_profiles ep ON ((ep.id = el.education_profile_id)))
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((el.id = education_lead_events.lead_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM ((education_leads el
     JOIN education_profiles ep ON ((ep.id = el.education_profile_id)))
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((el.id = education_lead_events.lead_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "education_leads_owner_all"
  ON "public"."education_leads"
  USING (((EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((ep.id = education_leads.education_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((ep.id = education_leads.education_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((ep.id = education_leads.education_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((ep.id = education_leads.education_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "education_profiles_owner_all"
  ON "public"."education_profiles"
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = education_profiles.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM profile_members pm
  WHERE ((pm.profile_id = education_profiles.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = education_profiles.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM profile_members pm
  WHERE ((pm.profile_id = education_profiles.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "education_programs_owner_all"
  ON "public"."education_programs"
  USING (((EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((ep.id = education_programs.education_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((ep.id = education_programs.education_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profiles p ON ((p.id = ep.business_id)))
  WHERE ((ep.id = education_programs.education_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (education_profiles ep
     JOIN profile_members pm ON ((pm.profile_id = ep.business_id)))
  WHERE ((ep.id = education_programs.education_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "Admins podem ver email logs"
  ON "public"."email_logs"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text])) AND (user_roles.is_active = true)))));
ALTER POLICY "Sistema pode gerenciar email logs"
  ON "public"."email_logs"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "emergency_alerts_insert_own"
  ON "public"."emergency_alerts"
  WITH CHECK (((profile_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = emergency_alerts.profile_id) AND (profile.user_id = (SELECT auth.uid()))))) AND ((ride_id IS NULL) OR (EXISTS ( SELECT 1
   FROM ride_requests ride
  WHERE ((ride.id = emergency_alerts.ride_id) AND ((emergency_alerts.profile_id = ride.passenger_profile_id) OR (emergency_alerts.profile_id = ride.driver_profile_id))))))));
ALTER POLICY "emergency_contacts_insert_own"
  ON "public"."emergency_contacts"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = emergency_contacts.profile_id) AND (profile.user_id = (SELECT auth.uid()))))));
ALTER POLICY "emergency_contacts_update_own"
  ON "public"."emergency_contacts"
  USING ((EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = emergency_contacts.profile_id) AND (profile.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = emergency_contacts.profile_id) AND (profile.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Profiles manage own event favorites"
  ON "public"."event_favorites"
  USING ((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))))
  WITH CHECK (((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))) AND (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_favorites.event_id) AND (e.status = ANY (ARRAY['upcoming'::text, 'ongoing'::text])))))));
ALTER POLICY "Event participants delete own_profile"
  ON "public"."event_participants"
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = event_participants.profile_id) AND (p.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Event participants insert own_profile"
  ON "public"."event_participants"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = event_participants.profile_id) AND (p.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Event participants select own_or_organizer"
  ON "public"."event_participants"
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = event_participants.profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles op ON ((op.id = e.organizer_profile_id)))
  WHERE ((e.id = event_participants.event_id) AND (op.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Event participants update own_or_organizer"
  ON "public"."event_participants"
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = event_participants.profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles op ON ((op.id = e.organizer_profile_id)))
  WHERE ((e.id = event_participants.event_id) AND (op.user_id = (SELECT auth.uid())))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = event_participants.profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles op ON ((op.id = e.organizer_profile_id)))
  WHERE ((e.id = event_participants.event_id) AND (op.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Profiles manage own event reminders"
  ON "public"."event_reminders"
  USING ((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))))
  WITH CHECK (((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))) AND (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_reminders.event_id) AND (e.status = ANY (ARRAY['upcoming'::text, 'ongoing'::text])))))));
ALTER POLICY "Profiles manage own event review helpfulness"
  ON "public"."event_review_helpfulness"
  USING ((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))))
  WITH CHECK (((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))) AND (EXISTS ( SELECT 1
   FROM event_reviews er
  WHERE ((er.id = event_review_helpfulness.review_id) AND (er.status = 'active'::text))))));
ALTER POLICY "Participants create own event reviews"
  ON "public"."event_reviews"
  WITH CHECK (((reviewer_profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))) AND (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_reviews.event_id) AND (e.date < now())))) AND (EXISTS ( SELECT 1
   FROM event_participants ep
  WHERE ((ep.event_id = event_reviews.event_id) AND (ep.profile_id = event_reviews.reviewer_profile_id))))));
ALTER POLICY "Participants delete own event reviews"
  ON "public"."event_reviews"
  USING ((reviewer_profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Participants update own event reviews"
  ON "public"."event_reviews"
  USING ((reviewer_profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))))
  WITH CHECK (((reviewer_profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))) AND (status = 'active'::text) AND (EXISTS ( SELECT 1
   FROM event_participants ep
  WHERE ((ep.event_id = event_reviews.event_id) AND (ep.profile_id = event_reviews.reviewer_profile_id))))));
ALTER POLICY "Admins can manage events"
  ON "public"."events"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all events"
  ON "public"."events"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Organizers manage own events"
  ON "public"."events"
  USING ((organizer_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Admins can view audit logs"
  ON "public"."function_audit"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])) AND (user_roles.revoked_at IS NULL)))));
ALTER POLICY "Users can view their own audit logs"
  ON "public"."function_audit"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Owners view own upgrade history"
  ON "public"."gastronomy_niche_upgrade_history"
  USING ((business_id IN ( SELECT bd.id
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own gastronomy profile"
  ON "public"."gastronomy_profiles"
  USING ((business_id IN ( SELECT bd.id
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Empresas podem ver suas próprias assinaturas"
  ON "public"."gastronomy_subscriptions"
  USING ((business_id IN ( SELECT gastronomy_subscriptions.business_id
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));
ALTER POLICY "Usuários autenticados podem gerenciar termos bloqueados"
  ON "public"."issue_blocked_terms"
  USING (((SELECT auth.uid()) IS NOT NULL));
ALTER POLICY "location_aliases_admin_manage"
  ON "public"."location_aliases"
  USING (private.is_admin_from_roles((SELECT auth.uid())))
  WITH CHECK (private.is_admin_from_roles((SELECT auth.uid())));
ALTER POLICY "Admins can manage location boundaries"
  ON "public"."location_boundaries"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "location_versions_write_admin"
  ON "public"."location_versions"
  USING ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE ((admin_users.user_id = (SELECT auth.uid())) AND (admin_users.role = ANY (ARRAY['super_admin'::text, 'moderator'::text]))))));
ALTER POLICY "Admins can manage locations"
  ON "public"."locations"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all locations"
  ON "public"."locations"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins podem gerenciar locations"
  ON "public"."locations"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins veem todas as locations"
  ON "public"."locations"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "lost_found_comments_owner_or_admin_delete"
  ON "public"."lost_found_comments"
  USING ((private.auth_owns_active_profile(autor_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "lost_found_posts_owner_or_admin_delete"
  ON "public"."lost_found_posts"
  USING ((private.auth_owns_active_profile(autor_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "lost_found_posts_owner_or_admin_update"
  ON "public"."lost_found_posts"
  USING ((private.auth_owns_active_profile(autor_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)))
  WITH CHECK ((private.auth_owns_active_profile(autor_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "media_asset_links_owner_select"
  ON "public"."media_asset_links"
  USING ((EXISTS ( SELECT 1
   FROM media_assets asset
  WHERE ((asset.id = media_asset_links.asset_id) AND (asset.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "media_assets_owner_select"
  ON "public"."media_assets"
  USING ((owner_user_id = (SELECT auth.uid())));
ALTER POLICY "Owners manage own categories"
  ON "public"."menu_categories"
  USING ((menu_id IN ( SELECT m.id
   FROM ((menus m
     JOIN business_data bd ON ((bd.id = m.business_id)))
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own addons"
  ON "public"."menu_item_addons"
  USING ((item_id IN ( SELECT mi.id
   FROM ((((menu_items mi
     JOIN menu_categories mc ON ((mc.id = mi.category_id)))
     JOIN menus m ON ((m.id = mc.menu_id)))
     JOIN business_data bd ON ((bd.id = m.business_id)))
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own availability"
  ON "public"."menu_item_availability"
  USING ((item_id IN ( SELECT mi.id
   FROM ((((menu_items mi
     JOIN menu_categories mc ON ((mc.id = mi.category_id)))
     JOIN menus m ON ((m.id = mc.menu_id)))
     JOIN business_data bd ON ((bd.id = m.business_id)))
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own variants"
  ON "public"."menu_item_variants"
  USING ((item_id IN ( SELECT mi.id
   FROM ((((menu_items mi
     JOIN menu_categories mc ON ((mc.id = mi.category_id)))
     JOIN menus m ON ((m.id = mc.menu_id)))
     JOIN business_data bd ON ((bd.id = m.business_id)))
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own items"
  ON "public"."menu_items"
  USING ((category_id IN ( SELECT mc.id
   FROM (((menu_categories mc
     JOIN menus m ON ((m.id = mc.menu_id)))
     JOIN business_data bd ON ((bd.id = m.business_id)))
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own promotions"
  ON "public"."menu_promotions"
  USING ((business_id IN ( SELECT bd.id
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own menus"
  ON "public"."menus"
  USING ((business_id IN ( SELECT bd.id
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "messages_select_participant_or_admin"
  ON "public"."messages"
  USING ((EXISTS ( SELECT 1
   FROM conversations conversation
  WHERE ((conversation.id = messages.conversation_id) AND (((private.current_active_profile_id() = conversation.buyer_id) OR (private.current_active_profile_id() = conversation.seller_id)) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false))))));
ALTER POLICY "Neighborhood boundaries are deletable by admins"
  ON "public"."neighborhood_boundaries"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Neighborhood boundaries are insertable by admins"
  ON "public"."neighborhood_boundaries"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Neighborhood boundaries are updatable by admins"
  ON "public"."neighborhood_boundaries"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Drivers can update verifications for their rides"
  ON "public"."operational_verifications"
  USING ((EXISTS ( SELECT 1
   FROM ride_requests
  WHERE ((ride_requests.id = operational_verifications.ride_id) AND (ride_requests.driver_profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Drivers can view verifications for their rides"
  ON "public"."operational_verifications"
  USING ((EXISTS ( SELECT 1
   FROM ride_requests
  WHERE ((ride_requests.id = operational_verifications.ride_id) AND (ride_requests.driver_profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Passengers can view their own verifications"
  ON "public"."operational_verifications"
  USING ((EXISTS ( SELECT 1
   FROM ride_requests
  WHERE ((ride_requests.id = operational_verifications.ride_id) AND (ride_requests.passenger_profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Service role can manage all verifications"
  ON "public"."operational_verifications"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "operational_verifications_insert_by_requester"
  ON "public"."operational_verifications"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (ride_requests rr
     JOIN profiles p ON ((p.id = rr.passenger_profile_id)))
  WHERE ((rr.id = operational_verifications.ride_id) AND (p.user_id = (SELECT auth.uid()))))));
ALTER POLICY "operational_verifications_select_by_participant"
  ON "public"."operational_verifications"
  USING ((EXISTS ( SELECT 1
   FROM ((ride_requests rr
     JOIN profiles p_passenger ON ((p_passenger.id = rr.passenger_profile_id)))
     LEFT JOIN profiles p_driver ON ((p_driver.id = rr.driver_profile_id)))
  WHERE ((rr.id = operational_verifications.ride_id) AND ((p_passenger.user_id = (SELECT auth.uid())) OR (p_driver.user_id = (SELECT auth.uid())))))));
ALTER POLICY "operational_verifications_update_by_participant"
  ON "public"."operational_verifications"
  USING ((EXISTS ( SELECT 1
   FROM ((ride_requests rr
     JOIN profiles p_passenger ON ((p_passenger.id = rr.passenger_profile_id)))
     LEFT JOIN profiles p_driver ON ((p_driver.id = rr.driver_profile_id)))
  WHERE ((rr.id = operational_verifications.ride_id) AND ((p_passenger.user_id = (SELECT auth.uid())) OR (p_driver.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ((ride_requests rr
     JOIN profiles p_passenger ON ((p_passenger.id = rr.passenger_profile_id)))
     LEFT JOIN profiles p_driver ON ((p_driver.id = rr.driver_profile_id)))
  WHERE ((rr.id = operational_verifications.ride_id) AND ((p_passenger.user_id = (SELECT auth.uid())) OR (p_driver.user_id = (SELECT auth.uid())))))));
ALTER POLICY "order_items_participants_select"
  ON "public"."order_items"
  USING ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND ((o.customer_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))) OR (o.merchant_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))) OR (o.courier_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))))))));
ALTER POLICY "order_timeline_events_participants_select"
  ON "public"."order_timeline_events"
  USING ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_timeline_events.order_id) AND ((o.customer_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))) OR (o.merchant_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))) OR (o.courier_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))))))));
ALTER POLICY "Admins can manage orders"
  ON "public"."orders"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all orders"
  ON "public"."orders"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "orders_participants_select"
  ON "public"."orders"
  USING (((customer_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) OR (merchant_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) OR (courier_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Admins can delete pickup points"
  ON "public"."pickup_points"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can insert pickup points"
  ON "public"."pickup_points"
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can read pickup points"
  ON "public"."pickup_points"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can update pickup points"
  ON "public"."pickup_points"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Only admins view pii logs"
  ON "public"."pii_access_log"
  USING ((private.is_admin((SELECT auth.uid())) OR (subject_user_id = (SELECT auth.uid()))));
ALTER POLICY "pizza_doughs_owner_admin_all"
  ON "public"."pizza_doughs"
  USING ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_doughs.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_doughs.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_doughs.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_doughs.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "pizza_edges_owner_admin_all"
  ON "public"."pizza_edges"
  USING ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_edges.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_edges.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_edges.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_edges.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "pizza_flavors_owner_admin_all"
  ON "public"."pizza_flavors"
  USING ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_flavors.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_flavors.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_flavors.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_flavors.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "pizza_menu_items_owner_admin_all"
  ON "public"."pizza_menu_items"
  USING ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_menu_items.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_menu_items.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_menu_items.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_menu_items.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "pizza_niche_configs_owner_admin_all"
  ON "public"."pizza_niche_configs"
  USING ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_niche_configs.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_niche_configs.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_niche_configs.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_niche_configs.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "pizza_sizes_owner_admin_all"
  ON "public"."pizza_sizes"
  USING ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_sizes.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_sizes.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))))
  WITH CHECK ((COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profiles p ON ((p.id = bd.profile_id)))
  WHERE ((bd.id = pizza_sizes.business_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (business_data bd
     JOIN profile_members pm ON ((pm.profile_id = bd.profile_id)))
  WHERE ((bd.id = pizza_sizes.business_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'moderator'::text])))))));
ALTER POLICY "postal_code_history_write_admin"
  ON "public"."postal_code_history"
  USING ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE ((admin_users.user_id = (SELECT auth.uid())) AND (admin_users.role = ANY (ARRAY['super_admin'::text, 'moderator'::text]))))));
ALTER POLICY "community_posts_owner_or_admin_delete"
  ON "public"."posts"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "community_posts_owner_or_admin_read"
  ON "public"."posts"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "community_posts_owner_or_admin_update"
  ON "public"."posts"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)))
  WITH CHECK ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "pricing_fees_admin_manage"
  ON "public"."pricing_additional_fees"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "pricing_audit_admin_insert"
  ON "public"."pricing_audit_log"
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "pricing_audit_admin_read"
  ON "public"."pricing_audit_log"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "pricing_multipliers_admin_manage"
  ON "public"."pricing_peak_hour_multipliers"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "pricing_rules_admin_manage"
  ON "public"."pricing_rules"
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
ALTER POLICY "Managers can modify professional data"
  ON "public"."professional_data"
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = professional_data.profile_id) AND ((p.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM profile_members pm
          WHERE ((pm.profile_id = professional_data.profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))))));
ALTER POLICY "Owners manage own professional data"
  ON "public"."professional_data"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Users can view professional data"
  ON "public"."professional_data"
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = professional_data.profile_id) AND ((p.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM profile_members pm
          WHERE ((pm.profile_id = professional_data.profile_id) AND (pm.user_id = (SELECT auth.uid()))))))))));
ALTER POLICY "prof_data_owner_update"
  ON "public"."professional_data"
  USING ((profile_id = (SELECT auth.uid())))
  WITH CHECK ((profile_id = (SELECT auth.uid())));
ALTER POLICY "Users manage own professional favorites"
  ON "public"."professional_favorites"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Admins can manage professional jobs"
  ON "public"."professional_jobs"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all professional jobs"
  ON "public"."professional_jobs"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Job participants can view"
  ON "public"."professional_jobs"
  USING (((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) OR (client_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Professionals manage own jobs"
  ON "public"."professional_jobs"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "professional_lead_events_owner_insert"
  ON "public"."professional_lead_events"
  WITH CHECK (((event_type <> 'engagement_review_submitted'::text) AND (EXISTS ( SELECT 1
   FROM ((professional_leads lead
     JOIN professional_data professional ON ((professional.id = lead.professional_id)))
     JOIN profiles profile ON ((profile.id = professional.profile_id)))
  WHERE ((lead.id = professional_lead_events.lead_id) AND (profile.user_id = (SELECT auth.uid())) AND (professional_lead_events.actor_user_id = (SELECT auth.uid())))))));
ALTER POLICY "professional_lead_events_participant_select"
  ON "public"."professional_lead_events"
  USING ((EXISTS ( SELECT 1
   FROM ((professional_leads pl
     LEFT JOIN professional_data pd ON ((pd.id = pl.professional_id)))
     LEFT JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pl.id = professional_lead_events.lead_id) AND ((p.user_id = (SELECT auth.uid())) OR (pl.requester_user_id = (SELECT auth.uid())))))));
ALTER POLICY "professional_lead_messages_participant_insert"
  ON "public"."professional_lead_messages"
  WITH CHECK (((sender_user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM ((professional_leads pl
     LEFT JOIN professional_data pd ON ((pd.id = pl.professional_id)))
     LEFT JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pl.id = professional_lead_messages.lead_id) AND ((p.user_id = (SELECT auth.uid())) OR (pl.requester_user_id = (SELECT auth.uid()))))))));
ALTER POLICY "professional_lead_messages_participant_select"
  ON "public"."professional_lead_messages"
  USING ((EXISTS ( SELECT 1
   FROM ((professional_leads pl
     LEFT JOIN professional_data pd ON ((pd.id = pl.professional_id)))
     LEFT JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pl.id = professional_lead_messages.lead_id) AND ((p.user_id = (SELECT auth.uid())) OR (pl.requester_user_id = (SELECT auth.uid())))))));
ALTER POLICY "professional_lead_quotes_participant_select"
  ON "public"."professional_lead_quotes"
  USING ((EXISTS ( SELECT 1
   FROM ((professional_leads pl
     LEFT JOIN professional_data pd ON ((pd.id = pl.professional_id)))
     LEFT JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pl.id = professional_lead_quotes.lead_id) AND ((p.user_id = (SELECT auth.uid())) OR (pl.requester_user_id = (SELECT auth.uid())))))));
ALTER POLICY "professional_lead_quotes_professional_cancel_update"
  ON "public"."professional_lead_quotes"
  USING ((EXISTS ( SELECT 1
   FROM ((professional_leads pl
     JOIN professional_data pd ON ((pd.id = pl.professional_id)))
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pl.id = professional_lead_quotes.lead_id) AND (p.user_id = (SELECT auth.uid())) AND (professional_lead_quotes.status = 'sent'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ((professional_leads pl
     JOIN professional_data pd ON ((pd.id = pl.professional_id)))
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pl.id = professional_lead_quotes.lead_id) AND (p.user_id = (SELECT auth.uid())) AND (professional_lead_quotes.status = 'cancelled'::text)))));
ALTER POLICY "professional_lead_quotes_professional_insert"
  ON "public"."professional_lead_quotes"
  WITH CHECK (((professional_user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM ((professional_leads pl
     JOIN professional_data pd ON ((pd.id = pl.professional_id)))
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pl.id = professional_lead_quotes.lead_id) AND (p.user_id = (SELECT auth.uid())))))));
ALTER POLICY "professional_lead_quotes_requester_response_update"
  ON "public"."professional_lead_quotes"
  USING ((EXISTS ( SELECT 1
   FROM professional_leads pl
  WHERE ((pl.id = professional_lead_quotes.lead_id) AND (pl.requester_user_id = (SELECT auth.uid())) AND (professional_lead_quotes.status = 'sent'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM professional_leads pl
  WHERE ((pl.id = professional_lead_quotes.lead_id) AND (pl.requester_user_id = (SELECT auth.uid())) AND (professional_lead_quotes.status = ANY (ARRAY['accepted'::text, 'declined'::text]))))));
ALTER POLICY "professional_leads_owner_select"
  ON "public"."professional_leads"
  USING (((EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_leads.professional_id) AND (p.user_id = (SELECT auth.uid()))))) OR (requester_user_id = (SELECT auth.uid()))));
ALTER POLICY "professional_leads_owner_update"
  ON "public"."professional_leads"
  USING ((EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_leads.professional_id) AND (p.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_leads.professional_id) AND (p.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Professional media owner manage"
  ON "public"."professional_profile_media"
  USING ((EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_profile_media.professional_id) AND (p.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_profile_media.professional_id) AND (p.user_id = (SELECT auth.uid()))))));
ALTER POLICY "professional_service_engagements_participant_insert"
  ON "public"."professional_service_engagements"
  WITH CHECK (((requester_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_service_engagements.professional_id) AND (p.user_id = (SELECT auth.uid())))))));
ALTER POLICY "professional_service_engagements_participant_select"
  ON "public"."professional_service_engagements"
  USING (((requester_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_service_engagements.professional_id) AND (p.user_id = (SELECT auth.uid())))))));
ALTER POLICY "professional_service_engagements_professional_update"
  ON "public"."professional_service_engagements"
  USING ((EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_service_engagements.professional_id) AND (p.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (professional_data pd
     JOIN profiles p ON ((p.id = pd.profile_id)))
  WHERE ((pd.id = professional_service_engagements.professional_id) AND (p.user_id = (SELECT auth.uid()))))));
ALTER POLICY "prof_slug_hist_owner_sel"
  ON "public"."professional_slug_history"
  USING ((professional_id IN ( SELECT professional_data.id
   FROM professional_data
  WHERE (professional_data.profile_id = (SELECT auth.uid())))));
ALTER POLICY "prof_slug_hist_svc"
  ON "public"."professional_slug_history"
  USING (((SELECT auth.role()) = 'service_role'::text));
ALTER POLICY "Owners manage own professional stats"
  ON "public"."professional_stats"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Admins can view audit log"
  ON "public"."profile_audit_log"
  USING ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.user_id = (SELECT auth.uid())))));
ALTER POLICY "Users manage own profile favorites"
  ON "public"."profile_favorites"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users manage own favorites"
  ON "public"."profile_favorites_new"
  USING ((favoriting_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Manage profile links"
  ON "public"."profile_links"
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = profile_links.from_profile_id) AND (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Users can manage links of their profiles"
  ON "public"."profile_links"
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = profile_links.from_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM profile_members pm
  WHERE ((pm.profile_id = profile_links.from_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = profile_links.from_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM profile_members pm
  WHERE ((pm.profile_id = profile_links.from_profile_id) AND (pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));
ALTER POLICY "View profile links"
  ON "public"."profile_links"
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = profile_links.from_profile_id) AND (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Add profile members"
  ON "public"."profile_members"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = profile_members.profile_id) AND (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Owners manage members"
  ON "public"."profile_members"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Remove profile members"
  ON "public"."profile_members"
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = profile_members.profile_id) AND (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Update profile members"
  ON "public"."profile_members"
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = profile_members.profile_id) AND (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "View profile members"
  ON "public"."profile_members"
  USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = profile_members.profile_id) AND (profiles.user_id = (SELECT auth.uid()))))) OR (user_id = (SELECT auth.uid()))));
ALTER POLICY "Admins veem todo histórico de slug"
  ON "public"."profile_slug_history"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Usuários veem seu próprio histórico de slug"
  ON "public"."profile_slug_history"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Admins can view all username history"
  ON "public"."profile_username_history"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderator'::text])) AND (user_roles.is_active = true)))));
ALTER POLICY "Admins veem todo histórico de username"
  ON "public"."profile_username_history"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Users can view own username history"
  ON "public"."profile_username_history"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Usuários veem seu próprio histórico de username"
  ON "public"."profile_username_history"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Account owners can update their profiles"
  ON "public"."profiles"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Admins can update profiles"
  ON "public"."profiles"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all profiles"
  ON "public"."profiles"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins podem suspender perfis"
  ON "public"."profiles"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins veem todos os perfis"
  ON "public"."profiles"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Only account owner can delete profiles"
  ON "public"."profiles"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users can create own profiles"
  ON "public"."profiles"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users can view own profiles"
  ON "public"."profiles"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Usuários atualizam seus próprios perfis"
  ON "public"."profiles"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND (profile_type = profile_type) AND (is_suspended = is_suspended)));
ALTER POLICY "Usuários veem seus próprios perfis completos"
  ON "public"."profiles"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Usuários podem atualizar suas próprias subscriptions"
  ON "public"."push_subscriptions"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Usuários podem criar suas próprias subscriptions"
  ON "public"."push_subscriptions"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Usuários podem deletar suas próprias subscriptions"
  ON "public"."push_subscriptions"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Usuários podem ver suas próprias subscriptions"
  ON "public"."push_subscriptions"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "QR owners can view scans"
  ON "public"."qr_code_scans"
  USING ((EXISTS ( SELECT 1
   FROM qr_codes
  WHERE ((qr_codes.id = qr_code_scans.qr_code_id) AND (qr_codes.owner_profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Users can delete their own QR codes"
  ON "public"."qr_codes"
  USING ((owner_profile_id = (SELECT auth.uid())));
ALTER POLICY "Users can insert their own QR codes"
  ON "public"."qr_codes"
  WITH CHECK ((owner_profile_id = (SELECT auth.uid())));
ALTER POLICY "Users can update their own QR codes"
  ON "public"."qr_codes"
  USING ((owner_profile_id = (SELECT auth.uid())));
ALTER POLICY "Users can view their own QR codes"
  ON "public"."qr_codes"
  USING ((owner_profile_id = (SELECT auth.uid())));
ALTER POLICY "Users manage own answer likes"
  ON "public"."question_answer_likes"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "question_answer_likes_own_read"
  ON "public"."question_answer_likes"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Authors manage own answers"
  ON "public"."question_answers"
  USING ((author_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "question_answers_owner_or_admin_delete"
  ON "public"."question_answers"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "question_answers_owner_or_admin_update"
  ON "public"."question_answers"
  USING ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)))
  WITH CHECK ((private.auth_owns_active_profile(author_profile_id) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Admins view all reports"
  ON "public"."review_reports"
  USING ((EXISTS ( SELECT 1
   FROM (profiles p
     JOIN profile_members pm ON ((pm.profile_id = p.id)))
  WHERE ((p.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['admin'::text, 'moderator'::text]))))));
ALTER POLICY "review_reports_admin_update"
  ON "public"."review_reports"
  USING (COALESCE(private.is_admin_user((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_user((SELECT auth.uid())), false));
ALTER POLICY "review_reports_select_own_or_admin"
  ON "public"."review_reports"
  USING (((reporter_profile_id = private.current_active_profile_id()) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Business can respond to reviews"
  ON "public"."reviews"
  USING ((reviewed_profile_id IN ( SELECT pm.profile_id
   FROM profile_members pm
  WHERE ((pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))
  WITH CHECK ((reviewed_profile_id IN ( SELECT pm.profile_id
   FROM profile_members pm
  WHERE ((pm.user_id = (SELECT auth.uid())) AND (pm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));
ALTER POLICY "reviews_admin_select"
  ON "public"."reviews"
  USING (COALESCE(private.is_admin_user((SELECT auth.uid())), false));
ALTER POLICY "Admin can view all dispatch audit"
  ON "public"."ride_dispatch_audit"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Driver can view own dispatch attempts"
  ON "public"."ride_dispatch_audit"
  USING ((driver_profile_id = (SELECT auth.uid())));
ALTER POLICY "Passenger can view dispatch attempts for their rides"
  ON "public"."ride_dispatch_audit"
  USING ((EXISTS ( SELECT 1
   FROM ride_requests
  WHERE ((ride_requests.id = ride_dispatch_audit.ride_id) AND (ride_requests.passenger_profile_id = (SELECT auth.uid()))))));
ALTER POLICY "Drivers can respond to their own pending offers"
  ON "public"."ride_offers"
  USING (((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) AND (status = 'pending'::text) AND (expires_at > now())))
  WITH CHECK (((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) AND (status = ANY (ARRAY['accepted'::text, 'rejected'::text]))));
ALTER POLICY "Drivers can view their own offers"
  ON "public"."ride_offers"
  USING ((driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Passengers can view offers for their rides"
  ON "public"."ride_offers"
  USING ((ride_id IN ( SELECT ride_requests.id
   FROM ride_requests
  WHERE (ride_requests.passenger_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))))));
ALTER POLICY "ride_ratings_select_participant_or_admin"
  ON "public"."ride_ratings"
  USING ((((private.current_active_profile_id() = rater_id) OR (private.current_active_profile_id() = rated_id)) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "ride_reports_admin_update"
  ON "public"."ride_reports"
  USING (COALESCE(private.is_admin_user((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_user((SELECT auth.uid())), false));
ALTER POLICY "ride_reports_select_own_or_admin"
  ON "public"."ride_reports"
  USING (((reporter_profile_id = private.current_active_profile_id()) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Admins can manage ride requests"
  ON "public"."ride_requests"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all ride requests"
  ON "public"."ride_requests"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Participants update rides"
  ON "public"."ride_requests"
  USING (((passenger_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) OR (driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Passengers create rides"
  ON "public"."ride_requests"
  WITH CHECK ((passenger_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Ride participants view"
  ON "public"."ride_requests"
  USING (((passenger_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) OR (driver_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ride_shares_insert_own"
  ON "public"."ride_shares"
  WITH CHECK (((expires_at > now()) AND (expires_at <= (now() + '7 days'::interval)) AND (EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = ride_shares.created_by) AND (profile.user_id = (SELECT auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM ride_requests ride
  WHERE ((ride.id = ride_shares.ride_id) AND ((ride_shares.created_by = ride.passenger_profile_id) OR (ride_shares.created_by = ride.driver_profile_id)))))));
ALTER POLICY "participants_insert_ride_audit"
  ON "public"."ride_state_audit"
  WITH CHECK (((changed_by = 'system'::text) OR (ride_id IN ( SELECT ride_requests.id
   FROM ride_requests
  WHERE ((ride_requests.passenger_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))) OR (ride_requests.driver_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid())))))))));
ALTER POLICY "Admins podem ver todo o histórico"
  ON "public"."role_history"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Sistema pode inserir no histórico"
  ON "public"."role_history"
  WITH CHECK ((private.is_admin((SELECT auth.uid())) AND (performed_by = (SELECT auth.uid()))));
ALTER POLICY "Usuários podem ver seu próprio histórico"
  ON "public"."role_history"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Passengers manage own reservations"
  ON "public"."route_reservations"
  USING ((passenger_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Reservation participants view"
  ON "public"."route_reservations"
  USING (((passenger_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) OR (route_id IN ( SELECT driver_routes.id
   FROM driver_routes
  WHERE (driver_routes.driver_profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid()))))))));
ALTER POLICY "safety_evidence_insert_own"
  ON "public"."safety_evidence"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = safety_evidence.uploaded_by) AND (profile.user_id = (SELECT auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM safety_incidents incident
  WHERE ((incident.id = safety_evidence.incident_id) AND (incident.reported_by = safety_evidence.uploaded_by))))));
ALTER POLICY "safety_incidents_insert_own"
  ON "public"."safety_incidents"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = safety_incidents.reported_by) AND (profile.user_id = (SELECT auth.uid()))))) AND ((ride_id IS NULL) OR (EXISTS ( SELECT 1
   FROM ride_requests ride
  WHERE ((ride.id = safety_incidents.ride_id) AND ((safety_incidents.reported_by = ride.passenger_profile_id) OR (safety_incidents.reported_by = ride.driver_profile_id))))))));
ALTER POLICY "session_anomalies_admin_read"
  ON "public"."session_anomalies"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])) AND (user_roles.is_active = true)))));
ALTER POLICY "session_anomalies_own_read"
  ON "public"."session_anomalies"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "site_settings_admin_all"
  ON "public"."site_settings"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))));
ALTER POLICY "Sistema pode gerenciar webhooks"
  ON "public"."stripe_webhook_events"
  USING ((((SELECT auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Admins manage territorial group members"
  ON "public"."territorial_group_members"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Admins podem gerenciar membros de grupos"
  ON "public"."territorial_group_members"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins view all territorial group members"
  ON "public"."territorial_group_members"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Admins manage territorial groups"
  ON "public"."territorial_groups"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Admins podem gerenciar grupos territoriais"
  ON "public"."territorial_groups"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins view all territorial groups"
  ON "public"."territorial_groups"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Admins insert territory content"
  ON "public"."territory_ai_content"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Admins update territory content"
  ON "public"."territory_ai_content"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "territory_change_events_write_admin"
  ON "public"."territory_change_events"
  USING ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE ((admin_users.user_id = (SELECT auth.uid())) AND (admin_users.role = ANY (ARRAY['super_admin'::text, 'moderator'::text]))))));
ALTER POLICY "Admins can manage territory resolution queue"
  ON "public"."territory_resolution_queue"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Users can insert own territory resolution queue"
  ON "public"."territory_resolution_queue"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "Users can read own territory resolution queue"
  ON "public"."territory_resolution_queue"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "Admins manage tourist point media"
  ON "public"."tourist_point_media"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "guide_tpm_admin_all"
  ON "public"."tourist_point_media"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text) AND (user_roles.is_active = true)))));
ALTER POLICY "Profiles delete own saved tourist points"
  ON "public"."tourist_point_saved_items"
  USING ((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Profiles insert own saved published tourist points"
  ON "public"."tourist_point_saved_items"
  WITH CHECK (((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))) AND (EXISTS ( SELECT 1
   FROM tourist_points tp
  WHERE ((tp.id = tourist_point_saved_items.tourist_point_id) AND (tp.status = 'published'::text))))));
ALTER POLICY "Profiles read own saved tourist points"
  ON "public"."tourist_point_saved_items"
  USING ((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Admins manage tourist points"
  ON "public"."tourist_points"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "tryon delete own"
  ON "public"."tryon_generations"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "tryon insert own"
  ON "public"."tryon_generations"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "tryon select own"
  ON "public"."tryon_generations"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "tryon update own"
  ON "public"."tryon_generations"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "Admins view all consents"
  ON "public"."user_consents"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Users update own consents"
  ON "public"."user_consents"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users view own consents"
  ON "public"."user_consents"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users read own business favorites"
  ON "public"."user_favorite_businesses"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users manage own follows"
  ON "public"."user_follows"
  USING ((follower_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "user_mfa_status_admin_read"
  ON "public"."user_mfa_status"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])) AND (user_roles.is_active = true)))));
ALTER POLICY "user_mfa_status_own_read"
  ON "public"."user_mfa_status"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "user_mfa_status_own_update"
  ON "public"."user_mfa_status"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND (is_exempt = ( SELECT user_mfa_status_1.is_exempt
   FROM user_mfa_status user_mfa_status_1
  WHERE (user_mfa_status_1.user_id = (SELECT auth.uid())))) AND (exemption_reason = ( SELECT user_mfa_status_1.exemption_reason
   FROM user_mfa_status user_mfa_status_1
  WHERE (user_mfa_status_1.user_id = (SELECT auth.uid()))))));
ALTER POLICY "user_mfa_status_super_admin_update"
  ON "public"."user_mfa_status"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = 'super_admin'::app_role) AND (user_roles.is_active = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = 'super_admin'::app_role) AND (user_roles.is_active = true)))));
ALTER POLICY "Users manage own business recommendations"
  ON "public"."user_recommended_businesses"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users manage own residences"
  ON "public"."user_residences"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Admins podem ver todos os roles"
  ON "public"."user_roles"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Super admins podem gerenciar roles"
  ON "public"."user_roles"
  USING (private.is_super_admin((SELECT auth.uid())))
  WITH CHECK (private.is_super_admin((SELECT auth.uid())));
ALTER POLICY "Usuários podem ver seus próprios roles"
  ON "public"."user_roles"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "user_sessions_admin_read"
  ON "public"."user_sessions"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])) AND (user_roles.is_active = true)))));
ALTER POLICY "user_sessions_admin_revoke"
  ON "public"."user_sessions"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])) AND (user_roles.is_active = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role_enum = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])) AND (user_roles.is_active = true)))));
ALTER POLICY "user_sessions_own_read"
  ON "public"."user_sessions"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "user_sessions_own_revoke"
  ON "public"."user_sessions"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND (is_active = false) AND (revoked_at IS NOT NULL)));
ALTER POLICY "Admins can manage subscriptions"
  ON "public"."user_subscriptions"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all subscriptions"
  ON "public"."user_subscriptions"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Business owners can view their subscriptions"
  ON "public"."user_subscriptions"
  USING (((subscription_scope = 'business'::subscription_scope) AND (business_id IN ( SELECT business_data.id
   FROM business_data
  WHERE (business_data.profile_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (SELECT auth.uid()))))))));
ALTER POLICY "Users manage own subscriptions"
  ON "public"."user_subscriptions"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "vaga_applications_delete_admin"
  ON "public"."vaga_applications"
  USING (private.is_admin_user((SELECT auth.uid())));
ALTER POLICY "vaga_applications_insert"
  ON "public"."vaga_applications"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = vaga_applications.candidato_profile_id) AND (p.user_id = (SELECT auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM vagas v
  WHERE ((v.id = vaga_applications.vaga_id) AND ((v.status)::text = 'published'::text) AND (v.owner_profile_id <> vaga_applications.candidato_profile_id))))));
ALTER POLICY "vaga_applications_select"
  ON "public"."vaga_applications"
  USING ((private.is_admin_user((SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = vaga_applications.candidato_profile_id) AND (p.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (vagas v
     JOIN profiles owner_profile ON ((owner_profile.id = v.owner_profile_id)))
  WHERE ((v.id = vaga_applications.vaga_id) AND (owner_profile.user_id = (SELECT auth.uid())))))));
ALTER POLICY "vaga_applications_update"
  ON "public"."vaga_applications"
  USING ((private.is_admin_user((SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (vagas v
     JOIN profiles owner_profile ON ((owner_profile.id = v.owner_profile_id)))
  WHERE ((v.id = vaga_applications.vaga_id) AND (owner_profile.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((private.is_admin_user((SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (vagas v
     JOIN profiles owner_profile ON ((owner_profile.id = v.owner_profile_id)))
  WHERE ((v.id = vaga_applications.vaga_id) AND (owner_profile.user_id = (SELECT auth.uid())))))));
ALTER POLICY "vaga_reports_admin_delete"
  ON "public"."vaga_reports"
  USING ((COALESCE(private.is_admin_user((SELECT auth.uid())), false) OR COALESCE(private.is_admin((SELECT auth.uid())), false)));
ALTER POLICY "vaga_reports_admin_update"
  ON "public"."vaga_reports"
  USING (COALESCE(private.is_admin_user((SELECT auth.uid())), false))
  WITH CHECK (COALESCE(private.is_admin_user((SELECT auth.uid())), false));
ALTER POLICY "vaga_reports_select_own_or_admin"
  ON "public"."vaga_reports"
  USING (((reporter_profile_id = private.current_active_profile_id()) OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)));
ALTER POLICY "Profiles manage own saved vagas"
  ON "public"."vaga_saved_items"
  USING ((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))))
  WITH CHECK (((profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))) AND (EXISTS ( SELECT 1
   FROM vagas v
  WHERE (v.id = vaga_saved_items.vaga_id)))));
ALTER POLICY "Admins can create vagas"
  ON "public"."vagas"
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can delete vagas"
  ON "public"."vagas"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can update vagas"
  ON "public"."vagas"
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));
ALTER POLICY "Admins can view all vagas"
  ON "public"."vagas"
  USING (private.is_admin((SELECT auth.uid())));
ALTER POLICY "vagas_owner_create"
  ON "public"."vagas"
  WITH CHECK (((owner_profile_id IS NOT NULL) AND (private.is_admin_user((SELECT auth.uid())) OR (private.can_manage_profile(owner_profile_id) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = vagas.owner_profile_id) AND (p.profile_type = 'business'::text)))) AND (EXISTS ( SELECT 1
   FROM business_data b
  WHERE ((b.profile_id = vagas.owner_profile_id) AND (COALESCE(b.status, 'active'::text) = 'active'::text) AND (COALESCE(b.can_post_vagas, true) = true))))))));
ALTER POLICY "vagas_owner_delete"
  ON "public"."vagas"
  USING ((private.is_admin_user((SELECT auth.uid())) OR (private.can_manage_profile(owner_profile_id) AND ((status)::text = ANY (ARRAY['draft'::text, 'pending_review'::text])))));
ALTER POLICY "vagas_owner_read"
  ON "public"."vagas"
  USING ((private.is_admin_user((SELECT auth.uid())) OR private.can_manage_profile(owner_profile_id)));
ALTER POLICY "vagas_owner_update"
  ON "public"."vagas"
  USING ((private.is_admin_user((SELECT auth.uid())) OR private.can_manage_profile(owner_profile_id)))
  WITH CHECK (((owner_profile_id IS NOT NULL) AND (private.is_admin_user((SELECT auth.uid())) OR (private.can_manage_profile(owner_profile_id) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = vagas.owner_profile_id) AND (p.profile_type = 'business'::text)))) AND (EXISTS ( SELECT 1
   FROM business_data b
  WHERE ((b.profile_id = vagas.owner_profile_id) AND (COALESCE(b.status, 'active'::text) = 'active'::text) AND (COALESCE(b.can_post_vagas, true) = true))))))));
ALTER POLICY "Admins manage verifications"
  ON "public"."verification"
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'moderator'::text])) AND (user_roles.is_active = true)))));
ALTER POLICY "Users insert own verification"
  ON "public"."verification"
  WITH CHECK ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Users view own verification"
  ON "public"."verification"
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners manage own work opportunities"
  ON "public"."work_opportunities"
  USING ((author_profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))))
  WITH CHECK ((author_profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))));
ALTER POLICY "Owners view own work opportunities"
  ON "public"."work_opportunities"
  USING ((author_profile_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.user_id = (SELECT auth.uid())))));
COMMIT;

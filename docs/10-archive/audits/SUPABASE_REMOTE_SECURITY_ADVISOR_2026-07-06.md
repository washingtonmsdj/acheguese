# Supabase Remote Security Advisor - 2026-07-06

Command:

```bash
supabase db advisors --linked --type security --fail-on none
```

## Summary

Post-sync result on 2026-07-08, after applying the pending migration batch and
the follow-up storage/search-path/RLS/function-grant/RPC-broker hardening
migrations to the linked remote:

- Total findings: 12
- Errors:
  - 1 `rls_disabled_in_public` finding on `public.spatial_ref_sys`.
- Main warnings:
  - 3 `authenticated_security_definer_function_executable`
  - 3 `anon_security_definer_function_executable`
  - 4 `extension_in_public`
  - 1 `auth_leaked_password_protection`

All application-owned `security_definer_view`, `function_search_path_mutable`,
`rls_policy_always_true`, storage listing and application RPC
`SECURITY DEFINER` findings addressed in this batch are no longer reported by
the linked advisor.

The remaining `public_bucket_allows_listing` warning on `public-assets` was
fixed by:

```text
supabase/migrations/20260707083036_drop_public_assets_listing_policy.sql
```

The remaining 22 `function_search_path_mutable` warnings were fixed by:

```text
supabase/migrations/20260707083229_harden_remaining_function_search_path.sql
```

The remaining `rls_policy_always_true` warnings were fixed by:

```text
supabase/migrations/20260707084025_harden_always_true_rls_next_subset.sql
supabase/migrations/20260707084223_harden_analytics_and_dispatch_audit_rls.sql
supabase/migrations/20260707084443_lock_down_dispatch_audit_rpc_grants.sql
```

Dispatch audit writes now go through explicit RPCs with authorization checks:

- `log_ride_dispatch_attempt`
- `update_latest_ride_dispatch_attempt`

The shared authorization helper `can_write_ride_dispatch_audit` is internal-only
and has no `anon` or `authenticated` execute grant. The two public RPCs are
granted only to `authenticated` and reject calls that are not tied to the ride
passenger, the target driver profile, or an admin.

Anonymous execution was removed from reviewed privileged RPC subsets by:

```text
supabase/migrations/20260707085907_revoke_anon_from_privileged_security_definer_subset.sql
supabase/migrations/20260707090121_revoke_anon_from_internal_mutation_security_definer_subset.sql
supabase/migrations/20260707090301_revoke_anon_from_cache_mfa_and_territory_write_rpcs.sql
supabase/migrations/20260707092115_revoke_anon_from_unused_public_helper_rpcs.sql
supabase/migrations/20260707102718_harden_lgpd_consent_rpc_authorization.sql
supabase/migrations/20260707103853_harden_username_auth_rpc_surface.sql
supabase/migrations/20260707111214_harden_get_site_setting_invoker.sql
supabase/migrations/20260707112353_harden_get_business_reviews_invoker.sql
supabase/migrations/20260707113531_harden_gastronomy_public_menu_rpcs_invoker.sql
supabase/migrations/20260707114642_harden_gastronomy_activity_rpc_privacy.sql
supabase/migrations/20260707115617_harden_location_descendants_rpc_invoker.sql
supabase/migrations/20260707120534_harden_brand_branches_rpc_invoker.sql
supabase/migrations/20260707120937_harden_match_district_by_point_rpc_invoker.sql
supabase/migrations/20260707121321_harden_lost_found_public_read_rpcs_invoker.sql
supabase/migrations/20260707122417_harden_public_view_counters_edge_broker.sql
supabase/migrations/20260707123630_fix_public_view_counter_rpc_parameters.sql
supabase/migrations/20260707124348_harden_public_snapshot_rpcs_invoker.sql
supabase/migrations/20260707140908_route_admin_pricing_rpcs_through_edge_function.sql
supabase/migrations/20260707141904_route_admin_site_settings_rpcs_through_edge_function.sql
supabase/migrations/20260707143712_route_admin_communication_rpcs_through_edge_function.sql
supabase/migrations/20260707145342_route_communication_mutation_rpcs_through_edge_function.sql
supabase/migrations/20260707151447_move_communication_rls_helper_to_private_schema.sql
supabase/migrations/20260707152429_harden_notification_read_rpcs.sql
supabase/migrations/20260707153515_harden_gastronomy_niche_capability_rpcs.sql
supabase/migrations/20260707155447_harden_gastronomy_profile_column_grants.sql
supabase/migrations/20260707160719_harden_business_favorites_count_rpc.sql
supabase/migrations/20260707162026_harden_business_data_column_grants.sql
supabase/migrations/20260707192404_harden_create_notification_security.sql
supabase/migrations/20260707195524_route_professional_notifications_through_trusted_brokers.sql
supabase/migrations/20260707201023_route_session_profile_rpcs_through_edge_function.sql
supabase/migrations/20260707204323_route_billing_entitlements_rpcs_through_edge_function.sql
supabase/migrations/20260707205315_route_session_revocation_through_session_rpc.sql
supabase/migrations/20260707210813_route_business_reviews_rpcs_through_edge_function.sql
supabase/migrations/20260707212504_route_privacy_session_rpcs_through_edge_functions.sql
supabase/migrations/20260707213810_route_location_city_upsert_through_edge_function.sql
supabase/migrations/20260707220108_route_mobility_dispatch_rpcs_through_edge_function.sql
supabase/migrations/20260707222343_route_delivery_order_rpcs_through_edge_function.sql
supabase/migrations/20260707224108_route_mobility_accept_ride_through_edge_function.sql
supabase/migrations/20260707225829_route_community_content_rpcs_through_edge_function.sql
supabase/migrations/20260707232826_route_profile_mutation_rpcs_through_edge_function.sql
supabase/migrations/20260707234302_route_role_read_helpers_through_edge_function.sql
supabase/migrations/20260708000031_move_rls_authorization_helpers_to_private_schema.sql
```

High-risk examples now locked down:

- `exec_sql`: `service_role` only.
- billing/webhook log helpers: `service_role` only.
- cache helpers used by Edge Functions: `service_role` only.
- session, admin notification, pricing, notification, role, mobility, and
  community mutation RPCs: no anonymous execution.
- profile mutation helpers: no direct anonymous or signed-in execution; browser
  flows use the deployed `profile-rpc` Edge Function and the database receives
  the real actor id only from the trusted broker path.
- role read helpers `has_role` and `get_user_roles`: no direct anonymous or
  signed-in execution; browser flows use the deployed `role-rpc` Edge Function,
  which validates the JWT and only allows self-read or canonical admin access.
- public RLS authorization helper wrappers: no direct signed-in execution;
  policies call private-schema equivalents, and public wrappers are
  `service_role` only.
- unused public helper RPCs `can_use_premium_link` and
  `generate_unique_handle`: no anonymous execution.
- LGPD consent RPCs: `has_consent` has no anonymous execution and keeps
  internal authorization tied to the same authenticated user, admin, or
  `service_role`; `record_consent` is now routed through `privacy-rpc` and
  executable directly only by `service_role`.
- username auth helper `get_email_by_username`: no anonymous or authenticated
  execution. Username login now goes through the deployed
  `auth-username-login` Edge Function, which calls the helper with
  `service_role` only server-side and returns only an authenticated session
  payload.
- public site setting read helper `get_site_setting`: changed from
  `SECURITY DEFINER` to `SECURITY INVOKER`; public execution remains explicit
  for `anon` and `authenticated`, while table grants on `site_settings` were
  reduced to public `SELECT` only.
- public business review read helper `get_business_reviews`: changed from
  `SECURITY DEFINER` to `SECURITY INVOKER`; public execution remains explicit
  for `anon` and `authenticated`, while anonymous table grants on `reviews`
  were reduced to public `SELECT` only.
- public gastronomy menu helpers `get_featured_menu_items` and
  `get_active_promotions`: changed from `SECURITY DEFINER` to
  `SECURITY INVOKER`; public execution remains explicit for `anon` and
  `authenticated`, while anonymous table grants on `menus`,
  `menu_categories`, `menu_items`, and `menu_promotions` were reduced to
  public `SELECT` only.
- public gastronomy activity helper `get_recent_gastronomy_activities`:
  changed from `SECURITY DEFINER` to `SECURITY INVOKER`; public execution
  remains explicit for `anon` and `authenticated`, while the function now
  derives activity only from public review data. Private saved-business and
  purchase signals are no longer read by the public activity RPC.
- public territorial descendant helper `rpc_get_location_descendants_ids`:
  changed from `SECURITY DEFINER` to `SECURITY INVOKER`; public execution
  remains explicit for `anon` and `authenticated`, while execute inherited by
  `PUBLIC` was removed. Runtime checks as `anon` still return city descendants
  and active territorial-group members through existing public RLS.
- public brand branch helper `get_brand_branches`: changed from privileged
  execution to `SECURITY INVOKER`; public execution remains explicit for
  `anon` and `authenticated`, while active public branches continue to resolve
  through existing `business_data` and `locations` RLS.
- public district point matching helper `rpc_match_district_by_point`: changed
  to `SECURITY INVOKER` and now converts stored GeoJSON boundaries with
  `ST_GeomFromGeoJSON` before calling `ST_Contains`, fixing the previous
  `ST_Contains(jsonb, geometry)` runtime failure.
- public lost-and-found read helpers `count_lost_found_posts_by_type` and
  `find_similar_lost_found_posts`: changed to `SECURITY INVOKER`; public
  execution remains explicit for `anon` and `authenticated`, and the similarity
  helper now clamps the requested limit.
- public view counters `increment_business_views`,
  `increment_professional_views`, and `increment_vaga_view_count`: direct
  execution was revoked from `PUBLIC`, `anon`, and `authenticated`; execution is
  now `service_role` only through the deployed `track-public-view` Edge
  Function with rate limiting, entity whitelist, and UUID validation. The
  business/professional counter SQL also now qualifies legacy parameter names to
  avoid parameter/column ambiguity.
- public snapshot helpers `get_public_business_snapshot_by_slug` and
  `get_public_gastronomy_snapshot_by_slug`: changed from privileged execution
  to `SECURITY INVOKER`; public execution remains explicit for `anon` and
  `authenticated`, while underlying table grants/RLS now remain authoritative
  for each nested part of the snapshot payload.
- business favorite count helper `get_business_favorites_count`: browser reads
  now use `business_data.favorites_count` through table RLS; direct RPC
  execution is `service_role` only and the function is `SECURITY INVOKER`.
- `public.business_data`: broad `anon`/`authenticated` table DML was removed.
  Direct user-JWT writes are limited to column-level operational fields; admin
  flags and aggregate counters are server-side only through triggers or admin
  Edge Functions.
- admin pricing mutation helpers `activate_pricing_rule` and
  `create_active_pricing_rule`: direct signed-in execution was revoked. Browser
  admin flows now use the deployed `admin-pricing-rpc` Edge Function with
  `verify_jwt=true`, `requireAdmin`, rate limiting, action whitelist and
  `performedBy` profile ownership validation; the database RPCs remain
  executable only by `service_role`.
- admin site settings helpers `get_all_site_settings` and
  `upsert_site_setting`: direct signed-in execution was revoked. Browser admin
  flows now use the deployed `admin-site-settings-rpc` Edge Function with
  `verify_jwt=true`, `requireAdmin`, rate limiting, action/key whitelists and
  setting-value validation; the database RPCs remain executable only by
  `service_role`. Public reads continue through `get_site_setting(text)` as an
  invoker-scoped read.
- admin communication territorial helpers `admin_approve_communication_channel`
  and `admin_reject_communication_channel_request`: direct signed-in execution
  was revoked. Browser admin flows now use the deployed
  `admin-communication-rpc` Edge Function with `verify_jwt=true`,
  `requireAdmin`, rate limiting, action whitelist and UUID/payload validation.
  The database RPCs remain executable only by `service_role`, while the broker
  passes the real admin user id so review and audit columns keep the correct
  actor.
- communication territorial user mutation helpers
  `request_communication_channel`, `create_communication_publication`,
  `update_communication_publication_draft`, and
  `publish_communication_publication`: direct signed-in execution was revoked.
  Browser flows now use the deployed `communication-rpc` Edge Function with
  `verify_jwt=true`, required authenticated user, rate limiting, action
  whitelist and payload validation. The database RPCs remain executable only by
  `service_role`, while the broker passes the real user id as `actor_user_id`.
- communication territorial read helper `can_channel_publish_in_location`:
  changed from `SECURITY DEFINER` to `SECURITY INVOKER`; `anon` execution is
  revoked and signed-in execution remains explicit for the non-mutating check.
- communication territorial RLS helper
  `communication_current_user_can_manage_channel`: moved from exposed `public`
  schema to private schema `private`, with dependent policies updated to call
  `private.communication_current_user_can_manage_channel`. The public function
  was dropped, `anon` has no private schema usage/execute grant, and the
  advisor no longer reports communication-specific findings.
- notification read-state helpers `mark_notification_as_read`,
  `mark_all_notifications_as_read`, and `get_unread_notifications_count`:
  direct signed-in execution was revoked. Browser flows now update/read
  `public.notifications` through table RLS and an explicit `user_id` filter in
  `NotificationService`; the legacy RPCs remain executable only by
  `service_role`.
- gastronomy niche capability/versioning helpers `add_niche_capability`,
  `has_niche_capability`, and `mark_niche_needs_upgrade`: direct signed-in
  execution was revoked. `has_niche_capability` is now `SECURITY INVOKER`;
  browser reads use `gastronomy_profiles` through RLS, and
  capability/upgrade mutations require a trusted admin/server path.
- `public.gastronomy_profiles`: broad signed-in INSERT/UPDATE/DELETE grants
  were removed, then INSERT/UPDATE were restored only for operational columns.
  Signed-in users can no longer write plan, capability, or niche-versioning
  columns through the Data API.
- `create_notification`: changed to `SECURITY INVOKER`, with authenticated
  calls limited to the caller's own `user_id`; legitimate cross-user
  notifications must go through trusted server-side brokers.
- professional lead notifications: message and quote notifications now route
  through `professional-notifications-rpc`, which validates the authenticated
  actor against real message/quote/lead records. Anonymous lead-created
  notifications are handled by the internal trigger
  `create_professional_lead_created_event()` with no `anon` or
  `authenticated` execute grant.
- session/profile/MFA helpers `get_active_profile`, `switch_active_profile`,
  and `check_user_mfa_required`: direct signed-in execution was revoked.
  Browser flows now use the deployed `session-rpc` Edge Function with
  `verify_jwt=true`; the broker validates the JWT, derives `p_user_id`
  server-side, and calls the database helpers with `service_role` only.
- billing entitlement helpers `get_user_active_subscription`, `user_has_plan`,
  `user_has_feature`, and `get_user_entitlement_limit`: direct signed-in
  execution was revoked. Browser flows now use the deployed
  `billing-entitlements-rpc` Edge Function with `verify_jwt=true`; the broker
  validates the JWT, derives `p_user_id` server-side, and calls the database
  helpers with `service_role` only.
- session revocation helpers `revoke_user_session` and
  `revoke_all_user_sessions`: direct signed-in execution was revoked. Browser
  flows now use the deployed `session-rpc` Edge Function; the broker validates
  the JWT and updates `user_sessions` directly with `user_id` scoped to the
  authenticated user.
- business review mutation/check helpers `can_user_review_business`,
  `create_business_review`, `update_business_review`,
  `delete_business_review`, and `add_business_review_response`: direct
  signed-in execution was revoked. Browser flows now use the deployed
  `business-reviews-rpc` Edge Function with `verify_jwt=true`; the broker
  validates the JWT, derives the actor server-side, validates profile access
  through owner, active `profile_members`, or canonical admin role, and writes
  `public.reviews` with explicit review/order constraints.

The remaining 3 anonymous RPC warnings are all `st_estimatedextent` overloads
from PostGIS in `public`; they should be handled together with the extension
schema migration, not as application RPCs.

Follow-up note: migration
`20260707124929_revoke_public_postgis_estimatedextent_execute` was applied to
the linked remote, but the grants remained because these extension-owned
functions have ACLs granted by `supabase_admin`, while standard linked
migrations run as `postgres`. At that point the advisor still reported 126
total findings, 3 anonymous `SECURITY DEFINER` findings, and those 3 were still
the PostGIS `st_estimatedextent` overloads.

The next authenticated-only hardening batch removed direct signed-in execution
from trigger-only and unused privileged helpers:

```text
supabase/migrations/20260707133656_revoke_authenticated_from_internal_trigger_and_unused_rpcs.sql
```

Verified remote state after this batch: total findings 117, with 108
`authenticated_security_definer_function_executable` findings. The targeted
functions have `authenticated_execute=false` and `service_role_execute=true`;
`update_session_activity(text)` remains executable by `authenticated` because it
has a runtime caller in `SessionService`.

Additional authenticated-only batches:

```text
supabase/migrations/20260707134401_revoke_authenticated_from_unused_no_dependency_rpcs.sql
supabase/migrations/20260707134629_revoke_authenticated_from_internal_helper_rpcs.sql
supabase/migrations/20260707134943_route_admin_notifications_rpcs_through_edge_function.sql
supabase/migrations/20260707140908_route_admin_pricing_rpcs_through_edge_function.sql
supabase/migrations/20260707141904_route_admin_site_settings_rpcs_through_edge_function.sql
supabase/migrations/20260707143712_route_admin_communication_rpcs_through_edge_function.sql
supabase/migrations/20260707145342_route_communication_mutation_rpcs_through_edge_function.sql
supabase/migrations/20260707151447_move_communication_rls_helper_to_private_schema.sql
supabase/migrations/20260707152429_harden_notification_read_rpcs.sql
supabase/migrations/20260707153515_harden_gastronomy_niche_capability_rpcs.sql
supabase/migrations/20260707155447_harden_gastronomy_profile_column_grants.sql
```

The first two batches removed direct signed-in execution from unused helpers and
helpers called only by privileged routines. The admin notifications dashboard
RPCs now route through the deployed `admin-notifications-rpc` Edge Function,
which requires `requireAdmin` and calls the database with `service_role`. Smoke
test without a user JWT returned `401`. Pricing admin RPCs now route through
the deployed `admin-pricing-rpc` Edge Function, which also requires
`requireAdmin`, validates `performedBy` profile ownership and calls the
database with `service_role`. Smoke test without a user JWT returned `401`.
Site settings admin RPCs now route through the deployed
`admin-site-settings-rpc` Edge Function, which requires `requireAdmin`,
validates action/key/value input and calls the database with `service_role`.
Smoke test without a user JWT returned `401`. Communication territorial admin
RPCs now route through the deployed `admin-communication-rpc` Edge Function,
which requires `requireAdmin`, validates action/payload input, calls the
database with `service_role`, and passes the real admin user id for audit
fields. Smoke test without a user JWT returned `401`. Current advisor summary
after the admin batches: total findings 80, with 71
`authenticated_security_definer_function_executable` findings. The following
communication user mutation batch routes signed-in mutations through the
deployed `communication-rpc` Edge Function, revokes direct signed-in execution
from the four mutation RPCs, converts `can_channel_publish_in_location` to
`SECURITY INVOKER`, and returns `401` without a user JWT. Current advisor
summary after this batch: total findings 75, with 66
`authenticated_security_definer_function_executable` findings. The remaining
communication-specific authenticated warning was then resolved by moving
`communication_current_user_can_manage_channel(uuid)` into the private schema,
updating dependent policies, and dropping the public function. Current advisor
summary after this batch: total findings 74, with 65
`authenticated_security_definer_function_executable` findings and no
communication matches. Notification read-state RPCs were then removed from the
signed-in browser surface by replacing them with table RLS operations and
revoking direct `authenticated` execution. Current advisor summary after this
batch: total findings 71, with 62
`authenticated_security_definer_function_executable` findings.
Gastronomy niche capability/versioning RPCs were then removed from the
signed-in browser surface by replacing `has_niche_capability` with table RLS
reads and revoking direct `authenticated` execution from
`add_niche_capability`, `has_niche_capability`, and
`mark_niche_needs_upgrade`. Current advisor summary after this batch: total
findings 68, with 59 `authenticated_security_definer_function_executable`
findings and no niche matches. A follow-up column-grant migration then removed
broad signed-in writes on `public.gastronomy_profiles`; direct Data API writes
now exclude `enabled_capabilities`, `missing_capabilities`,
`needs_niche_upgrade`, `niche_config_version`, `support_level`,
`operational_mode`, `primary_niche_key`, `last_niche_upgrade_at`, and
`plan_tier`.
Business favorite count reads were then moved from the privileged
`get_business_favorites_count` RPC to the canonical
`business_data.favorites_count` table aggregate under RLS. The RPC is now
`SECURITY INVOKER` and executable only by `service_role`. Current advisor
summary after this batch: total findings 67, with 58
`authenticated_security_definer_function_executable` findings and no
`get_business_favorites_count` match. The audit also found broad
`business_data` grants for `anon`/`authenticated`; this was handled in a
follow-up grant migration after mapping business creation and edit flows.
The follow-up `business_data` grant migration then removed broad table DML from
`anon` and `authenticated`. Both roles now have table-level `SELECT` only, and
`authenticated` receives column-level `INSERT`/`UPDATE` only for operational
business profile fields. Admin flags (`is_verified`, `is_premium`) and
aggregates/counters (`favorites_count`, `recommendations_count`, `rating`,
`total_reviews`, `total_products`) are not directly writable with a user JWT.
The admin flag flow now uses the deployed `admin-business-rpc` Edge Function
with `verify_jwt=true`, `requireAdmin`, rate limiting, and service-role
database access. Current advisor summary remains 67 total findings, with 58
`authenticated_security_definer_function_executable` findings, because broad
table grants are not represented as a dedicated Advisor finding.
Notification creation was then hardened by converting
`create_notification(uuid,text,text,text,text,text,text,jsonb)` to
`SECURITY INVOKER`, keeping direct execution to `authenticated` and
`service_role`, blocking authenticated cross-user creation in the function and
in `NotificationService`, and reducing `notifications` /
`notification_preferences` grants by operation and column. Current advisor
summary after this batch: total findings 66, with 57
`authenticated_security_definer_function_executable` findings and no
`create_notification` match. The functional follow-up is to add
domain-authorized server-side notification brokers for legitimate third-party
notifications, not to reopen a generic cross-user browser RPC.
The first follow-up broker, `community-notifications-rpc`, was then deployed
for community notifications. It validates the authenticated actor profile,
checks real community events in `post_likes_new`, `posts`, and `comments`,
resolves recipients server-side, and does not accept a recipient `user_id` from
the browser. This is a functional hardening step and does not change Advisor
counts because the `create_notification` finding had already been removed.
The second broker, `professional-notifications-rpc`, was deployed for
professional lead messages and quotes. It validates `messageId`/`quoteId`,
ownership and lead participation before resolving recipients server-side. Lead
creation can be anonymous, so `lead_created` notifications were moved into the
internal trigger `create_professional_lead_created_event()`, which is
`SECURITY DEFINER` with `search_path=public, pg_temp` and no execute privilege
for `anon` or `authenticated`. Current advisor summary remains 66 total
findings, with 57 `authenticated_security_definer_function_executable`
findings, 3 anonymous PostGIS findings, and no match for the new trigger.
The `session-rpc` broker was then deployed for active profile, profile
switching, and MFA-required checks. It validates the authenticated user from the
JWT and never accepts `p_user_id` from the browser. Direct `authenticated`
execution was revoked from `get_active_profile`, `switch_active_profile`, and
`check_user_mfa_required`, leaving `service_role` as the only executor. Current
advisor summary is 63 total findings, with 54
`authenticated_security_definer_function_executable` findings, 3 anonymous
PostGIS findings, and no match for the three session/profile/MFA RPCs.
The `billing-entitlements-rpc` broker was then deployed for user subscription,
plan, feature, and entitlement-limit checks. It validates the authenticated
user from the JWT and never accepts `p_user_id` from the browser. Direct
`authenticated` execution was revoked from `get_user_active_subscription`,
`user_has_plan`, `user_has_feature`, and `get_user_entitlement_limit`, leaving
`service_role` as the only executor. Current advisor summary is 59 total
findings, with 50 `authenticated_security_definer_function_executable`
findings, 3 anonymous PostGIS findings, and no match for the four billing
entitlement RPCs.
The existing `session-rpc` broker was then extended for session revocation.
Direct `authenticated` execution was revoked from `revoke_user_session` and
`revoke_all_user_sessions`. The broker validates the user from the JWT and
updates `user_sessions` with an explicit authenticated-user filter instead of
calling the legacy helpers with `service_role`. Current advisor summary is 57
total findings, with 48 `authenticated_security_definer_function_executable`
findings and 3 anonymous PostGIS findings.
The `business-reviews-rpc` broker was then deployed for business review
checks, creation, update, deletion, and business responses. Direct
`authenticated` execution was revoked from the five backing review RPCs. The
broker does not call those legacy helpers with `service_role` because their SQL
logic depends on `auth.uid()`; it validates the JWT and applies equivalent
profile/order authorization before writing `public.reviews`. Current advisor
summary is 52 total findings, with 43
`authenticated_security_definer_function_executable` findings and 3 anonymous
PostGIS findings.
The `privacy-rpc` broker was then deployed for LGPD consent writes, and
`session-rpc` was extended for session activity updates. Direct
`authenticated` execution was revoked from `record_consent` and
`update_session_activity`. The consent uniqueness constraint was corrected to
allow historical revoked consent rows while keeping one active row per user and
type. Current advisor summary is 50 total findings, with 41
`authenticated_security_definer_function_executable` findings and 3 anonymous
PostGIS findings.
The `location-rpc` broker was then deployed for canonical city reconciliation
by IBGE code. Direct `authenticated` execution was revoked from
`rpc_upsert_canonical_city_by_ibge`, while the helper now permits
`service_role` execution for the broker path. Current advisor summary is 49
total findings, with 40 `authenticated_security_definer_function_executable`
findings and 3 anonymous PostGIS findings.
The `mobility-rpc` broker was then deployed for dispatch audit, pending offer
cancellation, and driver availability release helpers. Direct
`authenticated` execution was revoked from `log_ride_dispatch_attempt`,
`update_latest_ride_dispatch_attempt`, `cancel_pending_ride_offers`, and
`release_driver_availability_for_ride`; the broker validates JWT ownership
against ride participants or canonical admins before using the service role.
Current advisor summary is 45 total findings, with 36
`authenticated_security_definer_function_executable` findings and 3 anonymous
PostGIS findings.
The `delivery-rpc` broker was then deployed for order/delivery mutations. Direct
`authenticated` execution was revoked from `delivery_create_order`,
`delivery_transition_logistics_status`, `delivery_mark_picked_up`,
`delivery_attach_delivery_proof`, `delivery_mark_delivered`,
`delivery_transition_financial_status`, `delivery_report_occurrence`,
`delivery_resolve_occurrence`, `delivery_update_order_notes`, and
`delivery_update_order_source_metadata`; the broker validates JWT profile
access and action-specific order roles before using the service role. Current
advisor summary is 35 total findings, with 26
`authenticated_security_definer_function_executable` findings and 3 anonymous
PostGIS findings.
The `mobility-rpc` broker was then extended for atomic ride acceptance. Direct
`authenticated` execution was revoked from `accept_ride_atomic`; the broker
validates the JWT owner of `driverProfileId`, and the SQL helper now keeps
driver eligibility checks even when invoked by `service_role`. Current advisor
summary is 34 total findings, with 25
`authenticated_security_definer_function_executable` findings and 3 anonymous
PostGIS findings.
The `community-rpc` broker was then deployed for community content mutations.
Direct `authenticated` execution was revoked from community alert/issue
creation, alert edit counters, QA best-answer marking, and event participant
counters. Alert/issue creation keeps verified-residence checks by using an
actor user id inserted only by the broker. Current advisor summary is 26 total
findings, with 17 `authenticated_security_definer_function_executable` findings
and 3 anonymous PostGIS findings.
The `profile-rpc` broker was then deployed for profile creation, handle update,
profile deletion, ownership transfer, and profile-member email invites. Direct
`authenticated` execution was revoked from
`create_profile_with_extension`, `update_profile_handle`, `delete_profile`,
`transfer_profile_ownership`, and `invite_profile_member_by_email`. The broker
validates the JWT, passes `actor_user_id` to service-role-only wrappers, and
the SQL helpers keep the ownership checks in the database. Current advisor
summary is 21 total findings, with 12
`authenticated_security_definer_function_executable` findings and 3 anonymous
PostGIS findings.
The `role-rpc` broker was then deployed for role reads. Direct `anon` and
`authenticated` execution was revoked from `has_role` and `get_user_roles`.
Browser flows now call `role-rpc`, which validates the JWT, allows self-read or
canonical admin access only, and calls the database helpers with `service_role`.
Current advisor summary is 19 total findings, with 10
`authenticated_security_definer_function_executable` findings and 3 anonymous
PostGIS findings.
The same broker was then expanded for `is_admin` and `is_super_admin`, and RLS
authorization helpers were moved behind private-schema functions. Migration
`20260708000031_move_rls_authorization_helpers_to_private_schema.sql` created
`private.*` equivalents, rewrote 116 policy references to the private schema,
and revoked direct `authenticated` execution from the public wrappers
`auth_can_access_profile`, `can_manage_profile`, `group_can_manage_members`,
`is_admin`, `is_admin_from_roles`, `is_admin_user`, and `is_super_admin`.
Current advisor summary is 12 total findings, with 3
`authenticated_security_definer_function_executable` findings and 3 anonymous
findings, all tied to PostGIS `st_estimatedextent` overloads.

Baseline from the first 2026-07-06 linked advisor run:

- Total findings: 519
- Errors:
  - 19 `security_definer_view` findings on application views.
  - 1 `rls_disabled_in_public` finding on `public.spatial_ref_sys`.
- Main warnings:
  - 179 `function_search_path_mutable`
  - 161 `authenticated_security_definer_function_executable`
  - 135 `anon_security_definer_function_executable`
  - 13 `rls_policy_always_true`
  - 6 `public_bucket_allows_listing`
  - 4 `extension_in_public`
  - 1 `auth_leaked_password_protection`

## Fixed In This Branch

The 19 application view errors are addressed by:

```text
supabase/migrations/20260706102000_harden_remote_advisor_security_definer_views.sql
```

Views covered:

- `active_user_consents`
- `addresses_public`
- `analytics_kpis`
- `community_alerts_public`
- `community_issues_public`
- `driver_complete_profile`
- `locations_coordinates_status`
- `personal_social_profiles`
- `pii_access_stats`
- `public_business_search`
- `public_professional_search`
- `public_profile_links`
- `public_profiles`
- `public_work_opportunity_search`
- `territory_aliases`
- `user_companies`
- `user_organizations`
- `user_professional_profiles`
- `work_opportunity_match_candidates`

Validation:

```bash
npm run validate:migrations
npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts --reporter=dot
npx eslint src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts
npm run typecheck:app
```

All passed on 2026-07-06.

Two `rls_policy_always_true` warnings with clear ownership columns are addressed
by:

```text
supabase/migrations/20260706103000_harden_remote_advisor_always_true_rls_subset.sql
```

Covered policies:

- `public.addresses`: replaces the remote
  `"Authenticated users can create addresses"` always-true insert policy with
  ownership checks on `owner_user_id = auth.uid()`.
- `public.classified_reports`: replaces the remote
  `"Authenticated users can create reports"` always-true insert policy with a
  reporter profile check tied to `auth.uid()`.

Validation:

```bash
npm run validate:migrations
npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts --reporter=dot
npx eslint src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts
npm run typecheck:app
```

All passed on 2026-07-06 after this addition.

The 6 `public_bucket_allows_listing` warnings are addressed by:

```text
supabase/migrations/20260706104000_harden_public_storage_listing_policies.sql
```

Covered buckets/policies:

- `avatars`: drops `"Avatar images are publicly accessible"` from
  `storage.objects`.
- `business_images`: drops `"Business images are publicly accessible"` from
  `storage.objects`.
- `classified_images`: drops `"Classified images are publicly accessible"` from
  `storage.objects`.
- `event_images`: drops `"Event images are publicly accessible"` from
  `storage.objects`.
- `post_images`: drops `"Post images are publicly accessible"` from
  `storage.objects`.
- `public-assets`: drops `public_assets_select_public` from
  `storage.objects`.

Repository scan result:

- Frontend media flows use `getPublicUrl`, upload, and remove helpers through
  `src/core/media/services/MediaService.ts`; no frontend `storage.list()` usage
  was found.
- The only storage listing usage found is the `health-check` Edge Function,
  which initializes Supabase with `SUPABASE_SERVICE_ROLE_KEY`.

Validation:

```bash
npm run validate:migrations
npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts --reporter=dot
npx eslint src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts
npm run typecheck:app
```

All passed on 2026-07-06 after this addition.

The reviewed `function_search_path_mutable` warnings are addressed by:

```text
supabase/migrations/20260706162154_harden_function_search_path_low_risk_subset.sql
supabase/migrations/20260706163017_harden_function_search_path_second_subset.sql
supabase/migrations/20260707083229_harden_remaining_function_search_path.sql
```

Implementation notes:

- The migrations do not recreate function bodies and do not change grants.
- They resolve every overload through `pg_proc` and
  `pg_get_function_identity_arguments`, then applies `ALTER FUNCTION ... SET
  search_path = public, extensions, pg_temp`.
- `exec_sql` is intentionally excluded from this subset. It needs a dedicated
  review of grants and execution surface, not only `search_path` hardening.

Validation:

```bash
npm run validate:migrations
npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts --reporter=dot
npx eslint src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts
```

All passed on 2026-07-06 after this addition.

## Needs Separate Review

### `spatial_ref_sys` / PostGIS In Public

The remaining advisor error is:

```text
public.spatial_ref_sys has RLS disabled
```

Root cause: historical migrations created PostGIS without an explicit schema:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Supabase's current PostGIS docs recommend installing PostGIS in a non-public
schema selected during extension enablement, and examples use
`extensions.geography(...)` for types. Moving an existing PostGIS install out of
`public` can be dependency-sensitive, so this should be handled as a dedicated
platform/database release, not mixed into the community/gastronomy routing
cleanup.

Preflight on 2026-07-08 confirmed that a normal linked SQL change does not have
ownership for this table:

```sql
begin;
alter table public.spatial_ref_sys enable row level security;
rollback;
```

Result:

```text
ERROR: 42501: must be owner of table spatial_ref_sys
```

This is tracked as
`EXC-2026-07-08-POSTGIS-EXTENSION-OWNER` in
`docs/governance/security/EXCEPTIONS.md`. Do not add a standard migration for
this item unless a Supabase-supported owner route or extension migration window
has already passed preflight.

### `extension_in_public`

Advisor reports these extensions in `public`:

- `citext`
- `pg_trgm`
- `postgis`
- `unaccent`

This should be reviewed together with existing type/function references before
changing schemas. It shares the same owner/platform exception as
`spatial_ref_sys`.

### `function_search_path_mutable`

Advisor initially reported 179 functions without explicit `search_path`.

All currently reported search-path findings are now covered by:

- `supabase/migrations/20260706162154_harden_function_search_path_low_risk_subset.sql`
- `supabase/migrations/20260706163017_harden_function_search_path_second_subset.sql`
- `supabase/migrations/20260707083229_harden_remaining_function_search_path.sql`

This category is no longer reported by the linked advisor as of 2026-07-07.

### `rls_policy_always_true`

Advisor initially reported always-true policies on:

- `addresses`
- `analytics_events`
- `application_logs`
- `business_views`
- `classified_reports`
- `community_issue_audit`
- `education_analytics_events`
- `emergency_alerts`
- `groups`
- `qr_code_scans`
- `ride_dispatch_audit`
- `role_history`

All currently reported always-true RLS warnings are now covered. Public
telemetry inserts keep product behavior but now require structural integrity and
no user spoofing; dispatch audit writes moved behind RPC authorization instead
of direct broad table writes.

### Public Storage Listing

Public bucket listing warnings:

- `avatars`
- `business_images`
- `classified_images`
- `event_images`
- `post_images`
- `public-assets`

Review whether broad `SELECT` on `storage.objects` is needed for list APIs. For
public object URLs, bucket public access usually does not require broad listing
policies.

Status: addressed in
`supabase/migrations/20260706104000_harden_public_storage_listing_policies.sql`
and follow-up
`supabase/migrations/20260707083036_drop_public_assets_listing_policy.sql`.

### Auth Setting

Enable leaked password protection in Supabase Auth dashboard/settings if the
plan supports it. Supabase's password-security documentation states that this
setting rejects known leaked passwords via HaveIBeenPwned and is available on
Pro Plan and above. The Management API documents
`PATCH /v1/projects/{ref}/config/auth` for auth config updates, but the local
CLI token available on 2026-07-08 returned `401` when used directly against the
API, and CLI 2.98.2 has no granular `supabase config` subcommand for this
setting. This is tracked as `EXC-2026-07-08-AUTH-HIBP-DASHBOARD`.

## Remote Migration Note

The local and linked remote migration histories were synchronized on
2026-07-07. `npm run validate:migrations:remote` and `npm run verify:deploy`
now pass against the linked project.

Additional remote verification on 2026-07-07 after
`20260707103853_harden_username_auth_rpc_surface.sql`:

```text
get_email_by_username(text):
  anon_execute = false
  authenticated_execute = false
  public_execute = false
  service_role_execute = true
```

The linked advisor no longer reports `get_email_by_username`. The current
summary for the full hardening batch is recorded at the end of this section.

Additional remote verification after
`20260707111214_harden_get_site_setting_invoker.sql`:

```text
get_site_setting(text):
  security_definer = false
  anon_execute = true
  authenticated_execute = true
  public_execute = false

site_settings:
  anon_select = true
  anon_insert/update/delete = false
  authenticated_select = true
  authenticated_insert/update/delete = false

anon runtime check:
  public.get_site_setting('site_name') = "Achegue-se"
```

The linked advisor no longer reports `get_site_setting`.

Additional remote verification after
`20260707112353_harden_get_business_reviews_invoker.sql`:

```text
get_business_reviews(uuid, integer, integer):
  security_definer = false
  anon_execute = true
  authenticated_execute = true
  public_execute = false

reviews:
  anon_select = true
  anon_insert/update/delete = false
  authenticated_select = true

anon runtime check:
  public.get_business_reviews('ec806e1f-63f1-40d8-bbdc-cecd8576cb46', 5, 0)
  returned the active public review row.
```

The linked advisor no longer reports `get_business_reviews`.

Additional remote verification after
`20260707113531_harden_gastronomy_public_menu_rpcs_invoker.sql`:

```text
get_featured_menu_items(uuid):
  security_definer = false
  anon_execute = true
  authenticated_execute = true
  public_execute = false

get_active_promotions(uuid):
  security_definer = false
  anon_execute = true
  authenticated_execute = true
  public_execute = false

menus/menu_categories/menu_items/menu_promotions:
  anon_select = true
  anon_insert/update/delete = false

anon runtime checks:
  public.get_featured_menu_items('cd709a71-03e0-4edb-8114-743599ac960d')
  returned four public featured menu items.

  public.get_active_promotions('cd709a71-03e0-4edb-8114-743599ac960d')
  executed successfully and returned the current active-promotion count.
```

The linked advisor no longer reports `get_featured_menu_items` or
`get_active_promotions`.

Additional remote verification after
`20260707114642_harden_gastronomy_activity_rpc_privacy.sql`:

```text
get_recent_gastronomy_activities(text, integer, text[]):
  security_definer = false
  search_path = public, pg_temp
  anon_execute = true
  authenticated_execute = true
  public_execute = false

anon runtime checks:
  public.get_recent_gastronomy_activities(null, 10, array['favorite'])
  returned 0 rows.

  public.get_recent_gastronomy_activities(null, 10, array['order'])
  returned 0 rows.

  public.get_recent_gastronomy_activities(null, 10, null)
  returned 0 rows in the current dataset because the only active public
  business review is not attached to an active gastronomy profile.
```

The linked advisor no longer reports `get_recent_gastronomy_activities`.
Checkpoint after activity-feed hardening: 146 total findings, 13
`anon_security_definer_function_executable`, 127
`authenticated_security_definer_function_executable`.

Additional remote verification after
`20260707115617_harden_location_descendants_rpc_invoker.sql`:

```text
rpc_get_location_descendants_ids(uuid):
  security_definer = false
  search_path = public, pg_temp
  anon_execute = true
  authenticated_execute = true
  public_execute = false

anon runtime checks:
  active city descendant count = 2
  active territorial group member count = 4
```

The linked advisor no longer reports `rpc_get_location_descendants_ids`.
Checkpoint after territorial helper hardening: 144 total findings, 12
`anon_security_definer_function_executable`, 126
`authenticated_security_definer_function_executable`.

Additional remote verification after
`20260707120534_harden_brand_branches_rpc_invoker.sql`:

```text
get_brand_branches(uuid):
  security_definer = false
  search_path = public, pg_temp
  anon_execute = true
  authenticated_execute = true
  public_execute = false

anon runtime check:
  public.get_brand_branches('a72d1d50-2375-40e3-8f1b-bb3324fc1d10')
  returned the active public branch row.
```

Additional remote verification after
`20260707120937_harden_match_district_by_point_rpc_invoker.sql`:

```text
rpc_match_district_by_point(uuid, double precision, double precision):
  security_definer = false
  search_path = public, extensions, pg_temp
  anon_execute = true
  authenticated_execute = true
  public_execute = false

anon runtime check:
  the RPC executes without the previous ST_Contains(jsonb, geometry) error.
```

Additional remote verification after
`20260707121321_harden_lost_found_public_read_rpcs_invoker.sql`:

```text
count_lost_found_posts_by_type():
  security_definer = false
  anon_execute = true
  authenticated_execute = true
  public_execute = false

find_similar_lost_found_posts(uuid, integer):
  security_definer = false
  anon_execute = true
  authenticated_execute = true
  public_execute = false

anon runtime checks:
  count_lost_found_posts_by_type() executed successfully.
  find_similar_lost_found_posts(..., 100) executed successfully and returned
  0 rows in the current empty dataset with a bounded internal limit.
```

The linked advisor no longer reports `get_brand_branches`,
`rpc_match_district_by_point`, `count_lost_found_posts_by_type`,
`find_similar_lost_found_posts`, `increment_business_views`,
`increment_professional_views`, `increment_vaga_view_count`,
`get_public_business_snapshot_by_slug`, or
`get_public_gastronomy_snapshot_by_slug`. Current summary after the public
snapshot batch: 126 total findings, 3
`anon_security_definer_function_executable`, 117
`authenticated_security_definer_function_executable`.

Do not treat the advisor as fully clean yet. The next database-hardening batch
should focus on the remaining `SECURITY DEFINER` function execute surface,
extensions in `public`, and Auth leaked-password protection. `SECURITY DEFINER`
execute grants must be reviewed function by function against runtime callers
before revoking public access.

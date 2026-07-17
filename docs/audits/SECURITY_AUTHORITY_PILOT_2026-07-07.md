# Security Authority Pilot - 2026-07-07

Status: concluido
Data: 2026-07-07

## Objetivo

Validar que a Security Authority saiu do campo documental e passou a ter regra
executavel no fluxo de release.

## Escopo

- Migrations Supabase novas a partir de `20260707000000`.
- Decisao explicita de Data API para tabelas publicas novas.
- Classificacao de RPC concedida a `anon` ou `PUBLIC`.
- Classificacao de listagem publica ampla em `storage.objects`.
- Mudanca frontend/arquitetural sem risco critico para validar a Authority em
  codigo real fora de migrations.
- Mudanca real de Supabase aplicada no projeto remoto linkado.
- Mudanca critica de Auth/Supabase para remover lookup de e-mail por username
  da superficie RPC publica.
- Mudanca de hardening em RPC publica de leitura, removendo `SECURITY DEFINER`
  desnecessario de `get_site_setting` sem quebrar leitura anonima.
- Mudanca de hardening em RPC publica de reviews, removendo `SECURITY DEFINER`
  desnecessario de `get_business_reviews` sem quebrar leitura anonima.
- Mudanca de hardening em RPCs publicas de menu/promocoes, removendo
  `SECURITY DEFINER` desnecessario de `get_featured_menu_items` e
  `get_active_promotions` sem quebrar leitura anonima.
- Mudanca de hardening em RPC publica de atividade gastronomica, removendo
  `SECURITY DEFINER` de `get_recent_gastronomy_activities` e eliminando leitura
  publica de sinais privados de favoritos e compras.
- Mudanca de hardening em RPC publica territorial, removendo
  `SECURITY DEFINER` de `rpc_get_location_descendants_ids` sem quebrar leitura
  anonima de hierarquia territorial publica.
- Mudancas adicionais em RPCs publicas de leitura: `get_brand_branches`,
  `rpc_match_district_by_point`, `count_lost_found_posts_by_type` e
  `find_similar_lost_found_posts`.
- Mudanca de hardening em RPCs administrativas de pricing, movendo
  `activate_pricing_rule` e `create_active_pricing_rule` para broker Edge
  admin-only.
- Mudanca de hardening em RPCs administrativas de site settings, movendo
  `get_all_site_settings` e `upsert_site_setting` para broker Edge admin-only.
- Mudanca de hardening em RPCs administrativas de comunicacao territorial,
  movendo aprovacao/rejeicao de canais para broker Edge admin-only.
- Mudanca de hardening em RPCs de mutacao de comunicacao territorial de
  usuario, movendo solicitacao de canal, criacao, atualizacao de rascunho e
  publicacao para broker Edge autenticado.
- Mudanca de hardening em helper RLS de comunicacao territorial, removendo
  `communication_current_user_can_manage_channel(uuid)` da superficie RPC
  publica sem quebrar policies.
- Mudanca de hardening em operacoes de leitura/marcacao de notificacoes,
  removendo RPCs privilegiadas do browser e usando RLS direto.
- Mudanca de hardening em criacao de notificacoes, removendo
  `SECURITY DEFINER` de `create_notification` e bloqueando criacao cross-user
  generica no browser.
- Mudanca de broker por dominio para notificacoes de comunidade, validando
  evento real e ownership do perfil ator antes de criar notificacao para
  terceiro.
- Mudanca de broker por dominio para notificacoes profissionais/leads,
  validando mensagem/proposta real e ownership/participacao antes de criar
  notificacao para terceiro.
- Mudanca de trigger interno para notificacao de novo lead profissional,
  porque a criacao do lead pode ser anonima e nao pode depender de JWT.
- Mudanca de broker autenticado para sessao/perfil ativo/MFA, removendo
  `p_user_id` arbitrario do browser e derivando o usuario real do JWT.
- Mudanca de revogacao de sessoes no broker `session-rpc`, removendo os RPCs
  legados de revogacao da superficie executavel por browser.
- Mudanca de broker autenticado para billing/entitlements de usuario,
  removendo `p_user_id` arbitrario do browser e derivando o usuario real do
  JWT.
- Mudanca de broker autenticado para reviews de negocios/gastronomia,
  removendo mutacoes/checks de review da superficie executavel por browser e
  mantendo autorizacao por perfil/pedido no servidor.
- Mudanca de broker autenticado para pedidos/entregas, removendo os RPCs
  mutantes `delivery_*` da superficie executavel por browser e mantendo
  autorizacao por perfil/papel do pedido no servidor.
- Mudanca de broker autenticado para mutacoes de perfil, removendo criacao,
  handle, delete, transferencia de ownership e convite por email da superficie
  executavel por browser.
- Mudanca de hardening em RPCs de versionamento de nichos de gastronomia,
  removendo capabilities/upgrade da superficie executavel por browser.

## Implementacao Validada

- `scripts/validate-supabase-migrations.ts` exporta `validateMigrationFiles`
  para teste isolado e continua funcionando como CLI.
- `tests/security/security-authority-migrations.test.ts` cobre falha e caminho
  permitido para os marcadores da Security Authority.
- `package.json` expoe `validate:security-authority`.
- `scripts/verify-deploy-ready.mjs` executa `validate:security-authority`.
- `src/core/routing/config/centralRoutes.ts` passou a ser o SSOT de rotas da
  central, com `src/modules/central/routes/centralRoutes.ts` apenas
  reexportando a API publica para compatibilidade.
- Imports indevidos de `app` em `core`/`modules` foram trocados pelo utilitario
  canonico em `core/landing`.
- Services sociais passaram a importar tipos Supabase via
  `@/integrations/supabase`, sem acessar `types.generated` por caminho interno.
- `AnswerForm` deixou de importar tipo de `core`, mantendo contrato proprio de
  apresentacao no componente `shared`.
- `supabase/migrations/20260707102718_harden_lgpd_consent_rpc_authorization.sql`
  removeu `anon`/`PUBLIC` das RPCs LGPD `has_consent` e `record_consent`,
  adicionou guardas por `auth.uid()`, admin canonico e `service_role`, e fixou
  `search_path`.
- `supabase/functions/auth-username-login/index.ts` passou a concentrar login
  por username em Edge Function publica com rate limit, usando o RPC privado
  `get_email_by_username` via `service_role` e sem retornar o e-mail resolvido
  ao browser.
- `supabase/migrations/20260707103853_harden_username_auth_rpc_surface.sql`
  removeu `PUBLIC`, `anon` e `authenticated` de `get_email_by_username`,
  mantendo `service_role` como unica role executora.
- `src/core/auth/services/AuthService.ts` deixou de chamar o RPC
  `get_email_by_username` no browser e passou a usar a Edge Function.
- Recuperacao de senha por `@usuario` foi removida da UI/servico; o fluxo agora
  usa e-mail cadastrado, reduzindo enumeracao pre-auth.
- `scripts/security/validate-security.mjs` ganhou excecao estreita e baseada em
  evidencias para o broker publico `auth-username-login`, sem liberar
  `service_role` genericamente em Edge Functions.
- `supabase/migrations/20260707111214_harden_get_site_setting_invoker.sql`
  converteu `get_site_setting(text)` para `SECURITY INVOKER`, manteve
  `EXECUTE` explicito para `anon`/`authenticated`, removeu execute herdado de
  `PUBLIC` e reduziu `site_settings` para `SELECT` publico apenas.
- `supabase/migrations/20260707112353_harden_get_business_reviews_invoker.sql`
  converteu `get_business_reviews(uuid, integer, integer)` para
  `SECURITY INVOKER`, manteve `EXECUTE` explicito para
  `anon`/`authenticated`, removeu execute herdado de `PUBLIC` e reduziu
  `reviews` para `SELECT` anonimo apenas.
- `supabase/migrations/20260707113531_harden_gastronomy_public_menu_rpcs_invoker.sql`
  converteu `get_featured_menu_items(uuid)` e
  `get_active_promotions(uuid)` para `SECURITY INVOKER`, manteve `EXECUTE`
  explicito para `anon`/`authenticated`, removeu execute herdado de `PUBLIC`
  e reduziu `menus`, `menu_categories`, `menu_items` e `menu_promotions` para
  `SELECT` anonimo apenas.
- `supabase/migrations/20260707114642_harden_gastronomy_activity_rpc_privacy.sql`
  converteu `get_recent_gastronomy_activities(text, integer, text[])` para
  `SECURITY INVOKER`, manteve `EXECUTE` explicito para
  `anon`/`authenticated`, removeu execute herdado de `PUBLIC` e restringiu o
  feed publico a reviews publicas visiveis por RLS.
- `supabase/migrations/20260707115617_harden_location_descendants_rpc_invoker.sql`
  converteu `rpc_get_location_descendants_ids(uuid)` para
  `SECURITY INVOKER`, manteve `EXECUTE` explicito para
  `anon`/`authenticated`, removeu execute herdado de `PUBLIC` e preservou
  leitura anonima da hierarquia territorial publica.
- `supabase/migrations/20260707120534_harden_brand_branches_rpc_invoker.sql`
  converteu `get_brand_branches(uuid)` para `SECURITY INVOKER`.
- `supabase/migrations/20260707120937_harden_match_district_by_point_rpc_invoker.sql`
  converteu `rpc_match_district_by_point(uuid, double precision, double
  precision)` para `SECURITY INVOKER` e corrigiu conversao GeoJSON antes de
  `ST_Contains`.
- `supabase/migrations/20260707121321_harden_lost_found_public_read_rpcs_invoker.sql`
  converteu `count_lost_found_posts_by_type()` e
  `find_similar_lost_found_posts(uuid, integer)` para `SECURITY INVOKER`, com
  limite interno no matching.
- `supabase/functions/admin-pricing-rpc/index.ts` passou a concentrar as RPCs
  administrativas de pricing em Edge Function autenticada com `requireAdmin`,
  rate limit, whitelist de acoes e validacao de que `performedBy` pertence ao
  usuario autenticado.
- `supabase/migrations/20260707140908_route_admin_pricing_rpcs_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` dos RPCs
  `activate_pricing_rule` e `create_active_pricing_rule`, mantendo
  `service_role`.
- `supabase/functions/admin-site-settings-rpc/index.ts` passou a concentrar
  as RPCs administrativas de site settings em Edge Function autenticada com
  `requireAdmin`, rate limit, whitelist de acoes, whitelist de chaves e
  validacao de valor por tipo de setting.
- `supabase/migrations/20260707141904_route_admin_site_settings_rpcs_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` dos RPCs
  `get_all_site_settings` e `upsert_site_setting`, mantendo `service_role`.
- `supabase/functions/admin-communication-rpc/index.ts` passou a concentrar
  aprovacao e rejeicao administrativa de canais territoriais em Edge Function
  autenticada com `requireAdmin`, rate limit, whitelist de acoes e validacao de
  UUID/payload.
- `supabase/migrations/20260707143712_route_admin_communication_rpcs_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` dos RPCs
  `admin_approve_communication_channel` e
  `admin_reject_communication_channel_request`, mantendo `service_role` e
  preservando o usuario admin real via `admin_user_id`.
- `supabase/functions/communication-rpc/index.ts` passou a concentrar mutacoes
  de comunicacao territorial em Edge Function autenticada com rate limit,
  whitelist de acoes e validacao de payload.
- `supabase/migrations/20260707145342_route_communication_mutation_rpcs_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` dos RPCs
  `request_communication_channel`, `create_communication_publication`,
  `update_communication_publication_draft` e
  `publish_communication_publication`, mantendo `service_role`, preservando o
  usuario real via `actor_user_id` e convertendo
  `can_channel_publish_in_location(uuid, uuid)` para `SECURITY INVOKER`.
- `supabase/migrations/20260707151447_move_communication_rls_helper_to_private_schema.sql`
  criou o schema privado `private`, moveu o helper
  `communication_current_user_can_manage_channel(uuid)` para fora de `public`,
  atualizou as policies de publicacoes/distribuicao para usar o helper privado
  e removeu a funcao publica homonima.
- `supabase/migrations/20260707152429_harden_notification_read_rpcs.sql`
  removeu `EXECUTE` direto de `authenticated` dos RPCs
  `mark_notification_as_read`, `mark_all_notifications_as_read` e
  `get_unread_notifications_count`, mantendo `service_role`.
- `src/core/notifications/services/NotificationService.ts` passou a usar
  `public.notifications` diretamente com RLS para marcar notificacoes como
  lidas e contar notificacoes nao lidas.
- `supabase/migrations/20260707192404_harden_create_notification_security.sql`
  converteu `create_notification` para `SECURITY INVOKER`, bloqueou
  criacao cross-user por usuario autenticado e reduziu grants de
  `notifications` e `notification_preferences`.
- `src/core/notifications/services/NotificationService.ts` passou a bloquear
  tentativa de criacao cross-user no browser antes de chamar o RPC.
- `supabase/functions/community-notifications-rpc/index.ts` passou a ser o
  broker autenticado de notificacoes de comunidade para terceiros, validando
  `actorProfileId`, registros em `post_likes_new`/`posts`/`comments` e
  resolvendo destinatarios no servidor.
- `src/core/notifications/services/CommunityNotificationBrokerService.ts`
  concentra a chamada client-side ao broker sem aceitar `user_id` de
  destinatario.
- `src/core/posts/services/posts.mutations.ts` e
  `src/core/community/utils/communityBusinessLogic.ts` passaram a usar o
  broker de comunidade em vez de `NotificationService.createNotification`.
- `supabase/functions/professional-notifications-rpc/index.ts` passou a ser o
  broker autenticado de notificacoes profissionais/leads para terceiros,
  validando `messageId`/`quoteId`, ownership do sender/profissional, registros
  em `professional_lead_messages`, `professional_lead_quotes` e
  `professional_leads`, e resolvendo destinatarios no servidor.
- `src/core/notifications/services/ProfessionalNotificationBrokerService.ts`
  concentra a chamada client-side ao broker sem aceitar `user_id` de
  destinatario.
- `src/core/professional/services/ProfessionalLeadService.ts` deixou de chamar
  `NotificationService.createNotification` para notificacoes cross-user de
  leads.
- `supabase/migrations/20260707195524_route_professional_notifications_through_trusted_brokers.sql`
  tornou `create_professional_lead_created_event()` a autoridade interna para
  notificar o profissional sobre lead novo, preservando o evento de auditoria,
  resolvendo o dono no banco e revogando `EXECUTE` de `anon` e
  `authenticated`.
- `supabase/functions/session-rpc/index.ts` passou a ser o broker autenticado
  de sessao, perfil ativo e MFA, validando o JWT e chamando os RPCs internos
  com `p_user_id` derivado do usuario autenticado.
- `src/core/session/services/SessionRpcService.ts` concentra a chamada
  client-side ao broker sem aceitar `p_user_id` no payload.
- `src/core/session/services/SessionService.ts`,
  `src/core/profiles/services/ProfileService.ts`,
  `src/core/profiles/services/profile.queries.ts` e
  `src/core/auth/services/MFAService.ts` deixaram de chamar diretamente
  `get_active_profile`, `switch_active_profile` e
  `check_user_mfa_required` com id de usuario vindo do browser.
- `supabase/migrations/20260707201023_route_session_profile_rpcs_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` dos tres RPCs de sessao/perfil
  ativo/MFA, mantendo apenas `service_role`.
- `supabase/functions/session-rpc/index.ts` foi estendido para revogar sessao
  individual e revogar todas as sessoes do usuario autenticado com update
  direto em `user_sessions`, sempre filtrando por `user_id` derivado do JWT.
- `src/core/auth/services/SessionService.ts` deixou de chamar diretamente
  `revoke_user_session` e `revoke_all_user_sessions`.
- `supabase/migrations/20260707205315_route_session_revocation_through_session_rpc.sql`
  removeu `EXECUTE` direto de `authenticated` dos dois RPCs legados de
  revogacao de sessao, mantendo apenas `service_role`.
- `supabase/functions/billing-entitlements-rpc/index.ts` passou a ser o broker
  autenticado de assinatura ativa, plano, feature e limite de entitlement,
  validando o JWT e chamando os RPCs internos com `p_user_id` derivado do
  usuario autenticado.
- `src/core/billing/services/BillingEntitlementsRpcService.ts` concentra a
  chamada client-side ao broker sem aceitar `p_user_id` no payload.
- `src/core/billing/services/SubscriptionService.ts` deixou de chamar
  diretamente `get_user_active_subscription`, `user_has_plan`,
  `user_has_feature` e `get_user_entitlement_limit` com id de usuario vindo do
  browser.
- `supabase/migrations/20260707204323_route_billing_entitlements_rpcs_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` dos quatro RPCs de
  billing/entitlements, mantendo apenas `service_role`.
- `supabase/functions/business-reviews-rpc/index.ts` passou a ser o broker
  autenticado de checks e mutacoes de reviews de negocios, validando JWT,
  profile ownership por owner/`profile_members`/admin canonico e pedido
  entregue quando `order_id` existe.
- `src/core/business/services/BusinessReviewService.ts` concentra a policy e a
  chamada client-side ao broker sem aceitar `user_id` confiavel no payload. O
  service anterior de Gastronomia foi removido na consolidacao CP-013.
- `src/modules/business/gastronomy/services/review.queries.ts` deixou de
  chamar diretamente `can_user_review_business`, `create_business_review`,
  `update_business_review`, `delete_business_review` e
  `add_business_review_response` pelo browser.
- `supabase/migrations/20260707210813_route_business_reviews_rpcs_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` dos cinco RPCs de reviews de
  negocios, mantendo apenas `service_role`.
- `supabase/functions/privacy-rpc/index.ts` passou a ser o broker autenticado
  de consentimento LGPD, derivando o usuario real do JWT e chamando
  `record_consent` sem aceitar `user_id` confiavel do browser.
- `src/core/privacy/services/PrivacyRpcService.ts` concentra a chamada
  client-side ao broker; `ConsentService` e `PrivacySettingsService` deixaram
  de chamar `record_consent` diretamente.
- `supabase/functions/session-rpc/index.ts` passou a cobrir
  `updateSessionActivity`, atualizando `user_sessions` com filtros explicitos
  de `user_id` autenticado e bearer token atual.
- `supabase/migrations/20260707212504_route_privacy_session_rpcs_through_edge_functions.sql`
  removeu `EXECUTE` direto de `authenticated` de `record_consent` e
  `update_session_activity`, mantendo apenas `service_role`, e corrigiu
  `unique_active_consent` para unicidade parcial em `revoked_at IS NULL`.
- `supabase/functions/location-rpc/index.ts` passou a ser o broker autenticado
  de escrita para reconciliacao de cidade canonica por codigo IBGE.
- `src/core/location/services/LocationRpcService.ts` concentra a chamada
  client-side ao broker; `LocationGeocodingService` deixou de chamar
  `rpc_upsert_canonical_city_by_ibge` diretamente.
- `supabase/migrations/20260707213810_route_location_city_upsert_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` de
  `rpc_upsert_canonical_city_by_ibge`, mantendo apenas `service_role` para o
  broker.
- `supabase/functions/delivery-rpc/index.ts` passou a ser o broker autenticado
  de mutacoes de pedido/entrega, validando JWT, acesso ao `actorProfileId` por
  dono/membro/admin e papel permitido por acao no pedido antes de chamar os
  RPCs legados com `service_role`.
- `src/core/mobility/delivery/services/DeliveryRpcService.ts` concentra a
  chamada client-side ao broker; `OrderDeliverySSOTService` deixou de chamar
  diretamente os 10 RPCs `delivery_*` mutantes.
- `supabase/migrations/20260707222343_route_delivery_order_rpcs_through_edge_function.sql`
  removeu `EXECUTE` direto de `authenticated` de
  `delivery_create_order`, `delivery_transition_logistics_status`,
  `delivery_mark_picked_up`, `delivery_attach_delivery_proof`,
  `delivery_mark_delivered`, `delivery_transition_financial_status`,
  `delivery_report_occurrence`, `delivery_resolve_occurrence`,
  `delivery_update_order_notes` e
  `delivery_update_order_source_metadata`, mantendo apenas `service_role`.
- `supabase/migrations/20260707153515_harden_gastronomy_niche_capability_rpcs.sql`
  removeu `EXECUTE` direto de `authenticated` dos RPCs
  `add_niche_capability`, `has_niche_capability` e
  `mark_niche_needs_upgrade`, mantendo `service_role`.
- `supabase/functions/profile-rpc/index.ts` passou a ser o broker autenticado
  de mutacoes de perfil, validando JWT e chamando wrappers publicos
  `service_role` que recebem `actor_user_id` explicito.
- `src/core/profiles/services/ProfileRpcService.ts` concentra a chamada
  client-side ao broker; `MultiProfileService`, `ProfileMembersService` e
  bootstraps E2E deixaram de chamar os RPCs de perfil diretamente.
- `supabase/migrations/20260707232826_route_profile_mutation_rpcs_through_edge_function.sql`
  moveu a logica SQL para helpers internos, criou wrappers para o broker e
  removeu `EXECUTE` direto de `authenticated` dos cinco RPCs de perfil.
- `supabase/functions/role-rpc/index.ts` passou a ser o broker autenticado de
  leitura/checks de roles, validando JWT e restringindo leitura ao proprio
  usuario ou a admin canonico.
- `src/core/authorization/services/RoleRpcService.ts` concentra a chamada
  client-side ao broker; `RoleService` deixou de chamar `has_role`,
  `get_user_roles`, `is_admin` e `is_super_admin` diretamente.
- `supabase/migrations/20260707234302_route_role_read_helpers_through_edge_function.sql`
  removeu `EXECUTE` direto de `anon` e `authenticated` de `has_role` e
  `get_user_roles`, mantendo `service_role`.
- `supabase/migrations/20260708000031_move_rls_authorization_helpers_to_private_schema.sql`
  criou helpers `private.*`, reescreveu policies dependentes e removeu
  `EXECUTE` direto de `authenticated` dos wrappers publicos de autorizacao RLS.
- `src/modules/business/gastronomy/niches/versioning/NicheVersioningService.ts`
  deixou de chamar esses RPCs pelo browser: leitura usa
  `public.gastronomy_profiles` sob RLS e mutacoes de capability/upgrade
  retornam falha controlada ate existir caminho admin/server autorizado.
- `supabase/migrations/20260707155447_harden_gastronomy_profile_column_grants.sql`
  removeu grants amplos de escrita em `public.gastronomy_profiles` para
  `authenticated` e restaurou apenas INSERT/UPDATE por coluna operacional,
  bloqueando escrita direta em capabilities, plano e versionamento de nicho.

## Evidencias

Comandos executados:

```powershell
npx vitest run tests/security/security-authority-migrations.test.ts
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:docs-structure
npm run validate:docs-live-links
npx eslint --no-ignore scripts/validate-supabase-migrations.ts tests/security/security-authority-migrations.test.ts
npm run verify:deploy
npm run validate:deps
npm run validate:architecture:governance -- --json
npm run validate:architecture:incremental
npx eslint --no-ignore src/core/routing/config/centralRoutes.ts src/modules/central/routes/centralRoutes.ts src/core/community/access/CommunityPortalGate.tsx src/core/community/pages/ComunidadePage.tsx src/core/community/pages/EventosPage.tsx src/modules/professionals/services/pages/ServicosLandingPage.tsx src/core/social/services/SocialInteractionsService.ts src/core/social/services/SocialGroupInteractionsService.ts src/shared/components/recomendacoes/AnswerForm.tsx
npm run typecheck:app
git diff --check -- src/core/routing/config/centralRoutes.ts src/modules/central/routes/centralRoutes.ts src/core/community/access/CommunityPortalGate.tsx src/core/community/pages/ComunidadePage.tsx src/core/community/pages/EventosPage.tsx src/modules/professionals/services/pages/ServicosLandingPage.tsx src/core/social/services/SocialInteractionsService.ts src/core/social/services/SocialGroupInteractionsService.ts src/shared/components/recomendacoes/AnswerForm.tsx
supabase migration new harden_lgpd_consent_rpc_authorization
npm run validate:migrations
npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts --reporter=dot
supabase db push --linked --dry-run
supabase db push --linked --yes
npm run validate:migrations:remote
supabase db advisors --linked --type security --fail-on none --output json
supabase functions deploy auth-username-login --no-verify-jwt --use-api
supabase db query --linked -o table "SELECT ... has_function_privilege(...) ..."
supabase functions list
supabase migration new harden_get_site_setting_invoker
npm run validate:migrations
npm run security:validate
npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts
supabase db push --linked --yes
supabase db query --linked -o table "begin; set local role anon; select public.get_site_setting('site_name') as site_name; rollback;"
supabase migration new harden_get_business_reviews_invoker
npm run validate:migrations
npm run security:validate
npx vitest --run src/modules/business/gastronomy/__tests__/GastronomySupabaseSecurityAudit.spec.ts
supabase db push --linked --yes
supabase db query --linked -o table "begin; set local role anon; select id, reviewer_profile_id, rating, comment is not null as has_comment from public.get_business_reviews('ec806e1f-63f1-40d8-bbdc-cecd8576cb46'::uuid, 5, 0); rollback;"
supabase migration new harden_gastronomy_public_menu_rpcs_invoker
npm run validate:migrations
npm run security:validate
npx vitest --run src/modules/business/gastronomy/__tests__/GastronomySupabaseSecurityAudit.spec.ts
supabase db push --linked --yes
supabase db query --linked -o table "begin; set local role anon; select id, name, base_price, category_name from public.get_featured_menu_items('cd709a71-03e0-4edb-8114-743599ac960d'::uuid) limit 5; rollback;"
supabase migration new harden_gastronomy_activity_rpc_privacy
npm run validate:migrations
npm run security:validate
npx vitest --run src/modules/business/gastronomy/__tests__/GastronomySupabaseSecurityAudit.spec.ts
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase db query --linked -o table "begin; set local role anon; select count(*) as favorite_count from public.get_recent_gastronomy_activities(null, 10, array['favorite']::text[]); rollback;"
supabase db query --linked -o table "begin; set local role anon; select count(*) as order_count from public.get_recent_gastronomy_activities(null, 10, array['order']::text[]); rollback;"
supabase db advisors --linked --type security --fail-on none --output json
supabase migration new harden_location_descendants_rpc_invoker
npm run validate:migrations
npm run security:validate
npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase db query --linked -o table "begin; set local role anon; select cardinality(public.rpc_get_location_descendants_ids((select id from public.locations where status = 'active' and type = 'city' limit 1))) as city_descendant_count; rollback;"
supabase db query --linked -o table "begin; set local role anon; select cardinality(public.rpc_get_location_descendants_ids((select id from public.territorial_groups where status = 'active' limit 1))) as group_member_count; rollback;"
supabase db advisors --linked --type security --fail-on none --output json
supabase migration new harden_brand_branches_rpc_invoker
supabase migration new harden_match_district_by_point_rpc_invoker
supabase migration new harden_lost_found_public_read_rpcs_invoker
npm run validate:migrations
npm run security:validate
npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts
supabase db push --linked --yes
supabase db query --linked -o table "begin; set local role anon; select * from public.get_brand_branches('a72d1d50-2375-40e3-8f1b-bb3324fc1d10'::uuid); rollback;"
supabase db query --linked -o table "begin; set local role anon; select count(*) as matched_rows from public.rpc_match_district_by_point((select parent_id from public.locations where type = 'district' and status = 'active' limit 1), -12.999, -38.45); rollback;"
supabase db query --linked -o table "begin; set local role anon; select count(*) as similar_count from public.find_similar_lost_found_posts('00000000-0000-0000-0000-000000000000'::uuid, 100); rollback;"
supabase db advisors --linked --type security --fail-on none --output json
supabase migration new route_admin_communication_rpcs_through_edge_function
npm exec vitest run tests/security/admin-communication-rpc-security.test.ts tests/security/admin-site-settings-rpc-security.test.ts tests/security/admin-pricing-rpc-security.test.ts tests/security/admin-notifications-rpc-security.test.ts
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase functions deploy admin-communication-rpc --use-api
supabase db query --linked -o json "WITH target AS (...) SELECT ... has_function_privilege(...) ..."
supabase db advisors --linked --type security --level warn --output json
supabase migration new route_communication_mutation_rpcs_through_edge_function
npm exec vitest run tests/security/communication-rpc-security.test.ts tests/security/admin-communication-rpc-security.test.ts
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase functions deploy communication-rpc --use-api
supabase db query --linked -o json "WITH target AS (...) SELECT ... has_function_privilege(...) ..."
Invoke-WebRequest https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/communication-rpc ...
supabase db advisors --linked --type security --level warn --output json
npm run validate:migrations:remote
npm run typecheck:app
npm run validate:docs-structure
npm run validate:docs-live-links
npm run security:validate
npm run verify:deploy
supabase migration new move_communication_rls_helper_to_private_schema
npm run validate:migrations
npm exec vitest run tests/security/communication-rls-helper-security.test.ts tests/security/communication-rpc-security.test.ts tests/security/admin-communication-rpc-security.test.ts
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase db query --linked -o json "SELECT to_regprocedure(...), has_function_privilege(...) ..."
supabase db query --linked -o json "SELECT tablename, policyname, qual, with_check FROM pg_policies ..."
supabase db advisors --linked --type security --level warn --output json
npm run validate:migrations:remote
npm run security:validate
npm run typecheck:app
supabase migration new harden_notification_read_rpcs
npm run validate:migrations
npm exec vitest run tests/security/notification-read-rpc-security.test.ts
npm run typecheck:app
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase db query --linked -o json "WITH target AS (...) SELECT ... has_function_privilege(...) ..."
supabase db advisors --linked --type security --level warn --output json
npm run validate:migrations:remote
npm run security:validate
supabase migration new harden_gastronomy_niche_capability_rpcs
npm exec vitest run src/modules/business/gastronomy/niches/versioning/__tests__/NicheVersioningService.spec.ts tests/security/gastronomy-niche-rpc-security.test.ts
npm run typecheck:app
npm run validate:migrations -- --dry-run
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase db query --linked -o json "SELECT ... has_function_privilege(...) ..."
supabase db advisors --linked --type security --output json
npm run validate:migrations:remote
npm run security:validate
npm run verify:deploy
supabase migration new harden_gastronomy_profile_column_grants
npm exec vitest run tests/security/gastronomy-niche-rpc-security.test.ts src/modules/business/gastronomy/niches/versioning/__tests__/NicheVersioningService.spec.ts
npm run validate:migrations -- --dry-run
npm run typecheck:app
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase db query --linked -o json "SELECT column_name, privilege_type FROM information_schema.column_privileges ..."
npm run validate:migrations:remote
npm exec vitest run tests/security/professional-notification-broker-security.test.ts tests/security/community-notification-broker-security.test.ts tests/security/notification-create-rpc-security.test.ts
npm run typecheck:app
npm run validate:migrations
supabase db push --dry-run
supabase db push
supabase functions deploy professional-notifications-rpc --use-api
Invoke-WebRequest https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/professional-notifications-rpc ...
supabase db query --linked -o table "select p.prosecdef as security_definer, ... has_function_privilege(...) ... where p.proname = 'create_professional_lead_created_event';"
supabase db advisors --linked --type security --level warn -o json
npm exec vitest run tests/security/session-rpc-security.test.ts src/core/session/services/SessionService.test.ts
npm run typecheck:app
npm run validate:migrations
supabase db push --dry-run
supabase db push
supabase functions deploy session-rpc --use-api
Invoke-WebRequest https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/session-rpc ...
supabase db query --linked -o table "select p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef, has_function_privilege('anon', p.oid, 'EXECUTE'), has_function_privilege('authenticated', p.oid, 'EXECUTE'), has_function_privilege('service_role', p.oid, 'EXECUTE') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('get_active_profile','switch_active_profile','check_user_mfa_required');"
supabase db advisors --linked --type security --level warn -o json
npm exec vitest run tests/security/billing-entitlements-rpc-security.test.ts
npm run validate:migrations
npm run typecheck:app
supabase db push --dry-run
supabase db push
supabase functions deploy billing-entitlements-rpc --use-api
Invoke-WebRequest https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/billing-entitlements-rpc ...
supabase db query --linked -o table "select p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef, has_function_privilege('anon', p.oid, 'EXECUTE'), has_function_privilege('authenticated', p.oid, 'EXECUTE'), has_function_privilege('service_role', p.oid, 'EXECUTE') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('get_user_active_subscription','user_has_plan','user_has_feature','get_user_entitlement_limit');"
supabase db query --linked -o table "select count(*) filter (where p.prosecdef and has_function_privilege('authenticated', p.oid, 'EXECUTE')) as authenticated_security_definer_executable, count(*) filter (where p.prosecdef and has_function_privilege('anon', p.oid, 'EXECUTE')) as anon_security_definer_executable from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public';"
npm run validate:migrations:remote
npm exec vitest run tests/security/session-rpc-security.test.ts
npm run validate:migrations
npm run typecheck:app
supabase db push --dry-run
supabase db push
supabase functions deploy session-rpc --use-api
Invoke-WebRequest https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/session-rpc ...
supabase db query --linked -o table "select p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef, has_function_privilege('anon', p.oid, 'EXECUTE'), has_function_privilege('authenticated', p.oid, 'EXECUTE'), has_function_privilege('service_role', p.oid, 'EXECUTE') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('revoke_user_session','revoke_all_user_sessions');"
supabase db query --linked -o table "select count(*) filter (where p.prosecdef and has_function_privilege('authenticated', p.oid, 'EXECUTE')) as authenticated_security_definer_executable, count(*) filter (where p.prosecdef and has_function_privilege('anon', p.oid, 'EXECUTE')) as anon_security_definer_executable from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public';"
npm run validate:migrations:remote
```

Resultado:

- teste isolado: `7 passed`;
- migrations locais: consistente;
- drift remoto: sincronizado;
- docs vivos: validos;
- eslint pontual: sem erros;
- deploy readiness: `PROJETO PRONTO PARA DEPLOY`.
- dependencias arquiteturais: 0 violacoes, 0 ciclos, 0 imports legados;
- governanca arquitetural: `[]`;
- arquitetura incremental: 0 violacoes atuais, 0 novas;
- typecheck app: sem erros;
- `git diff --check` escopado: sem erros bloqueantes; somente avisos LF/CRLF
  esperados no Windows.
- migration Supabase real aplicada ao remoto:
  `20260707102718_harden_lgpd_consent_rpc_authorization`;
- historico local/remoto: sincronizado;
- advisor remoto depois da migration: 158 achados totais, com
  `anon_security_definer_function_executable` reduzido de 21 para 19;
- `has_consent` e `record_consent` nao aparecem mais na lista de RPCs
  `SECURITY DEFINER` executaveis por `anon`.
- Edge Function `auth-username-login` implantada no projeto remoto
  `xhdowzacfujckjelqhtd`, versao 1, com `--no-verify-jwt`;
- teste HTTP remoto com usuario inexistente retornou `401` e mensagem generica
  `Invalid login credentials`;
- `get_email_by_username(text)` verificado no remoto com:
  `anon_execute=false`, `authenticated_execute=false`,
  `public_execute=false`, `service_role_execute=true`;
- advisor remoto depois da migration de username: 156 achados totais, com
  `anon_security_definer_function_executable` reduzido para 18 e
  `get_email_by_username` ausente.
- migration `20260707111214_harden_get_site_setting_invoker` aplicada ao
  remoto;
- `get_site_setting(text)` verificado no remoto com `security_definer=false`,
  `anon_execute=true`, `authenticated_execute=true` e `public_execute=false`;
- `site_settings` verificado com `SELECT` para `anon`/`authenticated` e sem
  `INSERT`, `UPDATE` ou `DELETE` publico;
- teste remoto como role `anon` retornou `Achegue-se` para
  `public.get_site_setting('site_name')`;
- advisor remoto depois dessa migration: 154 achados totais, 17
  `anon_security_definer_function_executable`, 131
  `authenticated_security_definer_function_executable`, e `get_site_setting`
  ausente.
- migration `20260707112353_harden_get_business_reviews_invoker` aplicada ao
  remoto;
- `get_business_reviews(uuid, integer, integer)` verificado no remoto com
  `security_definer=false`, `anon_execute=true`, `authenticated_execute=true`
  e `public_execute=false`;
- `reviews` verificado com `SELECT` para `anon` e sem `INSERT`, `UPDATE` ou
  `DELETE` anonimo;
- teste remoto como role `anon` retornou a review publica ativa do negocio
  `ec806e1f-63f1-40d8-bbdc-cecd8576cb46`;
- advisor remoto depois dessa migration: 152 achados totais, 16
  `anon_security_definer_function_executable`, 130
  `authenticated_security_definer_function_executable`, e
  `get_business_reviews` ausente.
- migration `20260707113531_harden_gastronomy_public_menu_rpcs_invoker`
  aplicada ao remoto;
- `get_featured_menu_items(uuid)` e `get_active_promotions(uuid)` verificados
  no remoto com `security_definer=false`, `anon_execute=true`,
  `authenticated_execute=true` e `public_execute=false`;
- `menus`, `menu_categories`, `menu_items` e `menu_promotions` verificados com
  `SELECT` para `anon` e sem `INSERT`, `UPDATE` ou `DELETE` anonimo;
- teste remoto como role `anon` retornou quatro itens em destaque do negocio
  `cd709a71-03e0-4edb-8114-743599ac960d`;
- advisor remoto depois dessa migration: 148 achados totais, 14
  `anon_security_definer_function_executable`, 128
  `authenticated_security_definer_function_executable`, e as duas RPCs
  ausentes.
- migration `20260707114642_harden_gastronomy_activity_rpc_privacy` aplicada ao
  remoto;
- `get_recent_gastronomy_activities(text, integer, text[])` verificado no
  remoto com `security_definer=false`, `search_path=public, pg_temp`,
  `anon_execute=true`, `authenticated_execute=true` e `public_execute=false`;
- teste remoto como role `anon` retornou 0 linhas para os filtros `favorite` e
  `order`, confirmando que favoritos e compras nao sao mais publicados por essa
  RPC;
- advisor remoto depois dessa migration: 146 achados totais, 13
  `anon_security_definer_function_executable`, 127
  `authenticated_security_definer_function_executable`, e
  `get_recent_gastronomy_activities` ausente.
- migration `20260707115617_harden_location_descendants_rpc_invoker` aplicada
  ao remoto;
- `rpc_get_location_descendants_ids(uuid)` verificado no remoto com
  `security_definer=false`, `search_path=public, pg_temp`,
  `anon_execute=true`, `authenticated_execute=true` e `public_execute=false`;
- testes remotos como role `anon` retornaram 2 descendentes para uma cidade
  ativa e 4 membros para o grupo territorial ativo;
- advisor remoto depois dessa migration: 144 achados totais, 12
  `anon_security_definer_function_executable`, 126
  `authenticated_security_definer_function_executable`, e
  `rpc_get_location_descendants_ids` ausente.
- migrations `20260707120534_harden_brand_branches_rpc_invoker`,
  `20260707120937_harden_match_district_by_point_rpc_invoker` e
  `20260707121321_harden_lost_found_public_read_rpcs_invoker` aplicadas ao
  remoto;
- `get_brand_branches`, `rpc_match_district_by_point`,
  `count_lost_found_posts_by_type` e `find_similar_lost_found_posts`
  verificados no remoto com `security_definer=false`, `anon_execute=true`,
  `authenticated_execute=true` e `public_execute=false`;
- `rpc_match_district_by_point` deixou de falhar com
  `ST_Contains(jsonb, geometry)`;
- advisor remoto depois desse lote: 136 achados totais, 8
  `anon_security_definer_function_executable`, 122
  `authenticated_security_definer_function_executable`.
- migrations `20260707122417_harden_public_view_counters_edge_broker` e
  `20260707123630_fix_public_view_counter_rpc_parameters` aplicadas ao remoto;
- Edge Function `track-public-view` implantada no projeto remoto
  `xhdowzacfujckjelqhtd` com `--no-verify-jwt`, usando rate limit, whitelist de
  entidades (`business`, `professional`, `vaga`) e validacao UUID;
- `increment_business_views`, `increment_professional_views` e
  `increment_vaga_view_count` verificados no remoto com
  `anon_execute=false`, `authenticated_execute=false`,
  `public_execute=false` e `service_role_execute=true`;
- grants de tabela verificados no remoto: `anon` sem `INSERT`/`UPDATE` em
  `business_stats`, `professional_stats` e `vagas`; `vagas` preserva `SELECT`
  publico para vagas publicadas via RLS;
- bug legado nos contadores de empresa/profissional corrigido: os parametros
  agora sao qualificados como `increment_business_views.business_id` e
  `increment_professional_views.professional_id`, removendo ambiguidade com
  colunas;
- smoke HTTP remoto do broker retornou `202` com `{"ok":true}`;
- advisor remoto depois desse lote: 130 achados totais, 5
  `anon_security_definer_function_executable`, 119
  `authenticated_security_definer_function_executable`.
- migration `20260707124348_harden_public_snapshot_rpcs_invoker` aplicada ao
  remoto;
- `get_public_business_snapshot_by_slug(text,text,text,text)` e
  `get_public_gastronomy_snapshot_by_slug(text,text,text,text)` verificados no
  remoto com `security_definer=false`, `search_path=public, pg_temp`,
  `anon_execute=true`, `authenticated_execute=true` e `public_execute=false`;
- smoke remoto como role `anon` retornou snapshots de negocio e gastronomia
  para uma pizzaria ativa, mantendo descoberta publica sem bypass de RLS;
- advisor remoto depois desse lote: 126 achados totais, 3
  `anon_security_definer_function_executable`, 117
  `authenticated_security_definer_function_executable`; os achados anonimos
  restantes sao apenas overloads `st_estimatedextent` do PostGIS.
- migration `20260707124929_revoke_public_postgis_estimatedextent_execute`
  aplicada ao remoto como tentativa de revogar execucao publica de
  `st_estimatedextent`, mas os grants permaneceram por ownership/grantor
  `supabase_admin`; advisor remoto permaneceu em 126 achados totais, 3
  `anon_security_definer_function_executable` e 117
  `authenticated_security_definer_function_executable`.
- migrations `20260707133656`,
  `20260707134401`, `20260707134629` e `20260707134943` aplicadas ao remoto
  para reduzir a superficie `authenticated SECURITY DEFINER`;
- Edge Function `admin-notifications-rpc` implantada no projeto remoto
  `xhdowzacfujckjelqhtd`, com `requireAdmin`, rate limit e whitelist de acoes;
- RPCs `admin_notifications_get_*` verificadas com
  `authenticated_execute=false` e `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `admin-notifications-rpc` retornou `401`;
- advisor remoto depois desse lote: 86 achados totais, 3
  `anon_security_definer_function_executable`, 77
  `authenticated_security_definer_function_executable`.
- migration `20260707140908_route_admin_pricing_rpcs_through_edge_function`
  aplicada ao remoto;
- Edge Function `admin-pricing-rpc` implantada no projeto remoto
  `xhdowzacfujckjelqhtd`, com `verify_jwt=true`, `requireAdmin`, rate limit,
  whitelist de acoes e validacao de ownership do `performedBy`;
- RPCs `activate_pricing_rule` e `create_active_pricing_rule` verificadas no
  remoto com `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- smoke remoto sem JWT para `admin-pricing-rpc` retornou `401`;
- advisor remoto depois desse lote: 84 achados totais, 3
  `anon_security_definer_function_executable`, 75
  `authenticated_security_definer_function_executable`.
- migration `20260707141904_route_admin_site_settings_rpcs_through_edge_function`
  aplicada ao remoto;
- Edge Function `admin-site-settings-rpc` implantada no projeto remoto
  `xhdowzacfujckjelqhtd`, com `verify_jwt=true`, `requireAdmin`, rate limit,
  whitelist de acoes, whitelist de chaves e validacao por tipo de setting;
- RPCs `get_all_site_settings` e `upsert_site_setting` verificadas no remoto
  com `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- smoke remoto sem JWT para `admin-site-settings-rpc` retornou `401`;
- advisor remoto depois desse lote: 82 achados totais, 3
  `anon_security_definer_function_executable`, 73
  `authenticated_security_definer_function_executable`.
- migration
  `20260707143712_route_admin_communication_rpcs_through_edge_function`
  aplicada ao remoto;
- Edge Function `admin-communication-rpc` implantada no projeto remoto
  `xhdowzacfujckjelqhtd`, com `verify_jwt=true`, `requireAdmin`, rate limit,
  whitelist de acoes e validacao de payload;
- RPCs `admin_approve_communication_channel` e
  `admin_reject_communication_channel_request` verificadas no remoto com
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- smoke remoto sem JWT para `admin-communication-rpc` retornou `401`;
- advisor remoto depois desse lote: 80 achados totais, 3
  `anon_security_definer_function_executable`, 71
  `authenticated_security_definer_function_executable`.
- migration
  `20260707145342_route_communication_mutation_rpcs_through_edge_function`
  aplicada ao remoto;
- Edge Function `communication-rpc` implantada no projeto remoto
  `xhdowzacfujckjelqhtd`, com `verify_jwt=true`, autenticacao obrigatoria,
  rate limit, whitelist de acoes e validacao de payload;
- RPCs `request_communication_channel`, `create_communication_publication`,
  `update_communication_publication_draft` e
  `publish_communication_publication` verificadas no remoto com
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- `can_channel_publish_in_location(uuid, uuid)` verificado como
  `security_definer=false`, com `anon_execute=false` e
  `authenticated_execute=true`;
- smoke remoto sem JWT para `communication-rpc` retornou `401`;
- advisor remoto depois desse lote: 75 achados totais, 3
  `anon_security_definer_function_executable`, 66
  `authenticated_security_definer_function_executable`.
- migration
  `20260707151447_move_communication_rls_helper_to_private_schema` aplicada ao
  remoto;
- `public.communication_current_user_can_manage_channel(uuid)` removida;
- `private.communication_current_user_can_manage_channel(uuid)` criada com
  `anon_private_execute=false`, `authenticated_private_execute=true` e
  `service_role_private_execute=true`;
- policies `communication_distribution_member_select`,
  `communication_publications_member_select`,
  `communication_publications_member_insert` e
  `communication_publications_member_update` verificadas apontando para
  `private.communication_current_user_can_manage_channel`;
- leitura remota como role `authenticated` nao gerou `permission denied`;
- advisor remoto depois desse lote: 74 achados totais, 3
  `anon_security_definer_function_executable`, 65
  `authenticated_security_definer_function_executable`, sem achados de
  comunicacao.
- migration `20260707152429_harden_notification_read_rpcs` aplicada ao remoto;
- RPCs `mark_notification_as_read`, `mark_all_notifications_as_read` e
  `get_unread_notifications_count` verificadas no remoto com
  `authenticated_execute=false` e `service_role_execute=true`;
- `NotificationService` nao chama mais esses tres RPCs e usa RLS de
  `public.notifications`;
- advisor remoto depois desse lote: 71 achados totais, 3
  `anon_security_definer_function_executable`, 62
  `authenticated_security_definer_function_executable`. O unico achado de
  notificacao restante e `create_notification`.
- migration `20260707153515_harden_gastronomy_niche_capability_rpcs` aplicada
  ao remoto;
- RPCs `add_niche_capability`, `has_niche_capability` e
  `mark_niche_needs_upgrade` verificadas no remoto com
  `authenticated_execute=false` e `service_role_execute=true`;
- `has_niche_capability` verificada com `security_definer=false`;
- `NicheVersioningService` nao chama mais esses tres RPCs no browser;
- `public.gastronomy_profiles` verificada no remoto sem INSERT/UPDATE para
  `authenticated` em `enabled_capabilities`, `missing_capabilities`,
  `needs_niche_upgrade`, `niche_config_version`, `support_level`,
  `operational_mode`, `primary_niche_key`, `last_niche_upgrade_at` e
  `plan_tier`;
- advisor remoto depois desse lote: 68 achados totais, 3
  `anon_security_definer_function_executable`, 59
  `authenticated_security_definer_function_executable`, sem matches de nicho.
- migration `20260707160719_harden_business_favorites_count_rpc` aplicada ao
  remoto;
- `FavoritesQueryService.getBusinessFavoritesCount` nao chama mais
  `get_business_favorites_count` no browser e le
  `business_data.favorites_count` sob RLS;
- RPC `get_business_favorites_count(uuid)` verificado no remoto com
  `security_definer=false`, `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`;
- advisor remoto depois desse lote: 67 achados totais, 3
  `anon_security_definer_function_executable`, 58
  `authenticated_security_definer_function_executable`, sem match de
  `get_business_favorites_count`.
- observacao para etapa seguinte: `business_data` ainda possui grants amplos
  para `anon`/`authenticated`; reduzir isso exige mapear criacao/edicao de
  empresas e aplicar grants por coluna com testes dos fluxos afetados.
- Edge Function `admin-business-rpc` criada e implantada com `verify_jwt=true`,
  `requireAdmin`, rate limit e uso de `service_role` para atualizar apenas
  `is_verified` e `is_premium`;
- migration `20260707162026_harden_business_data_column_grants` aplicada ao
  remoto;
- `public.business_data` verificada no remoto com `anon` e `authenticated`
  tendo apenas `SELECT` em nivel de tabela;
- `authenticated` verificado sem `INSERT`/`UPDATE` para `is_verified`,
  `is_premium`, `favorites_count`, `recommendations_count`, `rating`,
  `total_reviews` e `total_products`;
- `AdminBusinessService` nao usa mais `BusinessService.updateBusiness` para
  `is_verified`/`is_premium`; essas acoes passam pelo broker admin;
- smoke remoto de `admin-business-rpc` sem JWT retornou `401`;
- advisor remoto depois desse lote: 67 achados totais, 3
  `anon_security_definer_function_executable`, 58
  `authenticated_security_definer_function_executable`. O numero nao caiu
  porque grants amplos de tabela nao eram um finding especifico do Advisor.
- migration `20260707192404_harden_create_notification_security` aplicada ao
  remoto;
- RPC `create_notification(uuid,text,text,text,text,text,text,jsonb)`
  verificado no remoto com `security_definer=false`, `anon_execute=false`,
  `authenticated_execute=true` e `service_role_execute=true`;
- `NotificationService.createNotification` bloqueia criacao cross-user no
  browser antes de chamar o RPC;
- `public.notifications` e `public.notification_preferences` verificadas no
  remoto sem grants para `anon` e sem grants amplos de
  `authenticated`; `INSERT`/`UPDATE` ficam restritos por coluna;
- policies RLS dessas duas tabelas foram separadas por operacao, com
  ownership por `(select auth.uid()) = user_id` e policy especifica para
  `service_role`;
- simulacao SQL de usuario autenticado tentando criar notificacao para outro
  `user_id` foi bloqueada antes de qualquer insert;
- advisor remoto depois desse lote: 66 achados totais, 3
  `anon_security_definer_function_executable`, 57
  `authenticated_security_definer_function_executable`, sem match de
  `create_notification`.
- Edge Function `community-notifications-rpc` criada e implantada no projeto
  remoto com `verify_jwt=true`;
- broker de comunidade valida ownership do `actorProfileId`, confirma eventos
  reais em `post_likes_new`, `posts` e `comments`, resolve destinatarios no
  servidor e nao aceita `user_id` de destinatario vindo do browser;
- `CommunityNotificationBrokerService`, `posts.mutations` e
  `communityBusinessLogic` passaram a usar o broker para curtidas/mencoes e
  caminhos preparados de comentarios/respostas;
- smoke remoto sem JWT de usuario para `community-notifications-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- teste `tests/security/community-notification-broker-security.test.ts`
  cobre config, validacoes do broker e ausencia de criacao cross-user direta
  nos fluxos de comunidade.
- Edge Function `professional-notifications-rpc` criada e implantada no projeto
  remoto com `verify_jwt=true`;
- broker profissional valida `messageId`/`quoteId`, `sender_user_id`,
  `professional_user_id`, ownership do profissional e participacao no lead
  antes de criar notificacao para terceiro;
- `ProfessionalLeadService` nao chama mais
  `NotificationService.createNotification` para notificacoes cross-user de
  leads;
- trigger `create_professional_lead_created_event()` verificado no remoto com
  `security_definer=true`, `search_path=public, pg_temp`,
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `professional-notifications-rpc`
  retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto permaneceu em 66 achados totais, com 3
  `anon_security_definer_function_executable` e 57
  `authenticated_security_definer_function_executable`, sem match para
  `create_professional_lead_created_event`.
- Edge Function `session-rpc` criada e implantada no projeto remoto com
  `verify_jwt=true`;
- broker de sessao deriva `p_user_id` do JWT validado e nao aceita id de
  usuario vindo do browser para `get_active_profile`,
  `switch_active_profile` ou `check_user_mfa_required`;
- `SessionService`, `ProfileService`, `profile.queries` e `MFAService` passaram
  a usar `SessionRpcService` em vez de chamar os RPCs diretamente;
- os tres RPCs foram verificados no remoto com `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `session-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto caiu para 63 achados totais, com 3
  `anon_security_definer_function_executable` e 54
  `authenticated_security_definer_function_executable`, sem match para os tres
  RPCs de sessao/perfil/MFA.
- Edge Function `billing-entitlements-rpc` criada e implantada no projeto
  remoto com `verify_jwt=true`;
- broker de billing/entitlements deriva `p_user_id` do JWT validado e nao
  aceita id de usuario vindo do browser para `get_user_active_subscription`,
  `user_has_plan`, `user_has_feature` ou `get_user_entitlement_limit`;
- `SubscriptionService` passou a usar `BillingEntitlementsRpcService` em vez de
  chamar os RPCs diretamente;
- os quatro RPCs foram verificados no remoto com `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `billing-entitlements-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- contagem remota direta caiu para 50
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`, sem match no Advisor para os
  quatro RPCs de billing/entitlements.
- `session-rpc` foi estendido para revogacao de sessao individual e revogacao
  em lote das sessoes do usuario autenticado;
- `SessionService` de auth nao chama mais `revoke_user_session` nem
  `revoke_all_user_sessions` diretamente pelo browser;
- os dois RPCs legados de revogacao foram verificados no remoto com
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `session-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- contagem remota direta caiu para 48
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Edge Function `business-reviews-rpc` criada e implantada no projeto remoto
  com `verify_jwt=true`;
- broker de reviews valida ownership por `profiles.user_id`,
  `profile_members.is_active=true` ou admin canonico, nao aceita `user_id`
  confiavel do browser e valida pedido entregue quando `order_id` existe;
- `ReviewQueryService` nao chama mais diretamente os cinco RPCs de mutacao/check
  de reviews de negocios;
- os cinco RPCs legados foram verificados no remoto com `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `business-reviews-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- contagem remota direta caiu para 43
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Edge Function `privacy-rpc` criada e implantada no projeto remoto com
  `verify_jwt=true`;
- `session-rpc` atualizado no projeto remoto com a action
  `updateSessionActivity`;
- `record_consent` e `update_session_activity` foram verificados no remoto com
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- indice remoto `unique_active_consent` verificado como parcial em
  `revoked_at IS NULL`;
- smoke remoto sem JWT de usuario para `privacy-rpc` e `session-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto oficial caiu para 50 achados totais, 41
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Edge Function `location-rpc` criada e implantada no projeto remoto com
  `verify_jwt=true`;
- `rpc_upsert_canonical_city_by_ibge` foi verificado no remoto com
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `location-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto oficial caiu para 49 achados totais, 40
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Edge Function `mobility-rpc` criada e implantada no projeto remoto com
  `verify_jwt=true`;
- `MobilityAuditService` e `DriverAvailabilityService` deixaram de chamar
  diretamente os RPCs de audit/dispatch/availability pelo browser;
- `log_ride_dispatch_attempt`, `update_latest_ride_dispatch_attempt`,
  `cancel_pending_ride_offers` e `release_driver_availability_for_ride` foram
  verificados no remoto com `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `mobility-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto oficial caiu para 45 achados totais, 36
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Edge Function `delivery-rpc` criada e implantada no projeto remoto com
  `verify_jwt=true`;
- `OrderDeliverySSOTService` deixou de chamar diretamente os RPCs mutantes de
  pedido/entrega pelo browser;
- `delivery_create_order`, `delivery_transition_logistics_status`,
  `delivery_mark_picked_up`, `delivery_attach_delivery_proof`,
  `delivery_mark_delivered`, `delivery_transition_financial_status`,
  `delivery_report_occurrence`, `delivery_resolve_occurrence`,
  `delivery_update_order_notes` e
  `delivery_update_order_source_metadata` foram verificados no remoto com
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `delivery-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto oficial caiu para 35 achados totais, 26
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- `mobility-rpc` foi estendido para o aceite atomico de corrida;
- `MobilityOfferService` deixou de chamar `accept_ride_atomic` diretamente pelo
  browser e passou a usar `MobilityRpcService.acceptRideAtomic`;
- migration `20260707224108_route_mobility_accept_ride_through_edge_function`
  aplicada ao remoto;
- `accept_ride_atomic(uuid, uuid, text)` verificado no remoto com
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- o helper SQL passou a manter validacao de motorista verificado, online,
  disponivel e apto para a estrategia mesmo quando chamado por `service_role`;
- smoke remoto sem JWT de usuario para `mobility-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto oficial caiu para 34 achados totais, 25
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Edge Function `community-rpc` criada e implantada no projeto remoto com
  `verify_jwt=true`;
- `CommunityAlertService`, `CommunityIssueService`, `CommunityQAService`,
  `CommunityEventsRuntimeService` e `AdminEventsService` deixaram de chamar
  diretamente os RPCs privilegiados de comunidade pelo browser;
- migration `20260707225829_route_community_content_rpcs_through_edge_function`
  aplicada ao remoto;
- `create_community_alert` em tres assinaturas, `create_community_issue`,
  `increment_alert_edit_count`, `mark_best_answer`,
  `increment_event_participants` e `decrement_event_participants` verificados
  no remoto com `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- os helpers de criacao preservam residencia verificada e auditoria com usuario
  real via `_actor_user_id` inserido somente pelo broker;
- smoke remoto sem JWT de usuario para `community-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto oficial caiu para 26 achados totais, 17
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Edge Function `profile-rpc` criada e implantada no projeto remoto com
  `verify_jwt=true`;
- `MultiProfileService` e `ProfileMembersService` deixaram de chamar
  diretamente os RPCs privilegiados de perfil pelo browser;
- migration `20260707232826_route_profile_mutation_rpcs_through_edge_function`
  aplicada ao remoto;
- `create_profile_with_extension`, `update_profile_handle`, `delete_profile`,
  `transfer_profile_ownership`, `invite_profile_member_by_email` e os wrappers
  `profile_rpc_*` verificados no remoto com `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `profile-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto oficial caiu para 21 achados totais, 12
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Edge Function `role-rpc` criada e implantada no projeto remoto com
  `verify_jwt=true`;
- `RoleService` deixou de chamar diretamente `has_role`, `get_user_roles`,
  `is_admin` e `is_super_admin` pelo browser;
- migration `20260707234302_route_role_read_helpers_through_edge_function`
  aplicada ao remoto;
- `has_role(uuid, app_role)` e `get_user_roles(uuid)` verificados no remoto com
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`;
- smoke remoto sem JWT de usuario para `role-rpc` retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
- Advisor remoto oficial caiu para 19 achados totais, 10
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- migration `20260708000031_move_rls_authorization_helpers_to_private_schema`
  aplicada ao remoto;
- `auth_can_access_profile`, `can_manage_profile`, `group_can_manage_members`,
  `is_admin`, `is_admin_from_roles`, `is_admin_user` e `is_super_admin`
  verificados no schema `public` com `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`;
- policies remotas verificadas com 116 referencias a `private.*` e zero
  referencias publicas/unqualified aos helpers antigos;
- leituras transacionais como `anon` em `trust_events` e como `authenticated`
  em `orders` executaram sem `permission denied`;
- Advisor remoto oficial caiu para 12 achados totais, 3
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`, todos os seis em
  `st_estimatedextent` do PostGIS.
- follow-up em 2026-07-08 confirmou que os 12 achados restantes nao sao de
  aplicacao/RPC: `spatial_ref_sys`, extensoes em `public`, overloads PostGIS
  `st_estimatedextent` e `auth_leaked_password_protection`;
- preflight remoto para `alter table public.spatial_ref_sys enable row level
  security` falhou com `ERROR: 42501: must be owner of table spatial_ref_sys`;
- `EXC-2026-07-08-POSTGIS-EXTENSION-OWNER` e
  `EXC-2026-07-08-AUTH-HIBP-DASHBOARD` foram abertas para manter os achados
  visiveis, com plano de remocao por plataforma/Auth Settings, sem criar
  migration padrao que ja nao tem ownership suficiente.

## Decisao

O piloto tecnico e suficiente para integrar o gate ao release sem criar script
paralelo solto. A proxima calibragem deve ocorrer em uma migration real de
produto quando houver mudanca legitima de schema ou permissao.

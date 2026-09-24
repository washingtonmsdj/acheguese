# G5 — RLS e grants: auditoria remota de 2026-08-30

## Status

**CLOSED para a superfície application-owned de RLS e grants.**

O fechamento é baseado em inspeção do catálogo vivo do Supabase, hardening mínimo das exposições comprovadas e ratchets no source. Dois resíduos permanecem deliberadamente fora deste fechamento:

1. objetos `postgis` extension-owned em `public`, que exigem estratégia de extensão e não patch de domínio;
2. o CUTOVER final de Community Interest, que continua bloqueado por evidência operacional e permanece fora da fila ativa de migrations.

Nenhum dos dois representa, no estado final deste corte, um bypass application-owned não classificado de RLS/grants.

## 1. Critérios de fechamento

O item foi considerado concluído somente após confirmar no remoto:

- nenhuma tabela application-owned browser-exposed com RLS desligado;
- nenhuma view application-owned browser-readable sem `security_invoker=true` ou com DML browser;
- nenhuma materialized view application-owned exposta ao browser;
- nenhuma relação RLS-without-policy com grants de `anon`/`authenticated`;
- nenhuma policy de escrita literal `true` aplicável a `public`, `anon` ou `authenticated`;
- todo INSERT anônimo application-owned restante classificado por caller, payload e policy;
- campos server/default-owned removidos dos grants de INSERT público quando não pertencem ao caller.

## 2. Relações RLS sem policy

O snapshot final encontrou 17 relações RLS-enabled sem policy.

### `private`

- `private.alpha_access_audit_log`
- `private.alpha_access_control`
- `private.alpha_access_invites`
- `private.community_direct_message_audit_log`
- `private.notification_outbox`

### `public`

- `public.account_deletion_requests`
- `public.analytics_sessions`
- `public.banned_users`
- `public.community_social_audit_log`
- `public.community_user_moderation_actions`
- `public.emergency_delivery_log`
- `public.gastronomy_subscriptions`
- `public.group_message_reactions`
- `public.review_helpfulness`
- `public.trust_admin_actions`
- `public.trust_events`
- `public.user_active_profiles`

Para as 17 relações, a contagem final de relações com grants browser foi **0**.

Classificação: **FAIL-CLOSED**. Não criar policy artificial apenas para eliminar `rls_enabled_no_policy`.

A provenance individual dessas relações foi consolidada em `G5_FAIL_CLOSED_RELATION_PROVENANCE_2026-08-30.md`.

## 3. Tabelas, views e materialized views application-owned

Snapshot final:

- tabelas application-owned browser-exposed sem RLS: **0**;
- views browser-readable sem `security_invoker=true` ou com write grant: **0**;
- materialized views application-owned expostas ao browser: **0**.

O hardening de views inclui, entre outros cortes G5, `territory_aliases` read-only e a consolidação das application views como projections sem DML browser.

## 4. Policies de escrita literal `true`

Foram encontradas 12 policies com `true` literal em comandos de escrita, mas todas são exclusivamente `service_role`:

- `ad_campaign_admin_actions_service_role_all`
- `api_cache_service_role_all`
- `billing_plans_admin_all`
- `business_subscriptions_service_role_all`
- `Service role full access` em `driver_availability`
- `notification_preferences_service_manage`
- `notifications_service_manage`
- `Service role inserts pii logs`
- `Service role can insert audit log`
- `Service role has full access to ride_offers`
- `subscription_plans_admin_all`
- `Edge functions insert consents`

Policies de escrita literal `true` aplicáveis a `public`, `anon` ou `authenticated`: **0**.

Classificação: **server-only intencional**, sem hardening adicional.

## 5. INSERT anônimo application-owned: estado final

Após grants por coluna e hardening de policy, restam quatro superfícies application-owned com INSERT anônimo deliberado.

### 5.1 `community_interest_registrations`

Estado: **ADDITIVE compatibility temporária**, com broker `register-community-interest` como target authority.

A janela legada ainda aceita somente os campos públicos de inscrição:

- `community_id`
- `community_slug`
- `territory_path`
- `full_name`
- `email`
- `phone`
- `role`
- `message`
- `wants_updates`
- `source`
- `user_agent`

`turnstile_verified` foi removido dos grants de INSERT de `anon` e `authenticated`, e a policy legada exige `turnstile_verified = false`.

Consequência: browser legado não pode mais forjar provenance de Turnstile. A flag `true` permanece pertencente ao broker/service role.

O CUTOVER final permanece em `docs/09-reference/migrations-pending/20260810152014_finalize_community_interest_cutover.sql` até existir toda a evidência operacional exigida. Não promover apenas para fechar G5.

### 5.2 `education_analytics_events`

O runtime grava diretamente pelo `EducationTrackingService`.

O browser pode inserir apenas:

- `education_profile_id`
- `business_id`
- `niche_key`
- `event_type`
- `program_id`
- `education_event_id`
- `lead_id`
- `source_page`
- `session_id`
- `metadata`

`id` e `created_at` permanecem server/default-owned.

A policy agora valida no banco:

- `niche_key` contra o `education_profile`;
- `business_id` contra o business do profile;
- `program_id`, `education_event_id` e `lead_id` contra o mesmo `education_profile_id`;
- envelope de metadata limitado.

### 5.3 `professional_leads`

O SSOT de persistence permanece `ProfessionalLeadService`.

O fluxo anônimo foi corrigido para INSERT sem `RETURNING`, porque `anon` não possui SELECT da linha criada. Smoke transacional com rollback confirmou que o INSERT anônimo legítimo passa.

Grants foram separados por role:

- `anon` não pode inserir `requester_user_id`, `requester_profile_id`, `status`, timestamps ou outros campos server-owned;
- `authenticated` pode informar os campos de identidade somente sob policy que exige `requester_user_id = auth.uid()` e `requester_profile_id` nulo ou igual ao profile ativo canônico.

A policy também exige profissional aceitando clientes, status inicial `new` e limites de payload no banco.

### 5.4 `qr_code_scans`

O SSOT continua `QrCodeService.recordScan`.

O browser pode inserir apenas campos de telemetry do scan. `id` e `scanned_at` são server/default-owned.

A policy exige QR ativo e limita tamanho de:

- `resolved_url`;
- `user_agent`;
- `referrer`;
- `approximate_location`;
- `ip_hash`.

## 6. Community Interest: cutover continua bloqueado

Este fechamento de RLS/grants **não promove** o migration staged de Community Interest.

Ainda faltam provas operacionais independentes exigidas pelo preflight/cutover, incluindo a configuração de secret Turnstile, allowed origins e frontend broker publicado/smoke completo.

A decisão permanece fail-closed: manter compatibilidade mínima e endurecida até a evidência existir.

## 7. PostGIS extension-owned residual

`public.spatial_ref_sys`, `public.geometry_columns` e `public.geography_columns` são membros da extensão `postgis`.

O catálogo ainda registra grants amplos de browser nesses objetos. Eles não pertencem ao domínio da aplicação e não devem ser alterados como tabelas/views comuns de produto.

Classificação: **EXTENSION-OWNED RESIDUAL**.

O Advisor também mantém a questão arquitetural de extensões instaladas em `public` (`postgis`, `unaccent`, `pg_trgm`, `citext`). O tratamento futuro deve ser compatível com a extensão e não uma revogação estrutural cega.

## 8. Migrations G5 diretamente relacionadas ao fechamento

Entre os cortes finais deste item:

- `20260830073045_lock_dormant_business_views_write_surface.sql`
- `20260830073341_revoke_inert_browser_dml_grants_g5.sql`
- `20260830073545_lock_classified_reports_to_rpc_authority.sql`
- `20260830080037_harden_public_insert_payload_contracts_g5.sql`
- `20260830080145_fix_professional_lead_public_insert_role_split_g5.sql`
- `20260830080454_lock_community_interest_legacy_verification_flag_g5.sql`

Esses migrations preservam autoridades existentes; não criam um segundo executor ou uma segunda fonte de verdade.

## 9. Ratchets

O fechamento é protegido por testes de source/migration, incluindo:

- `tests/security/browser-table-grants-security.test.ts`
- `tests/security/application-view-readonly-authority.test.ts`
- `tests/security/public-insert-payload-contracts-security.test.ts`
- `tests/security/community-interest-compatibility-window.test.ts`
- `tests/security/sensitive-report-commands-security.test.ts`
- `tests/security/public-view-tracking-security.test.ts`

Não afirmar CI PASS sem workflow same-SHA observável; estes ratchets estão versionados, mas a execução de CI deve ser tratada separadamente.

## 10. Decisão final

**G5 / `RLS e grants` = CLOSED.**

`do_not_repeat`:

- não criar policies artificiais nas 17 relações fail-closed;
- não reabrir `business_views` para INSERT browser;
- não restaurar DML browser em tabelas server-authoritative;
- não restaurar INSERT direto em `classified_reports`;
- não devolver `turnstile_verified` à compatibilidade browser de Community Interest;
- não alterar objetos PostGIS extension-owned como se fossem schema de produto;
- não promover o Community Interest CUTOVER sem a evidência operacional exigida.

Auditoria remota revalidada em **2026-08-30** contra o projeto Supabase conectado do Achegue-se.

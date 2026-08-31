# G5 — RLS performance + driver location hardening — 2026-08-31

Status: **source + banco vivo reconciliados neste corte; G5 continua EM EXECUÇÃO**.

Este checkpoint registra findings application-owned descobertos por inspeção do catálogo vivo. Ele não reabre os blockers externos já conhecidos de G5.

## 1. RLS auth helpers: InitPlan residual fechado

O catálogo vivo foi varrido por policies de `public`/`private` que ainda chamavam `auth.uid()`, `auth.role()` ou `auth.jwt()` diretamente em `USING`/`WITH CHECK`.

Antes do reparo havia exatamente dois resíduos:

- `public.professional_leads.professional_leads_authenticated_insert` — `requester_user_id = auth.uid()`;
- `public.analytics_daily_metrics.analytics_daily_metrics_authorized_select` — `private.is_admin(auth.uid())`.

As policies mantiveram exatamente a mesma autoridade, roles, helpers e predicates; apenas as chamadas foram normalizadas para `(SELECT auth.uid())`, permitindo avaliação como InitPlan.

Migration remota/source:

- ledger: `20260831032111_optimize_remaining_auth_rls_initplans_g5`;
- source: `supabase/migrations/20260831032111_optimize_remaining_auth_rls_initplans_g5.sql`;
- source commit: `7740f949d51260623258d435de94d0fda6d11bed`;
- ratchet: `tests/security/rls-auth-initplan-ratchet.test.ts`, commit `7f14425a72956ff040e9ed1faeed750b9538c8a4`.

Postcondition viva: **0 policies** em `public`/`private` permanecem com `auth.uid()/role()/jwt()` fora da forma InitPlan.

## 2. `locations`: policy SELECT admin redundante retirada

O catálogo vivo mostrava simultaneamente:

- `Admins can manage locations` — `FOR ALL TO authenticated`, predicate `private.is_admin((SELECT auth.uid()))`;
- `Admins can view all locations` — `FOR SELECT TO authenticated`, o mesmo predicate;
- `Locations ativas visíveis publicamente` — `FOR SELECT TO public`, `status = 'active'`.

Como `ALL` já cobre SELECT e usa o mesmo `USING`, a policy específica de SELECT não ampliava autorização. Ela apenas adicionava uma segunda avaliação idêntica para reads autenticados.

Prova before, usuário autenticado não-admin, read ordenado de 200 locations ativas:

- 2 InitPlans;
- filtro continha duas chamadas `private.is_admin(...)`;
- planning cost até o `Limit`: ~`133.24`;
- execution: ~`73.27 ms`.

Após retirar somente `Admins can view all locations`:

- 1 InitPlan;
- uma única chamada `private.is_admin(...)`;
- planning cost até o `Limit`: ~`83.19`;
- execution: ~`27.56 ms`.

A policy `ALL` admin e a policy pública de locations ativas foram preservadas por pre/postconditions.

Migration remota/source:

- ledger: `20260831032411_remove_redundant_locations_admin_select_policy_g5`;
- source: `supabase/migrations/20260831032411_remove_redundant_locations_admin_select_policy_g5.sql`;
- source commit: `3fcd0aea00475de592faf0574f32dc3703b0170d`.

## 3. `driver_locations`: bypass de write da policy `ALL` legada fechado

A migration inicial de Mobility deixou a policy:

- `Drivers manage own location` — `FOR ALL TO authenticated`;
- predicate: qualquer `driver_profile_id` pertencente a um profile do usuário;
- sem exigir `profiles.profile_type = 'driver'`.

Depois, o hardening moderno instalou:

- `driver_locations_authorized_read` para SELECT canônico;
- `driver_locations_insert_policy`, `driver_locations_update_policy` e `driver_locations_delete_policy`, todas exigindo `profile_type = 'driver'` para write.

Como policies permissivas são combinadas por OR, a policy `ALL` antiga anulava na prática o requisito driver-only das policies novas.

### Prova funcional antes

Em transação rollback-only, um usuário autenticado com profile `personal` conseguiu inserir uma linha em `driver_locations` usando o próprio profile não-driver. A operação foi revertida imediatamente e não deixou dado.

### Estado de dados antes da retirada

- `driver_locations`: 1 row;
- 0 rows sem profile;
- 0 rows ligadas a profile não-driver;
- profile type observado: `driver`.

### Prova funcional depois

A mesma tentativa com profile `personal` passou a falhar com:

`42501: new row violates row-level security policy for table "driver_locations"`

Em teste rollback-only separado, o driver legítimo existente continuou conseguindo atualizar sua própria row normalmente.

Migration remota/source:

- ledger: `20260831032646_remove_driver_locations_legacy_all_bypass_g5`;
- source: `supabase/migrations/20260831032646_remove_driver_locations_legacy_all_bypass_g5.sql`;
- source commit: `5d02f03548c9d7cd917a1d029f2887c121a592b8`;
- ratchet atualizado: `tests/security/rls-sensitive-policy-regression.test.ts`, commit `55b7e6f2315ef9a9d7dafd2dc8751efa8124c9ed`.

## 4. SELECT admin shadows redundantes: lote application-owned fechado

Depois de `locations`, o catálogo vivo confirmou mais seis pares exatos em que uma policy admin `FOR ALL` e outra admin `FOR SELECT` tinham a mesma role, o mesmo modo permissivo e o mesmo predicate `private.is_admin((SELECT auth.uid()))`.

Foram removidas **somente** as policies SELECT redundantes; as policies `ALL` de administração e todas as policies de participantes/owners permaneceram intactas.

Reparos forward-only:

- `ride_requests` — ledger `20260831033007_remove_redundant_ride_requests_admin_select_g5`, source commit `6953a0753ca780c5296b1e4a6e2bc0325f09eeb2`;
- `orders` — ledger `20260831033245_remove_redundant_orders_admin_select_g5`, source commit `b277e5fb7b560bdc9c540fff035eb21e49420de5`;
- `classifieds` — ledger `20260831033505_remove_redundant_classifieds_admin_select_g5`, source commit `9d8e85de94b75bd509832144a365c1f74019acd0`;
- `events` — ledger `20260831033520_remove_redundant_events_admin_select_g5`, source commit `30452b04dfaac61c99c01d2be1c940ea2d390a39`;
- `community_posts` — ledger `20260831033534_remove_redundant_community_posts_admin_select_g5`, source commit `26e926ade7b735f1ffc456f9d2e363dcebe684d3`;
- `professional_jobs` — ledger `20260831033547_remove_redundant_professional_jobs_admin_select_g5`, source commit `b7bfa943a5eac581acda4fd903e4b85b96761ecc`.

Prova de custo em reads autenticados não-admin:

- `ride_requests`: 2 avaliações admin antes, 1 depois; execution ~`23.04 ms` → ~`18.57 ms`;
- `orders`: 2 avaliações admin antes, 1 depois; execution ~`113.61 ms` → ~`76.38 ms`.

Postcondition de catálogo: **0 pares exatos admin `ALL` + admin `SELECT` com o mesmo predicate `private.is_admin(...)`** permanecem nesse conjunto.

Ratchet:

- `tests/security/redundant-admin-select-shadow-ratchet.test.ts`;
- commit `6b11470b6f75fd6620d7df2c775141102c9631a6`;
- impede recriação dos shadows removidos em `locations`, `ride_requests`, `orders`, `classifieds`, `events`, `community_posts` e `professional_jobs`.

Shadows não-admin de baixo impacto em tabelas vazias (`work_opportunities`, `profile_links`, `question_answer_likes`) foram deliberadamente deixados sem migration: não há evidência de risco/performance que justifique gerar churn enquanto o Types Sync automático continua bloqueado por infraestrutura.

## 5. Foreign keys sem índice: triagem viva sem mudança

O Supabase Performance Advisor lista várias FKs sem índice de cobertura. O finding foi cruzado com `pg_stat_user_tables`, nulabilidade real das colunas e `pg_stat_statements` antes de qualquer decisão.

Principais candidatos por atividade histórica de tabela:

- `profile_members.invited_by`: 156 rows, **0 valores não-nulos**;
- `user_roles.revoked_by`: 232 rows, **0 valores não-nulos**;
- `ride_requests.route_id`: 8 rows, **0 valores não-nulos**;
- `addresses.verified_by`: 95 rows, **0 valores não-nulos**;
- `posts.removed_by`: 10 rows, **0 valores não-nulos**;
- `professional_data.updated_by_user_id`: 5 rows, **0 valores não-nulos**;
- `media_assets.owner_user_id`: 51 rows, 51 não-nulos / 4 owners distintos.

A inspeção de `pg_stat_statements` não encontrou workload de runtime filtrando por `ride_requests.route_id`, `profile_members.invited_by` ou `user_roles.revoked_by`. Para `media_assets.owner_user_id`, as ocorrências observadas eram export/DDL/policy maintenance; não apareceu query de runtime cujo gargalo justificasse um índice dedicado nesse tamanho atual.

Decisão G5: **não criar índices de FK apenas para silenciar advisor**. Reavaliar quando houver coluna efetivamente populada, crescimento material da tabela ou plano/query real mostrando custo relevante.

Também não serão removidos índices marcados como `unused_index` apenas por advisor; estatísticas podem refletir janela curta/reset e vários índices são parte de constraints, segurança ou caminhos que ainda não tiveram tráfego representativo.

## 6. Do not repeat

- não recriar os SELECT admin shadows cobertos pelo ratchet enquanto a policy `ALL` equivalente continuar sendo a autoridade canônica;
- não recriar `Drivers manage own location`; write de localização deve continuar driver-only;
- não substituir `(SELECT auth.uid()/role()/jwt())` por avaliação direta em novas policies;
- não criar/drop de índices em massa apenas para reduzir contagem de advisors; exigir workload/plano/dados que provem benefício;
- não reescrever as migrations históricas que originaram os resíduos; os reparos são forward-only;
- não interpretar failures de GitHub Actions sem steps/logs como regressão dessas migrations;
- não iniciar G6 enquanto os blockers centrais de G5 permanecerem abertos.

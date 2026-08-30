# G5 — RLS e grants: auditoria remota de 2026-08-30

## Escopo

Este documento registra um corte verificável da fase G5 sobre o projeto Supabase de produção, sem alterar schema, policies ou grants por heurística.

Objetivos deste corte:

- separar alertas do linter de exposições efetivas;
- verificar o comportamento fail-closed de tabelas com RLS sem policy;
- classificar o alerta de `public.spatial_ref_sys` com provenance de extensão;
- amostrar RPCs `SECURITY DEFINER` administrativas antes de qualquer revogação;
- preservar os itens ainda não auditados como pendentes.

## 1. Tabelas com RLS habilitado e zero policies

A consulta remota encontrou 17 relações com RLS habilitado e nenhuma policy:

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
- `public.delivery_requests`
- `public.emergency_delivery_log`
- `public.group_message_reactions`
- `public.review_helpfulness`
- `public.trust_admin_actions`
- `public.trust_events`
- `public.user_active_profiles`

Para todas as 17 relações, o estado remoto observado foi:

- `anon`: sem `SELECT`, `INSERT`, `UPDATE` e `DELETE`;
- `authenticated`: sem `SELECT`, `INSERT`, `UPDATE` e `DELETE`.

### Classificação

**FAIL-CLOSED / não corrigir com policy artificial neste corte.**

O lint `rls_enabled_no_policy` é informativo e não prova exposição. Com os grants acima revogados, adicionar policies apenas para eliminar o aviso poderia aumentar superfície de acesso ou duplicar autoridade já concentrada em RPCs/gateways privilegiados.

Isso não encerra provenance/callers dessas tabelas. G5 ainda deve confirmar, uma a uma, quais são ativas, service-role-only, internas, dormentes ou legadas.

Referência do linter: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## 2. `public.spatial_ref_sys`

O Advisor reporta `rls_disabled_in_public` para `public.spatial_ref_sys`.

A inspeção remota confirmou:

- owner: `supabase_admin`;
- membro da extensão `postgis`: **sim**;
- RLS: desabilitado;
- `anon` e `authenticated`: possuem grants amplos herdados/registrados sobre a relação, inclusive leitura e escrita.

### Classificação

**EXTENSION-OWNED / requer tratamento de extensão, não alteração cega da tabela.**

`spatial_ref_sys` não é uma tabela de domínio do Achegue-se. Alterar RLS, ownership ou estrutura diretamente pode conflitar com o PostGIS. O erro do Advisor permanece residual até que a estratégia de exposição das extensões em `public` seja reconciliada de modo suportado.

O mesmo Advisor também aponta as extensões `postgis`, `unaccent`, `pg_trgm` e `citext` instaladas em `public`; portanto a decisão correta é arquitetural para extensões, não um patch isolado em `spatial_ref_sys`.

Referências do linter:

- https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public
- https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

## 3. RPCs `SECURITY DEFINER`: amostra administrativa

O Advisor sinaliza funções `SECURITY DEFINER` executáveis por `authenticated`. Isso exige inspeção da autorização interna antes de revogar `EXECUTE`, porque várias delas são gateways intencionais para operações protegidas por tabelas fail-closed.

Foram inspecionadas diretamente no remoto:

- `apply_trust_admin_actions(uuid[], text, text, text, integer)`
  - exige `auth.uid()`;
  - exige profile ativo;
  - exige `private.is_admin_user(auth.uid())`;
  - possui `search_path` explícito e `statement_timeout`.

- `list_trust_events_admin(...)`
  - exige autenticação + `private.is_admin_user(auth.uid())`;
  - limita paginação e valida cursor;
  - possui `search_path` explícito e `statement_timeout`.

- `list_trust_admin_actions_admin(...)`
  - exige autenticação + `private.is_admin_user(auth.uid())`;
  - limita paginação e valida cursor;
  - possui `search_path` explícito e `statement_timeout`.

- `review_trust_events_admin(...)`
  - exige autenticação + admin + profile ativo;
  - limita batch e valida payload;
  - possui `search_path` explícito e `statement_timeout`.

- `get_review_aggregates_admin(uuid[], text)`
  - exige autenticação + `private.is_admin_user(auth.uid())`;
  - valida tipo e limite de batch;
  - possui `search_path` explícito e `statement_timeout`.

- `create_notification(...)`
  - para chamadas fora de `service_role`, exige autenticação;
  - impede `p_user_id` diferente de `auth.uid()`;
  - valida payload e URL;
  - possui `search_path` explícito.

### Classificação do corte

**Os avisos acima não representam, por si só, bypass de autorização.**

Não revogar `EXECUTE` genericamente: isso quebraria gateways intencionais enquanto as tabelas subjacentes permanecem sem grants para browser. Cada RPC restante deve ser classificada por caller, role permitida, checks internos, `search_path`, ownership e necessidade de `SECURITY DEFINER`.

Referência do linter: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## 4. RPCs anônimas já governadas por allowlist no source

O source mantém `tests/security/anonymous-security-definer-allowlist.test.ts`, cuja allowlist explícita registra como intencionais, no baseline auditado:

- `public.get_community_poll_for_post(uuid)`
- `public.get_professional_trust_reputation(uuid)`
- `public.get_ride_rating_summary(uuid)`
- `public.get_shared_ride_safety_data(text)`
- `public.profile_public_territory_projection(uuid)`
- `public.track_analytics_event(...)`

O teste também separa funções PostGIS extension-owned dessa allowlist de aplicação e bloqueia novos grants anônimos fora da lista após o baseline.

### Estado

**PROVENANCE EXISTENTE, mas ainda requer validação funcional/contratual individual em G5/G6/G7.**

O fato de uma função estar allowlisted significa que a exposição é intencional no baseline; não significa que ela esteja automaticamente certificada para MVP.

## 5. Decisões deste corte

1. Não criar policies artificiais nas 17 tabelas fail-closed apenas para silenciar `rls_enabled_no_policy`.
2. Não alterar diretamente `public.spatial_ref_sys`; tratar junto da estratégia das extensões atualmente instaladas em `public`.
3. Não revogar em massa `EXECUTE` de RPCs `SECURITY DEFINER`; auditar authority/callers e checks internos por família.
4. Manter a allowlist anônima como ratchet explícito, sem ampliá-la por conveniência.
5. Continuar G5; este documento **não** marca o item global `RLS e grants` como concluído.

## 6. Próximo corte G5

Prioridade imediata:

1. inventariar todas as funções `SECURITY DEFINER` application-owned por role (`anon`, `authenticated`, `service_role`);
2. separar gateways intencionais de grants excessivos/legados;
3. cruzar cada função com callers no source e migrations de origem;
4. auditar tabelas sem policy quanto a callers/provenance, não apenas grants;
5. consolidar residuals extension-owned em uma política explícita para PostGIS/extensões;
6. só então produzir migrations mínimas e fail-closed para exposições comprovadamente indevidas.

## Evidência temporal

Auditoria remota executada em **2026-08-30** contra o projeto Supabase conectado do Achegue-se. O estado descrito aqui é um snapshot e deve ser revalidado se houver DDL posterior.

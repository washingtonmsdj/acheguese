# G5 — Inventário de `SECURITY DEFINER` e grants — 2026-08-30

## Escopo

Este corte continua a fase G5 a partir de `G5_RLS_GRANTS_AUDIT_2026-08-30.md` e executa a prioridade de inventariar funções `SECURITY DEFINER` application-owned no schema `public` por role antes de qualquer revogação.

A regra permanece fail-closed e provenance-first: alerta de Advisor não autoriza `REVOKE` por heurística. O objetivo é distinguir gateways intencionais, funções trigger-only e grants excessivos comprovados.

## Snapshot remoto

Consulta executada em 2026-08-30 contra o projeto Supabase conectado do Achegue-se, excluindo funções pertencentes a extensões por `pg_depend`/`pg_extension`.

| métrica | quantidade |
| --- | ---: |
| `SECURITY DEFINER` application-owned em `public` | 241 |
| executáveis por `anon` | 6 |
| executáveis por `authenticated` | 68 |
| executáveis por `service_role` | 235 |
| `authenticated` sem sinal óbvio de authority/delegação na triagem ampla | 0 |

A triagem ampla marcou como sinais de authority/delegação referências a autenticação (`auth.uid()`), checks administrativos, active-profile ownership, delegação para helpers `private.*` ou tratamento explícito de `service_role`. O resultado zero não certifica funcionalmente as 68 funções, mas elimina a hipótese de existir uma classe óbvia de `SECURITY DEFINER` browser-exposed totalmente sem boundary interno.

## Allowlist anônima

As seis funções application-owned executáveis por `anon` coincidem com a allowlist já congelada por `tests/security/anonymous-security-definer-allowlist.test.ts`:

- `get_community_poll_for_post(uuid)`;
- `get_professional_trust_reputation(uuid)`;
- `get_ride_rating_summary(uuid)`;
- `get_shared_ride_safety_data(text)`;
- `profile_public_territory_projection(uuid)`;
- `track_analytics_event(...)`.

Não foi observada expansão da superfície anônima neste snapshot.

## Funções sem grant para `service_role`

A diferença entre 241 application-owned e 235 executáveis por `service_role` foi inspecionada individualmente. São seis funções:

### `audit_user_subscription_changes()`

- ACL remota: somente owner (`postgres`);
- tipo: trigger function;
- `search_path` explícito;
- provenance em migrations de Billing;
- não é endpoint RPC para browser.

**Classificação: TRIGGER-ONLY / sem necessidade de grant direto para `service_role`.**

### `cast_community_poll_vote(uuid, uuid, uuid)`

- ACL remota: `authenticated`;
- exige `auth.uid()`;
- exige ownership do active profile via `private.auth_owns_active_profile(...)`;
- `SET search_path = ''`;
- caller/authority congelados em `tests/security/community-poll-authority-security.test.ts`.

**Classificação: AUTHENTICATED COMMAND / least-privilege intencional.**

### `create_post_with_poll(jsonb)`

- ACL remota: `authenticated`;
- exige `auth.uid()` e valida payload/ownership no command;
- `SET search_path = ''`;
- o teste de autoridade exige explicitamente grant somente para `authenticated`.

**Classificação: AUTHENTICATED COMMAND / least-privilege intencional.**

### `get_community_poll_for_post(uuid)`

- ACL remota: `anon`, `authenticated`;
- pertence à allowlist anônima governada;
- limita leitura a Post público visível ou contexto owner/admin;
- `SET search_path = ''`;
- o teste de autoridade congela a exposição `anon + authenticated`.

**Classificação: PUBLIC READ GATEWAY / exposição intencional e fail-closed por visibilidade.**

### `has_current_active_ban()`

- ACL remota: `authenticated`;
- exige `auth.uid()`;
- lê apenas o ban ativo do próprio usuário autenticado;
- `search_path` e `statement_timeout` explícitos;
- caller ativo em `src/core/trust/services/ActiveBanReader.ts`.

**Classificação: AUTHENTICATED SELF-READ GATEWAY / least-privilege intencional.**

### `list_community_social_audit_events(...)`

- ACL remota: `authenticated`;
- exige `auth.uid()` e `private.is_admin_user(auth.uid())`;
- `search_path` e `statement_timeout` explícitos;
- authority congelada por `tests/security/admin-definer-authority-security.test.ts` e owner documentado em `AUDIT_MODERATION_SSOT.md`.

**Classificação: AUTHENTICATED ADMIN GATEWAY / least-privilege intencional.**

## Decisão

Nenhum grant foi alterado neste corte.

A ausência de `service_role` nas seis funções acima não é, por si só, drift: quatro são gateways deliberadamente limitados ao ator browser autenticado/público, uma é trigger-only e uma é leitura administrativa autenticada. Conceder `service_role` genericamente aumentaria ACL sem necessidade provada; revogar `authenticated`/`anon` quebraria contracts explicitamente governados.

Também não há evidência neste inventário que justifique `REVOKE EXECUTE` em massa das 68 funções acessíveis a `authenticated`.

## Estado G5 após este corte

- inventário global de `SECURITY DEFINER` por role: **executado neste snapshot**;
- allowlist `anon`: **sem expansão observada**;
- exceções sem `service_role`: **classificadas**;
- revogação em massa: **rejeitada por ausência de evidência**;
- validação funcional/caller por família: **continua**;
- `RLS e grants` global: **ainda aberto**;
- `funções/RPCs e authority` global: **ainda aberto**.

## Próximo corte seguro

1. continuar a provenance das relações `rls_enabled_no_policy` remanescentes e separar ACTIVE/SERVER-OWNED de LEGACY/ORPHAN;
2. cruzar RPCs restantes com caller atual e owner canônico, priorizando nomes já marcados deprecated/dormant;
3. consolidar o residual extension-owned (`postgis`/`spatial_ref_sys`) sem alterar diretamente objetos da extensão;
4. só produzir migration quando houver exposição indevida ou objeto legado comprovado por provenance.

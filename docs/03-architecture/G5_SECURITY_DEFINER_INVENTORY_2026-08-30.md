# G5 — `SECURITY DEFINER`, RPCs e authority — 2026-08-30

## Status

`funções/RPCs e authority`: **CLOSED** no snapshot auditado em 2026-08-30.

Este fechamento cobre a superfície application-owned de funções privilegiadas, grants de execução, boundaries internos de autorização e provenance dos principais gateways browser/server. Ele não certifica CI hosted, não substitui testes same-SHA de G7 e não autoriza revogações em objetos pertencentes a extensões.

## 1. Snapshot remoto final

A fotografia foi refeita diretamente no projeto Supabase conectado, excluindo funções extension-owned por `pg_depend` / `pg_extension`.

| métrica | quantidade |
| --- | ---: |
| `SECURITY DEFINER` application-owned em `public` | 239 |
| executáveis por `anon` | 6 |
| executáveis por `authenticated` | 68 |
| executáveis por `service_role` | 212 |
| `EXECUTE` efetivo concedido a `PUBLIC` | 0 |

### Correção do inventário inicial

O primeiro inventário desta mesma data registrou 241 definers application-owned e 235 executáveis por `service_role`. Esses números eram válidos naquele corte intermediário, mas ficaram desatualizados depois das migrations G5 que retiraram helpers órfãos e execução direta de trigger functions.

**O snapshot acima (239 / 6 / 68 / 212 / 0) é a fotografia de fechamento deste item.**

## 2. Superfície anônima

As seis funções application-owned executáveis por `anon` permanecem exatamente na allowlist governada por `tests/security/anonymous-security-definer-allowlist.test.ts`:

- `get_community_poll_for_post(uuid)`;
- `get_professional_trust_reputation(uuid)`;
- `get_ride_rating_summary(uuid)`;
- `get_shared_ride_safety_data(text)`;
- `profile_public_territory_projection(uuid)`;
- `track_analytics_event(...)`.

O ratchet também impede `GRANT EXECUTE ... TO PUBLIC` e novas expansões anônimas fora da allowlist auditada.

**Classificação: superfície pública deliberada e governada; sem expansão observada.**

## 3. Funções sem `service_role`

No snapshot final existem 27 definers application-owned sem `EXECUTE` para `service_role`.

### 3.1 Trigger-only — 22 funções

Vinte e duas são trigger functions sem necessidade de RPC direto. Entre elas:

- `audit_education_lead_status_change()`;
- `audit_user_subscription_changes()`;
- `create_professional_lead_created_event()`;
- `enforce_pizza_menu_item_business_consistency()`;
- `fn_record_profile_username_history()`;
- `handle_new_user()`;
- `initialize_notification_preferences()`;
- `initialize_user_free_subscription()`;
- `initialize_user_mfa_status()`;
- `log_role_change()`;
- `log_slug_change()`;
- `record_signup_terms_acceptance()`;
- `sync_event_review_helpful_count()`;
- `sync_gastronomy_plan_tier()`;
- `sync_question_answer_likes_count()`;
- `sync_question_answers_count()`;
- `sync_vaga_application_count()`;
- `trigger_start_dispatch()`;
- `update_business_favorites_count()`;
- `update_business_recommendations_count()`;
- `update_review_helpfulness_counts()`;
- `validate_profile_link_same_account()`.

A ausência de grant para `service_role` é least-privilege coerente: essas funções são invocadas pelo mecanismo de trigger, não por caller RPC.

### 3.2 Gateways deliberados — 5 funções

As cinco restantes são endpoints cuja ACL limitada é intencional:

- `create_post_with_poll(jsonb)` — command autenticado com payload/ownership governados;
- `cast_community_poll_vote(uuid, uuid, uuid)` — command autenticado com active-profile ownership;
- `get_community_poll_for_post(uuid)` — read público de Poll visível;
- `has_current_active_ban()` — self-read estrito de `auth.uid()`;
- `list_community_social_audit_events(...)` — reader administrativo autenticado com admin guard.

Conceder `service_role` genericamente a essas funções não resolve nenhum problema provado e aumentaria ACL sem necessidade.

## 4. Revisão das 68 funções acessíveis a `authenticated`

A triagem ampla foi repetida por sinais de boundary interno: `auth.uid()`, `auth.role()`, active-profile derivation, helpers `private.*`, ownership explícito ou branch `service_role`.

Somente **quatro** funções autenticadas não possuem esses sinais textuais porque são, por desenho, projeções públicas:

- `get_professional_trust_reputation(uuid)`;
- `get_ride_rating_summary(uuid)`;
- `get_shared_ride_safety_data(text)`;
- `profile_public_territory_projection(uuid)`.

As quatro já pertencem à allowlist anônima. Portanto, não representam gateways autenticados sem boundary; são reads públicos deliberados.

Não permaneceu classe conhecida de `SECURITY DEFINER` browser-exposed totalmente sem authority boundary ou contrato público explícito.

## 5. Famílias de maior risco revisadas manualmente

Além da triagem textual, os writers/readers mais sensíveis foram inspecionados por definição remota.

### Notifications

`create_notification(...)`:

- para browser, exige autenticação;
- `p_user_id` precisa ser igual a `auth.uid()`;
- cross-user fica reservado ao `service_role`;
- valida payload, prioridade, URL, metadata e dedupe.

**Sem BOLA cross-user observada.**

### Community observability

`get_community_rpc_operational_metrics(...)` e `get_community_rpc_slo_status(...)`:

- apesar do grant para `authenticated`, ambos exigem admin via `private.is_admin_user(auth.uid())` ou contexto `service_role`;
- leem telemetria global somente após o guard.

**Sem exposição global para usuário autenticado comum.**

### Mobility dispatch summary

`get_driver_dispatch_summaries(uuid[])`:

- exige autenticação;
- limita até 100 IDs;
- retorna somente capabilities/rating operacional;
- só retorna drivers online, disponíveis e sem ride ativo;
- caller está no SSOT de queries/dispatch de Mobility.

**Classificação: authenticated dispatch read model, sem PII sensível retornada.**

### Coverage / Territory writers

`replace_entity_coverage(...)`, `remove_entity_coverage(...)` e `update_entity_coverage_status(...)` delegam a `private.require_coverage_entity_write(...)`.

O helper privado:

- deriva active profile;
- permite apenas tipos de entidade enumerados;
- exige ownership por domínio ou autoridade administrativa/service role;
- não é executável diretamente por browser.

**Sem writer paralelo ou bypass de ownership observado.**

### Profile verification

`request_profile_verification(...)`:

- exige `private.auth_owns_active_profile(p_profile_id)`;
- impede operar sobre profile de terceiro;
- restringe referência de documento ao prefixo do próprio profile;
- audita submit/resubmit.

**Sem spoofing de profile observado.**

### Safety

A família Safety auditada inclui share público, revoke e updates de alert/incident.

- bearer share só retorna ride não terminal enquanto token está ativo e não expirado;
- revoke exige que o criador pertença ao `auth.uid()` atual;
- parâmetros `p_actor_profile_id` são cruzados contra `auth.uid()`;
- transitions administrativas exigem role administrativa onde aplicável.

**O actor declarado nunca substitui a identidade autenticada.**

### Favorites / self-service

`get_current_user_business_favorite_ids`, `is_current_user_business_favorite` e `set_current_user_business_favorite` derivam o usuário exclusivamente de `auth.uid()` e não aceitam identidade de cliente.

**Sem spoofing de owner.**

### Analytics

`track_analytics_event(...)` permanece público por contrato, mas:

- bloqueia `p_user_id` diferente de `auth.uid()` para callers não-service-role;
- reserva eventos operacionais sensíveis ao `service_role`;
- exige sessão para tráfego anônimo;
- aplica rate limit;
- impede browser de persistir IP, user-agent, referrer e coordenadas como dados privilegiados;
- protege ownership de sessão existente.

**A exposição anônima continua deliberada e bounded.**

## 6. Ratchets existentes

O fechamento não cria uma segunda autoridade de teste. Ele reutiliza os contratos já versionados:

- `tests/security/anonymous-security-definer-allowlist.test.ts` — allowlist anon + proibição de grant `PUBLIC`;
- `tests/security/admin-definer-authority-security.test.ts` — nove gateways administrativos precisam manter `private.is_admin_user(auth.uid())`;
- `tests/security/community-poll-authority-security.test.ts` — ownership, visibilidade e ACL do command/read de Poll;
- testes de segurança específicos das famílias continuam sendo authority onde já existem.

As migrations G5 posteriores ao inventário inicial também retiraram execução direta desnecessária de trigger functions e helpers órfãos, explicando a redução do snapshot atual.

## 7. Decisão

Nenhum novo `GRANT` ou `REVOKE` foi aplicado neste fechamento.

A auditoria encontrou diferenças de ACL deliberadas, não uma classe residual de privileged RPC sem autorização. Alterar grants apenas para silenciar Advisor criaria risco de regressão e contrariaria a política provenance-first do G5.

`funções/RPCs e authority`: **CLOSED**.

## 8. Fora de escopo deste fechamento

Este item não declara:

- que as 17 relações RLS sem policy estão erradas; elas possuem provenance separada e fail-closed;
- que objetos extension-owned como PostGIS devem ser alterados;
- que migration history / schema drift global está encerrado;
- que CI hosted executou os testes deste HEAD;
- que G6/G7 podem ser iniciados antes dos demais checkboxes G5.

A certificação same-SHA continua pertencendo a G7.

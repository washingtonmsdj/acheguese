# G5 — Provenance das relações fail-closed — 2026-08-30

## Escopo

Este corte continua a auditoria de `RLS e grants` da fase G5 e revalida, no estado remoto atual, todas as relações dos schemas `public` e `private` que possuem RLS habilitado e zero policies.

A regra usada é a mesma do plano urgente: **zero policy, zero linha ou alerta de Advisor não prova legado**. Antes de remover qualquer objeto, é necessário cruzar grants, dados, caller/owner e provenance de migration.

## Snapshot remoto atual

Foram encontradas **17 relações** com RLS habilitado e nenhuma policy. Em todas elas:

- `anon`: sem `SELECT`, `INSERT`, `UPDATE` ou `DELETE`;
- `authenticated`: sem `SELECT`, `INSERT`, `UPDATE` ou `DELETE`.

Portanto, nenhuma das 17 relações está diretamente exposta ao browser.

O inventário inicial de `G5_RLS_GRANTS_AUDIT_2026-08-30.md` continha `public.delivery_requests`. Esse cluster já foi retirado com provenance em `20260830033337_retire_empty_legacy_delivery_cluster.sql`; no snapshot atual ele não existe mais. Em seu lugar, `public.gastronomy_subscriptions` permanece no conjunto fail-closed depois do lockdown de Billing, com dados históricos preservados.

## Relações `private`

| relação | linhas | authority/provenance | classificação |
| --- | ---: | --- | --- |
| `private.alpha_access_audit_log` | 5 | alpha admission control; migrations privadas de acesso/auditoria | ACTIVE / PRIVATE / INTERNAL |
| `private.alpha_access_control` | 1 | authority privada do admission control alpha | ACTIVE / PRIVATE / INTERNAL |
| `private.alpha_access_invites` | 0 | fluxo de invite/cleanup e gate de identidades alpha | ACTIVE / PRIVATE / INTERNAL |
| `private.community_direct_message_audit_log` | 3 | owner em `COMMUNITY_DIRECT_MESSAGING_SSOT.md` | ACTIVE / PRIVATE / AUDIT |
| `private.notification_outbox` | 0 | owner canônico de Notifications; migration e probes próprios | ACTIVE / PRIVATE / SERVER-OWNED |

Observação: ausência de grants diretos de `service_role` em parte das tabelas `private` não implica inutilidade. Essas relações são acessadas por funções/autoridades internas com ownership/`SECURITY DEFINER`, e o schema `private` não é superfície de Data API para browser.

## Relações `public`

| relação | linhas | authority/provenance | classificação |
| --- | ---: | --- | --- |
| `account_deletion_requests` | 0 | `supabase/functions/_shared/accountOperational.ts` + authority de exclusão de conta | ACTIVE / SERVER-OWNED / FAIL-CLOSED |
| `analytics_sessions` | 0 | `ANALYTICS_SSOT.md`, RPC de analytics e export LGPD | ACTIVE / RPC/SERVER-OWNED / FAIL-CLOSED |
| `banned_users` | 0 | `ActiveBanReader`, moderation SSOT e `has_current_active_ban()` | ACTIVE / RPC-OWNED / FAIL-CLOSED |
| `community_social_audit_log` | 219 | audit/moderation SSOT e gateways administrativos | ACTIVE / AUDIT / FAIL-CLOSED |
| `community_user_moderation_actions` | 0 | moderation/trust boundary e migrations de hardening | ACTIVE / MODERATION / FAIL-CLOSED |
| `emergency_delivery_log` | 0 | Core Safety e `send-emergency-email`; provenance já documentada | ACTIVE / SERVER-OWNED / FAIL-CLOSED |
| `gastronomy_subscriptions` | 5 | legado Billing com dados preservados; browser lockdown aplicado | LEGACY / LOCKED / RETAIN PENDING CLEANUP |
| `group_message_reactions` | 0 | `SocialGroupInteractionsService` chama RPCs que são owners da tabela | ACTIVE / RPC-OWNED / FAIL-CLOSED |
| `review_helpfulness` | 0 | `ReviewEngagementService` e Reviews SSOT | ACTIVE / RPC-OWNED / FAIL-CLOSED |
| `trust_admin_actions` | 0 | `TrustAdminService` + gateways admin | ACTIVE / ADMIN / FAIL-CLOSED |
| `trust_events` | 0 | `TrustAdminService` + trust operational commands | ACTIVE / TRUST / FAIL-CLOSED |
| `user_active_profiles` | 1 | seleção canônica de active profile + funções privadas/RPCs dependentes | ACTIVE / IDENTITY CONTEXT / FAIL-CLOSED |

## Evidência de que tabelas vazias não são órfãs

O snapshot atual possui várias tabelas com zero linhas, mas callers/owners ativos:

- `account_deletion_requests` está operacionalmente ligada ao fluxo de exclusão de conta;
- `analytics_sessions` participa do SSOT de Analytics e da exportação LGPD;
- `banned_users` é lida pelo gateway `has_current_active_ban()`;
- `group_message_reactions` é escrita/lida pelos RPCs `toggle_group_message_like` e `list_group_message_reaction_state`, consumidos por `SocialGroupInteractionsService`;
- `review_helpfulness` possui serviço runtime em `ReviewEngagementService`;
- `trust_admin_actions` e `trust_events` são storage interno dos comandos/readers administrativos de Trust;
- `notification_outbox` permanece owner canônico do outbox mesmo vazio no snapshot.

Logo, **não existe autorização para DROP baseada apenas em `rows = 0`**.

## Caso legado preservado

`public.gastronomy_subscriptions` é a única relação deste conjunto já classificada como legado. Ela contém 5 linhas históricas e teve browser grants/policies removidos por `20260830032622_lock_legacy_gastronomy_subscriptions_surface`.

A decisão continua sendo preservar dados e bloquear writes/deletes, não transformar a tabela em nova autoridade nem removê-la sem snapshot/export e certificação de dependências externas.

## Decisão

Nenhuma migration adicional foi criada neste corte porque não foi encontrada exposição indevida nas 17 relações atuais:

- todas estão fail-closed para `anon` e `authenticated`;
- 16 possuem provenance ativa/interna/server-owned;
- 1 é legado conhecido, locked e com dados que devem ser preservados.

Criar policies para silenciar o Advisor aumentaria superfície sem necessidade; remover relações vazias quebraria owners ativos.

## Impacto em G5

Este corte fecha a **classificação por provenance do conjunto atual `RLS enabled + zero policies`**.

Ainda permanecem abertos no item global `RLS e grants`:

1. residuals extension-owned (`postgis`, `spatial_ref_sys` e extensões em `public`);
2. revisão funcional/caller das demais famílias de `SECURITY DEFINER` além do inventário global;
3. procura de legados/orphans fora do conjunto `zero policy`;
4. certificação posterior contra o mesmo SHA em G6/G7.

## Próximo corte seguro

Sair do conjunto `rls_enabled_no_policy` — que agora está classificado — e procurar objetos de banco fora dele que combinem:

- zero caller runtime atual;
- owner canônico substituído;
- grants de browser ainda existentes ou autoridade redundante;
- dados vazios **ou** plano explícito de retenção/export;
- migration de origem/provenance identificada.

Somente esse conjunto pode gerar o próximo lockdown/retirement de G5 com segurança.

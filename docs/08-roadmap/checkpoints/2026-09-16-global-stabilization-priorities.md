# Checkpoint — prioridades globais de estabilização

**Atualizado:** 2026-09-17  
**Linha:** `main`  
**Status:** P0/P1 em execução; release authority do HEAD atual ainda aberto; Mobilidade, segurança e LGPD avançaram com provas remotas fail-closed

## Autoridade

Este checkpoint complementa `../EXECUCAO_MAIN_ONLY.md`; não o substitui. O arquivo raiz `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` permanece apenas ponteiro de compatibilidade.

Base técnica reconciliada imediatamente antes desta atualização: `6c5fd41eccd6faf88af0353e9d8bb87925a81595`.

## P0 — release authority

### Same-SHA build/deploy

- `a30b7c7ba9a403ff7c9a6c4e1308754a4d9bbd4f` teve deployment Vercel real `READY` e status `success` no mesmo SHA;
- `305fe19c7f90a621c5a1f0e462b3fc230dc8e586` também teve deployment de produção real `READY` (`dpl_52T9AAZeRoae94x8DLAJksiW7zir`) e status GitHub `Vercel=success` no mesmo SHA;
- commits posteriores não herdam essa certificação;
- `279cbd74c590c4d2b555a3a00d643b3fc9bcaa9b` mostrou `Vercel=success` no GitHub, mas o deployment correspondente foi `CANCELED` por `Ignored Build Step`; esse status não conta como build positivo;
- o HEAD atual é posterior ao último SHA com build real `READY`, portanto continua exigindo validação própria.

Critério continua: execução real de typecheck/lint/security/test/build/deploy no mesmo SHA candidato, sem bypass.

Snapshot remoto observado antes desta atualização documental em 2026-09-17:

- PR #117 está aberto no SHA final `bc2747022a7d714df7335c8c9514250f1d710349`, baseado no HEAD da `main` `70bea7259572c2032371fe21fea5785f5191cdef`, com 11 commits à frente e zero atrás;
- os runs `Security Check` #35242804648, `SSOT Enforcement` #35242804586, `Security Scan` #35242804570, `SSOT Territorial Tests` #35242804585 e `Auth Concept Regression` #35242804656 terminaram `failure`, com `steps=null`; os comandos não iniciaram;
- `Heavy PR Certification (Auto)` #35242804590 continua `queued`, sem steps;
- o status `Vercel` do SHA final está `failure`; o limite diário do plano (`api-deployments-free-per-day`) impede novo build/deploy;
- o sync canônico de tipos #207 (run `35168708525`) continua `queued`; #208 (run `35178338822`) foi cancelado após 40m37s, também sem steps;
- não foi demonstrada a causa exata dos jobs sem steps nem a disponibilidade do runner dedicado.

Verificação local deste checkout em 2026-09-17:

- `npm run typecheck:ci` passou com recompilação forçada;
- `npm run lint` passou sem erros (dois avisos já existentes);
- `npm run build` passou após execução autorizada fora do sandbox: Vite transformou 6.089 módulos e produziu o bundle local; isso não comprova deployment;
- `npm run security:validate` passou, com aviso de `.env.local` ausente;
- `npm run validate:migrations` passou após reconciliar colisões locais e classificações explícitas;
- a revalidação final de `npm run validate:docs-structure` não carregou o validador: Node 24.19.0 retornou `uv_os_get_passwd ENOMEM`; `git diff --check` passou;
- testes focados de Safety/Mobility passaram **14/14**; lint Maps passou e seus testes passaram **4/4** usando configuração de teste isolada, pois a configuração padrão tentou ler `../../..` fora do limite do sandbox;
- novos testes focados do validador de migrations passaram **2/2**, e os testes de leitura Mobility/contrato passaram **12/12**;
- o caller sem uso de `get_driver_dispatch_summaries` foi removido; o RPC remoto só concede EXECUTE a `service_role` e o scan do código de browser agora retorna zero callers entre 197 nomes privilegiados;
- a comparação detalhada do ledger remoto encontrou 32 reconciliações de arquivo cujo SQL é idêntico ao registrado, sete migrations com conteúdo local diferente do aplicado, 29 migrations locais sem identidade remota e 10 registros remotos sem arquivo local. Não aplicar nem renomear os conflitos até reconciliar o provenance de cada statement.
- esses resultados locais ainda não certificam SHA remoto. O follow-up de código está no PR #117, commit `bc2747022a7d714df7335c8c9514250f1d710349`, sem merge; no SHA observado os workflows terminaram sem steps e Vercel permanece no limite diário. Esta atualização documental não altera o código; os gates ainda precisam concluir no HEAD que a contém.

### Proteção de `main`

Estado: **ABERTO / não verificável nesta sessão**. A última observação registrada mostrou `protected=false`, sem required status checks. A consulta atual da API de branch protection retornou `403 Resource not accessible by integration`; por isso não confirma o estado presente nem permite aplicar a configuração. Issue relacionado: #28.

Antes de exigir PR para todos os pushes, reconciliar a regra com o workflow canônico `Supabase Types Sync`, que grava somente `types.generated.ts` diretamente em `main` usando `GITHUB_TOKEN`. A regra precisa preservar essa publicação restrita ou o workflow deve passar por PR; não presumir bypass administrativo do bot.

## P1 — Mobilidade

### Fechado com evidência remota

- minimização de GPS ocioso aplicada; zero GPS/snapshot ocioso remanescente na verificação;
- probe negativo de participante bloqueou terceiro usuário em PIN/trust/report, rollback-only;
- compatibilidade pública `p_final_price` removida; preço terminal continua server-owned;
- replays sequenciais rollback-only provados para aceite duplicado, consumo duplicado da mesma `quote_id` e conclusão terminal duplicada;
- SQLSTATE de stale/replay normalizado para não induzir retry automático indevido;
- contrato vivo de atomicidade validado por probe read-only: locks de `ride_request`/`driver_availability`, quote com `FOR UPDATE` + consumo condicional, transição com `expected_from_state` e unicidade de `pricing_quote_id`/consumo;
- probe adicional de participante em corrida sintética bloqueou terceiro usuário em `ensure_ride_chat`, `send_ride_chat_message`, `mark_ride_chat_messages_read`, `create_safety_ride_share`, `get_operational_verification_status` e `verify_operational_pin`; rollback-only.

`tests/security/mobility-concurrency-contract-remote-probe.sql` registra explicitamente que a prova estrutural **não é** prova runtime em duas sessões independentes.

### Aberto antes de launch-ready

1. política comercial real aprovada para `ride` e `motoboy`;
2. regeneração de `src/integrations/supabase/types.generated.ts` pelo fluxo canônico; há drift confirmado e o runner do sync continua sendo bloqueio de infraestrutura;
3. prova real em sessões independentes para dupla aceitação/cancelamento/quote/confirmação concorrentes;
4. suite same-SHA completa + E2E/smoke;
5. `PUBLIC_LAUNCH_SURFACES.mobility=false` até fechar todos os gates.

## P1 — segurança transversal

Supabase `xhdowzacfujckjelqhtd` está `ACTIVE_HEALTHY`, Postgres `17.6.1.084`, conferido às 15:57 UTC. Advisor de segurança atualizado às 15:54 UTC:

- 1 `ERROR`: `public.spatial_ref_sys` sem RLS, relação do PostGIS;
- 19 `INFO`: RLS ligado sem policy (14 tabelas em `public`, 5 em `private`);
- 4 extensões em `public`: `unaccent`, `pg_trgm`, `citext`, `postgis`;
- 9 funções `SECURITY DEFINER` executáveis por `anon`;
- 85 executáveis por `authenticated`;
- Leaked Password Protection continua desabilitado.

Essas contagens são inventário, não classificação automática de vulnerabilidade.

Consulta read-only ao catálogo em 2026-09-17 confirmou 301 funções `SECURITY DEFINER` em `public`: 85 executáveis por `authenticated`, 9 por `anon` e 274 por `service_role`. As 9 chamadas anon incluem 6 endpoints próprios com contrato público explícito (poll visível, reputação pública, resumo agregado de rating, share por token ativo, projeção territorial consentida e ingestão analítica validada) e as 3 assinaturas `st_estimatedextent` da extensão PostGIS.

As 82 funções próprias executáveis por `authenticated` (6 também expostas a `anon` e 76 somente a `authenticated`) têm `search_path` fixado. As únicas 3 funções expostas sem `search_path` são as versões C, pertencentes à extensão PostGIS, de `st_estimatedextent`; não foram alteradas. O catálogo encontrou 17 funções próprias sem comentário SQL; suas definições usam wrappers com delegação a helpers privados ou comandos com verificação de ator/admin. Comentário ausente, isoladamente, não foi tratado como vulnerabilidade.

### Revisão `anon SECURITY DEFINER`

Dos 9 warnings, 3 são `st_estimatedextent` do PostGIS. Os 6 RPCs próprios revisados possuem finalidade pública/anon explícita e filtros de autoridade/visibilidade: poll publicado, reputação profissional pública, resumo de rating autorizado, share de corrida por token ativo, projeção territorial pública e analytics.

`track_analytics_event` recebeu probe negativo rollback-only no Supabase real: spoof de outro `user_id` e `order_completed` por caller não-`service_role` foram bloqueados. Probe versionado em `tests/security/analytics-anon-authority-remote-probe.sql`.

### Revisão `authenticated SECURITY DEFINER`

A triagem de maior risco já possui **53 fronteiras sensíveis com evidência negativa/de isolamento no Supabase real**, em transações rollback-only:

- 6 RPCs administrativos de mutação/ação;
- 7 leituras administrativas: métricas/SLO, fila de correção, audit social, moderação federada e listas Trust;
- 5 fronteiras de identidade/recurso: cross-user notification, Safety/profile spoof, verification de perfil alheio, membros de perfil alheio e coverage alheia;
- 4 fronteiras reviewer/voter de reviews/helpfulness;
- 6 fronteiras de participante em corrida: chat ensure/send/read, ride share, verification status e PIN;
- 9 fronteiras Community Direct / emergency contacts;
- 6 fronteiras Classifieds messaging: inbox de perfil alheio, send/read/block/report conversation/report message por outsider;
- 4 fronteiras Safety: criação de incidente com `reported_by` forjado, evidence em incidente alheio, mutação de alerta alheio e transição de incidente por não-admin;
- 2 fronteiras current-user preferences/favorites: favorite alheio bloqueado e preferência de outro usuário preservada;
- 2 fronteiras de Community poll: voto e autoria de post com Profile alheio.
- 2 fronteiras de reações em grupo: leitura de contagem e tentativa de curtir mensagem privada por não-membro.

Probe remoto rollback-only ampliado em `tests/security/safety-authority-negative-remote-probe.sql`: `create_safety_incident` bloqueou o `reported_by` de outro Profile; o Supabase retornou 4/4 negações e `rolled_back=true`.

Probe remoto rollback-only em `tests/security/community-group-reaction-membership-remote-probe.sql` confirmou que membro enxerga a própria reação e a contagem, enquanto perfil externo recebe zero linhas e não consegue curtir; fixture sintética removida com `rolled_back=true`.

Probes versionados incluem:

- `tests/security/authenticated-admin-rpc-negative-remote-probe.sql`;
- `tests/security/authenticated-admin-read-negative-remote-probe.sql`;
- `tests/security/authenticated-identity-spoof-negative-remote-probe.sql`;
- `tests/security/review-identity-spoof-negative-remote-probe.sql`;
- `tests/security/ride-chat-share-participant-negative-remote-probe.sql`;
- `tests/security/community-profile-spoof-negative-remote-probe.sql`;
- `tests/security/classified-messaging-participant-negative-remote-probe.sql`;
- `tests/security/safety-authority-negative-remote-probe.sql`;
- `tests/security/current-user-preferences-isolation-remote-probe.sql`;
- `tests/security/community-poll-profile-spoof-negative-remote-probe.sql`.
- `tests/security/community-group-reaction-membership-remote-probe.sql`.

A revisão não fecha automaticamente os 85 warnings. Grupos residuais seguem classificados por autoridade real antes de qualquer revoke/grant em massa.

`submit_work_opportunity_feedback` foi revisado especificamente: a UI o apresenta como **retorno rápido da comunidade** sobre utilidade da oportunidade, não review bilateral de contratação. O contrato server-side de permitir perfil ativo não autor em oportunidade não cancelada é coerente com essa semântica; não foi endurecido artificialmente.

### RLS default-deny e PostGIS

As 19 tabelas com RLS ligado e sem policy não concedem `SELECT`, `INSERT`, `UPDATE` ou `DELETE` a `anon`/`authenticated`. As 14 tabelas em `public` concedem acesso de tabela somente a `service_role`; em `private`, `community_direct_message_audit_log` e `notification_outbox` também são service-only, enquanto as três tabelas `alpha_access_*` permanecem acessíveis apenas ao owner. O finding `RLS enabled no policy` é deny-by-default nesses casos. `mobility_price_quotes` e `ride_state_audit` estão entre as 14 tabelas públicas.

`public.spatial_ref_sys` é diferente: pertence ao PostGIS, está sem RLS e concede `SELECT` a `PUBLIC`, portanto aparece como `ERROR`. Seus registros são metadados estáticos de sistemas de coordenadas; o finding permanece aberto para uma correção compatível com a extensão, sem alteração de grants/schema nesta execução.

## P1 — LGPD / privacidade

Relacionado: issue #68.

### Autoridade reversível reconciliada

A migration canônica aplicada é `20260826015916_reconcile_account_deletion_authority_live_drift`:

- `public.account_deletion_requests` existe;
- `get_account_deletion_status_for_user`, `request_account_deletion_for_user` e `cancel_account_deletion_for_user` existem;
- browser roles não têm autoridade direta;
- a migration declara explicitamente que não implementa purge destrutivo nem apaga `auth.users`.

As migrations históricas `20260821...` não devem ser reaplicadas como atalho.

### Purge destrutivo — gate fail-closed

Não existe cron/worker de purge atualmente.

Levantamento read-only do schema vivo encontrou **28 FKs bloqueantes** (`NO ACTION`/`RESTRICT`) antes de excluir fisicamente `auth.users`/`profiles`:

- 20 apontam para `auth.users`;
- 8 apontam para `profiles`;
- 25 usam colunas anuláveis;
- 3 são não anuláveis + `RESTRICT`: `communication_publications_author_profile_id_fkey`, `community_user_moderation_actions_actor_profile_id_fkey` e `trust_admin_actions_applied_by_profile_id_fkey`.

`docs/09-reference/governance/privacy/LGPD_PURGE_MATRIX.json` mantém default `block`, `implementationComplete=false` e as 28 referências como `unclassified`.

O preflight `tools/security/supabase-lgpd-edge-rollout-preflight.mjs` só pode liberar `user-delete-account` quando não houver marcadores stale, existir `LGPD_PURGE_IMPLEMENTATION_COMPLETE=true`, a matriz estiver válida, `implementationComplete=true` e houver zero referências `unclassified`.

Regressão: `tests/security/lgpd-purge-readiness-gate.test.ts`.

Nenhuma política de retenção foi inventada e nenhum delete destrutivo/DDL foi executado nesta etapa.

### Restante LGPD

1. classificar as 28 referências com política aprovada de retenção/anonymização/set-null/delete/block;
2. desenhar worker de purge idempotente e observável somente após essa classificação;
3. revogar sessões pela autoridade real do Supabase Auth;
4. manter `user-delete-account` legado bloqueado;
5. concluir/certificar `user-export-data` contra `LGPD_EXPORT_MATRIX`, que permanece fail-closed;
6. executar probes não-prod + same-SHA antes de rollout.

## P2 — certificação funcional

Seguir issue #50:

1. Mobilidade/Central motorista-motoboy;
2. Central + Business/Gastronomia + Professionals;
3. Comunidade;
4. Classifieds/Messaging/Work Opportunities/Profile/trust;
5. Admin/Comunicação Territorial/Guide/AI/auxiliares.

Domínio só fecha quando arquitetura + autorização + banco + runtime + fluxo real + E2E concordarem. Placeholder, fallback, launch-paused, tela vazia ou early-return não contam.

## P3 — performance/UX

Somente após estabilização funcional: priorizar índices/FKs por tráfego real, revisar RLS redundante com medição, bundle/CSS/visual SSOT, acessibilidade/responsividade e limpeza de bridges/documentação temporária.

## Próxima ação executável

Sem inventar política comercial ou retenção, as frentes executáveis são:

1. acompanhar/fechar o sync canônico de tipos quando o runner estiver disponível;
2. obter prova de concorrência real em sessões independentes quando houver mecanismo seguro de múltiplas sessões;
3. concluir classificação dos `authenticated SECURITY DEFINER` residuais por risco/autoridade e negative probes onde houver boundary sensível;
4. continuar a matriz LGPD apenas com decisões de retenção explicitamente aprovadas;
5. repetir build/deploy real no SHA final após alterações de source/probes.


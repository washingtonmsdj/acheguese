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
- o SHA `c46e61eba0a0b5d132c64fe51f1589c208810458` recebeu preview Vercel `READY` (`dpl_3yFoVfGodyEfdQz7p5nCRawPumbc`) e `Vercel=success` no mesmo SHA; é preview da branch, sem promoção de produção ou smoke final;
- o HEAD atual é posterior ao último SHA com build real `READY`, portanto continua exigindo validação própria.

Critério continua: execução real de typecheck/lint/security/test/build/deploy no mesmo SHA candidato, sem bypass.

Snapshot remoto do SHA de código `c46e61eba0a0b5d132c64fe51f1589c208810458`, observado antes desta atualização documental em 2026-09-17 às 16:19 UTC:

- PR #117 está aberto, baseado no HEAD da `main` `70bea7259572c2032371fe21fea5785f5191cdef`, com 13 commits à frente e zero atrás;
- os runs `Security Check` #35245264321, `SSOT Enforcement` #35245264352, `Security Scan` #35245264362, `SSOT Territorial Tests` #35245264317 e `Auth Concept Regression` #35245264418 terminaram `failure`, com `steps=null`; os comandos não iniciaram;
- `Heavy PR Certification (Auto)` #35245264495 continua pendente, com job `queued` e sem steps;
- o preview Vercel `dpl_3yFoVfGodyEfdQz7p5nCRawPumbc` está `READY` no mesmo SHA e o status GitHub é `success`; produção e smoke permanecem pendentes;
- o sync canônico de tipos #207 (run `35168708525`) continua `queued`; #208 (run `35178338822`) está `cancelled` após 40m37s, também sem steps;
- não foi demonstrada a causa exata dos jobs sem steps nem a disponibilidade do runner dedicado.

Verificação local deste checkout em 2026-09-17:

- `npm run typecheck:ci` passou com recompilação forçada;
- `npm run lint` passou sem erros (dois avisos já existentes);
- `npm run build` passou após execução autorizada fora do sandbox: Vite transformou 6.089 módulos e produziu o bundle local; isso não comprova deployment;
- `npm run security:validate` passou, com aviso de `.env.local` ausente;
- `npm run validate:migrations` passou após reconciliar colisões locais e classificações explícitas;
- as duas últimas tentativas de `npm run validate:docs-structure` não carregaram o validador: Node 24.19.0 e Node 26.7.0 retornaram `uv_os_get_passwd ENOMEM`; a tentativa via WSL foi bloqueada pelo serviço com `E_ACCESSDENIED`; `git diff --check` passou;
- testes focados de Safety/Mobility passaram **14/14**; lint Maps passou e seus testes passaram **4/4** usando configuração de teste isolada, pois a configuração padrão tentou ler `../../..` fora do limite do sandbox;
- novos testes focados do validador de migrations passaram **2/2**, e os testes de leitura Mobility/contrato passaram **12/12**;
- o caller sem uso de `get_driver_dispatch_summaries` foi removido; o RPC remoto só concede EXECUTE a `service_role` e o scan do código de browser agora retorna zero callers entre 197 nomes privilegiados;
- a comparação detalhada do ledger remoto encontrou 32 reconciliações de arquivo cujo SQL é idêntico ao registrado, sete migrations com conteúdo local diferente do aplicado, 29 migrations locais sem identidade remota e 10 registros remotos sem arquivo local. Não aplicar nem renomear os conflitos até reconciliar o provenance de cada statement.
- esses resultados locais ainda não certificam SHA remoto. O follow-up de código está no PR #117, commit `c46e61eba0a0b5d132c64fe51f1589c208810458`, sem merge; no SHA observado os workflows terminaram sem steps, enquanto o preview Vercel foi `READY`. Esta atualização documental não altera o código; a certificação hosted e o smoke de produção continuam pendentes no HEAD que a contém.

### Proteção de `main`

Estado: **PARCIAL / #28 continua aberto**. Verificação administrativa pela API confirmou `protected=true`, `enforce_admins=true`, force-push e deleção desabilitados e resolução de conversas obrigatória. `required_pull_request_reviews`, `required_status_checks` e `restrictions` permanecem `null`; pushes diretos comuns continuam possíveis. PR obrigatório e Vercel ainda não foram exigidos porque `Supabase Types Sync` grava `types.generated.ts` diretamente em `main`, e o runner desse fluxo está offline.

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

A triagem de maior risco já possui **54 fronteiras sensíveis com evidência negativa/de isolamento no Supabase real**, em transações rollback-only:

- 6 RPCs administrativos de mutação/ação;
- 7 leituras administrativas: métricas/SLO, fila de correção, audit social, moderação federada e listas Trust;
- 5 fronteiras de identidade/recurso: cross-user notification, Safety/profile spoof, verification de perfil alheio, membros de perfil alheio e coverage alheia;
- 4 fronteiras reviewer/voter de reviews/helpfulness;
- 6 fronteiras de participante em corrida: chat ensure/send/read, ride share, verification status e PIN;
- 9 fronteiras Community Direct / emergency contacts;
- 6 fronteiras Classifieds messaging: inbox de perfil alheio, send/read/block/report conversation/report message por outsider;
- 5 fronteiras Safety: spoof na criação de alerta e incidente, evidence em incidente alheio, mutação de alerta alheio e transição de incidente por não-admin;
- 2 fronteiras current-user preferences/favorites: favorite alheio bloqueado e preferência de outro usuário preservada;
- 2 fronteiras de Community poll: voto e autoria de post com Profile alheio.
- 2 fronteiras de reações em grupo: leitura de contagem e tentativa de curtir mensagem privada por não-membro.

Probe remoto rollback-only ampliado em `tests/security/safety-authority-negative-remote-probe.sql`: `create_safety_emergency_alert` e `create_safety_incident` bloquearam Profile alheio; o Supabase retornou 5/5 negações e `rolled_back=true`.

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

## Refresh remoto Supabase — 2026-09-18 UTC

Consultas read-only ao projeto canônico `xhdowzacfujckjelqhtd` atualizaram os gates sem aplicar DDL, migration ou Edge Function:

- Ledger remoto: **645 migrations**, latest `20260917032803`. A árvore local tem **664** arquivos: 628 identidades coincidem em versão e nome; 7 pares com o mesmo nome têm versão e fingerprint SQL divergentes; 29 arquivos locais não têm candidato remoto pelo nome; 10 migrations remotas não têm nome local correspondente. Não há versão local duplicada nem alias com fingerprint SQL idêntico. A reconciliação oficial via CLI segue sem execução: este checkout não tem `supabase/.temp/project-ref` nem `SUPABASE_ACCESS_TOKEN`/`SUPABASE_MANAGEMENT_API_TOKEN`.
- Snapshot read-only para recuperação: `migrationCount=645`, `latestMigration=20260917032803`, `authUsers=289`, `authIdentities=287`, `storageObjects=65`, `storageTotalBytes=23926702`. O artifact privado registrado em `2026-08-14` é antigo (344 migrations); esta consulta de catálogo não substitui novo backup externo e readback.
- Advisor observado em `2026-09-18T03:47:47Z`: 19 `RLS enabled no policy` (`INFO`, tabelas deny-by-default), 1 `RLS disabled in public` (`public.spatial_ref_sys`, `ERROR`), 4 extensões em `public`, 9 funções `SECURITY DEFINER` executáveis por `anon`, 85 por `authenticated` e HIBP desativado. MCP confirmou o projeto `acheguese` como `ACTIVE_HEALTHY`, PostgreSQL 17.6; a consulta read-only direta confirmou role `postgres`, 645 migrations e latest `20260917032803`.
- Preflight de ownership read-only: role `postgres`, sem superuser; `citext`, `pg_trgm`, `postgis`, `unaccent`, `spatial_ref_sys` e os três overloads `st_estimatedextent` pertencem a `supabase_admin`. `spatial_ref_sys` segue sem RLS; os três overloads continuam executáveis por `anon` e `authenticated`. O caminho CLI também confirma que falta projeto linkado neste checkout.
- Leads/community: `professional_leads` e `community_interest_registrations` têm RLS e negam `INSERT` direto às roles `anon` e `authenticated`; permanecem policies históricas de `INSERT`. `professional_stats` ainda permite `INSERT` autenticado pela policy de gestão própria, e não existe o trigger `professional_leads_increment_contacts`. G39/G38 continua pendente do frontend LIVE no SHA certificado e dos smokes anônimo/autenticado; não aplicar o cutover enquanto esses gates não passarem.
- Edge Functions remotas `create-professional-lead` v2, `register-community-interest` v4 e `submit-dpo-request` v1 estão ACTIVE com `verify_jwt=false`, conforme os contratos públicos custom-auth documentados. Nenhum deploy foi feito.
- `npm run validate:migrations`, `npm run validate:migrations:provenance` e os 11 testes focados de identidade/proveniência passaram; proveniência reporta 45 históricas, 0 `READY_FOR_GIT`, 5 `LOCAL_PENDING_NEW`. `npm run security:validate` passou com o aviso de `.env.local` ausente. A suíte `security-authority-migrations` passou 72/73: a falha preserva seis exceções remotas abertas e vencidas. `validate:free-release-governance` bloqueia as exceções HIBP/PostGIS expiradas e `RECOVERY_SNAPSHOT_STALE`.
- `security:auth:hibp --check` permanece `missing_pat`; não foi alterado Auth Settings. Nem exceções foram renovadas, nem o snapshot oficial foi substituído, pois isso requer nova evidência externa e aprovação do owner.

### Dependências de fechamento

1. Vincular este checkout ao projeto Supabase e disponibilizar uma sessão/token de Management API com escopo para executar os validadores remotos oficiais e checar Auth Settings.
2. Obter do owner aprovação explícita para renovar/encerrar as seis exceções vencidas; a data não pode ser prorrogada pelo validador.
3. Criar e ler de volta um novo backup privado de recuperação, depois revalidar os seis campos de estado remoto e sua janela de 24 horas.
4. Fechar as identidades/content mismatches de migrations por recuperação de histórico ou migration de reconciliação revisada; não reaplicar nem renomear automaticamente.
5. Certificar frontend e smokes do G39/G38 antes de remover as policies antigas, o writer autenticado de `professional_stats` e concluir o incremento de contatos.

### CI, Vercel e build local

Atualização do PR #117 em `2026-09-18T02:03:43Z`: head `85d70679c4dd5a08fb520b4948369b4d33b4ee48` segue aberto contra `main` `70bea7259572c2032371fe21fea5785f5191cdef`. Os 16 jobs falharam em 2–4 s com `steps=[]`; `gh run view --log-failed` retornou `log not found`, então não há erro de código/log de etapa que permita atribuir a causa. O job Heavy exato para esse SHA segue `QUEUED`. O status Vercel está verde, mas a implantação preview foi cancelada por `Ignored Build Step`.

No checkout principal com alterações locais não commitadas, `npm run build:vercel` passou: 21 inputs, CSP, Turnstile, typecheck, lint e Vite. O lint reportou dois warnings (deps de `useEffect` em `RideTrackingMap.tsx` e diretiva ESLint sem uso em `RideRequestForm.tsx`); o Vite transformou 6.089 módulos e concluiu. Este resultado local não certifica o SHA remoto do PR. Não houve commit, deploy ou alteração de proteção de `main` nesta rodada.

Validação adicional na worktree limpa do PR, exatamente no SHA `85d70679c4dd5a08fb520b4948369b4d33b4ee48`: `npm run build:vercel` passou com os 21 inputs, CSP, Turnstile, typecheck, lint sem erros e Vite (6.094 módulos; build concluído). Permanecem os mesmos dois warnings de lint. Os sete workflows falhos foram reexecutados; no attempt 2, todos voltaram a falhar entre 2–17 s com zero steps. O gate Heavy continuava `QUEUED` às `2026-09-18T04:04Z`; o build local exato não substitui testes hospedados, E2E remoto, preview implantado nem smoke.

### Reclassificação remota das refs — issue #84

Leitura autenticada da API GitHub em `2026-09-18T04:04Z` retornou 40 branches: `main`, 38 refs históricas listadas na issue #84 e a branch ativa de #117. Os 38 nomes e SHAs históricos correspondem ao manifesto da issue; a única diferença é o head ativo de #117, atualizado de `44018f25...` para `85d70679...`. O namespace local `refs/remotes/inventory/*` contém 126 snapshots antigos e não representa branches remotas atuais.

As 38 refs históricas têm proveniência incompleta: 22 são heads exatos de PRs fechados sem merge e 16 não têm PR. Nenhum head é ancestral da `main`; todos mantêm commits/diferenças desde seu merge-base. Quatro refs cuja delta exclusiva já havia sido destacada na issue continuam presentes: `handoff/4.6h-final` (4 commits), `agent/structure-cleanup-foundation` (66), `agent/lgpd-pending-deletion-boundary` (14) e `security/report-rpc-authz-batch-2-reconciled` (3). Não removi nenhuma ref; o exame semântico e a reconstrução de conteúdo útil continuam necessários antes de qualquer exclusão.

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

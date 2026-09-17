# Checkpoint — prioridades globais de estabilização

**Atualizado:** 2026-09-17  
**Linha:** `main`  
**Status:** P0/P1 em execução; release authority do HEAD atual ainda aberto; Mobilidade, segurança e LGPD avançaram com provas remotas fail-closed

## Autoridade

Este checkpoint complementa `../EXECUCAO_MAIN_ONLY.md`; não o substitui. O arquivo raiz `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` permanece apenas ponteiro de compatibilidade.

Base técnica reconciliada imediatamente antes desta atualização: `0ee9b0b314ca3bcd45733b8b68f55afba89ec52e`.

## P0 — release authority

### Same-SHA build/deploy

- `a30b7c7ba9a403ff7c9a6c4e1308754a4d9bbd4f` teve deployment Vercel real `READY` e status `success` no mesmo SHA.
- commits posteriores não herdam essa certificação;
- deployments posteriores de mudanças apenas de docs/probes chegaram a ser cancelados por `Ignored Build Step`, o que **não** conta como build positivo;
- para a base `0ee9b0b3...`, o check Vercel estava `pending` no momento desta atualização.

Critério continua: execução real de typecheck/lint/security/test/build/deploy no mesmo SHA candidato, sem bypass.

### Proteção de `main`

Estado: **ABERTO**.

`main` continua `protected=false`, sem required status checks. Issue relacionado: #28. A capacidade de escrita de branch protection/ruleset não está disponível no conector atual; não declarar fechado até verificação remota.

## P1 — Mobilidade

### Fechado com evidência remota

- minimização de GPS ocioso aplicada; zero GPS/snapshot ocioso remanescente na verificação;
- probe negativo de participante bloqueou terceiro usuário em PIN/trust/report, rollback-only;
- compatibilidade pública `p_final_price` removida; preço terminal continua server-owned;
- replays sequenciais rollback-only provados para:
  - aceite duplicado;
  - consumo duplicado da mesma `quote_id`;
  - conclusão terminal duplicada;
- SQLSTATE de stale/replay normalizado para não induzir retry automático indevido;
- contrato vivo de atomicidade validado por probe read-only:
  - aceite trava `ride_request` e `driver_availability`;
  - quote é travada por `FOR UPDATE` e consumida condicionalmente;
  - transição de estado usa `FOR UPDATE` + `expected_from_state`;
  - unicidade de `pricing_quote_id`/consumo permanece presente.

`tests/security/mobility-concurrency-contract-remote-probe.sql` registra explicitamente que isso **não é** prova runtime em duas sessões independentes.

### Aberto antes de launch-ready

1. política comercial real aprovada para `ride` e `motoboy`;
2. regeneração de `src/integrations/supabase/types.generated.ts` pelo fluxo canônico; há drift confirmado e o runner do sync continua sendo bloqueio de infraestrutura;
3. prova real em sessões independentes para dupla aceitação/cancelamento/quote/confirmação concorrentes;
4. suite same-SHA completa + E2E/smoke;
5. `PUBLIC_LAUNCH_SURFACES.mobility=false` até fechar todos os gates.

## P1 — segurança transversal

Advisor de segurança atualizado em 2026-09-17:

- 1 `ERROR`: `public.spatial_ref_sys` sem RLS, relação do PostGIS;
- 4 extensões em `public`: `unaccent`, `pg_trgm`, `citext`, `postgis`;
- 9 funções `SECURITY DEFINER` executáveis por `anon`;
- 85 executáveis por `authenticated`;
- Leaked Password Protection continua desabilitado.

Essas contagens são inventário, não classificação automática de vulnerabilidade.

### Revisão `anon SECURITY DEFINER`

Dos 9 warnings, 3 são `st_estimatedextent` do PostGIS. Os 6 RPCs próprios revisados possuem finalidade pública/anon explícita e filtros de autoridade/visibilidade: poll publicado, reputação profissional pública, resumo de rating autorizado, share de corrida por token ativo, projeção territorial pública e analytics.

`track_analytics_event` recebeu probe negativo rollback-only no Supabase real:

- spoof de outro `user_id` por caller autenticado foi bloqueado;
- `order_completed` por caller não-`service_role` foi bloqueado;
- nenhum fixture persistiu;
- probe versionado em `tests/security/analytics-anon-authority-remote-probe.sql`.

### RLS default-deny de Mobilidade

`mobility_price_quotes` e `ride_state_audit` têm RLS ligado, nenhuma policy e nenhum grant para `anon`/`authenticated`; apenas `postgres`/`service_role`. O finding `RLS enabled no policy` nesses dois casos é deny-by-default intencional.

## P1 — LGPD / privacidade

Relacionado: issue #68.

### Autoridade reversível reconciliada

A migration canônica aplicada é `20260826015916_reconcile_account_deletion_authority_live_drift`:

- `public.account_deletion_requests` existe;
- `get_account_deletion_status_for_user`, `request_account_deletion_for_user` e `cancel_account_deletion_for_user` existem;
- browser roles não têm autoridade direta;
- a migration declara explicitamente que não implementa purge destrutivo nem apaga `auth.users`.

As migrations históricas `20260821...` não devem ser reaplicadas como atalho.

### Purge destrutivo — gate novo

Não existe cron/worker de purge atualmente.

Levantamento read-only do schema vivo encontrou **28 FKs bloqueantes** (`NO ACTION`/`RESTRICT`) que exigem decisão explícita antes de excluir fisicamente `auth.users`/`profiles`:

- 20 apontam para `auth.users`;
- 8 apontam para `profiles`;
- 25 usam colunas anuláveis;
- 3 são não anuláveis + `RESTRICT`:
  - `communication_publications_author_profile_id_fkey`;
  - `community_user_moderation_actions_actor_profile_id_fkey`;
  - `trust_admin_actions_applied_by_profile_id_fkey`.

Foi criado `docs/09-reference/governance/privacy/LGPD_PURGE_MATRIX.json` com default `block`, `implementationComplete=false` e as 28 referências como `unclassified`.

O preflight `tools/security/supabase-lgpd-edge-rollout-preflight.mjs` agora só pode liberar `user-delete-account` quando:

- não houver marcadores stale;
- existir `const LGPD_PURGE_IMPLEMENTATION_COMPLETE = true;` no handler;
- a matriz estiver estruturalmente válida;
- `implementationComplete=true`;
- houver zero referências `unclassified`.

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
3. classificar advisor `authenticated SECURITY DEFINER` por risco/autoridade, adicionando negative probes nos comandos sensíveis;
4. continuar a matriz LGPD apenas com decisões de retenção explicitamente aprovadas;
5. repetir build/deploy real no SHA final após qualquer alteração de source.

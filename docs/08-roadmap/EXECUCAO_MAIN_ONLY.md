# Achegue-se — Execução `main`-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Data do checkpoint GitHub:** 2026-09-09  
**Repositório:** `washingtonmsdj/acheguese`  
**Linha ativa:** `main`  
**HEAD técnico de código anterior a este checkpoint documental:** `9c48494514fcf04d8f756b0a0a9a5deb4770c267`

Este documento consolida ordem de execução, blockers e Definition of Done. Ele é um **registro operacional**, não uma fotografia autoritativa do que existe no produto. A fonte de verdade para decidir o que existe, o que está ativo e o que deve ser corrigido é sempre o **projeto real**: código da `main`, rotas, owners, serviços, schema/migrations, contratos, testes, deploy/runtime e comportamento observado.

## Checkpoint 2026-09-09 — Mobilidade: remoção de bridges mortos e reconciliação runtime

Estado técnico anterior a este checkpoint documental: `d3490f45630f3d02117d4abe65d4473da70ca2fa`.

- [x] removido `src/modules/mobility/components/driver/DriverSettingsLayout.tsx`: re-export sem callers; o owner real permanece em `src/core/mobility/components/driver/DriverSettingsLayout.tsx`;
- [x] removido `src/modules/mobility/components/driver/ServiceAreaSettings.tsx`: wrapper sem callers; a capacidade permanece no `ServiceAreasManager` canônico;
- [x] ratchet `tests/security/mobility-driver-coverage-authority.test.ts` agora impede retorno desses bridges e do hook `useDriverServiceArea`;
- [x] runtime Supabase canônico reconfirmado `ACTIVE_HEALTHY`;
- [x] `mobility-rpc` remoto está em **v20 ACTIVE**, `verify_jwt=true`, e o source remoto é byte-a-byte igual ao arquivo versionado na `main`;
- [x] `ride_requests`: `authenticated` possui apenas `SELECT`; `INSERT/UPDATE/DELETE` continuam exclusivos de `service_role`;
- [x] `service_areas`: `anon/authenticated` possuem apenas `SELECT`; writes continuam exclusivos de `service_role`;
- [x] não existe coverage persistida em `service_areas` no snapshot atual; logo, a limpeza acima não removeu dados ou capacidade operacional;
- [x] existe rollout de Mobilidade ativo no banco para um território, mas o rollout público global continua launch-paused e **não deve ser habilitado** sem certificação completa.

**Próximo gate:** continuar a certificação de Mobilidade pela autoridade real: validar os casos positivos/negativos do broker v20 e dos commands de disponibilidade/dispatch, depois E2E operacional e smoke responsivo no mesmo SHA. Não reintroduzir wrappers em `src/modules`, writers diretos no browser ou tabelas paralelas para acelerar o gate.

## Checkpoint 2026-09-09 — Mobilidade G15: dispatch audit somente atômico

- [x] ações browser/broker obsoletas `logDispatchAttempt` e `updateLatestDispatchAttempt` removidas de `mobility-rpc`, `MobilityRpcService` e `MobilityAuditService`;
- [x] helpers genéricos `canWriteDispatchAudit` e `requireDispatchWriteAccess` removidos do broker;
- [x] migration canônica `20260909180639_retire_legacy_mobility_dispatch_audit_rpcs_g15.sql` aplicada no Supabase e versionada em Git;
- [x] `can_write_ride_dispatch_audit`, `log_ride_dispatch_attempt` e `update_latest_ride_dispatch_attempt` removidas do banco após prova de zero dependentes;
- [x] `ride_dispatch_audit` continua preservado e é escrito pelos commands server-owned atômicos de dispatch;
- [x] `mobility-rpc` remoto: **v21 ACTIVE**, `verify_jwt=true`, source remoto idêntico ao arquivo da `main`;
- [x] advisors de segurança não reportam os helpers aposentados;
- [x] ratchet de segurança atualizado para impedir retorno do caminho pré-atômico.

**Próximo gate:** revisar as autorizações genéricas restantes do broker por ação concreta, começando por resolução de entrega falha e liberação de disponibilidade. Preservar somente atores com necessidade operacional real; não criar nova authority paralela.

## Checkpoint 2026-09-09 — Dependências de produção G17: blocker de audit corrigido

- [x] causa real do último build Vercel inspecionado: `npm audit --omit=dev --audit-level=moderate` bloqueou o deploy por vulnerabilidade crítica em `maplibre-gl <= 6.4.0`;
- [x] `maplibre-gl` migrado de 5.21.1 para **6.4.1**, primeira release corrigida, com lockfile alinhado;
- [x] migração v6 aplicada de forma estrutural: imports ESM por namespace, worker Vite dedicado via `?worker&url` + `setWorkerUrl`, sem default import antigo;
- [x] resolução de imagens ausentes migrada de `styleimagemissing -> addImage` para `setMissingStyleImageResolver`, exigido pela API v6;
- [x] cópias de produção de `postcss-selector-parser` sob Tailwind/PostCSS Nested atualizadas de 6.1.2 para **6.1.4**; o 6.0.10 restante é dependência exata de tooling de desenvolvimento e fica fora do audit `--omit=dev`;
- [x] ratchets adicionados em `tests/security/maplibre-runtime-security.test.ts` e `tests/release/vercel-production-security-gate.test.mjs`;
- [ ] **certificação de build ainda não pode ser marcada verde**: o status Vercel do SHA atual respondeu `Deployment rate limited — retry in 24 hours` no plano Hobby. Isso é blocker externo de execução, não prova de compilação aprovada;
- [ ] repetir o gate de produção no mesmo SHA (ou descendente sem mudanças funcionais relevantes) quando o provider liberar novos builds.

**Regra:** não contornar o audit, não reduzir `audit-level`, não usar `npm audit fix --force` e não interpretar rate-limit do provider como aprovação de build.

## Checkpoint 2026-09-09 — Mobilidade G18/G19: fechamento terminal atômico

Problemas confirmados no código/runtime:
- `logRideStateChange` ainda permitia ao participante gerar entradas genéricas em `ride_state_audit`, embora os commands atômicos já fossem os owners reais das transições;
- `cancelPendingOffers` executava uma segunda escrita depois do cancelamento da corrida, permitindo estado terminal com oferta ainda aberta se a chamada seguinte falhasse;
- `releaseDriverAvailabilityForRide` / `DriverAvailabilityService.releaseBusy` também eram uma segunda escrita pós-transição, permitindo corrida final com motorista preso em `busy`;
- o primeiro desenho G19A revelou no probe transacional uma violação real de `check_available_requirements`: motorista online sem coordenadas não pode ser marcado `is_available=true`.

Correção de raiz aplicada:
- [x] audit genérico de estado removido do browser, broker, facade e pós-transição; o PIN mantém auditoria própria server-owned em `operational_verifications`;
- [x] `MobilityAuditService` e `RideOperationalPostTransition` removidos fisicamente após zero callers;
- [x] migration remota/versionada `20260909185003_atomize_terminal_ride_offer_invalidation_g18.sql`: estado terminal invalida `ride_offers pending/sent` na mesma transação;
- [x] `cancel_pending_ride_offers(uuid)` removida após prova de zero dependentes;
- [x] migration `20260909190551_atomize_terminal_dispatch_driver_release_g19.sql`: o transition command passou a fechar dispatch pendente e liberar ownership `busy` na mesma transação;
- [x] migration corretiva `20260909191423_fix_terminal_driver_release_availability_g19.sql`: auto-retorno para `available` exige motorista online + latitude/longitude + `last_location_update` nos últimos 5 minutos; sem GPS recente, busy é limpo e o motorista permanece `online_warming_up`;
- [x] probe real com `BEGIN/ROLLBACK` comprovou: sem GPS a transição final conclui e não publica disponibilidade; com GPS recente volta disponível; uma corrida diferente não limpa o `active_ride_id` atual; offer, dispatch e audit fecham de forma consistente;
- [x] `mobility-rpc` remoto atualizado para **v24 ACTIVE**, `verify_jwt=true`, com source do entrypoint byte-a-byte igual à `main`;
- [x] broker v24 não contém `logRideStateChange`, `cancelPendingOffers`, `releaseDriverAvailabilityForRide` nem `canAccessRideAsParticipantOrAdmin`;
- [x] migration `20260909191733_retire_terminal_driver_release_helper_g19.sql` removeu `release_driver_availability_for_ride(uuid,uuid)` depois do cutover do Edge e de prova de zero dependentes/referências;
- [x] snapshot pós-cutover: **0** corridas finais com offers abertas, **0** dispatch `pending` e **0** motoristas busy ligados a corrida final;
- [x] Gate 5 operacional agora verifica o próprio transition command, inclusive isolamento por `active_ride_id` e fluxo motoboy `delivered -> completed`;
- [x] advisors pós-DDL não registraram finding novo específico de G18/G19; `ride_state_audit` continua RLS sem policy como superfície server-owned/fail-closed.

**Estado:** G18/G19 fechados no banco e no Edge. Mobilidade permanece `PUBLIC_LAUNCH_SURFACES.mobility=false`: isto corrige autoridade/atomicidade, mas não substitui a certificação E2E/same-SHA/deploy.

**Próximo gate:** continuar a auditoria por operação concreta das funções `SECURITY DEFINER` ainda executáveis por `authenticated`, priorizando safety share, lifecycle/trust e leitura/escrita de dados de corrida. Não recriar helpers genéricos para facilitar o browser.

## Regra máxima — projeto primeiro, documentação depois

Esta regra é obrigatória para qualquer IA/agente que continuar o Achegue-se:

1. **não decidir remoção, adiamento, escopo ou arquitetura apenas lendo docs**; antes de qualquer decisão estrutural, inspecionar o código e o estado real do projeto;
2. docs podem estar desatualizadas, incompletas ou obsoletas; quando houver conflito, **o projeto implementado + evidência de runtime + direção explícita do produto prevalecem**, e a documentação deve ser corrigida para refletir a realidade;
3. uma feature, módulo, fluxo ou integração **não pode ser removido simplesmente porque está quebrado, incompleto, pausado ou com teste falhando**;
4. se a feature faz sentido no produto, já possui implementação relevante e continua coerente com a visão do Achegue-se, a ação padrão é **investigar → corrigir causa raiz → consolidar owner/SSOT → testar → certificar**;
5. `launch-paused`, feature flag `false`, fallback ou indisponibilidade temporária são **gates de segurança/release**, não marcações de código descartável;
6. não usar "MVP" como justificativa para amputar capacidades já construídas e coerentes; o MVP deve organizar e estabilizar o que é necessário, não destruir trabalho válido;
7. remoção é permitida para **legado real**, duplicação, compatibility bridge, owner substituído ou implementação comprovadamente sem função no produto — e somente depois de migrar callers/estado necessários e provar que o caminho canônico preserva a capacidade;
8. quando uma implementação antiga e uma nova concorrem, **preservar a capacidade funcional**, escolher/consolidar o owner correto e então retirar apenas a duplicação/legado;
9. nunca "corrigir" o sistema apagando uma feature só para fazer build/test passar;
10. depois de cada decisão relevante, atualizar este arquivo para que a documentação passe a refletir o projeto — nunca o contrário.

### Evidência mínima antes de classificar algo como legado

Antes de remover qualquer feature, módulo, rota, serviço, tabela, RPC ou integração, comprovar no mínimo:

- callers/imports e rotas reais;
- owner canônico atual e possível duplicação;
- uso em serviços/hooks/pages/Edge Functions;
- dependências de schema/migrations/RLS quando houver;
- testes/contratos associados;
- impacto no fluxo de usuário e na visão do produto;
- existência de substituto funcional equivalente quando aplicável.

**Ausência em documentação não é evidência de legado. Falha de runtime não é evidência de legado. `launchScope=false` não é evidência de legado.**

## Checkpoint 2026-09-09 — Mobilidade / Central: SSOT e prova operacional

A retomada do primeiro módulo da ordem de certificação fechou regressões estruturais antes de qualquer tentativa de habilitar o rollout:

- [x] rota legada `/create-driver` removida novamente do roteador ativo;
- [x] teste anti-regressão de onboarding corrigido para inspecionar o owner real `src/app/routes/sections/AppLayoutRoutes.tsx`, em vez do agregador antigo;
- [x] E2Es de launch-scope/Central deixaram de preservar `/create-driver` como comportamento válido;
- [x] `src/core/mobility/routes/mobilityRoutes.ts` ampliado para ser SSOT também das rotas públicas, histórico, emergência e tracking;
- [x] `AppLayoutRoutes.tsx` passou a consumir os paths canônicos de Mobilidade em vez de duplicar strings;
- [x] `useMobilityUrls().home` corrigido de `/mobilidade/passageiro` para a home real `/mobilidade`, evitando navegação de volta para a própria tela;
- [x] tracking do passageiro, retorno da busca, ação SOS e sincronização de contexto de perfil passaram a reutilizar o SSOT de rotas;
- [x] `tests/e2e/mobility-operational.spec.ts` não aceita mais `LaunchPausedPage` como prova operacional; com `mobility: false`, o teste é explicitamente `skip`, e quando habilitado exige estado operacional/onboarding real.

**Estado de certificação:** Mobilidade continua **launch-paused e NÃO certificada**. Este checkpoint melhora a confiabilidade da prova; não autoriza alterar `PUBLIC_LAUNCH_SURFACES.mobility` para `true`.

**Próximo gate obrigatório:** reconciliar schema/migrations do ambiente alvo e comprovar RLS/grants/autorização positiva e negativa para motorista, motoboy, passageiro, corridas, entregas, chat e operações sensíveis. Só depois executar E2E operacional real, smoke responsivo e prova de deploy do mesmo SHA.

## Checkpoint 2026-09-09 — Mobilidade: autoridade de escrita server-owned

A auditoria/correção do primeiro módulo da ordem de certificação avançou do hardening parcial para um contrato de escrita server-owned no agregado `ride_requests`.

### Fechado neste checkpoint

- [x] `ride_state_audit` é append-only/backend-owned; `anon/authenticated` não possuem INSERT direto;
- [x] transições de corrida usam `mobility_transition_ride_state_atomic`, com lock `FOR UPDATE`, matriz de estados, timestamps e audit na mesma transação;
- [x] metadata/transições de entrega usam commands atômicos dedicados; confirmação de coleta, entrega e falha não dependem de UPDATE genérico do browser;
- [x] dispatch/aceite/expiração foram movidos para commands server-side, incluindo expiração de 15 minutos e liberação do motorista;
- [x] redispatch administrativo usa command específico e a Central Motoboy deriva elegibilidade de ação da state machine;
- [x] confirmação de conclusão pelo passageiro passou a usar `passenger_confirmed_at` canônico, command idempotente e ator derivado do JWT;
- [x] `AutoDispatchService` browser duplicado e `RideRepository` legado foram removidos;
- [x] helpers/facades genéricos de `UPDATE ride_requests` e creators diretos legados foram removidos;
- [x] criação de corrida e entrega passou pelo broker `mobility-rpc`; o browser não escolhe `status`, motorista, preço final, timestamps operacionais ou prova de entrega;
- [x] criação de entrega revalida no backend Profile solicitante, rollout efetivo, `motoboy_enabled`, associação de Empresa/Gastronomia/Serviço e entitlement aplicável;
- [x] origem gastronômica é vinculada server-side: `sourceId=orders.id`, `authorizationSourceId=restaurante`; o pedido deve ter `merchant_profile_id` igual ao Profile da empresa autorizada, `source_type=gastronomy`, `source_id=business_data.id`, não estar terminal e não possuir outra entrega ativa;
- [x] probe remoto do vínculo gastronômico: 75 pedidos, 0 sem `business_data`, 0 divergências `merchant_profile_id ↔ business.profile_id` e 0 rides gastronômicas ativas no snapshot validado;
- [x] migrations de criação atômica `20260909140626_add_atomic_mobility_creation_commands_g6.sql` e revogação de INSERT `20260909141356_revoke_browser_ride_request_insert_g6.sql` estão aplicadas no Supabase canônico e versionadas em Git;
- [x] migrations `20260909135451_revoke_browser_ride_request_update_g6.sql` e `20260909131721_revoke_browser_ride_request_delete_g6.sql` mantêm UPDATE/DELETE do browser fechados;
- [x] `MobilityRideRequestWriteAuthority.test.ts` ratcheta ausência de INSERT/UPDATE direto no runtime e exige os commands/migrations server-owned;
- [x] types Supabase foram regenerados a partir do schema remoto após os novos RPCs.

### Prova remota atual

Projeto Supabase canônico: `xhdowzacfujckjelqhtd`.

- `ride_requests`: `anon INSERT/UPDATE/DELETE = false`;
- `ride_requests`: `authenticated INSERT/UPDATE/DELETE = false`;
- `ride_requests`: `service_role INSERT/UPDATE/DELETE = true`;
- policies restantes: `Admins can manage ride requests:ALL` e `Ride participants view:SELECT`;
- `ride_state_audit authenticated INSERT = false`;
- `mobility_create_ride_atomic`: `anon_execute=false`, `authenticated_execute=false`, `service_role_execute=true`;
- `mobility_create_delivery_atomic`: `anon_execute=false`, `authenticated_execute=false`, `service_role_execute=true`;
- `mobility-rpc` remoto: **v16 ACTIVE**, `verify_jwt=true`, SHA do bundle `369b00523065d17e84b6bf6f2a57d588758435b9419be1a324c22cae41526594`;
- baseline técnico da `main` antes desta atualização documental: `9fb40b1368d2832ae0d328c354f050a827e82b92`;
- `PUBLIC_LAUNCH_SURFACES.mobility` permanece **false**.

### O que isto NÃO certifica

Este fechamento prova a autoridade estrutural de escrita de `ride_requests`; ele **não** certifica ainda o módulo Mobilidade para lançamento.

Continuam obrigatórios antes de `mobility:true`:

1. executar casos positivos e negativos reais de autorização para passageiro, motorista, motoboy, Empresa/Gastronomia/Serviço e admin;
2. provar criação → busca → dispatch → aceite → deslocamento → conclusão/cancelamento no runtime real;
3. provar entrega → coleta → rota → PIN/prova → conclusão/falha/redispatch;
4. validar chat/tracking/realtime e ausência de vazamento entre participantes;
5. executar smoke responsivo das superfícies passageiro, motorista, motoboy e Central;
6. executar typecheck/test/build/E2E reais no **mesmo SHA** quando a infraestrutura de execução estiver disponível;
7. provar deploy do mesmo SHA no ambiente alvo;
8. somente depois considerar `PUBLIC_LAUNCH_SURFACES.mobility = true`.

**Próximo gate obrigatório:** autorização positiva/negativa + E2E operacional + smoke responsivo. Não reabrir DML direto de `ride_requests` como atalho para testes.

## Regras de execução

1. trabalhar somente na `main` durante a estabilização atual;
2. não criar branch nova para correções deste programa;
3. revalidar o HEAD antes de cada write e nunca usar force update;
4. **inspecionar primeiro o projeto real; docs são registro auxiliar e devem ser corrigidas quando divergirem do código/runtime**;
5. owner/SSOT deve ser inequívoco e cada migração deve possuir ratchet/gate proporcional ao risco;
6. commit não equivale a runtime, teste ou deploy validado;
7. não reduzir segurança, CI ou cobertura para obter verde;
8. placeholder, `paused`, fallback vazio ou retorno antecipado não contam como módulo funcional, **mas também não autorizam remover a feature**;
9. feature válida quebrada deve entrar em correção de causa raiz; não postergar indefinidamente nem substituir por remoção cosmética;
10. remover somente legado/duplicação/owner obsoleto depois de preservar ou migrar a capacidade funcional válida;
11. mudanças destrutivas de dados/LGPD exigem validação específica do ambiente alvo.


## Relação com `teste-acheguese`

A partir de 2026-09-09:

- `washingtonmsdj/teste-acheguese` funciona como **laboratório pequeno de território/UX/release**;
- `washingtonmsdj/acheguese` continua sendo o **produto principal consolidado**;
- não existe dual-write de features nem sincronização cega entre repositórios;
- contratos maduros do teste podem ser absorvidos aqui somente quando compatíveis com os owners/SSOTs deste repositório;
- código Next.js do teste **não** deve ser copiado mecanicamente para o app Vite/React;
- padrões aproveitáveis incluem: registry único de navegação, rollout fail-closed, território como contexto, estados vazios honestos, source/deploy provenance e visual Território Vivo;
- módulos já existentes aqui (Community, Empresas, Gastronomia, Educação etc.) não são removidos apenas porque ainda não existem no teste;
- a existência real desses módulos deve ser aferida pelo código, rotas, serviços, schema e runtime da `main`, não pela cobertura documental;
- se um módulo existente estiver quebrado ou incompleto, corrigir e certificar; não usar o laboratório ou uma doc antiga como justificativa para apagá-lo;
- ao absorver uma ideia do teste, preferir consolidar owner existente e remover **somente** duplicação/legado no principal, preservando a capacidade já implementada.

Essa política substitui a antiga ideia de escolher um repositório e abandonar o outro.

## Baseline GitHub confirmado

- `main` é a única linha ativa escolhida para esta estabilização.
- **93 branches existem no snapshot atual:** `main` + **92 refs históricas** pendentes de classificação segura (#84). A contagem foi revalidada diretamente: a página 93 existe e a página 94 está vazia com `per_page=1`.
- `main` permanece sem proteção/ruleset autoritativo no último snapshot confirmado (#28).
- os workflows SSOT foram alinhados com `push` na `main`; alterações em tooling canônico sob `tools/**` e nos arquivos de configuração relevantes devem disparar os gates correspondentes.
- o root legado `scripts/**` está aposentado; workflows/package scripts não devem depender de wrappers recriados nesse caminho.
- a camada GitHub Actions apresentou nesta estabilização falhas pre-step com `steps=[]`/runner não provisionado; nenhum check desse tipo pode ser tratado como prova verde até executar comandos reais (#17).
- o status Vercel inspecionado nesta estabilização falhou por `upgradeToPro=build-rate-limit`; isso é blocker de certificação/deploy, não prova de erro de compilação.

## P0 — SSOT, CI e proteção

### Documentação / autoridade

- [x] `docs/README.md` como porta de entrada documental;
- [x] taxonomia reconciliada com `src/core/verticals/config.ts` (`gastronomy` + `education`; Events não é vertical empresarial);
- [x] plano operacional `main`-only centralizado neste arquivo;
- [x] regressão automatizada para drift de taxonomia;
- [x] ledger de compatibility bridges sincronizado com **zero bridges vivos**;
- [x] censo de repositório sincronizado após retirada de `src/config`, `scripts` e `e2e`;
- [ ] continuar classificação deliberada de `plans/**` e limpeza de documentos substituídos sem quebrar referências vivas (#51).

### CI confiável (#17)

- [x] SSOT workflows alinhados com `push -> main`;
- [x] enforcement observa tooling/config canônicos em vez de depender do root aposentado `scripts/**`;
- [ ] restaurar execução real dos jobs hosted;
- [ ] provar security/lint/typecheck/test/build executando e verdes no mesmo SHA.

### Proteção da `main` (#28)

- [ ] bloquear force-push e deleção;
- [ ] restringir autoridade de push durante o fluxo temporário `main`-only;
- [ ] não configurar required checks falsos enquanto a infraestrutura de CI não executar de verdade.

## P1 — segurança e privacidade

Owners: #85 e #68 (LGPD).

- [x] fronteira de configuração pública `.env` documentada; nenhum `service_role`/provider secret no baseline rastreado;
- [x] `emergency_delivery_log` reclassificado como tabela ativa, server-owned e usada para rate-limit/auditoria;
- [x] hardening adicional de autoridade RPC/PostGIS/analytics foi incorporado na linha atual sem ser sobrescrito pelas refatorações de módulos;
- [ ] continuar auditoria de RLS, grants e `SECURITY DEFINER` client-executable;
- [ ] manter delete/export LGPD fail-closed até revogação de sessão, purge, scheduler e export completo estarem certificados (#68).

## P1 — estrutura e organização (#51)

### Compatibility roots / bridges

- [x] `src/features` aposentado;
- [x] `src/test`, `src/__tests__` e `src/types` aposentados como roots genéricos;
- [x] `scripts/**` aposentado; tooling operacional canônico em `tools/**`;
- [x] `e2e/**` aposentado; owner canônico em `tests/e2e/**`;
- [x] `src/config/**` aposentado depois de migrar todos os callers para owners específicos em `app`, `core` e `shared`;
- [x] `tests/architecture/repository-reorganization-contract.test.ts` bloqueia recriação de `src/config` e imports legados como `@/config/territory`;
- [x] `docs/03-architecture/COMPATIBILITY_BRIDGES.md` registra zero compatibility bridges vivos.

A remoção física dos compatibility roots está concluída no nível estrutural. Isso **não** certifica G2 por si só: documentação residual, `plans/**` e certificação same-SHA continuam pendentes.

### Education — ownership técnico

**Concluído nesta retomada:**

- [x] remover declaração falsa de “Production Ready” do README do módulo;
- [x] centralizar contratos em `src/core/education/contracts.ts`;
- [x] mover Observability para `src/core/education/services`;
- [x] mover Tracking para `src/core/education/services`;
- [x] mover read model `education.queries.ts` para `src/core/education/services`;
- [x] mover write model `education.mutations.ts` para `src/core/education/services`;
- [x] mover `schoolStageOptions` compartilhado para `src/core/education/constants`;
- [x] aposentar os seis paths de compatibilidade em `src/modules/business/education` após zero callers de runtime;
- [x] levar o baseline de acesso runtime direto a `@/integrations/*` em `src/modules/business/education` de 4 arquivos para **zero**;
- [x] `tools/architecture/validate-education-module-boundaries.ts` bloqueia acesso runtime direto e a recriação dos bridges aposentados;
- [x] `tests/architecture/education-module-boundary-ratchet.test.ts` exige owners canônicos e ausência física dos bridges aposentados.

**Ainda não certificado:**

- [ ] schema/RPC/migrations do ambiente alvo reconciliados;
- [ ] RLS/grants e autorização positiva/negativa comprovados;
- [ ] fluxo público listagem → detalhe com dados reais validado;
- [ ] fluxo operacional mínimo validado;
- [ ] E2E/smoke/deploy do mesmo SHA comprovados;
- [ ] somente depois remover `launch-paused`.

### Events — owner físico consolidado

- [x] classificar Events como bounded context comunitário, não vertical empresarial;
- [x] mover persistência de engagement para `core` e aposentar o bridge module-local após zero callers;
- [x] pré-validar a implementação antiga contra as fronteiras do destino durante a migração;
- [x] mover a implementação física para `src/modules/community-events` preservando a árvore de código;
- [x] atualizar a rota territorial para carregar `@/modules/community-events/pages/EventsListPage`;
- [x] atualizar o deploy validator para inspecionar o owner canônico de Events;
- [x] remover integralmente `src/features/events` e retirar a allowlist de migração;
- [x] aposentar integralmente o namespace histórico `src/core/verticals/events` sem criar segundo owner;
- [x] adicionar ratchets de arquitetura para bloquear recriação dos owners históricos e drift de rota/deploy;
- [x] retirar os owners legados do architecture registry.

**Ainda não certificado:**

- [ ] provar schema/RLS/grants e fluxos reais do módulo no ambiente alvo;
- [ ] provar typecheck/test/build/E2E/deploy do mesmo SHA.

### Higiene de repositório e testes

- [x] zero implementações `*.test.*`/`*.spec.*` diretamente em `tests/`; ratchet arquitetural exige a raiz limpa;
- [x] Mobility integration migrado para `tests/integration/mobility` com imports `@/`;
- [x] `playwright.mapa.config.ts` morto removido e script Maps apontado ao config canônico;
- [x] Security Check Maps deixou de referenciar arquivos sintéticos inexistentes e usa validators canônicos;
- [x] `tsconfig.typecheck.events-checkin.json` órfão removido;
- [x] `bun.lock` removido; `package-lock.json` permanece como lockfile do package manager npm declarado;
- [x] guard de artifacts de raiz impede regressão dessas decisões.

## P1 — certificação funcional dos módulos (#50)

Arquitetura limpa não equivale a módulo certificado.

- Education continua `launch-paused` apesar do ownership técnico ter sido corrigido.
- Gastronomy possui implementação real e dívida direta de integração do módulo zerada, mas ainda depende de prova de banco/RLS/E2E/deploy.
- Events possui owner físico canônico, mas não está certificado funcionalmente.
- Mobilidade territorial permanece pausada.

Ordem de certificação:

1. Mobilidade / Central motorista-motoboy;
2. Central + Empresas/Gastronomia/Educação + Profissionais;
3. Comunidade (incluindo Events);
4. Classificados/jobs + mensagens + perfil/trust;
5. Admin, comunicação territorial, guide, AI e auxiliares.

Para cada módulo exigir: entrypoint canônico, banco/RPC atual, autorização positiva/negativa, fluxo principal real, loading/empty/error/auth corretos, E2E sem placeholder e smoke responsivo.

## P2 — higiene E2E e branches

- [x] provenance explícita das fixtures `business_data` (`source=e2e`, `source_kind=technical_fixture`) centralizada nos clients operacionais e protegida por regression guard (#83, concluído no nível de código);
- [ ] classificar as **92 refs históricas** e reconstruir na `main` qualquer delta útil antes de removê-las (#84);
- [ ] não fazer merge/delete em massa: cada ref histórica precisa de classificação de provenance e utilidade antes da decisão.

## Definition of Done — MVP

O Achegue-se só pode ser marcado **MVP READY** quando todos os itens abaixo forem comprovados:

- [ ] SSOT documental/arquitetural sem referência canônica quebrada conhecida;
- [ ] `main` protegida e sem linha operacional concorrente;
- [ ] security/lint/typecheck/test/build executando de verdade e verdes no mesmo SHA;
- [ ] migrations/Edge/source reconciliados com o runtime correspondente;
- [ ] LGPD seguro ou explicitamente indisponível/fail-closed até certificação;
- [ ] módulos MVP certificados por fluxo real, nunca por placeholder/paused;
- [ ] autorização sensível coberta por casos negativos;
- [ ] deploy do SHA aprovado comprovado no provider;
- [ ] smoke funcional do ambiente alvo sem erro crítico recorrente;
- [ ] rollback/recuperação documentados para mudanças operacionais relevantes.

## Commits relevantes desta retomada

- `fa57cac` — persistência de engagement de Events para `core`;
- `9de277e` — Gastronomy com dívida direta de integração do módulo zerada e ratchet estruturado;
- `0da8e2e` — implementação de Events movida para `src/modules/community-events`, com rota e deploy guard no owner canônico;
- `3707218` — `src/features` removido e ratchets atualizados;
- `0bf6e2d` — bridge de engagement de Events aposentado;
- `84b1921` — seis bridges locais de Education aposentados após zero callers de runtime;
- `0f08720` / `6ab27e3` — `scripts/**` aposentado e ratcheted;
- `2161167` — root `e2e/**` aposentado;
- `22a94af` — bridge `src/config/launchScope.ts` aposentado;
- `67b70d6` — último bridge (`src/config/territory.ts`) removido e `src/config/**` aposentado;
- `96c9681` — compatibility ledger sincronizado com zero bridges vivos;
- `07bb101` — repository census atualizado após os cortes de G2.

## Trackers canônicos

- #85 — security hardening / RLS / privileged functions;
- #68 — LGPD delete/export;
- #17 — CI security gates;
- #28 — proteção da `main`;
- #51 — estrutura/owners/namespaces;
- #50 — certificação funcional dos módulos;
- #83 — provenance E2E (concluído no nível de código);
- #84 — branches históricas.

### Checkpoint G7 — autoridade de motorista e ofertas fechada no servidor (2026-09-09)

Estado validado no código e no schema canônico antes da correção:
- `driver_data` ainda tinha `INSERT/UPDATE/DELETE` direto para `authenticated` por policies `ALL`; como a tabela mistura cadastro (CNH/veículo) e autoridade operacional, o dono da linha podia tentar alterar verificação, assinatura, rating/estatísticas e capacidades;
- o cadastro de motorista já passava pelo `profile-rpc`, mas flags operacionais de extensão ainda podiam chegar do payload do cliente;
- `ride_offers` ainda mantinha `UPDATE` autenticado legado, apesar de a aceitação de corrida já ser atômica via `mobility-rpc -> accept_ride_atomic`.

Correção aplicada:
- browser não possui mais mutação direta de `driver_data`; mantém somente leitura autorizada por RLS;
- bootstrap comum usa `ensure_owned_driver_data` e nasce sem autoridade operacional;
- bootstrap administrativo foi preservado por `ensure_admin_driver_data`, exigindo admin real no banco e limitado ao próprio perfil driver;
- edição própria usa `update_owned_driver_data`, com whitelist fechada; `is_verified`, assinatura, documentos/background, `can_do_*`, rating e estatísticas ficam fora do payload self-service;
- alteração efetiva de CNH ou veículo invalida automaticamente a verificação e retorna o background para `pending`;
- `profile-rpc` sanitiza cadastro de driver, força documentação não verificada/background pendente e aceita exatamente um modo operacional inicial (motorista ou motoboy);
- `ride_offers` perdeu o `UPDATE` autenticado e a policy antiga de resposta; a tabela e a funcionalidade permanecem, com aceitação pela autoridade atômica existente;
- serviços de frontend/runtime foram apontados aos comandos canônicos, sem tabela paralela e sem camada de compatibilidade.

Prova remota no Supabase canônico:
- migration `harden_mobility_driver_authority_g7` aplicada com sucesso;
- `driver_data`: `SELECT authenticated=true`; `INSERT/UPDATE/DELETE authenticated=false`;
- `ride_offers UPDATE authenticated=false`;
- `ensure_owned_driver_data`, `ensure_admin_driver_data` e `update_owned_driver_data`: `authenticated EXECUTE=true`, `anon EXECUTE=false`;
- funções novas são `SECURITY DEFINER` com `search_path` fixo e `statement_timeout=5s`;
- `profile-rpc` remoto atualizado para v13 `ACTIVE`, `verify_jwt=true`;
- ratchet de fonte: `MobilityDriverAuthority.test.ts`;
- **Mobilidade continua não certificada para lançamento**; não alterar `PUBLIC_LAUNCH_SURFACES.mobility=false`.

Próximo gate obrigatório:
1. fechar autoridade de `driver_availability` e `driver_locations`, preservando presença/GPS legítimos sem permitir que o browser fabrique `active_ride_id`, modo ativo ou estado busy;
2. auditar RPCs `SECURITY DEFINER` autenticadas ligadas a dispatch/trust e provar escopo por participante/território;
3. executar E2E real de motorista + motoboy + passageiro e somente depois considerar rollout público.

### Checkpoint G8 — disponibilidade de motorista server-owned (2026-09-09)

Problemas confirmados:
- `driver_availability` ainda concedia `INSERT/UPDATE/DELETE` a `authenticated` por policy `ALL`, embora contenha `active_ride_id`, `busy_since` e `active_ride_mode`;
- o aceite atômico já marcava o motorista como busy, mas `MobilityOfferService` tentava executar um segundo `setBusy()` no browser e ignorava a falha;
- “pausar disponibilidade” atualizava somente o espelho em `driver_data`, deixando o estado canônico de dispatch potencialmente disponível.

Correção aplicada e provada:
- migration `harden_driver_availability_authority_g8` aplicada no Supabase canônico;
- `driver_availability`: `SELECT authenticated=true`; `INSERT/UPDATE/DELETE authenticated=false`;
- `mobility_update_driver_availability` e `mobility_reconcile_stale_driver_availability` são `SECURITY DEFINER`, com `search_path`/timeout fixos e `EXECUTE` somente para `service_role`;
- browser expressa apenas intenção de presença via `mobility-rpc`; `active_ride_id`, `busy_since` e `active_ride_mode` permanecem propriedade do aceite/release atômico;
- `MobilityOfferService` não chama mais `setBusy()` depois de `acceptRideAtomic`;
- pausa de disponibilidade agora altera primeiro o estado canônico de dispatch;
- reconciliação stale é operação administrativa/server-side e nunca auto-libera motorista busy;
- `mobility-rpc` remoto atualizado para v17 `ACTIVE`, `verify_jwt=true`;
- ratchet: `MobilityAvailabilityAuthority.test.ts`;
- Gate 5 operacional foi atualizado para representar estado busy por fixture administrativa/server-owned, não por API pública `setBusy()`.

### Checkpoint G9 — GPS do motorista brokered e read-only no browser (2026-09-09)

Problemas confirmados:
- `driver_locations` ainda concedia CRUD completo a `authenticated`;
- `TrackingService.updatePosition()` fazia `...metadata` depois de `lat/lng`, permitindo sobrescrever campos do payload genérico;
- tracking/presença aceitavam cliente Supabase injetado, mas o broker estático usava apenas o cliente global, quebrando isolamento de sessão em testes/contextos injetados;
- presença de tracking ainda consultava/escrevia o espelho `driver_data.is_online` em vez do estado canônico `driver_availability`.

Correção aplicada e provada:
- migration `broker_driver_location_writes_g9` aplicada no Supabase canônico;
- `driver_locations`: `SELECT authenticated=true`; `INSERT/UPDATE/DELETE authenticated=false`; `anon SELECT=false`;
- única policy restante é `driver_locations_authorized_read`, preservando leitura do próprio motorista/admin e passageiro em corrida elegível;
- `mobility_update_driver_location` é `SECURITY DEFINER`, `EXECUTE service_role=true`, `authenticated/anon=false`, com validação de ownership e bounds GPS;
- cada atualização de GPS sincroniza também `driver_availability.current_lat/current_lng/last_location_update/last_seen_at`, evitando snapshot de dispatch divergente;
- `TrackingService` envia GPS de motorista por `MobilityRpcService.updateDriverLocation`; o payload de driver não aceita `metadata`;
- `invokeSupabaseBroker` aceita opcionalmente o cliente autenticado da camada chamadora; default global foi preservado para callers existentes;
- `TrackingService.getPresence/updatePresence/heartbeat/reconnect` usam `driver_availability` + broker, não `driver_data.is_online`;
- testes Gate 2/Gate 4 foram ajustados para perfil `driver`, broker autenticado e sem cleanup/upsert browser direto em `driver_locations`;
- `mobility-rpc` remoto atualizado para v18 `ACTIVE`, `verify_jwt=true`;
- ratchet: `MobilityDriverLocationAuthority.test.ts`.

Próximo gate obrigatório:
1. auditar RPCs `SECURITY DEFINER` de Mobilidade/Trust que continuam executáveis por `authenticated` ou `anon`, começando por dados de corrida, safety share, ratings e mutações de lifecycle;
2. provar casos negativos de acesso cruzado entre passageiro/motorista/terceiro;
3. executar typecheck/test/build reais no mesmo SHA quando a infraestrutura hosted estiver disponível;
4. executar E2E real motorista + motoboy + passageiro;
5. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até todos os gates acima passarem.

### Checkpoint G10 — descoberta de ofertas territorial e server-owned (2026-09-09)

Problemas confirmados:
- Open Board/Reservation tentavam ler corridas não atribuídas diretamente de `ride_requests`, mas a RLS canônica da tabela permite somente participantes/admin; o fluxo comum portanto podia retornar vazio apesar de existir oferta elegível;
- `get_ride_offer_trust_decisions` aceitava IDs de corridas não atribuídas com escopo mais amplo do que a superfície real de oferta;
- `get_driver_dispatch_summaries` aceitava IDs arbitrários de motoristas online;
- código de Reservation Board consultava `is_scheduled`/`scheduled_for`, colunas inexistentes no schema remoto; `departure_time` já era o timestamp canônico;
- frontend dizia `requiresSubscription=false`, enquanto a autoridade de aceite/disponibilidade server-side exige assinatura ativa.

Correção aplicada e provada:
- migration `broker_driver_offer_read_model_g10` aplicada no Supabase canônico;
- novo `mobility_list_driver_offers` é `SECURITY DEFINER`, com `search_path`/timeout fixos e `EXECUTE` somente para `service_role`;
- read model exige ownership do perfil driver, perfil ativo/não suspenso, verificação, assinatura ativa, online/disponível, sem corrida ativa e capacidade compatível com `ride_mode`;
- oferta só é retornada quando `pickup_location_id` resolve para o mesmo município operacional do motorista;
- trust do passageiro/cliente é projetado no mesmo read model autorizado;
- `get_ride_offer_trust_decisions(uuid[])` e `get_driver_dispatch_summaries(uuid[])`: `authenticated EXECUTE=false`, preservados apenas para uso interno/server-side;
- Open Board, Reservation Board e Exclusive Offer do `MobilityOfferService` usam `MobilityRpcService.listDriverOffers`;
- caminhos antigos `getOpenBoardOfferRides`, `getReservationOfferRides`, `getExclusiveOfferRideForDriver` e `getAvailableRides` foram aposentados;
- agendamento deriva de `ride_requests.departure_time`; não foram criadas colunas duplicadas `is_scheduled/scheduled_for`;
- configuração de dispatch foi alinhada para `requiresSubscription=true` nas três estratégias;
- `mobility-rpc` remoto atualizado para v19 `ACTIVE`, `verify_jwt=true`;
- ratchet: `MobilityDriverOfferAuthority.test.ts`.

### Checkpoint G11 — descoberta de motoristas vinculada à corrida (2026-09-09)

Problema confirmado:
- `findAvailableDrivers(lat,lng,radius)` aceitava coordenadas arbitrárias sem uma corrida/ator que permitisse comprovar autorização e território;
- o helper dependia da projeção ampla `get_driver_dispatch_summaries`, que foi corretamente fechada em G10;
- fixtures antigas “provavam dispatch” sem autoria de corrida, território do motorista ou coordenadas canônicas da solicitação.

Correção aplicada e provada:
- migration `broker_available_driver_discovery_g11` aplicada no Supabase canônico;
- `mobility_find_available_drivers_for_ride` exige corrida concreta em estado elegível, solicitante dono da corrida ou admin, `pickup_location_id` e coordenadas da origem;
- candidatos são filtrados por mesmo município operacional, `ride_mode`, verificação, assinatura, perfil ativo/não suspenso, online/disponível, sem corrida ativa, GPS presente, heartbeat de no máximo 5 minutos, raio e trust não bloqueado;
- perfis driver pertencentes ao mesmo `user_id` do passageiro são explicitamente excluídos, impedindo auto-dispatch entre perfis do mesmo usuário;
- função é `SECURITY DEFINER`, com `search_path`/timeout fixos; `anon=false`, `authenticated=false`, `service_role=true`;
- `DriverAvailabilityService.findAvailableDrivers(lat,lng,...)` foi substituído por `findAvailableDriversForRide(rideId,...)`;
- `mobility-rpc` remoto atualizado para v20 `ACTIVE`, `verify_jwt=true`;
- Gate 5 foi refeito para usar fixtures técnicas versionadas: passageiro autorizado, motorista elegível no mesmo município, terceiro bloqueado, offline, busy, heartbeat stale e fora do raio;
- probes transacionais `BEGIN/ROLLBACK` no banco real confirmaram: candidato elegível aparece; terceiro sem vínculo recebe bloqueio; motorista do próprio usuário passageiro não aparece; nenhuma mutação de fixture ficou persistida;
- ratchet: `MobilityDriverDiscoveryAuthority.test.ts`;
- advisors de segurança executados após DDL; não surgiu finding novo específico das funções G10/G11.

Próximo gate obrigatório:
1. classificar as funções `SECURITY DEFINER` restantes de Mobilidade/Trust por intenção real: projeção pública por design, comando autenticado com autorização interna ou API ampla indevida;
2. priorizar safety/share, avaliações/trust e comandos administrativos, fechando somente superfícies que realmente ampliem autoridade;
3. executar os testes reais Gate 2/Gate 4/Gate 5 no mesmo SHA quando o runner hosted estiver disponível;
4. executar E2E passageiro + motorista + motoboy;
5. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até certificação funcional completa.

### Checkpoint G12 — compartilhamento público de corrida com token server-owned (2026-09-09)

Auditoria real:
- a policy histórica de `ride_shares` já vinculava `created_by` ao `auth.uid()` e exigia participante da corrida;
- desde 2026-08-19 já existia `private.assign_ride_share_token()` + `trg_assign_ride_share_token`, substituindo qualquer token vindo do cliente por 16 bytes criptográficos codificados em hex;
- portanto o `secureRandomString(32)` Base62 do frontend era redundante, não a autoridade real do token;
- a criação ainda possuía `INSERT authenticated=true`, deixando o browser escolher lifecycle fields embora o token fosse sobrescrito pelo trigger.

Correção aplicada e provada:
- `ride_shares INSERT authenticated=false`; policy `ride_shares_insert_own` removida;
- novo `create_safety_ride_share(ride_id, created_by, expires_in_hours)` é o único comando de criação acessível a `authenticated`;
- comando exige perfil ativo pertencente ao usuário, participante da corrida e corrida em estado ativo; validade fica entre 1 e 168 horas, com padrão existente de 24h;
- o trigger privado pré-existente continua como **único** gerador de bearer token; nenhuma segunda geração foi mantida;
- o trigger `trg_audit_ride_share_insert` continua como **único** produtor de `share_created`; a função não duplica audit;
- `get_shared_ride_safety_data` continua anon por design, mas agora usa contrato exato `^[0-9a-f]{32}$`, `search_path=''` e `statement_timeout=3s`;
- frontend removeu geração/insert direto e usa `create_safety_ride_share`;
- probes transacionais `BEGIN/ROLLBACK` provaram: participante válido cria token e leitura pública resolve; exatamente um audit é produzido; terceiro não cria; corrida terminal não cria;
- ratchet: `tests/security/safety-ride-share-authority.test.ts`;
- advisors de segurança foram executados após o DDL; o warning de `get_shared_ride_safety_data` permanece **intencional e allowlisted**, pois esse endpoint é uma capability pública por bearer token.

Próximo gate obrigatório:
1. auditar `ride_ratings` e feedback/trust por grants/RLS reais, verificando se o browser ainda consegue escrever direto e contornar `submit_ride_rating`/`submit_ride_trust_feedback`;
2. manter projeções públicas de reputação somente quando forem agregadas e intencionalmente públicas;
3. validar chat de corrida e safety mutators por bypass de tabela, não duplicar brokers se a autorização interna já for suficiente;
4. executar same-SHA test/typecheck/build/E2E quando runner hosted estiver disponível;
5. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G20 — lifecycle de Safety Ride Share e provenance reconciliada (2026-09-09)

Auditoria e reconciliação:
- o Supabase já havia aplicado G12 nas versões reais `20260909170152`, `20260909170347` e `20260909170647`, enquanto a `main` guardava o mesmo conteúdo com timestamps posteriores `19:00/19:10/19:20`;
- os três arquivos foram renomeados atomicamente no Git para refletir exatamente o migration history remoto, sem reaplicar SQL;
- o lifecycle terminal de shares já possuía owner canônico: `private.revoke_terminal_ride_shares()` + `trg_revoke_terminal_ride_shares` em `ride_requests`;
- um primeiro corte G20 duplicou temporariamente esse fechamento dentro do transition command; o probe transacional revelou o owner existente porque o resultado terminal foi `revoked`, não `expired`.

Correção final:
- criação de share agora lê a corrida com `FOR SHARE`, serializando criação contra transição terminal;
- `revoke_safety_ride_share` foi endurecida com `search_path=''`, timeout de 3s e semântica idempotente: share inexistente/inativo retorna `false`, não escreve e não duplica audit;
- o trigger privado preexistente permanece como **único owner** da revogação automática no lifecycle terminal;
- migration `20260909192625_restore_canonical_ride_share_terminal_trigger_g20.sql` removeu do transition command a atualização duplicada de `ride_shares`, preservando intactos os owners G19 de offers, dispatch e driver availability;
- probe real `BEGIN/ROLLBACK` comprovou: token server-owned nasce ativo; transição terminal revoga o share; bearer token deixa de resolver imediatamente; primeira revogação explícita retorna `true`, segunda retorna `false`; exatamente um audit `share_revoked`;
- ratchet `tests/security/safety-ride-share-authority.test.ts` protege serialização, idempotência e single-owner;
- warning de `create_safety_ride_share` foi classificado em `SUPABASE_ADVISOR_RESIDUALS.json`; a leitura anônima `get_shared_ride_safety_data` continua allowlisted por design como capability bearer-token.

**Estado:** G12/G20 fechados e reconciliados entre Git e Supabase. Nenhum bypass de INSERT browser em `ride_shares` foi reintroduzido.

Próximo gate obrigatório:
1. auditar chat de corrida por grants/RLS/funções reais: `ensure_ride_chat`, `send_ride_chat_message` e `mark_ride_chat_messages_read`;
2. preservar chat funcional, corrigindo bypass/authority na raiz se existir, sem remover a feature;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até same-SHA tests/build/E2E.

### Checkpoint G21 — chat de corrida server-owned e participante-bound (2026-09-09)

Auditoria real:
- `ride_chats` e `ride_chat_messages` concedem ao browser somente `SELECT`; `INSERT/UPDATE/DELETE` permanecem service-role-only;
- as únicas policies de leitura são participantes da corrida via `private.current_active_profile_id()`;
- `ensure_ride_chat`, `send_ride_chat_message` e `mark_ride_chat_messages_read` são `SECURITY DEFINER` com `search_path=''` e timeout de 3s;
- sender não vem do payload: é sempre derivado do perfil ativo server-side;
- envio é permitido somente a passageiro/motorista da corrida com motorista já atribuído e em estados operacionais não terminais.

Prova transacional `BEGIN/ROLLBACK`:
- passageiro criou o singleton chat e enviou mensagem com sender correto;
- motorista respondeu com sender derivado corretamente e marcou somente a mensagem da contraparte como lida;
- terceiro sem vínculo foi bloqueado;
- após a corrida ficar terminal, nova mensagem foi recusada;
- o browser não possui privilégio direto de INSERT/UPDATE nas tabelas de chat;
- nenhuma fixture permaneceu no banco.

Decisão:
- não criar broker redundante: as RPCs existentes já são comandos autenticados e internamente autorizados;
- warnings dessas três `SECURITY DEFINER` foram classificados em `SUPABASE_ADVISOR_RESIDUALS.json`;
- ratchet `tests/security/mobility-ride-chat-server-authority.test.ts` protege participante, sender server-owned, lifecycle e ausência de DML direto.

**Estado:** G21 fechado sem remover funcionalidade e sem criar camada paralela.

Próximo gate obrigatório:
1. auditar PIN operacional: `verify_operational_pin`, `refresh_operational_pin_for_requester` e `get_operational_verification_status`;
2. provar que passageiro/motorista/terceiro não conseguem contornar ownership, attempts, TTL ou status;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G22 — PIN operacional server-authoritative (2026-09-09)

Auditoria real:
- `operational_verifications` não concede qualquer SELECT/INSERT/UPDATE/DELETE ao browser; tabela permanece service-role-only;
- `refresh_operational_pin_for_requester`, `verify_operational_pin` e `get_operational_verification_status` são `SECURITY DEFINER` com autorização interna;
- requester é o único ator que pode emitir/rotacionar o PIN; assigned driver é o único ator que pode verificá-lo;
- `verified_by` é derivado de `private.current_active_profile_id()`, nunca do payload;
- status RPC não retorna `pin_hash` nem PIN em texto;
- attempts, `last_attempt_at`, expiry e terminal-state guard são server-owned;
- o TTL existente de 24h não abre uso pós-lifecycle: verificação é recusada quando a corrida está terminal.

Prova transacional `BEGIN/ROLLBACK`:
- requester emitiu PIN de 4 dígitos;
- requester foi bloqueado ao tentar se auto-verificar;
- terceiro sem vínculo foi bloqueado ao tentar renovar;
- motorista atribuído errou uma vez e o contador persistiu exatamente 1 tentativa;
- PIN correto verificou com `verified_by` igual ao perfil driver e attempts=2;
- depois de a corrida ficar `completed`, nova verificação foi recusada;
- a projeção de status não revelou material de verificação;
- nenhum dado de fixture permaneceu.

Decisão:
- não reduzir TTL nem criar broker adicional sem requisito funcional: o protocolo atual já é bounded pelo lifecycle da corrida e possui autoridade interna;
- warnings das três RPCs foram classificados em `SUPABASE_ADVISOR_RESIDUALS.json`;
- ratchet `operational-pin-server-authority-security.test.ts` agora protege lifecycle, ownership e attempts.

**Estado:** G22 fechado sem regressão funcional.

Próximo gate obrigatório:
1. auditar mutações Safety de incidente/emergência por ator: `update_safety_incident_status` e `update_safety_emergency_alert_status`;
2. provar que actor_profile_id não permite spoof cross-user/admin;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G23 — criação Safety server-owned e lifecycle fechado (2026-09-09)

Problema real reproduzido:
- `emergency_alerts` e `safety_incidents` ainda concediam `INSERT` direto a `authenticated`;
- as policies validavam ownership/participação, porém o payload podia escolher campos de lifecycle;
- probe reversível confirmou que um usuário autenticado conseguia inserir alerta já `resolved` com `resolved_at` e incidente já `resolved`, contornando os mutators canônicos de status.

Correção de raiz:
- migration `20260909195501_server_own_safety_creation_lifecycle_g23.sql` aplicada e versionada;
- novos commands `create_safety_emergency_alert` e `create_safety_incident` derivam o perfil ativo server-side, validam payload/participação e fixam estado inicial;
- alerta nasce obrigatoriamente `active`, com `resolved_at=NULL`; incidente nasce obrigatoriamente `reported`, com `resolved_at=NULL`;
- timestamps iniciais são server-owned;
- `INSERT authenticated` foi revogado das duas tabelas e as policies antigas de INSERT foram removidas;
- `SafetyService` não executa mais INSERT direto e usa exclusivamente os dois commands;
- triggers existentes de audit e notification permanecem os únicos produtores desses efeitos, sem duplicação;
- os mutators existentes continuam preservados: owner do alerta só pode `false_alarm`; transitions administrativas continuam admin-only; `p_actor_profile_id` precisa pertencer ao usuário autenticado.

Prova pós-correção:
- grants reais: `authenticated INSERT=false` nas duas tabelas e EXECUTE=true apenas nos commands;
- probe correto com `SET LOCAL ROLE authenticated` comprovou que INSERT direto falha;
- criação por command produz exatamente `active/reported`, sem `resolved_at`;
- spoof de outro Profile foi bloqueado tanto na criação quanto no mutator;
- exatamente um audit de criação foi produzido pelos triggers canônicos;
- usuário comum não conseguiu resolver incidente administrativo;
- todas as fixtures foram revertidas com `ROLLBACK`.

Governança:
- ratchet novo: `tests/security/safety-lifecycle-authority.test.ts`;
- warnings dos novos SECURITY DEFINER foram classificados em `SUPABASE_ADVISOR_RESIDUALS.json`.

**Estado:** G23 fechado no banco e no runtime sem remover Safety.

Próximo gate obrigatório:
1. auditar `safety_evidence`, pois a tabela ainda possui INSERT autenticado e representa material sensível;
2. provar vínculo real entre uploader, incidente e objeto de Storage, evitando registro fabricado de URL/path/tamanho/MIME;
3. preservar upload de evidência, corrigindo a autoridade na raiz caso exista bypass;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G24 — evidência Safety vinculada ao Storage real (2026-09-09)

Problema real reproduzido:
- `safety_evidence` ainda concedia `INSERT` direto a `authenticated`;
- a policy validava reporter/incident ownership, mas `file_url`, `file_size`, `mime_type` e metadados eram declarações do cliente;
- probe reversível criou um registro `storage://safety-evidence/<incident>/forged.pdf` quando o bucket possuía **0 objetos**, provando que uma “evidência” podia existir sem arquivo.

Correção de raiz:
- migration `20260909200353_bind_safety_evidence_to_storage_g24.sql` aplicada e versionada;
- novo command `register_safety_evidence` exige Profile ativo igual ao reporter do incidente;
- o command exige objeto real em `storage.objects`, bucket `safety-evidence`, path dentro do incident e `owner_id = auth.uid()`;
- `file_url` é construído server-side; `file_size` e `mime_type` vêm de `storage.objects.metadata`; `uploaded_by` vem do Profile ativo;
- provenance `storage_object_id/storage_created_at` é escrita pelo servidor e sobrescreve tentativa de spoof no metadata do cliente;
- índice único em `file_url` impede registrar o mesmo objeto duas vezes;
- `INSERT authenticated` em `public.safety_evidence` foi revogado e a policy antiga removida;
- policy de DELETE do bucket permite apagar upload órfão para compensação, mas bloqueia objeto já referenciado por `safety_evidence`;
- `SafetyEvidenceService` mantém upload privado pelo `MediaService`, porém o registro passou a usar `register_safety_evidence`.

Prova pós-correção:
- registro de path sem objeto real foi bloqueado;
- INSERT direto foi bloqueado sob `SET LOCAL ROLE authenticated`;
- objeto fixture real gerou referência/tamanho/MIME/uploader a partir do Storage, ignorando spoof de provenance;
- exatamente um audit `evidence_uploaded` foi produzido pelo trigger canônico;
- tentativa de registrar o mesmo objeto duas vezes foi bloqueada pelo índice único;
- catálogo confirmou a cláusula `NOT EXISTS` da policy de DELETE para objetos registrados;
- tentativa de DELETE SQL não foi usada como prova porque o próprio Supabase possui `storage.protect_delete()` e exige Storage API; o teste transacional foi revertido sem deixar fixture.

Governança:
- `tests/security/private-storage-boundaries-security.test.ts` protege o vínculo Storage→DB;
- `validate-upload-ssot.ts` agora exige `register_safety_evidence` e proíbe retorno a INSERT direto;
- warning do novo command foi classificado em `SUPABASE_ADVISOR_RESIDUALS.json`.

**Estado:** G24 fechado sem tornar o bucket público e sem remover upload de evidência.

Próximo gate obrigatório:
1. auditar `emergency_contacts` e seus writers reais;
2. impedir spoof de owner, `is_primary`/lifecycle ou múltiplos primários se o banco ainda aceitar estado inválido;
3. manter Safety funcional e `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G25 — contatos de emergência server-owned (2026-09-09)

Problema real reproduzido:
- `emergency_contacts` ainda concedia `INSERT/UPDATE` direto a `authenticated`;
- RLS protegia ownership, mas o browser podia escrever campos fora do contrato do produto;
- probe reversível confirmou criação com `is_active=false`, `created_at=2001-01-01` e metadata arbitrária;
- a regra de “um contato primário” dependia somente de trigger, sem garantia concorrente por índice.

Correção de raiz:
- migration `20260909200953_server_own_emergency_contacts_g25.sql` aplicada e versionada;
- `create_emergency_contact` aceita somente os campos de criação expostos pelo domínio, exige Profile ativo pertencente ao usuário e deriva lifecycle/metadata/timestamps;
- `patch_emergency_contact` possui allowlist estrita: `name,email,phone,relationship,is_primary,is_active`;
- `profile_id`, `metadata`, `created_at` e demais campos de provenance não podem ser alterados pelo browser;
- desativar um contato força `is_primary=false`;
- índice parcial único `emergency_contacts_one_active_primary_per_profile` garante no banco no máximo um contato `is_primary=true AND is_active=true` por Profile, inclusive sob concorrência;
- `INSERT/UPDATE authenticated` foram revogados e policies antigas removidas;
- `SafetyEmergencyContactsService` passou a usar exclusivamente `create_emergency_contact` e `patch_emergency_contact`.

Prova pós-correção:
- INSERT e UPDATE direto falharam sob `SET LOCAL ROLE authenticated`;
- criação por command nasceu ativa, metadata vazia e timestamps server-owned;
- e-mail foi normalizado server-side;
- criar um segundo contato primário despromoveu o anterior e o banco manteve exatamente um primário ativo;
- patch com `created_at/metadata` foi bloqueado;
- patch legítimo preservou `created_at`;
- desativação removeu corretamente o estado primário;
- fixtures revertidas com `ROLLBACK`.

Governança:
- ratchet `tests/security/emergency-contacts-authority.test.ts`;
- warnings de `create_emergency_contact` e `patch_emergency_contact` classificados em `SUPABASE_ADVISOR_RESIDUALS.json`.

**Estado:** G25 fechado no banco, service e governança sem remover contatos de emergência.

Próximo gate obrigatório:
1. auditar envio a contatos externos e `emergency_delivery_log`: autenticação da Edge Function, ownership do alerta/contato e writes do log;
2. impedir disparo arbitrário para contatos de outros usuários ou fabricação de delivery status/target;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G26 — broker de e-mail de emergência lifecycle-bound (2026-09-09)

Auditoria real:
- `send-emergency-email` remoto v31 estava ACTIVE, `verify_jwt=true`, e o source remoto era byte-equivalente à `main` após normalização de EOL;
- o broker já aceitava somente `alertId/contactId`, autenticava o usuário, carregava Profiles/alert/contact no backend e exigia alerta pertencente ao usuário + contato ligado ao mesmo Profile e ativo;
- `emergency_delivery_log` está completamente fechado ao browser: somente `service_role` possui DML e não existem policies públicas;
- rate-limit persistente usa o próprio delivery log server-owned;
- o gap restante era lifecycle: o broker não selecionava `alert.status`, permitindo reenvio de e-mail para alerta já `resolved`/`false_alarm` em janelas futuras.

Correção aplicada:
- `AlertRecord` e a query canônica passaram a carregar `status`;
- o broker agora bloqueia qualquer alerta diferente de `active`, audita `reason=alert_not_active` e retorna 409 antes de consultar/enviar para o provider;
- nenhuma alteração em recipient derivation, Resend secret, rate limit ou delivery-log ownership;
- função redeployada como `send-emergency-email` **v32 ACTIVE**, mantendo `verify_jwt=true`;
- source remoto v32 confirmado exatamente igual à `main`;
- ratchet `safety-notification-core-security.test.ts` protege seleção do status e o guard `alert.status !== 'active'`.

**Estado:** G26 fechado. Alertas encerrados não podem voltar a disparar e-mail externo.

Próximo gate obrigatório:
1. inventariar writers autenticados restantes em tabelas Safety após G23–G26;
2. corrigir somente DML que ainda permita alterar autoridade/lifecycle/provenance;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G28 — moderação de motorista append-only (2026-09-09)

Reconciliação runtime > docs:
- `driver_moderation_events` é declarado desde a migration original como trilha **imutável**, mas o banco real ainda concedia INSERT/UPDATE/DELETE a `authenticated` via policy admin `FOR ALL`;
- o runtime `DriverModerationEventsService.createEvent` ainda fazia INSERT direto e aceitava `adminProfileId` vindo do browser;
- a referência documental antiga a `20260718163000` como hardening dessa trilha estava incorreta: a migration real desse timestamp é `harden_profile_verification_transitions` e não altera `driver_moderation_events`;
- tabela possuía 0 eventos persistidos no momento da correção, então não houve transformação de histórico existente.

Correção de raiz:
- migration `20260909204327_lock_driver_moderation_history_g28.sql` aplicada e versionada;
- novo command `append_driver_moderation_event` exige role admin/super_admin válida e deriva `admin_profile_id` de um Profile ativo **pertencente** ao usuário autenticado;
- `created_at` é server-owned;
- action, reason e metadata possuem validação bounded;
- `INSERT/UPDATE/DELETE authenticated` foram revogados da tabela;
- policy admin `FOR ALL` foi removida e substituída por SELECT-only;
- motorista mantém SELECT do próprio histórico;
- `DriverModerationEventsService` passou a usar apenas a RPC de append;
- `adminProfileId` foi removido do contrato do service, do runtime admin e do hook do painel;
- adapter tipado estreito evita editar manualmente `types.generated.ts` antes da próxima sincronização canônica.

Prova transacional `BEGIN/ROLLBACK`:
- admin real ativo conseguiu append;
- `admin_profile_id` retornado pertenceu ao usuário admin autenticado e o timestamp foi produzido pelo servidor;
- INSERT, UPDATE e DELETE direto falharam sob role SQL `authenticated`;
- motorista não-admin conseguiu ler o próprio evento;
- motorista não-admin foi bloqueado ao tentar append;
- após ROLLBACK, `driver_moderation_events` voltou ao count original 0.

Governança:
- ratchet `tests/security/driver-moderation-authority.test.ts`;
- warning esperado de `append_driver_moderation_event` classificado em `SUPABASE_ADVISOR_RESIDUALS.json`.

**Estado:** G28 fechado; a trilha de moderação agora corresponde ao contrato imutável declarado pelo próprio projeto.

Próximo gate obrigatório:
1. auditar `driver_routes`, a última exceção com DML `authenticated` no inventário operacional Mobility;
2. manter CRUD somente se ownership, lifecycle, payload e callers reais justificarem escrita browser-side;
3. se estiver correto, não criar broker redundante e avançar para same-SHA/runtime/E2E.

### Checkpoint G29 — agregado de rotas fail-closed sem remover a feature (2026-09-09)

Auditoria do runtime:
- `driver_routes`, `route_reservations` e `route_trips` formam a base histórica da capability de rotas/caronas;
- não existe writer runtime atual em `src` para `driver_routes` ou `route_reservations`; o único consumer explícito localizado fora de migrations/types é leitura server-side no export LGPD;
- as três tabelas estavam vazias no banco real;
- `route_trips` já era read-only para `authenticated`, porém `driver_routes` e `route_reservations` ainda concediam INSERT/UPDATE/DELETE com policies antigas `FOR ALL`.

Bypass reproduzido em `BEGIN/ROLLBACK`:
- motorista autenticado criou uma rota própria já em `status='completed'` e com `created_at=2001-01-01`;
- outro usuário autenticado criou reserva nessa rota diretamente em `status='confirmed'`, também com timestamp fabricado;
- ownership RLS não impedia spoof de lifecycle/provenance;
- transação foi revertida e as tabelas voltaram ao count 0.

Correção de raiz:
- migration `20260909205121_fail_close_dormant_route_writes_g29.sql` aplicada e versionada;
- `INSERT/UPDATE/DELETE authenticated` revogados de `driver_routes` e `route_reservations`;
- policies antigas de gerenciamento `FOR ALL` foram removidas;
- leitura histórica do motorista foi preservada por policy SELECT-only `Drivers view own routes`;
- `Reservation participants view`, `Active routes viewable` e `route_trips_participant_read` permanecem;
- nenhuma tabela, FK, tipo, export LGPD ou capability de domínio foi removida;
- o agregado fica preparado para futura implementação correta via commands de lifecycle, em vez de reabrir DML genérico.

Governança:
- ratchet `tests/security/mobility-route-aggregate-authority.test.ts` preserva schema/leitura e proíbe retorno de DML direto no frontend.

**Estado:** G29 fechado. A capability de rotas foi preservada, mas a superfície de escrita latente ficou fail-closed.

Próximo gate obrigatório:
1. refazer o inventário de DML operacional Mobility e confirmar zero writers genéricos fora dos commands/brokers intencionais;
2. congelar a rodada estrutural se o inventário estiver limpo;
3. avançar para certificação same-SHA: source/runtime, testes estáticos disponíveis, build/E2E e responsividade antes de abrir `PUBLIC_LAUNCH_SURFACES.mobility`.

### Checkpoint G30 — Delivery broker-owned até a tabela (2026-09-09)

Reconciliação:
- o runtime atual já usa `OrderDeliverySSOTService -> DeliveryRpcService -> delivery-rpc`;
- `delivery-rpc` remoto observado ACTIVE v8 com `verify_jwt=true`;
- backing RPCs `delivery_report_occurrence` e `delivery_resolve_occurrence` estão `service_role=true`, `authenticated=false`, `anon=false`;
- a arquitetura e o validador já proíbiam writes diretos em `orders`, `order_items`, `order_timeline_events` e `delivery_occurrences`;
- apesar disso, grants/policies históricos ainda concediam DML a `authenticated`: `orders` INSERT/UPDATE/DELETE, `order_items` INSERT e `delivery_occurrences` INSERT/UPDATE.

Correção de raiz:
- migration `20260909205630_close_delivery_direct_table_writes_g30.sql` aplicada e versionada;
- `INSERT/UPDATE/DELETE authenticated` revogados de `orders`, `order_items` e `delivery_occurrences`;
- policies antigas `orders_insert`, `orders_update`, `order_items_insert`, `delivery_occurrences_insert` e `delivery_occurrences_update` removidas;
- policy admin `FOR ALL` de orders foi substituída por SELECT-only, preservando observabilidade administrativa sem reabrir mutação;
- leitura de participantes em orders/items/timeline/occurrences permanece;
- service_role e backing RPCs continuam owners das mutações;
- nenhuma mudança foi feita em payload/lifecycle do delivery-rpc.

Governança:
- `tests/security/delivery-rpc-security.test.ts` agora ratcheta também os grants/policies de tabela;
- `validate-delivery-architecture-boundaries.ts` continua proibindo retorno de DML direto no runtime.

**Estado:** G30 fechado. O contrato broker-owned agora vale também nos grants reais do banco, não apenas no código e nas funções.

Próximo gate obrigatório:
1. congelar novas refatorações estruturais de autoridade se o inventário core Mobility/Delivery estiver limpo;
2. obter SHA atual da `main` e reconciliar fontes remotas críticas (`mobility-rpc`, `delivery-rpc`, migrations);
3. executar o máximo possível da certificação same-SHA sem depender de GitHub Actions: ratchets, validações, build/deploy e smoke/E2E disponíveis;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até a certificação final.

### Checkpoint G31 — aposentadoria de validadores operacionais obsoletos (2026-09-09)

Inventário de código/callers:
- `tools/supabase/validate-gate3-metadata.mjs`, `validate-reconciliation-final.ts` e `validate-constraints-final.ts` eram validadores históricos com `service_role` e DML bruto sobre agregados hoje server-owned;
- nenhum dos três é rota, package script, workflow, Edge Function ou owner funcional vivo;
- `auto-dispatch-ride` foi preservado: é backend vivo, coberto por policy/testes e usa os commands atômicos canônicos;
- testes operacionais que usam admin para fixture/cleanup permanecem separados do runtime de produto e continuam protegidos pelo boundary de ambiente isolado.

Correção de raiz:
- [x] removidos os três validadores obsoletos em vez de adaptá-los para continuar furando a autoridade nova;
- [x] allowlist de `GUARDED_MUTATING_OPERATIONAL_ENTRYPOINTS` limpa para não legitimar entrypoints aposentados;
- [x] `SERVICE_ROLE_BOUNDARY_POLICY.json` deixou de autorizar os dois operator scripts removidos que ainda constavam na policy;
- [x] `remote-e2e-mutation-safety.test.ts` ganhou ratchet explícito de ausência dos três paths e das allowlists antigas;
- [x] nenhuma tabela, migration, RPC, Edge Function ou fluxo de usuário foi removido/modificado neste corte.

**Estado:** inventário de tooling operacional reconciliado com a autoridade server-owned atual. Não há motivo para manter scripts de diagnóstico que só funcionam violando o contrato que deveriam validar.

Próximo gate obrigatório:
1. reconciliar o SHA atual da `main` com as fontes remotas críticas (`mobility-rpc`, `delivery-rpc` e migrations aplicadas);
2. executar os ratchets/validators estáticos disponíveis no mesmo SHA;
3. executar build + E2E/smoke responsivo quando o runner/provider estiver disponível;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até a certificação same-SHA final.

### Checkpoint G32 — reconciliação same-SHA do dispatch runtime (2026-09-09)

Reconciliação no Supabase canônico `xhdowzacfujckjelqhtd` contra a `main`:
- baseline Git do início da prova: `84ad26a2bfbc3db43b76ded62d58c60bcca8114f`;
- projeto remoto observado `ACTIVE_HEALTHY`;
- `mobility-rpc` **v24 ACTIVE**, `verify_jwt=true`: entrypoint + `_shared/accountOperational.ts` + `_shared/security.ts` byte-a-byte iguais ao Git;
- `delivery-rpc` **v8 ACTIVE**, `verify_jwt=true`: entrypoint + mesmos shared files byte-a-byte iguais ao Git;
- foi encontrado drift real em `auto-dispatch-ride v24`: o runtime remoto ainda executava o desenho antigo com DML direto em `ride_requests`, `ride_state_audit` e `ride_dispatch_audit`, enquanto o Git já usava os commands atômicos;
- a causa raiz foi corrigida no runtime, sem criar fluxo paralelo: `auto-dispatch-ride` foi redeployado a partir do source canônico do Git e passou a **v25 ACTIVE**;
- `auto-dispatch-ride v25`, `_shared/security.ts` e `_shared/validation.ts` foram re-lidos do runtime e estão byte-a-byte iguais ao Git;
- `verify_jwt=false` foi preservado intencionalmente no auto-dispatch porque ele é job backend autenticado por `CRON_SECRET`, não endpoint de usuário;
- migrations remotas estão presentes até `20260909205630_close_delivery_direct_table_writes_g30`; as 12 migrations finais G18→G30 também existem fisicamente na `main`;
- grants reais confirmam `authenticated` sem `INSERT/UPDATE/DELETE` em `ride_requests`, availability/location, offers, routes/reservations, ride chat/share, orders/items/timeline/occurrences; commands críticos de Mobility/Delivery permanecem executáveis diretamente apenas por `service_role`;
- invariantes pós-cutover: **0** offers `pending/sent` em corrida terminal, **0** dispatch `pending` em corrida terminal e **0** `driver_availability.active_ride_id` apontando para corrida terminal;
- ratchet de `mobility-rpc-security.test.ts` reforçado para exigir os commands atômicos e proibir retorno de UPDATE direto de `ride_requests` ou INSERT/UPDATE direto dos audits no auto-dispatch.

**Estado:** source Git, brokers remotos, auto-dispatch e grants principais estão reconciliados neste checkpoint. A regressão real encontrada no runtime foi corrigida na raiz, não mascarada.

**Não certificado ainda:** isto não equivale a build/E2E/smoke/deploy web same-SHA. `PUBLIC_LAUNCH_SURFACES.mobility=false` permanece obrigatório até essas provas.

Próximo gate:
1. executar ratchets/validators estáticos do SHA deste checkpoint;
2. validar build de produção no mesmo SHA;
3. executar E2E operacional positivo/negativo + smoke responsivo;
4. provar deploy web no mesmo SHA;
5. só então discutir abertura da Mobilidade.

### Checkpoint G33 — remover acesso dinâmico de ServiceAreasService (2026-09-09)

Falha real encontrada no último build Vercel que chegou a executar o gate de arquitetura:
- `incremental-baseline: novo acesso nao autorizado: dynamic-table|<dynamic>|read|src/core/service-areas/services/ServiceAreasService.ts`;
- a causa era `findSingleIdByProfile(table, profileId)`, um mini-cliente Supabase genérico que escolhia `business_data`, `professional_data` ou `driver_data` por nome de tabela;
- **não** foi adicionada exceção ao baseline.

Correção de raiz:
- [x] `ServiceAreasService` deixou de importar/usar Supabase diretamente para resolver identidade;
- [x] `profiles` passa pelo `profileService.getProfileById`;
- [x] empresa usa `getBusinessDataIdByProfileId` do owner canônico de Business;
- [x] Professional ganhou `getProfessionalDataIdByProfileId` dentro de `professional.queries.ts`, exposto pela fachada canônica;
- [x] Mobility ganhou `getDriverDataIdByProfileId` dentro de `mobility.queries.ts`, exposto pela fachada canônica;
- [x] removidos `ProfileEntityDbClient`, `QueryBuilder` local e `findSingleIdByProfile` de Service Areas;
- [x] ratchet de coverage agora exige os owners canônicos e proíbe a volta de `.from(table)` no serviço.

Motivo arquitetural:
- Coverage continua sendo o único owner da persistência de `service_areas`;
- Service Areas apenas orquestra identidade → entidade de cobertura;
- cada tabela de identidade permanece lida pelo próprio domínio, sem novo repositório paralelo e sem acesso dinâmico não rastreável.

**Certificação:** a correção fecha a violação estática conhecida por construção. Build/CI completo ainda precisa rodar no mesmo SHA quando runner/Vercel voltarem a executar; não marcar como PASS antes disso.

### Checkpoint G34A — sincronização bulk canônica de Service Areas (2026-09-09)

Preparação para remover a autoridade duplicada de cobertura em `professional_data`:
- [x] `ServiceAreasService.replaceServiceAreas(profileId, locationIds)` resolve Profile → entidade canônica;
- [x] deduplica `Location IDs` e chama uma única vez `coverageRepository.replaceByEntity`;
- [x] bairros/distritos são persistidos como `CoverageType.DISTRICT`, com primeiro item primário e status ACTIVE;
- [x] a operação usa o comando bulk server-owned `replace_entity_coverage`; não existe loop browser de insert/delete;
- [x] ratchet exige o caminho bulk canônico.

Evidência remota antes da migração:
- `professional_data`: 5 linhas;
- `service_areas` legado JSONB não vazio: 0;
- `service_radius_km` legado não nulo: 0;
- `public.service_areas`: 0 linhas.
Logo não há conteúdo a converter; o trabalho é eliminar a autoridade duplicada do código sem perda de dados.

Próximo corte:
1. cadastro/edição devem selecionar e persistir `locations.id` via `replaceServiceAreas`;
2. remover leitura/escrita de `professional_data.service_areas/service_radius_km` do runtime atual;
3. somente após deploy web do código novo, dropar as colunas legadas no banco para não quebrar o frontend production ainda antigo.

### Checkpoint G13 — avaliações de corrida e privacidade do agregado público (2026-09-09)

Auditoria real:
- `ride_ratings` já estava corretamente server-owned para mutação: `authenticated SELECT=true`, `INSERT/UPDATE/DELETE=false`;
- única policy de tabela permite leitura ao rater, rated ou admin;
- `trust_events` e `trust_admin_actions` já estavam sem qualquer grant de tabela para `authenticated`/anon;
- `submit_ride_rating` e `submit_ride_trust_feedback` já validam perfil ativo, participantes/contrapartes, estado final da corrida, bounds e rate-limit; nenhuma segunda autoridade de escrita foi criada;
- o ponto residual era `get_ride_rating_summary(uuid)`: RPC anon intencional que retornava agregado para qualquer UUID, inclusive perfil privado.

Correção aplicada e provada:
- migration `scope_ride_rating_public_summary_g13` aplicada no Supabase canônico;
- `get_ride_rating_summary` continua sendo projeção agregada pública, mas agora usa `search_path=''` e `statement_timeout=3s`;
- anônimo só recebe histórico real de perfil ativo e público;
- perfil privado continua visível ao próprio usuário, admin ou contraparte com corrida `completed/delivered`;
- terceiro não relacionado recebe resumo neutro `average_rating=0,total_ratings=0`, sem revelar histórico do perfil privado;
- `anon` e `authenticated` mantêm EXECUTE na projeção porque a reputação pública é intencional;
- probe transacional confirmou quatro casos: anônimo+privado oculto, anônimo+público visível, dono/contraparte visível, terceiro autenticado oculto;
- ratchet: `tests/security/ride-rating-trust-authority.test.ts`;
- nenhuma mudança de DML em `ride_ratings`/Trust foi necessária porque o baseline real já estava correto.

Próximo gate obrigatório:
1. auditar tabelas de chat da corrida e confirmar que mensagens/mark-read não possuem bypass direto de escrita;
2. auditar revogação/expiração de shares e lifecycle de safety sem duplicar comandos já autorizados;
3. continuar same-SHA tests/E2E quando runner hosted estiver disponível;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G14 — cobertura territorial canônica de motorista (2026-09-09)

Problemas confirmados no runtime/código:
- `driver_accepted_neighborhoods` ainda era referenciada por mutations antigas, mas a tabela **não existe** no banco canônico;
- o hook `useDriverServiceArea` estava sem consumidores reais;
- `ServiceAreaSettings` já apontava para `ServiceAreasManager`, porém o próprio `ServiceAreasService` ainda usava o schema antigo (`profile_id`, `city`, `neighborhoods`, `is_active`) e tentava `INSERT/UPDATE/DELETE` direto;
- o SSOT real já existia desde `consolidate_coverage_commands`: `public.service_areas` com `entity_type/entity_id/location_id/status` e writes por RPC;
- para `entity_type='mobility_driver'`, o `entity_id` correto é `driver_data.id`, e não `profiles.id`;
- `service_areas` remoto estava vazio, então não havia dados legados a migrar.

Correção aplicada e provada:
- novo comando `upsert_entity_coverage` complementa `replace_entity_coverage`, `remove_entity_coverage` e `update_entity_coverage_status` sem criar nova tabela ou authority paralela;
- point mutation usa `private.require_coverage_entity_write`, advisory lock, bounds de raio/status e single-primary;
- trigger privado `trg_validate_service_area_location_semantics` aplica o invariante cross-table no SSOT: `city` exige Location city; `district` exige district/neighborhood; `radius` aceita city/district/neighborhood; Location precisa estar ativa;
- browser mantém `service_areas SELECT=true` e `INSERT/UPDATE/DELETE=false`; `upsert_entity_coverage`: anon=false, authenticated=true, service_role=true;
- `ServiceAreasService` foi refeito como adapter Profile -> Coverage e resolve business/professional/driver para o `entity_type/entity_id` real;
- `CoverageRepositorySupabase` ganhou `upsertByEntity` e todas as mutations continuam por RPC server-owned;
- formulário de área de atuação deixou de aceitar cidade/bairros em texto livre e passou a usar `TerritorialSelector` + `location_id` oficial, com modos cidade, bairro/distrito e raio;
- `useProfileLocation` passou a ler os labels derivados do Coverage canônico;
- removidos `deleteDriverNeighborhood`, `deleteDriverServiceArea` e o hook morto `useDriverServiceArea`; a feature foi preservada pelo `ServiceAreasManager` canônico;
- `DriverSettingsLayout` agora expõe a seção Áreas de atuação nas rotas de configuração existentes;
- probe transacional real validou create/update, raio, status, troca atômica de primária, rejection de taxonomia inválida e bloqueio de outro usuário; rollback final deixou `service_areas=0`;
- ratchet: `tests/security/mobility-driver-coverage-authority.test.ts`;
- advisors de segurança após DDL não reportaram finding novo referente a `service_areas`.

Próximo gate obrigatório:
1. validar build/typecheck do SHA G14 e corrigir qualquer drift de tipos/UI antes de avançar;
2. auditar preferências exibidas em `DriverSettingsPanel`, pois hoje parte dos switches pode ser somente estado local/toast e não configuração persistente;
3. separar preferência de UI de capability operacional server-owned — especialmente aceitar entregas/corridas, que não pode ser alterado apenas no client;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até os E2E finais.


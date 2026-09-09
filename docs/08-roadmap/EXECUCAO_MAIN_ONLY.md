# Achegue-se — Execução `main`-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Data do checkpoint GitHub:** 2026-09-09  
**Repositório:** `washingtonmsdj/acheguese`  
**Linha ativa:** `main`  
**HEAD técnico de código anterior a este checkpoint documental:** `9c48494514fcf04d8f756b0a0a9a5deb4770c267`

Este documento consolida ordem de execução, blockers e Definition of Done. Ele é um **registro operacional**, não uma fotografia autoritativa do que existe no produto. A fonte de verdade para decidir o que existe, o que está ativo e o que deve ser corrigido é sempre o **projeto real**: código da `main`, rotas, owners, serviços, schema/migrations, contratos, testes, deploy/runtime e comportamento observado.

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
- `mobility-rpc` remoto: **v15 ACTIVE**, `verify_jwt=true`, SHA do bundle `eb2e96161dda8ae52c5d64fbf09df5652d88d27d091117b2e9848a3ee2fc09bb`;
- baseline técnico da `main` antes desta atualização documental: `f91bbf0ef1c452be559ab1ad2d836b268144a8ed`;
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

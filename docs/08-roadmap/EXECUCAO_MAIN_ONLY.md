# Achegue-se — Execução `main`-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Data do checkpoint GitHub:** 2026-08-27  
**Repositório:** `washingtonmsdj/acheguese`  
**Linha ativa:** `main`  
**HEAD técnico anterior a esta sincronização:** `9a601de885c2631f6ae5904b7b9eb7b22662dd72`

Este documento consolida ordem de execução, blockers e Definition of Done. Owners técnicos específicos continuam sendo fonte de verdade para domínio, segurança e schema.

## Regras de execução

1. trabalhar somente na `main` durante a estabilização atual;
2. não criar branch nova para correções deste programa;
3. revalidar o HEAD antes de cada write e nunca usar force update;
4. owner/SSOT deve ser inequívoco e cada migração deve possuir ratchet/gate proporcional ao risco;
5. commit não equivale a runtime, teste ou deploy validado;
6. não reduzir segurança, CI ou cobertura para obter verde;
7. placeholder, `paused`, fallback vazio ou retorno antecipado não contam como módulo funcional;
8. mudanças destrutivas de dados/LGPD exigem validação específica do ambiente alvo.

## Baseline GitHub confirmado

- `main` é a única linha ativa escolhida para esta estabilização.
- 90 branches foram inventariadas anteriormente: `main` + 89 refs históricas pendentes de classificação segura (#84).
- `main` permanece sem proteção/ruleset autoritativo no último snapshot confirmado (#28).
- os workflows SSOT foram corrigidos para reagir a `push` na `main`; `scripts/**` e `eslint.config.js` também passaram a disparar o enforcement quando alterados.
- a camada GitHub Actions continua apresentando falhas pre-step com `steps=[]`/runner não provisionado; portanto nenhum check desse tipo pode ser tratado como prova verde até executar comandos reais (#17).
- o último status Vercel inspecionado nesta estabilização falhou por `upgradeToPro=build-rate-limit`; isso é blocker de certificação/deploy, não prova de erro de compilação.

## P0 — SSOT, CI e proteção

### Documentação / autoridade

- [x] `docs/README.md` como porta de entrada documental;
- [x] taxonomia reconciliada com `src/core/verticals/config.ts` (`gastronomy` + `education`; Events não é vertical empresarial);
- [x] plano operacional `main`-only centralizado neste arquivo;
- [x] regressão automatizada para drift de taxonomia;
- [ ] continuar limpeza de documentos substituídos sem quebrar referências vivas (#51).

### CI confiável (#17)

- [x] SSOT workflows alinhados com `push -> main`;
- [x] enforcement passa a observar também `scripts/**` e `eslint.config.js`;
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
- [x] remover integralmente `src/features` e retirar a allowlist de migração;
- [x] adicionar `tests/architecture/events-owner-migration.test.ts` para bloquear recriação do namespace legado, do bridge de engagement e drift de rota/deploy;
- [x] retirar `src/features/events` do architecture registry.

**Ainda não certificado:**

- [ ] inventariar e reduzir o namespace histórico `src/core/verticals/events` sem criar segundo owner;
- [ ] provar schema/RLS/grants e fluxos reais do módulo no ambiente alvo;
- [ ] provar typecheck/test/build/E2E/deploy do mesmo SHA.

### Higiene de repositório e testes

- [x] zero implementações `*.test.*`/`*.spec.*` diretamente em `tests/`; ratchet arquitetural exige a raiz limpa;
- [x] Mobility integration migrado para `tests/integration/mobility` com imports `@/`;
- [x] `playwright.mapa.config.ts` morto removido e script Maps apontado ao config canônico;
- [x] Security Check Maps deixou de referenciar arquivos sintéticos inexistentes e usa os validators canônicos;
- [x] `tsconfig.typecheck.events-checkin.json` órfão removido;
- [x] `bun.lock` removido; `package-lock.json` permanece como lockfile do package manager npm declarado;
- [x] guard de artifacts de raiz impede regressão dessas decisões.

## P1 — certificação funcional dos módulos (#50)

Arquitetura limpa não equivale a módulo certificado.

- Education continua `launch-paused` apesar do ownership técnico ter sido corrigido.
- Gastronomy possui implementação real e dívida direta de integração do módulo zerada, mas ainda depende de prova de banco/RLS/E2E/deploy.
- Events agora possui owner físico canônico, mas não está certificado funcionalmente.
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
- [ ] classificar as 89 refs históricas e reconstruir na `main` qualquer delta útil antes de removê-las (#84).

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
- `bf2c34b` / `cd17991` — provenance E2E centralizada e cobertura do caminho anon/admin;
- `91c387c` a `0493b0d` — reorganização dos testes até zero implementações na raiz;
- `45bf4a7` — workflow Maps alinhado aos gates canônicos;
- `caea8f6` / `6e14903` / `b47bb39` — remoção de artifacts órfãos e guard de raiz;
- `0da8e2e` — implementação de Events movida para `src/modules/community-events`, com rota e deploy guard no owner canônico;
- `3707218` — `src/features` removido e ratchets atualizados;
- `63a2ab2` — guard de ownership de Events;
- `2ef08e9` — registry sem o source root aposentado de Events;
- `c2e323c` — regras arquiteturais sincronizadas com a conclusão da migração;
- `0bf6e2d` — bridge de engagement de Events aposentado e testes convertidos para bloquear recriação;
- `84b1921` — seis bridges locais de Education aposentados após zero callers de runtime.

## Trackers canônicos

- #85 — security hardening / RLS / privileged functions;
- #68 — LGPD delete/export;
- #17 — CI security gates;
- #28 — proteção da `main`;
- #51 — estrutura/owners/namespaces;
- #50 — certificação funcional dos módulos;
- #83 — provenance E2E (concluído no nível de código);
- #84 — branches históricas.

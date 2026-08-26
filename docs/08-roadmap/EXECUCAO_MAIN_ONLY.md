# Achegue-se — Execução `main`-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Data do checkpoint GitHub:** 2026-08-26  
**Repositório:** `washingtonmsdj/acheguese`  
**Linha ativa:** `main`  
**HEAD técnico anterior a esta sincronização:** `2571f0d075ada3f5e840e8d2196a4e7d6a187b98`

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
- a camada GitHub Actions já apresentou falhas pre-step com `steps=null`; portanto nenhum check desse tipo pode ser tratado como prova verde até executar comandos reais (#17).
- o status externo do SHA `2571f0d` voltou a `Vercel=failure` apontando para `upgradeToPro=build-rate-limit`; isso é blocker de certificação/deploy, não prova de erro de compilação.

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
- [x] manter paths antigos apenas como bridges one-way;
- [x] levar o baseline de acesso runtime direto a `@/integrations/*` em `src/modules/business/education` de 4 arquivos para **zero**;
- [x] validator `scripts/validate-education-module-boundaries.ts` bloqueia regressão e exige os bridges canônicos.

**Ainda não certificado:**

- [ ] schema/RPC/migrations do ambiente alvo reconciliados;
- [ ] RLS/grants e autorização positiva/negativa comprovados;
- [ ] fluxo público listagem → detalhe com dados reais validado;
- [ ] fluxo operacional mínimo validado;
- [ ] E2E/smoke/deploy do mesmo SHA comprovados;
- [ ] somente depois remover `launch-paused`.

### Events — resíduo estrutural prioritário

- [x] classificar Events como bounded context comunitário, não vertical empresarial;
- [x] mover persistência de engagement para `core` e deixar bridge legado;
- [x] adicionar gate que pré-valida `src/features/events` contra as fronteiras do destino;
- [ ] caracterizar e corrigir violações restantes sob regras de `src/modules/**`;
- [ ] mover implementação física para `src/modules/community-events`;
- [ ] atualizar rota, tsconfig, deploy validator e callers no mesmo lote;
- [ ] remover `src/features` quando o último caller desaparecer e bloquear sua recriação.

## P1 — certificação funcional dos módulos (#50)

Arquitetura limpa não equivale a módulo certificado.

- Education continua `launch-paused` apesar do ownership técnico ter sido corrigido.
- Gastronomy possui implementação real, mas superfícies operacionais permanecem parcialmente pausadas.
- Mobilidade territorial permanece pausada.

Ordem de certificação:

1. Mobilidade / Central motorista-motoboy;
2. Central + Empresas/Gastronomia/Educação + Profissionais;
3. Comunidade (incluindo Events);
4. Classificados/jobs + mensagens + perfil/trust;
5. Admin, comunicação territorial, guide, AI e auxiliares.

Para cada módulo exigir: entrypoint canônico, banco/RPC atual, autorização positiva/negativa, fluxo principal real, loading/empty/error/auth corretos, E2E sem placeholder e smoke responsivo.

## P2 — higiene E2E e branches

- [ ] concluir provenance explícita das fixtures `business_data` (`source=e2e`, `source_kind=technical_fixture`) nos writers rastreados por #83;
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

- `f64a063` — reconciliação documental/SSOT;
- `208d6b1` — workflows SSOT em push da `main`;
- `1eaa0e0` — fronteira pública de configuração;
- `fa57cac` — persistence de engagement de Events para `core`;
- `1c50eb4` — gate de migração de Events;
- `6c2e80a` — ratchet de persistência de Education;
- `22c7806` — Observability de Education para `core`;
- `7dcaaf1` — Tracking de Education para `core`;
- `9e6a57b` — contratos de Education para `core`;
- `f3d3c0d` — read model de Education para `core`;
- `2571f0d` — write model e regra de etapas escolares para `core`; dívida direta do módulo chega a zero.

## Trackers canônicos

- #85 — security hardening / RLS / privileged functions;
- #68 — LGPD delete/export;
- #17 — CI security gates;
- #28 — proteção da `main`;
- #51 — estrutura/owners/namespaces;
- #50 — certificação funcional dos módulos;
- #83 — provenance E2E;
- #84 — branches históricas.

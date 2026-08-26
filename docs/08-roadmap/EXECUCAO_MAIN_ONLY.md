# Achegue-se — Execução `main`-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Data do checkpoint GitHub:** 2026-08-26  
**Repositório:** `washingtonmsdj/acheguese`  
**Linha ativa:** `main`  
**HEAD auditado:** `1eaa0e0126e5483df5fa84f26bc05b705eaf0d97`

Este documento organiza a execução corrente. Ele não substitui owners técnicos específicos de arquitetura, segurança, schema ou módulo; consolida apenas **ordem, blockers, critérios de MVP e estado GitHub comprovado**.

## Regras de execução

1. trabalhar somente na `main` durante a estabilização atual;
2. não criar branch nova para continuar correções deste programa;
3. revalidar o HEAD antes de qualquer write;
4. uma mudança deve ter owner/SSOT inequívoco e teste/gate proporcional ao risco;
5. não fazer merge/rebase em massa de branches históricas;
6. não remover arquivo, tabela, RPC ou branch sem comprovar ausência de delta/dependência útil;
7. commit/merge não equivale a runtime validado;
8. não reduzir segurança, CI ou cobertura para obter verde;
9. placeholder, `paused`, fallback vazio ou `return` antecipado não contam como módulo funcional;
10. mudanças destrutivas de dados ou rollout LGPD exigem validação específica fora do GitHub antes de produção.

## Baseline GitHub confirmado

- `main` é a branch default e única linha ativa de desenvolvimento.
- Não há PR aberto no snapshot auditado.
- Há 90 branches no repositório contando `main`: 89 refs históricas ainda precisam de classificação/remoção segura (#84).
- A `main` permanece sem branch protection/ruleset autoritativo; leitura da API confirmou `protected=false` e rulesets vazios (#28).
- O HEAD auditado possui status externo `Vercel=failure` apontando para `upgradeToPro=build-rate-limit`. Portanto o GitHub **não prova falha de código** nem release verde neste momento. Produção/deploy deve ser revalidada no provider antes de classificação final.
- `Security Check` do HEAD auditado (`run 32933355219`) iniciou por push, mas todos os quatro jobs terminaram `failure` com `steps=null` e sem log de job; nenhum lint/typecheck/test/security command chegou a executar (#17).
- `SSOT Enforcement` e `SSOT Territorial Tests` foram corrigidos em `208d6b1` para também dispararem em push da `main`; os runs correspondentes provaram o trigger, mas continuam bloqueados antes do primeiro step pela mesma camada hosted (#17).

## P0 — autoridade, SSOT e gates

### P0.1 — documentação/SSOT

- [x] definir `docs/README.md` como porta de entrada documental;
- [x] eliminar links canônicos para índices/caminhos inexistentes no README raiz;
- [x] retirar plano de auditoria de 20/08 da posição de autoridade ativa e preservá-lo como histórico;
- [x] mover este plano `main`-only para `docs/08-roadmap`;
- [x] reconciliar taxonomia documental com `src/core/verticals/config.ts`;
- [x] adicionar regressão automatizada para drift de verticais/Events;
- [ ] continuar remoção/consolidação de documentos marcados SUBSTITUÍDO ou fora da topologia documentada, sem quebrar links vivos (#51).

### P0.2 — CI confiável (#17)

- [x] alinhar `SSOT Enforcement` e `SSOT Territorial Tests` ao fluxo temporário `push -> main`;
- [ ] restaurar execução real dos jobs hosted;
- [ ] manter `security:validate`, lint/security, audit, typecheck e testes sem `continue-on-error` de resultado;
- [ ] provar pelo menos um run completo verde após restauração;
- [x] separar falha de infraestrutura de falha de código nos trackers, usando `steps=null`/ausência de logs como evidência de pre-step failure.

### P0.3 — proteção de `main` (#28)

- [ ] bloquear force-push e deleção;
- [ ] durante a fase `main`-only, restringir autoridade de push sem fingir enforcement por check quebrado;
- [ ] exigir integração normal via política aprovada quando o fluxo voltar a usar PR;
- [ ] exigir somente checks realmente executáveis/estáveis;
- [x] reconsultar configuração atual e registrar evidência de `protected=false` / ruleset ausente no tracker.

## P1 — segurança e privacidade

Owner de execução: #85, com LGPD separado em #68.

- [ ] continuar auditoria sistemática de overlap/shadow de RLS nas tabelas restantes;
- [ ] classificar `SECURITY DEFINER` client-executable por caller intencional e revogar grants desnecessários;
- [ ] manter helpers/commands administrativos fail-closed e com identidade derivada no backend;
- [ ] tratar advisor de extensão/PostGIS sem alterar objetos extension-owned por conveniência;
- [x] confirmar `.env` versionados como templates/valores deliberadamente públicos e explicitar a fronteira: nenhum `service_role`/provider secret no baseline rastreado; overrides privados ficam em `.env.local`/secret store (`1eaa0e0`);
- [ ] habilitar proteção de senha comprometida quando houver canal administrativo seguro e prova pós-mudança;
- [ ] **não** promover `user-delete-account` / `user-export-data` até reconciliar o novo SSOT LGPD, revogação real de sessão, purge idempotente, scheduler e export completo (#68).

### Safety / emergency delivery

- [x] reclassificar `emergency_delivery_log`: não é tabela morta. É usada por `send-emergency-email` para rate-limit e auditoria de `sent/failed` e possui teste de regressão explícito;
- [x] confirmar no source versionado que RLS está habilitada, `anon/authenticated` são revogados e apenas `service_role` recebe acesso à tabela;
- [x] confirmar índice `(alert_id, contact_id, channel, created_at DESC)` alinhado à consulta de rate-limit;
- [ ] validar no ambiente correspondente retenção, volume, grants efetivos e demais produtores antes de qualquer alteração de schema.

## P1 — estrutura e organização (#51)

### Eventos — resíduo estrutural prioritário

Estado comprovado:

- `src/features/` contém somente `events`;
- `src/modules/community-events` contém apenas documentação;
- a rota territorial ainda importa `@/features/events/pages/EventsListPage`;
- Eventos não é vertical empresarial: `src/core/verticals/config.ts` declara apenas `gastronomy` e `education`;
- `src/modules/**` possui blindagem ESLint adicional: cross-module imports e integrations diretas são proibidos. Portanto mover a árvore de Eventos sem rodar lint pode revelar violações reais que hoje não incidem no namespace legado.

Próxima migração segura:

- [x] inventariar os callers/referências explícitos de `src/features/events`: rota territorial, `verify-deploy-ready`, architecture registry, `tsconfig.typecheck.events-checkin.json`, teste de segurança e referências históricas/documentais;
- [ ] caracterizar imports internos do bloco Eventos contra as regras que passam a valer em `src/modules/**`;
- [ ] mover a UI operacional para `src/modules/community-events` preservando imports relativos e contracts somente com boundary validado;
- [ ] migrar `tsconfig.typecheck.events-checkin.json` e o check de placeholders de deploy para o owner canônico no mesmo lote;
- [ ] ajustar callsites canônicos sem criar facade concorrente vazia;
- [ ] retirar contratos reutilizáveis de `core/verticals/events` para owner transversal adequado somente após mapear dependências;
- [ ] remover `src/features` quando o último caller desaparecer;
- [ ] reforçar validator para impedir recriação do namespace.

### Documentação e artefatos

- [ ] reduzir documentos ativos a owners vivos; Git preserva histórico;
- [ ] revisar `plans/`, `handoff/`, `.kiro/specs` e screenshots/resultados versionados como artefato de ferramenta/histórico;
- [ ] remover output gerado da árvore ativa quando não for input reproduzível de build/teste;
- [ ] não mover em massa os seis planos marcados concluídos em `plans/README.md` enquanto validators/docs/testes ainda os referenciarem por caminho.

## P1 — certificação funcional dos módulos (#50)

Um módulo só fica `MVP/CERTIFIED` quando rota, owner, banco, segurança, runtime e fluxo funcional concordarem.

Achados atuais:

- Education possui implementação extensa em `src/modules/business/education` (pages/services/hooks/components/tests), mas as exports públicas em `lazyImports.ts` e a rota territorial continuam explicitamente `createLaunchPausedRoute("Educacao")`;
- Gastronomy possui implementação real, porém várias superfícies operacionais seguem pausadas (setup/dashboard/menu/horários/delivery/analytics/promotions);
- Mobilidade territorial continua explicitamente `paused`;
- remover `paused` sem provar contrato de banco/RLS/runtime e sem gate executável não conta como correção.

Ordem:

1. Mobilidade / Central motorista-motoboy;
2. Central + Empresas/Gastronomia/Educação + Profissionais;
3. Comunidade (feed, grupos, ocorrências, eventos, achados/perdidos, recomendações);
4. Classificados/jobs + mensagens + perfil/trust;
5. Admin, comunicação territorial, guide, AI e superfícies auxiliares.

Para cada módulo:

- [ ] entrypoint e namespace canônicos;
- [ ] ausência de writer/service paralelo;
- [ ] contrato de tabela/RPC atual;
- [ ] autorização positiva e negativa;
- [ ] create/read/update/action principal quando aplicável;
- [ ] loading/empty/error/auth/suspensão corretos;
- [ ] E2E sem aceitar placeholder/paused como sucesso;
- [ ] smoke mobile/responsivo;
- [ ] regressão em CI.

## P2 — higiene E2E e branches

- [ ] concluir provenance explícita das fixtures de `business_data` (`source=e2e`, `source_kind=technical_fixture`) nos quatro writers rastreados por #83, preservando metadata funcional;
- [ ] classificar cada uma das 89 branches históricas como absorvida, obsoleta ou delta exclusivo (#84);
- [ ] registrar delta exclusivo em issue e reconstruí-lo na `main` antes de remover a ref;
- [ ] remover refs históricas quando o canal GitHub utilizado suportar delete-ref.

## Definition of Done — MVP

O Achegue-se só pode ser marcado **MVP READY** quando, no mínimo:

- [ ] SSOT documental/arquitetural sem referências canônicas quebradas conhecidas;
- [ ] `main` protegida e sem branches operacionais concorrentes;
- [ ] gates de security/lint/typecheck/test/build executando de verdade e verdes;
- [ ] migrations/Edge/source reconciliados com o runtime correspondente;
- [ ] fluxo LGPD seguro ou explicitamente indisponível/fail-closed até certificação;
- [ ] módulos do escopo MVP certificados por fluxo real, não placeholder;
- [ ] autorização sensível coberta por testes/probes negativos;
- [ ] deploy do SHA aprovado comprovado no provider;
- [ ] smoke funcional de produção/ambiente alvo sem erro crítico recorrente;
- [ ] rollback/recuperação documentados para mudanças operacionais relevantes.

## Commits desta retomada

- `f64a063` — reconciliou autoridade documental/SSOT, taxonomia vertical, plano MVP e regressão de drift;
- `208d6b1` — alinhou workflows SSOT com push na `main` e provou que o blocker restante é pre-step/hosted;
- `1eaa0e0` — explicitou a fronteira de configuração pública versionada sem alterar valores funcionais.

## Trackers canônicos de execução

- #85 — security hardening / RLS / privileged functions;
- #68 — LGPD delete/export authority;
- #17 — CI security gates;
- #28 — proteção de `main`;
- #51 — estrutura/arquivos/namespaces;
- #50 — certificação funcional dos módulos;
- #83 — provenance de fixtures E2E;
- #84 — limpeza das branches históricas.

Ao concluir um lote, atualizar o owner técnico correspondente e este documento somente quando o estado global/ordem de execução mudar.
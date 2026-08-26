# Achegue-se — Execução `main`-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Data do checkpoint GitHub:** 2026-08-26  
**Repositório:** `washingtonmsdj/acheguese`  
**Linha ativa:** `main`  
**HEAD auditado:** `11eeb9d647f7b8477fc5c2a6a22d8d450b7249da`

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
- O HEAD auditado possui status externo `Vercel=failure`; um commit imediatamente anterior expôs `build-rate-limit` no target do status. Portanto o GitHub **não prova falha de código** nem release verde neste momento. Produção/deploy deve ser revalidada no provider antes de classificação final.
- Hosted `Security Check` / `Security Scan` permanecem rastreados como indisponíveis antes de steps (#17); ausência de execução não é aprovação.
- Proteção/ruleset da `main` permanece pendente no tracker #28.

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

- [ ] restaurar execução real dos jobs hosted;
- [ ] manter `security:validate`, lint/security, audit, lint, typecheck e testes sem `continue-on-error` de resultado;
- [ ] provar pelo menos um run completo verde após restauração;
- [ ] separar falha de infraestrutura de falha de código nos trackers.

### P0.3 — proteção de `main` (#28)

- [ ] bloquear force-push e deleção;
- [ ] exigir integração normal via política aprovada quando o fluxo voltar a usar PR;
- [ ] exigir somente checks realmente executáveis/estáveis;
- [ ] reconsultar configuração e registrar evidência.

## P1 — segurança e privacidade

Owner de execução: #85, com LGPD separado em #68.

- [ ] continuar auditoria sistemática de overlap/shadow de RLS nas tabelas restantes;
- [ ] classificar `SECURITY DEFINER` client-executable por caller intencional e revogar grants desnecessários;
- [ ] manter helpers/commands administrativos fail-closed e com identidade derivada no backend;
- [ ] tratar advisor de extensão/PostGIS sem alterar objetos extension-owned por conveniência;
- [ ] confirmar `.env` versionados como templates/valores deliberadamente públicos e manter validação contra segredo real;
- [ ] habilitar proteção de senha comprometida quando houver canal administrativo seguro e prova pós-mudança;
- [ ] **não** promover `user-delete-account` / `user-export-data` até reconciliar o novo SSOT LGPD, revogação real de sessão, purge idempotente, scheduler e export completo (#68).

## P1 — estrutura e organização (#51)

### Eventos — resíduo estrutural prioritário

Estado comprovado:

- `src/features/` contém somente `events`;
- `src/modules/community-events` contém apenas documentação;
- a rota territorial ainda importa `@/features/events/pages/EventsListPage`;
- Eventos não é vertical empresarial: `src/core/verticals/config.ts` declara apenas `gastronomy` e `education`.

Próxima migração segura:

- [ ] inventariar todos os arquivos/callers de `src/features/events` e referências em validators/tsconfigs;
- [ ] mover a UI operacional para `src/modules/community-events` preservando imports relativos e contracts;
- [ ] ajustar callsites canônicos sem criar facade de compatibilidade vazia;
- [ ] retirar contratos reutilizáveis de `core/verticals/events` para owner transversal adequado somente após mapear dependências;
- [ ] remover `src/features` quando o último caller desaparecer;
- [ ] reforçar validator para impedir recriação do namespace.

### Documentação e artefatos

- [ ] reduzir documentos ativos a owners vivos; Git preserva histórico;
- [ ] revisar `plans/`, `handoff/`, `.kiro/specs` e screenshots/resultados versionados como artefato de ferramenta/histórico;
- [ ] remover output gerado da árvore ativa quando não for input reproduzível de build/teste.

## P1 — certificação funcional dos módulos (#50)

Um módulo só fica `MVP/CERTIFIED` quando rota, owner, banco, segurança, runtime e fluxo funcional concordarem.

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
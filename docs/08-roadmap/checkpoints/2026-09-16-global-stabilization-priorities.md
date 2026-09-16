# Checkpoint — prioridades globais de estabilização

**Data:** 2026-09-16  
**Linha:** `main`  
**Status:** execução P0 ativa; source corrigido, build/deploy same-SHA ainda não certificado

## Por que este checkpoint existe

A auditoria global mostrou que o projeto não precisa abrir uma nova fase de arquitetura nem criar outro plano paralelo. A necessidade imediata é fechar ciclos de release, segurança e certificação funcional já definidos no SSOT operacional.

Este checkpoint complementa `../EXECUCAO_MAIN_ONLY.md` e substitui, para a ordem imediata de execução, leituras antigas do arquivo raiz `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`.

## Evidência reconciliada

### GitHub / `main`

No início desta retomada, o HEAD técnico era:

`905583fb1143aef30617655e985a57d086278bce`

Estado observado:

- branch `main` com `protected=false`;
- required status checks desativados;
- o HEAD estava 12 commits à frente do último SHA que efetivamente entrou no build Vercel (`d97c9960a07e5093e34ba109164b1185692f6e89`);
- a comparação `d97c996 -> 905583f` mostra as correções dos blockers de build anteriores:
  - `RideRequestReadModel.ts` passou a concentrar o widening inevitável no boundary de leitura;
  - `HistoryTab.tsx` preserva `HistoryTone` em vez de inferir `string`;
  - `src/core/safety/hooks/index.ts` voltou a exportar `useRideShare`;
  - existe `tests/architecture/mobility-build-contract.test.ts` travando parte desse contrato.

### Vercel

O último deployment que executou o build e falhou foi `d97c996` e reportou três erros TypeScript correspondentes aos pontos acima.

Para o HEAD `905583f`, o status GitHub `Vercel` é `failure`, mas o target aponta para `upgradeToPro=build-rate-limit`. Portanto:

- o source atual **não pode ser declarado quebrado pelos mesmos três erros**;
- o source atual também **não pode ser declarado verde**, porque o pipeline não executou;
- rate-limit externo é `BLOCKED_BY_PROVIDER`, não aprovação nem reprovação do build.

### Mobilidade

Permanece válido o checkpoint `2026-09-16-mobility-authority-privacy-hardening.md`:

- autoridade de quote/criação/transição é server-owned;
- browser não é autoridade de preço final;
- minimização de PII foi endurecida;
- migration de GPS ainda dependia do canal PostgreSQL administrativo;
- probe negativo IDOR/BOLA rollback-only ainda precisava de execução real;
- rollout público permanece pausado.

## P0 — release authority

### P0.1 — pipeline/build same-SHA

Estado: **BLOCKED_BY_PROVIDER**.

Critério de aceite:

- pipeline de produção executado de verdade sobre o SHA candidato;
- typecheck/lint/security/build sem bypass;
- deployment Vercel `READY`;
- SHA do deployment igual ao SHA certificado;
- qualquer erro novo deve ser corrigido na causa raiz, não escondido em casts genéricos, aliases, disables ou relaxamento de gate.

### P0.2 — proteção da `main`

Estado: **ABERTO**.

A configuração administrativa precisa impedir integração normal quando o required check executável falhar.

Mínimo:

- PR obrigatório;
- bloquear force-push;
- bloquear deleção;
- resolução de conversas;
- required check Vercel enquanto os checks hosted não forem confiáveis;
- bypass administrativo apenas para incidente documentado.

Relacionado: issue #28.

## P1 — Mobilidade

Até fechar estes itens, não abrir nova feature no domínio:

1. recuperar canal PostgreSQL administrativo e aplicar/verificar migrations pendentes;
2. remover compatibilidade SQL obsoleta somente depois do cutover seguro;
3. executar probes negativos IDOR/BOLA;
4. provar concorrência/idempotência em aceites, cancelamentos, retries e quotes single-use;
5. regenerar tipos Supabase do schema real;
6. rodar testes de arquitetura/segurança/Mobilidade, E2E operacional e smoke responsivo;
7. obter build/deploy do mesmo SHA;
8. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até todos os gates.

## P1 — segurança transversal

Prioridades:

1. inventário/allowlist das funções `SECURITY DEFINER` executáveis por `anon` e `authenticated`;
2. negative probes por recurso/ator para comandos sensíveis;
3. Leaked Password Protection;
4. menor privilégio em RLS/grants/extensões/PostGIS;
5. normalização de policies permissivas duplicadas nas relações sensíveis antes de otimização puramente cosmética.

Nenhuma contagem de advisor deve ser tratada como vulnerabilidade automática nem ignorada sem classificação.

## P1 — LGPD / privacidade

Relacionado: issue #68.

Não fazer rollout das implementações antigas de exclusão/exportação como atalho.

Critérios:

- SSOT único para pedido/estado de exclusão;
- purge idempotente e observável com scheduler/worker real;
- revogação de sessão pela autoridade do Supabase Auth;
- exportação reescrita contra o schema atual;
- prova de cobertura/completude;
- probes positivos/negativos antes de exposição certificada.

## P2 — certificação funcional

Seguir issue #50 na ordem:

1. Mobilidade/Central motorista-motoboy;
2. Central + Business/Gastronomia + Professionals;
3. Comunidade;
4. Classifieds/Messaging/Work Opportunities/Profile/trust;
5. Admin/Comunicação Territorial/Guide/AI/auxiliares.

Um domínio só fecha quando arquitetura + autorização + banco + runtime + fluxo real + E2E concordarem. Placeholder, fallback, `launch-paused`, tela vazia ou early-return de teste não são prova.

## P3 — performance e UX

Somente após estabilização funcional:

- priorizar FKs sem índice com base em queries/tabelas quentes;
- não remover índice marcado `unused` sem janela de observação;
- medir custo de RLS antes/depois;
- bundle/code splitting;
- CSS/visual SSOT;
- acessibilidade/responsividade;
- limpeza de bridges e documentação temporária.

## Próxima ação executável

Enquanto o provider bloqueia novo build Vercel, a execução deve avançar apenas em tarefas que não falsifiquem a certificação do release. A primeira dessas tarefas é **fechar a governança da `main` quando houver capacidade administrativa**; em paralelo, continuar a certificação de Mobilidade pelos blockers de banco/segurança já documentados, sem habilitar rollout público.

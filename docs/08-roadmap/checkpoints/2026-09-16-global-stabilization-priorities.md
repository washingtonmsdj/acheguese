# Checkpoint — prioridades globais de estabilização

**Data:** 2026-09-16  
**Linha:** `main`  
**Status:** execução P0/P1 ativa; blockers de banco de Mobilidade reduzidos; build/deploy same-SHA ainda não certificado

## Por que este checkpoint existe

A auditoria global mostrou que o projeto não precisa abrir uma nova fase de arquitetura nem criar outro plano paralelo. A necessidade imediata é fechar ciclos de release, segurança e certificação funcional já definidos no SSOT operacional.

Este checkpoint complementa `../EXECUCAO_MAIN_ONLY.md` e substitui, para a ordem imediata de execução, leituras antigas do arquivo raiz `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`.

## Evidência reconciliada

### GitHub / `main`

No início desta retomada, o HEAD técnico era `905583fb1143aef30617655e985a57d086278bce`.

Estado observado:

- branch `main` com `protected=false` e required status checks desativados;
- aquele HEAD estava 12 commits à frente do último SHA que efetivamente entrou no build Vercel (`d97c9960a07e5093e34ba109164b1185692f6e89`);
- as três regressões TypeScript desse deployment já estavam corrigidas no source: bounded widening de `RideRequestReadModel`, literal `HistoryTone` e export canônico de `useRideShare`;
- `tests/architecture/mobility-build-contract.test.ts` trava esses contratos e agora também trava a remoção de `p_final_price` do boundary terminal de entrega.

### Vercel

O último deployment que executou o build e falhou foi `d97c996`.

Para o HEAD auditado, o status GitHub `Vercel` apontava para `upgradeToPro=build-rate-limit`. Portanto:

- os três erros antigos não representam o source atual;
- o source atual ainda não pode ser declarado verde enquanto o pipeline não executar;
- rate-limit externo é `BLOCKED_BY_PROVIDER`, não aprovação nem reprovação do build.

### Mobilidade — avanços desta retomada

O canal PostgreSQL administrativo voltou a responder e permitiu fechar três blockers concretos:

1. `minimize_idle_driver_gps` aplicada no Supabase canônico e verificada;
   - triggers de minimização/guard/purge ativos;
   - zero `driver_availability` ociosos retendo GPS;
   - zero snapshots ociosos em `driver_locations`.
2. `tests/security/mobility-participant-authorization-remote-probe.sql` executado em transação rollback-only;
   - terceiro usuário autenticado não consegue refresh de PIN;
   - não consegue enviar trust feedback sobre corrida alheia;
   - não consegue criar denúncia sobre corrida alheia.
3. compatibilidade SQL `p_final_price` removida do wrapper público `mobility_transition_delivery_state_atomic`;
   - assinatura antiga de 8 parâmetros removida;
   - assinatura atual de 7 parâmetros preserva `service_role` como único executor externo;
   - broker atual usa argumentos nomeados e não envia preço terminal;
   - migration remota registrada como `20260916233125_remove_mobility_delivery_final_price_compat` e versionada com o mesmo número no Git.

O rollout público continua pausado.

## P0 — release authority

### P0.1 — pipeline/build same-SHA

Estado: **BLOCKED_BY_PROVIDER** enquanto o limite externo impedir a execução.

Critério de aceite:

- pipeline de produção executado de verdade sobre o SHA candidato;
- typecheck/lint/security/build sem bypass;
- deployment Vercel `READY`;
- SHA do deployment igual ao SHA certificado;
- qualquer erro novo corrigido na causa raiz, sem aliases, disables ou relaxamento de gate.

### P0.2 — proteção da `main`

Estado: **ABERTO**.

Mínimo:

- PR obrigatório;
- bloquear force-push;
- bloquear deleção;
- resolução de conversas;
- required check executável;
- bypass administrativo apenas para incidente documentado.

Relacionado: issue #28.

## P1 — Mobilidade

Fechado nesta retomada:

- [x] canal PostgreSQL administrativo recuperado;
- [x] migration de minimização de GPS aplicada/verificada;
- [x] negative probe PIN/trust/report executado rollback-only;
- [x] parâmetro público de compatibilidade `p_final_price` removido com cutover versionado.

Restante antes de launch-ready:

1. definir/aprovar política comercial real por modalidade;
2. regenerar tipos Supabase a partir do schema real, sem edição manual;
3. provar concorrência/idempotência em dupla aceitação, cancelamento simultâneo, retries/reconnect, quote duplicada e confirmação duplicada;
4. rodar testes de arquitetura/segurança/Mobilidade, E2E operacional e smoke responsivo;
5. obter build/deploy do mesmo SHA;
6. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até todos os gates.

## P1 — segurança transversal

Prioridades:

1. inventário/allowlist das funções `SECURITY DEFINER` executáveis por `anon` e `authenticated`;
2. negative probes por recurso/ator para comandos sensíveis;
3. Leaked Password Protection;
4. menor privilégio em RLS/grants/extensões/PostGIS;
5. normalização de policies permissivas duplicadas nas relações sensíveis.

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

Enquanto Vercel estiver bloqueado por provider, continuar apenas tarefas que não falsifiquem a certificação do release. Em Mobilidade, a próxima frente é **concorrência/idempotência + reconciliação dos tipos gerados**. Em paralelo, permanece P0 a proteção administrativa da `main` quando a capacidade estiver disponível.

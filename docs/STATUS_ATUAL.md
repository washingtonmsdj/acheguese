# Status atual do Achegue-se

Atualizado em: 2026-09-17

## Autoridade deste documento

Este arquivo resume o estado operacional vigente e deve ser lido junto de:

- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`;
- `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
- `docs/09-reference/governance/security/SECURITY_AUTHORITY.md`;
- os checkpoints mais recentes em `docs/08-roadmap/checkpoints/`.

Documentos em `docs/10-archive/` são históricos e não comprovam o estado atual.

## Estado de release

**NÃO APROVADO PARA LANÇAMENTO neste snapshot.**

A regra continua sendo fail-closed: nenhum status verde inferido, merge, commit, `build-rate-limit`, `Ignored Build Step`, job sem steps ou deployment pendente substitui execução real dos gates no mesmo SHA candidato.

## P0 — autoridade de release

### GitHub Actions hosted

Os workflows hosted continuam bloqueando a certificação porque falham antes da execução dos steps. No SHA corrente do PR #117, o `Security Check` voltou a encerrar `Lint and Type Check`, `Run Tests`, `Maps Architecture Enforcement` e `Validate No Hardcoded Credentials` com `steps=[]`.

Consequências:

- esses vermelhos não provam regressão do código;
- também não provam aprovação;
- lint, typecheck, testes e scanners só contam quando os comandos realmente executarem;
- a causa administrativa/infra exata continua não demonstrada e não deve ser inventada.

O diagnóstico permanece rastreado na issue #17.

### Heavy PR Certification

O `Heavy PR Certification (Auto)` do PR #117 está enfileirado aguardando o runner self-hosted dedicado. Enquanto o job não executar steps e concluir, não existe certificação pesada do SHA.

### Proteção da `main`

A última consulta registrada da `main` mostrou proteção desabilitada. A correção administrativa continua rastreada na issue #28. Não declarar esse item concluído sem reconsultar a API/ruleset e obter `protected=true` ou proteção equivalente efetiva.

### Vercel

Release exige deployment `READY` para exatamente o mesmo SHA certificado. `build-rate-limit`, cancelamento, `Ignored Build Step`, `pending` ou sucesso de um SHA anterior não contam.

## P1 — Mobilidade

Estado: **hardening em andamento e lançamento público pausado**.

`PUBLIC_LAUNCH_SURFACES.mobility` deve permanecer `false` até o fechamento dos gates previstos no roadmap.

O PR #117 (`audit/mobility-launch-hardening-main-2026-09-17`) foi criado diretamente sobre a `main` atual para substituir o PR #116, que havia divergido fortemente do trunk. O PR #116 foi fechado sem merge.

### Hardening implementado no PR #117

- `showFullDetails: false` em todas as estratégias pré-aceite;
- política runtime-neutral em `src/shared/contracts/mobilityDispatchPolicy.ts` compartilhada por app e Edge;
- `MobilityDispatchConfigService` consome o owner compartilhado;
- `auto-dispatch-ride` consome a mesma política para timeout/retries/timeout total/raio, sem `CONFIG` local concorrente;
- literals antigos de dispatch foram removidos de `src/shared/types/mobility.constants.ts`;
- `DispatchGlobalConfig` foi reconciliado com os campos reais da política compartilhada;
- coordenada numérica `0` é válida;
- coordenadas ausentes, `NaN` ou infinitas são rejeitadas;
- motorista sem GPS válido é descartado em vez de receber fallback `(0,0)`;
- ratchets impedem reintrodução dos hardcodes e da exposição pré-aceite.

### Residual de Mobilidade

Ainda é necessário, antes de lançamento:

1. executar de verdade os testes focados e gates completos do SHA final;
2. validar concorrência e atomicidade em ambiente apropriado, incluindo sessões independentes quando o checkpoint exigir;
3. reconciliar qualquer drift remoto de tipos/schema antes de promover código dependente dele;
4. executar smoke/E2E operacional contra o ambiente final;
5. obter deployment `READY` no mesmo SHA aprovado;
6. somente então reavaliar a flag pública de Mobilidade.

Não alterar política de dispatch por inferência. Em particular, mudanças de semântica entre `exclusive_offer`, `open_board` e `reservation_board` exigem prova do caller/worker real e teste correspondente.

## Segurança e Supabase

A última evidência remota registrada nos checkpoints de 2026-09-16 descreveu o projeto Supabase como saudável e `mobility-rpc` ativo com JWT, enquanto `auto-dispatch-ride` e `process-timeouts` usam a fronteira de `CRON_SECRET` conforme a política versionada.

Essa evidência é histórica recente, mas não deve ser apresentada como revalidação remota de 2026-09-17 sem nova consulta ao provider.

Continuam exigindo decisão/evidência fresca antes de release:

- exceções de HIBP/PostGIS/Poll cuja validade registrada expirou;
- recovery snapshot vencido;
- residuais do Security Advisor classificados pela Security Authority;
- qualquer drift entre migrations/schema remoto e contratos gerados.

Exceção expirada não deve ser renovada apenas para obter verde.

## LGPD

Fluxos destrutivos devem permanecer fail-closed enquanto autoridade de retenção, dependências e purge não estiverem comprovados. Não reintroduzir schema antigo, não implantar worker destrutivo e não declarar completude de export/deleção por aproximação documental.

## Documentação

Este arquivo restaura o alvo vivo já referenciado por documentação de administração e pela Security Authority. A ausência anterior de `docs/STATUS_ATUAL.md` deixava referências vivas quebradas.

Ordem de leitura operacional:

1. `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`;
2. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
3. este `docs/STATUS_ATUAL.md`;
4. checkpoints recentes e autoridades específicas.

## Critério para mudar para APROVADO

Só alterar o estado de release deste documento depois de existir, no mesmo SHA candidato:

- execução real de lint/typecheck/security/test/build;
- migrations/governança/SSOT validados conforme os scripts canônicos;
- certificação funcional e E2E exigida pelo roadmap;
- Vercel `READY` no mesmo SHA;
- smoke final do ambiente publicado;
- proteção/ruleset e demais autoridades administrativas revalidadas quando aplicável;
- riscos residuais documentados sem mascaramento.

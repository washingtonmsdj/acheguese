# Status atual do Achegue-se

Atualizado em: 2026-09-17 17:09 UTC

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

No HEAD do PR #117 `44018f25f91dff2f8036ee6d3e6e67c17912b6e0`, cinco workflows terminaram em falha pré-step: `Security Check` #35248764768, `SSOT Enforcement` #35248764937, `Security Scan` #35248764987, `SSOT Territorial Tests` #35248764805 e `Auth Concept Regression` #35248764795. Todos os jobs encerrados reportaram `steps=[]`; nenhum comando foi executado. O resultado não prova falha do código nem aprovação. A causa do provisionamento segue sem confirmação (#17).

### Heavy PR Certification

`Heavy PR Certification (Auto)` #35248764830 do PR #117 continua `queued`, sem steps. Ainda não existe certificação pesada do SHA.

O runner self-hosted `acheguese-windows-heavy-01` permanece `offline`, sem processo/serviço neste host. O sync canônico de tipos #207 (run `35168708525`) segue `queued` desde 04:09 UTC; #208 (run `35178338822`) foi cancelado após 40m37s, sem steps.

### Proteção da `main`

A API administrativa confirmou proteção parcial: `protected=true`, `enforce_admins=true`, force-push/deleção bloqueados e resolução de conversas exigida. `required_pull_request_reviews`, `required_status_checks` e `restrictions` são `null`; pushes diretos comuns continuam permitidos. PR/checks não foram ativados porque `Supabase Types Sync` ainda grava diretamente em `main`, e o CI não inicia jobs (#17, #28).

### Vercel

Release exige deployment `READY` para exatamente o mesmo SHA certificado. `build-rate-limit`, cancelamento, `Ignored Build Step`, `pending` ou sucesso de um SHA anterior não contam.

O HEAD atual `44018f25f91dff2f8036ee6d3e6e67c17912b6e0` tem status `Vercel=failure` por `Deployment rate limited — retry in 24 hours`; não há deployment `READY` neste SHA. O preview `dpl_3yFoVfGodyEfdQz7p5nCRawPumbc` e `Vercel=success` pertencem ao SHA anterior `c46e61eba0a0b5d132c64fe51f1589c208810458`. Promoção de produção e smoke final permanecem pendentes.

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

O projeto Supabase `xhdowzacfujckjelqhtd` foi reconsultado às 15:57 UTC e está `ACTIVE_HEALTHY`, em PostgreSQL `17.6.1.084`.

### Revalidação do Security Advisor — 2026-09-17 15:54 UTC

- 1 `ERROR`: `public.spatial_ref_sys` sem RLS; a tabela pertence ao PostGIS e concede `SELECT` a `PUBLIC`. Contém metadados de sistemas de coordenadas; o finding permanece aberto para correção compatível com a extensão.
- 19 `INFO`: RLS ligado sem policy (14 tabelas públicas e 5 privadas). Consulta de privilégios confirmou que nenhuma delas concede `SELECT`, `INSERT`, `UPDATE` ou `DELETE` a `anon`/`authenticated`; o acesso restrito é deny-by-default.
- 4 extensões no schema `public`: `unaccent`, `pg_trgm`, `citext` e `postgis`.
- 9 funções `SECURITY DEFINER` executáveis por `anon`; 85 por `authenticated`; a proteção contra senhas vazadas permanece desabilitada.
- Das 9 funções anon, 6 são APIs próprias com contrato público validado (poll visível, reputação pública, agregado de rating, share por token, projeção territorial consentida e ingestão analítica); as outras 3 são overloads de `st_estimatedextent` do PostGIS.
- As 82 funções próprias expostas a `authenticated` têm `search_path` fixado. As únicas 3 funções expostas sem essa configuração são as funções C `st_estimatedextent` da extensão PostGIS. O probe rollback-only de Safety passou 5/5, incluindo negação de spoof de Profile na criação de alerta, e terminou com `rolled_back=true`. Não foi feito revoke em massa nem alteração de schema.

Continuam exigindo decisão/evidência antes de release:

- exceções de HIBP/PostGIS/Poll cuja validade registrada expirou;
- recovery snapshot vencido;
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

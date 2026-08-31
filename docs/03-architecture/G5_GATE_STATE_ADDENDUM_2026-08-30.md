# G5 — Gate state addendum — 2026-08-30

Status: **G5 EM EXECUÇÃO / G6 BLOQUEADO**  
Branch: `main`

Este addendum atualiza somente gates cujo estado mudou depois de `G5_CHECKPOINT_2026-08-30.md`. O checkpoint histórico não deve ser reescrito para apagar a sequência de evidências.

## 1. Hosted build: última fronteira READY continua em `c3dbb324...`

O hosted proof inicial de G5 havia sido estabelecido no deployment Vercel `dpl_8aezRhYV8Bur5tG568miVSrh9EJm`, source `13e4efb162baca392c5363e02bdb743143121439`, production `READY`.

Depois de uma janela de rate-limit, a Vercel voltou a executar builds da `main`. O hosted proof completo mais recente observado neste corte é:

- deployment: `dpl_EoErSiJ4MTCR9GNEbCPeYKYsN7on`;
- source: `c3dbb3249352420c73fa77716bf910a96b82dc56`;
- commit: `fix(g5): support shallow Vercel git history`;
- branch: `main`;
- target: production;
- state final: `READY`.

Os logs provam execução real do pipeline:

- clone de `main` no SHA `c3dbb324...`;
- validação de consistência de `package.json`/`package-lock.json`: PASS;
- `security:validate`: PASS com aviso esperado de `.env.local` ausente no ambiente hosted;
- lint de segurança executado;
- Vite concluiu build;
- sitemap de produção validado: index com 3 arquivos e **114.302 URLs**;
- `Build Completed in /vercel/output [3m]`;
- outputs deployados;
- `Deployment completed`;
- consulta de runtime `error`/`fatal` no deployment nas últimas 24h: nenhum log encontrado no recorte observado.

O install também reportou `2 moderate severity vulnerabilities` via npm audit summary. Isso **não** falhou o build, mas permanece finding de launch-hardening até a cadeia exata do audit ser materializada e reconciliada.

### 1.1 Cobertura histórica e reabertura controlada do hosted proof

Até o corte `34d63dcb10c948209add097bf4a73246957aff8a`, a comparação contra `c3dbb324...` provava somente mudanças em CI, `.vercelignore`, testes e documentação. Nesse corte não havia alteração posterior de runtime e o application source permanecia coberto pelo hosted PASS de `c3dbb324...`.

Esse estado **mudou** com o hardening de redirect interno executado depois:

- `401cfa8d1914b8d9d966485c46fb46bc60e0ab41` — hardening inicial de `src/shared/utils/safeRedirect.ts`;
- `cc5d3f8565c2531be0abd5b54a40ea86af44b86f` — ratchet inicial;
- `fd153c2eeb1fcb7c150c1035313c244dd3d00ad8` — rejeição de separadores de path codificados recursivamente e bloqueio fail-closed de relative network paths;
- `9bd0fcafe2b872d93a655d0669c2ebe7667ac253` — ratchet ampliado para codificação repetida.

Portanto a leitura atual é:

- `c3dbb324...` continua sendo o **último hosted build completo READY**;
- ele continua válido como evidência histórica de todo o runtime existente naquele SHA;
- o runtime atual **não deve mais ser chamado de totalmente coberto por `c3dbb324...`**, porque `safeRedirect.ts` mudou depois;
- o status Vercel observado em `9bd0fcaf...` é `failure` apontando para `upgradeToPro=build-rate-limit`, sem deployment novo que execute o source atual;
- logo, a validação hosted do novo hardening de redirect está pendente por quota do provedor, não por erro de build observado.

Não reexecutar builds repetidamente enquanto a Vercel continuar recusando antes da criação/execução do deployment.

## 2. Runtime pós-deploy

A telemetria Vercel do deployment `dpl_EoErSiJ4MTCR9GNEbCPeYKYsN7on` não apresentou logs `error` ou `fatal` no recorte disponível das últimas 24 horas.

Isso é prova operacional positiva do recorte observado, mas **não** deve ser promovido a teste de carga: ausência de logs não prova volume representativo de tráfego.

## 3. Vercel ignored-build: correção posterior ao hosted PASS

O próprio hosted build de `c3dbb324...` expôs a causa do fallback do ignored-build step naquele SHA:

- `.vercelignore` ainda removia `.git`;
- `vercel-ignore-build.mjs` não conseguia consultar o commit anterior;
- por segurança, o script falhava aberto para executar build real.

A `main` recebeu depois:

- `fa0996fff4210b3999352efa7eacf0db609bf1f4` — `fix(g5): preserve git metadata for Vercel ignore step`;
- `3adff5819440cfc28057298ad6daa067f49ef8b5` — ratchet do contrato.

Estado source atual:

- `.vercelignore` **não** contém regra `.git`;
- o comentário explica que Vercel já exclui metadata Git dos artifacts e que o ignored-build precisa dela antes do build;
- `vercel-ignore-build.mjs` procura `VERCEL_GIT_PREVIOUS_SHA` e, em shallow clone, tenta `git fetch --no-tags --depth=1 origin <sha>`;
- se não conseguir provar um change-set seguramente skippable, o script continua fail-open para build real;
- `.vercelignore`, migrations, runtime, build scripts e governança crítica continuam classificados como build-required pelos ratchets.

Esse ajuste está correto em source/test, mas não será promovido a hosted PASS até aparecer um deployment/ignored-build execution posterior que o exercite.

## 4. Actions + canonical types: workflow endurecido; scheduler/runner é o blocker atual

A migration `20260831024311_add_locations_geographic_path_pattern_index_g5.sql` provou que o gatilho automático por migration funciona. Runs antigos que haviam ficado presos foram posteriormente limpos pelo controle de concorrência:

- run `33351562666`, source `23679c033b812c97a208229f52725f39c0bb8f55`: `completed / cancelled`;
- run `33352436687`, source `a00a8a7ed910f6ac752ae450b6f9d92cd1983a2e`: `completed / cancelled`;
- no segundo run, a consulta posterior de jobs retorna `total_count: 0`, `jobs: []`.

Isso confirma que o backlog histórico não continua acumulando indefinidamente após `cancel-in-progress: true`.

### 4.1 Workflow atual + prova precisa do scheduler

A `main` recebeu endurecimentos forward-only no workflow canônico, incluindo:

- `4a012aed2d0e01789d0a6171084201d5a598bcdb` — cancelamento de stale runs;
- `b4edef761195b54d3b03a362cdf6e1f0dc959c98` — current-main safety;
- `da35ade063cb23549d5aa80ac4b4707f77cb5246` — retry boolean determinístico no lifecycle current-main safe;
- `2be81adc3e43ae5e8f50060081a683e736435feb` — ratchet correspondente.

O workflow atual preserva a autoridade aprovada:

- `self-hosted`;
- `windows`;
- `x64`;
- `acheguese-heavy-windows`;
- `remote-only`;
- gerador canônico `tools/supabase/generate-supabase-types.ts`;
- snapshot único `src/integrations/supabase/types.generated.ts`;
- branch alvo `main`.

E agora também:

- usa `concurrency.group: supabase-types-sync-main`;
- usa `cancel-in-progress: true`;
- verifica se o SHA disparador ainda pertence à história de `origin/main`;
- se `main` avançou, faz checkout de `origin/main` e **regenera** os tipos sobre o HEAD atual antes de commitar;
- repete fetch/regenerate antes do push se houver corrida adicional.

O run atual conhecido permite separar definitivamente source de infraestrutura:

- workflow run: `33358103649`;
- run number: `17`;
- head: `da35ade063cb23549d5aa80ac4b4707f77cb5246`;
- run status: `pending`;
- job: `99384016420` / `Regenerate canonical database types`;
- job status: `queued`;
- `steps: []`;
- `runner_id: 0`;
- `runner_name: ""`;
- `runner_group_id: 0`;
- labels requisitados: exatamente `self-hosted`, `windows`, `x64`, `acheguese-heavy-windows`, `remote-only`.

Essa é prova direta de que o job chegou ao scheduler mas **nenhum runner foi alocado e nenhum step começou**. Não classificar isso como falha do gerador, YAML ou snapshot.

Portanto, **não** mover o workflow para `ubuntu-latest` e **não** criar segundo executor/segunda autoridade. O desenho atual já trata backlog/stale-main; o blocker remanescente é a disponibilidade/alocação do runner autorizado.

### 4.2 Drift remoto continua real e foi revalidado pelo gerador oficial

Revalidação direta no projeto Supabase `xhdowzacfujckjelqhtd` usando a capability oficial de geração de tipos:

- output remoto atual: `PostgrestVersion: "14.5"`;
- output remoto contém `public.account_deletion_requests`;
- snapshot versionado atual ainda declara `PostgrestVersion: "14.4"`;
- busca no snapshot versionado não encontra `account_deletion_requests`.

Isso prova drift estrutural atual; não é apenas diferença de comentário ou versão textual.

A capability conectada retorna o snapshot completo como payload textual monolítico, mas não como arquivo/materialização transferível para o GitHub. Por governança, **não** será feito patch manual/parcial de campos, versão ou tabelas para simular o output oficial.

Estado correto do gate:

- gerador oficial: **remote truth revalidada**;
- workflow: **arquitetura/race handling endurecidos**;
- backlog antigo: **cancelado/saneado**;
- job atual: **queued sem runner/steps**;
- snapshot versionado: **ainda stale**;
- execução/materialização automática pelo runner autorizado: **ainda sem prova de conclusão**.

### 4.3 Prova adicional de indisponibilidade global do GitHub Actions

Foi criada uma automação one-shot temporária apenas para regenerar `package.json`/`package-lock.json` do React Router com npm oficial e validar `npm ci`, audit, typecheck, lint e build antes de qualquer push de dependências.

A tentativa foi deliberadamente isolada e removida após a prova:

- helper adicionado em `ed108a5da9755a54d5590237ed582741c7780177`;
- workflow run `33363262238`;
- job `99398670833` / `upgrade-lock`;
- runner solicitado: `ubuntu-latest`;
- conclusão: `failure` em aproximadamente 3 segundos;
- `steps: []`;
- `runner_id: 0`;
- `runner_name: ""`;
- nenhum checkout, npm, audit, typecheck, lint ou build executou;
- helper removido em `29aa70f43b37ffd1e1bd0fc01e6039063c1506c7`;
- `package.json` e `package-lock.json` permaneceram intactos.

Isso confirma que o problema de execução não está limitado ao runner Windows autorizado do Types Sync. Até um job trivial em `ubuntu-latest` falhou antes de receber runner/steps. Não criar novos one-shots nem reruns enquanto essa condição persistir.

O run territorial disparado após o hardening inicial de redirect (`33363870188`) repetiu o mesmo padrão: Runtime Tests, E2E e Phase Core terminaram como failure sem execução, com `steps: null` e `logs_url: null`.

## 5. Supabase platform blockers sem superfície de mutação conectada

A superfície conectada atual do Supabase foi reinspecionada e não expõe operação de lifecycle de Storage bucket nem mutation de Auth configuration.

O security advisor vivo continua reportando:

- `Leaked Password Protection Disabled`.

O bucket órfão conhecido `classified-images` também continua dependente de lifecycle oficial de Storage.

Por governança:

- não remover bucket com `DELETE FROM storage.buckets`;
- não alterar tabelas internas de Storage/Auth por SQL;
- não marcar Leaked Password Protection como habilitado sem mutation oficial comprovada.

## 6. Dependency security: React Router 6.30.4 confirmado + mitigação de aplicação

O `package-lock.json` atual fixa:

- `react-router-dom`: `6.30.4`;
- `react-router`: `6.30.4`.

A linha React Router 6.x está fora da política atual de suporte de segurança upstream. Há advisory moderado confirmado para navegação com paths controlados pelo atacante na faixa `>=6.0.0 <7.18.0` (`GHSA-wrjc-x8rr-h8h6` / `CVE-2026-53669`), corrigido em 7.18.0.

Outros advisories recentes foram avaliados separadamente:

- casos de SSR/Data Mode não correspondem ao runtime atual, que usa `BrowserRouter` em Declarative Mode;
- casos de Framework Mode não correspondem ao runtime atual;
- casos de RSC não correspondem ao runtime atual, mas houve backport de segurança adicional na linha 7 em `7.18.2`.

A versão v7 publicada mais recente observada neste corte é `7.18.3`. Portanto o alvo de atualização passou a ser **`react-router-dom 7.18.3`**, não `7.18.1`.

### 6.1 Fluxo de redirect auditado

O `ProtectedRoute` preserva a rota atual e envia o usuário para `/login`, incluindo `redirect`/`redirectTo`.

A volta do login já usa a autoridade central `resolveSafeInternalPath(...)` antes de chamar `navigate(...)`. A auditoria focada também não encontrou chamadas diretas `navigate(searchParams.get(...))` nem `navigate(location....)`.

Entretanto, a implementação anterior de `isRelativeUrl()` aceitava qualquer valor iniciado por `/` que não começasse por `//`. Isso permitia que formas como `/\\evil.example` fossem classificadas inicialmente como caminho interno, exatamente a classe de normalização que o advisory upstream endureceu.

Mitigação aplicada em source:

- `401cfa8d...` introduziu validação central de network paths/backslashes e revalidação de same-origin absolute URLs;
- `fd153c2e...` ampliou para separadores `/` ou `\\` codificados com qualquer quantidade de camadas `%25`, bloqueando a classe `%2F`, `%5C`, `%252F`, `%255C`, etc.;
- a análise é feita somente sobre o pathname, preservando `%2F/%5C` legítimos em query values;
- relative candidates inseguros falham fechados antes do `new URL(...)` poder normalizá-los;
- caracteres de controle também falham fechados em `resolveSafeInternalPath`.

Ratchets:

- `cc5d3f85...` — regressão inicial;
- `9bd0fcaf...` — cobre `//`, `\\`, `/\\`, backslash no meio do pathname, encoding simples, duplo e repetido, query legítima e caractere de controle.

Uma validação isolada da lógica do guard confirmou que todos os payloads maliciosos do ratchet são classificados como inseguros, enquanto query values codificados permanecem válidos. Isso é evidência auxiliar de source; **não substitui Vitest/CI**, que continua bloqueado antes dos steps.

### 6.2 O que ainda não está resolvido

A mitigação acima reduz a superfície alcançável do advisory no fluxo de redirect, mas **não encerra o finding da dependência**.

Ainda é necessário, quando existir ambiente capaz de executar npm:

1. atualizar `react-router-dom` para `7.18.3`;
2. regenerar integralmente `package-lock.json` com npm `11.17.0`/Node 24;
3. validar consistência do manifest/lock;
4. executar `npm ci`;
5. executar `npm audit --omit=dev --audit-level=moderate`;
6. executar typecheck, lint, testes relevantes e build;
7. obter hosted proof Vercel do runtime resultante.

Não editar manualmente pedaços do lockfile e não inferir que as **duas** vulnerabilidades moderadas mostradas pelo npm no deployment `c3dbb324...` são ambas React Router. O React Router 6.30.4 é um finding independente e confirmado; a cadeia exata das duas entradas do `npm audit` continua pendente até o audit executar e produzir output estruturado.

O gate de produção já foi endurecido em `24c773e5aee98dc82584effcfbd5e7ab30c76798` para executar `npm audit --omit=dev --audit-level=moderate` no executor canônico da Vercel. O commit ainda não obteve execução hosted por causa do rate-limit.

## 7. Estado G5 após este addendum

Gates que não devem mais ser reabertos sem nova evidência:

- hosted proof histórico do runtime até `c3dbb324...`;
- sitemap production hosted proof até `c3dbb324...` — 3 arquivos / 114.302 URLs;
- location path-prefix index remote proof (`20260831024311`);
- desenho de concorrência/stale-main do Supabase Types Sync — já endurecido em source mantendo o runner autorizado;
- backlog histórico dos runs `33351562666`/`33352436687` — cancelado;
- identificação do scheduler como blocker do Types Sync — job `99384016420` sem runner/steps;
- identificação de indisponibilidade também em `ubuntu-latest` — run `33363262238` sem runner/steps;
- mitigação central de path normalization do advisory React Router — source `fd153c2e...`, ratchet `9bd0fcaf...`.

Blockers independentes que continuam abertos:

1. materialização integral de `src/integrations/supabase/types.generated.ts` pelo lifecycle autorizado;
2. runner GitHub Actions autorizado ser alocado e executar os steps do Types Sync;
3. remoção do bucket órfão `classified-images` pela Storage API oficial;
4. habilitação de Leaked Password Protection quando houver superfície oficial conectada para Auth config;
5. hosted exercise do ajuste pós-`c3dbb324...` de `.vercelignore`/ignored-build **e do novo hardening de `safeRedirect.ts`**;
6. materializar e validar o upgrade `react-router-dom 7.18.3` + lockfile integral quando houver ambiente capaz de executar npm;
7. executar o production moderate audit para identificar a cadeia exata das `2 moderate severity vulnerabilities` do install hosted.

**G5 permanece EM EXECUÇÃO. Não iniciar G6.**

## 8. Do not repeat

- Não voltar a usar `13e4efb1...` como fronteira hosted mais recente; ela foi superada por `c3dbb324...`.
- Não afirmar que o runtime **atual** está coberto por `c3dbb324...`: `safeRedirect.ts` mudou depois desse deployment.
- Não chamar ausência de runtime errors de teste de carga.
- Não interpretar Vercel `upgradeToPro=build-rate-limit` como falha de source.
- Não reabrir os runs antigos cancelados como se ainda estivessem pending.
- Não diagnosticar o Types Sync como falha de source enquanto `runner_id = 0` e `steps = []`.
- Não mudar o Supabase Types Sync para runner público só para obter execução.
- Não criar novo one-shot de dependências enquanto `ubuntu-latest` também falhar pré-runner.
- Não remover as proteções `cancel-in-progress`/current-main regeneration do workflow atual.
- Não tentar fazer push de snapshot manual/parcial para contornar o runner.
- Não confundir o payload textual integral do gerador conectado com uma materialização segura do arquivo versionado.
- Não usar SQL para mutar `storage.buckets`, `storage.objects` ou Auth internals.
- Não editar manualmente trechos de `package-lock.json` para simular um upgrade npm.
- Não promover a mitigação de `safeRedirect` a “dependência corrigida”; o upgrade para React Router 7.18.3 ainda precisa ser materializado e validado.
- Não afirmar que as duas moderadas do npm são ambas React Router sem output estruturado do audit.
- Não repetir CI/Vercel apenas para confirmar novamente blockers de runner/quota sem mudança de infraestrutura.
- Não iniciar G6 enquanto os blockers independentes acima permanecerem abertos.

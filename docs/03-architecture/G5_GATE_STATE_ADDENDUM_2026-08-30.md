# G5 — Gate state addendum — 2026-08-30

Status: **G5 EM EXECUÇÃO / G6 BLOQUEADO**  
Branch: `main`

Este addendum atualiza somente gates cujo estado mudou depois de `G5_CHECKPOINT_2026-08-30.md`. O checkpoint histórico não deve ser reescrito para apagar a sequência de evidências.

## 1. Hosted build: fronteira avançou de `13e4efb1...` para `c3dbb324...`

O hosted proof inicial de G5 havia sido estabelecido no deployment Vercel `dpl_8aezRhYV8Bur5tG568miVSrh9EJm`, source `13e4efb162baca392c5363e02bdb743143121439`, production `READY`.

Depois de uma janela de rate-limit, a Vercel voltou a executar builds da `main`. O hosted proof mais recente observado neste corte é:

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
- Vite concluiu `built in 32.32s`;
- sitemap de produção validado: index com 3 arquivos e **114.302 URLs**;
- `Build Completed in /vercel/output [3m]`;
- outputs deployados;
- `Deployment completed`;
- consulta de runtime `error`/`fatal` no deployment nas últimas 24h: nenhum log encontrado no recorte observado.

O install também reportou `2 moderate severity vulnerabilities` via npm audit summary. Isso **não** falhou o build, mas permanece finding de launch-hardening até a cadeia de dependências ser identificada e reconciliada; não marcar como resolvido apenas porque o deployment ficou `READY`.

### 1.1 Cobertura do HEAD atual

Comparação GitHub entre `c3dbb324...` e o HEAD `34d63dcb10c948209add097bf4a73246957aff8a` neste corte:

- status: `ahead`;
- `ahead_by: 9`;
- `behind_by: 0`;
- merge-base: o próprio `c3dbb324...`.

Os únicos paths alterados depois do hosted PASS são:

- `.github/workflows/supabase-types-sync.yml`;
- `.vercelignore`;
- documentação G5;
- ratchets/testes de arquitetura/release.

Não houve alteração posterior em `src/`, `api/`, `supabase/migrations/`, `supabase/functions/`, `public/`, `package.json` ou `package-lock.json`.

Portanto a leitura correta é:

- **application/runtime source atual está coberto pelo hosted build de `c3dbb324...`**;
- mudanças posteriores de CI/docs/testes não reabrem o hosted proof do runtime;
- o ajuste posterior de `.vercelignore` para preservar metadata Git no ignored-build step ainda não tem deployment próprio observado e deve permanecer como source/test proof, não como hosted proof.

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

## 4. Actions + canonical types: workflow endurecido, materialização ainda pendente

A migration `20260831024311_add_locations_geographic_path_pattern_index_g5.sql` provou que o gatilho automático por migration funciona:

- `Supabase Types Sync` run `33351562666`;
- source `23679c033b812c97a208229f52725f39c0bb8f55`;
- status observado naquele corte: `pending`;
- jobs: `0` / `[]`.

O blocker não era o trigger; era a ausência de alocação/execução do runner Windows self-hosted autorizado.

### 4.1 Workflow não está mais sujeito ao stale-push simples descrito no checkpoint antigo

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

Portanto, **não** mover o workflow para `ubuntu-latest` e **não** criar segundo executor/segunda autoridade. O desenho atual já trata o backlog/stale-main no próprio lifecycle autorizado.

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
- snapshot versionado: **ainda stale**;
- execução/materialização automática pelo runner autorizado: **ainda sem prova de conclusão**.

## 5. Supabase platform blockers sem superfície de mutação conectada

A superfície conectada atual do Supabase foi reinspecionada e não expõe operação de lifecycle de Storage bucket nem mutation de Auth configuration.

O security advisor vivo continua reportando:

- `Leaked Password Protection Disabled`.

O bucket órfão conhecido `classified-images` também continua dependente de lifecycle oficial de Storage.

Por governança:

- não remover bucket com `DELETE FROM storage.buckets`;
- não alterar tabelas internas de Storage/Auth por SQL;
- não marcar Leaked Password Protection como habilitado sem mutation oficial comprovada.

## 6. Estado G5 após este addendum

Gates que não devem mais ser reabertos sem nova evidência:

- Core Platform/runtime hosted proof até `c3dbb324...`;
- sitemap production hosted proof até `c3dbb324...` — 3 arquivos / 114.302 URLs;
- application/runtime source atual — sem mudanças pós-`c3dbb324...` no compare observado;
- location path-prefix index remote proof (`20260831024311`);
- desenho de concorrência/stale-main do Supabase Types Sync — já endurecido em source mantendo o runner autorizado.

Blockers independentes que continuam abertos:

1. materialização integral de `src/integrations/supabase/types.generated.ts` pelo lifecycle autorizado;
2. runner GitHub Actions autorizado voltar a alocar/executar steps para provar o Types Sync automático;
3. remoção do bucket órfão `classified-images` pela Storage API oficial;
4. habilitação de Leaked Password Protection quando houver superfície oficial conectada para Auth config;
5. hosted exercise do ajuste pós-`c3dbb324...` de `.vercelignore`/ignored-build;
6. identificar e reconciliar as `2 moderate severity vulnerabilities` reportadas pelo npm audit summary do hosted install.

**G5 permanece EM EXECUÇÃO. Não iniciar G6.**

## 7. Do not repeat

- Não voltar a usar `13e4efb1...` como fronteira hosted mais recente; ela foi superada por `c3dbb324...`.
- Não exigir novo hosted build do application/runtime apenas por commits de docs/CI/testes quando o compare prova que runtime não mudou.
- Não chamar ausência de runtime errors de teste de carga.
- Não interpretar o antigo Vercel rate-limit como estado atual; deployments `READY` posteriores já existem.
- Não mudar o Supabase Types Sync para runner público só para obter execução.
- Não remover as proteções `cancel-in-progress`/current-main regeneration do workflow atual.
- Não tentar fazer push de snapshot manual/parcial para contornar o runner.
- Não confundir o payload textual integral do gerador conectado com uma materialização segura do arquivo versionado.
- Não usar SQL para mutar `storage.buckets`, `storage.objects` ou Auth internals.
- Não ignorar o npm audit summary só porque o build passou; primeiro identificar o dependency chain real.
- Não iniciar G6 enquanto os blockers independentes acima permanecerem abertos.

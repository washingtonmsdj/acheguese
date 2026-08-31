# G5 — Gate state addendum — 2026-08-30

Status: **G5 EM EXECUÇÃO / G6 BLOQUEADO**  
Branch: `main`

Este addendum atualiza somente gates cujo estado mudou depois de `G5_CHECKPOINT_2026-08-30.md`. O checkpoint histórico não deve ser reescrito para apagar a sequência de evidências.

## 1. Hosted build posterior aos source fixes: PASS até `13e4efb1...`

Deployment Vercel:

- id: `dpl_8aezRhYV8Bur5tG568miVSrh9EJm`;
- source: `13e4efb162baca392c5363e02bdb743143121439`;
- branch: `main`;
- target: production;
- final state observado: `READY`.

O build executou realmente, não foi um status sintético:

- typecheck/lint gates anteriores foram ultrapassados;
- Vite concluiu `built in 33.50s`;
- sitemap final foi validado;
- outputs foram deployados;
- deployment concluiu normalmente.

### Consequências

Os estados antigos abaixo ficam superseded pela prova posterior:

- `Core Platform ownership paths — CLOSED EM SOURCE / HOSTED RETEST PENDENTE` → **HOSTED PASS até `13e4efb1...`**;
- `sitemap de produção — EXECUÇÃO PENDENTE` → **HOSTED PASS até `13e4efb1...`**.

O sitemap hospedado validado contém:

- 3 arquivos filhos no index final;
- 114.302 URLs.

O mesmo deployment inclui a correção de Business Ownership que removeu acesso direto a `profiles` do caller de Business e preservou a semântica da authority canônica.

## 2. Runtime pós-deploy

A telemetria Vercel consultada após o deployment READY não apresentou runtime errors no recorte disponível das últimas 24 horas.

Isso é prova operacional positiva do recorte observado, mas **não** deve ser promovido a teste de carga: o volume de tráfego observado era baixo.

## 3. Commits posteriores ao último hosted PASS

Depois de `13e4efb1...`, a `main` recebeu novos cortes G5, incluindo:

- publicação/ratchet de `LocationHierarchyReadService`;
- migração remota/source do índice `geographic_path text_pattern_ops`;
- ratchet do pattern index;
- otimização do RPC canônico de descendentes;
- hardening/performance de RLS application-owned;
- evidências de performance correspondentes.

Para esses commits posteriores, o status Vercel voltou a responder:

- `Deployment rate limited — retry in 24 hours`;
- target apontando para `upgradeToPro=build-rate-limit`.

Portanto a fronteira correta é:

- hosted PASS comprovado **até `13e4efb1...`**;
- source + DB proof disponíveis para cortes posteriores;
- hosted retest posterior ainda pendente por rate-limit.

Não converter o rate-limit em falha de source.

## 4. Actions + canonical types: workflow endurecido, materialização ainda pendente

A migration `20260831024311_add_locations_geographic_path_pattern_index_g5.sql` provou que o gatilho automático por migration funciona:

- `Supabase Types Sync` run `33351562666`;
- source `23679c033b812c97a208229f52725f39c0bb8f55`;
- status observado naquele corte: `pending`;
- jobs: `0` / `[]`.

O blocker não era o trigger; era a ausência de alocação/execução do runner Windows self-hosted autorizado.

### 4.1 Workflow não está mais sujeito ao stale-push simples descrito no checkpoint antigo

A `main` recebeu três endurecimentos forward-only no workflow canônico:

- `4a012aed2d0e01789d0a6171084201d5a598bcdb` — `ci(g5): cancel stale Supabase type sync runs`;
- `b4edef76dc538014f9106cda4b14e99ca68bc32c` — `ci(g5): make Supabase types sync safe against stale runs`;
- `da35ade063cb23549d5aa80ac4b4707f77cb5246` — `ci(g5): regenerate Supabase types on latest main`.

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
- repete fetch/rebase-regenerate antes do push se houver corrida adicional.

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

## 5. Estado G5 após este addendum

Gates que não devem mais ser reabertos sem nova evidência:

- Core Platform hosted proof até `13e4efb1...`;
- sitemap production hosted proof até `13e4efb1...`;
- Business Ownership lint/type/build proof até `13e4efb1...`;
- location path-prefix index remote proof (`20260831024311`);
- desenho de concorrência/stale-main do Supabase Types Sync — já endurecido em source mantendo o runner autorizado.

Blockers independentes que continuam abertos:

1. materialização integral de `src/integrations/supabase/types.generated.ts` pelo lifecycle autorizado;
2. runner GitHub Actions autorizado voltar a alocar/executar steps para provar o Types Sync automático;
3. remoção do bucket órfão `classified-images` pela Storage API oficial;
4. habilitação de Leaked Password Protection quando houver superfície oficial conectada para Auth config;
5. hosted retest para os commits posteriores a `13e4efb1...` quando o Vercel liberar novos builds.

**G5 permanece EM EXECUÇÃO. Não iniciar G6.**

## 6. Do not repeat

- Não marcar Core Platform/sitemap como pendentes até `13e4efb1...`; esse hosted proof já existe.
- Não chamar ausência de runtime errors de teste de carga.
- Não interpretar Vercel rate-limit como regressão.
- Não mudar o Supabase Types Sync para runner público só para obter execução.
- Não remover as proteções `cancel-in-progress`/latest-main regeneration do workflow atual.
- Não tentar fazer push de snapshot manual/parcial para contornar o runner.
- Não confundir o payload textual integral do gerador conectado com uma materialização segura do arquivo versionado.
- Não iniciar G6 enquanto os blockers independentes acima permanecerem abertos.

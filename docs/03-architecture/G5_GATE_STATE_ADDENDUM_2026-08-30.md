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
- evidência de performance correspondente.

Para esses commits posteriores, o status Vercel voltou a responder:

- `Deployment rate limited — retry in 24 hours`;
- target apontando para `upgradeToPro=build-rate-limit`.

Portanto a fronteira correta é:

- hosted PASS comprovado **até `13e4efb1...`**;
- source + DB proof disponíveis para cortes posteriores;
- hosted retest posterior ainda pendente por rate-limit.

Não converter o rate-limit em falha de source.

## 4. Actions e canonical types continuam separados

A migration `20260831024311_add_locations_geographic_path_pattern_index_g5.sql` disparou corretamente:

- `Supabase Types Sync` run `33351562666`;
- source `23679c033b812c97a208229f52725f39c0bb8f55`;
- status observado: `pending`;
- jobs: `0` / `[]`.

O gatilho automático por migration está provado funcional. O blocker continua sendo a execução do runner Windows self-hosted autorizado.

Como o workflow faz checkout do SHA do evento e push posterior para `main`, runs que permanecem pendentes enquanto a `main` avança podem terminar non-fast-forward quando o runner voltar. Isso não autoriza mover o workflow para `ubuntu-latest`, reescrever o executor ou criar uma segunda autoridade. Quando a infraestrutura recuperar, a execução válida precisa partir de um HEAD atual e continuar usando o workflow canônico.

## 5. Estado G5 após este addendum

Gates que não devem mais ser reabertos sem nova evidência:

- Core Platform hosted proof até `13e4efb1...`;
- sitemap production hosted proof até `13e4efb1...`;
- Business Ownership lint/type/build proof até `13e4efb1...`;
- location path-prefix index remote proof (`20260831024311`).

Blockers independentes que continuam abertos:

1. materialização integral de `src/integrations/supabase/types.generated.ts` pelo lifecycle autorizado;
2. remoção do bucket órfão `classified-images` pela Storage API oficial;
3. GitHub Actions voltar a alocar runners/executar steps;
4. hosted retest para os commits posteriores a `13e4efb1...` quando o Vercel liberar novos builds.

**G5 permanece EM EXECUÇÃO. Não iniciar G6.**

## 6. Do not repeat

- Não marcar Core Platform/sitemap como pendentes até `13e4efb1...`; esse hosted proof já existe.
- Não chamar ausência de runtime errors de teste de carga.
- Não interpretar Vercel rate-limit como regressão.
- Não mudar o Supabase Types Sync para runner público só para obter execução.
- Não tentar fazer push de snapshot manual/parcial para contornar o runner.
- Não iniciar G6 enquanto os blockers independentes acima permanecerem abertos.

# G5 — Location path-prefix performance proof — 2026-08-30

Status: **REMOTE APLICADO / SOURCE VERSIONADO / RATChET ATIVO / HOSTED RETEST BLOQUEADO POR RATE LIMIT**  
Branch: `main`  
HEAD antes deste checkpoint: `777ddf23acea286bcfe9f4bb9916a25e583e56af`  
Supabase project: `xhdowzacfujckjelqhtd`

## Objetivo

Registrar uma correção de performance G5 sustentada por carga e `EXPLAIN ANALYZE` vivos, sem reabrir o gate amplo de índices já fechado e sem criar índices em massa a partir de advisors genéricos.

## 1. Finding vivo

`pg_stat_statements` mostrou custo recorrente em leituras territoriais por `locations.geographic_path`:

- consultas com `geographic_path = X OR geographic_path LIKE X/%` apareceram com média histórica aproximada de 369 ms em milhares de chamadas;
- consultas com `LIKE prefix%` também apareceram com latência elevada;
- `public.locations` possui aproximadamente 16,5 mil linhas.

O catálogo já tinha B-tree normal e UNIQUE sobre `geographic_path`, ambos com operator class padrão `text_ops`. O database usa collation `en_US.UTF-8`, portanto esses índices não resolviam adequadamente o pattern matching prefixado `LIKE 'prefix%'`.

## 2. Prova antes da correção

Caso de referência: Salvador, path `/br/ba/salvador`.

Antes da migration, o `EXPLAIN (ANALYZE, BUFFERS)` de:

```sql
SELECT *
FROM public.locations
WHERE geographic_path = '/br/ba/salvador'
   OR geographic_path LIKE '/br/ba/salvador/%'
ORDER BY geographic_path ASC;
```

mostrou:

- `Seq Scan` em `locations`;
- 16.359 linhas removidas pelo filtro;
- aproximadamente 195 linhas retornadas;
- execution time observado: ~589,5 ms.

Isso provou que o finding era de plano real, não uma inferência baseada apenas no advisor.

## 3. Migration aplicada pelo lifecycle oficial

A correção foi aplicada usando `Supabase.apply_migration`, sem DDL ad-hoc fora do ledger.

Ledger remoto canônico:

- version: `20260831024311`;
- name: `add_locations_geographic_path_pattern_index_g5`.

Source versionado no mesmo timestamp:

- `23679c033b812c97a208229f52725f39c0bb8f55` — `perf(g5): index location path prefix reads`;
- `supabase/migrations/20260831024311_add_locations_geographic_path_pattern_index_g5.sql`.

A migration:

- falha se o índice alvo já existir;
- cria somente `idx_locations_geographic_path_pattern`;
- usa `geographic_path text_pattern_ops`;
- valida `indisvalid` + `indisready` e a operator class após criação;
- não remove o UNIQUE/B-tree existente;
- não usa `DROP INDEX`, `DROP CONSTRAINT` ou `CASCADE`.

O índice padrão continua necessário para ordenação/comparações gerais; o pattern index é suplementar e existe especificamente para prefix matching em locale não-`C`.

## 4. Prova após a correção

O mesmo caso `= OR LIKE prefix%` foi reexecutado após a migration.

Resultado observado:

- planner deixou o sequential scan amplo;
- utilizou `idx_locations_geographic_path_pattern` nos ramos relevantes;
- execution time: ~20,8 ms;
- mesmo escopo de aproximadamente 195 rows.

Comparação da medição de referência:

- antes: ~589,5 ms;
- depois: ~20,8 ms;
- ganho observado: aproximadamente 28x.

Também foi medido o caminho `LIKE '/br/ba/salvador/%'` isolado, usado pelo repository quando `include_self=false`:

- índice pattern utilizado;
- execution time observado: ~19,5 ms.

## 5. Ratchet

Commit:

- `777ddf23acea286bcfe9f4bb9916a25e583e56af` — `test(g5): ratchet location path prefix index`.

Teste:

- `tests/architecture/location-geographic-path-pattern-index.test.ts`.

O ratchet exige:

- nome canônico do índice;
- `geographic_path text_pattern_ops`;
- postcondition de validade/readiness;
- ausência de drops/cascade destrutivos.

## 6. Integração com o read model territorial

Esse índice é complementar ao corte anterior de hierarchy reads:

- `LocationHierarchyReadService` centraliza expansão ID-only por `rpc_get_location_descendants_ids`;
- `resolveLocationDescendants()` já usa esse caminho e não baixa rows completas;
- o novo pattern index protege consumers legítimos de `LocationRepository.findDescendants()` que realmente necessitam das rows completas e ainda usam prefix matching.

Não substituir a RPC ID-only pelo path-prefix query apenas porque o índice ficou rápido: são contratos diferentes.

## 7. Provider state

A migration de schema disparou automaticamente o workflow canônico `Supabase Types Sync`:

- run: `33351562666`;
- source: `23679c033b812c97a208229f52725f39c0bb8f55`;
- status observado: `pending`;
- jobs observados: `0` / `[]`.

Isso comprova novamente que o gatilho de migrations está funcionando. A materialização do snapshot continua bloqueada pela indisponibilidade do runner Windows self-hosted autorizado; não mover esse workflow para `ubuntu-latest` apenas para obter execução.

No HEAD `777ddf23...`, o status Vercel continua `Deployment rate limited — retry in 24 hours`. Portanto os commits desta correção ainda não possuem hosted build posterior. O rate-limit não invalida a prova SQL remota da migration.

## 8. G5 consequence

Esse finding específico está **CORRIGIDO e PROVADO no banco remoto**, com source/ledger/ratchet alinhados.

G5 como um todo permanece **EM EXECUÇÃO** pelos blockers independentes já documentados:

1. materialização integral do snapshot Supabase canônico;
2. lifecycle oficial do bucket órfão `classified-images`;
3. GitHub Actions com runner e steps reais;
4. hosted retest para commits posteriores ao último deployment READY quando o Vercel liberar.

**Não iniciar G6.**

## 9. Do not repeat

- Não criar outro índice B-tree normal em `geographic_path`.
- Não remover os índices padrão/UNIQUE existentes por parecerem redundantes ao pattern index.
- Não substituir a RPC ID-only pelo read de rows completas.
- Não indexar em massa outras FKs/tabelas sem `EXPLAIN` ou carga que justifique.
- Não alterar o runner autorizado do Supabase Types Sync para mascarar o blocker de infraestrutura.
- Não interpretar o rate-limit do Vercel como falha desta migration.

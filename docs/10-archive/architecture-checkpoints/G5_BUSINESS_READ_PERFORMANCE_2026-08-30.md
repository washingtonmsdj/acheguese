# G5 — Business read performance proof — 2026-08-30

Status: **SOURCE OTIMIZADO / PROVA SQL VIVA / HOSTED RETEST PENDENTE POR RATE LIMIT**  
Branch: `main`

## Objetivo

Registrar uma correção de performance em leituras de Business baseada em `pg_stat_statements`, inspeção do mapper e `EXPLAIN ANALYZE` vivos, sem criar índice sem necessidade e sem alterar o contrato público de `Business`.

## 1. Finding vivo

`pg_stat_statements` mostrou consultas de `business_data` com joins de `addresses` e `locations` em aproximadamente 216 ms médios no histórico observado.

O catálogo vivo mostrou:

- `business_data`: aproximadamente 100 rows;
- apenas 22 rows ativas com `business_role` em `standalone/branch` no caso medido;
- índices relevantes já presentes.

Portanto o volume não justificava um novo índice por si só.

## 2. Reprodução antes do corte

Foi executado `EXPLAIN (ANALYZE, BUFFERS)` de uma leitura equivalente ao padrão antigo:

- `business_data.*`;
- `addresses.*`;
- `locations.*`;
- filtro `status = 'active'`;
- roles `standalone/branch`;
- ordenação por `created_at DESC`.

Resultado observado:

- 22 empresas retornadas;
- scan de `business_data` já usando `idx_business_data_status`;
- lookup de `locations` já usando `locations_pkey`;
- execution time total: aproximadamente **223,2 ms**.

Os scans base eram pequenos. A maior diferença vinha de carregar/serializar rows relacionais completas, especialmente `locations`, que contém payload territorial muito maior do que o mapper de Business utiliza.

## 3. Contrato efetivamente consumido

`mapBusinessDataToBusiness()` foi inspecionado antes da alteração.

Da relação `address`, o mapper utiliza somente:

- `street`;
- `number`;
- `complement`;
- `postal_code`;
- `latitude`;
- `longitude`.

Da relação `location`, utiliza somente:

- `name`;
- `full_name`;
- `geographic_path`;
- `canonical_lat`;
- `canonical_lng`.

Não há consumo de `boundary`, metadata territorial integral ou demais colunas da row completa de `locations` nesse mapper.

## 4. Prova da projeção mínima

O mesmo conjunto foi medido com `business_data.*` preservado, mas projeções relacionais limitadas ao contrato acima.

Resultado observado:

- mesmas 22 empresas;
- execution time: aproximadamente **13,7 ms**;
- redução observada de aproximadamente **16x** em relação à leitura ampla de referência.

Essa medição não depende de índice novo.

## 5. Source aplicado

Commit:

- `88a6636da1dd038c7e4462f9fcf7355939692cb6` — `perf(g5): trim business location relation payload`.

Mudanças:

- criado `BUSINESS_CANONICAL_RELATIONS_SELECT`;
- `getBusinesses()` mantém `business_data.*`, mas deixa de buscar `addresses(*)` e `locations(*)`;
- `getBusinessById()` mantém `business_data.*` + profile necessário, mas usa o mesmo subset canônico para address/location;
- filtros, ordenação, IDs e mapeamento público foram preservados.

Ratchet:

- `50d2cbe98189a6b49e23572c6f1a5ef3c23f425c` — `test(g5): ratchet business relation projection`;
- `tests/architecture/business-relation-projection-performance.test.ts` impede retorno de `address:addresses!address_id(*)`, `location:locations!location_id(*)` e `boundary` nesses reads.

## 6. Hierarchy read ownership consolidado

O mesmo owner de Business ainda tinha chamada direta a `rpc_get_location_descendants_ids` em `getBusinessesList()`.

Esse acesso foi migrado para a autoridade canônica de Location:

- `55b5b5f10fff94d2abcd490095e4627873c364ef` — Business delega para `LocationHierarchyReadService.getDescendantIds()`;
- fallback anterior foi preservado: se a expansão falhar, o filtro exato original continua sendo usado.

Classifieds foi reconciliado no mesmo contrato:

- `d7c35232d090f5266d4c77650dd7aebe0f104ceb` — remove a chamada RPC direta e delega a expansão ID-only ao mesmo service;
- a leitura adicional via `LocationService` foi mantida porque ainda é necessária para descobrir `parentCityId` quando o território é um distrito;
- o fallback exato também foi preservado.

Ratchets posteriores:

- `32174be783c8d20d4de509ac845be5114bcf0ed9` — Business hierarchy ownership;
- `1c9d8b8eeadd1c31003cae46b1ce56376989c185` — Classifieds hierarchy ownership;
- `415f2a91aca7196bca782bcfabb4169a7c5888d0` — proíbe o nome da RPC diretamente nos dois consumers, deixando o RPC encapsulado no `LocationHierarchyReadService`.

## 7. Provider state

Os commits deste corte são posteriores ao último deployment Vercel comprovadamente `READY` (`13e4efb1...`).

O Vercel continua retornando `build-rate-limit` para HEADs posteriores, portanto:

- a prova SQL de performance é válida;
- o source está versionado e ratcheado;
- o hosted retest ainda não foi executado para este corte;
- não marcar o build posterior como PASS até o provider realmente executar.

## 8. G5 consequence

Este finding específico está **CORRIGIDO EM SOURCE e JUSTIFICADO POR PROVA VIVA**.

G5 permanece **EM EXECUÇÃO** pelos blockers independentes já registrados:

1. materialização integral do snapshot Supabase canônico;
2. lifecycle oficial do bucket órfão `classified-images`;
3. GitHub Actions voltar a executar jobs/steps;
4. hosted retest dos commits posteriores ao último deployment READY.

**Não iniciar G6.**

## 9. Do not repeat

- Não criar índice em `business_data` para este finding sem nova evidência: os scans base já eram rápidos.
- Não voltar a `addresses(*)` / `locations(*)` nos read models de Business.
- Não carregar `boundary` para construir o domínio `Business` quando o mapper não o usa.
- Não chamar `rpc_get_location_descendants_ids` diretamente de Business ou Classifieds.
- Não remover a resolução de `parentCityId` de Classifieds sem substituir explicitamente a regra de alcance `reach='city'`.
- Não interpretar Vercel rate-limit como regressão de source.

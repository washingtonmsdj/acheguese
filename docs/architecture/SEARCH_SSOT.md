# Search SSOT

Status: vigente
Data: 2026-07-14
Owner: `src/core/search`

## 1. Decisao

`SearchService` e o unico orquestrador da busca publica federada. Ele nao e
owner das entidades pesquisadas e nao acessa tabelas de dominio diretamente.

Cada dominio conserva:

- consulta e filtros eficientes;
- regras de visibilidade;
- ranking interno;
- URL publica canonica;
- formato mestre da entidade.

A composition root `src/core/search/providers/searchProviders.ts` registra os
providers de Comunidades, Empresas, Profissionais, Oportunidades,
Classificados, Eventos e Posts. `SearchDocument` e somente um read model para
apresentacao e descoberta; nunca substitui a entidade canonica.

## 2. Fluxo canonico

```text
BuscaPage / futuro consumidor comunitario
  -> useGlobalSearch
  -> SearchService.search
  -> providers registrados
  -> services canonicos dos dominios
  -> SearchDocumentMapper
```

Hooks podem manter debounce, cache, cancelamento e estado visual. Eles nao
podem executar consultas por tipo, ordenar resultados mestres ou acessar
Supabase.

## 3. Escopos

- Busca global recebe filtros territoriais opcionais.
- Busca comunitaria recebe `communityId` e o filtro territorial canonico.
- Comunidade e filtrada pelo proprio ID.
- Empresa, Profissional, Classificado, Evento e Post exigem vinculo ativo em
  `community_entity_links`; ausencia ou falha de leitura retorna zero itens
  desses buckets.
- Oportunidade ainda nao possui tipo de vinculo comunitario. Nesse bucket, o
  territorio canonico e obrigatorio quando `communityId` estiver presente;
  sem ele, o provider falha fechado e nao executa consulta global.
- Community apenas filtra e compoe. Nenhuma entidade mestre e copiada para o
  agregado comunitario.

Historicos usam namespaces explicitos: `global`, `community:<id>` ou
`territory:<id>`. Termos de um escopo nao sao reutilizados implicitamente em
outro.

## 4. Limites e falhas

- minimo de consulta: 2 caracteres;
- resultado normal por provider: 20;
- candidatos para filtro comunitario: no maximo 100;
- vinculos ativos carregados por busca: no maximo 100, igual ao teto do
  repositorio;
- provider indisponivel retorna bucket vazio sem apagar providers saudaveis;
- cancelamento e cooperativo antes e depois das chamadas de dominio e o
  `AbortError` nunca e convertido em sucesso vazio;
- launch gates impedem consultas de Eventos/Oportunidades quando a superficie
  correspondente estiver pausada.

O contrato atual entrega um conjunto superior limitado e nao oferece
paginacao. Portanto, adicionar cursor artificial agora nao traria garantia de
ordenacao federada. Se o produto exigir pagina seguinte, cada provider devera
publicar cursor keyset e o agregador devera definir ranking/merge estavel antes
de expor esse contrato.

## 5. Observabilidade e privacidade

Cada busca emite `search.federated.duration` com categoria e presenca de
escopo comunitario. A busca lenta gera warning a partir de 450 ms. Telemetria
e erros registram apenas comprimento da consulta, categoria e existencia de
escopo; o texto pesquisado nao e enviado.

O p95 real deve ser agregado em staging/producao observavel. Nao se declara
SLO atendido com teste unitario. Um indice dedicado ou read model materializado
so pode ser proposto quando p95, volume, planos de consulta e custo mostrarem
que os indices/read models dos dominios deixaram de ser suficientes.

## 6. Remocoes

Foram removidos `core/community/hooks/useSearch.ts` e
`core/community/components/SearchModal.tsx`. Ambos estavam sem consumidores;
o hook repetia debounce/historico e fazia cinco consultas de Post por tipo,
com ordenacao no browser. Nao foi mantido adapter deprecated porque nao havia
chamada ativa.

## 7. Guardrails

- novos dominios entram por `SearchProvider`, nunca por branch em
  `SearchService`;
- provider nao pode gravar nem tornar Search owner do dominio;
- escopo comunitario novo precisa declarar vinculo exato ou estrategia
  territorial fail-closed;
- limites permanecem centralizados em `searchConfig.ts`;
- nenhum provider recebe tabela, coluna ou bucket da interface;
- testes de contrato devem falhar se a busca comunitaria paralela reaparecer.

## 8. Evidencias

- `src/core/search/services/__tests__/SearchService.spec.ts`;
- `tests/architecture/search-ssot.test.ts`;
- testes das paginas `BuscaPage` e `BuscarPage`;
- `npm run typecheck:app`;
- lint focado e `git diff --check`.

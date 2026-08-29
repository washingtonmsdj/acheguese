# Search SSOT

Status: G4 source/authority fechado
Data-base: 2026-08-29
Owner: `src/core/search`

## 1. Decisao

`SearchService` e o unico orquestrador da busca publica federada. Ele nao e
owner das entidades pesquisadas, nao acessa Supabase diretamente e nao conhece
tabelas/read models de dominio.

Cada dominio conserva:

- consulta e filtros eficientes;
- regras de visibilidade;
- ranking interno;
- URL publica canonica;
- formato mestre da entidade;
- read models proprios quando necessarios.

A composition root `src/core/search/providers/searchProviders.ts` registra os
providers de Comunidades, Empresas, Profissionais, Oportunidades,
Classificados, Eventos e Posts. Cada provider delega para o service canonico do
dominio correspondente. `SearchDocument` e somente um read model para
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

`useGlobalSearch` permanece como adapter de UI do owner Search: debounce,
cache, cancelamento e historico. Ele nao executa consulta por tipo, nao acessa
Supabase e nao define ranking mestre.

## 3. Read models de dominio

Search nao possui tabela universal nem view universal de busca.

- `public.public_business_search` pertence ao dominio Business. No remoto atual
  ele e uma tabela/read model sanitizada, sincronizada server-side pelo trigger
  `private.sync_public_business_search_row()` a partir de `business_data`.
- `public.public_professional_search` pertence ao dominio Professional. No
  remoto atual ele e uma view `security_invoker=true` sobre o owner
  `professional_data`.
- o provider Business chama `BusinessService.getBusinessesList()`;
- o provider Professional chama `ProfessionalService.searchProfessionals()`;
- Search nao referencia `public_business_search` nem
  `public_professional_search` diretamente.

As migrations `20260829201534` e `20260829201727` endureceram a autoridade
desses read models. `anon`, `authenticated` e `service_role` possuem somente
`SELECT`; nenhum deles possui INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ou
TRIGGER nesses objetos.

## 4. Escopos

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

## 5. O que nao pertence a este SSOT

Funcoes remotas `search_entities_by_bounds`, `search_entities_by_radius` e
`search_entities_hybrid` sao contratos geoespaciais. Elas resolvem entidades
por bounds/raio/territorio e pertencem ao boundary Maps/Geospatial; nao sao um
segundo agregador textual de Search.

`search_logs` e uma funcao de observabilidade service-role-only e tambem nao
participa da busca publica federada.

Nenhum desses contratos substitui `SearchService`.

## 6. Limites e falhas

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
paginacao. Adicionar cursor artificial sem ranking federado estavel nao e
permitido. Se o produto exigir pagina seguinte, cada provider devera publicar
cursor keyset e o agregador devera definir ranking/merge estavel antes de expor
essa capacidade.

## 7. Observabilidade e privacidade

Cada busca emite `search.federated.duration` com categoria e presenca de
escopo comunitario. A busca lenta gera warning a partir de 450 ms. Telemetria
e erros registram apenas comprimento da consulta, categoria e existencia de
escopo; o texto pesquisado nao e enviado.

O p95 real deve ser agregado em staging/producao observavel. Nao se declara
SLO atendido com teste unitario. Um indice dedicado ou read model materializado
so pode ser proposto quando p95, volume, planos de consulta e custo mostrarem
que os indices/read models dos dominios deixaram de ser suficientes.

## 8. Remocoes e caminhos rejeitados

Foram removidos `core/community/hooks/useSearch.ts` e
`core/community/components/SearchModal.tsx`. Ambos estavam sem consumidores;
o hook repetia debounce/historico e fazia cinco consultas de Post por tipo,
com ordenacao no browser. Nao foi mantido adapter deprecated porque nao havia
chamada ativa.

Durante o hardening de 2026-08-29 foi testado mover `useGlobalSearch` para
`src/modules/search`, mas isso exigiria um bridge `core -> modules`, proibido
pela arquitetura global. O corte temporario foi integralmente revertido antes
do fechamento; nao existe segunda copia ativa do hook.

## 9. Guardrails

- novos dominios entram por `SearchProvider`, nunca por branch em
  `SearchService`;
- provider nao pode gravar nem tornar Search owner do dominio;
- SearchService/providers nao podem acessar Supabase diretamente;
- Search nao pode consultar `public_business_search` ou
  `public_professional_search` diretamente;
- escopo comunitario novo precisa declarar vinculo exato ou estrategia
  territorial fail-closed;
- limites permanecem centralizados em `searchConfig.ts`;
- nenhum provider recebe tabela, coluna ou bucket da interface;
- busca espacial/geografica continua owner de Maps/Geospatial e nao deve ser
  absorvida pelo Search textual;
- read models publicos de Business/Professional permanecem SELECT-only para
  roles externas;
- testes de contrato devem falhar se a busca comunitaria paralela reaparecer.

## 10. Evidencias

- `src/core/search/services/__tests__/SearchService.spec.ts`;
- `tests/architecture/search-ssot.test.ts`;
- `src/app/pages/__tests__/BuscaPage.spec.tsx`;
- migration `20260829201534_harden_public_search_read_model_grants.sql`;
- migration `20260829201727_lock_public_search_read_models_to_select.sql`;
- revalidacao remota de grants em 2026-08-29: somente SELECT para
  `anon`/`authenticated`/`service_role` nos dois read models;
- metadata remota: `public_professional_search` com
  `security_invoker=true`; `public_business_search` com RLS habilitado e
  sincronizacao server-owned.

Este fechamento e de G4 source/authority. Drift exaustivo de migrations,
performance real, indexes, provenance de legados e certificacao same-SHA
continuam em G5/G7.

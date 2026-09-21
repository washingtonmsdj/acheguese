# Checkpoint R4 — Business discovery launch boundary — 2026-09-21

## Problema confirmado

O modulo Business permanece ativo no MVP, mas a categoria `educacao` pertence ao surface `education`, atualmente pausado.

A primeira correcao protegeu a landing de Empresas. A auditoria seguinte mostrou que outras superficies ativas ainda podiam descobrir os mesmos registros por caminhos paralelos:

- Busca federada via `BusinessService.getBusinessesList`;
- Home via `LandingFeaturedService`;
- Mapa via `MapBusinessLayerRuntimeService`;
- Perto de Mim e busca espacial/IA via `SpatialSearchService`.

## Evidencia remota

No Supabase canonico, uma chamada real a `search_entities_by_radius` com centro aproximado do launch cluster (`-13.01, -38.48`) e raio de 8 km retornou:

- 7 resultados Business brutos;
- 7 com `category=educacao`;
- 0 launch-safe no estado atual.

Isso confirma que, sem boundary de launch no discovery, Mapa/Perto de Mim poderiam expor apenas entidades de um modulo pausado.

O probe versionado
`tests/security/business-discovery-launch-remote-probe.sql`
foi executado contra o projeto canonico e concluiu sem excecao em `ROLLBACK`.

## Correcao

### Autoridade

`src/app/config/launchScope.ts` continua sendo o owner unico da relacao categoria -> surface e agora expoe `getLaunchPausedBusinessCategoryIds()`.

### Lista publica e Busca

`business.queries.ts` aplica a exclusao no read model antes de `range()`.
Como Busca federada consome `BusinessService.getBusinessesList`, herda o mesmo boundary sem filtro paralelo.

### Home

`LandingFeaturedService`:

- exclui categorias pausadas antes do `limit`;
- faz overfetch bounded de links comunitarios e corta somente depois do filtro;
- exclui categorias pausadas da contagem de empresas;
- nao consulta `education_profiles` para stats quando `education=false`.

### Mapa

`MapBusinessLayerRuntimeService` aplica a exclusao antes do `limit` do viewport.

### Perto de Mim / espacial / IA

As RPCs espaciais continuam genericas e sem mudanca de assinatura.
`SpatialSearchService` faz overfetch bounded apenas para Business e delega a decisao de visibilidade para
`BusinessService.getLaunchVisibleBusinessProfileIds()`.

O lookup em lote pertence a `BusinessQueries`; Geospatial nao ganhou acesso direto ao read model Business.
Falha no lookup retorna conjunto vazio, preservando fail-closed.

## Ratchets

- `tests/architecture/business-discovery-launch-boundary.test.ts`;
- `tests/architecture/public-launch-scope-ssot.test.ts`;
- `tests/architecture/map-business-bounded-read.test.ts`;
- `src/app/config/__tests__/launchScope.spec.ts`;
- probe remoto rollback-only citado acima.

## Estado

**R4 Business discovery: parcialmente certificado.**

Provado:

- dado real que reproduz o vazamento;
- boundary unico de launch;
- Busca, Home, Mapa e discovery espacial cobertos no source;
- owner Business preservado no lookup espacial;
- backend de stats de Educacao nao e chamado quando pausado;
- probe remoto sem persistencia.

Ainda pendente:

- CI do mesmo SHA;
- browser E2E do mesmo SHA;
- build/deploy do mesmo SHA.

Esses itens continuam bloqueados pela indisponibilidade dos runners e pela cota de deploy, e nao foram marcados como aprovados.

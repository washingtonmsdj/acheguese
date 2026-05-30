# Plano de Execucao: Distribuicao Territorial da Comunicacao

Data: 2026-05-15
Status: fase em implementacao
Fonte arquitetural: `docs/COMUNICACAO_TERRITORIAL_ARCHITECTURE.md`

## Decisao de Produto

`/comunicacao` deve ser a descoberta de agentes de comunicacao do territorio: portais locais, radios, TVs de bairro, jornais regionais, coletivos, paginas de bairro e comunicadores/agentes culturais.

As publicacoes desses canais nao devem ficar presas ao modulo. Elas devem alimentar a comunidade relacionada e, futuramente, outros contextos da plataforma.

Fluxo correto:

1. Canal publica pela `/central/comunicacao`.
2. Publicacao nasce em `communication_publications`.
3. Sistema cria destinos em `communication_publication_distribution`.
4. Comunidade exibe uma aba `Comunicacao` filtrada pelo territorio.
5. Materia/reportagem abre canonical em `/comunicacao/...`.
6. Postagem comum pode abrir inline na comunidade.

## Nao Objetivos

- Nao transformar canal de comunicacao em `business`.
- Nao duplicar publicacao como post social comum.
- Nao criar feed social paralelo em `/comunicacao`.
- Nao acoplar UI de comunidade diretamente ao Supabase do dominio.

## Modelo de Conteudo

Adicionar em `communication_publications`:

```sql
content_format text not null default 'article'
```

Valores:

- `article`: materia, reportagem, cobertura editorial ou conteudo que deve abrir no feed/pagina do canal.
- `update`: postagem comum com texto/fotos que pode ser consumida diretamente na comunidade.

Tipos existentes continuam validos:

- `news`
- `coverage`
- `event`
- `job`
- `public_utility`
- `report`

## Modelo de Distribuicao

Tabela implementada:

```sql
communication_publication_distribution:
id
publication_id
channel_id
location_id
target_type
is_active
relevance_score
rank_score
rank_reason
created_at
updated_at
```

Valores de `target_type`:

- `communication_hub`
- `community_tab`
- `contextual_feed`

Decisao tecnica da primeira entrega: nao criar `target_context`, `territorial_group_id` nem `module_key` agora. A distribuicao inicial fica normalizada por `publication_id`, `channel_id`, `location_id` e `target_type`. Grupo territorial e resolvido no service pela lista de `location_id` membros.

## SSOT de Relevancia e Seguranca

A relevancia inicial da distribuicao nao deve ser calculada no frontend.

SSOT atual:

```sql
communication_distribution_relevance_score(publication_type, content_format, target_type)
```

Essa funcao calcula `relevance_score` inicial por tipo de publicacao, formato e destino. A UI apenas consome a ordenacao retornada pelo service.

SSOT de ranking de leitura:

```sql
communication_distribution_rank_score(publication_type, content_format, target_type, reliability_score)
communication_distribution_rank_reason(publication_type, content_format, target_type, reliability_score)
```

`rank_score` e o campo usado para ordenacao da aba comunitaria. Ele combina relevancia territorial inicial com confiabilidade do canal. Recencia/trending dinamico deve ser implementado em fase posterior sem mover a regra para UI.

Hardening aplicado:

- `communication_upsert_default_distribution(publication_id)` e funcao interna.
- `communication_distribution_relevance_score(...)` tambem e funcao interna.
- `communication_distribution_rank_score(...)` e `communication_distribution_rank_reason(...)` tambem sao funcoes internas.
- Execucao direta por `anon` e `authenticated` foi revogada.
- Operadores publicam via `publish_communication_publication`, que valida permissao do canal e territorio antes de materializar distribuicao.
- Nao ha SQL dinamico nas funcoes de distribuicao.
- RLS de leitura exige publicacao `published`, canal `active` e distribuicao `is_active = true`.

## Services

Criar `CommunicationDistributionService` em `src/core/communication-territorial/services`.

Responsabilidades:

- gerar destinos padrao ao publicar;
- listar publicacoes distribuidas para uma comunidade/territorio;
- aplicar filtros por `publication_type` e `content_format`;
- retornar dados prontos para card comunitario;
- construir a URL canonica de materia quando `content_format = article`;
- declarar comportamento de clique para UI.

O service nao deve importar componentes de comunidade. A comunidade consome o contrato do core.

## Comunidade

Adicionar uma aba ou secao `Comunicacao` em `/comunidade/:state/:city`.

Essa aba deve:

- listar publicacoes distribuidas por `location_id` e grupo territorial resolvido;
- mostrar canal, selo, tipo, data, territorio e score;
- permitir filtros simples por tipo;
- abrir `article` na canonical do canal/publicacao;
- expandir `update` inline ou em detalhe leve;
- manter canonical editorial quando o conteudo for espelho de `/comunicacao`.

## UX de Clique

`article`:

- card mostra titulo, resumo, canal e selo;
- clique principal leva para canonical em `/comunicacao/...`;
- uso esperado: reportagem, materia, cobertura apurada.

`update`:

- card mostra texto/foto e canal;
- clique expande no proprio contexto da comunidade;
- uso esperado: postagem curta, comunicado visual, foto, recado local.

## Checklist de Implementacao

- [x] Migration: adicionar `content_format` em `communication_publications`.
- [x] Migration: criar `communication_publication_distribution`.
- [x] RLS: leitura publica apenas para publicacoes publicadas e distribuicoes ativas.
- [x] RPC/service: criar distribuicao padrao ao publicar.
- [x] Core: adicionar tipos `CommunicationContentFormat` e `CommunicationDistributionTarget`.
- [x] Core: criar `CommunicationDistributionService`.
- [x] Core: criar helper de comportamento de clique.
- [x] Central: permitir escolher `article` ou `update` no formulario.
- [x] Comunidade: adicionar aba `Comunicacao`.
- [x] Comunidade: consumir service, sem Supabase direto.
- [x] UI: renderizar card diferente para materia e postagem comum.
- [x] E2E operacional: aba `Comunicacao` da comunidade resolve dentro da shell territorial.
- [x] E2E: publicacao aparece na aba de Comunicacao da comunidade.
- [x] E2E: article aponta para `/comunicacao/...`.
- [x] E2E: update aparece inline sem obrigar saida da comunidade.
- [x] Segurança: função interna de upsert de distribuição não fica exposta como RPC pública.
- [x] SSOT: score inicial de distribuição centralizado em função SQL.
- [x] Governance: validador de arquitetura falha se função interna voltar a ser exposta por migration.
- [x] Ranking: `rank_score`/`rank_reason` materializados no banco e consumidos pelo service.
- [x] E2E autenticado real (condicional): operador publica pela Central e valida aparicao na comunidade quando o ambiente possui canal operavel e territorio piloto autorizado.
- [ ] E2E autenticado real deterministico: criar fixture seedada para nao depender de pre-condicoes manuais do ambiente.

## Gates

- `npm run validate:architecture:communication`
- teste unitario do `CommunicationDistributionService`
- E2E da aba `Comunicacao` na comunidade
- lint dos arquivos alterados
- typecheck pode continuar sendo tratado separadamente enquanto o monolito estiver em hardening

# Performance Playbook - Circulacao Economica Territorial

## Objetivo

Medir impacto real da consolidacao tecnica sem expandir escopo funcional.
Foco: feed, oportunidades, vagas e busca global.

## Escopo validado

- `work_opportunities` (cards, detalhe, historico)
- `vagas` estruturadas (busca e timeline)
- busca global unificada (oportunidades + vagas + profissionais + servicos)

## Mudancas tecnicas aplicadas nesta fase

- Migration de indices de performance:
  - `supabase/migrations/20260516170000_optimize_economic_circulation_queries.sql`
- Telemetria de latencia (slow operations) adicionada em:
  - `src/core/search/services/SearchService.ts`
  - `src/core/work-opportunities/services/WorkOpportunitiesService.ts`

## Passo 1 - Aplicar migration em staging

1. Aplicar migration `20260516170000_optimize_economic_circulation_queries.sql`.
2. Confirmar schema reload sem erro.
3. Executar:
   - `npm run validate:migrations`
   - `npm run validate:deps`

## Passo 2 - Coletar baseline funcional (antes/depois)

Medir as 3 jornadas abaixo em janela curta (10 a 20 minutos):

1. Busca global
- termo: `pizzaiolo pituba`
- termo: `pedreiro amaralina`
- termo: `eletricista`

2. Oportunidades (listagem e detalhe)
- abrir listagem territorial
- aplicar filtros categoria/urgencia
- abrir 3 detalhes seguidos

3. Vagas estruturadas
- busca por texto
- ordenacao por recencia
- abrir 3 detalhes seguidos

## Passo 3 - Ler telemetria de slow operations

Procurar logs:

- `[SearchService] Slow global-search`
- `[SearchService] Slow work-opportunity-search`
- `[SearchService] Slow structured-vagas-search`
- `[WorkOpportunitiesService] Slow listPublicOpportunityCards`
- `[WorkOpportunitiesService] Slow getPublicOpportunityDetail`
- `[WorkOpportunitiesService] Slow listRecentOpportunitiesByAuthorProfile`

## Passo 4 - Rodar EXPLAIN (ANALYZE, BUFFERS)

Rodar no banco staging para confirmar uso dos novos indices.
Script padrao:

- `docs/architecture/sql/economic-circulation-performance-check.sql`

### 4.1 Oportunidades publicas (timeline + filtros)

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, headline, professional_category, territory_location_id, urgency, published_at, created_at
FROM public.work_opportunities
WHERE status = 'active'
  AND visibility = 'public_listed'
ORDER BY published_at DESC NULLS LAST, created_at DESC
LIMIT 40;
```

### 4.2 Busca textual em oportunidades

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, headline, description, professional_category
FROM public.work_opportunities
WHERE status = 'active'
  AND visibility = 'public_listed'
  AND (
    headline ILIKE '%pizzaiolo%'
    OR description ILIKE '%pizzaiolo%'
    OR professional_category ILIKE '%pizzaiolo%'
  )
ORDER BY created_at DESC
LIMIT 20;
```

### 4.3 Busca textual em vagas

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, titulo, categoria, bairro_nome, published_at, created_at
FROM public.vagas
WHERE (
  titulo ILIKE '%pizzaiolo%'
  OR descricao ILIKE '%pizzaiolo%'
  OR categoria ILIKE '%pizzaiolo%'
  OR bairro_nome ILIKE '%pituba%'
)
ORDER BY published_at DESC NULLS LAST, created_at DESC
LIMIT 20;
```

## KPIs operacionais alvo (curto prazo)

- p95 `global-search` < 700ms
- p95 `work-opportunity-search` < 600ms
- p95 `structured-vagas-search` < 600ms
- p95 `listPublicOpportunityCards` < 500ms
- p95 `getPublicOpportunityDetail` < 550ms

## Criticos para observar

- sequencial scan em `work_opportunities` com alto custo mesmo com filtros
- baixa seletividade de `ILIKE` em termos curtos
- aumento de tempo em horarios de pico por concorrencia

## Decisao de continuidade

Se KPIs atingidos:
- congelar camada de dados desta fase e seguir para UX/ativacao/retencao.

Se KPIs nao atingidos:
- aplicar ajuste cirurgico por query critica (sem refatoracao arquitetural).
- revalidar somente jornada afetada.

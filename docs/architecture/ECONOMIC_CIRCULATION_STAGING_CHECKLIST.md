# Checklist de Staging - Circulacao Economica

## Objetivo

Executar validacao controlada de performance e estabilidade do core economico territorial sem mudar funcionalidades.

## Pre-condicoes

- Migration aplicada: `20260516170000_optimize_economic_circulation_queries.sql`
- Build de referencia concluido com sucesso
- Ambiente com dados reais/minimamente representativos
- Logs de aplicacao habilitados

## Etapa 1 - Sanidade tecnica

1. Rodar `npm run validate:migrations`
2. Rodar `npm run validate:deps`
3. Rodar `npm run build`
4. Confirmar:
- sem erros bloqueantes
- sem regressao de arquitetura

## Etapa 2 - Jornadas criticas

Executar 3 vezes cada jornada e registrar tempo medio percebido + p95 de logs.

### 2.1 Busca global

- termo: `pizzaiolo pituba`
- termo: `pedreiro amaralina`
- termo: `eletricista`

### 2.2 Oportunidades

- abrir listagem territorial
- aplicar filtros (categoria, urgencia, disponibilidade)
- abrir 3 detalhes consecutivos

### 2.3 Vagas estruturadas

- busca textual
- ordenacao por recencia
- abrir 3 detalhes consecutivos

## Etapa 3 - Conferencia de logs de latencia

Conferir ocorrencias:

- `[SearchService] Slow global-search`
- `[SearchService] Slow work-opportunity-search`
- `[SearchService] Slow structured-vagas-search`
- `[WorkOpportunitiesService] Slow listPublicOpportunityCards`
- `[WorkOpportunitiesService] Slow getPublicOpportunityDetail`
- `[WorkOpportunitiesService] Slow listRecentOpportunitiesByAuthorProfile`

## Etapa 4 - Validacao de banco (EXPLAIN)

Executar script SQL padrao:

- `docs/architecture/sql/economic-circulation-performance-check.sql`
- comandos prontos:
  - `docs/architecture/ECONOMIC_CIRCULATION_BENCHMARK_COMMANDS.md`

Confirmar:

- uso de indices esperados
- reducao de sequencial scan nas consultas criticas
- ausencia de regressao de custo em horario de pico

## Etapa 5 - Criterio de aprovacao

Go:

- p95 dentro das metas do playbook
- sem erro funcional novo
- sem regressao de arquitetura

No-Go:

- p95 acima da meta em 2 ou mais jornadas
- erro funcional em fluxo critico de descoberta/contato
- comportamento inconsistente entre feed/oportunidades/vagas

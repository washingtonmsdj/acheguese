# G111 — Admin Realtime Read Separation

Data: 2026-09-12
Status: **SOURCE-CLOSED / REMOTE SCHEMA PREFLIGHT PENDENTE**

## Problema

O G110 já havia removido `select("*")`, mas ainda usava um único conjunto all-time para duas responsabilidades diferentes:

1. calcular métricas históricas/all-time;
2. renderizar detalhes das corridas atualmente abertas.

Isso fazia `passenger_profile_id`, `driver_profile_id`, origem e destino viajarem para o navegador em **todas** as linhas históricas, mesmo sendo necessários apenas para as corridas abertas mostradas na tela.

## Correção

`AdminMobilityRealtimeRideReadService` foi dividido em duas leituras:

### `listMetricRows()`

Histórico all-time necessário para preservar a semântica atual de métricas, contendo apenas:

- `status`;
- `created_at`;
- `updated_at`;
- `completed_at`;
- `cancelled_at`;
- `final_price`;
- `actual_fare` como divergência de schema já documentada;
- `driver_assigned_at`;
- `driver_accepted_at`.

Não contém IDs de participantes, origem, destino ou preço sugerido.

### `listOpenRideRows()`

Somente `QUERYABLE_OPEN_RIDE_STATUSES`, com os campos de apresentação necessários:

- `id`;
- `status`;
- `passenger_profile_id`;
- `driver_profile_id`;
- `origin`;
- `destination`;
- `created_at`;
- `final_price`;
- `suggested_price`.

Assim os vínculos de perfil e a rota textual não são mais carregados junto do histórico fechado.

## Orquestração

`AdminMobilityService` passou a expor:

- `getRealtimeMetricRides()`;
- `getRealtimeOpenRides()`.

`getRealtimeMetrics()` consome os dois conjuntos separadamente. A lista visual é construída somente a partir das corridas abertas; taxas, valores concluídos e tempo de resposta continuam calculados a partir do conjunto métrico all-time.

Nenhuma janela arbitrária foi aplicada às métricas all-time.

## Fallbacks mortos removidos

`toActiveRide()` deixou de tentar ler campos fora do novo contrato:

- `pickup_location_name`;
- `pickup_address`;
- `dropoff_location_name`;
- `dropoff_address`;
- `current_price` como coluna de entrada;
- `estimated_duration`.

Origem/destino vêm dos campos reais selecionados; o valor visual de corrida aberta usa `final_price ?? suggested_price ?? 0`.

## ETA

`estimated_duration` foi removido do contrato `ActiveRide` e da UI do realtime porque o snapshot atual de `ride_requests` não possui authority para essa coluna. Nenhum ETA foi inventado para substituí-lo.

Se uma authority canônica de ETA for introduzida depois, ela deve retornar por read model próprio e não por suposição sobre `ride_requests`.

## UI financeira

O rodapé deixou de afirmar nomes físicos de coluna (`final_price/actual_fare`) enquanto a divergência de schema de `actual_fare` estiver aberta. A UI agora comunica apenas que são **valores concluídos** e que não representam receita líquida da plataforma.

## Ratchets

- G110 foi ajustado para continuar protegendo a fronteira geral sem impedir a separação nova;
- `src/modules/mobility/__tests__/AdminRealtimeRideSeparationG111.test.ts` protege especificamente:
  - duas leituras distintas;
  - ausência de PII/rota no histórico métrico;
  - query de detalhes limitada aos estados abertos;
  - remoção dos fallbacks mortos e do falso ETA.

## Validação

Os contratos e diffs de source foram inspecionados. Este checkpoint não declara suite verde nem schema remoto certificado. A divergência `actual_fare` continua fail-closed para preflight remoto.

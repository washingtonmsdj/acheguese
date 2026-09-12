# G112 — Admin Realtime Driver Separation

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

Depois do G111, o realtime já separava histórico métrico de detalhes das corridas abertas, mas ainda usava `getAllDriversComplete()` para duas responsabilidades distintas:

- calcular total de motoristas, quantidade verificada e nota média global;
- renderizar nome, avatar e veículo dos poucos motoristas atualmente online.

Isso fazia identidade e dados de veículo de toda a base de motoristas serem enviados ao navegador em cada refresh do dashboard realtime.

## Correção

Foi criado:

`src/core/admin/services/AdminMobilityRealtimeDriverReadService.ts`

com duas leituras independentes.

### `listMetricRows()`

Leitura global mínima de `driver_data`:

- `rating`;
- `is_verified`.

Essas duas colunas são suficientes para preservar:

- `driversTotal`;
- `driversVerified`/`driversPending`;
- `avgRating`.

A leitura global não contém `profile_id`, nome, avatar, total de corridas, veículo ou presença operacional.

### `listOnlineDirectory(profileIds)`

Recebe somente os IDs já retornados por `AdminDriverPresenceReadService.listOnline()` e lê:

- `profile_id`;
- `rating`;
- `total_rides`;
- `vehicle_model`;
- `vehicle_plate`;
- `profiles!inner(name, display_name, avatar_url)`.

Portanto identidade/avatar/veículo só são carregados para motoristas realmente online.

## Presence authority

Nada neste gate moveu presença para `driver_data`.

A sequência permanece:

1. `AdminDriverPresenceReadService.listOnline()` lê `driver_availability`;
2. os `profile_id` online limitam o diretório de identidade/veículo;
3. o read model final sobrepõe disponibilidade/last_seen/active_ride a partir da authority de presença.

## Realtime

`getRealtimeMetrics()` deixou de chamar `getAllDriversComplete()`.

Agora usa:

- `getRealtimeDriverMetricRows()` para agregados globais mínimos;
- `getRealtimeOnlineDriverDirectory(onlineProfileIds)` para apresentação dos online.

`getAllDriversComplete()` permanece temporariamente apenas no analytics G109/G104 e será tratado separadamente.

## Ratchet

`src/modules/mobility/__tests__/AdminRealtimeDriverSeparationG112.test.ts`

Protege:

- ausência de `getAllDriversComplete()` dentro do realtime;
- `rating + is_verified` como única projeção global do motorista;
- identidade/veículo limitados por `.in("profile_id", profileIds)`;
- ausência de `is_online/is_available` no reader de `driver_data`;
- `AdminDriverPresenceReadService.listOnline()` como origem da presença administrativa.

## Validação

Os contratos e diffs de source foram inspecionados. O ratchet foi versionado, mas este checkpoint não declara suite/CI verde sem execução confiável.

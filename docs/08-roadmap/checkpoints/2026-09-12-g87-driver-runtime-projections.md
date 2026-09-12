# G87 — Driver runtime projections

Data: 2026-09-12

## Problema encontrado

Depois do G86 separar a leitura cadastral de driver da governança administrativa, restaram dois readers no runtime de Mobilidade que ainda faziam `select("*")` em `driver_data`:

- `getDriverData(profileId)`;
- `getDriverStatsDetailed(driverProfileId)`.

Esses readers são legítimos porque alimentam o agregado runtime/estatístico do motorista, mas a leitura da linha inteira mantinha acoplamento desnecessário a campos que não pertencem ao contrato consumido e podia reintroduzir presença/localização legadas de `driver_data` por acidente.

## Correção de raiz

Os dois readers agora usam projeções explícitas:

### Runtime summary

`getDriverData(profileId)` lê apenas:

- `profile_id`;
- `rating`;
- `total_rides`;
- `is_verified`;
- `created_at`;
- `updated_at`.

### Estatísticas detalhadas

`getDriverStatsDetailed(driverProfileId)` lê somente campos de reputação, contadores, verificação, subscription/capabilities e timestamps necessários ao read model.

Presença operacional e localização continuam fora dessas projeções. `driver_availability` permanece autoridade para online/offline, disponibilidade, GPS, `last_seen_at` e ownership de corrida ativa.

## Evidência

- `39845637e4615f58ca6122a0e344ef1650581950`: alteração cirúrgica em `mobility.queries.ts`, 12 adições / 3 remoções;
- o diff substitui exatamente os dois `select("*")` de `driver_data` por projeções explícitas;
- `95e415652b9968dd69374ab2a0f14da16f8459b6`: ratchet `DriverRuntimeProjectionG87.test.ts`.

## Estado

G87 SOURCE-CLOSED.

Mobilidade continua launch-paused: `PUBLIC_LAUNCH_SURFACES.mobility=false`.

Próximo corte recomendado: revisar os consumidores de `getDriverStatsDetailed` e os outros read models de `driver_data` para consolidar aliases/contratos estatísticos sem ampliar a autoridade de `driver_data` sobre presença operacional.

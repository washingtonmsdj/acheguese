# G92 — Driver availability canonical coverage

Data: 2026-09-12

## Problema

`DriverAvailabilityLayout` ainda usava `driverData` como origem genérica para dados que não pertencem ao read model de motorista:

- `search_radius_km` / `max_search_radius_km`;
- `service_neighborhoods` / `neighborhoods`;
- `working_hours` / `availability_hours`;
- `current_location` como preferência sobre o timestamp operacional.

Esses aliases não possuem authority ativa no módulo de Mobilidade e conflitavam com as fronteiras consolidadas em G83 e G91.

## Correção

### Cobertura territorial

O layout agora usa `useServiceAreas(shell.driverProfileId)` e deriva de `ServiceAreasService`:

- cobertura principal;
- modelo de cobertura;
- raio apenas quando `radius_km` existe no coverage canônico;
- contagem de áreas ativas.

A funcionalidade de área de atuação foi preservada e conectada à authority correta.

### GPS/presença

O layout não serializa nem mostra `current_location` de `driver_data`.

A informação exibida é somente `last_location_update`, já injetada no `driverData` runtime a partir de `driver_availability` por `useDriverProfileIdentity`.

O rótulo foi corrigido de `Ultima localizacao` para `Ultima atualizacao GPS`, evitando representar um timestamp como coordenada/local exato.

### Horários

Os aliases `working_hours` e `availability_hours` foram removidos da página porque não existe authority ativa de agenda de motorista ligada a eles. Nenhum valor fictício é exibido.

## Ratchet

Criado:

`src/modules/mobility/__tests__/DriverAvailabilityCanonicalCoverageG92.test.ts`

O teste exige:

- `useServiceAreas`;
- `primaryServiceArea.location_full_name`;
- `primaryServiceArea.radius_km`;
- `last_location_update`;

E impede o retorno de:

- campos de raio/bairro em `driverData`;
- aliases de horários;
- `current_location` no layout.

## Rollout

`PUBLIC_LAUNCH_SURFACES.mobility=false` permanece inalterado.

Nenhuma migration, Edge Function ou alteração de rollout foi aplicada neste checkpoint.

## Validação

O diff de source foi revisado e o ratchet foi adicionado. A certificação executada continua dependente de runner funcional; status de plataforma/limite não deve ser classificado como PASS nem como regressão de código.

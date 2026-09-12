# G140 — Passenger Search Snapshot Boundary

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

A tela de busca de motorista carregava `getRideWithAddresses()` a partir de `ride_requests` usando `*, joins`, transportando a linha inteira da corrida para renderizar apenas:

- status do snapshot inicial;
- preço sugerido;
- coordenadas/endereço de origem e destino;
- nome de fallback das locations.

Isso ampliava desnecessariamente o payload pré-aceite.

## Correção

Foi criado `RideSearchSnapshotReadModel.ts` com uma projeção dedicada à tela de busca.

`MobilityRuntimeService.getRideWithAddresses()` agora retorna `RideSearchSnapshotRow` e consulta somente:

- `id`;
- `status`;
- `suggested_price`;
- `pickup_address(street, latitude, longitude)`;
- `dropoff_address(street, latitude, longitude)`;
- `pickup_location(name)`;
- `dropoff_location(name)`.

Foram removidos do runtime os tipos amplos baseados em `RideRequestRecord & relations` usados exclusivamente por esse método.

A projeção não inclui IDs de participantes, dados do destinatário, notas/provas de entrega, pagamento, observação nem preço final.

## Ratchet

`src/modules/mobility/__tests__/PassengerSearchSnapshotBoundaryG140.test.ts`

Protege:

- ausência de wildcard no snapshot;
- uso obrigatório da projeção dedicada;
- presença somente dos campos necessários à apresentação de rota/status/preço sugerido;
- ausência de PII e payload operacional desnecessário.

## Commits

- `1783ff9d` — read model dedicado;
- `baaef5f4` — cutover do runtime;
- `fa1ca177` — ratchet.

## Validação

O diff do cutover foi inspecionado e ficou restrito à troca do read model e remoção de tipos amplos associados. Este checkpoint não declara suite/CI verde sem execução confiável.

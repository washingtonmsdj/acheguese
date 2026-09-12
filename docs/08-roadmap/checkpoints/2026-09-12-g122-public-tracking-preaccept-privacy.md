# G122 — Public Tracking Pre-Accept Privacy

Data: 2026-09-12
Status: **CLIENT SOURCE-CLOSED / SERVER-BLOCKED**

## Problema crítico

A fronteira canônica de Mobilidade define `driver_assigned` como oferta pré-aceite, não como participação operacional aceita.

Entretanto a definição versionada mais recente de `public.get_shared_ride_safety_data(text)` encontrada no G12 ainda:

- admite `driver_assigned` como estado ativo do bearer link;
- junta `profiles`/`driver_data` do motorista atribuído;
- busca a última linha de `driver_locations`;
- pode retornar `driver_name`, veículo e latitude/longitude exatas antes do aceite.

Isso contradiz a boundary já aplicada no tracking autenticado G120.

## Preflight remoto

Projeto Supabase: `xhdowzacfujckjelqhtd`.

O probe mínimo `select 1 as ok` falhou novamente com:

`Connection terminated due to connection timeout`.

Por isso nenhuma mudança SQL foi aplicada e nenhuma migration foi inventada. A correção server-side está especificada em:

`docs/09-reference/migrations-pending/g122-public-ride-share-preaccept-privacy.md`.

## Defesa client-side

`SafetyRideShareService` agora deriva:

`canExposeDriverOperationalData = isDriverOwnedOpenRideStatus(data.ride_status)`.

Enquanto isso for falso, o bearer projection consumido pela aplicação redige:

- nome do motorista;
- modelo do veículo;
- placa;
- localização atual.

Essa defesa reduz a exposição na aplicação, mas não é tratada como substituto da RPC server-side, pois um chamador direto da função continua dependendo do banco.

## UI pública

`TrackRidePage` removeu sua lista local de estados ativos e passou a usar classifiers compartilhados.

Em particular:

- `driver_assigned` é apresentado como “Motorista encontrado · aguardando confirmação”;
- `isDriverOwnedOpenRideStatus(data.status)` decide se existe tracking operacional;
- localização só é renderizada quando o lifecycle permite tracking;
- pré-aceite informa explicitamente que dados operacionais só são compartilhados após confirmação.

## Código órfão removido

`src/modules/mobility/components/map/LiveTrackingMap.tsx` foi removido.

A busca de consumidores não encontrou uso real do componente. Ele ainda chamava `useDriverLocation` sem `rideId`, entrando no caminho genérico de localização reservado a driver-self/operacional e mantendo uma segunda implementação de tracking divergente.

O inventário `tests/security/maplibre-runtime-security.test.ts` foi atualizado após a remoção.

O tracking real do passageiro permanece em `RideTrackingMap`, que fornece `rideId` ao `useDriverLocation` e passa pela authority `RideTrackingAccessService`/`mobility_get_driver_location_for_ride`.

## Ratchet

`src/modules/mobility/__tests__/PublicRideSharePreAcceptPrivacyG122.test.ts`

Protege:

- redação client-side de identidade/veículo/localização pré-aceite;
- tracking público ativo somente em driver-owned open state;
- ausência da antiga lista `activeStatuses`;
- ausência do `LiveTrackingMap` órfão;
- permanência explícita do bloqueio server-side enquanto a migration não puder ser materializada/validada.

## Estado restante

**P0 pendente:** corrigir `public.get_shared_ride_safety_data(text)` no banco e no histórico de migrations quando o acesso SQL voltar.

A promoção exige introspecção da função/grants atuais, migration criada por `supabase migration new`, matriz de segurança anon e advisors. Até lá não existe declaração de backend seguro para esse capability.

## Validação

Source/diffs foram inspecionados e o ratchet foi versionado. Nenhuma suite/CI é declarada verde sem execução confiável, e o banco remoto não é declarado corrigido.

# PENDING G122 — Public Ride Share Pre-Accept Privacy

Data: 2026-09-12
Status: **BLOQUEIO SERVER-SIDE / NÃO APLICADO**

## Problema confirmado no source versionado

A definição mais recente encontrada de:

`public.get_shared_ride_safety_data(p_share_token text)`

está em:

`supabase/migrations/20260909170152_server_owned_ride_share_tokens_g12.sql`.

A função é um capability endpoint público por bearer token e retorna:

- identidade pública do motorista;
- modelo e placa do veículo;
- latitude/longitude exatas da última posição do motorista.

A lista de estados admitidos inclui `driver_assigned`.

Isso conflita com a authority de lifecycle atual em `RideLifecycleStatus.ts`: `driver_assigned` representa somente oferta/atribuição pré-aceite e **não** concede participant-level tracking authority.

Portanto um bearer link ativo não deve receber identidade/veículo/localização exata do motorista enquanto a corrida ainda estiver em estado pré-aceite.

## Estado remoto

O projeto Supabase é `xhdowzacfujckjelqhtd`.

No preflight deste gate, até:

```sql
select 1 as ok;
```

falhou por `Connection terminated due to connection timeout`.

Por isso:

- nenhuma definição remota foi assumida;
- nenhum DDL foi aplicado;
- nenhum `apply_migration` foi tentado;
- nenhum timestamp/nome de migration foi inventado em `supabase/migrations`;
- o banco remoto **não** é considerado corrigido.

## Defesa em profundidade já aplicada no source

Enquanto o servidor não pode ser corrigido e validado, `SafetyRideShareService` redige client-side:

- `driverName`;
- `vehicleModel`;
- `vehiclePlate`;
- `currentLocation`;

sempre que `isDriverOwnedOpenRideStatus(ride_status)` for falso.

Isso reduz exposição na aplicação atual, mas **não substitui a correção da RPC pública**, porque um chamador direto da Data API ainda depende da definição server-side.

`TrackRidePage` também deixou de tratar `driver_assigned` como tracking ativo e informa que dados operacionais do motorista só são compartilhados após confirmação.

O componente órfão `LiveTrackingMap`, que usava `useDriverLocation` sem `rideId` e portanto entrava no caminho genérico de localização, foi removido.

## Correção server-side obrigatória

Quando a conexão/CLI estiver operacional, criar o arquivo somente por:

```bash
supabase migration new harden_public_ride_share_preaccept_privacy_g122
```

A migration deve substituir `public.get_shared_ride_safety_data(text)` preservando o capability bearer público, mas aplicar a mesma fronteira semântica do lifecycle TypeScript.

### Requisitos

1. manter token exato de 32 caracteres hex lowercase;
2. manter share `active` e `expires_at > now()`;
3. manter bloqueio de rides terminais já existente;
4. permitir que o link exista em pré-aceite, se isso continuar sendo o produto desejado, mas retornar `NULL` para qualquer dado específico do motorista antes do aceite;
5. expor `driver_name`, `vehicle_model`, `vehicle_plate`, `current_lat`, `current_lng` e `location_updated_at` apenas quando o status equivaler a `DRIVER_OWNED_OPEN_RIDE_STATUSES`;
6. `driver_assigned` deve permanecer explicitamente fora da authority de localização/identidade operacional;
7. aliases históricos ainda suportados devem ser classificados com a mesma semântica de `RideLifecycleStatus.ts`, sem criar uma terceira state machine divergente;
8. manter `SECURITY DEFINER` somente porque esse endpoint bearer intencional precisa ler a projeção protegida;
9. manter `SET search_path TO ''` e todas as relações schema-qualified;
10. manter timeout explícito;
11. `REVOKE ALL ... FROM PUBLIC, anon, authenticated` seguido dos grants intencionais para `anon, authenticated, service_role`;
12. não retornar telefone, metadata de custódia, notas, proof of delivery ou outras colunas fora do contrato atual.

Uma forma segura é condicionar os joins de motorista/localização ao conjunto aceito ou usar `CASE` para zerar todos esses campos em pré-aceite. O plano final deve ser validado por query plan e testes de segurança antes do deploy.

## Preflight obrigatório

1. `select 1` remoto precisa funcionar;
2. capturar `pg_get_functiondef('public.get_shared_ride_safety_data(text)'::regprocedure)`;
3. capturar owner e `proacl`/grants efetivos;
4. confirmar as colunas/constraints atuais de `ride_shares`, `ride_requests`, `driver_data` e fonte de localização;
5. confirmar se existe migration posterior ao G12 alterando a função;
6. materializar a migration com `supabase migration new ...`;
7. testar a função em ambiente autorizado antes da promoção.

## Matriz de segurança obrigatória

- token inválido => nenhuma linha;
- token expirado/revogado => nenhuma linha;
- ride terminal => nenhuma linha;
- `requested`/`searching_driver` => rota/status permitidos pelo produto, mas nenhum dado do motorista;
- `driver_assigned` => **nenhum driver_name/vehicle/location**;
- `driver_accepted` e demais estados driver-owned permitidos => dados operacionais conforme contrato;
- tentativa direta anon deve respeitar exatamente a mesma redação;
- regressão para `driver_assigned` com coordenadas não pode passar.

## Verificação pós-DDL

- comparar função instalada com o arquivo versionado;
- executar os casos da matriz acima com fixtures controladas;
- rodar advisors;
- confirmar grants;
- regenerar tipos se necessário;
- executar ratchets/security tests relevantes;
- somente então marcar G122 server-side como fechado.

## Estado do gate

**SOURCE CLIENT DEFENSE IMPLEMENTED / SERVER FIX PENDING.**

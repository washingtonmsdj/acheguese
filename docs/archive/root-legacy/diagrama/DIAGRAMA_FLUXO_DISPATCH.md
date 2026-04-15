# DIAGRAMA DE FLUXO - DISPATCH AUTOMÁTICO

## VISÃO GERAL

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  PASSAGEIRO │         │    SISTEMA   │         │  MOTORISTA  │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │ 1. Criar Corrida      │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │ 2. Status: requested   │
       │                       │    ↓                   │
       │                       │ 3. Status: searching   │
       │                       │                        │
       │ 4. "Procurando..."    │                        │
       │<──────────────────────┤                        │
       │   (realtime)          │                        │
       │                       │ 5. Buscar motoristas   │
       │                       │    elegíveis           │
       │                       │                        │
       │                       │ 6. Oferecer para M1    │
       │                       │    Status: assigned    │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │                        │ 7. Recebe oferta
       │                       │                        │    (realtime)
       │                       │                        │
       │ 8. "Motorista         │                        │
       │     encontrado!"      │                        │
       │<──────────────────────┤                        │
       │   (realtime)          │                        │
       │                       │                        │
       │                       │ 9. Aguarda 30s         │
       │                       │    ⏱️                  │
       │                       │                        │
       │                       │    10. Aceita?         │
       │                       │<───────────────────────┤
       │                       │                        │
       │                       │ 11. Status: accepted   │
       │                       │                        │
       │ 12. "Confirmado!"     │                        │
       │<──────────────────────┤                        │
       │   (realtime)          │                        │
       │                       │                        │
```

## FLUXO DETALHADO - ACEITE

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ACEITE (SUCESSO)                    │
└─────────────────────────────────────────────────────────────────┘

1. CRIAR CORRIDA
   ┌──────────────────────────────────────────────────────────┐
   │ RideOperationalService.createRide()                      │
   │   ↓                                                      │
   │ INSERT ride_requests (status: requested)                 │
   │   ↓                                                      │
   │ transitionTo(searching_driver)                           │
   │   ↓                                                      │
   │ AutoDispatchService.startDispatch() [background]         │
   └──────────────────────────────────────────────────────────┘

2. BUSCAR MOTORISTAS
   ┌──────────────────────────────────────────────────────────┐
   │ RideDispatchService.findEligibleDrivers()                │
   │   ↓                                                      │
   │ SELECT FROM driver_availability                          │
   │   WHERE is_online = true                                 │
   │     AND is_available = true                              │
   │     AND distance < 10km                                  │
   │   ↓                                                      │
   │ ORDER BY distance ASC                                    │
   │   ↓                                                      │
   │ [M1, M2, M3, M4, M5]                                     │
   └──────────────────────────────────────────────────────────┘

3. OFERECER PARA M1
   ┌──────────────────────────────────────────────────────────┐
   │ RideDispatchService.assignDriver(M1)                     │
   │   ↓                                                      │
   │ UPDATE ride_requests                                     │
   │   SET status = 'driver_assigned'                         │
   │       driver_profile_id = M1                             │
   │   ↓                                                      │
   │ INSERT ride_dispatch_audit                               │
   │   (attempt: 1, status: pending)                          │
   │   ↓                                                      │
   │ notifyDriver(M1) [realtime]                              │
   └──────────────────────────────────────────────────────────┘

4. AGUARDAR ACEITE
   ┌──────────────────────────────────────────────────────────┐
   │ waitForAcceptance(M1, 30s)                               │
   │   ↓                                                      │
   │ Loop cada 1s:                                            │
   │   SELECT status, driver_profile_id                       │
   │   FROM ride_requests                                     │
   │   WHERE id = rideId                                      │
   │   ↓                                                      │
   │   IF status = 'driver_accepted' AND driver = M1          │
   │     RETURN true ✓                                        │
   │   ↓                                                      │
   │   IF elapsed > 30s                                       │
   │     RETURN false ✗                                       │
   └──────────────────────────────────────────────────────────┘

5. M1 ACEITA
   ┌──────────────────────────────────────────────────────────┐
   │ RideOperationalService.acceptRide(rideId, M1)            │
   │   ↓                                                      │
   │ RideDispatchService.acceptRide(rideId, M1)               │
   │   ↓                                                      │
   │ UPDATE ride_requests                                     │
   │   SET status = 'driver_accepted'                         │
   │   WHERE id = rideId                                      │
   │     AND status = 'driver_assigned'  ← LOCK               │
   │     AND driver_profile_id = M1      ← LOCK               │
   │   ↓                                                      │
   │ UPDATE driver_availability                               │
   │   SET is_available = false                               │
   │   WHERE profile_id = M1                                  │
   │   ↓                                                      │
   │ UPDATE ride_dispatch_audit                               │
   │   SET status = 'accepted'                                │
   │       responded_at = NOW()                               │
   │   ↓                                                      │
   │ INSERT ride_state_audit                                  │
   │   (from: driver_assigned, to: driver_accepted)           │
   └──────────────────────────────────────────────────────────┘

6. NOTIFICAR PASSAGEIRO
   ┌──────────────────────────────────────────────────────────┐
   │ Realtime: UPDATE em ride_requests                        │
   │   ↓                                                      │
   │ useRideSearch detecta mudança                            │
   │   ↓                                                      │
   │ onStatusChange({ status: 'driver_accepted' })            │
   │   ↓                                                      │
   │ PassengerSearchStatus atualiza UI                        │
   │   "Motorista confirmado!" ✓                              │
   └──────────────────────────────────────────────────────────┘
```

## FLUXO DETALHADO - TIMEOUT E RETRY

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUXO DE TIMEOUT E RETRY                       │
└─────────────────────────────────────────────────────────────────┘

1. M1 NÃO ACEITA EM 30S
   ┌──────────────────────────────────────────────────────────┐
   │ waitForAcceptance(M1, 30s)                               │
   │   ↓                                                      │
   │ Timeout após 30s                                         │
   │   ↓                                                      │
   │ RETURN false ✗                                           │
   └──────────────────────────────────────────────────────────┘

2. REGISTRAR TIMEOUT
   ┌──────────────────────────────────────────────────────────┐
   │ updateDispatchAttempt(rideId, M1, {                      │
   │   status: 'timeout',                                     │
   │   responded_at: NOW()                                    │
   │ })                                                       │
   └──────────────────────────────────────────────────────────┘

3. VOLTAR PARA BUSCA
   ┌──────────────────────────────────────────────────────────┐
   │ UPDATE ride_requests                                     │
   │   SET status = 'searching_driver'                        │
   │       driver_profile_id = NULL                           │
   │   WHERE id = rideId                                      │
   └──────────────────────────────────────────────────────────┘

4. OFERECER PARA M2
   ┌──────────────────────────────────────────────────────────┐
   │ RideDispatchService.assignDriver(M2)                     │
   │   ↓                                                      │
   │ UPDATE ride_requests                                     │
   │   SET status = 'driver_assigned'                         │
   │       driver_profile_id = M2                             │
   │   ↓                                                      │
   │ INSERT ride_dispatch_audit                               │
   │   (attempt: 2, status: pending)                          │
   │   ↓                                                      │
   │ notifyDriver(M2) [realtime]                              │
   └──────────────────────────────────────────────────────────┘

5. REPETIR ATÉ 5 TENTATIVAS
   ┌──────────────────────────────────────────────────────────┐
   │ for (i = 0; i < 5; i++)                                  │
   │   Oferecer para motorista[i]                             │
   │   Aguardar 30s                                           │
   │   IF aceitar: RETURN success ✓                           │
   │   ELSE: próximo motorista                                │
   └──────────────────────────────────────────────────────────┘
```

## FLUXO DETALHADO - EXPIRAÇÃO

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE EXPIRAÇÃO                           │
└─────────────────────────────────────────────────────────────────┘

1. NENHUM MOTORISTA ACEITA
   ┌──────────────────────────────────────────────────────────┐
   │ Após 5 tentativas sem aceite                             │
   │   OU                                                     │
   │ Timeout total de 10 minutos                              │
   └──────────────────────────────────────────────────────────┘

2. EXPIRAR CORRIDA
   ┌──────────────────────────────────────────────────────────┐
   │ expireRide(rideId, reason)                               │
   │   ↓                                                      │
   │ UPDATE ride_requests                                     │
   │   SET status = 'expired'                                 │
   │   WHERE id = rideId                                      │
   │     AND status IN ('searching_driver', 'driver_assigned')│
   │   ↓                                                      │
   │ INSERT ride_state_audit                                  │
   │   (from: searching_driver, to: expired)                  │
   │   reason: "No driver accepted after all attempts"        │
   │   ↓                                                      │
   │ notifyPassenger(rideId, 'expired') [realtime]            │
   └──────────────────────────────────────────────────────────┘

3. NOTIFICAR PASSAGEIRO
   ┌──────────────────────────────────────────────────────────┐
   │ Realtime: UPDATE em ride_requests                        │
   │   ↓                                                      │
   │ useRideSearch detecta mudança                            │
   │   ↓                                                      │
   │ onStatusChange({ status: 'expired' })                    │
   │   ↓                                                      │
   │ PassengerSearchStatus atualiza UI                        │
   │   "Não encontramos motorista disponível" ✗               │
   └──────────────────────────────────────────────────────────┘
```

## FLUXO DE UNICIDADE (RACE CONDITION)

```
┌─────────────────────────────────────────────────────────────────┐
│              GARANTIA DE UNICIDADE (2 MOTORISTAS)               │
└─────────────────────────────────────────────────────────────────┘

CENÁRIO: M1 e M2 tentam aceitar ao mesmo tempo

┌──────────────┐                              ┌──────────────┐
│  MOTORISTA 1 │                              │  MOTORISTA 2 │
└──────┬───────┘                              └──────┬───────┘
       │                                             │
       │ 1. Clica "Aceitar"                         │
       ├────────────────────┐                       │
       │                    ↓                       │
       │              acceptRide(M1)                │
       │                    ↓                       │
       │              UPDATE ride_requests          │
       │                SET status = 'accepted'     │
       │                WHERE id = rideId           │
       │                  AND status = 'assigned'   │ ← LOCK
       │                  AND driver = M1           │ ← LOCK
       │                    ↓                       │
       │              ✓ UPDATE OK (1 row)           │
       │                    ↓                       │
       │              Status agora: 'accepted'      │
       │              Driver agora: M1              │
       │                                            │
       │                                            │ 2. Clica "Aceitar"
       │                                            ├────────────────────┐
       │                                            │                    ↓
       │                                            │              acceptRide(M2)
       │                                            │                    ↓
       │                                            │              UPDATE ride_requests
       │                                            │                SET status = 'accepted'
       │                                            │                WHERE id = rideId
       │                                            │                  AND status = 'assigned' ← NÃO ENCONTRA!
       │                                            │                  AND driver = M2         ← NÃO ENCONTRA!
       │                                            │                    ↓
       │                                            │              ✗ UPDATE FAIL (0 rows)
       │                                            │                    ↓
       │                                            │              RETURN error: 'already_accepted'
       │                                            │
       │ 3. Sucesso!                                │ 4. Erro!
       │    "Corrida aceita"                        │    "Já foi aceita"
       │                                            │
```

## AUDITORIA COMPLETA

```
┌─────────────────────────────────────────────────────────────────┐
│                  TABELA: ride_dispatch_audit                    │
└─────────────────────────────────────────────────────────────────┘

Exemplo de corrida com 3 tentativas:

┌────────┬──────────┬────────┬──────────────┬──────────────┬──────────┐
│ Ride   │ Driver   │ Attempt│ Offered At   │ Responded At │ Status   │
├────────┼──────────┼────────┼──────────────┼──────────────┼──────────┤
│ abc123 │ driver-1 │   1    │ 10:00:00     │ 10:00:30     │ timeout  │
│ abc123 │ driver-2 │   2    │ 10:00:31     │ 10:01:01     │ timeout  │
│ abc123 │ driver-3 │   3    │ 10:01:02     │ 10:01:15     │ accepted │
└────────┴──────────┴────────┴──────────────┴──────────────┴──────────┘

Análise:
- Tentativa 1: driver-1 não aceitou (30s timeout)
- Tentativa 2: driver-2 não aceitou (30s timeout)
- Tentativa 3: driver-3 aceitou em 13 segundos ✓
- Total: 75 segundos até aceite
```

## ESTADOS DA CORRIDA

```
┌─────────────────────────────────────────────────────────────────┐
│                    MÁQUINA DE ESTADOS                           │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  requested   │ ← Corrida criada
                    └──────┬───────┘
                           │ (automático)
                           ↓
                  ┌─────────────────┐
            ┌────>│ searching_driver│<────┐
            │     └────────┬────────┘     │
            │              │               │ (timeout, retry)
            │              │ (oferta)      │
            │              ↓               │
            │     ┌─────────────────┐     │
            └─────┤ driver_assigned ├─────┘
                  └────────┬────────┘
                           │ (aceite)
                           ↓
                  ┌─────────────────┐
                  │ driver_accepted │ ← Sucesso!
                  └─────────────────┘

Estados finais:
- expired (nenhum motorista aceitou)
- cancelled_by_passenger
- cancelled_by_driver
```

## REALTIME SUBSCRIPTIONS

```
┌─────────────────────────────────────────────────────────────────┐
│                    REALTIME ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

PASSAGEIRO:
┌──────────────────────────────────────────────────────────────┐
│ useRideSearch({ rideId, passengerProfileId })                │
│   ↓                                                          │
│ supabase.channel(`ride_realtime:${userId}`)                  │
│   .on('postgres_changes', {                                  │
│     table: 'ride_requests',                                  │
│     filter: `id=eq.${rideId}`                                │
│   })                                                         │
│   ↓                                                          │
│ Detecta: UPDATE em status                                    │
│   ↓                                                          │
│ Dispara: onStatusChange(event)                               │
│   ↓                                                          │
│ Atualiza: PassengerSearchStatus                              │
└──────────────────────────────────────────────────────────────┘

MOTORISTA:
┌──────────────────────────────────────────────────────────────┐
│ useDriverOffers({ driverProfileId })                         │
│   ↓                                                          │
│ supabase.channel(`ride_realtime:${userId}`)                  │
│   .on('postgres_changes', {                                  │
│     table: 'ride_requests',                                  │
│     filter: `driver_profile_id=eq.${userId}`                 │
│   })                                                         │
│   ↓                                                          │
│ Detecta: UPDATE em driver_profile_id ou status               │
│   ↓                                                          │
│ Dispara: onNewOffer(offer)                                   │
│   ↓                                                          │
│ Atualiza: DriverOfferCard                                    │
└──────────────────────────────────────────────────────────────┘
```

---

**Legenda:**
- `→` Fluxo normal
- `↓` Próximo passo
- `✓` Sucesso
- `✗` Falha
- `⏱️` Timeout
- `←` Lock/Condição

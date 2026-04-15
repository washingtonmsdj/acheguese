# MOBILITY — PLANO DE INTEGRAÇÃO CANÔNICA

**STATUS**: PENDENTE (aguarda seletores de UI)  
**DATA**: 2026-03-28

---

## DIAGNÓSTICO OBJETIVO

### Situação Atual

**CreateRideModal** (`src/modules/mobility/components/CreateRideModal.tsx`):
- ❌ NÃO coleta `pickup_address_id`
- ❌ NÃO coleta `dropoff_address_id`
- ❌ NÃO coleta `pickup_location_id`
- ❌ NÃO coleta `dropoff_location_id`
- ✅ Coleta `origin` (string)
- ✅ Coleta `destination` (string)
- ✅ Coleta `origin_lat/origin_lng` via GeolocationButton
- ✅ Coleta `destination_lat/destination_lng` via GeolocationButton

**MobilityService** (`src/modules/mobility/services/MobilityService.ts`):
- ✅ JÁ aceita 4 campos canônicos (ETAPA 8)
- ✅ JÁ persiste em DB quando fornecidos

**DB** (`ride_requests`):
- ✅ Colunas canônicas existem (ETAPA 8)
- ✅ Aceita NULL (compatibilidade transitória)

---

## O QUE FALTA

### 1. Seletores de Endereços
Componente para selecionar/buscar endereços da tabela `addresses`:
- Input com autocomplete
- Busca por rua/número/bairro
- Retorna `address_id` selecionado

### 2. Seletores de Territórios
Componente para selecionar territórios da tabela `locations`:
- Dropdown ou autocomplete
- Filtro por tipo (city/district)
- Retorna `location_id` selecionado

### 3. Integração no CreateRideModal
Adicionar seletores no formulário:
```typescript
// Origem
<AddressSelector 
  label="Endereço de origem"
  onSelect={(addressId) => setPickupAddressId(addressId)}
/>
<LocationSelector 
  label="Bairro de origem"
  onSelect={(locationId) => setPickupLocationId(locationId)}
/>

// Destino
<AddressSelector 
  label="Endereço de destino"
  onSelect={(addressId) => setDropoffAddressId(addressId)}
/>
<LocationSelector 
  label="Bairro de destino"
  onSelect={(locationId) => setDropoffLocationId(locationId)}
/>
```

### 4. Atualizar Payload
```typescript
onSubmit({
  origin, destination, departure_time, suggested_price, type, payment_method,
  // Canônico (quando seletores fornecerem)
  pickup_address_id: pickupAddressId || undefined,
  dropoff_address_id: dropoffAddressId || undefined,
  pickup_location_id: pickupLocationId || undefined,
  dropoff_location_id: dropoffLocationId || undefined,
  // Legado (fallback)
  origin_lat, origin_lng, destination_lat, destination_lng,
});
```

### 5. Atualizar Schema
Adicionar campos canônicos de volta ao `CreateRideDataSchema`:
```typescript
pickup_address_id: z.string().uuid().optional(),
dropoff_address_id: z.string().uuid().optional(),
pickup_location_id: z.string().uuid().optional(),
dropoff_location_id: z.string().uuid().optional(),
```

---

## PONTO DE INJEÇÃO EXATO

**Arquivo**: `src/modules/mobility/components/CreateRideModal.tsx`

**Linha ~140-180**: Após seleção de tipo de corrida, antes dos campos de origem/destino

**Estado necessário**:
```typescript
const [pickupAddressId, setPickupAddressId] = useState<string | null>(null);
const [dropoffAddressId, setDropoffAddressId] = useState<string | null>(null);
const [pickupLocationId, setPickupLocationId] = useState<string | null>(null);
const [dropoffLocationId, setDropoffLocationId] = useState<string | null>(null);
```

**Payload final** (linha ~230):
```typescript
onSubmit({
  // ... campos existentes
  pickup_address_id: pickupAddressId || undefined,
  dropoff_address_id: dropoffAddressId || undefined,
  pickup_location_id: pickupLocationId || undefined,
  dropoff_location_id: dropoffLocationId || undefined,
});
```

---

## CONTRATO DE PAYLOAD PRONTO

**Interface**:
```typescript
interface CreateRidePayload {
  origin: string;
  destination: string;
  departure_time: string;
  suggested_price: number;
  type: RideType;
  payment_method: PaymentMethod;
  observation?: string;
  available_seats?: number;
  
  // Canônico (quando disponível)
  pickup_address_id?: string;
  dropoff_address_id?: string;
  pickup_location_id?: string;
  dropoff_location_id?: string;
  
  // Legado (fallback)
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  search_radius_km?: number;
}
```

**Service**: `MobilityService.createRideRequest()` JÁ aceita este contrato

**DB**: `ride_requests` JÁ tem todas as colunas

---

## DEPENDÊNCIAS

1. Componente `AddressSelector` (não existe)
2. Componente `LocationSelector` (não existe)
3. Hook `useAddressSearch` (não existe)
4. Hook `useLocationSearch` (não existe)

---

## ESTIMATIVA

- Criar seletores: ~2-3 horas
- Integrar no CreateRideModal: ~1 hora
- Testes: ~1 hora
- **Total**: ~4-5 horas de desenvolvimento

---

## CONCLUSÃO

Mobility NÃO pode ser fechado na ETAPA 10B porque:
- ❌ Form não coleta campos canônicos
- ❌ Não há seletores de endereços/territórios
- ❌ Não há fonte real de dados canônicos

Mobility será adaptado em ETAPA futura dedicada a seletores de UI.

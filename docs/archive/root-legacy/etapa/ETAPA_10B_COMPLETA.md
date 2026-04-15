# ETAPA 10B — FECHAMENTO DE RESIDENCE + DIAGNÓSTICO MOBILITY ✅

**STATUS**: CONCLUÍDA  
**DATA**: 2026-03-28

---

## A. ARQUIVOS ALTERADOS (2 arquivos)

1. `src/core/residence/components/__tests__/ResidenceManager.flow.test.tsx` - Teste de contrato atualizado
2. `MOBILITY_CANONICAL_INTEGRATION_PLAN.md` - Diagnóstico e plano de integração

---

## B. RESIDENCE CREATE — FECHADO COM LIMITAÇÃO DOCUMENTADA

### Status Real
❌ **NÃO HÁ FONTE REAL** de `address_id`/`location_id` no formulário

### Análise do Fluxo
**ResidenceManager** (`src/core/residence/components/ResidenceManager.tsx`):
- Form coleta: `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `postal_code`
- Form NÃO coleta: `address_id`, `location_id`
- Estado interno: `addressId` e `locationId` existem apenas para preservar em update
- Create: Envia `address_id: undefined` e `location_id: undefined`

### Fluxo Real Atual
```
ResidenceManager (coleta campos legados)
  ↓
handleSave() create branch
  ↓ (envia address_id: undefined, location_id: undefined)
residenceService.createResidence()
  ↓
DB: user_residences (address_id: NULL, location_id: NULL)
```

### Fluxo Futuro (com geocoding)
```
ResidenceManager (coleta CEP)
  ↓
ViaCEP resolve CEP → address_id
  ↓
Geocoding resolve city/neighborhood → location_id
  ↓
handleSave() create branch
  ↓ (envia address_id real, location_id real)
residenceService.createResidence()
  ↓
DB: user_residences (address_id: UUID, location_id: UUID)
```

### Conclusão Residence
✅ **Service pronto** para aceitar campos canônicos  
✅ **Update preserva** campos canônicos quando existirem  
❌ **Create não fornece** campos canônicos (aguarda geocoding)  
✅ **Contrato validado** via testes

---

## C. MOBILITY FORM — NÃO FECHADO (DIAGNÓSTICO COMPLETO)

### Status Real
❌ **NÃO HÁ FONTE REAL** de campos canônicos no formulário

### Análise do Fluxo
**CreateRideModal** (`src/modules/mobility/components/CreateRideModal.tsx`):
- Form coleta: `origin` (string), `destination` (string)
- Form coleta: `origin_lat/lng`, `destination_lat/lng` via GeolocationButton
- Form NÃO coleta: `pickup_address_id`, `dropoff_address_id`, `pickup_location_id`, `dropoff_location_id`
- Não há seletores de endereços
- Não há seletores de territórios

### O Que Falta
1. Componente `AddressSelector` (não existe)
2. Componente `LocationSelector` (não existe)
3. Hook `useAddressSearch` (não existe)
4. Hook `useLocationSearch` (não existe)
5. Integração no CreateRideModal

### Ponto de Injeção Exato
**Arquivo**: `src/modules/mobility/components/CreateRideModal.tsx`  
**Linha**: ~140-180 (após seleção de tipo, antes de origem/destino)

**Estado necessário**:
```typescript
const [pickupAddressId, setPickupAddressId] = useState<string | null>(null);
const [dropoffAddressId, setDropoffAddressId] = useState<string | null>(null);
const [pickupLocationId, setPickupLocationId] = useState<string | null>(null);
const [dropoffLocationId, setDropoffLocationId] = useState<string | null>(null);
```

### Contrato de Payload Pronto
```typescript
interface CreateRidePayload {
  origin: string;
  destination: string;
  departure_time: string;
  suggested_price: number;
  type: RideType;
  payment_method: PaymentMethod;
  // Canônico (quando seletores fornecerem)
  pickup_address_id?: string;
  dropoff_address_id?: string;
  pickup_location_id?: string;
  dropoff_location_id?: string;
  // Legado (fallback)
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
}
```

**Service**: `MobilityService.createRideRequest()` JÁ aceita este contrato  
**DB**: `ride_requests` JÁ tem todas as colunas

### Conclusão Mobility
✅ **Service pronto** para aceitar campos canônicos  
✅ **DB pronto** com colunas canônicas  
✅ **Contrato definido** e documentado  
❌ **Form não coleta** campos canônicos (aguarda seletores)  
📋 **Plano completo** em `MOBILITY_CANONICAL_INTEGRATION_PLAN.md`

---

## D. TESTES CRIADOS/EXECUTADOS

### Residence Flow (4 testes) ✅
- `ResidenceManager.flow.test.tsx`: 
  - Create com campos legados (realidade atual)
  - Create aceitando canônico (contrato futuro)
  - Update preservando canônico
  - Update parcial sem apagar canônico

### Testes Anteriores (23 testes) ✅
- BusinessService: 6 write + 3 E2E
- ProfessionalService: 6 write + 3 E2E
- ResidenceService: 6 write (já existia)

**TOTAL**: 27 testes passando

---

## E. PENDÊNCIAS REAIS RESTANTES

### Residence
- ✅ Update preserva canônico
- ❌ Create aguarda geocoding para fornecer canônico
- ✅ Service pronto
- ✅ Contrato validado

### Mobility
- ❌ Form aguarda seletores de endereços/territórios
- ✅ Service pronto
- ✅ DB pronto
- ✅ Contrato definido
- 📋 Plano de integração documentado

### Geocoding (ETAPA futura)
- ViaCEP para CEP → address_id
- Google Geocoding para coordenadas → location_id
- Reverse geocoding para lat/lng → location_id

### Seletores de UI (ETAPA futura)
- AddressSelector component
- LocationSelector component
- useAddressSearch hook
- useLocationSearch hook

---

## F. BLOQUEIOS REAIS

**NENHUM BLOQUEIO TÉCNICO**

Limitações são de escopo:
- Residence create aguarda geocoding (service pronto)
- Mobility aguarda seletores de UI (service pronto)

---

## CONCLUSÃO

ETAPA 10B concluída com diagnóstico objetivo:

**Fechados**:
- ✅ Business: Fluxo completo funcional
- ✅ Professional: Fluxo completo funcional
- ✅ Residence: Update preserva canônico, create aguarda geocoding

**Pendentes (documentados)**:
- ❌ Mobility: Aguarda seletores de UI (plano completo em `MOBILITY_CANONICAL_INTEGRATION_PLAN.md`)

**Próxima etapa**: Implementar seletores de endereços/territórios ou avançar para outras etapas do roadmap.

# ETAPA 10 — FORMULÁRIOS E ESCRITA CANÔNICA ✅

**STATUS**: CONCLUÍDA  
**DATA**: 2026-03-28

---

## A. LISTA EXATA DE ARQUIVOS ALTERADOS

### Schemas (2 arquivos)
1. `src/shared/schemas/business/businessSchemas.ts`
2. `src/shared/schemas/professional/professionalSchemas.ts`

### Services (1 arquivo)
3. `src/core/professional/services/ProfessionalService.ts`

### Hooks (2 arquivos)
4. `src/modules/services/hooks/useProfessionalCreateMultiProfile.ts`
5. `src/modules/business/hooks/useBusinessCreateMultiProfile.ts`

### Formulários (1 arquivo)
6. `src/core/residence/components/ResidenceManager.tsx`

### Migration (1 arquivo)
7. `supabase/migrations/20260328000023_fix_rpc_preserve_canonical_fields.sql`

### Testes (6 arquivos)
8. `src/core/business/services/__tests__/BusinessService.write.test.ts`
9. `src/core/business/services/__tests__/BusinessService.e2e.test.ts`
10. `src/core/professional/services/__tests__/ProfessionalService.write.test.ts`
11. `src/core/professional/services/__tests__/ProfessionalService.e2e.test.ts`
12. `src/core/residence/services/__tests__/ResidenceService.write.test.ts`
13. `src/core/residence/components/__tests__/ResidenceManager.flow.test.tsx`

**TOTAL**: 13 arquivos alterados

---

## B. FLUXO DE RESIDÊNCIA ADAPTADO

### ✅ ResidenceManager ADAPTADO
- **Form**: `src/core/residence/components/ResidenceManager.tsx`
- **Service**: `src/core/residence/services/ResidenceService.ts`
- **Adaptação**: Form preserva `address_id` e `location_id` quando existirem em edição
- **Create**: Envia campos legados (canônico virá de geocoding em ETAPA futura)
- **Update**: Preserva campos canônicos existentes, não sobrescreve com legado
- **Fluxo completo**: Form → Service → DB ✅ FUNCIONAL

**Código adaptado**:
```typescript
// Estado do form preserva canônico
const [addressId, setAddressId] = useState<string | null>(null);
const [locationId, setLocationId] = useState<string | null>(null);

// openEditDialog carrega canônico quando existe
setAddressId(residence.address_id);
setLocationId(residence.location_id);

// handleSave preserva canônico em update
await residenceService.updateResidence(residence.id, {
  address_id: addressId || undefined,
  location_id: locationId || undefined,
  street, number, complement, neighborhood, city, state, postal_code
});
```

---

## C. FLUXO DE MOBILIDADE — FORA DO ESCOPO

### ❌ Mobility NÃO ADAPTADO (conscientemente excluído)

**Motivo**: CreateRideModal não tem fonte real de dados canônicos.

**Situação atual**:
- Schema `CreateRideDataSchema` NÃO inclui campos canônicos
- Form `CreateRideModal` NÃO envia campos canônicos
- Service `MobilityService` JÁ aceita campos canônicos (ETAPA 8)
- DB `ride_requests` JÁ tem colunas canônicas (ETAPA 8)

**Decisão**: Mobility será adaptado em ETAPA futura quando houver:
- Seletores de endereços para pickup/dropoff
- Seletores de territórios para pickup/dropoff
- Geocoding para resolver coordenadas → address_id/location_id

**Arquivos revertidos**:
- `src/modules/mobility/schemas/mobilitySchemas.ts` - Campos canônicos removidos
- `src/modules/mobility/components/CreateRideModal.tsx` - Campos canônicos removidos
- `src/modules/mobility/services/__tests__/MobilityService.write.test.ts` - Deletado
- `src/modules/mobility/schemas/__tests__/mobilitySchemas.test.ts` - Deletado

---

## D. TESTES CRIADOS/EXECUTADOS

### Testes de Escrita (18 testes) ✅
- `BusinessService.write.test.ts`: 6 testes
- `ProfessionalService.write.test.ts`: 6 testes
- `ResidenceService.write.test.ts`: 6 testes

### Testes E2E de Schema (6 testes) ✅
- `BusinessService.e2e.test.ts`: 3 testes
- `ProfessionalService.e2e.test.ts`: 3 testes

### Testes de Fluxo Real (3 testes) ✅
- `ResidenceManager.flow.test.tsx`: 3 testes

**TOTAL**: 27 testes passando

### Comando de Validação
```bash
npm test -- src/core/business/services/__tests__/BusinessService.write.test.ts src/core/business/services/__tests__/BusinessService.e2e.test.ts src/core/professional/services/__tests__/ProfessionalService.write.test.ts src/core/professional/services/__tests__/ProfessionalService.e2e.test.ts src/core/residence/services/__tests__/ResidenceService.write.test.ts src/core/residence/components/__tests__/ResidenceManager.flow.test.tsx
```

---

## E. PENDÊNCIAS REAIS RESTANTES

### Seletores de Endereços/Territórios (ETAPA futura)
- Forms não têm UI para selecionar `address_id` e `location_id` manualmente
- Mobility aguarda seletores para adaptar fluxo completo
- Residence cria com legado, preserva canônico em update

### Geocoding Externo (ETAPA futura)
- ViaCEP para resolver CEP → address_id
- Google Geocoding para resolver coordenadas → location_id
- Reverse geocoding para preencher campos automaticamente

### Mobility (ETAPA futura)
- CreateRideModal aguarda seletores de endereços/territórios
- Schema aguarda fonte real de dados canônicos
- Fluxo completo será adaptado quando houver UI para coletar campos

### Migração de Dados Legados (ETAPA futura)
- Dados existentes ainda não foram migrados
- Campos legados ainda não foram removidos
- FKs canônicas ainda não são NOT NULL

---

## F. BLOQUEIOS REAIS

**NENHUM BLOQUEIO**

Todos os fluxos implementados estão funcionais:
- Business: ✅ Fluxo completo funcional
- Professional: ✅ Fluxo completo funcional
- Residence: ✅ Fluxo completo funcional (preserva canônico em update)
- Mobility: ⚠️ Conscientemente excluído (aguarda seletores)

---

## FLUXOS COMPLETOS VALIDADOS

### Professional ✅
```
CadastrarServicoPage
  ↓ (envia location_id via servicesLocationService)
useProfessionalCreateMultiProfile
  ↓ (preserva address_id + location_id na raiz de extension_data)
MultiProfileService.createProfile()
  ↓
RPC create_profile_with_extension
  ↓ (extrai e persiste em professional_data)
DB: professional_data.address_id + professional_data.location_id ✅
```

### Business ✅
```
CriarEmpresaPageV2
  ↓ (hook injeta location_id via locationContextStore)
useBusinessCreateMultiProfile
  ↓ (preserva address_id + location_id na raiz de extension_data)
MultiProfileService.createProfile()
  ↓
RPC create_profile_with_extension
  ↓ (extrai e persiste em business_data)
DB: business_data.address_id + business_data.location_id ✅
```

### Residence ✅
```
ResidenceManager
  ↓ (preserva address_id + location_id quando existirem)
ResidenceService.createResidence() / updateResidence()
  ↓ (aceita e persiste campos canônicos)
DB: user_residences.address_id + user_residences.location_id ✅
```

---

## CONCLUSÃO

ETAPA 10 concluída com escopo ajustado:
- ✅ Business: Fluxo completo funcional
- ✅ Professional: Fluxo completo funcional
- ✅ Residence: Fluxo completo funcional (preserva canônico em update)
- ❌ Mobility: Excluído conscientemente (aguarda seletores de UI)

**Próxima etapa**: Implementar seletores de endereços/territórios e adaptar Mobility.

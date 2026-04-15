# ETAPA 9 — ADOÇÃO CANÔNICA NOS SERVICES ✅

**STATUS**: CONCLUÍDA

---

## A. Arquivos Alterados

### Tipos
- `src/core/business/types/index.ts` - Adicionados FK joins em BusinessDataWithProfiles
- `src/core/professional/types.ts` - Adicionados FK joins em ProfessionalDataWithProfiles

### Services
- `src/core/business/services/BusinessService.ts`
  - `mapBusinessDataToBusiness()` - Preferir dados canônicos
  - `getBusinessesList()` - FK joins canônicos
- `src/core/professional/services/ProfessionalService.ts`
  - `mapProfessionalDataToProfessional()` - Preferir dados canônicos
  - `getProfessionalsList()` - FK joins canônicos

### Testes
- `src/core/business/services/__tests__/BusinessService.mappers.test.ts` (3 testes)
- `src/core/professional/services/__tests__/ProfessionalService.mappers.test.ts` (3 testes)

---

## B. Métodos Reais Adaptados

### BusinessService
1. **mapBusinessDataToBusiness()** - Mapper preferindo canônico
   - Endereço: `address` FK join → monta string formatada
   - Bairro: `location.name` → fallback metadata.neighborhood
   - CEP: `address.postal_code` → fallback metadata.cep
   - Coordenadas: `address.latitude/longitude` → fallback data.latitude/longitude

2. **getBusinessesList()** - Query com FK joins
   ```sql
   address:addresses!address_id(id, location_id, postal_code, street, number, complement, address_type, latitude, longitude)
   location:locations!location_id(id, name, full_name, type, slug)
   ```

### ProfessionalService
1. **mapProfessionalDataToProfessional()** - Mapper preferindo canônico
   - Endereço: `address` FK join → monta string formatada
   - Bairro: `location.name` → fallback metadata.location.neighborhood
   - Cidade/Estado: extrai de `location.full_name` → fallback metadata.location
   - CEP: `address.postal_code` → fallback metadata.location.cep
   - Coordenadas: `address.latitude/longitude` → fallback metadata.location

2. **getProfessionalsList()** - Query com FK joins
   ```sql
   address:addresses!address_id(id, location_id, postal_code, street, number, complement, address_type, latitude, longitude)
   location:locations!location_id(id, name, full_name, type, slug)
   ```

---

## C. Estratégia de Leitura

### Prioridade Canônica
1. **Primeiro**: Dados de FK joins (address, location)
2. **Fallback**: Campos legados (data.address, metadata.location)
3. **Nunca**: Inventar dados

### Montagem de Endereço
- Canônico: `street, number - complement`
- Legado: campo `address` direto
- Sem número: apenas `street`

### Território
- Canônico: `location.name` (bairro oficial)
- Legado: `metadata.neighborhood` ou `metadata.location.neighborhood`

---

## D. Estratégia de Escrita

**NÃO IMPLEMENTADA NESTA ETAPA**

Escrita será tratada na ETAPA 10. Por enquanto:
- Métodos de criação/atualização já preservam campos canônicos (ETAPA 9 anterior)
- Não descartam `address_id`, `location_id` quando fornecidos
- Compatibilidade transitória mantida

---

## E. Queries/Joins Ajustados

### getBusinessesList()
```typescript
.select(`
  *,
  address:addresses!address_id(...),
  location:locations!location_id(...)
`)
```

### getProfessionalsList()
```typescript
.select(`
  *,
  profiles!inner(...),
  address:addresses!address_id(...),
  location:locations!location_id(...)
`)
```

### Métodos já adaptados (ETAPA 9 anterior)
- `getBusinesses()` - FK joins
- `getBusinessById()` - FK joins
- `getProfessionals()` - FK joins
- `getProfessionalById()` - FK joins

---

## F. Testes Criados/Executados

### Novos Testes (6 testes)
- `BusinessService.mappers.test.ts` - 3 testes ✅
- `ProfessionalService.mappers.test.ts` - 3 testes ✅

### Testes Existentes (24 testes)
- `BusinessService.canonical.test.ts` - 9 testes ✅
- `BusinessService.integration.test.ts` - 4 testes ✅
- `ProfessionalService.canonical.test.ts` - 7 testes ✅
- `ProfessionalService.integration.test.ts` - 4 testes ✅

### Total: 30 testes passando ✅

---

## G. Pendências Fora do Escopo

### ETAPA 10 (próxima)
- Adaptar formulários para escrever campos canônicos
- Atualizar schemas/validadores para coexistência transitória
- Criar testes de fluxos reais de escrita
- Garantir que updates não apaguem campos canônicos

### Futuro
- Remover campos legados
- Tornar FKs NOT NULL
- Geocoding externo (ViaCEP/Google)
- Cleanup final do schema

---

## H. Bloqueios Reais

**NENHUM**

Todos os objetivos da ETAPA 9 foram alcançados:
- ✅ Métodos reais dos services usando modelo canônico como primeira opção
- ✅ Fallback legado explícito e temporário
- ✅ Queries reais adaptadas com FK joins
- ✅ Mappers preferindo dados canônicos
- ✅ Testes dos métodos reais passando

---

## Resumo Técnico

A ETAPA 9 está completa. Os services principais agora:
1. Carregam relações canônicas via FK joins nas queries
2. Preferem dados canônicos nos mappers
3. Usam fallback legado apenas quando não migrado
4. Mantêm distinção clara entre território principal e cobertura
5. Não inventam dados

Próxima etapa: adaptar formulários e fluxos de escrita (ETAPA 10).

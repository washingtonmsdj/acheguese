# CONTRATO OFICIAL DE PRICING DA CORRIDA

**Data:** 07/04/2026  
**Status:** Definição oficial das regras de preço

---

## 1. DEFINIÇÃO OFICIAL DOS CAMPOS

### `suggested_price` - PREÇO ESTIMADO
- **Conceito:** Estimativa inicial calculada automaticamente
- **Quando:** Definido na criação da corrida
- **Fonte:** PricingService.calculateEstimate()
- **Natureza:** Estimativa baseada em distância/tempo/regras
- **Visibilidade:** Passageiro e motorista veem este valor
- **Imutável:** Não muda após criação da corrida

### `final_price` - PREÇO OFICIAL DA CORRIDA
- **Conceito:** Valor oficial pago/recebido na corrida
- **Quando:** Definido na conclusão da corrida
- **Fonte:** Recálculo automático ou confirmação do suggested_price
- **Natureza:** Valor real da transação
- **Visibilidade:** Usado para estatísticas, ganhos, histórico
- **Definitivo:** Valor final para todos os efeitos

---

## 2. FLUXO OFICIAL DE PRICING

### ETAPA 1: CRIAÇÃO (UX + PERSISTÊNCIA)
**Local:** CreateRideModal + useMobilidade.createRide

**Regra:**
1. **Modal calcula em tempo real** (UX preview)
2. **createRide recalcula oficialmente** (persistência)
3. **suggested_price é persistido** como estimativa oficial
4. **Fallback controlado:** Se coordenadas ausentes, rejeitar criação

**Código oficial:**
```typescript
// ✅ CÁLCULO OFICIAL - Único ponto de persistência
const priceEstimate = await pricingService.calculateEstimate({
  mode: rideData.type === 'entrega' ? 'delivery' : 'ride',
  origin: { latitude: rideData.origin_lat, longitude: rideData.origin_lng },
  destination: { latitude: rideData.destination_lat, longitude: rideData.destination_lng },
  options: { applyPeakHours: true, includeBreakdown: false },
});

suggestedPrice = priceEstimate.estimatedPrice; // ✅ VALOR OFICIAL
```

### ETAPA 2: ACEITE/ANDAMENTO (VISUALIZAÇÃO)
**Local:** DriverRidesList, RideRequestCard

**Regra:**
- **Motorista vê suggested_price** como valor da corrida
- **Passageiro vê suggested_price** como valor acordado
- **Nenhum recálculo** durante o andamento

### ETAPA 3: CONCLUSÃO (VALOR FINAL)
**Local:** CompleteRideDialog + useMobilidade.completeRide

**Regra:**
1. **Motorista pode informar valor pago** (opcional)
2. **Se não informar:** final_price = suggested_price (confirmação)
3. **Se informar:** final_price = valor informado (ajuste)
4. **Sem recálculo automático** na conclusão

**Código oficial:**
```typescript
// ✅ CONCLUSÃO OFICIAL - Confirmação ou ajuste
const calculatedFinalPrice = finalPrice || ride?.suggested_price || 0;

await RideOperationalService.completeRide(rideId, driverProfileId, calculatedFinalPrice);
```

---

## 3. ELIMINAÇÃO DE DIVERGÊNCIAS

### PONTOS DE CÁLCULO ÚNICOS
- ✅ **UX Preview:** CreateRideModal (usePriceEstimate) - apenas visual
- ✅ **Persistência Oficial:** useMobilidade.createRide - valor oficial
- ✅ **Conclusão:** CompleteRideDialog - confirmação ou ajuste manual

### ELIMINAÇÃO DE DUPLICAÇÃO
- ❌ **Removido:** Recálculo automático no completeRide
- ❌ **Removido:** Múltiplos pontos de cálculo oficial
- ❌ **Removido:** Fallback silencioso para preço zero

---

## 4. BLINDAGEM DE PERSISTÊNCIA

### REGRAS DE VALIDAÇÃO
1. **Coordenadas obrigatórias** para cálculo oficial
2. **Rejeitar criação** se pricing falhar sem coordenadas
3. **Valor mínimo** aplicado pelo PricingService
4. **Valor máximo** aplicado pelo PricingService (se definido)

### FALLBACKS CONTROLADOS
- ✅ **Permitido:** Ajuste manual na conclusão (CompleteRideDialog)
- ❌ **Proibido:** Valor manual arbitrário na criação
- ❌ **Proibido:** Preço zero ou negativo
- ❌ **Proibido:** Bypass das regras de pricing

### VALIDAÇÃO NO SCHEMA
```sql
-- ✅ Campos obrigatórios com validação
suggested_price DECIMAL(10,2) NOT NULL CHECK (suggested_price >= 5.00),
final_price     DECIMAL(10,2) CHECK (final_price >= 5.00 OR final_price IS NULL)
```

---

## 5. REVISÃO DO COMPLETERRIDE()

### PROBLEMA IDENTIFICADO
- **Atual:** Recálculo automático na conclusão
- **Problema:** Dados "reais" não são mais reais que os da criação
- **Risco:** Divergência entre preço acordado e preço final

### SOLUÇÃO IMPLEMENTADA
- **Novo:** Confirmação do suggested_price ou ajuste manual
- **Regra:** final_price = finalPrice || suggested_price
- **Conceito:** Conclusão confirma ou ajusta, não recalcula

### JUSTIFICATIVA
- **Distância real:** Não é mais precisa que a estimada
- **Tempo real:** Não afeta preço (trânsito é risco do motorista)
- **Acordo:** Preço foi acordado na criação, não deve mudar automaticamente

---

## 6. VALIDAÇÃO PONTA A PONTA

### CENÁRIO 1: FLUXO NORMAL
1. **Modal:** Mostra R$ 15,50 (preview)
2. **Criação:** Persiste suggested_price = 15.50 (oficial)
3. **Motorista:** Vê R$ 15,50 na lista
4. **Passageiro:** Vê R$ 15,50 no acompanhamento
5. **Conclusão:** Motorista não informa valor
6. **Final:** final_price = 15.50 (confirmação)

### CENÁRIO 2: AJUSTE MANUAL
1. **Modal:** Mostra R$ 15,50 (preview)
2. **Criação:** Persiste suggested_price = 15.50 (oficial)
3. **Motorista:** Vê R$ 15,50 na lista
4. **Conclusão:** Motorista informa R$ 18,00 (pedágio/extra)
5. **Final:** final_price = 18.00 (ajuste manual)

### CENÁRIO 3: ERRO CONTROLADO
1. **Modal:** Sem coordenadas
2. **Criação:** Falha com erro claro
3. **Usuário:** Deve informar endereços válidos
4. **Retry:** Com coordenadas válidas

---

## 7. RISCOS REAIS RESTANTES

### RISCOS ELIMINADOS ✅
- ❌ Divergência entre modal e persistência
- ❌ Recálculo inconsistente na conclusão
- ❌ Fallback silencioso para preço arbitrário
- ❌ Múltiplos pontos de verdade

### RISCOS CONTROLADOS ⚠️
- **Ajuste manual abusivo:** Mitigado por interface clara
- **Coordenadas imprecisas:** Mitigado por geocoding
- **Regras de pricing desatualizadas:** Mitigado por cache TTL

### RISCOS ACEITÁVEIS 📋
- **Diferença entre estimado e real:** Inerente ao modelo de negócio
- **Motorista não informar valor:** final_price = suggested_price (correto)
- **Passageiro questionar valor:** Valor foi acordado na criação

---

## 8. IMPLEMENTAÇÃO DAS REGRAS

### MUDANÇAS NECESSÁRIAS

#### 1. Blindar criação sem coordenadas
```typescript
// ❌ ANTES: Fallback silencioso
suggestedPrice = rideData.suggested_price;

// ✅ DEPOIS: Validação obrigatória
if (!rideData.origin_lat || !rideData.origin_lng || !rideData.destination_lat || !rideData.destination_lng) {
  throw new Error("Coordenadas são obrigatórias para cálculo de preço. Selecione endereços válidos.");
}
```

#### 2. Simplificar conclusão
```typescript
// ❌ ANTES: Recálculo automático confuso
const priceEstimate = await pricingService.calculateEstimate(...);
calculatedFinalPrice = priceEstimate.estimatedPrice;

// ✅ DEPOIS: Confirmação ou ajuste
const calculatedFinalPrice = finalPrice || ride?.suggested_price || 0;
```

#### 3. Validar schema
```sql
-- ✅ Adicionar constraints
ALTER TABLE ride_requests 
ADD CONSTRAINT check_suggested_price_min CHECK (suggested_price >= 5.00),
ADD CONSTRAINT check_final_price_min CHECK (final_price >= 5.00 OR final_price IS NULL);
```

---

## 9. CONTRATO FINAL

### DEFINIÇÕES OFICIAIS
- **suggested_price:** Preço estimado oficial calculado na criação
- **final_price:** Preço final da corrida (confirmação ou ajuste)
- **Modal:** Preview visual, não oficial
- **Criação:** Único ponto de cálculo oficial
- **Conclusão:** Confirmação ou ajuste manual

### REGRAS OFICIAIS
1. **Coordenadas obrigatórias** para criação
2. **PricingService único** ponto de cálculo
3. **suggested_price imutável** após criação
4. **final_price definido** apenas na conclusão
5. **Fallback manual controlado** via interface

### GARANTIAS
- ✅ **Consistência:** Mesmo valor em todos os pontos
- ✅ **Transparência:** Preço acordado na criação
- ✅ **Flexibilidade:** Ajuste manual na conclusão
- ✅ **Validação:** Regras de negócio aplicadas
- ✅ **Auditoria:** Histórico completo de preços

**Este contrato elimina divergências e estabelece regras claras para o pricing da corrida.**
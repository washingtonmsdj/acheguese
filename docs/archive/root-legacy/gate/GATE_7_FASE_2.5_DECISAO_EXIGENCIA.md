# GATE 7: FASE 2.5 - DECISÃO DE EXIGÊNCIA DE PIN

**Data:** 08/04/2026  
**Status:** 🚧 EM IMPLEMENTAÇÃO

---

## PROBLEMA IDENTIFICADO

Implementei infraestrutura de verificação mas NÃO implementei a decisão de produto:
- Quem exige PIN?
- Quando exige?
- Como entra automaticamente no fluxo oficial?

**Faltou:** Camada de decisão de exigência integrada ao SSOT.

---

## SOLUÇÃO: FASE 2.5

### 1. Modelar Origem da Exigência

**Corrida:**
- Admin global
- Preferência do passageiro
- Preferência do motorista

**Entrega:**
- Admin global
- Configuração da operação/remetente/empresa

### 2. Implementar Precedência Oficial

**Corrida:**
```
admin global > passageiro > motorista
```
Regra: Se qualquer nível exigir, a corrida exige PIN.

**Entrega:**
```
admin global > operação/remetente/empresa
```
Regra: Motoboy NÃO decide exigência de PIN da entrega.

### 3. Criar Resolução SSOT

Métodos centrais:
- `resolveRidePINRequirement()`
- `resolveDeliveryPINRequirement()`

Retorno:
```typescript
{
  isRequired: boolean;
  requiredBy: 'admin' | 'passenger' | 'driver' | 'sender' | 'operation';
  reason: string;
}
```

### 4. Integrar Criação Automática

**Corrida:**
- No fluxo oficial de `createRide()`
- Criar automaticamente `operational_verifications` se exigido
- Gerar PIN
- Persistir `required_by`
- Status `pending`

**Entrega:**
- No fluxo oficial de `createDelivery()`
- Criar automaticamente `operational_verifications` se exigido
- Gerar PIN
- Persistir `required_by`
- Status `pending`

---

## IMPLEMENTAÇÃO

### Etapa 1: Adicionar Campos de Configuração

**Tabela:** `profiles`
- `requires_pin_for_rides`: boolean (preferência do passageiro/motorista)

**Tabela:** `system_config` (nova, se não existir)
- `require_pin_for_all_rides`: boolean (admin global)
- `require_pin_for_all_deliveries`: boolean (admin global)

### Etapa 2: Criar Métodos de Resolução

**Arquivo:** `OperationalVerificationService.ts`

Adicionar:
- `resolveRidePINRequirement()`
- `resolveDeliveryPINRequirement()`

### Etapa 3: Integrar em createRide() e createDelivery()

**Arquivo:** `RideOperationalService.ts`

Modificar:
- `createRide()` - Chamar `resolveRidePINRequirement()` e criar verificação se necessário
- `createDelivery()` - Chamar `resolveDeliveryPINRequirement()` e criar verificação se necessário

---

## PRÓXIMOS PASSOS

1. ⏳ Adicionar campos de configuração
2. ⏳ Implementar métodos de resolução
3. ⏳ Integrar em createRide()
4. ⏳ Integrar em createDelivery()
5. ⏳ Executar testes Gate 7 (8/8 esperado)
6. ⏳ Executar testes Gate 6 (9/9 esperado - regressão)
7. ⏳ Criar relatório final objetivo

---

## VEREDITO

❌ **GATE 7 AINDA NÃO FECHOU**

Falta implementar a camada de decisão de exigência integrada ao fluxo oficial.

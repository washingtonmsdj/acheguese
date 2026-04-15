# GATE 3: AUDITORIA DO FLUXO DE CANCELAMENTO

**Data:** 07/04/2026  
**Status:** AUDITORIA INICIAL

---

## 1. MAPEAMENTO DO FLUXO ATUAL

### State Machine Completa

**Estados:**
```
REQUESTED → SEARCHING_DRIVER → DRIVER_ASSIGNED → DRIVER_ACCEPTED → DRIVER_ARRIVING
    ↓              ↓                    ↓                ↓                ↓
    └──────────────┴────────────────────┴────────────────┴────────────────┘
                              ↓
                    CANCELLED_BY_PASSENGER / CANCELLED_BY_DRIVER

PASSENGER_BOARDED → IN_PROGRESS → COMPLETED
    ↓
    └──→ CANCELLED_BY_DRIVER (apenas motorista)

PICKUP_CONFIRMED → IN_DELIVERY → DELIVERED → COMPLETED
    ↓                   ↓
    └───────────────────┴──→ CANCELLED_BY_DRIVER/PASSENGER
```

### Quem Pode Cancelar em Cada Estado

| Estado | Passageiro | Motorista | Sistema |
|--------|------------|-----------|---------|
| REQUESTED | ✅ | ❌ | ✅ (expired) |
| SEARCHING_DRIVER | ✅ | ❌ | ✅ (expired) |
| DRIVER_ASSIGNED | ✅ | ✅ | ✅ (expired) |
| DRIVER_ACCEPTED | ✅ | ✅ | ❌ |
| DRIVER_ARRIVING | ✅ | ✅ | ❌ |
| PASSENGER_BOARDED | ❌ | ✅ | ❌ |
| IN_PROGRESS | ❌ | ❌ | ❌ |
| PICKUP_CONFIRMED | ✅ | ✅ | ❌ |
| IN_DELIVERY | ❌ | ✅ | ❌ |
| COMPLETED | ❌ | ❌ | ❌ |
| CANCELLED_* | ❌ | ❌ | ❌ |
| EXPIRED | ❌ | ❌ | ❌ |
| FAILED | ❌ | ❌ | ❌ |

---

## 2. ANÁLISE DA IMPLEMENTAÇÃO ATUAL

### ✅ Pontos Fortes

1. **State Machine Centralizada**
   - `RideStateMachine.ts` define todas as transições
   - Validação explícita de quem pode cancelar
   - Estados finais protegidos

2. **Optimistic Locking**
   - `RideDispatchService.acceptRide()` usa `.eq('status', fromState)`
   - Previne race condition básica
   - Falha graciosamente se estado mudou

3. **Validação de Permissão**
   - `RideOperationalService.cancelRide()` valida:
     - Estado é cancelável
     - Passageiro é dono da corrida
     - Motorista é o atribuído

4. **Liberação de Motorista**
   - `handlePostTransition()` atualiza `is_available = true`
   - Motorista fica livre para novas corridas

### ❌ Problemas Identificados

1. **SEM Idempotência**
   - Múltiplos cliques em "Cancelar" podem causar múltiplas tentativas
   - Não há verificação se já está cancelado antes de tentar cancelar
   - Pode gerar logs/auditoria duplicados

2. **SEM Tratamento de Concorrência Real**
   - Passageiro cancela enquanto motorista aceita
   - Motorista cancela enquanto passageiro cancela
   - Não há transação atômica

3. **SEM Validação de Estado no Banco**
   - CHECK constraint antigo: `status IN ('pending','accepted','in_progress','completed','cancelled')`
   - Não inclui novos estados: `requested`, `searching_driver`, `driver_assigned`, etc.
   - Permite estados inválidos

4. **SEM Notificação Push**
   - Apenas Realtime (WebSocket)
   - Se usuário perde conexão, não sabe do cancelamento
   - Não há fallback para push notification

5. **SEM Rollback de Pricing**
   - `suggested_price` permanece na tabela
   - `final_price` fica NULL
   - Não há validação se pricing foi capturado/reservado

6. **SEM Testes de Cancelamento**
   - Nenhum teste encontrado
   - Não valida race conditions
   - Não valida cenários de erro

---

## 3. CENÁRIOS DE CONCORRÊNCIA NÃO TRATADOS

### Cenário 1: Passageiro Cancela Enquanto Motorista Aceita

```
Tempo  Passageiro          Motorista           Estado Real
────────────────────────────────────────────────────────────
T0     clica "Cancelar"                        SEARCHING_DRIVER
T1                         clica "Aceitar"     SEARCHING_DRIVER
T2     UPDATE status    →  CANCELLED_BY_PASS   (sucesso)
T3     UPDATE status    ←  DRIVER_ACCEPTED     (falha - estado mudou)
```

**Resultado:** Passageiro cancela, motorista vê erro. ✅ Funciona.

### Cenário 2: Motorista Cancela Enquanto Passageiro Cancela

```
Tempo  Passageiro          Motorista           Estado Real
────────────────────────────────────────────────────────────
T0     clica "Cancelar"                        DRIVER_ACCEPTED
T1                         clica "Cancelar"    DRIVER_ACCEPTED
T2     UPDATE status    →  CANCELLED_BY_PASS   (sucesso)
T3     UPDATE status    ←  CANCELLED_BY_DRIVER (falha - estado mudou)
```

**Resultado:** Primeiro a executar ganha. ✅ Funciona.

### Cenário 3: Duplo Clique em Cancelar

```
Tempo  Usuário             Estado Real
────────────────────────────────────────────
T0     clica "Cancelar"    DRIVER_ACCEPTED
T1     UPDATE status    →  CANCELLED_BY_PASS (sucesso)
T2     clica "Cancelar"    CANCELLED_BY_PASS
T3     UPDATE status    ←  (falha - estado não é cancelável)
```

**Resultado:** Segundo clique falha, mas UI pode não mostrar. ⚠️ Parcial.

### Cenário 4: Cancelamento Durante Transição de Estado

```
Tempo  Passageiro          Sistema             Estado Real
────────────────────────────────────────────────────────────
T0     clica "Cancelar"                        SEARCHING_DRIVER
T1                         assignDriver()      SEARCHING_DRIVER
T2     UPDATE status    →  CANCELLED_BY_PASS   (sucesso)
T3                         UPDATE status    ←  (falha)
```

**Resultado:** Correto, mas pode deixar dispatch pendente. ⚠️ Parcial.

---

## 4. IMPACTO EM DISPATCH/DISPONIBILIDADE

### Dispatch

**Problema:** Cancelamento não notifica o sistema de dispatch ativo.

```typescript
// RideDispatchService.startDriverSearch() inicia busca
// Mas cancelamento não chama stopDriverSearch()
```

**Resultado:** Sistema pode continuar buscando motorista após cancelamento.

### Disponibilidade do Motorista

**Implementação:**
```typescript
// RideOperationalService.handlePostTransition()
if (newState.includes('cancelled') || newState === 'completed') {
  await supabase
    .from('driver_availability')
    .update({ is_available: true })
    .eq('profile_id', driverProfileId);
}
```

**Problema:** Tabela `driver_availability` não existe nas migrations!

**Verificar:** Se usa `driver_data.is_available` ao invés.

---

## 5. IMPACTO EM PRICING

### Análise Atual

**Campos de Pricing:**
- `suggested_price` - Calculado na criação, imutável
- `final_price` - NULL se cancelada, preenchido se completada

**Não há:**
- Captura/reserva de pagamento
- Estorno automático
- Taxa de cancelamento

**Conclusão:** Não há rollback financeiro a fazer. Pricing está correto.

---

## 6. REALTIME E SINCRONIZAÇÃO

### Implementação Atual

**Hook:** `useRideRealtime`

```typescript
// Subscreve mudanças em ride_requests
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'ride_requests',
}, (payload) => {
  // Detecta cancelamento
  if (newData.status?.includes('cancelled')) {
    eventType = 'cancelled';
  }
})
```

**Problemas:**
1. Não há confirmação de recebimento
2. Não há retry se conexão cai
3. Não há persistência de evento

### Validação Necessária

- [ ] Passageiro vê cancelamento em tempo real
- [ ] Motorista vê cancelamento em tempo real
- [ ] UI atualiza corretamente
- [ ] Estado stale é detectado

---

## 7. BUGS ENCONTRADOS

### BUG 1: CHECK Constraint Desatualizado

**Problema:**
```sql
CHECK (status IN ('pending','accepted','in_progress','completed','cancelled'))
```

**Estados Reais:**
```typescript
'requested', 'searching_driver', 'driver_assigned', 'driver_accepted',
'driver_arriving', 'passenger_boarded', 'in_progress', 'pickup_confirmed',
'in_delivery', 'delivered', 'completed', 'cancelled_by_passenger',
'cancelled_by_driver', 'expired', 'failed', 'failed_delivery'
```

**Impacto:** Banco pode rejeitar estados válidos ou aceitar inválidos.

### BUG 2: Tabela driver_availability Não Existe

**Problema:** Código referencia tabela que não está nas migrations.

**Possível Solução:** Usar `driver_data.is_available` ou criar tabela.

### BUG 3: Sem Validação de Idempotência

**Problema:** Segundo cancelamento falha silenciosamente.

**Solução:** Verificar se já está cancelado antes de tentar.

---

## 8. PRÓXIMOS PASSOS

1. **Corrigir CHECK Constraint**
   - Atualizar para incluir todos os estados
   - Ou remover constraint e validar via código

2. **Implementar Idempotência**
   - Verificar estado atual antes de cancelar
   - Retornar sucesso se já está cancelado

3. **Validar Disponibilidade do Motorista**
   - Verificar se usa tabela correta
   - Garantir liberação após cancelamento

4. **Criar Testes de Cancelamento**
   - Race conditions
   - Idempotência
   - Permissões
   - Realtime

5. **Validar Realtime**
   - Testar notificação de cancelamento
   - Verificar sincronização UI

---

**Próxima etapa:** Implementar correções e validar operacionalmente.
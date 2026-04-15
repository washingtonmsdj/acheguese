# GATE 3: PREPARAÇÃO - CANCELAMENTO DE CORRIDA

**Data:** 07/04/2026  
**Estimativa:** 2-3 horas  
**Prioridade:** ALTA (bloqueador para produção)

---

## 🎯 OBJETIVO

Validar e corrigir o fluxo de cancelamento de corrida para garantir consistência, idempotência e tratamento correto de concorrência.

---

## 🔍 BLOQUEADORES IDENTIFICADOS

### 1. Validação de Estado Insuficiente
**Problema:** Cancelamento não valida se a corrida está em estado cancelável

**Cenários não tratados:**
- Cancelar corrida já aceita
- Cancelar corrida em andamento
- Cancelar corrida já concluída
- Cancelar corrida já cancelada

### 2. Concorrência Não Testada
**Problema:** Não testa race conditions

**Cenários críticos:**
- Motorista aceita enquanto passageiro cancela
- Dois passageiros tentam cancelar simultaneamente
- Cancelamento durante atualização de status

### 3. Rollback de Pricing Ausente
**Problema:** Se cancelamento falhar, pricing pode ficar inconsistente

**Cenários não tratados:**
- Pricing calculado mas corrida não criada
- Corrida criada mas pricing não registrado
- Cancelamento falha após atualizar status

### 4. Timeout de Cancelamento Não Validado
**Problema:** Não testa se cancelamento expira corretamente

**Cenários não tratados:**
- Cancelamento após timeout de busca
- Cancelamento após motorista aceitar
- Cancelamento com penalidade vs sem penalidade

---

## 📋 ESCOPO DO GATE 3

### Fase 1: Diagnóstico (30 min)
1. Mapear fluxo atual de cancelamento
2. Identificar pontos de falha
3. Listar estados válidos para cancelamento
4. Documentar regras de negócio

### Fase 2: Implementação (60-90 min)
1. Adicionar validação de estado
2. Implementar idempotência
3. Adicionar tratamento de concorrência
4. Implementar rollback de pricing
5. Validar timeouts

### Fase 3: Validação (30-60 min)
1. Criar testes E2E de cancelamento
2. Testar concorrência
3. Testar rollback
4. Testar timeouts
5. Validar métricas

---

## 🗺️ FLUXO ATUAL (A SER VALIDADO)

```
Passageiro clica "Cancelar"
         ↓
useCancelRide hook
         ↓
RideService.cancelRide()
         ↓
Supabase: UPDATE ride_requests SET status = 'cancelled'
         ↓
Realtime notifica motorista (se aceito)
         ↓
UI atualiza
```

**Gaps identificados:**
- ❌ Não valida estado atual
- ❌ Não testa concorrência
- ❌ Não faz rollback em falha
- ❌ Não valida timeout

---

## 🎯 FLUXO ESPERADO (GATE 3)

```
Passageiro clica "Cancelar"
         ↓
useCancelRide hook
         ↓
Validar estado atual (pending, searching, accepted)
         ↓
         ├─ Se inválido → Retornar erro
         ↓
RideService.cancelRide()
         ↓
BEGIN TRANSACTION
         ↓
         ├─ Verificar estado novamente (lock pessimista)
         ├─ UPDATE ride_requests SET status = 'cancelled'
         ├─ Registrar motivo de cancelamento
         ├─ Calcular penalidade (se aplicável)
         ├─ Atualizar métricas
         ↓
COMMIT TRANSACTION
         ↓
Realtime notifica motorista (se aceito)
         ↓
UI atualiza
         ↓
Métricas registradas
```

---

## 📊 ESTADOS VÁLIDOS PARA CANCELAMENTO

| Estado Atual | Pode Cancelar? | Penalidade? | Notifica Motorista? |
|--------------|----------------|-------------|---------------------|
| pending | ✅ Sim | ❌ Não | ❌ Não |
| searching | ✅ Sim | ❌ Não | ❌ Não |
| accepted | ✅ Sim | ⚠️ Depende | ✅ Sim |
| in_progress | ⚠️ Depende | ✅ Sim | ✅ Sim |
| completed | ❌ Não | N/A | ❌ Não |
| cancelled | ❌ Não | N/A | ❌ Não |

---

## 🧪 CASOS DE TESTE NECESSÁRIOS

### 1. Cancelamento Básico
- [ ] Cancelar corrida em pending
- [ ] Cancelar corrida em searching
- [ ] Cancelar corrida em accepted

### 2. Validação de Estado
- [ ] Tentar cancelar corrida completed (deve falhar)
- [ ] Tentar cancelar corrida cancelled (deve ser idempotente)
- [ ] Tentar cancelar corrida in_progress (deve validar regras)

### 3. Concorrência
- [ ] Motorista aceita enquanto passageiro cancela
- [ ] Dois passageiros tentam cancelar simultaneamente
- [ ] Cancelamento durante atualização de status

### 4. Rollback
- [ ] Falha após atualizar status (deve reverter)
- [ ] Falha ao notificar motorista (não deve reverter status)
- [ ] Falha ao registrar métrica (não deve reverter status)

### 5. Timeout
- [ ] Cancelamento após timeout de busca
- [ ] Cancelamento antes de timeout
- [ ] Cancelamento com penalidade

### 6. Idempotência
- [ ] Cancelar mesma corrida 2x (segunda deve ser no-op)
- [ ] Cancelar com mesmo motivo 2x
- [ ] Verificar que métricas não duplicam

---

## 📁 ARQUIVOS A SEREM ANALISADOS

### Hooks:
- `src/modules/mobility/hooks/useCancelRide.ts`

### Services:
- `src/modules/mobility/core/RideService.ts`
- `src/modules/mobility/core/RideDispatchService.ts`

### Types:
- `src/shared/types/mobility.generated.ts`

### Database:
- `supabase/migrations/*_ride_requests.sql`

---

## 🎯 CRITÉRIOS DE FECHAMENTO

### Fundação Técnica (já está em 95%):
- [x] Código de cancelamento existe
- [x] Tipos definidos
- [x] Integração básica funciona

### Implementado Funcionalmente (75% → 80%):
- [ ] Validação de estado implementada
- [ ] Idempotência garantida
- [ ] Rollback implementado
- [ ] Timeouts validados

### Validado Operacionalmente (25% → 35%):
- [ ] Testes E2E de concorrência passam
- [ ] Testes de rollback passam
- [ ] Testes de timeout passam
- [ ] Métricas coletadas

### Pronto para Produção (15% → 20%):
- [ ] Documentação operacional criada
- [ ] Runbook de incidentes atualizado
- [ ] Alertas configurados (opcional para Gate 3)

---

## 📝 ENTREGÁVEIS ESPERADOS

### Código:
1. Validação de estado em `useCancelRide`
2. Transação com lock em `RideService.cancelRide()`
3. Rollback em caso de falha
4. Idempotência garantida

### Testes:
1. `tests/e2e/gate3-cancelamento.test.ts` (10+ casos)
2. Testes de concorrência
3. Testes de rollback
4. Testes de timeout

### Documentação:
1. `GATE_3_DIAGNOSTICO.md` - Análise do fluxo atual
2. `GATE_3_IMPLEMENTACAO.md` - Mudanças realizadas
3. `GATE_3_VALIDACAO.md` - Resultados dos testes
4. `GATE_3_FECHAMENTO.md` - Relatório final

### Migration (se necessário):
1. Adicionar coluna `cancellation_reason`
2. Adicionar coluna `cancelled_at`
3. Adicionar índice para queries de cancelamento

---

## ⚠️ RISCOS IDENTIFICADOS

### Risco 1: Concorrência Complexa
**Probabilidade:** Alta  
**Impacto:** Alto  
**Mitigação:** Usar lock pessimista (SELECT FOR UPDATE)

### Risco 2: Rollback Incompleto
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:** Usar transações do Supabase

### Risco 3: Timeout Inconsistente
**Probabilidade:** Média  
**Impacto:** Médio  
**Mitigação:** Validar timeout no backend também

---

## 🚀 PRÓXIMOS PASSOS

1. **Ler código atual** de cancelamento
2. **Mapear fluxo** completo
3. **Identificar gaps** específicos
4. **Implementar correções** uma por uma
5. **Criar testes E2E** para validar
6. **Executar testes** e coletar evidências
7. **Documentar** resultados
8. **Fechar Gate 3** com evidências objetivas

---

**Pronto para iniciar Gate 3?**

Comando: "Execute Gate 3" ou "Analise o código de cancelamento"


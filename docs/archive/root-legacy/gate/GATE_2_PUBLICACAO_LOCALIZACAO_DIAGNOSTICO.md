# GATE 2: PUBLICAÇÃO REAL DE LOCALIZAÇÃO - DIAGNÓSTICO

**Data:** 07/04/2026  
**Status:** 🔍 EM DIAGNÓSTICO

---

## OBJETIVO

Validar ponta a ponta o pipeline de publicação de localização:
- Motorista publica localização via GPS
- Persistência correta no banco
- Passageiro consome em tempo real
- Latência aceitável
- Comportamento em falhas

---

## FASE 1 — DIAGNÓSTICO DO PIPELINE ATUAL

### 1. ARQUITETURA IDENTIFICADA

#### Fluxo de Publicação (Motorista):

```
GPS Device
  ↓
navigator.geolocation.watchPosition()
  ↓
useGeolocationTracking (hook)
  ↓
trackingService.updatePosition()
  ↓
supabase.from('driver_locations').upsert()
  ↓
Banco de Dados (driver_locations)
```

#### Fluxo de Consumo (Passageiro):

```
Banco de Dados (driver_locations)
  ↓
Realtime Subscription (postgres_changes)
  ↓
trackingService.subscribeToPosition()
  ↓
useDriverLocation (hook)
  ↓
Componente UI (LiveTrackingMap)
```

---

### 2. COMPONENTES IDENTIFICADOS

#### 2.1 Publicação (Motorista)

**Hook:** `useGeolocationTracking`
- Localização: `src/core/tracking/hooks/useGeolocationTracking.ts`
- Responsabilidade: Capturar GPS e enviar para servidor
- Frequência: Configurável (padrão 10s)
- Throttling: Sim (evita envios excessivos)
- Conversão: m/s → km/h para velocidade

**Componente:** `DriverLocationSender`
- Localização: `src/modules/mobility/components/DriverLocationSender.tsx`
- Responsabilidade: UI de status do GPS
- Integração: Usa `useGeolocationTracking`
- Estados: GPS Ativo, Iniciando, Erro, Inativo

**Service:** `TrackingService`
- Localização: `src/core/tracking/services/TrackingService.ts`
- Método: `updatePosition()`
- Operação: `upsert` na tabela `driver_locations`
- Conflito: Resolve por `driver_profile_id`

#### 2.2 Consumo (Passageiro)

**Hook:** `useDriverLocation`
- Localização: `src/modules/mobility/hooks/useDriverLocation.ts`
- Responsabilidade: Consumir localização do motorista
- Integração: Usa `trackingService.subscribeToPosition()`
- Dados: latitude, longitude, heading, speed, accuracy

**Service:** `TrackingService`
- Método: `subscribeToPosition()`
- Operação: Subscription via `supabase.channel()`
- Evento: `postgres_changes` na tabela `driver_locations`
- Filtro: `driver_profile_id=eq.{id}`

**Componente:** `LiveTrackingMap`
- Localização: `src/modules/mobility/components/map/LiveTrackingMap.tsx`
- Responsabilidade: Exibir localização em tempo real
- Integração: Usa `useDriverLocation`

---

### 3. TABELA DO BANCO

**Tabela:** `driver_locations`

```sql
CREATE TABLE driver_locations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat               DECIMAL(10,7) NOT NULL,
  lng               DECIMAL(10,7) NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Problemas Identificados:**

1. ❌ **Falta de colunas críticas:**
   - `accuracy` - Precisão do GPS
   - `heading` - Direção do movimento
   - `speed` - Velocidade
   - `altitude` - Altitude

2. ❌ **Nomenclatura inconsistente:**
   - Banco usa `lat`/`lng`
   - Service espera `latitude`/`longitude`
   - Mapeamento manual necessário

3. ⚠️ **Sem histórico:**
   - Apenas última posição
   - Não guarda trajeto
   - Tabela `location_tracking` mencionada no código mas não existe

4. ⚠️ **Sem índice de performance:**
   - Apenas índice em `driver_profile_id`
   - Sem índice em `updated_at` (queries por tempo)

---

### 4. GAPS CRÍTICOS IDENTIFICADOS

#### 4.1 Schema do Banco Incompleto

**Problema:** Tabela `driver_locations` não tem colunas para dados completos de GPS.

**Impacto:** 
- Dados de `accuracy`, `heading`, `speed`, `altitude` são enviados mas não persistidos
- Impossível validar qualidade do GPS
- Impossível calcular velocidade média
- Impossível detectar motorista parado

**Evidência:**
```typescript
// useGeolocationTracking.ts envia:
const trackingPosition: TrackingPosition = {
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,        // ❌ Não persiste
  heading: position.coords.heading,          // ❌ Não persiste
  speed: position.coords.speed * 3.6,        // ❌ Não persiste
  altitude: position.coords.altitude,        // ❌ Não persiste
  timestamp: new Date().toISOString(),
};

// Mas tabela só tem:
// lat, lng, updated_at
```

#### 4.2 Sem Tabela de Histórico

**Problema:** Não existe tabela `location_tracking` para histórico.

**Impacto:**
- Impossível auditar trajeto
- Impossível calcular distância percorrida
- Impossível detectar desvios de rota
- Impossível gerar relatórios

**Evidência:**
```typescript
// TrackingService.ts referencia:
private getHistoryTableName(entityType: string): string {
  const tables: Record<string, string> = {
    driver: 'location_tracking',  // ❌ Tabela não existe
    // ...
  };
}
```

#### 4.3 Sem Validação E2E

**Problema:** Não há testes E2E do pipeline completo.

**Impacto:**
- Não sabemos se funciona ponta a ponta
- Não sabemos a latência real
- Não sabemos o comportamento em falhas
- Não sabemos se reconexão funciona

**Evidência:** Nenhum teste E2E encontrado para tracking.

#### 4.4 Sem Métricas de Latência

**Problema:** Não há medição de latência do pipeline.

**Impacto:**
- Não sabemos se latência é aceitável (<5s)
- Não sabemos se há gargalos
- Não sabemos se realtime está funcionando

**Evidência:** Nenhum logging de latência no código.

#### 4.5 Sem Tratamento de Falhas

**Problema:** Tratamento de falhas é básico.

**Impacto:**
- GPS falha → erro genérico
- Rede falha → erro genérico
- Reconexão não é automática
- Estado pode ficar inconsistente

**Evidência:**
```typescript
// useGeolocationTracking.ts
catch (err) {
  logger.error('[useGeolocationTracking] Error sending position:', err);
  setError('Erro ao enviar localização');  // ❌ Genérico demais
}
```

---

## FASE 2 — PLANO DE AÇÃO

### Ação 1: Corrigir Schema do Banco

**Prioridade:** CRÍTICA

**Ação:**
1. Criar migration para adicionar colunas faltantes
2. Criar tabela de histórico `location_tracking`
3. Adicionar índices de performance
4. Atualizar RLS policies

**Entrega:**
- Migration SQL
- Tabelas atualizadas
- Índices criados

---

### Ação 2: Criar Teste E2E

**Prioridade:** CRÍTICA

**Ação:**
1. Criar teste que simula motorista publicando
2. Validar persistência no banco
3. Validar consumo pelo passageiro
4. Medir latência ponta a ponta
5. Testar falhas de GPS
6. Testar falhas de rede

**Entrega:**
- Teste E2E funcional
- Métricas de latência
- Relatório de comportamento em falhas

---

### Ação 3: Adicionar Métricas

**Prioridade:** ALTA

**Ação:**
1. Adicionar logging de latência
2. Adicionar métricas de sucesso/falha
3. Adicionar métricas de frequência
4. Dashboard básico (opcional)

**Entrega:**
- Logs estruturados
- Métricas coletadas
- Queries para análise

---

### Ação 4: Melhorar Tratamento de Falhas

**Prioridade:** ALTA

**Ação:**
1. Categorizar erros (GPS, rede, permissão)
2. Implementar retry automático
3. Implementar reconexão automática
4. Adicionar fallback seguro

**Entrega:**
- Erros categorizados
- Retry implementado
- Reconexão automática
- Fallback seguro

---

## FASE 3 — ESTIMATIVA

### Tempo Estimado por Ação:

1. **Corrigir Schema:** 2-3 horas
2. **Criar Teste E2E:** 4-6 horas
3. **Adicionar Métricas:** 2-3 horas
4. **Melhorar Falhas:** 3-4 horas

**Total:** 11-16 horas (1.5-2 dias)

---

## PRÓXIMOS PASSOS

1. ✅ Diagnóstico completo
2. ⏳ Corrigir schema do banco (PRÓXIMO)
3. ⏳ Criar teste E2E
4. ⏳ Adicionar métricas
5. ⏳ Melhorar tratamento de falhas
6. ⏳ Validar ponta a ponta
7. ⏳ Relatório final

---

## RISCOS IDENTIFICADOS

### Risco 1: Schema Incompleto Bloqueia Validação

**Probabilidade:** Alta  
**Impacto:** Alto  
**Mitigação:** Corrigir schema primeiro (Ação 1)

### Risco 2: Latência Pode Ser Alta

**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:** Medir latência no teste E2E (Ação 2)

### Risco 3: Realtime Pode Falhar

**Probabilidade:** Baixa  
**Impacto:** Crítico  
**Mitigação:** Testar reconexão (Ação 4)

---

## CONCLUSÃO DO DIAGNÓSTICO

### Status Atual:

- ✅ Arquitetura identificada
- ✅ Componentes mapeados
- ✅ Gaps críticos identificados
- ❌ Schema do banco incompleto
- ❌ Sem testes E2E
- ❌ Sem métricas de latência
- ❌ Tratamento de falhas básico

### Bloqueadores:

1. **Schema incompleto** - Dados não persistem corretamente
2. **Sem validação E2E** - Não sabemos se funciona
3. **Sem métricas** - Não sabemos a latência

### Próxima Ação:

**Corrigir schema do banco** (Ação 1) - CRÍTICO

---

**🔍 DIAGNÓSTICO COMPLETO - INICIANDO CORREÇÃO DO SCHEMA**

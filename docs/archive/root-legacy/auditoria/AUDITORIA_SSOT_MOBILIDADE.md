# 🔍 Auditoria SSOT - Dados de Mobilidade

**Data**: 25/03/2026  
**Status**: ⚠️ VIOLAÇÃO SSOT DETECTADA

---

## ❌ PROBLEMA IDENTIFICADO

O `AdminStatsService` está fazendo queries diretas ao Supabase para dados de mobilidade, **violando o princípio SSOT**.

### Código Atual (INCORRETO)
```typescript
// ❌ AdminStatsService.ts - VIOLAÇÃO SSOT
async getTableStats(tables: string[]): Promise<TableStats> {
  // Query direta ao Supabase
  const { count: driversCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("profile_type", "driver");
  
  stats.drivers = driversCount || 0;
}
```

**Problema**: Bypassa o `MobilityService`, que é o SSOT para dados de mobilidade.

---

## ✅ SSOT CORRETO

### MobilityService - SSOT para Mobilidade

**Arquivo**: `src/modules/mobility/services/MobilityService.ts`

**Métodos Disponíveis**:
```typescript
class MobilityServiceClass {
  // Motoristas
  async getDriverProfiles(): Promise<DriverProfile[]>
  
  // Corridas
  async getUserRides(userId: string): Promise<RideRequest[]>
  async getRidesByDriver(driverProfileId: string): Promise<RideRequest[]>
  async getUserRideStats(userId: string, userType: "passenger" | "driver"): Promise<RideStats>
  
  // Estatísticas
  async getDriverStatsDetailed(profileId: string): Promise<any>
}
```

---

## 🎯 SOLUÇÃO CORRETA

### Opção 1: Adicionar Métodos ao MobilityService ✅ RECOMENDADO

**Adicionar ao MobilityService**:
```typescript
// src/modules/mobility/services/MobilityService.ts

/**
 * Obtém contagem total de motoristas
 */
async getTotalDriversCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("profile_type", "driver");
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("Error getting drivers count", error as Error, {
      service: "MobilityService",
      method: "getTotalDriversCount",
    });
    return 0;
  }
}

/**
 * Obtém contagem total de corridas
 */
async getTotalRidesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("ride_requests")
      .select("*", { count: "exact", head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("Error getting rides count", error as Error, {
      service: "MobilityService",
      method: "getTotalRidesCount",
    });
    return 0;
  }
}

/**
 * Obtém estatísticas gerais de mobilidade
 */
async getMobilityStats(): Promise<{
  total_drivers: number;
  total_rides: number;
  active_rides: number;
  completed_rides: number;
}> {
  try {
    const [driversCount, ridesCount, activeRidesCount, completedRidesCount] = 
      await Promise.all([
        this.getTotalDriversCount(),
        this.getTotalRidesCount(),
        this.getActiveRidesCount(),
        this.getCompletedRidesCount(),
      ]);
    
    return {
      total_drivers: driversCount,
      total_rides: ridesCount,
      active_rides: activeRidesCount,
      completed_rides: completedRidesCount,
    };
  } catch (error) {
    logger.error("Error getting mobility stats", error as Error, {
      service: "MobilityService",
      method: "getMobilityStats",
    });
    return {
      total_drivers: 0,
      total_rides: 0,
      active_rides: 0,
      completed_rides: 0,
    };
  }
}
```

**Atualizar AdminStatsService**:
```typescript
// src/core/admin/services/AdminStatsService.ts
import { mobilityService } from "@/modules/mobility/services/MobilityService";

async getTableStats(tables: string[]): Promise<TableStats> {
  // ... contagem de outras tabelas
  
  // ✅ SSOT: Usar MobilityService para dados de mobilidade
  const mobilityStats = await mobilityService.getMobilityStats();
  
  stats.drivers = mobilityStats.total_drivers;
  stats.ride_requests = mobilityStats.total_rides;
  
  return stats;
}
```

### Opção 2: AdminStatsService Delega para MobilityService

**Manter queries no AdminStatsService, mas documentar**:
```typescript
// ❌ NÃO RECOMENDADO - Viola SSOT
// Apenas aceitável se MobilityService não tiver métodos de contagem

async getTableStats(tables: string[]): Promise<TableStats> {
  // NOTA: Idealmente deveria usar MobilityService.getTotalDriversCount()
  // TODO: Migrar para MobilityService quando métodos estiverem disponíveis
  const { count: driversCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("profile_type", "driver");
}
```

---

## 📊 COMPARAÇÃO

### Antes (Violação SSOT)
```
AdminStatsService
  └─> supabase.from("profiles").eq("profile_type", "driver") ❌
  └─> supabase.from("ride_requests") ❌

MobilityService (não usado)
  └─> getDriverProfiles()
  └─> getUserRides()
```

### Depois (SSOT Correto)
```
AdminStatsService
  └─> mobilityService.getMobilityStats() ✅
       └─> getTotalDriversCount()
       └─> getTotalRidesCount()
       └─> getActiveRidesCount()

MobilityService (SSOT único)
  └─> Todas as queries de mobilidade
```

---

## 🏗️ ARQUITETURA SSOT CORRETA

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│                  (AdminDashboard.tsx)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API/Utils Layer                        │
│                   (adminApi.ts)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Layer (SSOT)                    │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  AdminStatsService   │  │   MobilityService    │    │
│  │  (Comunidade/Admin)  │  │   (Mobilidade)       │    │
│  └──────────┬───────────┘  └──────────┬───────────┘    │
│             │                          │                 │
│             │  Delega para ────────────┘                │
│             │  mobilityService.getMobilityStats()       │
└─────────────┴──────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│                   (Supabase)                             │
│  - profiles (profile_type = 'driver')                   │
│  - ride_requests                                         │
│  - driver_routes                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE CORREÇÃO

### Fase 1: Adicionar Métodos ao MobilityService
- [ ] Adicionar `getTotalDriversCount()`
- [ ] Adicionar `getTotalRidesCount()`
- [ ] Adicionar `getActiveRidesCount()`
- [ ] Adicionar `getCompletedRidesCount()`
- [ ] Adicionar `getMobilityStats()` (agregador)

### Fase 2: Atualizar AdminStatsService
- [ ] Importar `mobilityService`
- [ ] Remover queries diretas ao Supabase
- [ ] Usar `mobilityService.getMobilityStats()`
- [ ] Atualizar tipos TypeScript

### Fase 3: Atualizar Mock
- [ ] Adicionar métodos mock ao MobilityService
- [ ] Garantir que retornam dados consistentes

### Fase 4: Testes
- [ ] Testar contagem de motoristas
- [ ] Testar contagem de corridas
- [ ] Verificar performance
- [ ] Validar SSOT

---

## 🎯 BENEFÍCIOS DA CORREÇÃO

### Antes (Violação SSOT)
- ❌ Lógica de mobilidade duplicada
- ❌ Difícil manutenção
- ❌ Inconsistências possíveis
- ❌ Viola princípio DRY

### Depois (SSOT Correto)
- ✅ Única fonte de verdade
- ✅ Fácil manutenção
- ✅ Dados consistentes
- ✅ Reutilizável
- ✅ Testável

---

## 📝 EXEMPLO DE USO

### Antes (Incorreto)
```typescript
// AdminStatsService.ts
const { count } = await supabase
  .from("profiles")
  .eq("profile_type", "driver");

// Outro lugar no código
const { count } = await supabase
  .from("profiles")
  .eq("profile_type", "driver");

// ❌ Lógica duplicada!
```

### Depois (Correto)
```typescript
// AdminStatsService.ts
const count = await mobilityService.getTotalDriversCount();

// Outro lugar no código
const count = await mobilityService.getTotalDriversCount();

// ✅ SSOT único!
```

---

## ⚠️ IMPACTO DA VIOLAÇÃO

### Riscos Atuais
1. **Inconsistência**: Queries diferentes podem retornar resultados diferentes
2. **Manutenção**: Mudanças precisam ser feitas em múltiplos lugares
3. **Performance**: Queries não otimizadas podem ser duplicadas
4. **Testes**: Difícil mockar e testar

### Exemplo de Problema
```typescript
// AdminStatsService conta motoristas assim:
.eq("profile_type", "driver")

// Se MobilityService mudar para:
.eq("profile_type", "driver").eq("is_active", true)

// AdminStatsService fica desatualizado! ❌
```

---

## 🚀 PRIORIDADE

**Urgência**: 🟡 Média  
**Impacto**: 🔴 Alto  
**Esforço**: 🟢 Baixo (2-3 horas)

**Recomendação**: Corrigir antes de produção para evitar débito técnico.

---

## 📋 PRÓXIMOS PASSOS

1. **Imediato**: Adicionar métodos ao MobilityService
2. **Curto Prazo**: Atualizar AdminStatsService
3. **Médio Prazo**: Auditar outros serviços para violações SSOT
4. **Longo Prazo**: Criar testes automatizados de SSOT

---

## ✨ CONCLUSÃO

**Status Atual**: ⚠️ Violação SSOT detectada  
**Ação Necessária**: Adicionar métodos ao MobilityService  
**Benefício**: Arquitetura limpa e manutenível

A correção é **simples e de alto impacto** para a qualidade do código.


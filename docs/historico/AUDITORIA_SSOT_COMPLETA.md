# 🔍 Auditoria SSOT Completa - AdminStatsService

**Data**: 25/03/2026  
**Status**: ⚠️ MÚLTIPLAS VIOLAÇÕES DETECTADAS

---

## 📋 RESUMO EXECUTIVO

### Violações Encontradas
- ❌ **business_profiles** - Query direta ao Supabase
- ❌ **posts** - Sem SSOT (serviço não existe)
- ❌ **events** - Sem SSOT (serviço não existe)
- ❌ **classifieds** - Não usa ClassifiedService
- ❌ **professionals** - Não usa ProfessionalService
- ❌ **profiles** - Não usa ProfileService
- ❌ **comments** - Sem SSOT (serviço não existe)
- ✅ **businesses** - Usa BusinessService (CORRETO)
- ✅ **drivers/rides** - Usa MobilityService (CORRETO após correção)

---

## 🔴 VIOLAÇÕES CRÍTICAS

### 1. ❌ business_profiles (Empresas Premium)

**Arquivo**: `AdminStatsService.ts` - Método `getPremiumBusinessStats()`

**Código Atual (INCORRETO)**:
```typescript
async getPremiumBusinessStats(totalBusinesses: number): Promise<PremiumStats> {
  // ❌ Query direta ao Supabase
  const { count, error } = await supabase
    .from("business_profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true);
}
```

**SSOT Disponível**: `BusinessService`

**Correção**:
```typescript
// ✅ Adicionar ao BusinessService:
async getPremiumBusinessesCount(): Promise<number> {
  const { count, error } = await supabase
    .from("business_profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true);
  
  if (error) throw error;
  return count || 0;
}

// ✅ AdminStatsService usa:
async getPremiumBusinessStats(totalBusinesses: number): Promise<PremiumStats> {
  const premiumCount = await BusinessService.getPremiumBusinessesCount();
  return {
    total: premiumCount,
    percentage: totalBusinesses > 0 
      ? Math.round((premiumCount / totalBusinesses) * 100) 
      : 0,
  };
}
```

---

### 2. ❌ Contagem de Tabelas Genéricas

**Arquivo**: `AdminStatsService.ts` - Método `getTableStats()`

**Código Atual (INCORRETO)**:
```typescript
async getTableStats(tables: string[]): Promise<TableStats> {
  await Promise.all(
    tables.map(async (table) => {
      // ❌ Query direta para TODAS as tabelas
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      
      stats[table] = count || 0;
    })
  );
}
```

**Tabelas Afetadas**:
- `businesses` - ❌ Deveria usar BusinessService
- `professionals` - ❌ Deveria usar ProfessionalService
- `classifieds` - ❌ Deveria usar ClassifiedService
- `events` - ❌ Sem serviço (criar EventService)
- `posts` - ❌ Sem serviço (criar PostService)
- `profiles` - ❌ Deveria usar ProfileService
- `comments` - ❌ Sem serviço (criar CommentService)

---

### 3. ❌ Atividade por Dia (Mock Data)

**Arquivo**: `AdminStatsService.ts` - Método `getActivity()`

**Código Atual (INCORRETO)**:
```typescript
async getActivity(days = 30): Promise<ActivityData[]> {
  // ❌ Dados completamente mockados
  activity.push({
    date: dateStr,
    posts: Math.floor(Math.random() * 10), // ❌ Mock
    users: Math.floor(Math.random() * 5),  // ❌ Mock
    businesses: Math.floor(Math.random() * 3), // ❌ Mock
    eventos: Math.floor(Math.random() * 2), // ❌ Mock
    classificados: Math.floor(Math.random() * 4), // ❌ Mock
  });
}
```

**Problema**: Não usa dados reais, apenas números aleatórios.

---

### 4. ❌ Atividades Recentes Incompletas

**Arquivo**: `AdminStatsService.ts` - Método `getRecentActivity()`

**Código Atual (PARCIALMENTE CORRETO)**:
```typescript
async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  // ✅ Usa BusinessService (CORRETO)
  const businesses = await BusinessService.getRecentBusinessesLegacy(5);
  
  // ❌ TODO: Faltam posts, eventos, classificados, usuários
  // Aguardando implementação dos respectivos services
}
```

**Problema**: Apenas businesses, faltam outros tipos de atividade.

---

## 📊 MAPEAMENTO SSOT

### Serviços Disponíveis

| Tabela | SSOT Disponível | Status | Localização |
|--------|----------------|--------|-------------|
| `businesses` | ✅ BusinessService | Existe | `src/core/business/services/BusinessService.ts` |
| `business_profiles` | ✅ BusinessService | Existe | Mesmo arquivo |
| `professionals` | ✅ ProfessionalService | Existe | `src/core/professional/services/ProfessionalService.ts` |
| `classifieds` | ✅ ClassifiedService | Existe | `src/modules/classifieds/services/ClassifiedService.ts` |
| `profiles` | ✅ ProfileService | Existe | `src/core/profiles/services/ProfileService.ts` |
| `ride_requests` | ✅ MobilityService | Existe | `src/modules/mobility/services/MobilityService.ts` |
| `posts` | ❌ Não existe | Falta criar | - |
| `events` | ❌ Não existe | Falta criar | - |
| `comments` | ❌ Não existe | Falta criar | - |

---

## ✅ SOLUÇÃO COMPLETA

### Fase 1: Adicionar Métodos aos Serviços Existentes

#### 1.1 BusinessService

**Arquivo**: `src/core/business/services/BusinessService.ts`

```typescript
/**
 * Obtém contagem total de empresas
 * ✅ SSOT para contagem de empresas
 */
static async getTotalBusinessesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("Error getting businesses count", error as Error);
    return 0;
  }
}

/**
 * Obtém contagem de empresas premium
 * ✅ SSOT para empresas premium
 */
static async getPremiumBusinessesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("business_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_premium", true);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("Error getting premium businesses count", error as Error);
    return 0;
  }
}

/**
 * Obtém empresas criadas em um período
 * ✅ SSOT para atividade de empresas
 */
static async getBusinessesCreatedInPeriod(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("Error getting businesses in period", error as Error);
    return 0;
  }
}
```

#### 1.2 ProfessionalService

**Arquivo**: `src/core/professional/services/ProfessionalService.ts`

```typescript
/**
 * Obtém contagem total de profissionais
 * ✅ SSOT para contagem de profissionais
 */
static async getTotalProfessionalsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("professionals")
      .select("*", { count: "exact", head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("Error getting professionals count", error as Error);
    return 0;
  }
}
```

#### 1.3 ClassifiedService

**Arquivo**: `src/modules/classifieds/services/ClassifiedService.ts`

```typescript
/**
 * Obtém contagem total de classificados
 * ✅ SSOT para contagem de classificados
 */
async getTotalClassifiedsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("classifieds")
      .select("*", { count: "exact", head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("Error getting classifieds count", error as Error);
    return 0;
  }
}

/**
 * Obtém classificados recentes
 * ✅ SSOT para atividade de classificados
 */
async getRecentClassifieds(limit = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("Error getting recent classifieds", error as Error);
    return [];
  }
}
```

#### 1.4 ProfileService

**Arquivo**: `src/core/profiles/services/ProfileService.ts`

```typescript
/**
 * Obtém contagem total de usuários
 * ✅ SSOT para contagem de usuários
 */
async getTotalProfilesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("Error getting profiles count", error as Error);
    return 0;
  }
}

/**
 * Obtém usuários recentes
 * ✅ SSOT para atividade de usuários
 */
async getRecentProfiles(limit = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("Error getting recent profiles", error as Error);
    return [];
  }
}
```

---

### Fase 2: Criar Serviços Faltantes

#### 2.1 PostService (NOVO)

**Arquivo**: `src/modules/community/services/PostService.ts`

```typescript
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

class PostServiceClass {
  private readonly TABLE = "posts";

  /**
   * Obtém contagem total de posts
   * ✅ SSOT para contagem de posts
   */
  async getTotalPostsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.TABLE)
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error getting posts count", error as Error);
      return 0;
    }
  }

  /**
   * Obtém posts recentes
   * ✅ SSOT para atividade de posts
   */
  async getRecentPosts(limit = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error getting recent posts", error as Error);
      return [];
    }
  }

  /**
   * Obtém posts criados em um período
   * ✅ SSOT para atividade de posts por período
   */
  async getPostsCreatedInPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.TABLE)
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error getting posts in period", error as Error);
      return 0;
    }
  }
}

export const postService = new PostServiceClass();
```

#### 2.2 EventService (NOVO)

**Arquivo**: `src/modules/community/services/EventService.ts`

```typescript
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

class EventServiceClass {
  private readonly TABLE = "events";

  /**
   * Obtém contagem total de eventos
   * ✅ SSOT para contagem de eventos
   */
  async getTotalEventsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.TABLE)
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error getting events count", error as Error);
      return 0;
    }
  }

  /**
   * Obtém eventos recentes
   * ✅ SSOT para atividade de eventos
   */
  async getRecentEvents(limit = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error getting recent events", error as Error);
      return [];
    }
  }
}

export const eventService = new EventServiceClass();
```

#### 2.3 CommentService (NOVO)

**Arquivo**: `src/modules/community/services/CommentService.ts`

```typescript
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

class CommentServiceClass {
  private readonly TABLE = "comments";

  /**
   * Obtém contagem total de comentários
   * ✅ SSOT para contagem de comentários
   */
  async getTotalCommentsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.TABLE)
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error getting comments count", error as Error);
      return 0;
    }
  }

  /**
   * Obtém comentários recentes
   * ✅ SSOT para atividade de comentários
   */
  async getRecentComments(limit = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error getting recent comments", error as Error);
      return [];
    }
  }
}

export const commentService = new CommentServiceClass();
```

---

### Fase 3: Atualizar AdminStatsService

**Arquivo**: `src/core/admin/services/AdminStatsService.ts`

```typescript
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { BusinessService } from "@/core/business/services/BusinessService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { ProfileService } from "@/core/profiles/services/ProfileService";
import { mobilityService } from "@/modules/mobility/services/MobilityService";
import { classifiedService } from "@/modules/classifieds/services/ClassifiedService";
import { postService } from "@/modules/community/services/PostService";
import { eventService } from "@/modules/community/services/EventService";
import { commentService } from "@/modules/community/services/CommentService";

class AdminStatsService {
  /**
   * ✅ SSOT CORRETO - Delega para BusinessService
   */
  async getPremiumBusinessStats(totalBusinesses: number): Promise<PremiumStats> {
    try {
      const premiumCount = await BusinessService.getPremiumBusinessesCount();
      
      return {
        total: premiumCount,
        percentage: totalBusinesses > 0 
          ? Math.round((premiumCount / totalBusinesses) * 100) 
          : 0,
      };
    } catch (error) {
      logger.error("Error fetching premium business stats", error as Error);
      throw error;
    }
  }

  /**
   * ✅ SSOT CORRETO - Delega para serviços específicos
   */
  async getTableStats(tables: string[]): Promise<TableStats> {
    try {
      const stats: TableStats = {};

      // ✅ SSOT: Usar serviços específicos para cada tipo de dado
      const [
        businessesCount,
        professionalsCount,
        classifiedsCount,
        eventsCount,
        postsCount,
        profilesCount,
        commentsCount,
        mobilityStats,
      ] = await Promise.all([
        BusinessService.getTotalBusinessesCount(),
        ProfessionalService.getTotalProfessionalsCount(),
        classifiedService.getTotalClassifiedsCount(),
        eventService.getTotalEventsCount(),
        postService.getTotalPostsCount(),
        ProfileService.getTotalProfilesCount(),
        commentService.getTotalCommentsCount(),
        mobilityService.getMobilityStats(),
      ]);

      stats.businesses = businessesCount;
      stats.professionals = professionalsCount;
      stats.classifieds = classifiedsCount;
      stats.events = eventsCount;
      stats.posts = postsCount;
      stats.profiles = profilesCount;
      stats.comments = commentsCount;
      stats.drivers = mobilityStats.total_drivers;
      stats.ride_requests = mobilityStats.total_rides;

      return stats;
    } catch (error) {
      logger.error("Failed to get table stats", error as Error);
      throw error;
    }
  }

  /**
   * ✅ SSOT CORRETO - Usa serviços para dados reais
   */
  async getActivity(days = 30): Promise<ActivityData[]> {
    try {
      const activity: ActivityData[] = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const [postsCount, usersCount, businessesCount, eventsCount, classifiedsCount] = 
          await Promise.all([
            postService.getPostsCreatedInPeriod(dayStart, dayEnd),
            ProfileService.getProfilesCreatedInPeriod(dayStart, dayEnd),
            BusinessService.getBusinessesCreatedInPeriod(dayStart, dayEnd),
            eventService.getEventsCreatedInPeriod(dayStart, dayEnd),
            classifiedService.getClassifiedsCreatedInPeriod(dayStart, dayEnd),
          ]);

        activity.push({
          date: dayStart.toISOString().split("T")[0],
          posts: postsCount,
          users: usersCount,
          businesses: businessesCount,
          eventos: eventsCount,
          classificados: classifiedsCount,
        });
      }

      return activity;
    } catch (error) {
      logger.error("Failed to get activity data", error as Error);
      return [];
    }
  }

  /**
   * ✅ SSOT CORRETO - Usa serviços para atividades recentes
   */
  async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
    try {
      const recent: RecentActivity[] = [];

      // ✅ SSOT: Buscar de cada serviço
      const [businesses, posts, events, classifieds, profiles] = await Promise.all([
        BusinessService.getRecentBusinessesLegacy(5),
        postService.getRecentPosts(5),
        eventService.getRecentEvents(5),
        classifiedService.getRecentClassifieds(5),
        ProfileService.getRecentProfiles(5),
      ]);

      // Adicionar businesses
      businesses.forEach((b) => {
        recent.push({
          type: "business",
          label: `Nova empresa: ${b.name || "Sem nome"}`,
          date: b.created_at,
        });
      });

      // Adicionar posts
      posts.forEach((p) => {
        recent.push({
          type: "post",
          label: `Novo post: ${p.content?.substring(0, 50) || "Sem conteúdo"}...`,
          date: p.created_at,
        });
      });

      // Adicionar eventos
      events.forEach((e) => {
        recent.push({
          type: "event",
          label: `Novo evento: ${e.title || "Sem título"}`,
          date: e.created_at,
        });
      });

      // Adicionar classificados
      classifieds.forEach((c) => {
        recent.push({
          type: "classified",
          label: `Novo classificado: ${c.title || "Sem título"}`,
          date: c.created_at,
        });
      });

      // Adicionar usuários
      profiles.forEach((p) => {
        recent.push({
          type: "user",
          label: `Novo usuário: ${p.name || p.username || "Sem nome"}`,
          date: p.created_at,
        });
      });

      return recent
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error("Failed to get recent activity", error as Error);
      return [];
    }
  }
}

export const adminStatsService = new AdminStatsService();
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Serviços Existentes
- [ ] BusinessService.getTotalBusinessesCount()
- [ ] BusinessService.getPremiumBusinessesCount()
- [ ] BusinessService.getBusinessesCreatedInPeriod()
- [ ] ProfessionalService.getTotalProfessionalsCount()
- [ ] ClassifiedService.getTotalClassifiedsCount()
- [ ] ClassifiedService.getRecentClassifieds()
- [ ] ProfileService.getTotalProfilesCount()
- [ ] ProfileService.getRecentProfiles()

### Fase 2: Novos Serviços
- [ ] Criar PostService
- [ ] Criar EventService
- [ ] Criar CommentService

### Fase 3: AdminStatsService
- [ ] Atualizar getPremiumBusinessStats()
- [ ] Atualizar getTableStats()
- [ ] Atualizar getActivity()
- [ ] Atualizar getRecentActivity()

### Fase 4: Testes
- [ ] Testar contagens
- [ ] Testar atividades
- [ ] Testar performance
- [ ] Validar SSOT

---

## 🎯 PRIORIDADE

**Urgência**: 🔴 Alta  
**Impacto**: 🔴 Crítico  
**Esforço**: 🟡 Médio (1-2 dias)

**Recomendação**: Implementar antes de produção para evitar débito técnico massivo.

---

## 📊 IMPACTO

### Antes (Violações SSOT)
- ❌ 8 violações de SSOT
- ❌ Queries diretas em múltiplos lugares
- ❌ Dados mockados (não reais)
- ❌ Difícil manutenção
- ❌ Inconsistências possíveis

### Depois (SSOT Correto)
- ✅ 100% SSOT compliance
- ✅ Todas as queries via serviços
- ✅ Dados reais do banco
- ✅ Fácil manutenção
- ✅ Dados consistentes

---

## ✨ CONCLUSÃO

O `AdminStatsService` tem **violações críticas de SSOT** que precisam ser corrigidas:

1. **8 tipos de dados** não usam SSOT
2. **3 serviços** precisam ser criados
3. **Dados mockados** ao invés de reais
4. **Queries diretas** ao Supabase

**Ação Necessária**: Implementação completa da arquitetura SSOT.


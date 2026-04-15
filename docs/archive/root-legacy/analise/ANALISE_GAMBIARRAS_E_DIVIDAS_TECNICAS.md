# Análise de Gambiarras e Dívidas Técnicas - Projeto Achegue-se

**Data**: 31/03/2026  
**Analista**: Kiro AI Assistant  
**Status**: ✅ Análise Completa

---

## 📊 Resumo Executivo

### Situação Geral
✅ **EXCELENTE**: O projeto está muito bem estruturado, com poucas gambiarras reais.

**Métricas**:
- Uso de `as any`: 50+ ocorrências (maioria justificada)
- Código deprecated: 15 arquivos (documentados)
- TODOs pendentes: 20+ (maioria não-críticos)
- Imports profundos: 0 (✅ arquitetura modular respeitada)

---

## 🔴 GAMBIARRAS REAIS ENCONTRADAS

### 1. SessionService com @ts-nocheck
**Arquivo**: `src/core/session/services/SessionService.ts`  
**Severidade**: MÉDIA  
**Problema**: Service crítico com verificação de tipos desabilitada

```typescript
// @ts-nocheck
export class SessionService {
  // ... código sem verificação de tipos
}
```

**Impacto**:
- Service central do sistema sem type safety
- Pode esconder erros de tipo
- Dificulta manutenção

**Solução**:
```typescript
// Remover @ts-nocheck
// Adicionar tipos explícitos para:
// - mapProfileFromDb (any → DbProfile)
// - Retornos de RPC calls
// - Parâmetros de callbacks
```

**Prioridade**: ALTA

---

### 2. Untyped Supabase Client
**Arquivo**: `src/integrations/supabase/untyped-client.ts`  
**Severidade**: ALTA  
**Problema**: Cliente Supabase sem tipos exportado como `any`

```typescript
import { supabase } from "./client";

export const db = supabase as any;
```

**Impacto**:
- Perde todos os benefícios de type safety do Supabase
- Qualquer código usando `db` não tem autocomplete
- Erros de tipo não são detectados

**Solução**:
```typescript
// REMOVER este arquivo completamente
// Usar sempre o cliente tipado:
import { supabase } from "@/integrations/supabase/client";
```

**Prioridade**: CRÍTICA

---

### 3. Type Casting Excessivo em Mobility Services
**Arquivos**: 
- `src/modules/mobility/services/ChatService.ts`
- `src/modules/mobility/services/DriverService.ts`
- `src/modules/mobility/services/RideService.ts`

**Severidade**: MÉDIA  
**Problema**: Múltiplos `as any` para contornar incompatibilidades de tipos

```typescript
// ChatService.ts
return previews.map((conv) => ({
  ...conv,
  passenger_id: (conv as any).buyer_id,
  driver_profile_id: (conv as any).seller_id,
  unread_count: conv.unread_count || 0,
  is_active: (conv as any).status !== "blocked",
})) as unknown as Conversation[];
```

**Causa Raiz**: Tipos do banco não batem com tipos do frontend

**Solução**:
1. Criar tipos intermediários para dados do banco
2. Criar mappers explícitos
3. Remover `as any` e `as unknown`

**Prioridade**: MÉDIA

---

### 4. Promotion Repository com Queries Não-Tipadas
**Arquivo**: `src/modules/promotions/repositories/AdRepositorySupabase.ts`  
**Severidade**: MÉDIA  
**Problema**: Todas as queries usam `supabase as any`

```typescript
const { data: targetRows, error: targetError } = await (supabase as any)
  .from(TARGETS_TABLE)
  .select('campaign_id, location_id, target_scope')
```

**Impacto**:
- Sem autocomplete
- Sem validação de tipos
- Erros só aparecem em runtime

**Solução**:
```typescript
// Usar cliente tipado
const { data: targetRows, error: targetError } = await supabase
  .from('ad_targets')
  .select<'*', AdTarget>('campaign_id, location_id, target_scope')
```

**Prioridade**: MÉDIA

---

## 🟡 DÍVIDAS TÉCNICAS (Não são gambiarras, mas precisam atenção)

### 1. Código Deprecated (15 arquivos)

**Arquivos Principais**:
- `src/shared/utils/communityUtils.ts` - ✅ Documentado
- `src/modules/profile/hooks/useProfileData.ts` - ✅ Lança erro se usado
- `src/modules/business/hooks/useBusiness.ts` - ✅ Migração documentada
- `src/core/profiles/hooks/useProfile.ts` - ✅ Alternativa indicada

**Status**: ✅ BEM GERENCIADO
- Todos documentados com `@deprecated`
- Alternativas indicadas
- Alguns lançam erro se usados

**Ação**: Remover em próxima major version

---

### 2. TODOs Pendentes (20+ ocorrências)

**Categorias**:

#### A. Integrações Externas (Não-Crítico)
```typescript
// TODO: Integrar com Sentry
// TODO: Integrar com LogRocket
// TODO: Send to your analytics service
```
**Status**: Planejado, não urgente

#### B. Features Futuras (Não-Crítico)
```typescript
// TODO: Implementar quando tabela jobs estiver criada
// TODO: Ativar quando tabela jobs existir
```
**Status**: Aguardando schema do banco

#### C. Melhorias de UX (Baixa Prioridade)
```typescript
// TODO: Implementar verificação de curtida
// TODO: Implementar verificação de salvamento
```
**Status**: Features secundárias

**Conclusão**: TODOs são bem documentados e não-críticos

---

### 3. Campos Deprecated em Tipos

**Arquivos**:
- `src/modules/profile/types/profile.ts`
- `src/modules/classifieds/types/classified.ts`
- `src/core/tourist-points/types/index.ts`

**Padrão Encontrado**:
```typescript
export interface Profile {
  /** SSOT territorial — FK para locations.id */
  location_id?: string;
  /** @deprecated usar location_id — mantido para compatibilidade */
  neighborhood?: string;
  /** @deprecated usar location_id — mantido para compatibilidade */
  city?: string;
}
```

**Status**: ✅ BEM GERENCIADO
- Migração territorial em andamento
- Campos legados mantidos para compatibilidade
- Documentação clara

**Ação**: Remover após migração completa

---

## 🟢 PONTOS POSITIVOS (Não são gambiarras)

### 1. Uso Justificado de `as any`

**Casos Legítimos**:

#### A. Supabase Query Builder (Limitação da Lib)
```typescript
// src/core/location/utils/applyTerritoryFilter.ts
export function applyTerritoryFilter<T>(query: T, filter: TerritoryFilter): T {
  if (filter.scope === 'location') {
    // Type assertion necessária pois Supabase query builder não é tipado genericamente
    return (query as any).eq('location_id', filter.location_id);
  }
  // ...
}
```
**Justificativa**: Limitação do TypeScript com query builders genéricos  
**Status**: ✅ ACEITÁVEL (comentado)

#### B. Type Guards
```typescript
// src/shared/utils/ssot-helpers.ts
isValidUserRole: (role: string): role is UserRole => {
  return Object.values(USER_ROLE).includes(role as any);
}
```
**Justificativa**: TypeScript não infere narrowing em `includes()`  
**Status**: ✅ ACEITÁVEL (padrão comum)

#### C. Performance Observers
```typescript
// src/shared/utils/monitoring/performance.ts
const lastEntry = entries[entries.length - 1] as any;
```
**Justificativa**: API do browser não tem tipos completos  
**Status**: ✅ ACEITÁVEL (limitação do DOM)

---

### 2. Arquitetura Modular Respeitada

**Verificação**: ✅ ZERO imports profundos (`../../../../`)

**Padrão Encontrado**:
```typescript
// ✅ BOM: Usa alias paths
import { BusinessService } from "@/core/business/services";
import { applyTerritoryFilter } from "@/core/location";

// ❌ NÃO ENCONTRADO: Imports relativos profundos
// import { BusinessService } from "../../../../core/business/services";
```

**Conclusão**: Arquitetura modular está sendo respeitada

---

### 3. Código Deprecated Bem Gerenciado

**Padrão Encontrado**:
```typescript
/**
 * @deprecated GATE 3 FASE 3C - HOOK DEPRECATED
 * Este hook não está sendo usado no projeto.
 */
export function useProfileData() {
  throw new Error("useProfileData is deprecated and should not be used");
}
```

**Características**:
- ✅ Documentado com `@deprecated`
- ✅ Indica alternativa
- ✅ Lança erro se usado
- ✅ Referência ao ticket/fase

**Conclusão**: Processo de deprecação profissional

---

## 📋 PLANO DE AÇÃO

### Prioridade CRÍTICA (Fazer Agora)

1. **Remover `untyped-client.ts`**
   ```bash
   # Deletar arquivo
   rm src/integrations/supabase/untyped-client.ts
   
   # Buscar usos
   grep -r "from.*untyped-client" src/
   
   # Substituir por cliente tipado
   # import { db } from "@/integrations/supabase/untyped-client"
   # → import { supabase } from "@/integrations/supabase/client"
   ```

2. **Remover @ts-nocheck do SessionService**
   - Adicionar tipos explícitos
   - Corrigir erros de tipo
   - Testar autenticação

### Prioridade ALTA (Esta Semana)

1. **Refatorar Mobility Services**
   - Criar tipos intermediários para dados do banco
   - Criar mappers explícitos
   - Remover `as any` e `as unknown`

2. **Tipar AdRepositorySupabase**
   - Usar cliente Supabase tipado
   - Adicionar tipos para queries
   - Remover `supabase as any`

### Prioridade MÉDIA (Próximas 2 Semanas)

1. **Implementar TODOs de Integração**
   - Sentry para error tracking
   - LogRocket para session replay
   - Analytics para métricas

2. **Remover Código Deprecated**
   - Verificar se ainda está sendo usado
   - Remover arquivos deprecated
   - Atualizar imports

### Prioridade BAIXA (Backlog)

1. **Completar Migração Territorial**
   - Remover campos `neighborhood`, `city` deprecated
   - Usar apenas `location_id`
   - Atualizar documentação

2. **Implementar Features com TODO**
   - Sistema de jobs (quando schema estiver pronto)
   - Verificação de curtidas/salvamentos
   - Melhorias de UX

---

## 🎯 CONCLUSÕES

### Gambiarras Reais: 4 (Todas Identificadas e Documentadas)

1. ❌ SessionService com @ts-nocheck
2. ❌ Untyped Supabase Client
3. ❌ Type Casting em Mobility Services
4. ❌ Promotion Repository não-tipado

### Dívidas Técnicas: 3 (Todas Bem Gerenciadas)

1. ✅ Código Deprecated (documentado)
2. ✅ TODOs Pendentes (não-críticos)
3. ✅ Campos Deprecated (migração em andamento)

### Pontos Positivos: 3

1. ✅ Uso justificado de `as any` (comentado)
2. ✅ Arquitetura modular respeitada (0 imports profundos)
3. ✅ Processo de deprecação profissional

---

## 🏆 AVALIAÇÃO FINAL

**Nota Geral**: 8.5/10

**Justificativa**:
- ✅ Arquitetura sólida e bem organizada
- ✅ SSOT implementado corretamente
- ✅ Poucas gambiarras reais
- ✅ Dívidas técnicas bem documentadas
- ⚠️ Alguns pontos críticos precisam atenção (untyped-client, SessionService)
- ⚠️ Type safety pode melhorar em alguns módulos

**Recomendação**: 
Projeto está em excelente estado. As "gambiarras" encontradas são pontuais e facilmente corrigíveis. A maioria dos problemas são dívidas técnicas bem gerenciadas, não gambiarras propriamente ditas.

**Próxima Ação**: 
Focar nas 2 prioridades críticas (untyped-client e SessionService) para elevar a nota para 9.5/10.

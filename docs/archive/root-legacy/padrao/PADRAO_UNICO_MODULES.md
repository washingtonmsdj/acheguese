# 📐 Padrão Único para Módulos - DEFINITIVO

**Data**: 2026-04-01  
**Status**: 🎯 PADRÃO OBRIGATÓRIO  
**Versão**: 1.0.0

---

## ⚠️ PROBLEMA IDENTIFICADO

Atualmente temos 3 padrões diferentes sendo usados:

### ❌ Padrão 1 - Gastronomy (Implementação Direta)
```typescript
// src/modules/gastronomy/services/GastronomyService.ts
export class GastronomyService {
  static async createGastronomyProfile(...) { /* implementação */ }
}
```
- ✅ Simples
- ❌ Não segue padrão de consolidação
- ❌ Dificulta migração futura

### ❌ Padrão 2 - Classifieds (Core + Re-export)
```typescript
// src/modules/classifieds/services/ClassifiedServiceCore.ts
export class ClassifiedService { /* implementação */ }

// src/modules/classifieds/services/ClassifiedService.ts
export { classifiedService } from "./ClassifiedServiceCore";
```
- ✅ Permite compatibilidade
- ✅ Separação clara
- ⚠️ Nomenclatura "Core" pode confundir

### ❌ Padrão 3 - Mobility (Core + Re-export)
```typescript
// src/modules/mobility/services/MobilityServiceCore.ts
export class MobilityService { /* implementação */ }

// src/modules/mobility/services/MobilityService.ts
export { mobilityService } from "./MobilityServiceCore";
```
- ✅ Permite compatibilidade
- ✅ Separação clara
- ⚠️ Nomenclatura "Core" pode confundir

---

## ✅ PADRÃO ÚNICO OBRIGATÓRIO

### Estrutura de Arquivos
```
src/modules/{module}/services/
├── {Service}.impl.ts          # Implementação real (SSOT)
├── {Service}.ts               # Re-export público
└── index.ts                   # Barrel export
```

### Nomenclatura
- **Implementação**: `{Service}.impl.ts` (ex: `ClassifiedService.impl.ts`)
- **Re-export**: `{Service}.ts` (ex: `ClassifiedService.ts`)
- **Classe**: `{Service}` (ex: `ClassifiedService`)
- **Instância**: `{service}` (ex: `classifiedService`)

### Exemplo Completo

#### 1. Implementação (`ClassifiedService.impl.ts`)
```typescript
/**
 * ClassifiedService - SSOT para classificados
 * 
 * IMPLEMENTAÇÃO REAL - Não importar diretamente
 * Use: import { classifiedService } from './ClassifiedService'
 */

import { supabase } from '@/integrations/supabase';
import type { ClassifiedData, CreateClassifiedInput } from '../types';

export class ClassifiedService {
  static async create(input: CreateClassifiedInput): Promise<ClassifiedData> {
    const { data, error } = await supabase
      .from('classifieds')
      .insert(input)
      .select()
      .single();
    
    if (error) throw error;
    return data as ClassifiedData;
  }

  static async getById(id: string): Promise<ClassifiedData | null> {
    const { data, error } = await supabase
      .from('classifieds')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as ClassifiedData;
  }
}

// Singleton instance
export const classifiedService = ClassifiedService;
```

#### 2. Re-export Público (`ClassifiedService.ts`)
```typescript
/**
 * ClassifiedService - Re-export público
 * 
 * Use este arquivo para importar o service
 * Exemplo: import { classifiedService } from '@/modules/classifieds/services/ClassifiedService'
 */

export { ClassifiedService, classifiedService } from './ClassifiedService.impl';
export type { ClassifiedData, CreateClassifiedInput, UpdateClassifiedInput } from '../types';
```

#### 3. Barrel Export (`index.ts`)
```typescript
/**
 * Barrel export para services do módulo classifieds
 */

export * from './ClassifiedService';
export * from './ClassifiedUrlService';
export * from './ClassifiedReportService';
```

---

## 🎯 REGRAS OBRIGATÓRIAS

### 1. Nomenclatura
- ✅ Usar `.impl.ts` para implementação
- ✅ Usar `.ts` para re-export
- ❌ NUNCA usar `Core` no nome do arquivo
- ❌ NUNCA usar `Service` duplicado (ex: `ClassifiedServiceService`)

### 2. Imports
- ✅ Componentes/Hooks importam de `{Service}.ts` (re-export)
- ✅ Testes podem importar de `.impl.ts` se necessário
- ❌ NUNCA importar `.impl.ts` em código de produção

### 3. Exports
- ✅ Sempre exportar classe E instância
- ✅ Sempre exportar types relacionados
- ✅ Sempre ter barrel export em `index.ts`

### 4. Documentação
- ✅ `.impl.ts` deve ter comentário "IMPLEMENTAÇÃO REAL"
- ✅ `.ts` deve ter comentário "Re-export público"
- ✅ Indicar como importar corretamente

---

## 🔄 MIGRAÇÃO DE PADRÕES EXISTENTES

### Gastronomy (Padrão 1 → Padrão Único)
```bash
# 1. Renomear implementação
mv src/modules/gastronomy/services/GastronomyService.ts \
   src/modules/gastronomy/services/GastronomyService.impl.ts

# 2. Criar re-export
cat > src/modules/gastronomy/services/GastronomyService.ts << 'EOF'
export { GastronomyService } from './GastronomyService.impl';
export type * from '../types';
EOF

# 3. Atualizar imports (automático via IDE)
```

### Classifieds (Padrão 2 → Padrão Único)
```bash
# 1. Renomear Core → impl
mv src/modules/classifieds/services/ClassifiedServiceCore.ts \
   src/modules/classifieds/services/ClassifiedService.impl.ts

# 2. Atualizar re-export
# Mudar: from "./ClassifiedServiceCore"
# Para:  from "./ClassifiedService.impl"
```

### Mobility (Padrão 3 → Padrão Único)
```bash
# 1. Renomear Core → impl
mv src/modules/mobility/services/MobilityServiceCore.ts \
   src/modules/mobility/services/MobilityService.impl.ts

mv src/modules/mobility/services/DriverServiceCore.ts \
   src/modules/mobility/services/DriverService.impl.ts

mv src/modules/mobility/services/RideServiceCore.ts \
   src/modules/mobility/services/RideService.impl.ts

# 2. Atualizar re-exports
# Mudar: from "./MobilityServiceCore"
# Para:  from "./MobilityService.impl"
```

---

## 📊 CHECKLIST DE COMPLIANCE

### Para Cada Módulo
- [ ] Implementação em `{Service}.impl.ts`
- [ ] Re-export em `{Service}.ts`
- [ ] Barrel export em `index.ts`
- [ ] Documentação correta em cada arquivo
- [ ] Imports usando re-export (não `.impl.ts`)
- [ ] Types exportados junto com service
- [ ] Singleton instance exportado

### Para o Projeto
- [ ] Todos os módulos seguem o mesmo padrão
- [ ] Zero arquivos com sufixo `Core`
- [ ] Zero imports diretos de `.impl.ts` em produção
- [ ] Script de compliance atualizado
- [ ] Documentação atualizada

---

## 🎓 JUSTIFICATIVA

### Por que `.impl.ts` ao invés de `Core`?
1. ✅ Mais claro: "impl" = implementação
2. ✅ Evita confusão com `src/core/`
3. ✅ Padrão comum em outras linguagens (Java, C#)
4. ✅ Facilita busca e filtros

### Por que Re-export?
1. ✅ Compatibilidade: Imports existentes continuam funcionando
2. ✅ Flexibilidade: Podemos mudar implementação sem quebrar código
3. ✅ Documentação: Ponto único de entrada bem documentado
4. ✅ Testes: Podem importar `.impl.ts` diretamente se necessário

### Por que Barrel Export?
1. ✅ Imports limpos: `from '@/modules/classifieds/services'`
2. ✅ Descoberta: Fácil ver todos os services disponíveis
3. ✅ Manutenção: Adicionar novo service = adicionar 1 linha

---

## 🚀 PLANO DE AÇÃO

### Fase 1: Atualizar Módulos Consolidados (2-3h)
1. ✅ Classifieds: Renomear `Core` → `.impl`
2. ✅ Mobility: Renomear `Core` → `.impl`
3. ✅ Atualizar re-exports
4. ✅ Validar TypeScript

### Fase 2: Atualizar Gastronomy (1-2h)
1. ✅ Criar `.impl.ts`
2. ✅ Criar re-export
3. ✅ Atualizar imports
4. ✅ Validar TypeScript

### Fase 3: Atualizar Script de Compliance (30min)
1. ✅ Reconhecer `.impl.ts` como SSOT
2. ✅ Alertar sobre imports diretos de `.impl.ts`
3. ✅ Validar nomenclatura

### Fase 4: Documentação (30min)
1. ✅ Atualizar `SSOT_REGISTRY.md`
2. ✅ Atualizar `README_SSOT.md`
3. ✅ Criar exemplos

**Total estimado**: 4-6 horas

---

## ✅ BENEFÍCIOS

### Curto Prazo
- ✅ Consistência: Todos seguem o mesmo padrão
- ✅ Clareza: Fácil identificar implementação vs re-export
- ✅ Manutenção: Mudanças localizadas

### Médio Prazo
- ✅ Onboarding: Novos devs entendem rapidamente
- ✅ Refatoração: Fácil mover/renomear services
- ✅ Testes: Fácil mockar implementações

### Longo Prazo
- ✅ Escalabilidade: Padrão suporta crescimento
- ✅ Qualidade: Menos bugs por confusão
- ✅ Velocidade: Menos tempo procurando código

---

## 📚 EXEMPLOS COMPLETOS

### Exemplo 1: Service Simples
```typescript
// MobilityService.impl.ts
export class MobilityService {
  static async getDrivers() { /* ... */ }
}
export const mobilityService = MobilityService;

// MobilityService.ts
export { MobilityService, mobilityService } from './MobilityService.impl';
export type { Driver, DriverData } from '../types';
```

### Exemplo 2: Service com Query Service (CQRS)
```typescript
// GastronomyService.impl.ts (Write)
export class GastronomyService {
  static async create(...) { /* ... */ }
  static async update(...) { /* ... */ }
}

// GastronomyQueryService.impl.ts (Read)
export class GastronomyQueryService {
  static async getById(...) { /* ... */ }
  static async list(...) { /* ... */ }
}

// GastronomyService.ts
export { GastronomyService } from './GastronomyService.impl';

// GastronomyQueryService.ts
export { GastronomyQueryService } from './GastronomyQueryService.impl';
```

### Exemplo 3: Service com Adapter
```typescript
// RideService.impl.ts
export class RideService {
  static async create(...) { /* ... */ }
}

// RideCanonicalAdapter.impl.ts
export class RideCanonicalAdapter {
  static async migrate(...) { /* ... */ }
}

// RideService.ts
export { RideService } from './RideService.impl';

// RideCanonicalAdapter.ts
export { RideCanonicalAdapter } from './RideCanonicalAdapter.impl';
```

---

## 🎯 CONCLUSÃO

**PADRÃO ÚNICO OBRIGATÓRIO**:
- ✅ Implementação: `{Service}.impl.ts`
- ✅ Re-export: `{Service}.ts`
- ✅ Barrel: `index.ts`

**NUNCA MAIS**:
- ❌ `{Service}Core.ts`
- ❌ Implementação direta sem re-export
- ❌ Padrões diferentes por módulo

**SEMPRE**:
- ✅ Seguir este documento
- ✅ Validar com TypeScript
- ✅ Documentar mudanças

---

**Criado**: 2026-04-01T19:00:00Z  
**Versão**: 1.0.0  
**Status**: 🎯 PADRÃO OBRIGATÓRIO

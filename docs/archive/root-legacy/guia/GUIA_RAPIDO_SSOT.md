# 🎯 GUIA RÁPIDO - PADRÃO SSOT

## 📖 O QUE É SSOT?

SSOT (Single Source of Truth) é o padrão arquitetural que garante que:
- Cada dado tem UMA ÚNICA fonte de verdade
- O acesso ao banco de dados é centralizado
- A lógica de negócio não está duplicada

---

## ✅ REGRA DE OURO

**Database → Service → Hook → Component**

```
┌─────────────┐
│  DATABASE   │ ← Única fonte de verdade
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   SERVICE   │ ← Único ponto de acesso ao banco
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    HOOK     │ ← Gerencia estado e cache
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  COMPONENT  │ ← Apenas UI e interação
└─────────────┘
```

---

## ✅ O QUE PODE ACESSAR SUPABASE

### PERMITIDO ✅

1. **Services** (`src/*/services/*.ts`)
   ```typescript
   // ✅ CORRETO
   import { supabase } from '@/integrations/supabase';
   
   export class MobilityService {
     static async getDrivers() {
       return await supabase.from('driver_data').select();
     }
   }
   ```

2. **Repositories** (`src/*/repositories/*.ts`)
   ```typescript
   // ✅ CORRETO
   import { supabase } from '@/integrations/supabase';
   
   export class AdRepository {
     async findAll() {
       return await supabase.from('ads').select();
     }
   }
   ```

3. **Migrations** (`src/*/migrations/*.ts`)
   ```typescript
   // ✅ CORRETO
   import { supabase } from '@/integrations/supabase';
   
   export async function migrateData() {
     await supabase.from('old_table').update(...);
   }
   ```

---

## ❌ O QUE NÃO PODE ACESSAR SUPABASE

### PROIBIDO ❌

1. **Components** (`src/*/components/*.tsx`)
   ```typescript
   // ❌ ERRADO
   import { supabase } from '@/integrations/supabase';
   
   function MyComponent() {
     const { data } = await supabase.from('profiles').select();
     // ...
   }
   ```

2. **Pages** (`src/*/pages/*.tsx`)
   ```typescript
   // ❌ ERRADO
   import { supabase } from '@/integrations/supabase';
   
   function MyPage() {
     const { data } = await supabase.from('mobility').select();
     // ...
   }
   ```

3. **Hooks** (`src/*/hooks/*.ts`)
   ```typescript
   // ❌ ERRADO
   import { supabase } from '@/integrations/supabase';
   
   export function useMyData() {
     const { data } = await supabase.from('data').select();
     // ...
   }
   ```

---

## 🏗️ COMO CRIAR UM SERVICE

### 1. Estrutura de Arquivos

```
src/modules/meu-modulo/
└── services/
    ├── MeuService.impl.ts    ← Implementação
    ├── MeuService.ts         ← Re-export
    └── index.ts              ← Barrel export
```

### 2. Implementação (MeuService.impl.ts)

```typescript
/**
 * Service para gerenciar [descrição]
 * 
 * SSOT: Este service é o ÚNICO ponto de acesso ao banco de dados
 * para operações relacionadas a [entidade].
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

export class MeuService {
  /**
   * Busca todos os itens
   */
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*');

      if (error) {
        logger.error('Erro ao buscar itens:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Erro inesperado:', error);
      return [];
    }
  }

  /**
   * Busca item por ID
   */
  static async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Erro ao buscar item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Erro inesperado:', error);
      return null;
    }
  }

  /**
   * Cria novo item
   */
  static async create(data: any) {
    try {
      const { data: result, error } = await supabase
        .from('minha_tabela')
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao criar item:', error);
        throw error;
      }

      return result;
    } catch (error) {
      logger.error('Erro inesperado:', error);
      throw error;
    }
  }

  /**
   * Atualiza item
   */
  static async update(id: string, data: any) {
    try {
      const { data: result, error } = await supabase
        .from('minha_tabela')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao atualizar item:', error);
        throw error;
      }

      return result;
    } catch (error) {
      logger.error('Erro inesperado:', error);
      throw error;
    }
  }

  /**
   * Deleta item
   */
  static async delete(id: string) {
    try {
      const { error } = await supabase
        .from('minha_tabela')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Erro ao deletar item:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Erro inesperado:', error);
      return false;
    }
  }
}
```

### 3. Re-export (MeuService.ts)

```typescript
export * from './MeuService.impl';
```

### 4. Barrel Export (index.ts)

```typescript
export * from './MeuService';
```

---

## 🎣 COMO CRIAR UM HOOK

### 1. Estrutura de Arquivos

```
src/modules/meu-modulo/
└── hooks/
    └── useMeuDado.ts
```

### 2. Implementação (useMeuDado.ts)

```typescript
/**
 * Hook para gerenciar [descrição]
 * 
 * SSOT: Este hook usa APENAS o MeuService para acessar dados.
 * NÃO acessa o banco de dados diretamente.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MeuService } from '../services/MeuService';
import { toast } from 'sonner';

export function useMeuDado() {
  const queryClient = useQueryClient();

  // Query para buscar todos
  const { data, isLoading, error } = useQuery({
    queryKey: ['meu-dado'],
    queryFn: () => MeuService.getAll(),
  });

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: any) => MeuService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meu-dado'] });
      toast.success('Item criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar item');
      console.error(error);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      MeuService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meu-dado'] });
      toast.success('Item atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar item');
      console.error(error);
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => MeuService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meu-dado'] });
      toast.success('Item deletado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao deletar item');
      console.error(error);
    },
  });

  return {
    data,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

---

## 🎨 COMO USAR NO COMPONENT

### Component (MeuComponent.tsx)

```typescript
/**
 * Component para exibir [descrição]
 * 
 * SSOT: Este component usa APENAS o hook useMeuDado.
 * NÃO acessa o service ou banco de dados diretamente.
 */

import { useMeuDado } from '../hooks/useMeuDado';

export function MeuComponent() {
  const { data, isLoading, create, update, delete: deleteFn } = useMeuDado();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      {data?.map((item) => (
        <div key={item.id}>
          <span>{item.name}</span>
          <button onClick={() => update({ id: item.id, data: { name: 'Novo' } })}>
            Editar
          </button>
          <button onClick={() => deleteFn(item.id)}>
            Deletar
          </button>
        </div>
      ))}
      
      <button onClick={() => create({ name: 'Novo Item' })}>
        Criar
      </button>
    </div>
  );
}
```

---

## 🔍 COMO VALIDAR CONFORMIDADE

### 1. Verificar Imports de Supabase

```bash
# Buscar imports em hooks
grep -r "from '@/integrations/supabase'" src/modules/meu-modulo/hooks/

# Buscar imports em components
grep -r "from '@/integrations/supabase'" src/modules/meu-modulo/components/

# Buscar imports em pages
grep -r "from '@/integrations/supabase'" src/modules/meu-modulo/pages/
```

**Resultado esperado**: Nenhum resultado (0 matches)

### 2. Verificar TypeScript

```bash
npm run typecheck
```

**Resultado esperado**: Zero erros

### 3. Verificar Estrutura

```bash
# Verificar se service existe
ls src/modules/meu-modulo/services/MeuService.impl.ts

# Verificar se hook existe
ls src/modules/meu-modulo/hooks/useMeuDado.ts
```

---

## 📋 CHECKLIST DE CONFORMIDADE

### Service
- [ ] Arquivo `.impl.ts` criado
- [ ] Arquivo `.ts` (re-export) criado
- [ ] `index.ts` (barrel export) criado
- [ ] Todos os métodos documentados com JSDoc
- [ ] Error handling implementado
- [ ] Logging implementado
- [ ] Types exportados
- [ ] Comentário SSOT no topo do arquivo

### Hook
- [ ] Usa APENAS o service (não acessa Supabase)
- [ ] Usa React Query para cache
- [ ] Implementa mutations quando necessário
- [ ] Implementa feedback ao usuário (toast)
- [ ] Invalida queries após mutations
- [ ] Comentário SSOT no topo do arquivo

### Component
- [ ] Usa APENAS o hook (não acessa service ou Supabase)
- [ ] Não tem lógica de negócio
- [ ] Apenas UI e interação
- [ ] Comentário SSOT no topo do arquivo

---

## 🚨 ERROS COMUNS

### ❌ Erro 1: Component acessando Service diretamente

```typescript
// ❌ ERRADO
import { MeuService } from '../services/MeuService';

function MeuComponent() {
  const data = await MeuService.getAll(); // ERRADO!
}
```

**Solução**: Criar hook intermediário

```typescript
// ✅ CORRETO
import { useMeuDado } from '../hooks/useMeuDado';

function MeuComponent() {
  const { data } = useMeuDado(); // CORRETO!
}
```

---

### ❌ Erro 2: Hook acessando Supabase diretamente

```typescript
// ❌ ERRADO
import { supabase } from '@/integrations/supabase';

export function useMeuDado() {
  const { data } = await supabase.from('tabela').select(); // ERRADO!
}
```

**Solução**: Usar service

```typescript
// ✅ CORRETO
import { MeuService } from '../services/MeuService';

export function useMeuDado() {
  const { data } = useQuery({
    queryKey: ['meu-dado'],
    queryFn: () => MeuService.getAll(), // CORRETO!
  });
}
```

---

### ❌ Erro 3: Lógica de negócio no Hook

```typescript
// ❌ ERRADO
export function useMeuDado() {
  const processData = (data: any) => {
    // Lógica complexa de negócio aqui
    return data.filter(...).map(...).reduce(...);
  };
}
```

**Solução**: Mover lógica para service

```typescript
// ✅ CORRETO - Service
export class MeuService {
  static async getProcessedData() {
    const data = await this.getAll();
    // Lógica complexa de negócio aqui
    return data.filter(...).map(...).reduce(...);
  }
}

// ✅ CORRETO - Hook
export function useMeuDado() {
  return useQuery({
    queryKey: ['meu-dado-processado'],
    queryFn: () => MeuService.getProcessedData(),
  });
}
```

---

## 🎯 CORE vs MODULES

### CORE (Transversal)
- Usado por MÚLTIPLOS módulos
- Infraestrutura fundamental
- SEM UI própria
- NÃO pode ser desligado

**Exemplo**: `src/core/profiles/services/ProfileService.ts`

### MODULES (Vertical)
- Funcionalidade específica
- UI própria (pages/components)
- PODE ser desligado via feature flag
- Domínio de negócio isolado

**Exemplo**: `src/modules/mobility/services/MobilityService.ts`

---

## 📚 DOCUMENTOS DE REFERÊNCIA

1. `ESTADO_FINAL_REFATORACAO_SSOT.md` - Estado final completo
2. `REFATORACAO_SSOT_100_CONCLUIDA.md` - Resumo da refatoração
3. `ESCLARECIMENTO_ARQUITETURA_DEFINITIVO.md` - Decisões arquiteturais
4. `MAPA_ACESSO_SUPABASE.md` - Mapa de acessos ao banco

---

## 🎉 CONCLUSÃO

Seguindo este guia, você garante:
- ✅ 100% conformidade SSOT
- ✅ Código limpo e organizado
- ✅ Fácil manutenção
- ✅ Fácil teste
- ✅ Fácil escalabilidade

**Lembre-se**: Database → Service → Hook → Component

---

**Data**: 2026-04-04  
**Versão**: 1.0  
**Status**: ✅ Guia Completo

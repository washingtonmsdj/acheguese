# Arquitetura Global SSOT - Topbar e Seletor

## Visão Geral

Implementação de arquitetura verdadeiramente global onde componentes de UI (Topbar e Seletor) consomem configuração centralizada automaticamente, sem necessidade de modificação manual para cada novo módulo.

## Problema Original

### Antes (Gambiarras)

**Topbar:**
```typescript
// ❌ Gambiarra: if/else hardcoded
const getContextualMessage = () => {
  if (path.includes('/empresas')) return 'Exibindo empresas de';
  if (path.includes('/servicos')) return 'Exibindo serviços de';
  // ... 10+ condições
  return null;
};
```

**Seletor:**
```typescript
// ❌ Gambiarra: recebe contextMessage como prop
interface TerritorySelectorV2Props {
  contextMessage?: string;  // Prop manual!
}

// ❌ Cada página precisa passar manualmente
<TerritorySelectorV2 contextMessage="Exibindo empresas de" />
```

**Problemas:**
1. ❌ Cada novo módulo requer modificar múltiplos arquivos
2. ❌ Lógica duplicada e espalhada
3. ❌ Props manuais que deveriam ser automáticas
4. ❌ Não há SSOT verdadeiro
5. ❌ Difícil manutenção e escalabilidade

## Solução Profissional

### 1. SSOT de Módulos (`src/config/modules.ts`)

Arquivo centralizado que define TODOS os módulos:

```typescript
export interface ModuleConfig {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  contextMessage?: string;  // ✅ Definido aqui!
  isTerritorial: boolean;
  isActive: boolean;
  order: number;
}

export const MODULES: Record<string, ModuleConfig> = {
  business: {
    id: 'business',
    name: 'Empresas',
    slug: 'empresas',
    icon: Building2,
    contextMessage: 'Exibindo empresas de',  // ✅ Uma vez
    isTerritorial: true,
    isActive: true,
    order: 2,
  },
  // ... todos os módulos
};

// ✅ Helper inteligente
export function getContextMessageFromPath(pathname: string): string | null {
  const module = detectModuleFromPath(pathname);
  return module?.contextMessage || null;
}
```

### 2. Topbar Refatorada

**Antes:**
```typescript
// ❌ 40+ linhas de if/else
const getContextualMessage = () => { /* ... */ };
const contextMessage = getContextualMessage();

<TerritorySelectorV2 contextMessage={contextMessage} />
```

**Depois:**
```typescript
// ✅ Sem lógica de detecção - seletor detecta sozinho
<TerritorySelectorV2
  currentPath={territoryPath}
  compact={true}
/>
```

### 3. Seletor Refatorado

**Antes:**
```typescript
interface TerritorySelectorV2Props {
  currentPath: string;
  compact?: boolean;
  contextMessage?: string;  // ❌ Prop manual
}

export function TerritorySelectorV2({ contextMessage, ... }) {
  // Usa contextMessage passado como prop
}
```

**Depois:**
```typescript
import { getContextMessageFromPath } from '@/config/modules';

interface TerritorySelectorV2Props {
  currentPath: string;
  compact?: boolean;
  // ✅ Sem contextMessage - detecta automaticamente
}

export function TerritorySelectorV2({ currentPath, compact }) {
  const routerLocation = useRouterLocation();
  
  // ✅ SSOT: Detecta automaticamente
  const contextMessage = getContextMessageFromPath(routerLocation.pathname);
  
  // Resto do código...
}
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    src/config/modules.ts                     │
│                         (SSOT)                               │
│                                                              │
│  MODULES = {                                                 │
│    business: {                                               │
│      contextMessage: 'Exibindo empresas de'                  │
│    },                                                        │
│    gastronomy: {                                             │
│      contextMessage: 'Gastronomia de'                        │
│    },                                                        │
│    // ... todos os módulos                                   │
│  }                                                           │
│                                                              │
│  getContextMessageFromPath(pathname) → string | null         │
└─────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ (importa e usa)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              TerritorySelectorV2.tsx                         │
│                                                              │
│  const contextMessage = getContextMessageFromPath(pathname)  │
│                                                              │
│  // Usa automaticamente em:                                  │
│  {contextMessage && <span>{contextMessage}</span>}           │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              ↑ (renderiza)
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    AppTopbar.tsx                             │
│                                                              │
│  <TerritorySelectorV2                                        │
│    currentPath={territoryPath}                               │
│    compact={true}                                            │
│  />                                                          │
│                                                              │
│  // ✅ Sem passar contextMessage - detecta sozinho           │
└─────────────────────────────────────────────────────────────┘
```

## Benefícios

### 1. Verdadeiramente Global

- ✅ Topbar e Seletor são componentes globais
- ✅ Não precisam ser modificados para novos módulos
- ✅ Consomem configuração centralizada automaticamente

### 2. SSOT Rigoroso

- ✅ Uma única fonte de verdade: `src/config/modules.ts`
- ✅ Todas as informações de módulos em um lugar
- ✅ Fácil de encontrar e modificar

### 3. Escalabilidade

**Adicionar novo módulo:**

```typescript
// 1. Adicionar em src/config/modules.ts
export const MODULES = {
  // ... módulos existentes
  
  newModule: {
    id: 'newModule',
    name: 'Novo Módulo',
    slug: 'novo-modulo',
    icon: NewIcon,
    contextMessage: 'Exibindo novo módulo de',  // ✅ Aqui!
    isTerritorial: true,
    isActive: true,
    order: 10,
  },
};

// 2. Pronto! Topbar e Seletor detectam automaticamente
```

**Não precisa:**
- ❌ Modificar AppTopbar.tsx
- ❌ Modificar TerritorySelectorV2.tsx
- ❌ Passar props manualmente
- ❌ Adicionar if/else em lugar nenhum

### 4. Manutenibilidade

- ✅ Código limpo e declarativo
- ✅ Sem lógica condicional complexa
- ✅ Fácil de testar
- ✅ Fácil de documentar

### 5. Consistência

- ✅ Todos os módulos seguem o mesmo padrão
- ✅ Comportamento previsível
- ✅ Sem surpresas ou inconsistências

## Comparação

| Aspecto | Antes (Gambiarra) | Depois (Profissional) |
|---------|-------------------|----------------------|
| **Topbar** | 40+ linhas if/else | Sem lógica de detecção |
| **Seletor** | Recebe prop manual | Detecta automaticamente |
| **Adicionar módulo** | Modificar 3+ arquivos | Modificar 1 arquivo |
| **Props manuais** | contextMessage | Nenhuma |
| **Lógica duplicada** | Sim (topbar + seletor) | Não (centralizada) |
| **SSOT** | Não | Sim |
| **Manutenibilidade** | Baixa | Alta |
| **Escalabilidade** | Ruim | Excelente |

## Arquivos Modificados

### Criados
1. ✅ `src/config/modules.ts` - SSOT de módulos

### Refatorados
1. ✅ `src/app/components/AppTopbar.tsx` - Removido lógica de detecção
2. ✅ `src/core/location/components/TerritorySelectorV2.tsx` - Detecta automaticamente

### Resultado
- **Linhas removidas:** ~50 linhas de código duplicado
- **Linhas adicionadas:** ~150 linhas de configuração centralizada
- **Arquivos que não precisam mais ser modificados:** 2 (Topbar e Seletor)

## Módulos Configurados

Todos os módulos territoriais:

1. ✅ Comunidade - "Comunidade de"
2. ✅ Empresas - "Exibindo empresas de"
3. ✅ Serviços - "Exibindo serviços de"
4. ✅ Classificados - "Exibindo anúncios de"
5. ✅ Eventos - "Exibindo eventos de"
6. ✅ Vagas - "Exibindo vagas de"
7. ✅ Gastronomia - "Gastronomia de"
8. ✅ Pontos Turísticos - "Pontos turísticos de"
9. ✅ Mobilidade - "Mobilidade em"

## Testes Recomendados

### Funcionalidade
1. ✅ Acessar cada módulo e verificar mensagem contextual
2. ✅ Verificar que seletor mostra mensagem correta
3. ✅ Testar navegação entre módulos
4. ✅ Verificar que rotas não-modulares não mostram mensagem

### Escalabilidade
1. ✅ Adicionar novo módulo em `modules.ts`
2. ✅ Verificar que topbar detecta automaticamente
3. ✅ Verificar que seletor detecta automaticamente
4. ✅ Confirmar que não foi necessário modificar outros arquivos

## Princípios Aplicados

### 1. Single Source of Truth (SSOT)
- Configuração centralizada em um único arquivo
- Todas as informações de módulos em um lugar
- Sem duplicação de dados

### 2. Don't Repeat Yourself (DRY)
- Lógica de detecção em um único lugar
- Sem código duplicado entre componentes
- Reutilização máxima

### 3. Separation of Concerns
- Configuração separada de UI
- Lógica de negócio separada de apresentação
- Componentes focados em renderização

### 4. Open/Closed Principle
- Aberto para extensão (adicionar módulos)
- Fechado para modificação (não modificar componentes)

### 5. Dependency Inversion
- Componentes dependem de abstração (config)
- Não dependem de implementação concreta
- Fácil de testar e mockar

## Conclusão

Esta é uma arquitetura **verdadeiramente profissional e global**:

- ✅ Topbar e Seletor são componentes globais que consomem SSOT
- ✅ Não precisam ser modificados para novos módulos
- ✅ Detecção automática de contexto
- ✅ Sem props manuais ou gambiarras
- ✅ Escalável, manutenível e testável
- ✅ Código limpo e declarativo

**Resultado:** Adicionar um novo módulo agora é trivial - apenas uma entrada no config e tudo funciona automaticamente.

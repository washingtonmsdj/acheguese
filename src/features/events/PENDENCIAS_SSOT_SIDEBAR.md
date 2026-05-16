# ⚠️ Pendências: SSOT Territorial e Sidebars

## 🎯 O Que Falta

Você identificou corretamente 2 pendências importantes:

1. **❌ SSOT Territorial** - Não estamos usando `useTerritoryFilter` corretamente
2. **❌ Sidebars** - Faltam as sidebars (comunidade e global)

---

## 1. SSOT Territorial

### ❌ Problema Atual

**EventsListPage** está fazendo filtragem manual:

```typescript
// ❌ ERRADO - Filtragem manual
const territorialFilter = useMemo(() => {
  if (!resolved) return null;
  
  if (resolved.kind === 'location') {
    return {
      type: 'location' as const,
      city: resolved.location.metadata?.city_name,
      neighborhood: resolved.location.type === 'district' ? resolved.location.name : undefined,
    };
  }
  // ...
}, [resolved]);
```

### ✅ Solução Correta

Usar `useTerritoryFilter` (SSOT):

```typescript
// ✅ CORRETO - Usa SSOT
import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';

// No componente:
const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);

// Usar territoryFilter nas queries:
const { data: events } = useQuery({
  queryKey: ['events', territoryFilter],
  queryFn: () => EventsService.getEvents({ territoryFilter }),
});
```

### 📋 Mudanças Necessárias

#### 1. **EventsListPage.tsx**

```typescript
// Adicionar imports
import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';
import type { TerritoryFilter } from '@/core/location/types';

// Adicionar prop activeMemberIds
export interface EventsListPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[]; // ← ADICIONAR
}

// No componente
export default function EventsListPage({ 
  resolved, 
  activeMemberIds = [] // ← ADICIONAR
}: EventsListPageProps = {}) {
  
  // Usar SSOT
  const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);
  
  // Remover lógica manual de filtragem
  // Usar territoryFilter nas queries
}
```

#### 2. **TerritorialModulePages.tsx**

```typescript
// Já está correto! Passa activeMemberIds
export function TerritorialEventosPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <CityStatusGate module="eventos">
      <Suspense fallback={<ModulePageLoader />}>
        <EventsListPage 
          resolved={resolved} 
          activeMemberIds={activeMemberIds} // ← Já passa
        />
      </Suspense>
    </CityStatusGate>
  );
}
```

---

## 2. Sidebars

### ❌ Problema Atual

As páginas de eventos **não têm sidebars**:
- Sem sidebar da comunidade (quando em contexto territorial)
- Sem sidebar global (quando sem contexto)

### ✅ Solução

Adicionar layout com sidebar seguindo o padrão do `ComunidadePage`:

```typescript
// Layout com sidebar
<div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
  {/* Conteúdo principal */}
  <main className="min-w-0 max-w-full overflow-x-hidden">
    {/* Lista de eventos */}
  </main>

  {/* Sidebar */}
  <aside className="hidden lg:block w-80 flex-shrink-0">
    <div className="sticky top-6">
      <CommunityRightSidebar />
    </div>
  </aside>
</div>
```

### 📋 Componentes de Sidebar

#### Sidebar da Comunidade
```typescript
import { CommunityRightSidebar } from '@/core/community/components/CommunityRightSidebar';

// Usar quando em contexto territorial
{resolved && (
  <aside className="hidden lg:block w-80 flex-shrink-0">
    <div className="sticky top-6">
      <CommunityRightSidebar />
    </div>
  </aside>
)}
```

#### Sidebar Global
```typescript
// Criar EventsRightSidebar para contexto global
// Pode incluir:
// - Eventos em destaque
// - Categorias populares
// - Eventos próximos
// - Organizadores verificados
```

---

## 📊 Comparação

### Antes (Atual)
```
❌ Filtragem manual (não usa SSOT)
❌ Sem sidebar
❌ Sem widgets laterais
❌ Layout simples (sem grid)
```

### Depois (Correto)
```
✅ useTerritoryFilter (SSOT)
✅ Sidebar da comunidade (territorial)
✅ Sidebar global (sem contexto)
✅ Layout profissional (grid 2 colunas)
```

---

## 🎨 Layout Proposto

### Com Contexto Territorial
```
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs                                         │
├─────────────────────────────────────────────────────┤
│ Hero Section                                        │
├─────────────────────────────────────────────────────┤
│ Filtros                                             │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│  Lista de Eventos            │  Sidebar Comunidade  │
│  (main)                      │  (aside)             │
│                              │  • Widgets           │
│  • EventCard                 │  • Top Users         │
│  • EventCard                 │  • Trending          │
│  • EventCard                 │  • Quick Actions     │
│                              │                      │
└──────────────────────────────┴──────────────────────┘
```

### Sem Contexto (Global)
```
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs                                         │
├─────────────────────────────────────────────────────┤
│ Hero Section                                        │
├─────────────────────────────────────────────────────┤
│ Filtros                                             │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│  Lista de Eventos            │  Sidebar Global      │
│  (main)                      │  (aside)             │
│                              │  • Destaques         │
│  • EventCard                 │  • Categorias        │
│  • EventCard                 │  • Próximos          │
│  • EventCard                 │  • Organizadores     │
│                              │                      │
└──────────────────────────────┴──────────────────────┘
```

---

## 🔧 Implementação

### Passo 1: Adicionar SSOT Territorial

```typescript
// EventsListPage.tsx

import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';

export interface EventsListPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

export default function EventsListPage({ 
  resolved, 
  activeMemberIds = [] 
}: EventsListPageProps = {}) {
  
  // SSOT Territorial
  const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);
  
  // Usar em queries
  const filteredEvents = useMemo(() => {
    let filtered = [...MOCK_EVENTS];
    
    // Aplicar filtro territorial via SSOT
    // (futuramente será na query do Supabase)
    if (territoryFilter.scope !== 'none') {
      // Lógica de filtro baseada em territoryFilter
    }
    
    // Outros filtros...
    return filtered;
  }, [territoryFilter, /* outros deps */]);
}
```

### Passo 2: Adicionar Layout com Sidebar

```typescript
// EventsListPage.tsx

import { CommunityRightSidebar } from '@/core/community/components/CommunityRightSidebar';

// No render:
<div className="mx-auto max-w-7xl px-4 sm:px-6">
  <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
    {/* Main Content */}
    <main className="min-w-0 max-w-full overflow-x-hidden">
      {/* Filtros */}
      {/* Lista de eventos */}
      {/* Paginação */}
    </main>

    {/* Sidebar */}
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div className="sticky top-6">
        {resolved ? (
          <CommunityRightSidebar />
        ) : (
          <EventsGlobalSidebar />
        )}
      </div>
    </aside>
  </div>
</div>
```

### Passo 3: Criar EventsGlobalSidebar

```typescript
// src/features/events-v2/components/EventsGlobalSidebar.tsx

export function EventsGlobalSidebar() {
  return (
    <div className="space-y-4">
      {/* Eventos em Destaque */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Eventos em Destaque</h3>
        {/* Lista de eventos destacados */}
      </div>

      {/* Categorias Populares */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Categorias Populares</h3>
        {/* Lista de categorias */}
      </div>

      {/* Organizadores Verificados */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Organizadores Verificados</h3>
        {/* Lista de organizadores */}
      </div>
    </div>
  );
}
```

---

## ✅ Checklist de Implementação

### SSOT Territorial
- [ ] Adicionar `useTerritoryFilter` no EventsListPage
- [ ] Adicionar prop `activeMemberIds`
- [ ] Remover lógica manual de filtragem
- [ ] Usar `territoryFilter` nas queries
- [ ] Testar com contexto territorial
- [ ] Testar sem contexto

### Sidebars
- [ ] Adicionar layout grid 2 colunas
- [ ] Importar `CommunityRightSidebar`
- [ ] Criar `EventsGlobalSidebar`
- [ ] Adicionar lógica condicional (territorial vs global)
- [ ] Testar responsividade (sidebar oculta em mobile)
- [ ] Testar sticky positioning

---

## 🧪 Como Testar

### Teste 1: SSOT Territorial
```bash
# Com contexto territorial
http://localhost:8080/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos

# Verificar:
✓ territoryFilter está correto
✓ Apenas eventos do território aparecem
✓ Console não mostra erros
```

### Teste 2: Sidebar Comunidade
```bash
# Com contexto territorial
http://localhost:8080/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos

# Verificar:
✓ Sidebar aparece no desktop (lg+)
✓ Sidebar oculta no mobile
✓ Widgets da comunidade aparecem
✓ Sticky funciona ao scroll
```

### Teste 3: Sidebar Global
```bash
# Sem contexto territorial
http://localhost:8080/eventos

# Verificar:
✓ Sidebar global aparece
✓ Widgets globais aparecem
✓ Sem widgets da comunidade
```

---

## 📝 Arquivos a Modificar

### Principais
1. `src/features/events-v2/pages/EventsListPage.tsx`
   - Adicionar `useTerritoryFilter`
   - Adicionar layout com sidebar
   - Adicionar prop `activeMemberIds`

### Criar
2. `src/features/events-v2/components/EventsGlobalSidebar.tsx`
   - Sidebar para contexto global
   - Widgets de eventos

### Já Corretos
3. `src/core/routing/components/TerritorialModulePages.tsx`
   - Já passa `activeMemberIds` ✅

---

## 🎯 Prioridade

### Alta (Fazer Agora)
1. ✅ SSOT Territorial - Crítico para consistência
2. ✅ Sidebar Comunidade - Importante para UX

### Média (Próxima Sprint)
3. EventsGlobalSidebar - Melhoria de UX
4. Widgets personalizados

---

## ✅ Conclusão

Você identificou corretamente as pendências! Precisamos:

1. **SSOT Territorial**: Usar `useTerritoryFilter` em vez de lógica manual
2. **Sidebars**: Adicionar layout com sidebar (comunidade + global)

Isso vai deixar o sistema:
- ✅ Consistente com resto do projeto
- ✅ Seguindo princípios SSOT
- ✅ Com UX profissional
- ✅ Preparado para integração com Supabase

---

**Criado por**: Kiro AI  
**Data**: 2026-05-14  
**Status**: ⚠️ PENDENTE - Aguardando implementação

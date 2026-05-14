# âš ï¸ PendÃªncias: SSOT Territorial e Sidebars

## ðŸŽ¯ O Que Falta

VocÃª identificou corretamente 2 pendÃªncias importantes:

1. **âŒ SSOT Territorial** - NÃ£o estamos usando `useTerritoryFilter` corretamente
2. **âŒ Sidebars** - Faltam as sidebars (comunidade e global)

---

## 1. SSOT Territorial

### âŒ Problema Atual

**EventsListPage** estÃ¡ fazendo filtragem manual:

```typescript
// âŒ ERRADO - Filtragem manual
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

### âœ… SoluÃ§Ã£o Correta

Usar `useTerritoryFilter` (SSOT):

```typescript
// âœ… CORRETO - Usa SSOT
import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';

// No componente:
const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);

// Usar territoryFilter nas queries:
const { data: events } = useQuery({
  queryKey: ['events', territoryFilter],
  queryFn: () => EventsService.getEvents({ territoryFilter }),
});
```

### ðŸ“‹ MudanÃ§as NecessÃ¡rias

#### 1. **EventsListPage.tsx**

```typescript
// Adicionar imports
import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';
import type { TerritoryFilter } from '@/core/location/types';

// Adicionar prop activeMemberIds
export interface EventsListPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[]; // â† ADICIONAR
}

// No componente
export default function EventsListPage({ 
  resolved, 
  activeMemberIds = [] // â† ADICIONAR
}: EventsListPageProps = {}) {
  
  // Usar SSOT
  const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);
  
  // Remover lÃ³gica manual de filtragem
  // Usar territoryFilter nas queries
}
```

#### 2. **TerritorialModulePages.tsx**

```typescript
// JÃ¡ estÃ¡ correto! Passa activeMemberIds
export function TerritorialEventosPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <CityStatusGate module="eventos">
      <Suspense fallback={<ModulePageLoader />}>
        <EventsListPage 
          resolved={resolved} 
          activeMemberIds={activeMemberIds} // â† JÃ¡ passa
        />
      </Suspense>
    </CityStatusGate>
  );
}
```

---

## 2. Sidebars

### âŒ Problema Atual

As pÃ¡ginas de eventos **nÃ£o tÃªm sidebars**:
- Sem sidebar da comunidade (quando em contexto territorial)
- Sem sidebar global (quando sem contexto)

### âœ… SoluÃ§Ã£o

Adicionar layout com sidebar seguindo o padrÃ£o do `ComunidadePage`:

```typescript
// Layout com sidebar
<div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
  {/* ConteÃºdo principal */}
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

### ðŸ“‹ Componentes de Sidebar

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
// - Eventos prÃ³ximos
// - Organizadores verificados
```

---

## ðŸ“Š ComparaÃ§Ã£o

### Antes (Atual)
```
âŒ Filtragem manual (nÃ£o usa SSOT)
âŒ Sem sidebar
âŒ Sem widgets laterais
âŒ Layout simples (sem grid)
```

### Depois (Correto)
```
âœ… useTerritoryFilter (SSOT)
âœ… Sidebar da comunidade (territorial)
âœ… Sidebar global (sem contexto)
âœ… Layout profissional (grid 2 colunas)
```

---

## ðŸŽ¨ Layout Proposto

### Com Contexto Territorial
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Breadcrumbs                                         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Hero Section                                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Filtros                                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                              â”‚                      â”‚
â”‚  Lista de Eventos            â”‚  Sidebar Comunidade  â”‚
â”‚  (main)                      â”‚  (aside)             â”‚
â”‚                              â”‚  â€¢ Widgets           â”‚
â”‚  â€¢ EventCard                 â”‚  â€¢ Top Users         â”‚
â”‚  â€¢ EventCard                 â”‚  â€¢ Trending          â”‚
â”‚  â€¢ EventCard                 â”‚  â€¢ Quick Actions     â”‚
â”‚                              â”‚                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Sem Contexto (Global)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Breadcrumbs                                         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Hero Section                                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Filtros                                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                              â”‚                      â”‚
â”‚  Lista de Eventos            â”‚  Sidebar Global      â”‚
â”‚  (main)                      â”‚  (aside)             â”‚
â”‚                              â”‚  â€¢ Destaques         â”‚
â”‚  â€¢ EventCard                 â”‚  â€¢ Categorias        â”‚
â”‚  â€¢ EventCard                 â”‚  â€¢ PrÃ³ximos          â”‚
â”‚  â€¢ EventCard                 â”‚  â€¢ Organizadores     â”‚
â”‚                              â”‚                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ”§ ImplementaÃ§Ã£o

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
    // (futuramente serÃ¡ na query do Supabase)
    if (territoryFilter.scope !== 'none') {
      // LÃ³gica de filtro baseada em territoryFilter
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
      {/* PaginaÃ§Ã£o */}
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

## âœ… Checklist de ImplementaÃ§Ã£o

### SSOT Territorial
- [ ] Adicionar `useTerritoryFilter` no EventsListPage
- [ ] Adicionar prop `activeMemberIds`
- [ ] Remover lÃ³gica manual de filtragem
- [ ] Usar `territoryFilter` nas queries
- [ ] Testar com contexto territorial
- [ ] Testar sem contexto

### Sidebars
- [ ] Adicionar layout grid 2 colunas
- [ ] Importar `CommunityRightSidebar`
- [ ] Criar `EventsGlobalSidebar`
- [ ] Adicionar lÃ³gica condicional (territorial vs global)
- [ ] Testar responsividade (sidebar oculta em mobile)
- [ ] Testar sticky positioning

---

## ðŸ§ª Como Testar

### Teste 1: SSOT Territorial
```bash
# Com contexto territorial
http://localhost:8080/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos

# Verificar:
âœ“ territoryFilter estÃ¡ correto
âœ“ Apenas eventos do territÃ³rio aparecem
âœ“ Console nÃ£o mostra erros
```

### Teste 2: Sidebar Comunidade
```bash
# Com contexto territorial
http://localhost:8080/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos

# Verificar:
âœ“ Sidebar aparece no desktop (lg+)
âœ“ Sidebar oculta no mobile
âœ“ Widgets da comunidade aparecem
âœ“ Sticky funciona ao scroll
```

### Teste 3: Sidebar Global
```bash
# Sem contexto territorial
http://localhost:8080/eventos

# Verificar:
âœ“ Sidebar global aparece
âœ“ Widgets globais aparecem
âœ“ Sem widgets da comunidade
```

---

## ðŸ“ Arquivos a Modificar

### Principais
1. `src/features/events-v2/pages/EventsListPage.tsx`
   - Adicionar `useTerritoryFilter`
   - Adicionar layout com sidebar
   - Adicionar prop `activeMemberIds`

### Criar
2. `src/features/events-v2/components/EventsGlobalSidebar.tsx`
   - Sidebar para contexto global
   - Widgets de eventos

### JÃ¡ Corretos
3. `src/core/routing/components/TerritorialModulePages.tsx`
   - JÃ¡ passa `activeMemberIds` âœ…

---

## ðŸŽ¯ Prioridade

### Alta (Fazer Agora)
1. âœ… SSOT Territorial - CrÃ­tico para consistÃªncia
2. âœ… Sidebar Comunidade - Importante para UX

### MÃ©dia (PrÃ³xima Sprint)
3. EventsGlobalSidebar - Melhoria de UX
4. Widgets personalizados

---

## âœ… ConclusÃ£o

VocÃª identificou corretamente as pendÃªncias! Precisamos:

1. **SSOT Territorial**: Usar `useTerritoryFilter` em vez de lÃ³gica manual
2. **Sidebars**: Adicionar layout com sidebar (comunidade + global)

Isso vai deixar o sistema:
- âœ… Consistente com resto do projeto
- âœ… Seguindo princÃ­pios SSOT
- âœ… Com UX profissional
- âœ… Preparado para integraÃ§Ã£o com Supabase

---

**Criado por**: Kiro AI  
**Data**: 2026-05-14  
**Status**: âš ï¸ PENDENTE - Aguardando implementaÃ§Ã£o

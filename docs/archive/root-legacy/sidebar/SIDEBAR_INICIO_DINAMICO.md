# ✅ Sidebar: Botão "Início" Dinâmico

## Objetivo
Atualizar o botão "Início" da sidebar para levar o usuário para a landing page do território ativo (cidade ou bairro).

## Implementação

### Arquivo Modificado
`src/app/components/navigation/AppSidebar.tsx`

### Mudanças Realizadas

#### 1. Removido `useActiveTerritory`
```typescript
// ANTES
import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
const { activeLocation } = useActiveTerritory();
```

#### 2. Adicionado `lastTerritoryStore`
```typescript
// DEPOIS
import { useSyncExternalStore } from 'react';
import { lastTerritoryStore } from '@/core/routing/stores/LastTerritoryStore';

const lastTerritory = useSyncExternalStore(
  lastTerritoryStore.subscribe.bind(lastTerritoryStore),
  lastTerritoryStore.get.bind(lastTerritoryStore),
);
```

#### 3. Simplificada função `getHomeUrl`
```typescript
// ANTES - Lógica complexa e incompleta
const getHomeUrl = (): string => {
  if (activeLocation?.geographic_path) {
    const path = activeLocation.geographic_path.replace(/^\/br/, '');
    
    if (activeLocation.type === 'district') {
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return `/${parts[0]}/${parts[1]}`; // /ba/salvador
      }
    }
    
    return path || '/';
  }
  return '/';
};

// DEPOIS - Simples e correto
const getHomeUrl = (): string => {
  // Se há território ativo (cidade ou bairro), usa o baseUrl dele
  if (lastTerritory?.baseUrl) {
    return lastTerritory.baseUrl;
  }
  
  // Fallback: home padrão
  return '/';
};
```

## Por Que Usar `lastTerritoryStore`?

### ✅ Vantagens

1. **SSOT (Single Source of Truth)**
   - O `TerritorialLayout` já atualiza o `lastTerritoryStore` automaticamente
   - Não duplica lógica de resolução de território

2. **Sempre Atualizado**
   - Quando o usuário navega para um território, o store é atualizado
   - A sidebar reage automaticamente à mudança

3. **baseUrl Correto**
   - O `lastTerritoryStore` armazena o `baseUrl` calculado pelo `TerritorialLayout`
   - Não precisa recalcular ou fazer parsing de paths

4. **Funciona para Cidade e Bairro**
   - Cidade: `/ba/salvador` → CidadeLandingPage
   - Bairro: `/ba/salvador/nordeste-de-amaralina` → TerritorialLandingPage
   - Grupo: `/ba/salvador/complexo-do-nordeste` → TerritorialLandingPage

### ❌ Problema com `activeLocation`

O `activeLocation` do `useActiveTerritory` tem limitações:
- Pode não estar atualizado em todas as situações
- Requer lógica complexa para extrair a URL correta
- Não diferencia entre cidade e bairro de forma clara

## Como Funciona

### Fluxo de Atualização

```
1. Usuário navega para /ba/salvador
   ↓
2. TerritorialLayout resolve o território
   ↓
3. TerritorialLayout atualiza lastTerritoryStore
   lastTerritory = { name: 'Salvador', baseUrl: '/ba/salvador' }
   ↓
4. Sidebar reage à mudança (useSyncExternalStore)
   ↓
5. getHomeUrl() retorna '/ba/salvador'
   ↓
6. Botão "Início" leva para /ba/salvador → CidadeLandingPage ✅
```

```
1. Usuário navega para /ba/salvador/nordeste-de-amaralina
   ↓
2. TerritorialLayout resolve o território
   ↓
3. TerritorialLayout atualiza lastTerritoryStore
   lastTerritory = { name: 'Nordeste de Amaralina', baseUrl: '/ba/salvador/nordeste-de-amaralina' }
   ↓
4. Sidebar reage à mudança
   ↓
5. getHomeUrl() retorna '/ba/salvador/nordeste-de-amaralina'
   ↓
6. Botão "Início" leva para /ba/salvador/nordeste-de-amaralina → TerritorialLandingPage ✅
```

### Fallback

Se o usuário não visitou nenhum território ainda:
```typescript
if (!lastTerritory?.baseUrl) {
  return '/'; // Home padrão
}
```

## Navegação Mobile (BottomNav)

O `BottomNav` já usa `useFriendlyModuleUrls()` que retorna `urls.landing` baseado no território ativo. Não precisa de mudanças.

```typescript
const mainTabs = [
  { path: urls.landing, label: 'Início', icon: Home, badge: 0 },
  // ...
];
```

## Testes

### Cenários de Teste

1. ✅ Usuário acessa `/ba/salvador`
   - Botão "Início" deve levar para `/ba/salvador` (CidadeLandingPage)

2. ✅ Usuário acessa `/ba/salvador/nordeste-de-amaralina`
   - Botão "Início" deve levar para `/ba/salvador/nordeste-de-amaralina` (TerritorialLandingPage)

3. ✅ Usuário navega de bairro para cidade
   - Botão "Início" deve atualizar automaticamente

4. ✅ Usuário acessa página sem território (ex: `/perfil`)
   - Botão "Início" deve levar para o último território visitado
   - Se nenhum território foi visitado, leva para `/` (home padrão)

## Código Completo

```typescript
import { useSyncExternalStore } from 'react';
import { lastTerritoryStore } from '@/core/routing/stores/LastTerritoryStore';

export function AppSidebar() {
  // ... outros hooks
  
  // Usa lastTerritoryStore para obter o último território visitado
  const lastTerritory = useSyncExternalStore(
    lastTerritoryStore.subscribe.bind(lastTerritoryStore),
    lastTerritoryStore.get.bind(lastTerritoryStore),
  );

  // URL dinâmica para o botão "Início" - vai para landing do território ativo
  const getHomeUrl = (): string => {
    if (lastTerritory?.baseUrl) {
      return lastTerritory.baseUrl;
    }
    return '/';
  };

  const renderNavItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map(item => {
        // URL dinâmica para o botão "Início"
        const href = item.id === 'home' ? getHomeUrl() : item.href;
        const active = isActive(href);
        
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link to={href}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
  
  // ...
}
```

## Conclusão

✅ Botão "Início" agora leva para o território ativo (cidade ou bairro)
✅ Usa `lastTerritoryStore` (SSOT)
✅ Código simples e limpo
✅ Atualização automática quando o território muda
✅ Fallback para home padrão quando necessário

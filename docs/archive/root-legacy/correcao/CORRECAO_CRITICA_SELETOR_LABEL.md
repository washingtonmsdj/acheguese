# Correção Crítica: Label do Seletor Dessincroni zado

## Problema Grave Identificado

"A sidebar não está em sincronia quando mudo no seletor para grupo. A página atualiza, porém o seletor mantém em cidade. Quando eu clico em outra página na sidebar, ela volta para cidade, que o seletor não mudou, permaneceu em cidade."

## Causa Raiz

O problema tinha DUAS partes:

### 1. `currentPath` estava correto (✅)
- Usava `urls.base` (params da URL)
- Atualizava corretamente quando navegava para grupo
- Botão ativo no dropdown estava correto

### 2. `formattedLabel` estava ERRADO (❌)
- Usava `activeLocation` que NÃO é atualizado para grupos
- Quando em grupo, `activeLocation` ficava com valor anterior (cidade)
- O TEXTO do botão do seletor mostrava a cidade, não o grupo

## Fluxo do Problema

```
1. Usuário em /ba/salvador (cidade)
   - activeLocation: Salvador ✅
   - lastTerritoryStore: { name: 'Salvador', baseUrl: '/ba/salvador' } ✅
   - formattedLabel.short: 'Salvador' ✅
   - Seletor mostra: "Salvador" ✅

2. Usuário clica no grupo "Complexo do Nordeste de Amaralina"
   - URL muda para: /ba/salvador/complexo-do-nordeste-de-amaralina
   - TerritorialLayout atualiza lastTerritoryStore ✅
   - lastTerritoryStore: { name: 'Complexo...', baseUrl: '/ba/salvador/complexo...' } ✅
   - activeLocation: Salvador (NÃO MUDA!) ❌
   - formattedLabel.short: 'Salvador' (usa activeLocation) ❌
   - Seletor mostra: "Salvador" ❌ ERRADO!

3. Usuário clica na sidebar (ex: "Empresas")
   - Sidebar usa lastTerritoryStore.baseUrl ✅
   - Navega para: /empresas/ba/salvador/complexo... ✅
   - MAS o seletor ainda mostra "Salvador" ❌
```

## Solução Implementada

### Atualizado `useFormattedTerritoryLabel`

Agora usa `lastTerritoryStore` como PRIORIDADE 1:

```tsx
// ✅ SSOT: Usar lastTerritoryStore como prioridade (sempre atualizado)
const lastTerritory = useSyncExternalStore(
  lastTerritoryStore.subscribe.bind(lastTerritoryStore),
  lastTerritoryStore.get.bind(lastTerritoryStore),
) as { name: string; baseUrl: string } | null;

return useMemo(() => {
  // Prioridade 1: lastTerritoryStore (sempre atualizado, funciona para grupos)
  if (lastTerritory?.name && lastTerritory?.baseUrl) {
    const parts = lastTerritory.baseUrl.split('/').filter(Boolean);
    
    if (parts.length === 2) {
      // Cidade: /ba/salvador
      return {
        full: `${lastTerritory.name}/${state}`,
        short: lastTerritory.name,
        subtitle: state,
      };
    } else if (parts.length === 3) {
      // Bairro ou Grupo: /ba/salvador/barra ou /ba/salvador/complexo...
      return {
        full: `${lastTerritory.name} (${cityName}/${state})`,
        short: lastTerritory.name,
        subtitle: `${cityName}/${state}`,
      };
    }
  }
  
  // Prioridade 2: activeLocation (fallback)
  // Prioridade 3: homeCity (fallback)
  // ...
}, [lastTerritory, activeLocation, homeDistrict, homeCity, allLocations]);
```

## Por Que Funciona Agora?

### Fluxo Correto

```
TerritorialLayout resolve território
  ↓
Atualiza lastTerritoryStore.set({ name, baseUrl })
  ↓
lastTerritoryStore notifica listeners
  ↓
useFormattedTerritoryLabel recebe atualização
  ↓
formattedLabel.short = lastTerritory.name
  ↓
Seletor mostra nome correto ✅
```

### Sincronização Completa

```
TerritorySelectorV2:
  - currentPath: usa urls.base (params da URL) ✅
  - formattedLabel: usa lastTerritoryStore ✅
  - Ambos sincronizados com a mesma fonte de verdade!

AppSidebar:
  - getHomeUrl(): usa lastTerritoryStore.baseUrl ✅
  - Sincronizado com o seletor!
```

## Validação

### Cenário 1: Cidade → Grupo
```
1. Em /ba/salvador
   - lastTerritoryStore: { name: 'Salvador', baseUrl: '/ba/salvador' }
   - formattedLabel.short: 'Salvador' ✅
   - Seletor mostra: "Salvador" ✅

2. Clica no grupo
   - URL: /ba/salvador/complexo-do-nordeste-de-amaralina
   - lastTerritoryStore: { name: 'Complexo...', baseUrl: '/ba/salvador/complexo...' }
   - formattedLabel.short: 'Complexo do Nordeste de Amaralina' ✅
   - Seletor mostra: "Complexo do Nordeste de Amaralina" ✅

3. Clica na sidebar "Empresas"
   - Navega para: /empresas/ba/salvador/complexo... ✅
   - Seletor continua mostrando: "Complexo..." ✅
```

### Cenário 2: Grupo → Cidade
```
1. Em /ba/salvador/complexo-do-nordeste-de-amaralina
   - formattedLabel.short: 'Complexo...' ✅

2. Clica em "Salvador" (cidade âncora) no seletor
   - URL: /ba/salvador
   - lastTerritoryStore: { name: 'Salvador', baseUrl: '/ba/salvador' }
   - formattedLabel.short: 'Salvador' ✅
   - Seletor mostra: "Salvador" ✅
```

## Arquivos Modificados

1. **src/core/location/hooks/useFormattedTerritoryLabel.ts**
   - Adicionado `useSyncExternalStore` para ler `lastTerritoryStore`
   - `lastTerritoryStore` agora é PRIORIDADE 1
   - `activeLocation` é PRIORIDADE 2 (fallback)
   - Detecta tipo de território pelo número de segmentos no path

## Arquivos Relacionados (Já Corretos)

- **src/core/routing/stores/LastTerritoryStore.ts** - Store funcionando corretamente ✅
- **src/core/routing/components/TerritorialLayout.tsx** - Atualiza store corretamente ✅
- **src/app/components/navigation/AppSidebar.tsx** - Usa lastTerritoryStore ✅
- **src/core/location/components/TerritorySelectorV2.tsx** - Usa urls.base ✅

## Conclusão

O problema era que o seletor tinha DUAS fontes de dados:
1. `currentPath` (para destacar botão ativo) - usava `urls.base` ✅
2. `formattedLabel` (para mostrar texto) - usava `activeLocation` ❌

Agora AMBOS usam a mesma fonte de verdade:
- `currentPath` → `urls.base` (params da URL)
- `formattedLabel` → `lastTerritoryStore` (atualizado pelo TerritorialLayout)

Resultado: Seletor e sidebar 100% sincronizados! ✅

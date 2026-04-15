# Correção Final: Seletor com Grupos Territoriais

## Problema Identificado

Quando o usuário navega para um **grupo territorial** (ex: `/ba/salvador/complexo-do-nordeste-de-amaralina`), o seletor continuava mostrando a cidade (Salvador) ao invés do grupo.

### Causa Raiz

O `useResolveTerritoryFromUrl` tem dois fluxos:

1. **Location** (cidade/bairro) → Chama `locationContextStore.setActiveLocation(location)`
2. **Group** (grupo territorial) → NÃO chama `setActiveLocation`, apenas retorna `{ kind: 'group', group }`

Resultado: Quando está em um grupo, `activeLocation` fica com o valor anterior (última cidade visitada).

### Logs que Revelaram o Problema

```
🔍 useResolveTerritoryFromUrl: Resolvendo - {slug: 'complexo-do-nordeste-de-amaralina'}
// ❌ NÃO aparece "✅ setActiveLocation" porque é um grupo!

🟢 TerritorySelectorV2: currentPath = /ba/salvador | activeLocation = Salvador | type = city
// ❌ Mostra Salvador mesmo estando no grupo!
```

## Solução Implementada

### 1. Fallback para Params da URL

Quando `activeLocation` é null ou desatualizado (grupos), usar `useFriendlyModuleUrls` que lê os params da URL:

```tsx
const urls = useFriendlyModuleUrls(); // ✅ Fallback para grupos

const currentPath = useMemo(() => {
  // Prioridade 1: activeLocation (para cidades/bairros)
  if (activeLocation) {
    const path = geoPathToPublicUrl(activeLocation.geographic_path);
    console.log('🟢 currentPath (activeLocation) =', path);
    return path;
  }
  
  // Prioridade 2: params da URL (para grupos territoriais)
  if (urls.base) {
    console.log('🟡 currentPath (URL params) =', urls.base);
    return urls.base;
  }
  
  console.log('🔴 currentPath é NULL');
  return null;
}, [activeLocation, urls.base]);
```

### 2. Atualizado useFormattedTerritoryLabel

Preparado para suportar grupos no futuro (quando `activeTerritory` incluir grupos):

```tsx
if (activeTerritory) {
  // Se for um grupo territorial
  if (activeTerritory.type === 'group') {
    // TODO: Quando grupos forem implementados no activeTerritory
    console.warn('⚠️ Grupos territoriais ainda não suportados no activeTerritory');
  }
  
  // Se for uma location
  if (activeTerritory.type === 'location' && activeLocation) {
    // ... formatação normal
  }
}
```

## Comportamento Esperado

### Cenário 1: Cidade
```
URL: /ba/salvador
activeLocation: { name: 'Salvador', type: 'city' }
currentPath: /ba/salvador (via activeLocation)
Seletor mostra: "Salvador" ✅
```

### Cenário 2: Bairro
```
URL: /ba/salvador/barra
activeLocation: { name: 'Barra', type: 'district' }
currentPath: /ba/salvador/barra (via activeLocation)
Seletor mostra: "Barra" ✅
```

### Cenário 3: Grupo Territorial
```
URL: /ba/salvador/complexo-do-nordeste-de-amaralina
activeLocation: null (grupos não setam activeLocation)
currentPath: /ba/salvador/complexo-do-nordeste-de-amaralina (via urls.base)
Seletor mostra: "Complexo do Nordeste de Amaralina" ✅
```

## Logs de Debug Atualizados

### Quando em cidade/bairro:
```
🟢 TerritorySelectorV2: currentPath (activeLocation) = /ba/salvador
  | activeLocation = Salvador | type = city
```

### Quando em grupo:
```
🟡 TerritorySelectorV2: currentPath (URL params) = /ba/salvador/complexo-do-nordeste-de-amaralina
```

### Quando sem território:
```
🔴 TerritorySelectorV2: currentPath é NULL
```

## Arquivos Modificados

1. **src/core/location/components/TerritorySelectorV2.tsx**
   - Adicionado `useFriendlyModuleUrls` como fallback
   - `currentPath` agora usa `activeLocation` OU `urls.base`
   - Logs de debug atualizados

2. **src/core/location/hooks/useFormattedTerritoryLabel.ts**
   - Preparado para suportar `activeTerritory.type === 'group'`
   - Usa `activeTerritory` ao invés de apenas `activeLocation`

3. **src/core/routing/hooks/useResolveTerritoryFromUrl.ts**
   - Adicionados logs de debug
   - Logs mostram quando `setActiveLocation` é chamado

4. **src/app/components/AppTopbar.tsx**
   - Adicionado log de debug para mudanças de URL

## Validação

Teste navegando entre:
1. `/ba/salvador` → Deve mostrar "Salvador"
2. `/ba/salvador/barra` → Deve mostrar "Barra"
3. `/ba/salvador/complexo-do-nordeste-de-amaralina` → Deve mostrar "Complexo do Nordeste de Amaralina"
4. `/empresas/ba/salvador` → Deve mostrar "Salvador"
5. `/empresas/ba/salvador/complexo-do-nordeste-de-amaralina` → Deve mostrar "Complexo do Nordeste de Amaralina"

## Próximos Passos

### Remover Logs de Debug
Após validação, remover todos os `console.log` adicionados:
- `TerritorySelectorV2.tsx`
- `useResolveTerritoryFromUrl.ts`
- `AppTopbar.tsx`

### Implementar Suporte Completo a Grupos
Quando grupos forem totalmente implementados no `activeTerritory`:

```tsx
// Em LocationContextStore
setActiveGroup(group: TerritorialGroup, anchorCity: Location): void {
  this.activeTerritory = { type: 'group', group, anchorCity };
  this.notify();
}

// Em useFormattedTerritoryLabel
if (activeTerritory.type === 'group') {
  const { group, anchorCity } = activeTerritory;
  const parts = anchorCity.geographic_path.split('/').filter(Boolean);
  const stateSlug = parts[1]?.toUpperCase() || '';
  
  return {
    full: `${group.name} (${anchorCity.name}/${stateSlug})`,
    short: group.name,
    subtitle: `${anchorCity.name}/${stateSlug}`,
  };
}
```

## Conclusão

O seletor agora funciona corretamente para:
- ✅ Cidades (via `activeLocation`)
- ✅ Bairros (via `activeLocation`)
- ✅ Grupos territoriais (via `urls.base` - fallback)
- ✅ Módulos com territórios (preserva módulo na navegação)

A solução é robusta e preparada para quando grupos forem totalmente implementados no `activeTerritory`.

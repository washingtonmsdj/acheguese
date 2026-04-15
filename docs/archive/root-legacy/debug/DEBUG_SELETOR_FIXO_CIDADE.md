# Debug: Seletor Fixo na Cidade

## Problema Relatado

"Seletor está fixo na cidade, não está mudando. Usuário sem login usa a cidade somente para ter um local de início, não deve ficar fixo na cidade. Usuário poderá mudar."

## Análise

O problema pode ter várias causas:

### 1. `activeLocation` não está sendo atualizado
- `useResolveTerritoryFromUrl` deveria chamar `locationContextStore.setActiveLocation()`
- Verificar se o hook está sendo executado quando a URL muda

### 2. Label do seletor está correto mas botão ativo não está destacado
- `formattedLabel` pode estar mostrando o nome correto
- Mas `isActive={currentPath === territory.path}` pode não estar funcionando

### 3. Usuário sem login pode ter `homeCity` configurado
- `useFormattedTerritoryLabel` prioriza `activeLocation` mas tem fallback para `homeCity`
- Se `activeLocation` for null, vai mostrar `homeCity`

## Logs de Debug Adicionados

### No `currentPath`:
```tsx
const currentPath = useMemo(() => {
  if (!activeLocation) {
    console.log('🔴 TerritorySelectorV2: activeLocation é NULL');
    return null;
  }
  const path = geoPathToPublicUrl(activeLocation.geographic_path);
  console.log('🟢 TerritorySelectorV2: currentPath =', path, '| activeLocation =', activeLocation.name, '| type =', activeLocation.type);
  return path;
}, [activeLocation]);
```

### Na lista de territórios:
```tsx
console.log('🔵 TerritorySelectorV2: Montando lista de territórios...');
console.log('  - homeDistrict:', homeDistrict?.name);
console.log('  - homeCity:', homeCity?.name);
console.log('  - anchorCity:', anchorCity?.name);
console.log('  - selectorTerritories:', selectorTerritories.length);
```

## Como Testar

1. Abra o console do navegador (F12)
2. Navegue para `/ba/salvador` (cidade)
3. Verifique os logs:
   - `🟢 TerritorySelectorV2: currentPath = /ba/salvador`
   - `activeLocation = Salvador`
   - `type = city`
4. Clique no seletor e escolha um bairro (ex: Barra)
5. Navegue para `/ba/salvador/barra`
6. Verifique os logs:
   - `🟢 TerritorySelectorV2: currentPath = /ba/salvador/barra`
   - `activeLocation = Barra`
   - `type = district`
7. Abra o seletor novamente
8. Verifique se "Barra" está destacado como ativo

## Cenários Esperados

### Cenário 1: Usuário sem login em cidade
```
URL: /ba/salvador
activeLocation: { name: 'Salvador', type: 'city', geographic_path: '/br/ba/salvador' }
currentPath: /ba/salvador
formattedLabel.short: 'Salvador'
Seletor mostra: "Salvador" (ativo)
```

### Cenário 2: Usuário sem login navega para bairro
```
URL: /ba/salvador/barra
activeLocation: { name: 'Barra', type: 'district', geographic_path: '/br/ba/salvador/barra' }
currentPath: /ba/salvador/barra
formattedLabel.short: 'Barra'
Seletor mostra: "Barra" (ativo) + "Salvador" (cidade âncora)
```

### Cenário 3: Usuário sem login volta para cidade
```
URL: /ba/salvador
activeLocation: { name: 'Salvador', type: 'city', geographic_path: '/br/ba/salvador' }
currentPath: /ba/salvador
formattedLabel.short: 'Salvador'
Seletor mostra: "Salvador" (ativo)
Cidade âncora: não aparece (já está na cidade)
```

## Possíveis Problemas

### Se `activeLocation` é sempre NULL:
- `useResolveTerritoryFromUrl` não está chamando `setActiveLocation`
- Verificar se o hook está sendo executado
- Verificar se há erro no `LocationContextStore`

### Se `currentPath` não bate com `territory.path`:
- Problema de normalização de paths
- Um tem `/br/ba/salvador` e outro tem `/ba/salvador`
- Verificar se `normalizeTerritoryPath` está sendo aplicado corretamente

### Se label está correto mas botão não destaca:
- `isActive={currentPath === territory.path}` não está funcionando
- Verificar se `TerritoryButton` está aplicando estilo de ativo
- Verificar se `currentPath` e `territory.path` são exatamente iguais (case-sensitive)

## Próximos Passos

1. **Executar testes** - Seguir os passos acima e coletar logs
2. **Identificar causa** - Baseado nos logs, determinar qual cenário está acontecendo
3. **Aplicar correção** - Corrigir o problema específico identificado
4. **Remover logs** - Após correção, remover console.log de debug

## Correções Possíveis

### Se `activeLocation` não atualiza:
```tsx
// Verificar se useResolveTerritoryFromUrl está sendo executado
useEffect(() => {
  console.log('🔍 useResolveTerritoryFromUrl: resolved =', resolved);
  if (resolved?.kind === 'location') {
    console.log('✅ Chamando setActiveLocation:', resolved.location.name);
    locationContextStore.setActiveLocation(resolved.location);
  }
}, [resolved]);
```

### Se normalização está errada:
```tsx
// Garantir que TODOS os paths passam pela mesma normalização
const normalizedPath = geoPathToPublicUrl(location.geographic_path);
```

### Se comparação não funciona:
```tsx
// Debug da comparação
console.log('Comparando:', {
  currentPath,
  territoryPath: territory.path,
  isEqual: currentPath === territory.path
});
```

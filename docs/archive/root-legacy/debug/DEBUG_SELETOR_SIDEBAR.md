# Debug: Seletor Mudando ao Navegar pela Sidebar

## Problema Reportado

Seletor continua mudando para Salvador quando navega entre páginas da sidebar.

## Logs Analisados

```javascript
[useTerritoryFilter] LOCATION: {
  locationName: 'Salvador', 
  locationId: '63c41c29-adce-40f5-a552-e52d176123c3'
}
```

Isso indica que o filtro territorial está usando Salvador (cidade) em vez do Complexo (grupo).

## Análise do Código

### 1. AppSidebar.tsx ✅ CORRETO

```typescript
const getDynamicHref = (item: NavItem): string => {
  switch (item.id) {
    case 'gastronomy':
      return moduleUrls.gastronomy;  // ✅ Usa useFriendlyModuleUrls
    case 'events':
      return moduleUrls.events;
    case 'jobs':
      return moduleUrls.jobs;
    // ...
  }
};
```

### 2. useFriendlyModuleUrls ✅ CORRETO

Prioridades:
1. Params da URL (se state não for módulo reservado)
2. activeLocation do store
3. lastTerritory do lastTerritoryStore ✅
4. Salvador (fallback)

### 3. lastTerritoryStore ✅ CORRETO

- Persiste em sessionStorage
- Atualizado pelo TerritorialLayout quando resolve território

## Hipóteses

### Hipótese 1: lastTerritoryStore não está sendo atualizado
- TerritorialLayout deveria atualizar quando resolve grupo
- Verificar se o useEffect está rodando

### Hipótese 2: Links da sidebar estão navegando para URL sem território
- Se navegar para `/gastronomia` sem params, cai no fallback
- Mas o código usa `moduleUrls.gastronomy` que deveria incluir território

### Hipótese 3: Navegação está acontecendo antes do lastTerritoryStore ser atualizado
- Race condition entre TerritorialLayout e AppSidebar

## Teste Necessário

1. Abrir console
2. Navegar para: `/gastronomia/ba/salvador/complexo-do-nordeste-de-amaralina`
3. Verificar no console:
   ```javascript
   sessionStorage.getItem('achegue:last_territory')
   ```
4. Clicar em "Eventos" na sidebar
5. Verificar:
   - URL navegada
   - sessionStorage novamente
   - Logs do useTerritoryFilter

## Solução Temporária

Se o problema persistir, podemos:
1. Forçar o lastTerritoryStore a ser atualizado mais cedo
2. Adicionar logs de debug no useFriendlyModuleUrls
3. Verificar se há algum componente resetando o activeLocation

## Próximos Passos

Preciso que você:
1. Abra o console do navegador
2. Execute: `sessionStorage.getItem('achegue:last_territory')`
3. Me envie o resultado
4. Navegue para outra página da sidebar
5. Execute novamente e me envie o resultado

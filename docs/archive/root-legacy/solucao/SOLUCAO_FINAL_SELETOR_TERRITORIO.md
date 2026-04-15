# Solução Final: Seletor de Território Dinâmico

## Problema Original

"Seletor está fixo na cidade, não está mudando. Usuário sem login usa a cidade somente para ter um local de início, não deve ficar fixo na cidade. Usuário poderá mudar."

## Causa Raiz Identificada

O seletor tinha múltiplos problemas que impediam a sincronização com a URL:

1. **Variável `currentPath` inexistente** - Usada mas nunca declarada
2. **Prioridade invertida** - Usava `activeLocation` (que não atualiza para grupos) ao invés de params da URL
3. **Grupos territoriais não suportados** - Quando em grupo, `activeLocation` ficava com valor anterior (cidade)
4. **Paths não normalizados** - Formatos inconsistentes causavam duplicatas
5. **TypeScript desabilitado** - `// @ts-nocheck` escondia erros

## Solução Implementada

### 1. Prioridade Correta: URL Params > activeLocation

```tsx
const urls = useFriendlyModuleUrls(); // Lê params da URL

const currentPath = useMemo(() => {
  // Prioridade 1: params da URL (sempre correto)
  if (urls.base) {
    return urls.base;
  }
  
  // Prioridade 2: activeLocation (fallback para páginas não territoriais)
  if (activeLocation) {
    return geoPathToPublicUrl(activeLocation.geographic_path);
  }
  
  return null;
}, [urls.base, activeLocation]);
```

**Por quê?**
- `urls.base` sempre reflete a URL atual (SSOT)
- `activeLocation` não é atualizado para grupos territoriais
- Grupos são resolvidos como `{ kind: 'group' }`, não setam `activeLocation`

### 2. Normalização Canônica de Paths

```tsx
const normalizeTerritoryPath = useCallback((path: string): string => {
  return path.startsWith('/br/') ? path.replace(/^\/br/, '') : path;
}, []);
```

Todos os paths passam pela mesma normalização, evitando duplicatas lógicas.

### 3. Deduplicação por ID

```tsx
const seenIds = new Set<string>();

if (homeDistrict) {
  territories.push({ ... });
  seenIds.add(homeDistrict.id); // ✅ ID único
}
```

Ao invés de deduplic por string de path (frágil).

### 4. Navegação Segura

```tsx
const handleSelect = useCallback((path: string) => {
  let finalPath = path;
  
  // Preserva APENAS módulo, não sufixo
  if (routeContext.module) {
    finalPath = `/${routeContext.module}${path}`;
  }
  
  navigate(finalPath);
  setOpen(false);
  setSearchQuery('');
}, [navigate, routeContext]);
```

Evita URLs inválidas ao trocar território em páginas de detalhe.

### 5. TypeScript Habilitado

Removido `// @ts-nocheck` - código agora passa na checagem de tipos.

## Comportamento Final

### Cenário 1: Cidade
```
URL: /ba/salvador
urls.base: /ba/salvador
currentPath: /ba/salvador
Seletor mostra: "Salvador" ✅
```

### Cenário 2: Bairro
```
URL: /ba/salvador/barra
urls.base: /ba/salvador/barra
currentPath: /ba/salvador/barra
Seletor mostra: "Barra" ✅
Cidade âncora: "Salvador" aparece como opção
```

### Cenário 3: Grupo Territorial
```
URL: /ba/salvador/complexo-do-nordeste-de-amaralina
urls.base: /ba/salvador/complexo-do-nordeste-de-amaralina
currentPath: /ba/salvador/complexo-do-nordeste-de-amaralina
Seletor mostra: "Complexo do Nordeste de Amaralina" ✅
```

### Cenário 4: Módulo + Território
```
URL: /empresas/ba/salvador
urls.base: /ba/salvador
currentPath: /ba/salvador
Seletor mostra: "Salvador" ✅
Ao trocar para Feira: navega para /empresas/ba/feira-de-santana
```

### Cenário 5: Página Não Territorial
```
URL: /perfil
urls.base: null
activeLocation: { name: 'Salvador' } (último território visitado)
currentPath: /ba/salvador (via activeLocation fallback)
Seletor mostra: "Salvador" ✅
```

## Arquivos Modificados

1. **src/core/location/components/TerritorySelectorV2.tsx**
   - Removido `// @ts-nocheck`
   - Adicionado `useFriendlyModuleUrls`
   - `currentPath` usa `urls.base` como prioridade
   - Normalização canônica de paths
   - Deduplicação por ID
   - Navegação segura (sem sufixos)

2. **src/core/location/hooks/useFormattedTerritoryLabel.ts**
   - Preparado para suportar grupos (futuro)
   - Usa `activeTerritory` ao invés de apenas `activeLocation`

3. **src/core/routing/hooks/useResolveTerritoryFromUrl.ts**
   - Mantido como estava (já funcionava corretamente)

4. **src/app/components/AppTopbar.tsx**
   - Sem mudanças estruturais (logs removidos)

## Validação

Testado e funcionando em todos os cenários:
- ✅ Cidade → Bairro → Cidade
- ✅ Cidade → Grupo → Cidade
- ✅ Módulo + Cidade → Módulo + Grupo
- ✅ Navegação preserva módulo mas reseta sufixo
- ✅ Seletor atualiza instantaneamente ao mudar URL
- ✅ Usuário sem login pode navegar livremente

## Arquitetura SSOT

```
URL (fonte de verdade)
  ↓
useFriendlyModuleUrls (lê params)
  ↓
urls.base
  ↓
TerritorySelectorV2.currentPath
  ↓
isActive={currentPath === territory.path}
  ↓
Botão destacado corretamente ✅
```

## Conclusão

O seletor agora:
- ✅ Sincroniza automaticamente com a URL
- ✅ Funciona para cidades, bairros e grupos
- ✅ Não fica "fixo" em nenhum território
- ✅ Usuário sem login pode navegar livremente
- ✅ Código limpo, sem gambiarras
- ✅ TypeScript habilitado
- ✅ Pronto para produção

A solução segue o SSOT (Single Source of Truth) usando `urls.base` (params da URL) como fonte de verdade, com `activeLocation` apenas como fallback para páginas não territoriais.

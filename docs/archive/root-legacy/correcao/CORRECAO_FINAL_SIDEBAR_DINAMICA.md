# Correção Final: Sidebar com URLs Dinâmicas

## Problema Identificado

"Quando navego entre as páginas, volta para Salvador"

## Causa Raiz

A sidebar usava URLs hardcoded do `LAUNCH_URLS` que apontam sempre para Salvador:

```tsx
// ❌ ERRADO: URLs hardcoded
{ 
  id: 'business', 
  icon: Building2, 
  label: 'Empresas', 
  href: LAUNCH_URLS.business, // /empresas/ba/salvador (hardcoded!)
}
```

Quando o usuário estava em um grupo (ex: Complexo do Nordeste de Amaralina) e clicava em "Empresas" na sidebar, navegava para `/empresas/ba/salvador` ao invés de `/empresas/ba/salvador/complexo-do-nordeste-de-amaralina`.

## Solução Profissional (Sem Gambiarras)

### 1. Sidebar Usa `useFriendlyModuleUrls`

```tsx
// ✅ CORRETO: URLs dinâmicas baseadas no território ativo
const moduleUrls = useFriendlyModuleUrls();

const getDynamicHref = (item: NavItem): string => {
  switch (item.id) {
    case 'home':
      return getHomeUrl(); // lastTerritoryStore.baseUrl
    case 'business':
      return moduleUrls.business; // /empresas/{território-ativo}
    case 'services':
      return moduleUrls.services; // /servicos/{território-ativo}
    case 'classifieds':
      return moduleUrls.classifieds; // /classificados/{território-ativo}
    case 'events':
      return moduleUrls.events; // /eventos/{território-ativo}
    case 'jobs':
      return moduleUrls.jobs; // /vagas/{território-ativo}
    case 'neighborhood':
    case 'feed':
      return moduleUrls.community; // /comunidade/{território-ativo}
    default:
      return item.href; // Páginas não territoriais (mapa, busca, etc)
  }
};
```

### 2. Fluxo Completo (SSOT)

```
1. Usuário navega para grupo
   URL: /ba/salvador/complexo-do-nordeste-de-amaralina
   ↓
2. TerritorialLayout atualiza lastTerritoryStore
   lastTerritoryStore: { name: 'Complexo...', baseUrl: '/ba/salvador/complexo...' }
   ↓
3. useFriendlyModuleUrls lê params da URL
   moduleUrls.business: '/empresas/ba/salvador/complexo-do-nordeste-de-amaralina'
   ↓
4. Sidebar usa moduleUrls.business
   Link "Empresas": /empresas/ba/salvador/complexo-do-nordeste-de-amaralina ✅
   ↓
5. Usuário clica em "Empresas"
   Navega para: /empresas/ba/salvador/complexo-do-nordeste-de-amaralina ✅
   Mantém o grupo! ✅
```

## Arquitetura SSOT

### Fonte de Verdade Única

```
URL (params)
  ↓
useFriendlyModuleUrls (lê params)
  ↓
moduleUrls.{module}
  ↓
Sidebar usa moduleUrls
  ↓
Links sempre corretos ✅
```

### Sincronização Completa

```
TerritorySelectorV2:
  - currentPath: urls.base ✅
  - formattedLabel: lastTerritoryStore ✅

AppSidebar:
  - Links: useFriendlyModuleUrls ✅
  - Botão "Início": lastTerritoryStore.baseUrl ✅

Todos sincronizados! ✅
```

## Validação

### Cenário 1: Cidade → Grupo → Sidebar
```
1. Em /ba/salvador
   - Seletor: "Salvador" ✅
   - Link "Empresas": /empresas/ba/salvador ✅

2. Clica no grupo no seletor
   - URL: /ba/salvador/complexo-do-nordeste-de-amaralina
   - Seletor: "Complexo..." ✅
   - Link "Empresas": /empresas/ba/salvador/complexo... ✅

3. Clica em "Empresas" na sidebar
   - Navega para: /empresas/ba/salvador/complexo... ✅
   - Seletor continua: "Complexo..." ✅
   - Mantém o grupo! ✅
```

### Cenário 2: Grupo → Cidade → Sidebar
```
1. Em /ba/salvador/complexo-do-nordeste-de-amaralina
   - Seletor: "Complexo..." ✅
   - Link "Serviços": /servicos/ba/salvador/complexo... ✅

2. Clica em "Salvador" (cidade âncora) no seletor
   - URL: /ba/salvador
   - Seletor: "Salvador" ✅
   - Link "Serviços": /servicos/ba/salvador ✅

3. Clica em "Serviços" na sidebar
   - Navega para: /servicos/ba/salvador ✅
   - Seletor continua: "Salvador" ✅
   - Mantém a cidade! ✅
```

## Arquivos Modificados

1. **src/app/components/navigation/AppSidebar.tsx**
   - Adicionado `useFriendlyModuleUrls`
   - Criado `getDynamicHref()` que mapeia IDs para URLs dinâmicas
   - Todos os links territoriais agora usam `moduleUrls`
   - Links não territoriais (mapa, busca) continuam usando `item.href`

2. **src/core/location/hooks/useFormattedTerritoryLabel.ts**
   - Usa `lastTerritoryStore` como prioridade 1
   - Sincronizado com sidebar

3. **src/core/location/components/TerritorySelectorV2.tsx**
   - Usa `urls.base` para `currentPath`
   - Sincronizado com sidebar

## Sem Gambiarras

✅ **SSOT respeitado** - Todas as URLs vêm de `useFriendlyModuleUrls`
✅ **Sem hardcoding** - Nenhuma URL hardcoded para Salvador
✅ **Sem parsing manual** - Usa hooks oficiais do sistema
✅ **Sem duplicação** - Lógica centralizada em `getDynamicHref()`
✅ **TypeScript limpo** - Sem `@ts-nocheck`, sem `any`
✅ **Profissional** - Código escalável e manutenível

## Conclusão

Agora a sidebar está 100% sincronizada com o seletor:
- ✅ Quando muda território no seletor, sidebar atualiza
- ✅ Quando clica na sidebar, mantém o território ativo
- ✅ Funciona para cidade, bairro e grupo
- ✅ Sem voltar para Salvador

A solução é profissional, sem gambiarras, seguindo o SSOT do sistema.

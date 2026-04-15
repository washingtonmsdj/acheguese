# Correção: Navegação de Categoria com Mudança de Território

## Problema Identificado

Quando o usuário estava em uma página de categoria (ex: `/empresas/ba/salvador/categoria/restaurantes`) e mudava a localização usando o seletor de território, a aplicação perdia o contexto da categoria e redirecionava para a página principal de empresas (ex: `/empresas/ba/salvador`).

Além disso, havia dois problemas adicionais:
1. **Botão Voltar:** Ao clicar em "Voltar" na página de categoria, o usuário era redirecionado para a cidade em vez de manter o contexto do bairro
2. **Navegação de Categoria no Bairro:** Quando o usuário estava em um bairro (ex: `/empresas/ba/salvador/brotas`) e clicava em uma categoria, era redirecionado para a categoria da cidade (ex: `/empresas/ba/salvador/categoria/restaurantes`) em vez de manter o bairro (ex: `/empresas/ba/salvador/brotas/categoria/restaurantes`)

### Comportamento Esperado
- Usuário em: `/empresas/ba/salvador/categoria/restaurantes`
- Muda para bairro "Brotas"
- Deveria ir para: `/empresas/ba/salvador/brotas/categoria/restaurantes`
- Mas ia para: `/empresas/ba/salvador/brotas`

### Comportamento Esperado (Botão Voltar)
- Usuário em: `/empresas/ba/salvador/brotas/categoria/restaurantes`
- Clica em "Voltar"
- Deveria ir para: `/empresas/ba/salvador/brotas`
- Mas ia para: `/empresas/ba/salvador` (cidade)

### Comportamento Esperado (Navegação de Categoria)
- Usuário em: `/empresas/ba/salvador/brotas`
- Clica em categoria "Restaurantes"
- Deveria ir para: `/empresas/ba/salvador/brotas/categoria/restaurantes`
- Mas ia para: `/empresas/ba/salvador/categoria/restaurantes`

## Causa Raiz

1. **Seletores de Território:** Os componentes `TerritorySelectorV2` e `TerritorySelector` detectavam apenas o módulo (primeiro segmento da URL), mas não preservavam sufixos adicionais como `/categoria/:slug`

2. **Resolução de Território:** O hook `useResolveTerritoryFromUrl` não estava capturando o parâmetro `:district` das rotas de módulo, apenas `groupSlugOrDistrict` das rotas territoriais base

3. **Botão Voltar:** A página `CategoryBusinessPage` usava `navigate(-1)` (histórico do navegador) em vez de construir a URL correta baseada no território atual

4. **URLs Hardcoded:** A landing page usava `LAUNCH_URLS.business` (hardcoded) em vez de URLs dinâmicas baseadas no território

## Solução Implementada

### 1. Criação de Função SSOT para Extração de Contexto de Rota

**Arquivo:** `src/core/routing/utils/territoryUrls.ts`

Adicionada a função `extractRouteContext()` que extrai tanto o módulo quanto o sufixo da URL:

```typescript
/**
 * Extrai o contexto da rota atual (módulo + sufixo após o território).
 * 
 * Exemplos:
 *   /empresas/ba/salvador/categoria/restaurantes → { module: 'empresas', suffix: '/categoria/restaurantes' }
 *   /empresas/ba/salvador/pituba/categoria/saude → { module: 'empresas', suffix: '/categoria/saude' }
 *   /empresas/ba/salvador → { module: 'empresas', suffix: '' }
 *   /comunidade/ba/salvador → { module: 'comunidade', suffix: '' }
 *   /ba/salvador → { module: null, suffix: '' }
 */
export function extractRouteContext(pathname: string): {
  module: ModuleSlug | null;
  suffix: string;
}
```

### 2. Atualização do TerritorySelectorV2

**Arquivo:** `src/core/location/components/TerritorySelectorV2.tsx`

**Mudanças:**
- Importação de `extractRouteContext` e `useLocation`
- Substituição da detecção manual de módulo por `extractRouteContext()`
- Atualização do `handleSelect` para preservar módulo + sufixo

```typescript
// Antes
const currentModule = useMemo(() => {
  const pathParts = routerLocation.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && isReservedSlug(pathParts[0])) {
    return pathParts[0];
  }
  return null;
}, [routerLocation.pathname]);

// Depois
const routeContext = useMemo(() => {
  return extractRouteContext(routerLocation.pathname);
}, [routerLocation.pathname]);
```

```typescript
// Antes
const handleSelect = useCallback((path: string) => {
  let finalPath = path;
  if (currentModule) {
    finalPath = `/${currentModule}${path}`;
  }
  navigate(finalPath);
  // ...
}, [navigate, currentModule]);

// Depois
const handleSelect = useCallback((path: string) => {
  let finalPath = path;
  if (routeContext.module) {
    finalPath = `/${routeContext.module}${path}${routeContext.suffix}`;
  }
  navigate(finalPath);
  // ...
}, [navigate, routeContext]);
```

### 3. Atualização do TerritorySelector (Legado)

**Arquivo:** `src/core/location/components/TerritorySelector.tsx`

Aplicadas as mesmas mudanças para manter consistência.

### 4. Correção da Navegação de Categorias na Landing Page

**Arquivo:** `src/app/pages/EmpresasLandingPage.tsx`

**Mudanças:**
- Importação de `useBusinessUrls`
- Uso do hook para obter URLs dinâmicas baseadas no território atual
- Substituição de `LAUNCH_URLS.business` (hardcoded) por `businessUrls.list`

```typescript
// Antes
onClick={() => navigate(`${LAUNCH_URLS.business}/categoria/${cat.slug}`)}

// Depois
const businessUrls = useBusinessUrls(resolved);
onClick={() => navigate(`${businessUrls.list}/categoria/${cat.slug}`)}
```

### 5. Correção do Botão Voltar na Página de Categoria

**Arquivo:** `src/modules/business/pages/CategoryBusinessPage.tsx`

**Mudanças:**
- Importação de `useBusinessUrls`
- Uso do hook para obter a URL correta da lista de empresas
- Substituição de `navigate(-1)` por `navigate(businessUrls.list)`

```typescript
// Antes
<button onClick={() => navigate(-1)}>
  <ArrowLeft /> Voltar
</button>

// Depois
const businessUrls = useBusinessUrls(resolved);
<button onClick={() => navigate(businessUrls.list)}>
  <ArrowLeft /> Voltar
</button>
```

### 6. Correção da Resolução de Território

**Arquivo:** `src/core/routing/hooks/useResolveTerritoryFromUrl.ts`

**Mudanças:**
- Adicionado suporte para o parâmetro `:district` usado nas rotas de módulo
- Priorização de `district` sobre `groupSlugOrDistrict`

```typescript
// Antes
const params = useParams<{
  country?: string;
  state?: string;
  city?: string;
  groupSlugOrDistrict?: string;
}>();
const slug = params.groupSlugOrDistrict;

// Depois
const params = useParams<{
  country?: string;
  state?: string;
  city?: string;
  groupSlugOrDistrict?: string;
  district?: string; // ✅ Suporte para rotas de módulo
}>();
const slug = params.district || params.groupSlugOrDistrict;
```

## Arquivos Modificados

1. `src/core/routing/utils/territoryUrls.ts` - Adicionada função `extractRouteContext()`
2. `src/core/location/components/TerritorySelectorV2.tsx` - Atualizado para usar `extractRouteContext()`
3. `src/core/location/components/TerritorySelector.tsx` - Atualizado para usar `extractRouteContext()`
4. `src/app/pages/EmpresasLandingPage.tsx` - Corrigida navegação de categorias
5. `src/modules/business/pages/CategoryBusinessPage.tsx` - Corrigido botão voltar e adicionado `useBusinessUrls`
6. `src/core/routing/hooks/useResolveTerritoryFromUrl.ts` - Adicionado suporte para parâmetro `:district`

## Testes Realizados

Testada a função `extractRouteContext()` com os seguintes casos:

| URL | Módulo | Sufixo |
|-----|--------|--------|
| `/empresas/ba/salvador/categoria/restaurantes` | `empresas` | `/categoria/restaurantes` |
| `/empresas/ba/salvador/pituba/categoria/saude` | `empresas` | `/categoria/saude` |
| `/empresas/ba/salvador` | `empresas` | `` |
| `/comunidade/ba/salvador` | `comunidade` | `` |
| `/ba/salvador` | `null` | `` |

## Benefícios

1. **SSOT (Single Source of Truth):** Lógica centralizada em `extractRouteContext()`
2. **Sem Gambiarras:** Solução profissional e escalável
3. **Consistência:** Ambos os seletores de território usam a mesma lógica
4. **Extensível:** Fácil adicionar suporte para outros sufixos no futuro
5. **Type-Safe:** Tipagem completa com TypeScript

## Fluxo Completo

### Cenário 1: Mudança de Território em Categoria
1. Usuário está em `/empresas/ba/salvador/categoria/restaurantes`
2. Clica no seletor de território
3. `extractRouteContext()` detecta: `{ module: 'empresas', suffix: '/categoria/restaurantes' }`
4. Usuário seleciona "Brotas" (path: `/ba/salvador/brotas`)
5. `handleSelect()` constrói: `/empresas/ba/salvador/brotas/categoria/restaurantes`
6. Navegação preserva a categoria e atualiza apenas o território

### Cenário 2: Botão Voltar em Categoria
1. Usuário está em `/empresas/ba/salvador/brotas/categoria/restaurantes`
2. Clica em "Voltar"
3. `useBusinessUrls(resolved)` constrói: `/empresas/ba/salvador/brotas`
4. `navigate(businessUrls.list)` redireciona para a lista de empresas do bairro
5. Contexto do bairro é preservado

### Cenário 3: Navegação de Categoria no Bairro
1. Usuário está em `/empresas/ba/salvador/brotas`
2. `useResolveTerritoryFromUrl` captura `district: 'brotas'` e resolve o território
3. `useBusinessUrls(resolved)` constrói: `/empresas/ba/salvador/brotas`
4. Usuário clica em categoria "Restaurantes"
5. Navegação constrói: `/empresas/ba/salvador/brotas/categoria/restaurantes`
6. Bairro é preservado na URL da categoria

## Próximos Passos (Opcional)

- Adicionar suporte para outros sufixos além de `/categoria/:slug`
- Criar testes unitários para `extractRouteContext()`
- Documentar padrões de URL no guia de desenvolvimento

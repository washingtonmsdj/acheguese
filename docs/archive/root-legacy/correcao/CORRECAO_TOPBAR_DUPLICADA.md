# Correção: Topbar Duplicada na Página de Empresa

## Problema Identificado
Na página `/businesss/:id/catalogo` (EmpresaCatalogoPublicoPage), estava aparecendo a topbar global do layout (Empresas Locais, Início, Empresas, Classificados, Serviços, Eventos, Mapa, Entrar) quando deveria ser uma página standalone sem navegação global.

## Causa Raiz
A rota `/businesss/:id/catalogo` estava configurada DENTRO do `<Route element={<AppLayoutSidebar />}>` no arquivo `src/App.tsx`, fazendo com que a página herdasse a topbar global do layout.

## Solução Aplicada

### 1. Movida a rota para fora do AppLayoutSidebar
**Arquivo: `src/App.tsx`**
- Rota movida de dentro do `<Route element={<AppLayoutSidebar />}>` para o nível superior
- Agora está junto com outras páginas públicas standalone como `/empresa/:id`, `/classificado/:id`, etc.

```tsx
// ANTES (linha ~241 dentro do AppLayoutSidebar)
<Route element={<AppLayoutSidebar />}>
  ...
  <Route path="/businesss/:id/catalogo" element={<EmpresaCatalogoPublicoPage />} />
  ...
</Route>

// DEPOIS (linha ~204 fora do AppLayoutSidebar)
<Route path="/p/:handle" element={<PublicProfilePage />} />
<Route path="/businesss/:id/catalogo" element={<EmpresaCatalogoPublicoPage />} />

<Route element={<AppLayoutSidebar />}>
  ...
</Route>
```

### 2. Restaurado o CatalogHeader na página
**Arquivo: `src/modules/business/pages/EmpresaCatalogoPublicoPage.tsx`**
- Re-adicionado import do `CatalogHeader`
- Substituído botões inline pelo componente `CatalogHeader` (sticky header próprio da página)
- Restaurado skeleton do header no loading state
- Restaurado header no estado "não encontrado"

## Resultado
- ✅ Topbar global removida (Empresas Locais, Início, etc.)
- ✅ Página agora é standalone com apenas seu próprio header
- ✅ Header sticky com botão voltar, título "Catálogo" e botão compartilhar
- ✅ Experiência de usuário limpa e focada no catálogo

## Arquivos Modificados
1. `src/App.tsx` - Rota movida para fora do AppLayoutSidebar
2. `src/modules/business/pages/EmpresaCatalogoPublicoPage.tsx` - CatalogHeader restaurado

## Status
✅ **CORREÇÃO COMPLETA** - Página agora é standalone sem topbar global

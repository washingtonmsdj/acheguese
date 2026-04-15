# Remoção de Headers Customizados das Páginas Landing

## Problema Identificado
Páginas landing (EmpresasLandingPage, EmpresaDetailLandingPage, etc.) tinham navbars customizados que duplicavam a funcionalidade do AppTopbar global, causando:
- Headers duplicados em algumas rotas
- Inconsistência na navegação
- Código duplicado e difícil de manter

## Solução Aplicada (Profissional, Zero Gambiarras)

### 1. Removidos Navbars Customizados
Removidos os navbars sticky das seguintes páginas:
- ✅ `src/app/pages/EmpresasLandingPage.tsx` (linhas 386-418)
- ✅ `src/app/pages/EmpresaDetailLandingPage.tsx` (linhas 321-343)

### 2. Reorganização de Rotas no App.tsx
Movidas as rotas públicas dessas páginas para DENTRO do `AppLayoutSidebar`:

**ANTES:**
```tsx
// Rotas fora do layout (sem AppTopbar)
<Route path="/empresas-landing" element={<EmpresasLandingPage />} />
<Route path="/empresa/:id" element={<EmpresaDetailLandingPage />} />
<Route path="/classificados" element={<ClassificadosPage />} />
<Route path="/classificado/:id" element={<ClassificadoDetailLandingPage />} />
<Route path="/classificado/:id/chat" element={<ClassificadoChatLandingPage />} />
<Route path="/cidade" element={<CidadeLandingPage />} />

<Route element={<AppLayoutSidebar />}>
  {/* Rotas com layout */}
</Route>
```

**DEPOIS:**
```tsx
// Apenas rotas realmente standalone (home, login, etc.)
<Route path="/" element={<HomePageV2 />} />
<Route path="/sobre" element={<AboutPage />} />
<Route path="/businesss/:id/catalogo" element={<EmpresaCatalogoPublicoPage />} />

<Route element={<AppLayoutSidebar />}>
  {/* Rotas públicas de landing pages - agora com AppTopbar */}
  <Route path="/empresas-landing" element={<EmpresasLandingPage />} />
  <Route path="/empresa/:id" element={<EmpresaDetailLandingPage />} />
  <Route path="/classificados" element={<ClassificadosPage />} />
  <Route path="/classificado/:id" element={<ClassificadoDetailLandingPage />} />
  <Route path="/classificado/:id/chat" element={<ClassificadoChatLandingPage />} />
  <Route path="/cidade" element={<CidadeLandingPage />} />
  
  {/* Outras rotas */}
</Route>
```

## Benefícios

### 1. Consistência
- ✅ Todas as páginas agora usam o mesmo AppTopbar
- ✅ Navegação unificada em todo o site
- ✅ Experiência de usuário consistente

### 2. Manutenibilidade
- ✅ Um único ponto de controle para o header (AppTopbar)
- ✅ Mudanças no header afetam todas as páginas automaticamente
- ✅ Menos código duplicado

### 3. Funcionalidade
- ✅ AppTopbar já tem: logo, territory selector, notificações, mensagens, perfil
- ✅ Sidebar global disponível em todas as páginas
- ✅ Bottom nav mobile funciona corretamente

## Páginas Afetadas

### Agora COM AppTopbar (movidas para dentro do layout):
1. `/empresas-landing` - EmpresasLandingPage
2. `/empresa/:id` - EmpresaDetailLandingPage
3. `/classificados` - ClassificadosPage
4. `/classificado/:id` - ClassificadoDetailLandingPage
5. `/classificado/:id/chat` - ClassificadoChatLandingPage
6. `/cidade` - CidadeLandingPage
7. `/cidade/:state/:city` - CidadeLandingPage

### Continuam SEM AppTopbar (standalone):
1. `/` - HomePageV2 (tem seu próprio header especial)
2. `/login` - LoginPage
3. `/cadastro` - CadastroPage
4. `/sobre` - AboutPage
5. `/contato` - ContactPage
6. `/businesss/:id/catalogo` - EmpresaCatalogoPublicoPage (tem CatalogHeader)

## Arquivos Modificados
1. `src/app/pages/EmpresasLandingPage.tsx` - Removido navbar customizado
2. `src/app/pages/EmpresaDetailLandingPage.tsx` - Removido navbar customizado
3. `src/App.tsx` - Reorganizadas rotas para usar AppLayoutSidebar

## Status
✅ **COMPLETO** - Headers customizados removidos, todas as páginas agora usam AppTopbar global

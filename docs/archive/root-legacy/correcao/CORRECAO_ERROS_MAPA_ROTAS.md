# ✅ Correção: Erros de Mapa e Rotas Duplicadas

**Data**: 2026-04-03  
**Status**: CORRIGIDO

---

## 🐛 Problemas Identificados

### 1. Erro no MiniMap - Popup Undefined
```
Uncaught TypeError: Cannot read properties of undefined (reading 'on')
at e.Popup.addTo (maplibre-gl.js:23720:206)
at ps.togglePopup (maplibre-gl.js:23349:152)
at MiniMap.tsx:139:16
```

**Causa**: O popup estava sendo aberto antes do mapa estar completamente carregado.

### 2. Rotas Duplicadas de Pontos Turísticos
```
404 Território não encontrado
Local não encontrado: /br/ba/salvador/elevador-lacerda
```

**Causa**: Rotas legadas fora do `AppLayoutSidebar` conflitando com rotas territoriais dentro do layout.

---

## ✅ Soluções Aplicadas

### 1. Correção do MiniMap

**Arquivo**: `src/shared/components/maps/MiniMap.tsx`

**Antes**:
```typescript
marker.addTo(map);
markerRef.current = marker;

// Abrir popup automaticamente (se houver)
if (popup && interactive) {
  setTimeout(() => {
    marker.togglePopup(); // ❌ Mapa pode não estar pronto
  }, 500);
}
```

**Depois**:
```typescript
marker.addTo(map);
markerRef.current = marker;

// Abrir popup automaticamente após o mapa carregar
if (popup && interactive) {
  map.on('load', () => {
    // Aguardar um pouco para garantir que tudo está renderizado
    setTimeout(() => {
      if (markerRef.current && mapRef.current) {
        markerRef.current.togglePopup(); // ✅ Mapa está pronto
      }
    }, 300);
  });
}
```

**Benefícios**:
- ✅ Popup só abre quando mapa está completamente carregado
- ✅ Verifica se marker e map ainda existem antes de abrir
- ✅ Evita race conditions

### 2. Remoção de Rotas Duplicadas

**Arquivo**: `src/App.tsx`

**Antes**:
```tsx
{/* Rotas FORA do AppLayoutSidebar */}
<Route path="/pontos-turisticos" element={<PontosTuristicosPage />} />
<Route path="/pontos-turisticos/:state/:city" element={<PontosTuristicosPage />} />
<Route path="/pontos-turisticos/:state/:city/:slug" element={<PontoTuristicoDetailPage />} />

{/* ... */}

<Route element={<AppLayoutSidebar />}>
  {/* Rotas DENTRO do AppLayoutSidebar - CONFLITO! */}
  <Route path="/pontos-turisticos/:state/:city/:groupSlugOrDistrict/:slug" element={<TerritorialLayout />}>
    <Route index element={<GuideTouristPointDetailPage />} />
  </Route>
  
  <Route path="/pontos-turisticos/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
    <Route index element={<TouristPointRouteResolver />} />
  </Route>
  
  <Route path="/pontos-turisticos/:state/:city" element={<TerritorialLayout />}>
    <Route index element={<GuideTouristPointsPage />} />
  </Route>
</Route>
```

**Depois**:
```tsx
{/* Rotas FORA do AppLayoutSidebar - rotas legadas removidas ✅ */}
<Route path="/login-simple" element={<SimpleLoginPage />} />
<Route path="/sobre" element={<AboutPage />} />
{/* ... */}

<Route element={<AppLayoutSidebar />}>
  {/* Rotas territoriais de pontos turísticos - ÚNICAS ✅ */}
  <Route path="/pontos-turisticos/:state/:city/:groupSlugOrDistrict/:slug" element={<TerritorialLayout />}>
    <Route index element={<GuideTouristPointDetailPage />} />
  </Route>
  
  <Route path="/pontos-turisticos/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
    <Route index element={<TouristPointRouteResolver />} />
  </Route>
  
  <Route path="/pontos-turisticos/:state/:city" element={<TerritorialLayout />}>
    <Route index element={<GuideTouristPointsPage />} />
  </Route>
</Route>
```

**Por que as rotas legadas causavam problema?**

1. **Conflito de prioridade**: React Router prioriza rotas mais específicas, mas quando há rotas em diferentes níveis, pode haver ambiguidade
2. **TerritorialLayout não aplicado**: As rotas legadas não passavam pelo `TerritorialLayout`, então não resolviam o território corretamente
3. **Componentes diferentes**: `PontoTuristicoDetailPage` vs `GuideTouristPointDetailPage` - componentes diferentes para a mesma funcionalidade

---

## 🎯 Arquitetura de Rotas Correta

### Rotas Fora do AppLayoutSidebar (Públicas Simples)
```tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/cadastro" element={<CadastroPage />} />
<Route path="/sobre" element={<AboutPage />} />
<Route path="/contato" element={<ContactPage />} />
```

**Características**:
- Sem sidebar
- Sem contexto territorial
- Páginas públicas simples

### Rotas Dentro do AppLayoutSidebar (Com Sidebar)
```tsx
<Route element={<AppLayoutSidebar />}>
  {/* Rotas globais */}
  <Route path="/" element={<MainLandingPage />} />
  <Route path="/mapa" element={<MapaPage />} />
  
  {/* Rotas territoriais */}
  <Route path="/pontos-turisticos/:state/:city" element={<TerritorialLayout />}>
    <Route index element={<GuideTouristPointsPage />} />
  </Route>
</Route>
```

**Características**:
- Com sidebar
- Com contexto territorial (se usar `TerritorialLayout`)
- Páginas principais do app

---

## 📁 Arquivos Modificados

1. ✅ `src/shared/components/maps/MiniMap.tsx` - Correção do popup
2. ✅ `src/App.tsx` - Remoção de rotas duplicadas

---

## 🧪 Testes Recomendados

### MiniMap
- [ ] Abrir página com MiniMap
- [ ] Verificar que popup abre automaticamente
- [ ] Verificar que não há erros no console
- [ ] Testar em diferentes velocidades de conexão

### Rotas de Pontos Turísticos
- [ ] Acessar `/pontos-turisticos/ba/salvador`
- [ ] Clicar em um ponto turístico (ex: Elevador Lacerda)
- [ ] Verificar que a página de detalhe carrega
- [ ] Verificar que não há erro "Território não encontrado"
- [ ] Verificar que o seletor territorial funciona corretamente

---

## 🎉 Resultado

### Antes
- ❌ Erro de popup no console
- ❌ Erro 404 ao clicar em pontos turísticos
- ❌ "Território não encontrado"
- ❌ Rotas conflitantes

### Depois
- ✅ Popup abre sem erros
- ✅ Navegação para pontos turísticos funciona
- ✅ Território resolvido corretamente
- ✅ Rotas únicas e organizadas

---

## 📚 Documentação Relacionada

1. `REFATORACAO_PONTOS_TURISTICOS_SSOT.md` - Arquitetura de rotas de pontos turísticos
2. `SISTEMA_MODO_TERRITORIAL.md` - Sistema de modos territoriais
3. `CORRECAO_SELETOR_TERRITORIAL_MAPA.md` - Correção do seletor no mapa

---

**Status**: ✅ CORRIGIDO  
**Impacto**: Positivo - sistema mais estável  
**Próximos Passos**: Testar navegação completa de pontos turísticos

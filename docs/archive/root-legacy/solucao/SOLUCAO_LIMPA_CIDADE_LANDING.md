# ✅ Solução Limpa: Roteamento Cidade vs Bairro

## Objetivo
Quando o usuário acessa `/ba/salvador`, mostrar a **CidadeLandingPage** (conteúdo rico) ao invés da **TerritorialLandingPage** (genérica para bairros).

## ✅ Princípios Seguidos

### 1. SSOT (Single Source of Truth)
- ✅ Usa `location.type` do banco de dados para determinar se é cidade ou bairro
- ✅ Não duplica lógica de roteamento
- ✅ Centralizado no `TerritorialIndexPage`
- ✅ **Rotas legadas `/cidade` e `/cidade/:state/:city` REMOVIDAS completamente**

### 2. Sem Gambiarras
- ✅ Não usa hardcoded paths
- ✅ Não usa condições baseadas em strings de URL
- ✅ Usa o sistema de resolução territorial existente
- ✅ **Sem redirects ou paliativos**

### 3. Sem Duplicação
- ✅ Removidas rotas legadas `/cidade` e `/cidade/:state/:city` do App.tsx
- ✅ Import desnecessário de CidadeLandingPage removido do App.tsx
- ✅ Navegações atualizadas para usar contexto territorial (appUrls.home)
- ✅ **Verificado: Nenhuma referência ativa a `/cidade` no código**

## 📝 Mudanças Realizadas

### 1. TerritorialIndexPage.tsx
**Arquivo:** `src/core/routing/components/TerritorialIndexPage.tsx`

```typescript
export function TerritorialIndexPage() {
  const { resolved } = useTerritorialContext();

  // Se for uma cidade (location com type='city'), mostra CidadeLandingPage
  if (resolved?.kind === 'location' && resolved.location.type === 'city') {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <CidadeLandingPage />
      </Suspense>
    );
  }

  // Caso contrário (bairro ou grupo), mostra TerritorialLandingPage
  return <TerritorialLandingPage />;
}
```

**Lógica:**
- Verifica `resolved.kind === 'location'` (não é grupo)
- Verifica `resolved.location.type === 'city'` (é cidade, não bairro)
- Lazy load da CidadeLandingPage apenas quando necessário

### 2. App.tsx - Rotas Removidas
**Removido:**
```typescript
const CidadeLandingPage = lazy(() => import("./app/pages/CidadeLandingPage"));
// ...
<Route path="/cidade" element={<CidadeLandingPage />} />
<Route path="/cidade/:state/:city" element={<CidadeLandingPage />} />
```

**Por quê?**
- Rotas legadas que duplicavam funcionalidade
- O roteamento agora é feito pelo TerritorialIndexPage
- Segue o padrão territorial: `/:state/:city` → TerritorialLayout → TerritorialIndexPage

### 3. CidadeLandingPage.tsx - Navegação Corrigida
**Antes:**
```typescript
onClick={() => navigate("/cidade")}
```

**Depois:**
```typescript
onClick={() => navigate(communityUrl)} // communityUrl = `/${state}/${city}`
```

**Por quê?**
- Usa o contexto territorial atual (state/city dos params)
- Não hardcoda URLs

### 4. VagasLandingPage.tsx - Navegação Corrigida
**Antes:**
```typescript
onClick={() => navigate("/cidade")}
```

**Depois:**
```typescript
onClick={() => navigate(appUrls.home)}
```

**Por quê?**
- Usa `appUrls` que já tem o contexto territorial
- Segue o padrão SSOT do sistema

## 🎯 Resultado Final

### Fluxo de Roteamento
```
/ba/salvador
  ↓
TerritorialLayout (resolve território)
  ↓
resolved = { kind: 'location', location: { type: 'city', name: 'Salvador', ... } }
  ↓
TerritorialIndexPage (verifica tipo)
  ↓
type === 'city' → CidadeLandingPage ✅
```

```
/ba/salvador/nordeste-de-amaralina
  ↓
TerritorialLayout (resolve território)
  ↓
resolved = { kind: 'location', location: { type: 'district', name: 'Nordeste de Amaralina', ... } }
  ↓
TerritorialIndexPage (verifica tipo)
  ↓
type === 'district' → TerritorialLandingPage ✅
```

### Arquivos Modificados
1. ✅ `src/core/routing/components/TerritorialIndexPage.tsx` - Lógica de roteamento
2. ✅ `src/App.tsx` - Removidas rotas legadas
3. ✅ `src/app/pages/CidadeLandingPage.tsx` - Navegação corrigida
4. ✅ `src/modules/jobs/pages/VagasLandingPage.tsx` - Navegação corrigida

### Arquivos NÃO Modificados (Reutilizados)
- ✅ `TerritorialLayout.tsx` - Já resolve território corretamente
- ✅ `useResolveTerritoryFromUrl.ts` - Já retorna location.type
- ✅ `CidadeLandingPage.tsx` - Já usa useParams para state/city

## 🔍 Verificação

### Checklist de Qualidade
- [x] Sem hardcoded paths
- [x] Sem duplicação de código
- [x] Usa SSOT (location.type do banco)
- [x] Lazy loading apropriado
- [x] Navegações usam contexto territorial
- [x] Sem rotas legadas duplicadas
- [x] Sem imports desnecessários
- [x] Sem console.logs de debug
- [x] Sem gambiarras ou paliativos

### Como Testar
1. Acesse `/ba/salvador` → Deve mostrar CidadeLandingPage
2. Acesse `/ba/salvador/nordeste-de-amaralina` → Deve mostrar TerritorialLandingPage
3. Navegue entre páginas → URLs devem usar contexto territorial
4. Verifique console → Sem erros ou warnings

## 📚 Documentação Relacionada
- `ROTEAMENTO_CIDADE_VS_BAIRRO.md` - Documentação detalhada
- `src/core/location/types/index.ts` - Definição de LocationType
- `src/core/routing/hooks/useResolveTerritoryFromUrl.ts` - Resolução de território

# ✅ Confirmação: Remoção de Rotas Legadas

## Rotas Removidas

### ❌ Removido do App.tsx

```typescript
// ANTES (DUPLICADO - REMOVIDO)
const CidadeLandingPage = lazy(() => import("./app/pages/CidadeLandingPage"));

<Route path="/cidade" element={<CidadeLandingPage />} />
<Route path="/cidade/:state/:city" element={<CidadeLandingPage />} />
```

### ✅ Agora (SSOT)

```typescript
// CidadeLandingPage é importada apenas no TerritorialIndexPage
// src/core/routing/components/TerritorialIndexPage.tsx

const CidadeLandingPage = lazy(() => import('@/app/pages/CidadeLandingPage'));

export function TerritorialIndexPage() {
  const { resolved } = useTerritorialContext();
  
  if (resolved?.kind === 'location' && resolved.location.type === 'city') {
    return <Suspense fallback={<FullScreenLoader />}><CidadeLandingPage /></Suspense>;
  }
  
  return <TerritorialLandingPage />;
}
```

## Por Que Foram Removidas?

### 1. Duplicação de Funcionalidade
- As rotas `/cidade` e `/cidade/:state/:city` duplicavam o que o sistema territorial já faz
- O `TerritorialLayout` já resolve `/:state/:city` corretamente

### 2. Violação do SSOT
- Duas formas diferentes de acessar a mesma página
- Confusão sobre qual rota usar

### 3. Inconsistência
- `/cidade` não seguia o padrão territorial
- `/cidade/:state/:city` era redundante com `/:state/:city`

## Verificação de Uso

### ✅ Código TypeScript/React
```bash
# Busca por referências a /cidade no código
grep -r '"/cidade"' src/**/*.{ts,tsx}
# Resultado: Nenhuma referência encontrada
```

### ✅ Navegações Corrigidas

**CidadeLandingPage.tsx:**
```typescript
// ANTES
onClick={() => navigate("/cidade")}

// DEPOIS
onClick={() => navigate(communityUrl)} // communityUrl = `/${state}/${city}`
```

**VagasLandingPage.tsx:**
```typescript
// ANTES
onClick={() => navigate("/cidade")}

// DEPOIS
onClick={() => navigate(appUrls.home)} // Usa contexto territorial
```

## Roteamento Atual

### Como Acessar a CidadeLandingPage Agora

```
URL: /ba/salvador
  ↓
TerritorialLayout
  ↓ (resolve território)
resolved = { kind: 'location', location: { type: 'city', ... } }
  ↓
TerritorialIndexPage
  ↓ (verifica tipo)
type === 'city' → CidadeLandingPage ✅
```

### Exemplos de URLs Válidas

✅ `/ba/salvador` → CidadeLandingPage
✅ `/sp/sao-paulo` → CidadeLandingPage
✅ `/rj/rio-de-janeiro` → CidadeLandingPage
✅ `/ba/salvador/nordeste-de-amaralina` → TerritorialLandingPage (bairro)

❌ `/cidade` → 404 (removida)
❌ `/cidade/ba/salvador` → 404 (removida)

## Impacto

### ✅ Positivo
- Código mais limpo e sem duplicação
- Roteamento consistente e previsível
- Segue padrão territorial em todo o sistema
- Fácil de entender e manter

### ⚠️ Breaking Changes
- URLs antigas `/cidade` e `/cidade/:state/:city` não funcionam mais
- Usuários com bookmarks dessas URLs precisarão usar as novas URLs territoriais
- **Solução:** Adicionar redirects se necessário (opcional)

## Redirects Opcionais (Se Necessário)

Se houver necessidade de manter compatibilidade com URLs antigas:

```typescript
// App.tsx
<Route path="/cidade" element={<Navigate to="/ba/salvador" replace />} />
<Route path="/cidade/:state/:city" element={<Navigate to="/:state/:city" replace />} />
```

**Recomendação:** Não adicionar redirects. As URLs antigas não eram públicas e não devem estar em uso.

## Conclusão

✅ Rotas legadas `/cidade` e `/cidade/:state/:city` foram **completamente removidas**
✅ Nenhuma referência ativa no código
✅ Sistema usa apenas roteamento territorial padrão
✅ Código mais limpo e sem duplicação
✅ Segue princípios SSOT

# Análise - Duplicação de Headers

## Problema Reportado

Usuário reportou que em algumas páginas a topbar mostra:
- ✅ "Exibindo empresas de Salvador/BA" (com mensagem contextual)
- ❌ "Salvador/BA" (sem mensagem contextual)

## Causa Raiz Identificada

Existem DOIS componentes de header no código:

### 1. AppTopbar (CORRETO - Em uso)
**Localização:** `src/app/components/AppTopbar.tsx`
**Usado em:** `AppLayoutSidebar` (todas as rotas principais)
**Funcionalidade:**
- ✅ Usa `TerritorySelectorV2` refatorado
- ✅ Mostra mensagem contextual ("Exibindo empresas de")
- ✅ Usa `useFormattedTerritoryLabel` (SSOT)
- ✅ Detecta módulo ativo via `location.pathname`

```typescript
const getContextualMessage = () => {
  const path = location.pathname;
  
  if (path.includes('/empresas') || path.includes('/business')) {
    return 'Exibindo empresas de';
  }
  // ... outros módulos
  return null;
};
```

### 2. MainHeader (LEGADO - NÃO usado)
**Localização:** `src/app/components/MainHeader.tsx`
**Usado em:** `AppLayoutHeader` (NÃO usado no App.tsx)
**Funcionalidade:**
- ❌ Usa chip simples com `MapPin` e nome do território
- ❌ NÃO mostra mensagem contextual
- ❌ Usa `useFriendlyModuleUrls` (menos preciso)
- ❌ Código legado mantido por engano

```typescript
{/* Chip do território ativo */}
{urls.territoryName && (
  <Link to={urls.base}>
    <MapPin />
    <span>{urls.territoryName}</span>
  </Link>
)}
```

## Verificação no App.tsx

Todas as rotas principais usam `AppLayoutSidebar`:

```typescript
<Route element={<AppLayoutSidebar />}>
  {/* Todas as rotas territoriais */}
  <Route path="/empresas/:state/:city" element={...} />
  <Route path="/servicos/:state/:city" element={...} />
  <Route path="/classificados/:state/:city" element={...} />
  // ... etc
</Route>
```

**Conclusão:** `AppLayoutHeader` e `MainHeader` NÃO estão sendo usados!

## Por que o Usuário Viu Comportamento Diferente?

### Hipótese 1: Cache do Browser
O usuário pode ter visto uma versão antiga em cache.

### Hipótese 2: Responsividade
O `TerritorySelectorV2` tem comportamento diferente em mobile vs desktop:

```typescript
{compact ? (
  <div className="flex items-center gap-1.5">
    <div className="hidden md:flex items-center gap-1.5">
      {contextMessage && (
        <span>{contextMessage}</span>
      )}
      <span>{formattedLabel.full}</span>
    </div>
    <ChevronDown />
  </div>
) : (
  // Versão não compacta (sidebar)
)}
```

**Problema:** Em mobile, a mensagem contextual está dentro de `hidden md:flex`, então só aparece em desktop!

## Solução

### 1. Remover Código Legado
Deletar arquivos não usados:
- `src/app/components/MainHeader.tsx`
- `src/app/components/AppLayoutHeader.tsx`

### 2. Corrigir Responsividade do TerritorySelectorV2
Garantir que a mensagem contextual apareça em mobile também (ou ajustar UX para mobile).

## Arquivos para Deletar

1. `src/app/components/MainHeader.tsx` (264 linhas)
2. `src/app/components/AppLayoutHeader.tsx` (35 linhas)

Total: ~300 linhas de código legado removidas

## Benefícios

1. ✅ Elimina confusão sobre qual header usar
2. ✅ Remove código duplicado (~300 linhas)
3. ✅ Mantém apenas SSOT (AppTopbar)
4. ✅ Facilita manutenção futura
5. ✅ Reduz bundle size

## Próximos Passos

1. Deletar `MainHeader.tsx` e `AppLayoutHeader.tsx`
2. Verificar se há imports desses arquivos em outros lugares
3. Ajustar responsividade do `TerritorySelectorV2` se necessário
4. Testar em mobile e desktop

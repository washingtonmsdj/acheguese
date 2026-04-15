# ✅ Correção: Landing Page Global (Sem Território)

## Problema Identificado

A página `/classificados-landing` estava vazia porque:

1. ❌ Rota não passa `resolved` (território)
2. ❌ `useTerritoryFilter` retorna `scope: 'none'`
3. ❌ `useClassificados` tinha `enabled: filterReady`
4. ❌ Query não executava quando `filterReady === false`

**Resultado:** Página vazia, sem dados.

---

## Solução Implementada

### 1. ✅ Hook `useClassificados`

**Antes:**
```typescript
enabled: filterReady, // Só executa com território resolvido
```

**Depois:**
```typescript
enabled: true, // Sempre executa - filtro territorial é opcional
```

**Mudança no retorno:**
```typescript
// Antes:
isLocationRequired: !filterReady,

// Depois:
hasTerritory: filterReady,
```

---

### 2. ✅ Service `ClassifiedService`

**Ajuste na lógica:**
```typescript
// Aplica filtro resolvido (se scope !== 'none', aplica filtro)
if (resolvedFilter && resolvedFilter.scope !== 'none') {
  query = applyTerritoryFilter(query, resolvedFilter);
  console.log('[ClassifiedService] Filtro territorial aplicado');
} else {
  console.log('[ClassifiedService] Sem filtro territorial - buscando todos');
}
```

---


# Semântica do Modo Raio - Atualização

**Data**: 2026-04-04

---

## Fluxo Completo

### 1. Preview do Círculo
- **Ação**: Usuário clica em botão de raio (1km, 2km, 5km, etc)
- **Comportamento**: Círculo aparece no mapa instantaneamente
- **Estado**: `previewRadius` atualizado, `radiusSearchEnabled` permanece `false`
- **Requisições**: NENHUMA (apenas visual)

### 2. Aplicar Busca
- **Ação**: Usuário clica em "Aplicar busca em X km"
- **Comportamento**: Executa busca no banco de dados
- **Estado**: `radiusSearchEnabled = true`, `previewRadius = null`
- **Requisições**: RPC `search_entities_by_radius` para cada tipo de entidade

### 3. Resultados
- **Com resultados**: Marcadores aparecem no mapa, contadores atualizados
- **Sem resultados**: Mensagem "Nada encontrado" com botão "X"
- **Erro**: Mensagem "Erro na busca" com botão "X"

### 4. Fechar Mensagem
- **Ação**: Usuário clica no botão "X"
- **Comportamento**: Desativa filtro de raio, volta ao modo normal
- **Estado**: `radiusSearchEnabled = false`, `previewRadius = null`
- **Requisições**: NENHUMA (apenas limpa estado)

---

## Estados do Componente

```typescript
const [searchRadius, setSearchRadius] = useState<number>(5);        // Raio da busca ativa
const [previewRadius, setPreviewRadius] = useState<number | null>(null); // Raio em preview
const [radiusSearchEnabled, setRadiusSearchEnabled] = useState<boolean>(false); // Busca ativa?
```

---

## Handlers

```typescript
handleRadiusPreview(radiusKm)  // Atualiza preview (sem buscar)
handleRadiusChange(radiusKm)   // Aplica busca (ativa filtro)
handleDisableRadius()          // Desativa filtro (volta ao normal)
```

---

## Lógica do Círculo

```typescript
circle={
  userLocation && (previewRadius !== null || radiusSearchEnabled)
    ? {
        center: [userLocation.latitude, userLocation.longitude],
        radiusMeters: (previewRadius !== null ? previewRadius : searchRadius) * 1000,
      }
    : undefined
}
```

**Prioridade**: `previewRadius` (se houver) senão `searchRadius`

---

## UX Otimizada

- ✅ Preview instantâneo (sem requisições)
- ✅ Usuário decide quando buscar (botão "Aplicar")
- ✅ Sem travamentos (não dispara múltiplas requisições)
- ✅ Feedback visual claro (círculo + mensagens)
- ✅ Escape fácil (botão "X" fecha mensagens)

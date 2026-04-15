# Console Access: clearNeighborhoodsCache

## Descrição

A função `clearNeighborhoodsCache()` está disponível globalmente no console do navegador para limpar o cache de polígonos de bairros.

## Uso

### Limpar cache de uma cidade específica

```javascript
clearNeighborhoodsCache('city-id-123')
```

Isso remove apenas o cache da cidade especificada.

### Limpar todos os caches de bairros

```javascript
clearNeighborhoodsCache()
```

Isso remove todos os caches de bairros armazenados no localStorage.

## Quando usar

- Após adicionar novos polígonos customizados no banco de dados (`neighborhood_boundaries`)
- Quando testar mudanças em boundaries de bairros
- Para forçar re-fetch de dados do Nominatim
- Durante desenvolvimento/debugging

## Como funciona

O sistema de cache tem duas camadas:

1. **Cache em memória** (sessão atual) - mais rápido
2. **Cache persistente** (localStorage) - válido por 7 dias

A função `clearNeighborhoodsCache()` limpa ambos os caches.

## Exemplo de fluxo de teste

```javascript
// 1. Adicionar polígono customizado no banco via Supabase
// 2. Limpar cache
clearNeighborhoodsCache()

// 3. Recarregar a página ou navegar para o bairro
// O sistema vai buscar o novo polígono customizado
```

## Implementação

- Arquivo: `src/core/maps/hooks/useCityNeighborhoodsPolygons.ts`
- Exportado globalmente via `window.clearNeighborhoodsCache`
- TypeScript declarations em `useCityNeighborhoodsPolygons.d.ts`

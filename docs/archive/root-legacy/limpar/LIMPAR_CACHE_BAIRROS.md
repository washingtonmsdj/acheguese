# Como Limpar o Cache de Bairros

## No Console do Navegador (F12)

### Opção 1: Limpar cache de Salvador
```javascript
localStorage.removeItem('city-neighborhoods-cache-v1-63c41c29-adce-40f5-a552-e52d176123c3')
```

### Opção 2: Limpar todos os caches de bairros
```javascript
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('city-neighborhoods-cache-')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});
```

### Opção 3: Usar a função exportada
```javascript
clearNeighborhoodsCache()
```

## Depois de limpar

1. Recarregue a página (F5)
2. Vá para /br/ba/salvador
3. Clique no botão "Bairros"
4. Veja os logs detalhados no console mostrando quais bairros falharam

## Logs esperados

```
[useCityNeighborhoodsPolygons] Fetching 50 neighborhoods
[useCityNeighborhoodsPolygons] Processing batch 1/5 (10 neighborhoods)
...
⚠️ [useCityNeighborhoodsPolygons] No polygon found: Nome do Bairro
...
[useCityNeighborhoodsPolygons] Complete: 31 success, 19 failed, 31 polygons
▼ [useCityNeighborhoodsPolygons] Failed neighborhoods:
  - Bairro 1
  - Bairro 2
  ...
```

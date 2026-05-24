# Integracao do `useResolvedUserLocation` no Mapa Central

## Resumo

O mapa central (`/mapa`) usa `useResolvedUserLocation` para resolver a localizacao do usuario com fallback territorial quando o GPS e negado ou indisponivel.

## Estrategia de Resolucao

1. GPS, quando o usuario permite acesso a localizacao.
2. Territorio ativo, usando o centro do territorio selecionado.
3. Centro padrao configurado por ambiente quando nao ha territorio ativo.

## Indicador Visual

A UI deve informar explicitamente a origem da localizacao:

- GPS: `Usando sua localiza??o GPS`.
- Territorio: `Mostrando resultados em [territorio]`.
- Padrao: `Mostrando resultados da regi?o padr?o`.

## Comportamento

- Auto-resolve ao montar quando configurado.
- Atualiza quando o territorio muda, desde que a origem atual nao seja GPS.
- Mantem transparencia para o usuario sobre a fonte da localizacao.

## Codigo Relevante

```typescript
const {
  coords: userLocation,
  isGps,
  status: locationStatus,
  sourceMessage,
  resolve: resolveLocation,
} = useResolvedUserLocation({
  autoResolve: true,
  tryGps: true,
});
```

## Arquivos Relacionados

- `src/core/location/hooks/useResolvedUserLocation.ts`
- `src/core/location/services/UserLocationResolver.ts`
- `src/core/maps/pages/MapaPageV4.tsx`